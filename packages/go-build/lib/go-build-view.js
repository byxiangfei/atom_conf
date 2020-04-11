'use babel';
/** @jsx etch.dom */

import etch from 'etch';
import { CompositeDisposable } from 'atom';
import { subscribe } from './store-utils';
import EtchComponent from './etch-component';
import SettingsPanel from './settings-panel';

export default class GoBuildView extends EtchComponent {

  constructor(props, children) {
    super(props, children);
    this.subscriptions = new CompositeDisposable();
    this.subscriptions.add(
      subscribe(props.store, 'services.goconfig', this.handleGoConfigChange.bind(this))
    );
  }

  handleGoConfigChange(state, oldState) {
    if (state !== null) {
      if (!this.props.store.getState().build.build_env) {
        this.props.store.dispatch({type: 'SET_BUILD_ENV', arg: state});
      }
    }
  }

  render() {
    console.debug("Render GoBuildView");
    return <div className='go-build-panel' >
      <div id='go-build-panel-button-bar' className='go-build-panel-button-bar'>
        <button className='btn btn-primary icon icon-zap' onclick={this.handleBuildCick} title='Run go build' >Build</button>
        <button className='btn btn-error icon icon-trashcan' onclick={this.handleCleanCick} title='Run go clean' >Clean</button>
        <br/>
        <button className='btn btn-primary icon icon-flame' onclick={this.handleResetCick} title='Revert to default settings' >Reset</button>
      </div>
      <SettingsPanel store={this.props.store} />
    </div>;
  }

  handleBuildCick(e) {
    this.props.store.dispatch({ type: 'CLEAR_OUTPUT_CONTENT' });
    atom.commands.dispatch(e.target, 'go-build:' + 'start');
  }

  handleCleanCick(e) {
    this.props.store.dispatch({ type: 'CLEAR_OUTPUT_CONTENT' });
    atom.commands.dispatch(e.target, 'go-build:' + 'clean');
  }

  handleResetCick(e) {
    this.props.store.dispatch({ type: 'CLEAR_BUILD_ARGS' });
    this.props.store.dispatch({ type: 'SET_BUILD_ENV', arg: this.props.store.getState().services.goconfig});
  }

  getTitle() {
    // Used by Atom for tab text
    return 'Go Build';
  }

  getURI() {
    // Used by Atom to identify the view when toggling.
    return 'atom://go-build';
  }

  getDefaultLocation() {
    // This location will be used if the user hasn't overridden it by dragging the item elsewhere.
    // Valid values are "left", "right", "bottom", and "center" (the default).
    return 'bottom';
  }

  getAllowedLocations() {
    // The locations into which the item can be moved.
    return ['left', 'right', 'bottom'];
  }

  // Returns an object that can be retrieved when package is activated
  serialize() {
    return {deserializer: 'go-build/GoBuildView', data: this.props.store.getState().build.build_args};
  }

  // Tear down any state and detach
  destroy() {
    console.debug('Destroying GoBuildView');
  }

}

GoBuildView.bindFns = [ 'handleBuildCick', 'handleCleanCick', 'handleResetCick' ];
