import Vue from 'vue';
import Vuex from 'vuex';
Vue.use(Vuex);

export const store = new Vuex.Store({
  state: {
    hotelsInfo: {},
  },
  getters: {
    hotelsInfo(state) {
      return state.hotelsInfo;
    }
  },
  mutations: {
    saveInfo(state, hotelsInfo) {
      state.hotelsInfo = hotelsInfo;
    }
  }
})