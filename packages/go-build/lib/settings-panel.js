'use babel';
/** @jsx etch.dom */

import etch from 'etch';
import EtchComponent from './etch-component';
import { CompositeDisposable } from 'atom';
import { subscribe } from './store-utils';
import EnvironmentPanel from './environment-panel';

export default class SettingsPanel extends EtchComponent {
  constructor (props, children) {
    props.msan_enabled = true;
    super(props, children);
    this.subscriptions = new CompositeDisposable();
    this.subscriptions.add(
      subscribe(props.store, 'build.build_env', this.handleBuildEnvChange.bind(this)),
      subscribe(props.store, 'build.build_args', this.handleBuildArgsChange.bind(this))
    );
  }

  /**
   * Update UI elements which are dependant on particular build environment vars.
   * E.g. memory sanitizer is only compatible with clang compiler.
   */
  handleBuildEnvChange(state, oldState) {
    if (state !== null) {
      this.update({msan_enabled: state.CC === 'clang'}, this.children);
    }
  }

  handleBuildArgsChange(state, oldState) {
    if (state) {
      // Handle update to the command line text box
      var cmdLine = Object.values(state).join(' ');
      var el = document.getElementById('go_build_command_line');
      if (el) {
          el.value = cmdLine;
      }
      if (Object.keys(state).length === 0) {
        this.resetControls();
      }
    }
  }

  resetControls() {
    var el = document.getElementById('go-build-args');
    if (el) {
      // Get all input elements in the settings panel from the DOM and make sure they are unset
      // This is required for handling the CLEAR_BUILD_ARGS from the reset button
      var inputs = el.querySelectorAll('input');
      for (let input of inputs) {
        switch(input.type) {
          case 'checkbox':
            input.checked = false;
            break;
          case 'number':
            input.value = input.defaultValue;
            break;
          case 'text':
            input.value = '';
            break;
        }
      }
      var buildModeSelect = document.getElementById('build_mode');
      buildModeSelect.value = 'default';
      var compilerSelect = document.getElementById('compiler_flag');
      compilerSelect.value = 'gc';
    }
  }

  getNumberCPUs() {
    const os = require('os');
    return os.cpus().length;
  }

  handleFlagChange(e) {

    if (e.target.checked) {
      this.props.store.dispatch({ type: 'SET_BUILD_ARG', arg: {[e.target.id]: e.target['data-flag']} });
    } else {
      this.props.store.dispatch({ type: 'UNSET_BUILD_ARG', arg: e.target.id });
    }

    if (e.target.id === 'msan_flag' && e.target.checked) {
      // Uncheck -race as mutually exclusive
      this.props.store.dispatch({ type: 'UNSET_BUILD_ARG', arg: 'race_flag' });
      document.getElementById('race_flag').checked = false;
    }

    if (e.target.id === 'race_flag' && e.target.checked) {
      // Uncheck -msan as mutually exclusive
      this.props.store.dispatch({ type: 'UNSET_BUILD_ARG', arg: 'msan_flag' });
      document.getElementById('msan_flag').checked = false;
    }
  }

  handleInputChange(e) {
    if (e.target.id === 'program_number_flag' && e.target.value === String(this.getNumberCPUs())) {
      // go build defaults to the number of available cores, so just remove from command line
      this.props.store.dispatch({ type: 'UNSET_BUILD_ARG', arg: e.target.id });
    } else if (e.target.id === 'build_mode' && e.target.value === 'default') {
      // default build mode, so just remove from command line
      this.props.store.dispatch({ type: 'UNSET_BUILD_ARG', arg: e.target.id });
    } else if (e.target.id === 'compiler_flag' && e.target.value === 'gc') {
      // default comiler is gc, so just remove from command line
      this.props.store.dispatch({ type: 'UNSET_BUILD_ARG', arg: e.target.id });
    } else {
      if (e.target.value) {
        this.props.store.dispatch({ type: 'SET_BUILD_ARG', arg: {[e.target.id]: e.target['data-flag'] + ' ' + e.target.value} });
      } else {
        this.props.store.dispatch({ type: 'UNSET_BUILD_ARG', arg: e.target.id });
      }
    }
  }

