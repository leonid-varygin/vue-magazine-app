export default () => {
	return {
		namespaced: true,
		state: {
			messages: [],
			ai: 0
		},
		getters: {
			all: state => state.messages,
		},
		mutations: {
			add(state, { text }){
				state.messages.push({ id: ++state.ai, text });
			},
			remove(state, id){
				state.messages = state.messages.filter(msg => msg.id !== id);
			}
		},
		actions: {
			add({ state, commit }, { text, timeout }){
				commit('add', { text });
				let id = state.ai;

				if(timeout !== undefined){
					setTimeout(() => {
						commit('remove', id);
					}, timeout);
				}
			}
		}
	}
}