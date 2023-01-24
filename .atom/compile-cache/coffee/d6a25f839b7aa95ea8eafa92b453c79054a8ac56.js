(function() {
  var BreakpointList, CompositeDisposable, ConfigList, ConfigManager, CustomPanel, Debug, Emitter, StackList, Toolbar, Ui, VariableList, ref;

  Ui = require('./Ui');

  ConfigManager = require('./ConfigManager');

  Toolbar = require('./view/Toolbar');

  StackList = require('./view/StackList');

  VariableList = require('./view/VariableList');

  BreakpointList = require('./view/BreakpointList');

  CustomPanel = require('./view/CustomPanel');

  ConfigList = require('./view/ConfigList');

  ref = require('atom'), CompositeDisposable = ref.CompositeDisposable, Emitter = ref.Emitter;

  module.exports = Debug = {
    provider: null,
    ui: null,
    toolbar: null,
    atomToolbar: null,
    stackList: null,
    variableList: null,
    breakpointList: null,
    customPanel: null,
    atomCustomPanel: null,
    disposable: null,
    buggers: [],
    activeBugger: null,
    breakpoints: [],
    configManager: null,
    activate: function(state) {
      var breakpoint, j, len, ref1;
      this.provider = new Emitter();
      this.provider.debug = this.debug.bind(this);
      this.provider.stop = this.stop.bind(this);
      this.provider.customDebug = this.customDebug.bind(this);
      this.provider["continue"] = this["continue"].bind(this);
      this.provider.pause = this.pause.bind(this);
      this.provider.pause_continue = (function(_this) {
        return function() {
          if (_this.ui.isPaused) {
            return _this["continue"]();
          } else {
            return _this.pause();
          }
        };
      })(this);
      this.provider.stepIn = this.stepIn.bind(this);
      this.provider.stepOver = this.stepOver.bind(this);
      this.provider.stepOut = this.stepOut.bind(this);
      this.provider.addBreakpoint = this.addBreakpoint.bind(this);
      this.provider.removeBreakpoint = this.removeBreakpoint.bind(this);
      this.provider.toggleBreakpoint = this.toggleBreakpoint.bind(this);
      this.provider.getBreakpoints = this.getBreakpoints.bind(this);
      this.provider.hasBreakpoint = this.hasBreakpoint.bind(this);
      this.stackList = new StackList(this);
      this.variableList = new VariableList(this);
      this.breakpointList = new BreakpointList(this);
      this.customPanel = new CustomPanel(this);
      this.ui = new Ui(this);
      this.toolbar = new Toolbar(this);
      this.atomToolbar = atom.workspace.addBottomPanel({
        item: this.toolbar.getElement(),
        visible: false,
        priority: 200
      });
      this.atomCustomPanel = atom.workspace.addBottomPanel({
        item: this.customPanel.getElement(),
        visible: false,
        priority: 200
      });
      this.customPanel.emitter.on('close', (function(_this) {
        return function() {
          return _this.atomCustomPanel.hide();
        };
      })(this));
      this.disposable = new CompositeDisposable;
      this.disposable.add(atom.commands.add('atom-workspace', {
        'dbg:custom-debug': (function(_this) {
          return function() {
            return _this.customDebug();
          };
        })(this)
      }));
      this.disposable.add(atom.commands.add('.tree-view .file', {
        'dbg:custom-debug': (function(_this) {
          return function() {
            var dir, path, paths, relativePath, selectedFile;
            selectedFile = document.querySelector('.tree-view .file.selected [data-path]');
            if (selectedFile !== null) {
              path = require('path');
              paths = atom.project.getPaths();
              relativePath = paths.length > 0 ? path.relative(paths[0], selectedFile.dataset.path) : selectedFile.dataset.path;
              dir = path.dirname(relativePath);
              if (dir === '.') {
                dir = '';
              }
              return _this.customDebug({
                path: relativePath,
                cwd: dir,
                args: []
              });
            }
          };
        })(this)
      }));
      this.disposable.add(atom.commands.add('atom-workspace', {
        'dbg:stop': (function(_this) {
          return function() {
            return _this.stop();
          };
        })(this)
      }));
      this.disposable.add(atom.commands.add('atom-workspace', {
        'dbg:continue': (function(_this) {
          return function() {
            return _this["continue"]();
          };
        })(this)
      }));
      this.disposable.add(atom.commands.add('atom-workspace', {
        'dbg:pause': (function(_this) {
          return function() {
            return _this.pause();
          };
        })(this)
      }));
      this.disposable.add(atom.commands.add('atom-workspace', {
        'dbg:debug': (function(_this) {
          return function() {
            if (_this.activeBugger) {
              if (_this.ui.isPaused) {
                return _this["continue"]();
              }
            } else {
              if (_this.configManager.getConfigOptions().length > 0) {
                return _this.selectConfig();
              } else {
                return _this.customDebug();
              }
            }
          };
        })(this)
      }));
      this.disposable.add(atom.commands.add('atom-workspace', {
        'dbg:pause-continue': (function(_this) {
          return function() {
            if (_this.activeBugger) {
              if (_this.ui.isPaused) {
                return _this["continue"]();
              } else {
                return _this.pause();
              }
            } else {
              if (_this.configManager.getConfigOptions().length > 0) {
                return _this.selectConfig();
              } else {
                return _this.customDebug();
              }
            }
          };
        })(this)
      }));
      this.disposable.add(atom.commands.add('atom-workspace', {
        'dbg:step-over': (function(_this) {
          return function() {
            return _this.stepOver();
          };
        })(this)
      }));
      this.disposable.add(atom.commands.add('atom-workspace', {
        'dbg:step-in': (function(_this) {
          return function() {
            return _this.stepIn();
          };
        })(this)
      }));
      this.disposable.add(atom.commands.add('atom-workspace', {
        'dbg:step-out': (function(_this) {
          return function() {
            return _this.stepOut();
          };
        })(this)
      }));
      this.disposable.add(atom.commands.add('atom-workspace', {
        'dbg:toggle-breakpoint': (function(_this) {
          return function() {
            var pos, textEditor;
            textEditor = atom.workspace.getActiveTextEditor();
            if (textEditor !== void 0) {
              pos = textEditor.getCursorBufferPosition();
              return _this.toggleBreakpoint(textEditor.getPath(), pos.row + 1);
            }
          };
        })(this)
      }));
      this.disposable.add(atom.commands.add('atom-workspace', {
        'dbg:clear-breakpoints': (function(_this) {
          return function() {
            return _this.clearBreakpoints();
          };
        })(this)
      }));
      this.disposable.add(atom.commands.add('.debug-custom-panel', {
        'dbg:custom-confirm': (function(_this) {
          return function() {
            return _this.customPanel.startDebugging();
          };
        })(this)
      }));
      this.disposable.add(atom.commands.add('atom-workspace', {
        'core:cancel': (function(_this) {
          return function() {
            return _this.atomCustomPanel.hide();
          };
        })(this)
      }));
      this.disposable.add(atom.commands.add('atom-workspace', {
        'dbg:select-config': (function(_this) {
          return function() {
            return _this.selectConfig();
          };
        })(this)
      }));
      this.disposable.add(atom.commands.add('atom-workspace', {
        'dbg:toggle-stack-list': (function(_this) {
          return function() {
            return _this.stackList.toggle();
          };
        })(this)
      }));
      this.disposable.add(atom.commands.add('atom-workspace', {
        'dbg:toggle-variable-list': (function(_this) {
          return function() {
            return _this.variableList.toggle();
          };
        })(this)
      }));
      this.disposable.add(atom.commands.add('atom-workspace', {
        'dbg:toggle-breakpoint-list': (function(_this) {
          return function() {
            return _this.breakpointList.toggle();
          };
        })(this)
      }));
      this.disposable.add(atom.workspace.observeTextEditors((function(_this) {
        return function(textEditor) {
          var disposed, observeGrammar;
          disposed = false;
          _this.disposable.add(observeGrammar = textEditor.observeGrammar(function(grammar) {
            if (/^source\./.test(grammar.scopeName)) {
              _this.installTextEditor(textEditor);
              disposed = true;
              return observeGrammar != null ? observeGrammar.dispose() : void 0;
            }
          }));
          if (disposed) {
            return observeGrammar.dispose();
          }
        };
      })(this)));
      if (state.breakpoints) {
        ref1 = state.breakpoints;
        for (j = 0, len = ref1.length; j < len; j++) {
          breakpoint = ref1[j];
          this.addBreakpoint(breakpoint.path, breakpoint.line);
        }
      }
      this.configManager = new ConfigManager;
      return this.configList = new ConfigList(this);
    },
    deactivate: function() {
      this.stackList.dispose();
      this.variableList.dispose();
      this.breakpointList.dispose();
      return this.disposable.dispose();
    },
    serialize: function() {
      var breakpoint, data, j, len, ref1;
      data = {
        breakpoints: []
      };
      ref1 = this.breakpoints;
      for (j = 0, len = ref1.length; j < len; j++) {
        breakpoint = ref1[j];
        data.breakpoints.push({
          path: breakpoint.path,
          line: breakpoint.line
        });
      }
      return data;
    },
    installTextEditor: function(textEditor) {
      var breakpoint, getEventRow, gutter, gutterContainer, j, len, marker, path, ref1, textEditorElement;
      path = textEditor.getPath();
      gutter = textEditor.gutterWithName('debug-gutter');
      if (gutter) {
        return;
      }
      gutter = textEditor.addGutter({
        name: 'debug-gutter',
        priority: -200,
        visible: true
      });
      ref1 = this.breakpoints;
      for (j = 0, len = ref1.length; j < len; j++) {
        breakpoint = ref1[j];
        if (breakpoint.path === path) {
          marker = textEditor.markBufferRange([[breakpoint.line - 1, 0], [breakpoint.line - 1, 0]]);
          gutter.decorateMarker(marker, {
            type: 'line-number',
            'class': 'debug-breakpoint'
          });
          breakpoint.markers.push(marker);
        }
      }
      getEventRow = function(event) {
        var bufferPos, screenPos;
        screenPos = textEditorElement.component.screenPositionForMouseEvent(event);
        bufferPos = textEditor.bufferPositionForScreenPosition(screenPos);
        return bufferPos.row;
      };
      textEditorElement = textEditor.getElement();
      gutterContainer = textEditorElement.querySelector('.gutter-container');
      gutterContainer.addEventListener('mousemove', (function(_this) {
        return function(event) {
          var ref2, row;
          row = getEventRow(event);
          marker = textEditor.markBufferRange([[row, 0], [row, 0]]);
          if ((ref2 = _this.breakpointHint) != null) {
            ref2.destroy();
          }
          return _this.breakpointHint = gutter.decorateMarker(marker, {
            type: 'line-number',
            'class': 'debug-breakpoint-hint'
          });
        };
      })(this));
      (atom.views.getView(gutter)).addEventListener('click', (function(_this) {
        return function(event) {
          var row;
          row = getEventRow(event);
          return _this.toggleBreakpoint(textEditor.getPath(), row + 1);
        };
      })(this));
      return gutterContainer.addEventListener('mouseout', (function(_this) {
        return function() {
          var ref2;
          if ((ref2 = _this.breakpointHint) != null) {
            ref2.destroy();
          }
          return _this.breakpointHint = null;
        };
      })(this));
    },
    debug: function(options) {
      return new Promise((function(_this) {
        return function(resolve) {
          var bugger, j, k, len, len1, paths, promises, ref1, ref2, resolved;
          if (!options) {
            _this.customDebug();
            resolve(true);
            return;
          }
          if (!options.basedir) {
            paths = atom.project.getPaths();
            if (paths.length > 0) {
              options.basedir = paths[0];
            }
          }
          if (options['debugger']) {
            ref1 = _this.buggers;
            for (j = 0, len = ref1.length; j < len; j++) {
              bugger = ref1[j];
              if (bugger.name === options['debugger']) {
                _this.debugWithDebugger(bugger, options);
                resolve(true);
                return;
              }
            }
            resolve(false);
            return;
          }
          resolved = false;
          promises = [];
          ref2 = _this.buggers;
          for (k = 0, len1 = ref2.length; k < len1; k++) {
            bugger = ref2[k];
            promises.push((bugger.canHandleOptions(options)).then(function(success) {
              if (!resolved && success) {
                resolved = true;
                resolve(true);
                return _this.debugWithDebugger(bugger, options);
              }
            }));
          }
          return (Promise.all(promises)).then(function() {
            if (!resolved) {
              if (options.path) {
                _this.ui.showError('Could not detect an installed debugger compatible with this file');
              } else {
                _this.ui.showError('Could not detect an installed debugger compatible withthese options');
              }
              return resolve(false);
            }
          });
        };
      })(this));
    },
    show: function() {
      this.atomToolbar.show();
      this.stackList.show().then((function(_this) {
        return function() {
          return _this.variableList.show();
        };
      })(this));
      return this.toolbar.updateButtons();
    },
    hide: function() {
      var ref1, ref2, ref3, ref4;
      if ((ref1 = this.atomToolbar) != null) {
        ref1.hide();
      }
      if ((ref2 = this.stackList) != null) {
        ref2.hide();
      }
      if ((ref3 = this.variableList) != null) {
        ref3.hide();
      }
      return (ref4 = this.breakpointList) != null ? ref4.hide() : void 0;
    },
    customDebug: function(options) {
      this.atomCustomPanel.show();
      if (options) {
        this.customPanel.setOptions(options);
      }
      return this.customPanel.focus();
    },
    openConfigFile: function() {
      return this.configManager.openConfigFile();
    },
    saveOptions: function(options) {
      return this.configManager.saveOptions(options);
    },
    selectConfig: function() {
      this.configList.setConfigs(this.configManager.getConfigOptions());
      return this.configList.show();
    },
    "continue": function() {
      var ref1;
      if (!this.ui.isPaused) {
        return;
      }
      this.ui.isStepping = false;
      return (ref1 = this.activeBugger) != null ? ref1["continue"]() : void 0;
    },
    pause: function() {
      var ref1;
      if (this.ui.isPaused) {
        return;
      }
      this.ui.isStepping = false;
      return (ref1 = this.activeBugger) != null ? ref1.pause() : void 0;
    },
    stepIn: function() {
      var ref1;
      this.ui.isStepping = true;
      return (ref1 = this.activeBugger) != null ? ref1.stepIn() : void 0;
    },
    stepOver: function() {
      var ref1;
      this.ui.isStepping = true;
      return (ref1 = this.activeBugger) != null ? ref1.stepOver() : void 0;
    },
    stepOut: function() {
      var ref1;
      if (this.ui.currentFrame < 1) {
        return;
      }
      this.ui.isStepping = true;
      return (ref1 = this.activeBugger) != null ? ref1.stepOut() : void 0;
    },
    addBreakpoint: function(path, line) {
      var breakpoint, editor, gutter, j, len, marker, markers, ref1, ref2;
      markers = [];
      breakpoint = {
        path: path,
        line: line,
        markers: markers
      };
      this.breakpoints.push(breakpoint);
      if ((ref1 = this.activeBugger) != null) {
        ref1.addBreakpoint(breakpoint);
      }
      ref2 = atom.workspace.getTextEditors();
      for (j = 0, len = ref2.length; j < len; j++) {
        editor = ref2[j];
        if (editor.getPath() === path) {
          this.installTextEditor(editor);
          gutter = editor.gutterWithName('debug-gutter');
          marker = editor.markBufferRange([[line - 1, 0], [line - 1, 0]]);
          gutter.decorateMarker(marker, {
            type: 'line-number',
            'class': 'debug-breakpoint'
          });
          markers.push(marker);
        }
      }
      return this.breakpointList.updateBreakpoints(this.breakpoints);
    },
    removeBreakpoint: function(path, line) {
      var breakpoint, editors, i, j, len, marker, ref1, ref2;
      if (this.breakpoints.length > 0) {
        editors = atom.workspace.getTextEditors();
        i = 0;
        while (i < this.breakpoints.length) {
          breakpoint = this.breakpoints[i];
          if (breakpoint.path === path && breakpoint.line === line) {
            this.breakpoints.splice(i, 1);
            if ((ref1 = this.activeBugger) != null) {
              ref1.removeBreakpoint(breakpoint);
            }
            ref2 = breakpoint.markers;
            for (j = 0, len = ref2.length; j < len; j++) {
              marker = ref2[j];
              marker.destroy();
            }
          } else {
            i++;
          }
        }
        return this.breakpointList.updateBreakpoints(this.breakpoints);
      }
    },
    clearBreakpoints: function() {
      var breakpoint, j, k, len, len1, marker, oldBreakpoints, ref1, ref2;
      oldBreakpoints = this.breakpoints;
      this.breakpoints = [];
      for (j = 0, len = oldBreakpoints.length; j < len; j++) {
        breakpoint = oldBreakpoints[j];
        ref1 = breakpoint.markers;
        for (k = 0, len1 = ref1.length; k < len1; k++) {
          marker = ref1[k];
          marker.destroy();
        }
        if ((ref2 = this.activeBugger) != null) {
          ref2.removeBreakpoint(breakpoint);
        }
      }
      return this.breakpointList.updateBreakpoints(this.breakpoints);
    },
    hasBreakpoint: function(path, line) {
      var breakpoint, j, len, ref1;
      ref1 = this.breakpoints;
      for (j = 0, len = ref1.length; j < len; j++) {
        breakpoint = ref1[j];
        if (breakpoint.path === path && breakpoint.line === line) {
          return true;
        }
      }
      return false;
    },
    toggleBreakpoint: function(path, line) {
      var breakpoint, editors, i, j, k, len, marker, ref1, ref2, ref3;
      if (this.breakpoints.length > 0) {
        editors = atom.workspace.getTextEditors();
        for (i = j = 0, ref1 = this.breakpoints.length - 1; 0 <= ref1 ? j <= ref1 : j >= ref1; i = 0 <= ref1 ? ++j : --j) {
          breakpoint = this.breakpoints[i];
          if (breakpoint.path === path && breakpoint.line === line) {
            this.breakpoints.splice(i, 1);
            if ((ref2 = this.activeBugger) != null) {
              ref2.removeBreakpoint(breakpoint);
            }
            ref3 = breakpoint.markers;
            for (k = 0, len = ref3.length; k < len; k++) {
              marker = ref3[k];
              marker.destroy();
            }
            this.breakpointList.updateBreakpoints(this.breakpoints);
            return;
          }
        }
      }
      return this.addBreakpoint(path, line);
    },
    getBreakpoints: function() {
      var breakpoint, j, len, ref1;
      ref1 = this.breakpoints;
      for (j = 0, len = ref1.length; j < len; j++) {
        breakpoint = ref1[j];
        return {
          path: breakpoint.path,
          line: breakpoint.line
        };
      }
    },
    stop: function() {
      if (this.activeBugger) {
        this.activeBugger.stop();
        this.activeBugger = null;
        this.ui.clearAll();
        this.hide();
        return this.provider.emit('stop');
      }
    },
    debugWithDebugger: function(bugger, options) {
      var breakpoint, breakpointsCopy;
      this.stop();
      this.ui.clear();
      this.activeBugger = bugger;
      this.show();
      breakpointsCopy = (function() {
        var j, len, ref1, results;
        ref1 = this.breakpoints;
        results = [];
        for (j = 0, len = ref1.length; j < len; j++) {
          breakpoint = ref1[j];
          results.push({
            path: breakpoint.path,
            line: breakpoint.line
          });
        }
        return results;
      }).call(this);
      bugger.debug(options, {
        breakpoints: breakpointsCopy,
        ui: this.ui
      });
      return this.provider.emit('start');
    },
    consumeDbgProvider: function(debug) {
      this.buggers.push(debug);
      return this.customPanel.updateDebuggers();
    },
    provideDbg: function() {
      return this.provider;
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbGVhcm4vLmF0b20vcGFja2FnZXMvZGJnL2xpYi9tYWluLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUEsRUFBQSxHQUFLLE9BQUEsQ0FBUSxNQUFSOztFQUNMLGFBQUEsR0FBZ0IsT0FBQSxDQUFRLGlCQUFSOztFQUVoQixPQUFBLEdBQVUsT0FBQSxDQUFRLGdCQUFSOztFQUNWLFNBQUEsR0FBWSxPQUFBLENBQVEsa0JBQVI7O0VBQ1osWUFBQSxHQUFlLE9BQUEsQ0FBUSxxQkFBUjs7RUFDZixjQUFBLEdBQWlCLE9BQUEsQ0FBUSx1QkFBUjs7RUFDakIsV0FBQSxHQUFjLE9BQUEsQ0FBUSxvQkFBUjs7RUFDZCxVQUFBLEdBQWEsT0FBQSxDQUFRLG1CQUFSOztFQUViLE1BQWlDLE9BQUEsQ0FBUSxNQUFSLENBQWpDLEVBQUMsNkNBQUQsRUFBc0I7O0VBRXRCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCLEtBQUEsR0FDaEI7SUFBQSxRQUFBLEVBQVUsSUFBVjtJQUNBLEVBQUEsRUFBSSxJQURKO0lBRUEsT0FBQSxFQUFTLElBRlQ7SUFHQSxXQUFBLEVBQWEsSUFIYjtJQUlBLFNBQUEsRUFBVyxJQUpYO0lBS0EsWUFBQSxFQUFjLElBTGQ7SUFNQSxjQUFBLEVBQWdCLElBTmhCO0lBT0EsV0FBQSxFQUFhLElBUGI7SUFRQSxlQUFBLEVBQWlCLElBUmpCO0lBU0EsVUFBQSxFQUFZLElBVFo7SUFVQSxPQUFBLEVBQVMsRUFWVDtJQVdBLFlBQUEsRUFBYyxJQVhkO0lBWUEsV0FBQSxFQUFhLEVBWmI7SUFhQSxhQUFBLEVBQWUsSUFiZjtJQWVBLFFBQUEsRUFBVSxTQUFDLEtBQUQ7QUFDVCxVQUFBO01BQUEsSUFBQyxDQUFBLFFBQUQsR0FBWSxJQUFJLE9BQUosQ0FBQTtNQUVaLElBQUMsQ0FBQSxRQUFRLENBQUMsS0FBVixHQUFrQixJQUFDLENBQUEsS0FBSyxDQUFD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aEI7SUFrV0EsSUFBQSxFQUFNLFNBQUE7TUFDTCxJQUFHLElBQUMsQ0FBQSxZQUFKO1FBQ0MsSUFBQyxDQUFBLFlBQVksQ0FBQyxJQUFkLENBQUE7UUFDQSxJQUFDLENBQUEsWUFBRCxHQUFnQjtRQUNoQixJQUFDLENBQUEsRUFBRSxDQUFDLFFBQUosQ0FBQTtRQUNBLElBQUMsQ0FBQSxJQUFELENBQUE7ZUFDQSxJQUFDLENBQUEsUUFBUSxDQUFDLElBQVYsQ0FBZSxNQUFmLEVBTEQ7O0lBREssQ0FsV047SUEwV0EsaUJBQUEsRUFBbUIsU0FBQyxNQUFELEVBQVMsT0FBVDtBQUNsQixVQUFBO01BQUEsSUFBQyxDQUFBLElBQUQsQ0FBQTtNQUNBLElBQUMsQ0FBQSxFQUFFLENBQUMsS0FBSixDQUFBO01BQ0EsSUFBQyxDQUFBLFlBQUQsR0FBZ0I7TUFDaEIsSUFBQyxDQUFBLElBQUQsQ0FBQTtNQUNBLGVBQUE7O0FBQW9CO0FBQUE7YUFBQSxzQ0FBQTs7dUJBQUE7WUFBQyxJQUFBLEVBQUssVUFBVSxDQUFDLElBQWpCO1lBQXVCLElBQUEsRUFBSyxVQUFVLENBQUMsSUFBdkM7O0FBQUE7OztNQUVwQixNQUFNLENBQUMsS0FBUCxDQUFhLE9BQWIsRUFDQztRQUFBLFdBQUEsRUFBYSxlQUFiO1FBQ0EsRUFBQSxFQUFJLElBQUMsQ0FBQSxFQURMO09BREQ7YUFHQSxJQUFDLENBQUEsUUFBUSxDQUFDLElBQVYsQ0FBZSxPQUFmO0lBVmtCLENBMVduQjtJQXNYQSxrQkFBQSxFQUFvQixTQUFDLEtBQUQ7TUFDbkIsSUFBQyxDQUFBLE9BQU8sQ0FBQyxJQUFULENBQWMsS0FBZDthQUNBLElBQUMsQ0FBQSxXQUFXLENBQUMsZUFBYixDQUFBO0lBRm1CLENBdFhwQjtJQTBYQSxVQUFBLEVBQVksU0FBQTtBQUNYLGFBQU8sSUFBQyxDQUFBO0lBREcsQ0ExWFo7O0FBYkQiLCJzb3VyY2VzQ29udGVudCI6WyJVaSA9IHJlcXVpcmUgJy4vVWknXG5Db25maWdNYW5hZ2VyID0gcmVxdWlyZSAnLi9Db25maWdNYW5hZ2VyJ1xuXG5Ub29sYmFyID0gcmVxdWlyZSAnLi92aWV3L1Rvb2xiYXInXG5TdGFja0xpc3QgPSByZXF1aXJlICcuL3ZpZXcvU3RhY2tMaXN0J1xuVmFyaWFibGVMaXN0ID0gcmVxdWlyZSAnLi92aWV3L1ZhcmlhYmxlTGlzdCdcbkJyZWFrcG9pbnRMaXN0ID0gcmVxdWlyZSAnLi92aWV3L0JyZWFrcG9pbnRMaXN0J1xuQ3VzdG9tUGFuZWwgPSByZXF1aXJlICcuL3ZpZXcvQ3VzdG9tUGFuZWwnXG5Db25maWdMaXN0ID0gcmVxdWlyZSAnLi92aWV3L0NvbmZpZ0xpc3QnXG5cbntDb21wb3NpdGVEaXNwb3NhYmxlLCBFbWl0dGVyfSA9IHJlcXVpcmUgJ2F0b20nXG5cbm1vZHVsZS5leHBvcnRzID0gRGVidWcgPVxuXHRwcm92aWRlcjogbnVsbFxuXHR1aTogbnVsbFxuXHR0b29sYmFyOiBudWxsXG5cdGF0b21Ub29sYmFyOiBudWxsXG5cdHN0YWNrTGlzdDogbnVsbFxuXHR2YXJpYWJsZUxpc3Q6IG51bGxcblx0YnJlYWtwb2ludExpc3Q6IG51bGxcblx0Y3VzdG9tUGFuZWw6IG51bGxcblx0YXRvbUN1c3RvbVBhbmVsOiBudWxsXG5cdGRpc3Bvc2FibGU6IG51bGxcblx0YnVnZ2VyczogW11cblx0YWN0aXZlQnVnZ2VyOiBudWxsXG5cdGJyZWFrcG9pbnRzOiBbXVxuXHRjb25maWdNYW5hZ2VyOiBudWxsXG5cblx0YWN0aXZhdGU6IChzdGF0ZSkgLT5cblx0XHRAcHJvdmlkZXIgPSBuZXcgRW1pdHRlcigpXG5cblx0XHRAcHJvdmlkZXIuZGVidWcgPSBAZGVidWcuYmluZCB0aGlzXG5cdFx0QHByb3ZpZGVyLnN0b3AgPSBAc3RvcC5iaW5kIHRoaXNcblxuXHRcdEBwcm92aWRlci5jdXN0b21EZWJ1ZyA9IEBjdXN0b21EZWJ1Zy5iaW5kIHRoaXNcblxuXHRcdEBwcm92aWRlci5jb250aW51ZSA9IEBjb250aW51ZS5iaW5kIHRoaXNcblx0XHRAcHJvdmlkZXIucGF1c2UgPSBAcGF1c2UuYmluZCB0aGlzXG5cdFx0QHByb3ZpZGVyLnBhdXNlX2NvbnRpbnVlID0gPT4gaWYgQHVpLmlzUGF1c2VkIHRoZW4gQGNvbnRpbnVlKCkgZWxzZSBAcGF1c2UoKVxuXG5cdFx0QHByb3ZpZGVyLnN0ZXBJbiA9IEBzdGVwSW4uYmluZCB0aGlzXG5cdFx0QHByb3ZpZGVyLnN0ZXBPdmVyID0gQHN0ZXBPdmVyLmJpbmQgdGhpc1xuXHRcdEBwcm92aWRlci5zdGVwT3V0ID0gQHN0ZXBPdXQuYmluZCB0aGlzXG5cblx0XHRAcHJvdmlkZXIuYWRkQnJlYWtwb2ludCA9IEBhZGRCcmVha3BvaW50LmJpbmQgdGhpc1xuXHRcdEBwcm92aWRlci5yZW1vdmVCcmVha3BvaW50ID0gQHJlbW92ZUJyZWFrcG9pbnQuYmluZCB0aGlzXG5cdFx0QHByb3ZpZGVyLnRvZ2dsZUJyZWFrcG9pbnQgPSBAdG9nZ2xlQnJlYWtwb2ludC5iaW5kIHRoaXNcblx0XHRAcHJvdmlkZXIuZ2V0QnJlYWtwb2ludHMgPSBAZ2V0QnJlYWtwb2ludHMuYmluZCB0aGlzXG5cdFx0QHByb3ZpZGVyLmhhc0JyZWFrcG9pbnQgPSBAaGFzQnJlYWtwb2ludC5iaW5kIHRoaXNcblxuXHRcdEBzdGFja0xpc3QgPSBuZXcgU3RhY2tMaXN0IHRoaXNcblx0XHRAdmFyaWFibGVMaXN0ID0gbmV3IFZhcmlhYmxlTGlzdCB0aGlzXG5cdFx0QGJyZWFrcG9pbnRMaXN0ID0gbmV3IEJyZWFrcG9pbnRMaXN0IHRoaXNcblx0XHRAY3VzdG9tUGFuZWwgPSBuZXcgQ3VzdG9tUGFuZWwgdGhpc1xuXG5cdFx0QHVpID0gbmV3IFVpIHRoaXNcblxuXHRcdEB0b29sYmFyID0gbmV3IFRvb2xiYXIgdGhpc1xuXHRcdEBhdG9tVG9vbGJhciA9IGF0b20ud29ya3NwYWNlLmFkZEJvdHRvbVBhbmVsIGl0ZW06IEB0b29sYmFyLmdldEVsZW1lbnQoKSwgdmlzaWJsZTogZmFsc2UsIHByaW9yaXR5OjIwMFxuXG5cdFx0QGF0b21DdXN0b21QYW5lbCA9IGF0b20ud29ya3NwYWNlLmFkZEJvdHRvbVBhbmVsIGl0ZW06IEBjdXN0b21QYW5lbC5nZXRFbGVtZW50KCksIHZpc2libGU6IGZhbHNlLCBwcmlvcml0eToyMDBcblx0XHRAY3VzdG9tUGFuZWwuZW1pdHRlci5vbiAnY2xvc2UnLCA9PlxuXHRcdFx0QGF0b21DdXN0b21QYW5lbC5oaWRlKClcblxuXHRcdEBkaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGVcblx0XHRAZGlzcG9zYWJsZS5hZGQgYXRvbS5jb21tYW5kcy5hZGQgJ2F0b20td29ya3NwYWNlJywgJ2RiZzpjdXN0b20tZGVidWcnOiA9PiBAY3VzdG9tRGVidWcoKVxuXHRcdEBkaXNwb3NhYmxlLmFkZCBhdG9tLmNvbW1hbmRzLmFkZCAnLnRyZWUtdmlldyAuZmlsZScsICdkYmc6Y3VzdG9tLWRlYnVnJzogPT5cblx0XHRcdHNlbGVjdGVkRmlsZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IgJy50cmVlLXZpZXcgLmZpbGUuc2VsZWN0ZWQgW2RhdGEtcGF0aF0nXG5cdFx0XHRpZiBzZWxlY3RlZEZpbGUhPW51bGxcblx0XHRcdFx0cGF0aCA9IHJlcXVpcmUgJ3BhdGgnXG5cdFx0XHRcdHBhdGhzID0gYXRvbS5wcm9qZWN0LmdldFBhdGhzKClcblx0XHRcdFx0cmVsYXRpdmVQYXRoID0gaWYgcGF0aHMubGVuZ3RoID4gMFxuXHRcdFx0XHRcdHBhdGgucmVsYXRpdmUgcGF0aHNbMF0sIHNlbGVjdGVkRmlsZS5kYXRhc2V0LnBhdGhcblx0XHRcdFx0ZWxzZVxuXHRcdFx0XHRcdHNlbGVjdGVkRmlsZS5kYXRhc2V0LnBhdGhcblxuXHRcdFx0XHRkaXIgPSBwYXRoLmRpcm5hbWUgcmVsYXRpdmVQYXRoXG5cdFx0XHRcdGlmIGRpciA9PSAnLicgdGhlbiBkaXIgPSAnJ1xuXG5cdFx0XHRcdEBjdXN0b21EZWJ1Z1xuXHRcdFx0XHRcdHBhdGg6IHJlbGF0aXZlUGF0aFxuXHRcdFx0XHRcdGN3ZDogZGlyXG5cdFx0XHRcdFx0YXJnczogW11cblx0XHRAZGlzcG9zYWJsZS5hZGQgYXRvbS5jb21tYW5kcy5hZGQgJ2F0b20td29ya3NwYWNlJywgJ2RiZzpzdG9wJzogPT4gQHN0b3AoKVxuXHRcdEBkaXNwb3NhYmxlLmFkZCBhdG9tLmNvbW1hbmRzLmFkZCAnYXRvbS13b3Jrc3BhY2UnLCAnZGJnOmNvbnRpbnVlJzogPT4gQGNvbnRpbnVlKClcblx0XHRAZGlzcG9zYWJsZS5hZGQgYXRvbS5jb21tYW5kcy5hZGQgJ2F0b20td29ya3NwYWNlJywgJ2RiZzpwYXVzZSc6ID0+IEBwYXVzZSgpXG5cdFx0QGRpc3Bvc2FibGUuYWRkIGF0b20uY29tbWFuZHMuYWRkICdhdG9tLXdvcmtzcGFjZScsICdkYmc6ZGVidWcnOiA9PlxuXHRcdFx0aWYgQGFjdGl2ZUJ1Z2dlclxuXHRcdFx0XHRpZiBAdWkuaXNQYXVzZWQgdGhlbiBAY29udGludWUoKVxuXHRcdFx0ZWxzZVxuXHRcdFx0XHRpZiBAY29uZmlnTWFuYWdlci5nZXRDb25maWdPcHRpb25zKCkubGVuZ3RoID4gMFxuXHRcdFx0XHRcdEBzZWxlY3RDb25maWcoKVxuXHRcdFx0XHRlbHNlXG5cdFx0XHRcdFx0QGN1c3RvbURlYnVnKClcblx0XHRcdFx0IyBvcHRpb25zID0gQGN1c3RvbVBhbmVsLmdldE9wdGlvbnMoKVxuXHRcdFx0XHQjIGlmIG9wdGlvbnMucGF0aFxuXHRcdFx0XHQjIFx0QGRlYnVnIG9wdGlvbnNcblx0XHRcdFx0IyBlbHNlXG5cdFx0XHRcdCMgXHRAY3VzdG9tRGVidWcoKVxuXHRcdEBkaXNwb3NhYmxlLmFkZCBhdG9tLmNvbW1hbmRzLmFkZCAnYXRvbS13b3Jrc3BhY2UnLCAnZGJnOnBhdXNlLWNvbnRpbnVlJzogPT5cblx0XHRcdGlmIEBhY3RpdmVCdWdnZXJcblx0XHRcdFx0aWYgQHVpLmlzUGF1c2VkIHRoZW4gQGNvbnRpbnVlKCkgZWxzZSBAcGF1c2UoKVxuXHRcdFx0ZWxzZVxuXHRcdFx0XHRpZiBAY29uZmlnTWFuYWdlci5nZXRDb25maWdPcHRpb25zKCkubGVuZ3RoID4gMFxuXHRcdFx0XHRcdEBzZWxlY3RDb25maWcoKVxuXHRcdFx0XHRlbHNlXG5cdFx0XHRcdFx0QGN1c3RvbURlYnVnKClcblx0XHRcdFx0IyBvcHRpb25zID0gQGN1c3RvbVBhbmVsLmdldE9wdGlvbnMoKVxuXHRcdFx0XHQjIGlmIG9wdGlvbnMucGF0aFxuXHRcdFx0XHQjIFx0QGRlYnVnIG9wdGlvbnNcblx0XHRcdFx0IyBlbHNlXG5cdFx0XHRcdCMgXHRAY3VzdG9tRGVidWcoKVxuXHRcdEBkaXNwb3NhYmxlLmFkZCBhdG9tLmNvbW1hbmRzLmFkZCAnYXRvbS13b3Jrc3BhY2UnLCAnZGJnOnN0ZXAtb3Zlcic6ID0+IEBzdGVwT3ZlcigpXG5cdFx0QGRpc3Bvc2FibGUuYWRkIGF0b20uY29tbWFuZHMuYWRkICdhdG9tLXdvcmtzcGFjZScsICdkYmc6c3RlcC1pbic6ID0+IEBzdGVwSW4oKVxuXHRcdEBkaXNwb3NhYmxlLmFkZCBhdG9tLmNvbW1hbmRzLmFkZCAnYXRvbS13b3Jrc3BhY2UnLCAnZGJnOnN0ZXAtb3V0JzogPT4gQHN0ZXBPdXQoKVxuXHRcdEBkaXNwb3NhYmxlLmFkZCBhdG9tLmNvbW1hbmRzLmFkZCAnYXRvbS13b3Jrc3BhY2UnLCAnZGJnOnRvZ2dsZS1icmVha3BvaW50JzogPT5cblx0XHRcdHRleHRFZGl0b3IgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKClcblx0XHRcdGlmIHRleHRFZGl0b3IhPXVuZGVmaW5lZFxuXHRcdFx0XHRwb3MgPSB0ZXh0RWRpdG9yLmdldEN1cnNvckJ1ZmZlclBvc2l0aW9uKClcblx0XHRcdFx0QHRvZ2dsZUJyZWFrcG9pbnQgdGV4dEVkaXRvci5nZXRQYXRoKCksIHBvcy5yb3crMVxuXHRcdEBkaXNwb3NhYmxlLmFkZCBhdG9tLmNvbW1hbmRzLmFkZCAnYXRvbS13b3Jrc3BhY2UnLCAnZGJnOmNsZWFyLWJyZWFrcG9pbnRzJzogPT5cblx0XHRcdEBjbGVhckJyZWFrcG9pbnRzKClcblx0XHRAZGlzcG9zYWJsZS5hZGQgYXRvbS5jb21tYW5kcy5hZGQgJy5kZWJ1Zy1jdXN0b20tcGFuZWwnLCAnZGJnOmN1c3RvbS1jb25maXJtJzogPT4gQGN1c3RvbVBhbmVsLnN0YXJ0RGVidWdnaW5nKClcblx0XHRAZGlzcG9zYWJsZS5hZGQgYXRvbS5jb21tYW5kcy5hZGQgJ2F0b20td29ya3NwYWNlJywgJ2NvcmU6Y2FuY2VsJzogPT4gQGF0b21DdXN0b21QYW5lbC5oaWRlKClcblx0XHRAZGlzcG9zYWJsZS5hZGQgYXRvbS5jb21tYW5kcy5hZGQgJ2F0b20td29ya3NwYWNlJywgJ2RiZzpzZWxlY3QtY29uZmlnJzogPT4gQHNlbGVjdENvbmZpZygpXG5cblx0XHRAZGlzcG9zYWJsZS5hZGQgYXRvbS5jb21tYW5kcy5hZGQgJ2F0b20td29ya3NwYWNlJywgJ2RiZzp0b2dnbGUtc3RhY2stbGlzdCc6ID0+IEBzdGFja0xpc3QudG9nZ2xlKClcblx0XHRAZGlzcG9zYWJsZS5hZGQgYXRvbS5jb21tYW5kcy5hZGQgJ2F0b20td29ya3NwYWNlJywgJ2RiZzp0b2dnbGUtdmFyaWFibGUtbGlzdCc6ID0+IEB2YXJpYWJsZUxpc3QudG9nZ2xlKClcblx0XHRAZGlzcG9zYWJsZS5hZGQgYXRvbS5jb21tYW5kcy5hZGQgJ2F0b20td29ya3NwYWNlJywgJ2RiZzp0b2dnbGUtYnJlYWtwb2ludC1saXN0JzogPT4gQGJyZWFrcG9pbnRMaXN0LnRvZ2dsZSgpXG5cblx0XHQjIGluc3RhbGwgYW55IHRleHQgZWRpdG9ycyB3aGljaCBhcmUgb3IgYmVjb21lIHNvdXJjZWNvZGUgKGdpdmUgdGhlbSBhIGNsaWNrYWJsZSBndXR0ZXIpXG5cdFx0QGRpc3Bvc2FibGUuYWRkIGF0b20ud29ya3NwYWNlLm9ic2VydmVUZXh0RWRpdG9ycyAodGV4dEVkaXRvcikgPT5cblx0XHRcdGRpc3Bvc2VkID0gZmFsc2Vcblx0XHRcdEBkaXNwb3NhYmxlLmFkZCBvYnNlcnZlR3JhbW1hciA9IHRleHRFZGl0b3Iub2JzZXJ2ZUdyYW1tYXIgKGdyYW1tYXIpID0+XG5cdFx0XHRcdGlmIC9ec291cmNlXFwuLy50ZXN0IGdyYW1tYXIuc2NvcGVOYW1lXG5cdFx0XHRcdFx0QGluc3RhbGxUZXh0RWRpdG9yIHRleHRFZGl0b3Jcblx0XHRcdFx0XHRkaXNwb3NlZCA9IHRydWVcblx0XHRcdFx0XHRvYnNlcnZlR3JhbW1hcj8uZGlzcG9zZSgpXG5cblx0XHRcdGlmIGRpc3Bvc2VkIHRoZW4gb2JzZXJ2ZUdyYW1tYXIuZGlzcG9zZSgpXG5cblx0XHQjIHJlc3RvcmUgcHJldmlvdXMgYnJlYWtwb2ludHNcblx0XHRpZiBzdGF0ZS5icmVha3BvaW50c1xuXHRcdFx0Zm9yIGJyZWFrcG9pbnQgaW4gc3RhdGUuYnJlYWtwb2ludHNcblx0XHRcdFx0QGFkZEJyZWFrcG9pbnQgYnJlYWtwb2ludC5wYXRoLCBicmVha3BvaW50LmxpbmVcblxuXHRcdEBjb25maWdNYW5hZ2VyID0gbmV3IENvbmZpZ01hbmFnZXJcblx0XHRAY29uZmlnTGlzdCA9IG5ldyBDb25maWdMaXN0IHRoaXNcblxuXHRkZWFjdGl2YXRlOiAtPlxuXHRcdEBzdGFja0xpc3QuZGlzcG9zZSgpXG5cdFx0QHZhcmlhYmxlTGlzdC5kaXNwb3NlKClcblx0XHRAYnJlYWtwb2ludExpc3QuZGlzcG9zZSgpXG5cdFx0QGRpc3Bvc2FibGUuZGlzcG9zZSgpXG5cblx0c2VyaWFsaXplOiAtPlxuXHRcdGRhdGEgPVxuXHRcdFx0YnJlYWtwb2ludHM6IFtdXG5cblx0XHRmb3IgYnJlYWtwb2ludCBpbiBAYnJlYWtwb2ludHNcblx0XHRcdGRhdGEuYnJlYWtwb2ludHMucHVzaFxuXHRcdFx0XHRwYXRoOiBicmVha3BvaW50LnBhdGhcblx0XHRcdFx0bGluZTogYnJlYWtwb2ludC5saW5lXG5cblx0XHRyZXR1cm4gZGF0YVxuXG5cdGluc3RhbGxUZXh0RWRpdG9yOiAodGV4dEVkaXRvcikgLT5cblx0XHRwYXRoID0gdGV4dEVkaXRvci5nZXRQYXRoKClcblx0XHRndXR0ZXIgPSB0ZXh0RWRpdG9yLmd1dHRlcldpdGhOYW1lKCdkZWJ1Zy1ndXR0ZXInKVxuXG5cdFx0aWYgZ3V0dGVyIHRoZW4gcmV0dXJuXG5cblx0XHRndXR0ZXIgPSB0ZXh0RWRpdG9yLmFkZEd1dHRlclxuXHRcdFx0bmFtZTogJ2RlYnVnLWd1dHRlcidcblx0XHRcdHByaW9yaXR5OiAtMjAwXG5cdFx0XHR2aXNpYmxlOiB0cnVlXG5cblx0XHRmb3IgYnJlYWtwb2ludCBpbiBAYnJlYWtwb2ludHNcblx0XHRcdGlmIGJyZWFrcG9pbnQucGF0aCA9PSBwYXRoXG5cdFx0XHRcdG1hcmtlciA9IHRleHRFZGl0b3IubWFya0J1ZmZlclJhbmdlIFtbYnJlYWtwb2ludC5saW5lLTEsIDBdLCBbYnJlYWtwb2ludC5saW5lLTEsIDBdXVxuXHRcdFx0XHRndXR0ZXIuZGVjb3JhdGVNYXJrZXIgbWFya2VyLFxuXHRcdFx0XHRcdHR5cGU6ICdsaW5lLW51bWJlcidcblx0XHRcdFx0XHQnY2xhc3MnOiAnZGVidWctYnJlYWtwb2ludCdcblx0XHRcdFx0YnJlYWtwb2ludC5tYXJrZXJzLnB1c2ggbWFya2VyXG5cblx0XHRnZXRFdmVudFJvdyA9IChldmVudCkgLT5cblx0XHRcdHNjcmVlblBvcyA9IHRleHRFZGl0b3JFbGVtZW50LmNvbXBvbmVudC5zY3JlZW5Qb3NpdGlvbkZvck1vdXNlRXZlbnQgZXZlbnRcblx0XHRcdGJ1ZmZlclBvcyA9IHRleHRFZGl0b3IuYnVmZmVyUG9zaXRpb25Gb3JTY3JlZW5Qb3NpdGlvbiBzY3JlZW5Qb3Ncblx0XHRcdHJldHVybiBidWZmZXJQb3Mucm93XG5cblx0XHR0ZXh0RWRpdG9yRWxlbWVudCA9IHRleHRFZGl0b3IuZ2V0RWxlbWVudCgpXG5cdFx0Z3V0dGVyQ29udGFpbmVyID0gdGV4dEVkaXRvckVsZW1lbnQucXVlcnlTZWxlY3RvciAnLmd1dHRlci1jb250YWluZXInXG5cdFx0Z3V0dGVyQ29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIgJ21vdXNlbW92ZScsIChldmVudCkgPT5cblx0XHRcdHJvdyA9IGdldEV2ZW50Um93IGV2ZW50XG5cblx0XHRcdG1hcmtlciA9IHRleHRFZGl0b3IubWFya0J1ZmZlclJhbmdlIFtbcm93LCAwXSwgW3JvdywgMF1dXG5cdFx0XHRAYnJlYWtwb2ludEhpbnQ/LmRlc3Ryb3koKVxuXHRcdFx0QGJyZWFrcG9pbnRIaW50ID0gZ3V0dGVyLmRlY29yYXRlTWFya2VyIG1hcmtlcixcblx0XHRcdFx0dHlwZTogJ2xpbmUtbnVtYmVyJ1xuXHRcdFx0XHQnY2xhc3MnOiAnZGVidWctYnJlYWtwb2ludC1oaW50J1xuXG5cdFx0KGF0b20udmlld3MuZ2V0VmlldyBndXR0ZXIpLmFkZEV2ZW50TGlzdGVuZXIgJ2NsaWNrJywgKGV2ZW50KSA9PlxuXHRcdFx0cm93ID0gZ2V0RXZlbnRSb3cgZXZlbnRcblx0XHRcdEB0b2dnbGVCcmVha3BvaW50IHRleHRFZGl0b3IuZ2V0UGF0aCgpLCByb3crMVxuXG5cdFx0Z3V0dGVyQ29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIgJ21vdXNlb3V0JywgPT5cblx0XHRcdEBicmVha3BvaW50SGludD8uZGVzdHJveSgpXG5cdFx0XHRAYnJlYWtwb2ludEhpbnQgPSBudWxsXG5cblx0ZGVidWc6IChvcHRpb25zKSAtPlxuXHRcdHJldHVybiBuZXcgUHJvbWlzZSAocmVzb2x2ZSkgPT5cblx0XHRcdGlmICFvcHRpb25zXG5cdFx0XHRcdEBjdXN0b21EZWJ1ZygpXG5cdFx0XHRcdHJlc29sdmUgdHJ1ZVxuXHRcdFx0XHRyZXR1cm5cblxuXHRcdFx0aWYgIW9wdGlvbnMuYmFzZWRpclxuXHRcdFx0XHRwYXRocyA9IGF0b20ucHJvamVjdC5nZXRQYXRocygpXG5cdFx0XHRcdG9wdGlvbnMuYmFzZWRpciA9IHBhdGhzWzBdIGlmIHBhdGhzLmxlbmd0aD4wXG5cblx0XHRcdGlmIG9wdGlvbnNbJ2RlYnVnZ2VyJ11cblx0XHRcdFx0Zm9yIGJ1Z2dlciBpbiBAYnVnZ2Vyc1xuXHRcdFx0XHRcdGlmIGJ1Z2dlci5uYW1lID09IG9wdGlvbnNbJ2RlYnVnZ2VyJ11cblx0XHRcdFx0XHRcdEBkZWJ1Z1dpdGhEZWJ1Z2dlciBidWdnZXIsIG9wdGlvbnNcblx0XHRcdFx0XHRcdHJlc29sdmUgdHJ1ZVxuXHRcdFx0XHRcdFx0cmV0dXJuXG5cblx0XHRcdFx0cmVzb2x2ZSBmYWxzZVxuXHRcdFx0XHRyZXR1cm5cblxuXHRcdFx0cmVzb2x2ZWQgPSBmYWxzZVxuXHRcdFx0cHJvbWlzZXMgPSBbXVxuXHRcdFx0Zm9yIGJ1Z2dlciBpbiBAYnVnZ2Vyc1xuXHRcdFx0XHRwcm9taXNlcy5wdXNoIChidWdnZXIuY2FuSGFuZGxlT3B0aW9ucyBvcHRpb25zKS50aGVuIChzdWNjZXNzKSA9PlxuXHRcdFx0XHRcdGlmICFyZXNvbHZlZCBhbmQgc3VjY2Vzc1xuXHRcdFx0XHRcdFx0cmVzb2x2ZWQgPSB0cnVlXG5cdFx0XHRcdFx0XHRyZXNvbHZlIHRydWVcblx0XHRcdFx0XHRcdEBkZWJ1Z1dpdGhEZWJ1Z2dlciBidWdnZXIsIG9wdGlvbnNcblxuXHRcdFx0KFByb21pc2UuYWxsIHByb21pc2VzKS50aGVuID0+XG5cdFx0XHRcdGlmICFyZXNvbHZlZFxuXHRcdFx0XHRcdGlmIG9wdGlvbnMucGF0aFxuXHRcdFx0XHRcdFx0QHVpLnNob3dFcnJvciAnQ291bGQgbm90IGRldGVjdCBhbiBpbnN0YWxsZWQgZGVidWdnZXIgY29tcGF0aWJsZSB3aXRoIHRoaXMgZmlsZSdcblx0XHRcdFx0XHRlbHNlXG5cdFx0XHRcdFx0XHRAdWkuc2hvd0Vycm9yICdDb3VsZCBub3QgZGV0ZWN0IGFuIGluc3RhbGxlZCBkZWJ1Z2dlciBjb21wYXRpYmxlIHdpdGh0aGVzZSBvcHRpb25zJ1xuXHRcdFx0XHRcdHJlc29sdmUgZmFsc2VcblxuXHRzaG93OiAtPlxuXHRcdEBhdG9tVG9vbGJhci5zaG93KClcblx0XHRAc3RhY2tMaXN0LnNob3coKS50aGVuID0+XG5cdFx0XHRAdmFyaWFibGVMaXN0LnNob3coKVxuXHRcdEB0b29sYmFyLnVwZGF0ZUJ1dHRvbnMoKVxuXG5cdGhpZGU6IC0+XG5cdFx0QGF0b21Ub29sYmFyPy5oaWRlKClcblx0XHRAc3RhY2tMaXN0Py5oaWRlKClcblx0XHRAdmFyaWFibGVMaXN0Py5oaWRlKClcblx0XHRAYnJlYWtwb2ludExpc3Q/LmhpZGUoKVxuXG5cdGN1c3RvbURlYnVnOiAob3B0aW9ucykgLT5cblx0XHRAYXRvbUN1c3RvbVBhbmVsLnNob3coKVxuXHRcdGlmIG9wdGlvbnMgdGhlbiBAY3VzdG9tUGFuZWwuc2V0T3B0aW9ucyBvcHRpb25zXG5cdFx0QGN1c3RvbVBhbmVsLmZvY3VzKClcblxuXHRvcGVuQ29uZmlnRmlsZTogLT5cblx0XHRAY29uZmlnTWFuYWdlci5vcGVuQ29uZmlnRmlsZSgpXG5cblx0c2F2ZU9wdGlvbnM6IChvcHRpb25zKSAtPlxuXHRcdEBjb25maWdNYW5hZ2VyLnNhdmVPcHRpb25zIG9wdGlvbnNcblxuXHRzZWxlY3RDb25maWc6IC0+XG5cdFx0QGNvbmZpZ0xpc3Quc2V0Q29uZmlncyBAY29uZmlnTWFuYWdlci5nZXRDb25maWdPcHRpb25zKClcblx0XHRAY29uZmlnTGlzdC5zaG93KClcblxuXHRjb250aW51ZTogLT5cblx0XHR1bmxlc3MgQHVpLmlzUGF1c2VkIHRoZW4gcmV0dXJuXG5cdFx0QHVpLmlzU3RlcHBpbmcgPSBmYWxzZVxuXHRcdEBhY3RpdmVCdWdnZXI/LmNvbnRpbnVlKClcblx0cGF1c2U6IC0+XG5cdFx0aWYgQHVpLmlzUGF1c2VkIHRoZW4gcmV0dXJuXG5cdFx0QHVpLmlzU3RlcHBpbmcgPSBmYWxzZVxuXHRcdEBhY3RpdmVCdWdnZXI/LnBhdXNlKClcblxuXHRzdGVwSW46IC0+XG5cdFx0QHVpLmlzU3RlcHBpbmcgPSB0cnVlXG5cdFx0QGFjdGl2ZUJ1Z2dlcj8uc3RlcEluKClcblx0c3RlcE92ZXI6IC0+XG5cdFx0QHVpLmlzU3RlcHBpbmcgPSB0cnVlXG5cdFx0QGFjdGl2ZUJ1Z2dlcj8uc3RlcE92ZXIoKVxuXHRzdGVwT3V0OiAtPlxuXHRcdGlmIEB1aS5jdXJyZW50RnJhbWUgPCAxIHRoZW4gcmV0dXJuXG5cdFx0QHVpLmlzU3RlcHBpbmcgPSB0cnVlXG5cdFx0QGFjdGl2ZUJ1Z2dlcj8uc3RlcE91dCgpXG5cblx0YWRkQnJlYWtwb2ludDogKHBhdGgsIGxpbmUpIC0+XG5cdFx0bWFya2VycyA9IFtdXG5cdFx0YnJlYWtwb2ludCA9XG5cdFx0XHRwYXRoOiBwYXRoXG5cdFx0XHRsaW5lOiBsaW5lXG5cdFx0XHRtYXJrZXJzOiBtYXJrZXJzXG5cdFx0QGJyZWFrcG9pbnRzLnB1c2ggYnJlYWtwb2ludFxuXG5cdFx0QGFjdGl2ZUJ1Z2dlcj8uYWRkQnJlYWtwb2ludCBicmVha3BvaW50XG5cblx0XHRmb3IgZWRpdG9yIGluIGF0b20ud29ya3NwYWNlLmdldFRleHRFZGl0b3JzKClcblx0XHRcdGlmIGVkaXRvci5nZXRQYXRoKCkgPT0gcGF0aFxuXHRcdFx0XHRAaW5zdGFsbFRleHRFZGl0b3IgZWRpdG9yXG5cdFx0XHRcdGd1dHRlciA9IGVkaXRvci5ndXR0ZXJXaXRoTmFtZSAnZGVidWctZ3V0dGVyJ1xuXHRcdFx0XHRtYXJrZXIgPSBlZGl0b3IubWFya0J1ZmZlclJhbmdlIFtbbGluZS0xLCAwXSwgW2xpbmUtMSwgMF1dXG5cdFx0XHRcdGd1dHRlci5kZWNvcmF0ZU1hcmtlciBtYXJrZXIsXG5cdFx0XHRcdFx0dHlwZTogJ2xpbmUtbnVtYmVyJ1xuXHRcdFx0XHRcdCdjbGFzcyc6ICdkZWJ1Zy1icmVha3BvaW50J1xuXHRcdFx0XHRtYXJrZXJzLnB1c2ggbWFya2VyXG5cblx0XHRAYnJlYWtwb2ludExpc3QudXBkYXRlQnJlYWtwb2ludHMgQGJyZWFrcG9pbnRzXG5cblx0cmVtb3ZlQnJlYWtwb2ludDogKHBhdGgsIGxpbmUpIC0+XG5cdFx0aWYgQGJyZWFrcG9pbnRzLmxlbmd0aD4wXG5cdFx0XHRlZGl0b3JzID0gYXRvbS53b3Jrc3BhY2UuZ2V0VGV4dEVkaXRvcnMoKVxuXHRcdFx0aSA9IDBcblx0XHRcdHdoaWxlIGkgPCBAYnJlYWtwb2ludHMubGVuZ3RoXG5cdFx0XHRcdGJyZWFrcG9pbnQgPSBAYnJlYWtwb2ludHNbaV1cblx0XHRcdFx0aWYgYnJlYWtwb2ludC5wYXRoPT1wYXRoIGFuZCBicmVha3BvaW50LmxpbmU9PWxpbmVcblx0XHRcdFx0XHRAYnJlYWtwb2ludHMuc3BsaWNlIGksMVxuXHRcdFx0XHRcdEBhY3RpdmVCdWdnZXI/LnJlbW92ZUJyZWFrcG9pbnQgYnJlYWtwb2ludFxuXHRcdFx0XHRcdGZvciBtYXJrZXIgaW4gYnJlYWtwb2ludC5tYXJrZXJzXG5cdFx0XHRcdFx0XHRtYXJrZXIuZGVzdHJveSgpXG5cdFx0XHRcdGVsc2Vcblx0XHRcdFx0XHRpKytcblxuXHRcdFx0QGJyZWFrcG9pbnRMaXN0LnVwZGF0ZUJyZWFrcG9pbnRzIEBicmVha3BvaW50c1xuXG5cdGNsZWFyQnJlYWtwb2ludHM6IC0+XG5cdFx0b2xkQnJlYWtwb2ludHMgPSBAYnJlYWtwb2ludHNcblx0XHRAYnJlYWtwb2ludHMgPSBbXVxuXG5cdFx0Zm9yIGJyZWFrcG9pbnQgaW4gb2xkQnJlYWtwb2ludHNcblx0XHRcdGZvciBtYXJrZXIgaW4gYnJlYWtwb2ludC5tYXJrZXJzXG5cdFx0XHRcdG1hcmtlci5kZXN0cm95KClcblx0XHRcdEBhY3RpdmVCdWdnZXI/LnJlbW92ZUJyZWFrcG9pbnQgYnJlYWtwb2ludFxuXG5cdFx0QGJyZWFrcG9pbnRMaXN0LnVwZGF0ZUJyZWFrcG9pbnRzIEBicmVha3BvaW50c1xuXG5cdGhhc0JyZWFrcG9pbnQ6IChwYXRoLCBsaW5lKSAtPlxuXHRcdGZvciBicmVha3BvaW50IGluIEBicmVha3BvaW50c1xuXHRcdFx0aWYgYnJlYWtwb2ludC5wYXRoPT1wYXRoIGFuZCBicmVha3BvaW50LmxpbmU9PWxpbmVcblx0XHRcdFx0cmV0dXJuIHRydWVcblx0XHRyZXR1cm4gZmFsc2VcblxuXHR0b2dnbGVCcmVha3BvaW50OiAocGF0aCwgbGluZSkgLT5cblx0XHRpZiBAYnJlYWtwb2ludHMubGVuZ3RoPjBcblx0XHRcdGVkaXRvcnMgPSBhdG9tLndvcmtzcGFjZS5nZXRUZXh0RWRpdG9ycygpXG5cdFx0XHRmb3IgaSBpbiBbMC4uQGJyZWFrcG9pbnRzLmxlbmd0aC0xXVxuXHRcdFx0XHRicmVha3BvaW50ID0gQGJyZWFrcG9pbnRzW2ldXG5cdFx0XHRcdGlmIGJyZWFrcG9pbnQucGF0aD09cGF0aCBhbmQgYnJlYWtwb2ludC5saW5lPT1saW5lXG5cdFx0XHRcdFx0QGJyZWFrcG9pbnRzLnNwbGljZSBpLDFcblx0XHRcdFx0XHRAYWN0aXZlQnVnZ2VyPy5yZW1vdmVCcmVha3BvaW50IGJyZWFrcG9pbnRcblx0XHRcdFx0XHRmb3IgbWFya2VyIGluIGJyZWFrcG9pbnQubWFya2Vyc1xuXHRcdFx0XHRcdFx0bWFya2VyLmRlc3Ryb3koKVxuXHRcdFx0XHRcdEBicmVha3BvaW50TGlzdC51cGRhdGVCcmVha3BvaW50cyBAYnJlYWtwb2ludHNcblx0XHRcdFx0XHRyZXR1cm5cblxuXHRcdEBhZGRCcmVha3BvaW50IHBhdGgsIGxpbmVcblxuXHRnZXRCcmVha3BvaW50czogLT5cblx0XHRyZXR1cm4ge3BhdGg6YnJlYWtwb2ludC5wYXRoLCBsaW5lOmJyZWFrcG9pbnQubGluZX0gZm9yIGJyZWFrcG9pbnQgaW4gQGJyZWFrcG9pbnRzXG5cblx0c3RvcDogLT5cblx0XHRpZiBAYWN0aXZlQnVnZ2VyXG5cdFx0XHRAYWN0aXZlQnVnZ2VyLnN0b3AoKVxuXHRcdFx0QGFjdGl2ZUJ1Z2dlciA9IG51bGxcblx0XHRcdEB1aS5jbGVhckFsbCgpXG5cdFx0XHRAaGlkZSgpXG5cdFx0XHRAcHJvdmlkZXIuZW1pdCAnc3RvcCdcblxuXHRkZWJ1Z1dpdGhEZWJ1Z2dlcjogKGJ1Z2dlciwgb3B0aW9ucykgLT5cblx0XHRAc3RvcCgpXG5cdFx0QHVpLmNsZWFyKClcblx0XHRAYWN0aXZlQnVnZ2VyID0gYnVnZ2VyXG5cdFx0QHNob3coKVxuXHRcdGJyZWFrcG9pbnRzQ29weSA9ICgge3BhdGg6YnJlYWtwb2ludC5wYXRoLCBsaW5lOmJyZWFrcG9pbnQubGluZX0gZm9yIGJyZWFrcG9pbnQgaW4gQGJyZWFrcG9pbnRzIClcblxuXHRcdGJ1Z2dlci5kZWJ1ZyBvcHRpb25zLFxuXHRcdFx0YnJlYWtwb2ludHM6IGJyZWFrcG9pbnRzQ29weVxuXHRcdFx0dWk6IEB1aVxuXHRcdEBwcm92aWRlci5lbWl0ICdzdGFydCdcblxuXHRjb25zdW1lRGJnUHJvdmlkZXI6IChkZWJ1ZykgLT5cblx0XHRAYnVnZ2Vycy5wdXNoIGRlYnVnXG5cdFx0QGN1c3RvbVBhbmVsLnVwZGF0ZURlYnVnZ2VycygpXG5cblx0cHJvdmlkZURiZzogLT5cblx0XHRyZXR1cm4gQHByb3ZpZGVyXG4iXX0=