  render() {
    const cpus = String(this.getNumberCPUs());
    var buildArgs = this.props.store.getState().build.build_args;
    var go_build_command_line = buildArgs ? Object.values(buildArgs).join(' ') : '';
    var install_flag_checked = buildArgs.install_flag && buildArgs.install_flag === '-i' ? true : false;
    var force_flag_checked = buildArgs.force_flag && buildArgs.force_flag === '-a' ? true : false;
    var print_no_run_flag_checked = buildArgs.print_no_run_flag && buildArgs.print_no_run_flag === '-n' ? true : false;
    var print_flag_checked = buildArgs.print_flag && buildArgs.print_flag === '-x' ? true : false;
    var race_flag_checked = buildArgs.race_flag && buildArgs.race_flag === '-race' ? true : false;
    var msan_flag_checked = buildArgs.msan_flag && buildArgs.msan_flag === '-msan' && this.props.msan_enabled ? true : false;
    var msan_flag_disabled = this.props.msan_enabled ? {} : {'disabled': 'disabled'};
    var verbose_flag_checked = buildArgs.verbose_flag && buildArgs.verbose_flag === '-v' ? true : false;
    var work_flag_checked = buildArgs.work_flag && buildArgs.work_flag === '-work' ? true : false;
    var output_flag = buildArgs.output_flag ? buildArgs.output_flag.substr(3) : '';
    var program_number_flag = buildArgs.program_number_flag && buildArgs.program_number_flag !== cpus ? buildArgs.program_number_flag.substr(3) : cpus;

    var asm_flags = buildArgs.asm_flags ? buildArgs.asm_flags.substr(10) : '';
    var build_mode = buildArgs.build_mode ? buildArgs.build_mode.substr(11) : 'default';
    var compiler_flag = buildArgs.compiler_flag ? buildArgs.compiler_flag.substr(10) : 'gc'; // gc is default if not set
    var gccgo_flags = buildArgs.gccgo_flags ? buildArgs.gccgo_flags.substr(12) : '';
    var gc_flags = buildArgs.gc_flags ? buildArgs.gc_flags.substr(9) : '';
    var install_suffix = buildArgs.install_suffix ? buildArgs.install_suffix.substr(15) : '';
    var ld_flags = buildArgs.ld_flags ? buildArgs.ld_flags.substr(9) : '';
    var link_shared = buildArgs.link_shared ? buildArgs.link_shared.substr(12) : '';
    var pkg_dir = buildArgs.pkg_dir ? buildArgs.pkg_dir.substr(8) : '';
    var tags_flag = buildArgs.tags_flag ? buildArgs.tags_flag.substr(6) : '';
    var tool_exec = buildArgs.tool_exec ? buildArgs.tool_exec.substr(10) : '';

    return <div className='go-panel-content'>
      <div className='go-build-block'>
        <label for='go_build_command_line'>Flags for go build command will be:</label>
        <input type='text' id='go_build_command_line' className='input-text' readonly='readonly' value={go_build_command_line} style='width: 90%;' />
        <br/>
      </div>
      <div id='go-build-panel-settings' className='go-build-panel-settings'>
        <div id='go-build-args'>
          <div className='go-build-panel-settings'>
            <label><input type='checkbox' id='install_flag' className='input-toggle' onchange={this.handleFlagChange} data-flag='-i'
            checked={install_flag_checked}/> Install the packages that are dependencies of the target.</label>
            <label><input id='output_flag' type='text' className='input-text native-key-bindings' placeholder='Target file name' style='width: 50%;'
            onchange={this.handleInputChange} data-flag='-o' value={output_flag} /> Force build to write the resulting executable or object to the named output file, instead of the
             default behavior. Only allowed when compiling a single package.</label>
            <label><input type='checkbox' id='force_flag' className='input-toggle' onchange={this.handleFlagChange} data-flag='-a'
            checked={force_flag_checked} /> Force rebuilding of packages that are already up-to-date.</label>
            <label><input type='checkbox' id='print_flag' className='input-toggle' onchange={this.handleFlagChange}  data-flag='-x'
            checked={print_flag_checked} /> Print the commands.</label>
            <label><input type='checkbox' id='print_no_run_flag' className='input-toggle' onchange={this.handleFlagChange}  data-flag='-n'
            checked={print_no_run_flag_checked} /> Print the commands, but do not run them.</label>
            <label><input type='number' id='program_number_flag' min='1' max={cpus} defaultValue={cpus} value={program_number_flag}
            placeholder={'1-' + cpus} className='input-number' oninput={this.handleInputChange} data-flag='-p' /> The number of programs, such as build
            commands or	test binaries, that can be run in parallel. Defaults to the number of CPUs available.</label>
            <label>
            <input type='checkbox' id='race_flag' className='input-toggle' onchange={this.handleFlagChange} data-flag='-race'checked={race_flag_checked} /> Enable
            data race detection. Supported only on linux/amd64, freebsd/amd64, darwin/amd64 and windows/amd64. Incompatible with msan flag.</label>
            <label><input type='checkbox' id='msan_flag' className='input-toggle' onchange={this.handleFlagChange} data-flag='-msan'
            checked={msan_flag_checked} {...msan_flag_disabled}/> Enable interoperation with memory sanitizer. Supported only on linux/amd64, and only with Clang/LLVM as the host
            C compiler. Incompatible with race flag.</label>
            <label>
            <input type='checkbox' id='verbose_flag' className='input-toggle' onchange={this.handleFlagChange} data-flag='-v' checked={verbose_flag_checked} /> Print
            the names of packages as they are compiled.</label>
            <label>
            <input type='checkbox' id='work_flag' className='input-toggle' onchange={this.handleFlagChange} data-flag='-work' checked={work_flag_checked} /> Print
            the name of the temporary work directory and do not delete it when exiting.</label>
          </div>
          <details>
            <summary><strong>Advanced</strong></summary>
            <div className='go-build-panel-settings'>
              <label><input id='asm_flags' type='text' className='input-text native-key-bindings' placeholder='' style='width: 50%;'
                onchange={this.handleInputChange} data-flag='-asmflags' value={asm_flags} />Arguments to pass on each go tool asm invocation.</label>
              <label>
              <select id='build_mode' className='input-select' onchange={this.handleInputChange} data-flag='-buildmode' value={build_mode} >
                <option value='default' selected={'default' === build_mode} >default</option>
                <option value='archive' selected={'archive' === build_mode} >archive</option>
                <option value='c-archive' selected={'c-archive' === build_mode} >c-archive</option>
                <option value='c-shared' selected={'c-shared' === build_mode} >c-shared</option>
                <option value='shared' selected={'shared' === build_mode} >shared</option>
                <option value='exe' selected={'exe' === build_mode} >exe</option>
                <option value='pie' selected={'pie' === build_mode} >pie</option>
                <option value='plugin' selected={'plugin' === build_mode} >plugin</option>
              </select>
              Build mode to use.</label>
              <label>
              <select id='compiler_flag' className='input-select' onchange={this.handleInputChange} data-flag='-compiler' value={compiler_flag} >
                <option value='gc' selected={'gc' === compiler_flag} >gc</option>
                <option value='gccgo' selected={'gccgo' === compiler_flag} >gccgo</option>
              </select>
              Name of compiler to use, as in runtime.Compiler (gccgo or gc).</label>
              <label><input id='gccgo_flags' type='text' className='input-text native-key-bindings' placeholder='' style='width: 50%;'
              onchange={this.handleInputChange} data-flag='-gccgoflags' value={gccgo_flags} />Arguments to pass on each gccgo compiler/linker invocation.</label>
              <label><input id='gc_flags' type='text' className='input-text native-key-bindings' placeholder='' style='width: 50%;'
              onchange={this.handleInputChange} data-flag='-gcflags' value={gc_flags} />Arguments to pass on each go tool compile invocation.</label>
              <label><input id='install_suffix' type='text' className='input-text native-key-bindings' placeholder='' style='width: 50%;'
              onchange={this.handleInputChange} data-flag='-installsuffix' value={install_suffix} /> A suffix to use in the name of the package installation directory,
        		in order to keep output separate from default builds. If using the -race flag, the install suffix is automatically set to race  or, if set explicitly,
            has _race appended to it. Likewise for the -msan flag. Using a -buildmode option that requires non-default compile flags has a similar effect.</label>
              <label><input id='ld_flags' type='text' className='input-text native-key-bindings' placeholder='' style='width: 50%;'
              onchange={this.handleInputChange} data-flag='-ldflags' value={ld_flags} />Arguments to pass on each go tool link invocation.</label>
              <label><input id='link_shared' type='text' className='input-text native-key-bindings' placeholder='' style='width: 50%;'
              onchange={this.handleInputChange} data-flag='-linkshared' value={link_shared} />Link against shared libraries previously created with -buildmode=shared.</label>
              <label><input id='pkg_dir' type='text' className='input-text native-key-bindings' placeholder='' style='width: 50%;'
              onchange={this.handleInputChange} data-flag='-pkgdir' value={pkg_dir} />Install and load all packages from dir instead of the usual locations.
        		  For example, when building with a non-standard configuration, use -pkgdir to keep generated packages in a separate location.</label>
              <label><input id='tags_flag' type='text' className='input-text native-key-bindings' placeholder='' style='width: 50%;'
              onchange={this.handleInputChange} data-flag='-tags' value={tags_flag} />A space-separated list of build tags to consider satisfied during the
        		  build. For more information about build tags, see the description of build constraints in the documentation for the go/build package.</label>
              <label><input id='tool_exec' type='text' className='input-text native-key-bindings' placeholder='' style='width: 50%;'
              onchange={this.handleInputChange} data-flag='-toolexec' value={tool_exec} />A program to use to invoke toolchain programs like vet and asm.
        		  For example, instead of running asm, the go command will run 'cmd args /path/to/asm &lt;arguments for asm&gt;'.</label>
            </div>
          </details>
        </div>
        <EnvironmentPanel store={this.props.store} />
      </div>
    </div>;
  }

  // Tear down any state and detach
  destroy() {
    console.debug('Destroying SettingsPanel');
    this.subscriptions.dispose();
    this.subscriptions = null;
  }
}

SettingsPanel.bindFns = [ 'handleFlagChange', 'handleInputChange' ];
