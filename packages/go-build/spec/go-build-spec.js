'use babel';

import GoBuild from '../lib/go-build';
import * as path from 'path';
import {lifecycle} from './spec-helpers'

// Use the command `window:run-package-specs` (cmd-alt-ctrl-p) to run specs.
//
// To run a specific `it` or `describe` block add an `f` to the front (e.g. `fit`
// or `fdescribe`). Remove the `f` to unfocus the block.

describe('GoBuild', () => {
  let workspaceElement, activationPromise;

  console.log('Starting go-build-spec test')
  const testgo = path.join(__dirname, 'test.go');
  beforeEach(() => {
    workspaceElement = atom.views.getView(atom.workspace);

    waitsForPromise(() =>
      atom.workspace.open(testgo).then(() =>
        console.log(testgo + ' opened'))
    );

    runs(() => {
      lifecycle.setup()
    })

    waitsForPromise(() => {
      return lifecycle.activatePackage()
    })

    runs(() => {
      const { mainModule } = lifecycle
      mainModule.getPanelManager()
    })

    waitsFor(() => {
      pm = lifecycle.mainModule.panelManager
      return pm
    })

    activationPromiseGoBuild = atom.packages.activatePackage('go-build');
  });

  afterEach(() => {
    lifecycle.teardown()
  })

  describe('when the go-build:toggle event is triggered', () => {
    it('hides and shows the Go Build panel', () => {
      // Before the activation event the view is not on the DOM, and no panel has been created
      expect(workspaceElement.querySelector('.go-build-panel')).not.toExist();

      // This is an activation event, triggering it will cause the package to be activated.
      atom.commands.dispatch(workspaceElement, 'go-build:toggle');

      waitsForPromise(() => {
        return activationPromiseGoBuild;
      });

      runs(() => {
        expect(workspaceElement.querySelector('.go-build-panel')).toExist();

        let goBuildElement = workspaceElement.querySelector('.go-build-panel');
        expect(goBuildElement).toExist();
      });
    });

    it('hides and shows the view', () => {
      // This test shows you an integration test testing at the view level.

      // Attaching the workspaceElement to the DOM is required to allow the
      // `toBeVisible()` matchers to work. Anything testing visibility or focus
      // requires that the workspaceElement is on the DOM. Tests that attach the
      // workspaceElement to the DOM are generally slower than those off DOM.
      jasmine.attachToDOM(workspaceElement);

      expect(workspaceElement.querySelector('.go-build-panel')).not.toExist();

      waitsForPromise(() => {
        return activationPromiseGoBuild;
      });

      // This is an activation event, triggering it causes the package to be
      // activated.
      atom.commands.dispatch(workspaceElement, 'go-build:toggle');

      expect(atom.packages.isPackageActive('go-build')).toBe(true)

      runs(() => {
        // Now we can test for view visibility
        let goBuildElement = workspaceElement.querySelector('.go-build-panel');
        expect(goBuildElement).toBeVisible();
        atom.commands.dispatch(workspaceElement, 'go-build:toggle');
        //expect(goBuildElement).not.toBeVisible();
      });
    });
  });
});
