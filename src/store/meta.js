export default () => ({
	namespaced: true,
	state: {
		title: '',
		is404: false,
		// metatags
	},
	getters: {
		title: state => state.title,
		is404: state => state.is404,
	},
	mutations: {
		setTitle: (state, title) => state.title = title,
		setIs404: (state, is404) => state.is404 = is404
	},
	actions: {
		setTitle({ state, commit }, title){
			commit('setTitle', title);

			if(process.isClient){
				document.title = state.title;
			}
		},
		setIs404({ commit }, is404){
			commit('setIs404', is404);
		}
	}
});