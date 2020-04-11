'use babel';

const REGEX_TO_INDEX = /\[["']?(\w+)["']?]/g;
const REGEX_LEADING_DOT = /^\./;

export function getDeep (o, path) {
  path = path
    // convert indexes to properties (like a["b"]['c'][0])
    .replace(REGEX_TO_INDEX, '.$1')
    // strip a leading dot (as it might occur because of the previous replace)
    .replace(REGEX_LEADING_DOT, '')
    .split('.');

  var obj = o;
  while (obj && path.length) {
    var n = path.shift();
    obj = obj[n];
  }
  return obj;
}

export function eachElementInHierarchy (element, fn) {
  while (element && !fn(element)) {
    element = element.parentElement;
  }
  return element;
}

/**
 * Checks if at least the all keys in new props strict equal exist in the old props
 * @param  {Object} [oldProps={}] The old props
 * @param  {Object} [newProps={}] The new props
 * @return {bool}
 */
export function shallowEqual (oldProps = {}, newProps = {}) {
  const newKeys = Object.keys(newProps).sort();
  const oldKeys = Object.keys(oldProps).sort();

  // check if all keys are in the old props
  if (!newKeys.every((key) => oldKeys.includes(key))) {
    return false;
  }

  return newKeys.every((key) => newProps[key] === oldProps[key]);
}

let style;
export function editorStyle () {
  if (!style) {
    style = {
      'font-family': atom.config.get('editor.fontFamily'),
      'font-size': atom.config.get('editor.fontSize') + 'px',
      'line-height': atom.config.get('editor.lineHeight')
    };
  }
  return style;
}

export function getEditor () {
  return atom.workspace.getActiveTextEditor() || atom.workspace.getCenter().getActiveTextEditor();
}

export function isValidEditor (e) {
  if (!e || !e.getGrammar) {
    return false;
  }
  const grammar = e.getGrammar();
  if (!grammar) {
    return false;
  }
  return grammar.scopeName === 'source.go';
}

export function saveAllEditors () {
  const promises = [];
  for (const editor of atom.workspace.getTextEditors()) {
    if (editor.isModified() && isValidEditor(editor)) {
      promises.push(editor.save());
    }
  }
  return Promise.all(promises);
}
