'use babel';

import GoBuildView from './go-build-view';
import { CompositeDisposable, Disposable } from 'atom';
import OutputPanelManager from './output-panel-manager';

let isStarted;
let store, builder, connection, outputPanelManager, initialState, dependenciesInstalled;
let goconfig, goget;

export default {

  subscriptions: null,

  activate(state) {
    console.debug('go-build::activate');
    isStarted = false;

    this.subscriptions = new CompositeDisposable(
      // Add an opener for our view.
      atom.workspace.addOpener(uri => {
        if (uri === 'atom://go-build') {
          var store = this.getStore();
          return new GoBuildView({store: store});
        }
      }),

      // Register command that toggles this view
      atom.commands.add('atom-workspace', {
        'go-build:toggle': () => this.toggle()
      }),

      // Destroy any GoBuildViews when the package is deactivated.
      new Disposable(() => {
        atom.workspace.getPaneItems().forEach(item => {
          if (item instanceof GoBuildView) {
            item.destroy();
          }
        });
      })
    );
    initialState = state;

    require('atom-package-deps').install('go-build').then(() => {
      dependenciesInstalled = true;
      this.start();
      return true;
    }).catch((e) => {
      console.warn('go-build', e);
    });

  },

  consumeGoConfig (service) {
    goconfig = service;
    goconfig.locator.runtime().then(rt => {
      this.getStore().dispatch({ type: 'SET_GOCONFIG', goconfig: rt });
    });
  },

  consumeGoGet (service) {
    goget = service;
    this.getStore().dispatch({ type: 'SET_GOGET', goget: goget });
  },

  getStore () {
    if (!store) {
      const Store = require('./store');
      store = Store(initialState);
    }
    return store;
  },

  getBuilder() {
    if (!connection) {
      const { spawn } = require('child_process');
      const BuildConnection = require('./build-connection');
      connection = new BuildConnection(
        (args, options) => {
          let promise = Promise.resolve();
          return promise.then(() => {
            return spawn("go", args, options);
          });
        },
        (message) => {
          store.dispatch({
            type: 'ADD_OUTPUT_CONTENT',
            content: { type: 'message', message }
          });
        },
        goconfig
      );
    }
    if(!builder) {
      const Builder = require('./builder');
      builder = new Builder(store, connection);
    }
  },

  deactivate() {
    this.subscriptions.dispose();
    this.subscriptions = null;
    goconfig = null;
    goget = null;
    isStarted = false;
  },

  getOutputPanelManager () {
    if (!outputPanelManager) {
      outputPanelManager = new OutputPanelManager();
    }
    return outputPanelManager;
  },

  provideGoPlusView () {
    return {
      view: require('./output-panel'),
      model: this.getOutputPanelManager()
    };
  },

  start() {
    if (isStarted) {
      return;
    }
    isStarted = true;
    this.getStore();
    this.getBuilder();
    this.getOutputPanelManager().setStore(store);

    const Commands = require('./commands');
    const commands = new Commands(store, builder);

    this.subscriptions.add(
      builder,
      commands,
      connection
    );
  },

  toggle() {
    atom.workspace.toggle('atom://go-build');
  },

  deserializeGoBuildView(serialized) {
    var store = this.getStore();
    store.dispatch( {type: 'SET_BUILD_ARG', arg: serialized.data ? serialized.data : {} });
    return new GoBuildView({store: store});
  }

};
