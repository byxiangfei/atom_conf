'use babel';
/** @jsx etch.dom */

import etch from 'etch';
import EtchComponent from './etch-component';
import { CompositeDisposable } from 'atom';
import { subscribe } from './store-utils';
import GoLangEnv from './golang-env';

export default class EnvironmentPanel extends EtchComponent {
  constructor (props, children) {
    super(props, children);
    this.subscriptions = new CompositeDisposable();
    this.subscriptions.add(
      subscribe(props.store, 'build.build_env', this.handleBuildEnvChange.bind(this))
    );
    this.golangEnv = new GoLangEnv();

  }

  handleBuildEnvChange(state, oldState) {
    if (state !== null) {
      //this.props.store.dispatch({type: 'SET_BUILD_ENV', arg: state});
      this.update(state, this.children);
    }
  }

  handleInputChange(e) {
      const env_var = e.target.id.substr(7);
      this.props.store.dispatch({type: 'SET_BUILD_ENV', arg: {[env_var]: e.target.value}});
  }

  render() {
    console.debug('EnvironmentPanel::render');
    let env_content = null;
    const env = this.props.store.getState().build.build_env;
    if (env) {
        env_content = (
          <div id='go-build-environment'>
            { Object.keys(env).map((k) => {
                if (!['path', 'version', 'name', 'semver'].includes(k)) {
                  if (['GOOS', 'GOARCH'].includes(k)) {
                    let values = this.golangEnv.getValuesForVariable(k);
                    return <div className='go-build-label-text-input-wrap'><label className='go-build-label' >{k}:
                        <select id={'env_id_' + k} className='go-build-input-text input-text native-key-bindings' type='text' value={env[k]}
                          onchange={this.handleInputChange} >
                          {values.map((v, i) => {return <option value={v}>{v}</option>;})}
                        </select>
                      </label></div>;
                  } else {
                    return <div className='go-build-label-text-input-wrap'><label className='go-build-label' >{k}:
                        <input id={'env_id_' + k} className='go-build-input-text input-text native-key-bindings' type='text' value={env[k]}
                          onchange={this.handleInputChange} />
                      </label></div>;
                  }
                } else {
                  return null;
                }
              }
            )}
          </div>);
    }
    return <details><summary title='Set environment variables for build' ><strong>Environment</strong></summary>{env_content}</details>;
  }

  // Tear down any state and detach
  destroy() {
    console.debug('Destroying EnvironmentPanel');
    this.subscriptions.dispose();
    this.subscriptions = null;
  }
}

EnvironmentPanel.bindFns = ['handleInputChange'];
