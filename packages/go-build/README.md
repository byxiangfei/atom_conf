# [go-build] (https://atom.io/packages/go-build)

A go build package for atom.  
Provides a UI for setting all the main and advanced go build flags.  
Allows setting the Go env variables which will be used for building the target, thus allowing cross-compilation and the ability to switch C compilers etc.

![Demo](https://raw.githubusercontent.com/mervynrussell/go-build/master/resources/demo.gif)

## Install

Either `apm install go-build` or search for `go-build` in the settings.

Note this package is intended to be used in conjunction with go-plus.  It uses services provided by go-plus and displays build output in the main go-plus panel.

## Commands
* `Go Build: Stop` halt current build
* `Go Build: Start` start build using current settings (focus will move to go-plus panel)
* `Go Build: Clean` clean build artefacts from previous build
* `Go Build: Toggle` toggle the build panel


## Key bindings
* `Ctrl+Alt+O` toggle the build panel

## Acknowledgements
Big thanks to the folks who created the go-plus and go-debug packages.  This is my first attempt at an Atom package and it wouldn't have been possible without
perusing and using parts of their code.
