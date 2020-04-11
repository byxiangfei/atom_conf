'use babel';

import { createStore, combineReducers } from 'redux';

function state (state = 'notStarted', action) {
  switch (action.type) {
    case 'STOP':
      return 'notStarted';
    case 'RESTART':
      return 'waiting';
    case 'SET_STATE':
      return action.state;
  }
  return state;
}

function goget(state = null, action) {
  switch (action.type) {
    case 'SET_GOGET':
      return  action.goget;
    case 'UNSET_GOGET':
      return null;
  }
  return state;
}

function goconfig(state = null, action) {
  switch (action.type) {
    case 'SET_GOCONFIG':
      return action.goconfig;
    case 'UNSET_GOCONFIG':
      return null;
  }
  return state;
}

function build_env(state=null, action) {
  switch (action.type) {
    case 'SET_BUILD_ENV':
      return Object.assign({}, state, action.arg);
    case 'UNSET_BUILD_ENV':
      let tmp = Object.assign({}, state);
      delete(tmp[action.arg]);
      return tmp;
  }
  return state;
}

function build_args(state = {}, action) {
  switch (action.type) {
    case 'SET_BUILD_ARG':
      return Object.assign({}, state, action.arg);
    case 'UNSET_BUILD_ARG':
      let tmp = Object.assign({}, state);
      delete(tmp[action.arg]);
      return tmp;
    case 'CLEAR_BUILD_ARGS':
      return {};
  }
  return state;
}

function content (state = [], action) {
  switch (action.type) {
    case 'CLEAR_OUTPUT_CONTENT':
      return [];
    case 'ADD_OUTPUT_CONTENT':
      return state.concat(action.content);
  }
  return state;
}

const services = combineReducers({
  goget,
  goconfig
});

const output = combineReducers({
  content
});

const build = combineReducers({
  state,
  build_args,
  build_env
});

export default function (state) {

  const store = createStore(combineReducers({
    build,
    output,
    services
  }), state);

  // init the store (upgrades the previous state so it is usable again)
  store.dispatch({ type: 'INIT_STORE' });
  return store;
}
