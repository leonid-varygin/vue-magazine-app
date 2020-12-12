import createApp from '@/app.js';

export default context => new Promise((resolve, reject) => {
	createApp(context).then(({ app, store, router }) => {
		context.rendered = () => {
			context.title = store.getters['meta/title'];
			context.is404 =  store.getters['meta/is404'];
			context.state = store.state;
		}

		let matched = router.getMatchedComponents();

		if(matched.length === 0){
			reject({ code: 404 });
		}
		else{
			let { params } = router.currentRoute;
			Promise.all(
				matched.filter(cmp => cmp.ssrData).map(cmp => cmp.ssrData({ store, params }))
			)
			.then(() => resolve(app));
		}
	}).catch(reject);
});