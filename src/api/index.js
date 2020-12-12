import createAuthApi from './auth';
import createCartApi from './cart';
import createProductsApi from './products';

export default http => ({
	auth: createAuthApi(http),
	cart: createCartApi(http),
	products: createProductsApi(http)
})

export const VueApi = {
	install(Vue){
		Vue.mixin({
			beforeCreate(){
				let options = this.$options;

				if(options.api){
					this.$api = options.api;
				}
				else if(options.parent && options.parent.$api){
					this.$api = options.parent.$api;
				}
			}
		})
	}
}