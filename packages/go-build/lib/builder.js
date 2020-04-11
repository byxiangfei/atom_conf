'use babel';

export default class Builder {
  constructor (store, connection) {
    this._connection = connection;
    this._store = store;
    this._stopPromise = null;
  }

  dispose () {
    this.stop();
  }

  /**
   * Starts a new build.
   * @param  {object} config Config used for the build.
   * @param  {string} file   The file to build
   * @return {Promise}
   */
  start (command, config, file) {
    if (this.isStarted()) {
      return Promise.resolve();
    }
    this._store.dispatch({ type: 'SET_STATE', state: 'starting' });
    this._store.dispatch({ type: 'CLEAR_OUTPUT_CONTENT' });

    // start the go command
    this._addOutputMessage('Starting ' + command + '...\n');

    return this._connection.start({ command, config, file })
      .then((session) => {
        this._store.dispatch({ type: 'SET_STATE', state: 'waiting' });
        this._session = session;
        return Promise.resolve();
      })
      .catch((err) => {
        this._addOutputMessage('Failed to start go ' + command + '\n' + err);
        return this.stop();
      });

  }

  /**
   * Stops a build.
   * @return {Promise}
   */
  stop () {
    if (!this.isStarted()) {
      return Promise.resolve();
    }
    // go build is running, kill it
    this._addOutputMessage('Stopping build command...\n');
    this._store.dispatch({ type: 'STOP' });
    return this._connection.stop();
  }

  /**
   * Returns `true` if the build is started, `false` otherwise.
   * @return {boolean}
   */
  isStarted () {
    const state = this.getState();
    return state !== 'notStarted' && state !== 'starting';
  }

  isBusy () {
    const state = this.getState();
    return state === 'busy' || state === 'running';
  }

  getState () {
    return this._store.getState().build.state;
  }

  _addOutputMessage (message) {
    this._store.dispatch({ type: 'ADD_OUTPUT_CONTENT', content: { type: 'message', message } });
  }
}
