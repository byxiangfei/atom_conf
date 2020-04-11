'use babel'

import {CompositeDisposable} from 'atom'

export default {
  dependenciesInstalled: null,
  goget: null,
  goconfig: null,
  formatter: null,
  subscriptions: null,
  toolCheckComplete: null,

  activate () {
    this.subscriptions = new CompositeDisposable()
    require('atom-package-deps').install('gotests').then(() => {
      this.dependenciesInstalled = true
      return this.dependenciesInstalled
    }).catch((e) => {
      console.log(e)
    })
    this.subscriptions.add(atom.commands.add('atom-workspace', 'gotests:generate', () => this.generate()))
  },

  deactivate () {
    if (this.subscriptions) {
      this.subscriptions.dispose()
    }
    this.subscriptions = null
    this.goget = null
    this.goconfig = null
    this.dependenciesInstalled = null
    this.toolCheckComplete = null
  },

  consumeGoconfig (service) {
    this.goconfig = service
    this.checkForTool()
  },

  consumeGoget (service) {
    this.goget = service
    this.checkForTool()
  },

  checkForTool () {
    if (!this.toolCheckComplete && this.goconfig && this.goget) {
      let config = this.goconfig
      let options = {env: config.environment()}
      config.locator.findTool('gotests', options).then((cmd) => {
        this.toolCheckComplete = true
        if (!cmd) {
          let goget = this.goget
          goget.get({
            name: 'gotests',
            packageName: 'gotests',
            packagePath: 'github.com/cweill/gotests/...',
            type: 'missing'
          }).then(() => {
            return true
          }).catch((e) => {
            console.log(e)
          })
        }
      })
    }
  },

  getLocatorOptions (editor) {
    let options = {}
    let p = atom.project.getPaths()
    if (p) {
      options.directory = p
    }

    return options
  },

  getExecutorOptions (editor) {
    let o = this.getLocatorOptions(editor)
    let options = {}
    let config = this.goconfig
    if (config) {
      options.env = config.environment(o)
    }
    if (!options.env) {
      options.env = process.env
    }
    return options
  },

  hasSelection (editor) {
    let range = editor.getSelectedBufferRange()
    if (range.start.row !== range.end.row || range.start.column !== range.end.column) {
      return true
    }
    return false
  },

  getFunctions (editor) {
    let functions = []
    if (!this.hasSelection(editor)) {
      return functions
    }
    let range = editor.getSelectedBufferRange()

    for (let row = range.start.row; row <= range.end.row; row++) {
      let line = editor.lineTextForBufferRow(row)
      // this regexp matches go function defenition
      let match = line.match(/func(?:\s*\([^)]+\)\s*|\s+)([^)\s]+)\s*\(/)
      if (match !== undefined && match !== null && match.length > 1) {
        functions.push(match[1])
      }
    }
    return functions
  },

  generate () {
    let editor = atom.workspace.getActiveTextEditor()
    if (!editor) {
      atom.notifications.addWarning(
        "Running 'gotests' on whole project is not supported, please open a file."
      )
      return Promise.resolve()
    }
    let filePath = editor.getPath()
    let config = this.goconfig

    if (!filePath.endsWith('.go')) {
      atom.notifications.addWarning('Cannot generate tests, please open .go file.')
      return Promise.resolve()
    }

    // we cannot generate go test for go test
    if (filePath.endsWith('_test.go')) {
      atom.notifications.addWarning('Cannot generate tests for _test.go file.')
      return Promise.resolve()
    }

    if (this.toolCheckComplete != null) {
      return Promise.resolve().then(() => {
        let locatorOptions = this.getLocatorOptions(editor)
        return config.locator.findTool('gotests', locatorOptions).then((cmd) => {
          if (!cmd) {
            return false
          }

          let selected = this.hasSelection(editor)
          let functions = this.getFunctions(editor)

          if (selected && functions.length === 0) {
            atom.notifications.addWarning(
              'No functions found in selected range. ' +
              'Please select code with functions definition to generate tests for, or remove selection.'
            )
            return Promise.resolve()
          }

          let args = ['-w']
          if (functions.length !== 0) {
            args.push('-only=(?i)^(' + functions.join('|') + ')$')
          } else {
            args.push('-all')
          }
          args.push(filePath)
          let executorOptions = this.getExecutorOptions(editor)
          return config.executor.exec(cmd, args, executorOptions).then((r) => {
            if (r.exitcode !== 0) {
              atom.notifications.addError('gotests: ' + r.stdout + ' ' + r.stderr)
            } else {
              atom.notifications.addSuccess('gotests: ' + r.stdout)
            }
          })
        }).catch((e) => {
          if (e.handle) {
            e.handle()
          }
          console.log(e)
          return Promise.resolve()
        })
      })
    }
  }
}
