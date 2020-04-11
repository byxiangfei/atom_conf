'use babel';

import Ansi from 'ansi-to-html';
import { subscribe } from './store-utils';
import { CompositeDisposable } from 'atom';

export default class OutputPanelManager {
  constructor () {
    this.key = 'go-build'
    this.tab = {
      name: 'Build',
      packageName: 'go-build',
      icon: 'zap'
    }
    this.subscriptions = new CompositeDisposable()

    this.props = {
      content: [{ type: 'text', value: 'Not started ...' }],
    }

    this.ansi = null

    this.handleClickClean = this.handleClickClean.bind(this)
    this.handleClickStop = this.handleClickStop.bind(this)
  }

  dispose () {
    if (this.subscriptions) {
      this.subscriptions.dispose()
    }
    this.subscriptions = null
    this.ansi = null
  }

  ready () {
    return !!this._store && !!this._builder
  }

  setStore (store) {
    this._store = store

    this.subscriptions.add(
      subscribe(store, 'build.state', this.handleBuildStateChange.bind(this)),
      subscribe(store, 'output.content', this.handleOutputContentChange.bind(this))
    )
  }

  setBuilder(builder) {
    this._builder = builder
  }

  update (props) {
    this.props = Object.assign({}, this.props, props)

    if (this.view) {
      this.view.update()
    }

    if (this.requestFocus && this.props.content.length > 0) {
      this.requestFocus()
    }
  }

  handleBuildStateChange (state, oldState) {
    if (state === 'notStarted') {
      this.ansi = null
    }
  }

  handleOutputContentChange (content, oldContent) {
    const index = content.indexOf(this._lastContent)
    if (index > -1 && index === (content.length - 1)) {
      // nothing has changed
      return
    }
    this._lastContent = content[content.length - 1]

    if (!this.ansi) {
      this.ansi = new Ansi({ stream: true, escapeXML: true })
    }

    let newContent = content.slice(index + 1).map(({ type, ...rest }) => {
      if (type === 'message') {
        return { type, message: this.ansi.toHtml(rest.message) }
      }
      return { type, ...rest }
    })

    if (index === -1) {
      // the last content does not exist anymore, so replace the whole content
    } else {
      // append the new content
      newContent = this.props.content.concat(newContent)
    }

    this.update({
      content: newContent
    })
  }

  handleClickClean (ev) {
    ev.preventDefault()
    this._store.dispatch({ type: 'CLEAR_OUTPUT_CONTENT' })
  }

  handleClickStop (ev) {
    ev.preventDefault()
    atom.commands.dispatch(ev.target, 'go-build:' + 'stop');
  }
}
