'use babel';

import { CompositeDisposable } from 'atom';
import { getEditor } from './utils';

function currentFile () {
  const editor = getEditor();
  return editor && editor.getPath();
}

const commands = {
  'start': (store, builder) => {
    builder.start('build', store, currentFile());
  },
  'stop': (store, builder) => builder.stop(),
  'clean': (store, builder) => {
    builder.start('clean', store, currentFile());
  }
};


export default class Commands {
  constructor (store, builder) {
    this._store = store;
    this._builder = builder;

    this._keyboardCommands = {};
    Object.keys(commands).forEach((cmd) => this._keyboardCommands['go-build:' + cmd] = this.execute.bind(this, cmd) );
    this._subscriptions = new CompositeDisposable();
    this._subscriptions.add(
      atom.config.observe('go-build.limitCommandsToGo', this.observeCommandsLimit.bind(this))
    );
  }

  execute (n) {
    if (this.onExecute) {
      this.onExecute(n);
    }
    commands[n](this._store, this._builder);
  }

  observeCommandsLimit (limitCommandsToGo) {
    if (this._keyboardSubscription) {
      this._subscriptions.remove(this._keyboardSubscription);
      this._keyboardSubscription.dispose();
    }

    let selector = 'atom-workspace';
    if (limitCommandsToGo === true) {
      selector = 'atom-text-editor[data-grammar~=\'go\']';
    }

    this._keyboardSubscription = atom.commands.add(selector + ', .go-build-panel, .go-build-output', this._keyboardCommands);
    this._subscriptions.add(this._keyboardSubscription);
  }

  dispose () {
    this._subscriptions.dispose();
    this._subscriptions = null;
  }
}
