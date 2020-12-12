const isServer = process.argv.includes('--server');

let platformChainWebpack = isServer ?
	config => {
		config.plugins.delete('html');
		config.plugins.delete('preload');
		config.plugins.delete('prefetch');
	} : 
	config => {
		config.plugins.delete('preload'); // tmp maybe
		config.plugins.delete('prefetch'); // tmp maybe

		config.plugin('html').tap(options => {
			let native = options[0].templateParameters;

			options[0].templateParameters = function(compilation, assets, pluginOptions){
				let res = native(compilation, assets, pluginOptions);

				compilation.hooks.htmlWebpackPluginAlterAssetTags.tap('inject-styles-in-body', function(pluginArgs) {
					const { head, body } = pluginArgs;

               head.filter(
						 asset => asset.tagName === 'link' && 
						 asset.attributes && 
						 asset.attributes.rel === 'stylesheet' &&
						 asset.attributes.href.indexOf('chunk-critical') === -1
					).forEach(asset => {
						//head.splice(head.indexOf(asset), 1);
						//body.push(asset);
						asset.attributes.rel = "preload";
						asset.attributes.as = "style";
						asset.attributes['data-onload'] = true;
					});

					body.sort((a, b) => {
						if(a.tagName === 'link' && b.tagName === 'script'){
							return -1;
						}
						else if(a.tagName === 'script' && b.tagName === 'link'){
							return 1;
						}

						return 0;
					});
				});

				return res;
			}

			options[0].minify = false;
			return options;
		});
	};

let configureWebpack = isServer ?
	{
		target: 'node',
		entry: { app: './src/entry-server.js' },
		output: { filename: 'js/server-bundle.js', libraryExport: 'default', libraryTarget: 'commonjs2' },
		optimization: { splitChunks: false }
	} :
	{
		entry: { app: './src/entry-client.js' },
		optimization: { 
			splitChunks: {
				cacheGroups: {
					critical: {
						name: 'chunk-critical',
						test: /critical.css$/,
						priority: 0,
						chunks: 'all',
						enforce: true
					}
				}
			} 
		}
	};

let vueConf = {
	filenameHashing: false,
	productionSourceMap: false,
	configureWebpack,
	chainWebpack: config => {
		config.plugin('define').tap(options => {
			options[0]['process.isClient'] = !isServer;
			options[0]['process.isServer'] = isServer;
			return options;
		});

		platformChainWebpack(config);
	}
}

if(isServer){
	vueConf.css= {
		extract: {
			filename: 'css/full-bundle.css'
		}
	}
}

module.exports = vueConf;