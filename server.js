const path = require('path');
const fs = require('fs');
const express = require('express');
const server = express();
const criticalCss = fs.readFileSync('./dist/css/chunk-critical.css', 'utf-8');
const template = fs.readFileSync('./dist/index.html', 'utf-8');
const renderer = require('vue-server-renderer').createRenderer({
	template: template.replace('<div id="app"></div>', '<!--vue-ssr-outlet-->')
});
const serverBundle = require('./dist/js/server-bundle.js');
const LRU = require("lru-cache");
const pagesCache = new LRU({ max: 30, maxAge: 30 * 1000 }); // 1 * 1000 * 60
const withoutSSR = [/^\/cart\/?$/, /^\/order\/?$/, /^\/login\/?$/, /^\/office/];

server.use('/css', express.static(path.resolve(__dirname, './dist/css')));
server.use('/js', express.static(path.resolve(__dirname, './dist/js')));
server.use('/img', express.static(path.resolve(__dirname, './dist/img')));
server.use('/favicon.ico', express.static(path.resolve(__dirname, './dist/favicon.ico')));

server.get('*', (req, res) => {
	if(withoutSSR.some(pattern => pattern.test(req.url))){
		let html = replaceStyles(template);
		html = html.replace('{{ title }}', 'Loading...');
		res.end(html);
		return;
	}

	if(pagesCache.has(req.url)){
		console.log(req.url + ' - get from cache');
		res.end(pagesCache.get(req.url));
		return;
	}

	let context = { url: req.url, title: 'Not found' };

	serverBundle(context).then(app => {
		renderer.renderToString(app, context, (err, html) => {	
			if(err){
				throw { code: 500 };
			}
			
			if(context.is404){
				res.status(404);
			}
			
			html = replaceStyles(html);
			res.end(html);

			if(!context.is404){
				pagesCache.set(req.url, html);
				console.log(req.url + ' - generated now');
			}
		});
	}).catch(e => {
		if(!e.code){
			e = { code: 500 }; // some unhanled critical error
		}

		if(e.code === 404){
			let html = replaceStyles(template);
			html = html.replace('{{ title }}', 'Page not found');
			res.status(404).end(html);
		}
		// else if(301) - res.set('Location: url)
		else{
			res.status(500).end('<h1>Some crititcal error on server, try later!</h1>');
		}
	});
});

function replaceStyles(html){
	return html
	.replace('<link href="/css/chunk-critical.css" rel="stylesheet">', `<style>${criticalCss}</style>`)
	.replace(/data-onload/g, `onload="this.onload=null;this.rel='stylesheet'"`);
}

server.listen(3000);
console.log('server run...')