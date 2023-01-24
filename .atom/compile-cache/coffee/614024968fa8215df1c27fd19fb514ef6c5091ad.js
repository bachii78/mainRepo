
/*
 * a remake of kriscross07/atom-gpp-compiler with extended features
 * https://github.com/kriscross07/atom-gpp-compiler
 * https://atom.io/packages/gpp-compiler
 */

(function() {
  var CompositeDisposable, GccMakeRun, GccMakeRunView, _extend, exec, execSync, join, parse, ref, ref1, statSync;

  GccMakeRunView = require('./gcc-make-run-view');

  CompositeDisposable = require('atom').CompositeDisposable;

  ref = require('path'), parse = ref.parse, join = ref.join;

  ref1 = require('child_process'), exec = ref1.exec, execSync = ref1.execSync;

  statSync = require('fs').statSync;

  _extend = require('util')._extend;

  module.exports = GccMakeRun = {
    config: {
      'C': {
        title: 'gcc Compiler',
        type: 'string',
        "default": 'gcc',
        order: 1,
        description: 'Compiler for `C`, in full path or command name (make sure it is in your `$PATH`)'
      },
      'C++': {
        title: 'g++ Compiler',
        type: 'string',
        "default": 'g++',
        order: 2,
        description: 'Compiler for `C++`, in full path or command name (make sure it is in your `$PATH`)'
      },
      'make': {
        title: 'make Utility',
        type: 'string',
        "default": 'make',
        order: 3,
        description: 'The `make` utility used for compilation, in full path or command name (make sure it is in your `$PATH`)'
      },
      'uncondBuild': {
        title: 'Unconditional Build',
        type: 'boolean',
        "default": false,
        order: 4,
        description: 'Will not check if executable is up to date'
      },
      'cflags': {
        title: 'Compiler Flags',
        type: 'string',
        "default": '',
        order: 5,
        description: 'Flags for compiler, eg: `-Wall`'
      },
      'ldlibs': {
        title: 'Link Libraries',
        type: 'string',
        "default": '',
        order: 6,
        description: 'Libraries for linking, eg: `-lm`'
      },
      'args': {
        title: 'Run Arguments',
        type: 'string',
        "default": '',
        order: 7,
        description: 'Arguments for executing, eg: `1 "2 3" "\\\"4 5 6\\\""`'
      },
      'ext': {
        title: 'Output Extension',
        type: 'string',
        "default": '',
        order: 8,
        description: 'The output extension, eg: `out`, in Windows compilers will use `exe` by default'
      },
      'terminal': {
        title: 'Terminal Start Command (only Linux platform)',
        type: 'string',
        "default": 'xterm -T $title -e',
        order: 9,
        description: 'Customize the terminal start command, eg: `gnome-terminal -t $title -x bash -c`'
      },
      'debug': {
        title: 'Debug Mode',
        type: 'boolean',
        "default": false,
        order: 10,
        description: 'Turn on this flag to log the executed command and output in console'
      }
    },
    gccMakeRunView: null,
    oneTimeBuild: false,

    /*
     * package setup
     */
    activate: function(state) {
      this.gccMakeRunView = new GccMakeRunView(this);
      this.subscriptions = new CompositeDisposable();
      return this.subscriptions.add(atom.commands.add('atom-workspace', {
        'gcc-make-run:compile-run': (function(_this) {
          return function() {
            return _this.compile();
          };
        })(this)
      }, atom.commands.add('.tree-view .file > .name', {
        'gcc-make-run:make-run': (function(_this) {
          return function(e) {
            return _this.make(e.target.getAttribute('data-path'));
          };
        })(this)
      })));
    },
    deactivate: function() {
      this.subscriptions.dispose();
      return this.gccMakeRunView.cancel();
    },
    serialize: function() {
      return {
        gccMakeRunViewState: this.gccMakeRunView.serialize()
      };
    },

    /*
     * compile and make run
     */
    compile: function() {
      var editor, srcPath;
      editor = atom.workspace.getActiveTextEditor();
      if (editor == null) {
        return;
      }
      srcPath = editor.getPath();
      if (!srcPath) {
        atom.notifications.addError('gcc-make-run: File Not Saved', {
          detail: 'Temporary files must be saved first'
        });
        return;
      }
      return Promise.resolve(editor.isModified() ? editor.save() : void 0).then((function(_this) {
        return function() {
          var cflags, cmd, compiler, ext, grammar, info, ldlibs;
          grammar = editor.getGrammar().name;
          switch (grammar) {
            case 'C':
            case 'C++':
            case 'C++14':
              if (grammar === 'C++14') {
                grammar = 'C++';
              }
              break;
            case 'Makefile':
              _this.make(srcPath);
              return;
            default:
              atom.notifications.addError('gcc-make-run: Grammar Not Supported', {
                detail: 'Only C, C++ and Makefile are supported'
              });
              return;
          }
          info = parse(editor.getPath());
          info.useMake = false;
          info.exe = info.name;
          ext = atom.config.get('gcc-make-run.ext');
          if (ext) {
            info.exe += "." + ext;
          } else if (process.platform === 'win32') {
            info.exe += '.exe';
          }
          compiler = atom.config.get("gcc-make-run." + grammar);
          cflags = atom.config.get('gcc-make-run.cflags');
          ldlibs = atom.config.get('gcc-make-run.ldlibs');
          if (!_this.shouldUncondBuild() && _this.isExeUpToDate(info)) {
            return _this.run(info);
          } else {
            cmd = "\"" + compiler + "\" " + cflags + " \"" + info.base + "\" -o \"" + info.exe + "\" " + ldlibs;
            atom.notifications.addInfo('gcc-make-run: Running Command...', {
              detail: cmd
            });
            return exec(cmd, {
              cwd: info.dir
            }, _this.onBuildFinished.bind(_this, info));
          }
        };
      })(this));
    },
    make: function(srcPath) {
      var cmd, info, mk, mkFlags;
      info = parse(srcPath);
      info.useMake = true;
      mk = atom.config.get('gcc-make-run.make');
      mkFlags = this.shouldUncondBuild() ? '-B' : '';
      cmd = "\"" + mk + "\" " + mkFlags + " -f \"" + info.base + "\"";
      atom.notifications.addInfo('gcc-make-run: Running Command...', {
        detail: cmd
      });
      return exec(cmd, {
        cwd: info.dir
      }, this.onBuildFinished.bind(this, info));
    },
    onBuildFinished: function(info, error, stdout, stderr) {
      var hasCompiled;
      hasCompiled = ((stdout != null ? stdout.indexOf('up to date') : void 0) < 0 && (stdout != null ? stdout.indexOf('to be done') : void 0) < 0) || (stdout == null);
      if (stderr) {
        atom.notifications[error ? 'addError' : 'addWarning']("gcc-make-run: Compile " + (error ? 'Error' : 'Warning'), {
          detail: stderr,
          dismissable: true
        });
      }
      if (stdout) {
        atom.notifications[hasCompiled ? 'addInfo' : 'addSuccess']('gcc-make-run: Compiler Output', {
          detail: stdout
        });
      }
      if (error) {
        return;
      }
      if (hasCompiled) {
        atom.notifications.addSuccess('gcc-make-run: Build Success');
      }
      return this.run(info);
    },
    run: function(info) {
      if (!this.checkMakeRunTarget(info)) {
        return;
      }
      if (!this.buildRunCmd(info)) {
        return;
      }
      if (atom.config.get('gcc-make-run.debug')) {
        console.log(info.cmd);
      }
      return exec(info.cmd, {
        cwd: info.dir,
        env: info.env
      }, this.onRunFinished.bind(this));
    },
    onRunFinished: function(error, stdout, stderr) {
      if (error) {
        atom.notifications.addError('gcc-make-run: Run Command Failed', {
          detail: stderr,
          dismissable: true
        });
      }
      if (stdout && atom.config.get('gcc-make-run.debug')) {
        return console.log(stdout);
      }
    },

    /*
     * helper functions
     */
    isExeUpToDate: function(info) {
      var error, exeTime, srcTime;
      srcTime = statSync(join(info.dir, info.base)).mtime.getTime();
      try {
        exeTime = statSync(join(info.dir, info.exe)).mtime.getTime();
      } catch (error1) {
        error = error1;
        exeTime = 0;
      }
      if (srcTime < exeTime) {
        atom.notifications.addSuccess("gcc-make-run: Output Up To Date", {
          detail: "'" + info.exe + "' is up to date"
        });
        return true;
      }
      return false;
    },
    checkMakeRunTarget: function(info) {
      var error, mk;
      if (!info.useMake) {
        return true;
      }
      mk = atom.config.get("gcc-make-run.make");
      info.exe = void 0;
      try {
        info.exe = execSync("\"" + mk + "\" -nf \"" + info.base + "\" run", {
          cwd: info.dir,
          stdio: [],
          encoding: 'utf8'
        }).split('#')[0].match(/[^\r\n]+/g)[0];
        if (!info.exe || info.exe.indexOf('to be done') >= 0) {
          throw Error();
        }
        if (process.platform === 'win32' && info.exe.indexOf('.exe') !== -1) {
          info.exe += '.exe';
        }
        return true;
      } catch (error1) {
        error = error1;
        atom.notifications.addError("gcc-make-run: Cannot find 'run' target", {
          detail: "Target 'run' is not specified in " + info.base + "\nExample 'run' target:\nrun:\n  excutable $(ARGS)",
          dismissable: true
        });
        return false;
      }
    },
    shouldUncondBuild: function() {
      var ret;
      ret = this.oneTimeBuild || atom.config.get('gcc-make-run.uncondBuild');
      this.oneTimeBuild = false;
      return ret;
    },
    buildRunCmd: function(info) {
      var mk, terminal;
      mk = atom.config.get('gcc-make-run.make');
      info.env = _extend({
        ARGS: atom.config.get('gcc-make-run.args')
      }, process.env);
      if (process.platform === 'linux') {
        terminal = atom.config.get('gcc-make-run.terminal').replace('$title', "\"" + info.exe + "\"");
      }
      if (info.useMake) {
        switch (process.platform) {
          case 'win32':
            info.cmd = "start \"" + info.exe + "\" cmd /c \"\"" + mk + "\" -sf \"" + info.base + "\" run & pause\"";
            break;
          case 'linux':
            info.cmd = (terminal + " \"") + this.escdq("\"" + mk + "\" -sf \"" + info.base + "\" run") + "; read -n1 -p 'Press any key to continue...'\"";
            break;
          case 'darwin':
            info.cmd = 'osascript -e \'tell application "Terminal" to activate do script "' + this.escdq(("clear && cd \"" + info.dir + "\"; \"" + mk + "\" ARGS=\"" + (this.escdq(info.env.ARGS)) + "\" -sf \"" + info.base + "\" run; ") + 'read -n1 -p "Press any key to continue..." && osascript -e "tell application \\"Atom\\" to activate" && osascript -e "do shell script ' + this.escdq("\"osascript -e " + (this.escdq('"tell application \\"Terminal\\" to close windows 0"')) + " + &> /dev/null &\"") + '"; exit') + '"\'';
        }
      } else {
        switch (process.platform) {
          case 'win32':
            info.cmd = "start \"" + info.exe + "\" cmd /c \"\"" + info.exe + "\" " + info.env.ARGS + " & pause\"";
            break;
          case 'linux':
            info.cmd = (terminal + " \"") + this.escdq("\"./" + info.exe + "\" " + info.env.ARGS) + "; read -n1 -p 'Press any key to continue...'\"";
            break;
          case 'darwin':
            info.cmd = 'osascript -e \'tell application "Terminal" to activate do script "' + this.escdq(("clear && cd \"" + info.dir + "\"; \"./" + info.exe + "\" " + info.env.ARGS + "; ") + 'read -n1 -p "Press any key to continue..." && osascript -e "tell application \\"Atom\\" to activate" && osascript -e "do shell script ' + this.escdq("\"osascript -e " + (this.escdq('"tell application \\"Terminal\\" to close windows 0"')) + " + &> /dev/null &\"") + '"; exit') + '"\'';
        }
      }
      if (info.cmd != null) {
        return true;
      }
      atom.notifications.addError('gcc-make-run: Cannot Execute Output', {
        detail: 'Execution after compiling is not supported on your OS'
      });
      return false;
    },
    escdq: function(s) {
      return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbGVhcm4vLmF0b20vcGFja2FnZXMvZ2NjLW1ha2UtcnVuL2xpYi9nY2MtbWFrZS1ydW4uY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7O0FBQUE7QUFBQSxNQUFBOztFQU1BLGNBQUEsR0FBaUIsT0FBQSxDQUFRLHFCQUFSOztFQUNoQixzQkFBdUIsT0FBQSxDQUFRLE1BQVI7O0VBQ3hCLE1BQWdCLE9BQUEsQ0FBUSxNQUFSLENBQWhCLEVBQUMsaUJBQUQsRUFBUTs7RUFDUixPQUFtQixPQUFBLENBQVEsZUFBUixDQUFuQixFQUFDLGdCQUFELEVBQU87O0VBQ04sV0FBWSxPQUFBLENBQVEsSUFBUjs7RUFDWixVQUFXLE9BQUEsQ0FBUSxNQUFSOztFQUVaLE1BQU0sQ0FBQyxPQUFQLEdBQWlCLFVBQUEsR0FDZjtJQUFBLE1BQUEsRUFDRTtNQUFBLEdBQUEsRUFDRTtRQUFBLEtBQUEsRUFBTyxjQUFQO1FBQ0EsSUFBQSxFQUFNLFFBRE47UUFFQSxDQUFBLE9BQUEsQ0FBQSxFQUFTLEtBRlQ7UUFHQSxLQUFBLEVBQU8sQ0FIUDtRQUlBLFdBQUEsRUFBYSxrRkFKYjtPQURGO01BTUEsS0FBQSxFQUNFO1FBQUEsS0FBQSxFQUFPLGNBQVA7UUFDQSxJQUFBLEVBQU0sUUFETjtRQUVBLENBQUEsT0FBQSxDQUFBLEVBQVMsS0FGVDtRQUdBLEtBQUEsRUFBTyxDQUhQO1FBSUEsV0FBQSxFQUFhLG9GQUpiO09BUEY7TUFZQSxNQUFBLEVBQ0U7UUFBQSxLQUFBLEVBQU8sY0FBUDtRQUNBLElBQUEsRUFBTSxRQUROO1FBRUEsQ0FBQSxPQUFBLENBQUEsRUFBUyxNQUZUO1FBR0EsS0FBQSxFQUFPLENBSFA7UUFJQSxXQUFBLEVBQWEseUdBSmI7T0FiRjtNQWtCQSxhQUFBLEVBQ0U7UUFBQSxLQUFBLEVBQU8scUJBQVA7UUFDQSxJQUFBLEVBQU0sU0FETjtRQUVBLENBQUEsT0FBQSxDQUFB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LEtBQVosQ0FBQSxHQUFtQixJQUFDLENBQUEsS0FBRCxDQUFPLE1BQUEsR0FBTyxJQUFJLENBQUMsR0FBWixHQUFnQixLQUFoQixHQUFxQixJQUFJLENBQUMsR0FBRyxDQUFDLElBQXJDLENBQW5CLEdBQWtFO0FBQTFGO0FBRlAsZUFHTyxRQUhQO1lBR3FCLElBQUksQ0FBQyxHQUFMLEdBQVcsb0VBQUEsR0FBdUUsSUFBQyxDQUFBLEtBQUQsQ0FBTyxDQUFBLGdCQUFBLEdBQWlCLElBQUksQ0FBQyxHQUF0QixHQUEwQixVQUExQixHQUFvQyxJQUFJLENBQUMsR0FBekMsR0FBNkMsS0FBN0MsR0FBa0QsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUEzRCxHQUFnRSxJQUFoRSxDQUFBLEdBQXNFLHdJQUF0RSxHQUFpTixJQUFDLENBQUEsS0FBRCxDQUFPLGlCQUFBLEdBQWlCLENBQUMsSUFBQyxDQUFBLEtBQUQsQ0FBTyxzREFBUCxDQUFELENBQWpCLEdBQWlGLHFCQUF4RixDQUFqTixHQUFpVSxTQUF4VSxDQUF2RSxHQUE0WjtBQUg1YixTQVBGOztNQWFBLElBQWUsZ0JBQWY7QUFBQSxlQUFPLEtBQVA7O01BQ0EsSUFBSSxDQUFDLGFBQWEsQ0FBQyxRQUFuQixDQUE0QixxQ0FBNUIsRUFBbUU7UUFBRSxNQUFBLEVBQVEsdURBQVY7T0FBbkU7QUFDQSxhQUFPO0lBdkJJLENBdE5iO0lBK09BLEtBQUEsRUFBTyxTQUFDLENBQUQ7YUFFTCxDQUFDLENBQUMsT0FBRixDQUFVLEtBQVYsRUFBaUIsTUFBakIsQ0FBd0IsQ0FBQyxPQUF6QixDQUFpQyxJQUFqQyxFQUF1QyxLQUF2QztJQUZLLENBL09QOztBQWRGIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4jIGEgcmVtYWtlIG9mIGtyaXNjcm9zczA3L2F0b20tZ3BwLWNvbXBpbGVyIHdpdGggZXh0ZW5kZWQgZmVhdHVyZXNcbiMgaHR0cHM6Ly9naXRodWIuY29tL2tyaXNjcm9zczA3L2F0b20tZ3BwLWNvbXBpbGVyXG4jIGh0dHBzOi8vYXRvbS5pby9wYWNrYWdlcy9ncHAtY29tcGlsZXJcbiMjI1xuXG5HY2NNYWtlUnVuVmlldyA9IHJlcXVpcmUgJy4vZ2NjLW1ha2UtcnVuLXZpZXcnXG57Q29tcG9zaXRlRGlzcG9zYWJsZX0gPSByZXF1aXJlICdhdG9tJ1xue3BhcnNlLCBqb2lufSA9IHJlcXVpcmUgJ3BhdGgnXG57ZXhlYywgZXhlY1N5bmN9ID0gcmVxdWlyZSAnY2hpbGRfcHJvY2VzcydcbntzdGF0U3luY30gPSByZXF1aXJlICdmcydcbntfZXh0ZW5kfSA9IHJlcXVpcmUgJ3V0aWwnXG5cbm1vZHVsZS5leHBvcnRzID0gR2NjTWFrZVJ1biA9XG4gIGNvbmZpZzpcbiAgICAnQyc6XG4gICAgICB0aXRsZTogJ2djYyBDb21waWxlcidcbiAgICAgIHR5cGU6ICdzdHJpbmcnXG4gICAgICBkZWZhdWx0OiAnZ2NjJ1xuICAgICAgb3JkZXI6IDFcbiAgICAgIGRlc2NyaXB0aW9uOiAnQ29tcGlsZXIgZm9yIGBDYCwgaW4gZnVsbCBwYXRoIG9yIGNvbW1hbmQgbmFtZSAobWFrZSBzdXJlIGl0IGlzIGluIHlvdXIgYCRQQVRIYCknXG4gICAgJ0MrKyc6XG4gICAgICB0aXRsZTogJ2crKyBDb21waWxlcidcbiAgICAgIHR5cGU6ICdzdHJpbmcnXG4gICAgICBkZWZhdWx0OiAnZysrJ1xuICAgICAgb3JkZXI6IDJcbiAgICAgIGRlc2NyaXB0aW9uOiAnQ29tcGlsZXIgZm9yIGBDKytgLCBpbiBmdWxsIHBhdGggb3IgY29tbWFuZCBuYW1lIChtYWtlIHN1cmUgaXQgaXMgaW4geW91ciBgJFBBVEhgKSdcbiAgICAnbWFrZSc6XG4gICAgICB0aXRsZTogJ21ha2UgVXRpbGl0eSdcbiAgICAgIHR5cGU6ICdzdHJpbmcnXG4gICAgICBkZWZhdWx0OiAnbWFrZSdcbiAgICAgIG9yZGVyOiAzXG4gICAgICBkZXNjcmlwdGlvbjogJ1RoZSBgbWFrZWAgdXRpbGl0eSB1c2VkIGZvciBjb21waWxhdGlvbiwgaW4gZnVsbCBwYXRoIG9yIGNvbW1hbmQgbmFtZSAobWFrZSBzdXJlIGl0IGlzIGluIHlvdXIgYCRQQVRIYCknXG4gICAgJ3VuY29uZEJ1aWxkJzpcbiAgICAgIHRpdGxlOiAnVW5jb25kaXRpb25hbCBCdWlsZCdcbiAgICAgIHR5cGU6ICdib29sZWFuJ1xuICAgICAgZGVmYXVsdDogZmFsc2VcbiAgICAgIG9yZGVyOiA0XG4gICAgICBkZXNjcmlwdGlvbjogJ1dpbGwgbm90IGNoZWNrIGlmIGV4ZWN1dGFibGUgaXMgdXAgdG8gZGF0ZSdcbiAgICAnY2ZsYWdzJzpcbiAgICAgIHRpdGxlOiAnQ29tcGlsZXIgRmxhZ3MnXG4gICAgICB0eXBlOiAnc3RyaW5nJ1xuICAgICAgZGVmYXVsdDogJydcbiAgICAgIG9yZGVyOiA1XG4gICAgICBkZXNjcmlwdGlvbjogJ0ZsYWdzIGZvciBjb21waWxlciwgZWc6IGAtV2FsbGAnXG4gICAgJ2xkbGlicyc6XG4gICAgICB0aXRsZTogJ0xpbmsgTGlicmFyaWVzJ1xuICAgICAgdHlwZTogJ3N0cmluZydcbiAgICAgIGRlZmF1bHQ6ICcnXG4gICAgICBvcmRlcjogNlxuICAgICAgZGVzY3JpcHRpb246ICdMaWJyYXJpZXMgZm9yIGxpbmtpbmcsIGVnOiBgLWxtYCdcbiAgICAnYXJncyc6XG4gICAgICB0aXRsZTogJ1J1biBBcmd1bWVudHMnXG4gICAgICB0eXBlOiAnc3RyaW5nJ1xuICAgICAgZGVmYXVsdDogJydcbiAgICAgIG9yZGVyOiA3XG4gICAgICBkZXNjcmlwdGlvbjogJ0FyZ3VtZW50cyBmb3IgZXhlY3V0aW5nLCBlZzogYDEgXCIyIDNcIiBcIlxcXFxcXFwiNCA1IDZcXFxcXFxcIlwiYCdcbiAgICAnZXh0JzpcbiAgICAgIHRpdGxlOiAnT3V0cHV0IEV4dGVuc2lvbidcbiAgICAgIHR5cGU6ICdzdHJpbmcnXG4gICAgICBkZWZhdWx0OiAnJ1xuICAgICAgb3JkZXI6IDhcbiAgICAgIGRlc2NyaXB0aW9uOiAnVGhlIG91dHB1dCBleHRlbnNpb24sIGVnOiBgb3V0YCwgaW4gV2luZG93cyBjb21waWxlcnMgd2lsbCB1c2UgYGV4ZWAgYnkgZGVmYXVsdCdcbiAgICAndGVybWluYWwnOlxuICAgICAgdGl0bGU6ICdUZXJtaW5hbCBTdGFydCBDb21tYW5kIChvbmx5IExpbnV4IHBsYXRmb3JtKSdcbiAgICAgIHR5cGU6ICdzdHJpbmcnXG4gICAgICBkZWZhdWx0OiAneHRlcm0gLVQgJHRpdGxlIC1lJ1xuICAgICAgb3JkZXI6IDlcbiAgICAgIGRlc2NyaXB0aW9uOiAnQ3VzdG9taXplIHRoZSB0ZXJtaW5hbCBzdGFydCBjb21tYW5kLCBlZzogYGdub21lLXRlcm1pbmFsIC10ICR0aXRsZSAteCBiYXNoIC1jYCdcbiAgICAnZGVidWcnOlxuICAgICAgdGl0bGU6ICdEZWJ1ZyBNb2RlJ1xuICAgICAgdHlwZTogJ2Jvb2xlYW4nXG4gICAgICBkZWZhdWx0OiBmYWxzZVxuICAgICAgb3JkZXI6IDEwXG4gICAgICBkZXNjcmlwdGlvbjogJ1R1cm4gb24gdGhpcyBmbGFnIHRvIGxvZyB0aGUgZXhlY3V0ZWQgY29tbWFuZCBhbmQgb3V0cHV0IGluIGNvbnNvbGUnXG5cbiAgZ2NjTWFrZVJ1blZpZXc6IG51bGxcbiAgb25lVGltZUJ1aWxkOiBmYWxzZVxuXG4gICMjI1xuICAjIHBhY2thZ2Ugc2V0dXBcbiAgIyMjXG4gIGFjdGl2YXRlOiAoc3RhdGUpIC0+XG4gICAgQGdjY01ha2VSdW5WaWV3ID0gbmV3IEdjY01ha2VSdW5WaWV3KEApXG4gICAgQHN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpXG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkKFxuICAgICAgYXRvbS5jb21tYW5kcy5hZGQgJ2F0b20td29ya3NwYWNlJywgJ2djYy1tYWtlLXJ1bjpjb21waWxlLXJ1bic6ID0+IEBjb21waWxlKCksXG4gICAgICBhdG9tLmNvbW1hbmRzLmFkZCAnLnRyZWUtdmlldyAuZmlsZSA+IC5uYW1lJywgJ2djYy1tYWtlLXJ1bjptYWtlLXJ1bic6IChlKSA9PiBAbWFrZShlLnRhcmdldC5nZXRBdHRyaWJ1dGUoJ2RhdGEtcGF0aCcpKVxuICAgIClcblxuICBkZWFjdGl2YXRlOiAtPlxuICAgIEBzdWJzY3JpcHRpb25zLmRpc3Bvc2UoKVxuICAgIEBnY2NNYWtlUnVuVmlldy5jYW5jZWwoKVxuXG4gIHNlcmlhbGl6ZTogLT5cbiAgICBnY2NNYWtlUnVuVmlld1N0YXRlOiBAZ2NjTWFrZVJ1blZpZXcuc2VyaWFsaXplKClcblxuICAjIyNcbiAgIyBjb21waWxlIGFuZCBtYWtlIHJ1blxuICAjIyNcbiAgY29tcGlsZTogKCkgLT5cbiAgICAjIGdldCBlZGl0b3JcbiAgICBlZGl0b3IgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKClcbiAgICByZXR1cm4gdW5sZXNzIGVkaXRvcj9cblxuICAgICMgc2F2ZSBmaWxlXG4gICAgc3JjUGF0aCA9IGVkaXRvci5nZXRQYXRoKClcbiAgICBpZiAhc3JjUGF0aFxuICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEVycm9yKCdnY2MtbWFrZS1ydW46IEZpbGUgTm90IFNhdmVkJywgeyBkZXRhaWw6ICdUZW1wb3JhcnkgZmlsZXMgbXVzdCBiZSBzYXZlZCBmaXJzdCcgfSlcbiAgICAgIHJldHVyblxuICAgIFByb21pc2UucmVzb2x2ZShlZGl0b3Iuc2F2ZSgpIGlmIGVkaXRvci5pc01vZGlmaWVkKCkpLnRoZW4gPT5cblxuICAgICAgIyBnZXQgZ3JhbW1hclxuICAgICAgZ3JhbW1hciA9IGVkaXRvci5nZXRHcmFtbWFyKCkubmFtZVxuICAgICAgc3dpdGNoIGdyYW1tYXJcbiAgICAgICAgd2hlbiAnQycsICdDKysnLCAnQysrMTQnIHRoZW4gZ3JhbW1hciA9ICdDKysnIGlmIGdyYW1tYXIgPT0gJ0MrKzE0J1xuICAgICAgICB3aGVuICdNYWtlZmlsZSdcbiAgICAgICAgICBAbWFrZShzcmNQYXRoKVxuICAgICAgICAgIHJldHVyblxuICAgICAgICBlbHNlXG4gICAgICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEVycm9yKCdnY2MtbWFrZS1ydW46IEdyYW1tYXIgTm90IFN1cHBvcnRlZCcsIHsgZGV0YWlsOiAnT25seSBDLCBDKysgYW5kIE1ha2VmaWxlIGFyZSBzdXBwb3J0ZWQnIH0pXG4gICAgICAgICAgcmV0dXJuXG5cbiAgICAgICMgZ2V0IGNvbmZpZ1xuICAgICAgaW5mbyA9IHBhcnNlKGVkaXRvci5nZXRQYXRoKCkpXG4gICAgICBpbmZvLnVzZU1ha2UgPSBmYWxzZVxuICAgICAgaW5mby5leGUgPSBpbmZvLm5hbWVcbiAgICAgIGV4dCA9IGF0b20uY29uZmlnLmdldCgnZ2NjLW1ha2UtcnVuLmV4dCcpXG4gICAgICBpZiBleHQgdGhlbiBpbmZvLmV4ZSArPSBcIi4je2V4dH1cIiBlbHNlIGlmIHByb2Nlc3MucGxhdGZvcm0gPT0gJ3dpbjMyJyB0aGVuIGluZm8uZXhlICs9ICcuZXhlJ1xuICAgICAgY29tcGlsZXIgPSBhdG9tLmNvbmZpZy5nZXQoXCJnY2MtbWFrZS1ydW4uI3tncmFtbWFyfVwiKVxuICAgICAgY2ZsYWdzID0gYXRvbS5jb25maWcuZ2V0KCdnY2MtbWFrZS1ydW4uY2ZsYWdzJylcbiAgICAgIGxkbGlicyA9IGF0b20uY29uZmlnLmdldCgnZ2NjLW1ha2UtcnVuLmxkbGlicycpXG5cbiAgICAgICMgY2hlY2sgaWYgdXBkYXRlIG5lZWRlZCBiZWZvcmUgY29tcGlsZVxuICAgICAgaWYgIUBzaG91bGRVbmNvbmRCdWlsZCgpICYmIEBpc0V4ZVVwVG9EYXRlKGluZm8pXG4gICAgICAgIEBydW4oaW5mbylcbiAgICAgIGVsc2VcbiAgICAgICAgY21kID0gXCJcXFwiI3tjb21waWxlcn1cXFwiICN7Y2ZsYWdzfSBcXFwiI3tpbmZvLmJhc2V9XFxcIiAtbyBcXFwiI3tpbmZvLmV4ZX1cXFwiICN7bGRsaWJzfVwiXG4gICAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRJbmZvKCdnY2MtbWFrZS1ydW46IFJ1bm5pbmcgQ29tbWFuZC4uLicsIHsgZGV0YWlsOiBjbWQgfSlcbiAgICAgICAgZXhlYyhjbWQgLCB7IGN3ZDogaW5mby5kaXIgfSwgQG9uQnVpbGRGaW5pc2hlZC5iaW5kKEAsIGluZm8pKVxuXG4gIG1ha2U6IChzcmNQYXRoKSAtPlxuICAgICMgZ2V0IGNvbmZpZ1xuICAgIGluZm8gPSBwYXJzZShzcmNQYXRoKVxuICAgIGluZm8udXNlTWFrZSA9IHRydWVcbiAgICBtayA9IGF0b20uY29uZmlnLmdldCgnZ2NjLW1ha2UtcnVuLm1ha2UnKVxuICAgIG1rRmxhZ3MgPSBpZiBAc2hvdWxkVW5jb25kQnVpbGQoKSB0aGVuICctQicgZWxzZSAnJ1xuXG4gICAgIyBtYWtlXG4gICAgY21kID0gXCJcXFwiI3tta31cXFwiICN7bWtGbGFnc30gLWYgXFxcIiN7aW5mby5iYXNlfVxcXCJcIlxuICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRJbmZvKCdnY2MtbWFrZS1ydW46IFJ1bm5pbmcgQ29tbWFuZC4uLicsIHsgZGV0YWlsOiBjbWQgfSlcbiAgICBleGVjKGNtZCwgeyBjd2Q6IGluZm8uZGlyIH0sIEBvbkJ1aWxkRmluaXNoZWQuYmluZChALCBpbmZvKSlcblxuICBvbkJ1aWxkRmluaXNoZWQ6IChpbmZvLCBlcnJvciwgc3Rkb3V0LCBzdGRlcnIpIC0+XG4gICAgIyBub3RpZmljYXRpb25zIGFib3V0IGNvbXBpbGF0aW9uIHN0YXR1c1xuICAgIGhhc0NvbXBpbGVkID0gKHN0ZG91dD8uaW5kZXhPZigndXAgdG8gZGF0ZScpIDwgMCAmJiBzdGRvdXQ/LmluZGV4T2YoJ3RvIGJlIGRvbmUnKSA8IDApIHx8ICFzdGRvdXQ/XG4gICAgYXRvbS5ub3RpZmljYXRpb25zW2lmIGVycm9yIHRoZW4gJ2FkZEVycm9yJyBlbHNlICdhZGRXYXJuaW5nJ10oXCJnY2MtbWFrZS1ydW46IENvbXBpbGUgI3tpZiBlcnJvciB0aGVuICdFcnJvcicgZWxzZSAnV2FybmluZyd9XCIsIHsgZGV0YWlsOiBzdGRlcnIsIGRpc21pc3NhYmxlOiB0cnVlIH0pIGlmIHN0ZGVyclxuICAgIGF0b20ubm90aWZpY2F0aW9uc1tpZiBoYXNDb21waWxlZCB0aGVuICdhZGRJbmZvJyBlbHNlICdhZGRTdWNjZXNzJ10oJ2djYy1tYWtlLXJ1bjogQ29tcGlsZXIgT3V0cHV0JywgeyBkZXRhaWw6IHN0ZG91dCB9KSBpZiBzdGRvdXRcblxuICAgICMgY29udGludWUgb25seSBpZiBubyBlcnJvclxuICAgIHJldHVybiBpZiBlcnJvclxuICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRTdWNjZXNzKCdnY2MtbWFrZS1ydW46IEJ1aWxkIFN1Y2Nlc3MnKSBpZiBoYXNDb21waWxlZFxuICAgIEBydW4oaW5mbylcblxuICBydW46IChpbmZvKSAtPlxuICAgICMgYnVpbGQgdGhlIHJ1biBjbWRcbiAgICByZXR1cm4gdW5sZXNzIEBjaGVja01ha2VSdW5UYXJnZXQoaW5mbylcbiAgICByZXR1cm4gdW5sZXNzIEBidWlsZFJ1bkNtZChpbmZvKVxuXG4gICAgIyBydW4gdGhlIGNtZFxuICAgIGNvbnNvbGUubG9nIGluZm8uY21kIGlmIGF0b20uY29uZmlnLmdldCgnZ2NjLW1ha2UtcnVuLmRlYnVnJylcbiAgICBleGVjKGluZm8uY21kLCB7IGN3ZDogaW5mby5kaXIsIGVudjogaW5mby5lbnYgfSwgQG9uUnVuRmluaXNoZWQuYmluZChAKSlcblxuICBvblJ1bkZpbmlzaGVkOiAoZXJyb3IsIHN0ZG91dCwgc3RkZXJyKSAtPlxuICAgICMgY29tbWFuZCBlcnJvclxuICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRFcnJvcignZ2NjLW1ha2UtcnVuOiBSdW4gQ29tbWFuZCBGYWlsZWQnLCB7IGRldGFpbDogc3RkZXJyLCBkaXNtaXNzYWJsZTogdHJ1ZSB9KSBpZiBlcnJvclxuICAgIGNvbnNvbGUubG9nIHN0ZG91dCBpZiBzdGRvdXQgJiYgYXRvbS5jb25maWcuZ2V0KCdnY2MtbWFrZS1ydW4uZGVidWcnKVxuXG4gICMjI1xuICAjIGhlbHBlciBmdW5jdGlvbnNcbiAgIyMjXG4gIGlzRXhlVXBUb0RhdGU6IChpbmZvKSAtPlxuICAgICMgY2hlY2sgc3JjIGFuZCBleGUgbW9kaWZpZWQgdGltZVxuICAgIHNyY1RpbWUgPSBzdGF0U3luYyhqb2luKGluZm8uZGlyLCBpbmZvLmJhc2UpKS5tdGltZS5nZXRUaW1lKClcbiAgICB0cnlcbiAgICAgIGV4ZVRpbWUgPSBzdGF0U3luYyhqb2luKGluZm8uZGlyLCBpbmZvLmV4ZSkpLm10aW1lLmdldFRpbWUoKVxuICAgIGNhdGNoIGVycm9yXG4gICAgICBleGVUaW1lID0gMFxuXG4gICAgaWYgc3JjVGltZSA8IGV4ZVRpbWVcbiAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRTdWNjZXNzKFwiZ2NjLW1ha2UtcnVuOiBPdXRwdXQgVXAgVG8gRGF0ZVwiLCB7IGRldGFpbDogXCInI3tpbmZvLmV4ZX0nIGlzIHVwIHRvIGRhdGVcIiB9KVxuICAgICAgcmV0dXJuIHRydWVcbiAgICByZXR1cm4gZmFsc2VcblxuICBjaGVja01ha2VSdW5UYXJnZXQ6IChpbmZvKSAtPlxuICAgICMgcmV0dXJuIGlmIG5vdCB1c2luZyBNYWtlZmlsZVxuICAgIHJldHVybiB0cnVlIGlmICFpbmZvLnVzZU1ha2VcblxuICAgIG1rID0gYXRvbS5jb25maWcuZ2V0KFwiZ2NjLW1ha2UtcnVuLm1ha2VcIilcbiAgICBpbmZvLmV4ZSA9IHVuZGVmaW5lZFxuXG4gICAgIyB0cnkgbWFrZSBydW4gdG8gZ2V0IHRoZSB0YXJnZXRcbiAgICB0cnlcbiAgICAgIGluZm8uZXhlID0gZXhlY1N5bmMoXCJcXFwiI3tta31cXFwiIC1uZiBcXFwiI3tpbmZvLmJhc2V9XFxcIiBydW5cIiwgeyBjd2Q6IGluZm8uZGlyLCBzdGRpbzogW10sIGVuY29kaW5nOiAndXRmOCcgfSkuc3BsaXQoJyMnKVswXS5tYXRjaCgvW15cXHJcXG5dKy9nKVswXVxuICAgICAgaWYgIWluZm8uZXhlIHx8IGluZm8uZXhlLmluZGV4T2YoJ3RvIGJlIGRvbmUnKSA+PSAwIHRoZW4gdGhyb3cgRXJyb3IoKVxuICAgICAgaWYgcHJvY2Vzcy5wbGF0Zm9ybSA9PSAnd2luMzInICYmIGluZm8uZXhlLmluZGV4T2YoJy5leGUnKSAhPSAtMSB0aGVuIGluZm8uZXhlICs9ICcuZXhlJ1xuICAgICAgcmV0dXJuIHRydWVcbiAgICBjYXRjaCBlcnJvclxuICAgICAgIyBjYW5ub3QgZ2V0IHJ1biB0YXJnZXRcbiAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRFcnJvcihcbiAgICAgICAgXCJnY2MtbWFrZS1ydW46IENhbm5vdCBmaW5kICdydW4nIHRhcmdldFwiLFxuICAgICAgICB7XG4gICAgICAgICAgZGV0YWlsOiBcIlwiXCJcbiAgICAgICAgICAgIFRhcmdldCAncnVuJyBpcyBub3Qgc3BlY2lmaWVkIGluICN7aW5mby5iYXNlfVxuICAgICAgICAgICAgRXhhbXBsZSAncnVuJyB0YXJnZXQ6XG4gICAgICAgICAgICBydW46XG4gICAgICAgICAgICAgIGV4Y3V0YWJsZSAkKEFSR1MpXG4gICAgICAgICAgXCJcIlwiLFxuICAgICAgICAgIGRpc21pc3NhYmxlOiB0cnVlXG4gICAgICAgIH1cbiAgICAgIClcbiAgICAgIHJldHVybiBmYWxzZVxuXG4gIHNob3VsZFVuY29uZEJ1aWxkOiAtPlxuICAgIHJldCA9IEBvbmVUaW1lQnVpbGQgfHwgYXRvbS5jb25maWcuZ2V0KCdnY2MtbWFrZS1ydW4udW5jb25kQnVpbGQnKVxuICAgIEBvbmVUaW1lQnVpbGQgPSBmYWxzZVxuICAgIHJldHVybiByZXRcblxuICBidWlsZFJ1bkNtZDogKGluZm8pIC0+XG4gICAgIyBnZXQgY29uZmlnXG4gICAgbWsgPSBhdG9tLmNvbmZpZy5nZXQoJ2djYy1tYWtlLXJ1bi5tYWtlJylcbiAgICBpbmZvLmVudiA9IF9leHRlbmQoeyBBUkdTOiBhdG9tLmNvbmZpZy5nZXQoJ2djYy1tYWtlLXJ1bi5hcmdzJykgfSwgcHJvY2Vzcy5lbnYpXG5cbiAgICAjIGZvciBsaW51eCBwbGF0Zm9ybSwgZ2V0IHRlcm1pbmFsIGFuZCByZXBsYWNlIHRoZSB0aXRsZVxuICAgIHRlcm1pbmFsID0gYXRvbS5jb25maWcuZ2V0KCdnY2MtbWFrZS1ydW4udGVybWluYWwnKS5yZXBsYWNlKCckdGl0bGUnLCBcIlxcXCIje2luZm8uZXhlfVxcXCJcIikgaWYgcHJvY2Vzcy5wbGF0Zm9ybSA9PSAnbGludXgnXG5cbiAgICBpZiBpbmZvLnVzZU1ha2VcbiAgICAgIHN3aXRjaCBwcm9jZXNzLnBsYXRmb3JtXG4gICAgICAgIHdoZW4gJ3dpbjMyJyB0aGVuIGluZm8uY21kID0gXCJzdGFydCBcXFwiI3tpbmZvLmV4ZX1cXFwiIGNtZCAvYyBcXFwiXFxcIiN7bWt9XFxcIiAtc2YgXFxcIiN7aW5mby5iYXNlfVxcXCIgcnVuICYgcGF1c2VcXFwiXCJcbiAgICAgICAgd2hlbiAnbGludXgnIHRoZW4gaW5mby5jbWQgPSBcIiN7dGVybWluYWx9IFxcXCJcIiArIEBlc2NkcShcIlxcXCIje21rfVxcXCIgLXNmIFxcXCIje2luZm8uYmFzZX1cXFwiIHJ1blwiKSArIFwiOyByZWFkIC1uMSAtcCAnUHJlc3MgYW55IGtleSB0byBjb250aW51ZS4uLidcXFwiXCJcbiAgICAgICAgd2hlbiAnZGFyd2luJyB0aGVuIGluZm8uY21kID0gJ29zYXNjcmlwdCAtZSBcXCd0ZWxsIGFwcGxpY2F0aW9uIFwiVGVybWluYWxcIiB0byBhY3RpdmF0ZSBkbyBzY3JpcHQgXCInICsgQGVzY2RxKFwiY2xlYXIgJiYgY2QgXFxcIiN7aW5mby5kaXJ9XFxcIjsgXFxcIiN7bWt9XFxcIiBBUkdTPVxcXCIje0Blc2NkcShpbmZvLmVudi5BUkdTKX1cXFwiIC1zZiBcXFwiI3tpbmZvLmJhc2V9XFxcIiBydW47IFwiICsgJ3JlYWQgLW4xIC1wIFwiUHJlc3MgYW55IGtleSB0byBjb250aW51ZS4uLlwiICYmIG9zYXNjcmlwdCAtZSBcInRlbGwgYXBwbGljYXRpb24gXFxcXFwiQXRvbVxcXFxcIiB0byBhY3RpdmF0ZVwiICYmIG9zYXNjcmlwdCAtZSBcImRvIHNoZWxsIHNjcmlwdCAnICsgQGVzY2RxKFwiXFxcIm9zYXNjcmlwdCAtZSAje0Blc2NkcSgnXCJ0ZWxsIGFwcGxpY2F0aW9uIFxcXFxcIlRlcm1pbmFsXFxcXFwiIHRvIGNsb3NlIHdpbmRvd3MgMFwiJyl9ICsgJj4gL2Rldi9udWxsICZcXFwiXCIpICsgJ1wiOyBleGl0JykgKyAnXCJcXCcnXG4gICAgZWxzZVxuICAgICAgIyBub3JtYWwgcnVuXG4gICAgICBzd2l0Y2ggcHJvY2Vzcy5wbGF0Zm9ybVxuICAgICAgICB3aGVuICd3aW4zMicgdGhlbiBpbmZvLmNtZCA9IFwic3RhcnQgXFxcIiN7aW5mby5leGV9XFxcIiBjbWQgL2MgXFxcIlxcXCIje2luZm8uZXhlfVxcXCIgI3tpbmZvLmVudi5BUkdTfSAmIHBhdXNlXFxcIlwiXG4gICAgICAgIHdoZW4gJ2xpbnV4JyB0aGVuIGluZm8uY21kID0gXCIje3Rlcm1pbmFsfSBcXFwiXCIgKyBAZXNjZHEoXCJcXFwiLi8je2luZm8uZXhlfVxcXCIgI3tpbmZvLmVudi5BUkdTfVwiKSArIFwiOyByZWFkIC1uMSAtcCAnUHJlc3MgYW55IGtleSB0byBjb250aW51ZS4uLidcXFwiXCJcbiAgICAgICAgd2hlbiAnZGFyd2luJyB0aGVuIGluZm8uY21kID0gJ29zYXNjcmlwdCAtZSBcXCd0ZWxsIGFwcGxpY2F0aW9uIFwiVGVybWluYWxcIiB0byBhY3RpdmF0ZSBkbyBzY3JpcHQgXCInICsgQGVzY2RxKFwiY2xlYXIgJiYgY2QgXFxcIiN7aW5mby5kaXJ9XFxcIjsgXFxcIi4vI3tpbmZvLmV4ZX1cXFwiICN7aW5mby5lbnYuQVJHU307IFwiICsgJ3JlYWQgLW4xIC1wIFwiUHJlc3MgYW55IGtleSB0byBjb250aW51ZS4uLlwiICYmIG9zYXNjcmlwdCAtZSBcInRlbGwgYXBwbGljYXRpb24gXFxcXFwiQXRvbVxcXFxcIiB0byBhY3RpdmF0ZVwiICYmIG9zYXNjcmlwdCAtZSBcImRvIHNoZWxsIHNjcmlwdCAnICsgQGVzY2RxKFwiXFxcIm9zYXNjcmlwdCAtZSAje0Blc2NkcSgnXCJ0ZWxsIGFwcGxpY2F0aW9uIFxcXFxcIlRlcm1pbmFsXFxcXFwiIHRvIGNsb3NlIHdpbmRvd3MgMFwiJyl9ICsgJj4gL2Rldi9udWxsICZcXFwiXCIpICsgJ1wiOyBleGl0JykgKyAnXCJcXCcnXG5cbiAgICAjIGNoZWNrIGlmIGNtZCBpcyBidWlsdFxuICAgIHJldHVybiB0cnVlIGlmIGluZm8uY21kP1xuICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRFcnJvcignZ2NjLW1ha2UtcnVuOiBDYW5ub3QgRXhlY3V0ZSBPdXRwdXQnLCB7IGRldGFpbDogJ0V4ZWN1dGlvbiBhZnRlciBjb21waWxpbmcgaXMgbm90IHN1cHBvcnRlZCBvbiB5b3VyIE9TJyB9KVxuICAgIHJldHVybiBmYWxzZVxuXG4gIGVzY2RxOiAocykgLT5cbiAgICAjIGVzY2FwZSBkb3VibGUgcXVvdGVcbiAgICBzLnJlcGxhY2UoL1xcXFwvZywgJ1xcXFxcXFxcJykucmVwbGFjZSgvXCIvZywgJ1xcXFxcIicpXG4iXX0=
