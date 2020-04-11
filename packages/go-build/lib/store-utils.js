'use babel';

import { getDeep } from './utils';

export function serialize (store) {
  const state = store.getState();
  return {
    selectedConfig: state.selectedConfig
  };
}

export function subscribe (store, path, callback) {
  const t = typeof path;
  if (t !== 'string' && t !== 'function') {
    throw new Error('unknown value for "path"');
  }

  let currentValue;

  const check = (state) => {
    if (!path) {
      callback(state);
      return state;
    }
    let newValue;
    if (t === 'string') {
      newValue = getDeep(state, path);
    } else if (t === 'function') {
      newValue = path(state);
    }
    if (newValue !== currentValue) {
      callback(newValue, currentValue);
    }
    return newValue;
  };
  const update = () => {
    const state = store.getState();
    currentValue = check(state);
  };

  update();

  return { dispose: store.subscribe(update) };
}
