(function() {
  var BufferedProcess, CompositeDisposable, DbgGdb, Emitter, escapePath, fs, parseMi2, path, prettyValue, ref;

  parseMi2 = require('./parseMi2');

  fs = require('fs');

  path = require('path');

  ref = require('atom'), BufferedProcess = ref.BufferedProcess, CompositeDisposable = ref.CompositeDisposable, Emitter = ref.Emitter;

  escapePath = function(path) {
    return (path.replace(/\\/g, '/')).replace(/[\s\t\n]/g, '\\ ');
  };

  prettyValue = function(value) {
    return (value.replace(/({|,)/g, '$1\n')).replace(/(})/g, '\n$1');
  };

  module.exports = DbgGdb = {
    config: {
      logToConsole: {
        title: 'Log to developer console',
        description: 'For debugging GDB problems',
        type: 'boolean',
        "default": false
      }
    },
    dbg: null,
    logToConsole: false,
    breakpoints: [],
    ui: null,
    process: null,
    processAwaiting: false,
    processQueued: [],
    variableObjects: {},
    variableRootObjects: {},
    errorEncountered: null,
    thread: 1,
    frame: 0,
    outputPanel: null,
    showOutputPanelNext: false,
    unseenOutputPanelContent: false,
    closedNaturally: false,
    interactiveSession: null,
    miEmitter: null,
    activate: function(state) {
      require('atom-package-deps').install('dbg-gdb');
      return atom.config.observe('dbg-gdb.logToConsole', (function(_this) {
        return function(set) {
          return _this.logToConsole = set;
        };
      })(this));
    },
    consumeOutputPanel: function(outputPanel) {
      return this.outputPanel = outputPanel;
    },
    debug: function(options, api) {
      var ref1, task;
      this.ui = api.ui;
      this.breakpoints = api.breakpoints;
      if ((ref1 = this.outputPanel) != null) {
        ref1.clear();
      }
      this.start(options);
      this.miEmitter.on('exit', (function(_this) {
        return function() {
          return _this.ui.stop();
        };
      })(this));
      this.miEmitter.on('console', (function(_this) {
        return function(line) {
          if (_this.outputPanel) {
            if (_this.showOutputPanelNext) {
              _this.showOutputPanelNext = false;
              _this.outputPanel.show();
            }
            return _this.outputPanel.print('\x1b[37;40m' + line.replace(/([^\r\n]+)\r?\n/, '\x1b[0K$1\r\n') + '\x1b[39;49m', false);
          }
        };
      })(this));
      this.miEmitter.on('result', (function(_this) {
        return function(arg) {
          var data, type;
          type = arg.type, data = arg.data;
          switch (type) {
            case 'running':
              return _this.ui.running();
          }
        };
      })(this));
      this.miEmitter.on('exec', (function(_this) {
        return function(arg) {
          var data, type;
          type = arg.type, data = arg.data;
          switch (type) {
            case 'running':
              return _this.ui.running();
            case 'stopped':
              if (data['thread-id']) {
                _this.thread = parseInt(data['thread-id'], 10);
              }
              switch (data.reason) {
                case 'exited-normally':
                  _this.closedNaturally = true;
                  _this.ui.stop();
                  return;
                case 'signal-received':
                  if (data['signal-name'] !== 'SIGINT') {
                    _this.errorEncountered = data['signal-meaning'] || (data['signal-name'] ? data['signal-name'] + 'signal received' : 'Signal received');
                    _this.ui.showError(_this.errorEncountered);
                  }
              }
              _this.unseenOutputPanelContent = false;
              _this.ui.paused();
              return _this.sendCommand('-stack-list-frames --thread ' + _this.thread).then(function(arg1) {
                var data, description, frame, framePath, i, isLocal, j, lastValid, name, ref2, stack, type;
                type = arg1.type, data = arg1.data;
                stack = [];
                lastValid = false;
                _this.stackList = data.stack;
                if (data.stack.length > 0) {
                  for (i = j = 0, ref2 = data.stack.length - 1; 0 <= ref2 ? j <= ref2 : j >= ref2; i = 0 <= ref2 ? ++j : --j) {
                    frame = data.stack[i];
                    description;
                    name = '';
                    if (frame.func) {
                      name = frame.func + '()';
                    } else {
                      name = frame.addr;
                    }
                    framePath = '';
                    if (frame.file) {
                      framePath = frame.file.replace(/^\.\//, '');
                    } else {
                      framePath = frame.from;
                      if (frame.addr) {
                        framePath += ':' + frame.addr;
                      }
                    }
                    description = name + ' - ' + framePath;
                    atom.project.getPaths()[0];
                    isLocal = false;
                    if (frame.file) {
                      if (frame.file.match(/^\.\//)) {
                        isLocal = true;
                      } else if (fs.existsSync(atom.project.getPaths()[0] + '/' + frame.file)) {
                        isLocal = true;
                      }
                    }
                    if (isLocal && lastValid === false) {
                      lastValid = i;
                    }
                    stack.unshift({
                      local: isLocal,
                      file: frame.fullname,
                      line: frame.line ? parseInt(frame.line) : void 0,
                      name: name,
                      path: framePath,
                      error: i === 0 ? _this.errorEncountered : void 0
                    });
                  }
                }
                _this.ui.setStack(stack);
                _this.frame = 0;
                return _this.refreshFrame();
              });
          }
        };
      })(this));
      task = Promise.resolve();
      if (options.path) {
        task = task.then((function(_this) {
          return function() {
            return _this.sendCommand('-file-exec-and-symbols ' + escapePath(path.resolve(options.basedir || '', options.path)));
          };
        })(this));
      }
      task = task.then((function(_this) {
        return function() {
          var begin;
          begin = function() {
            var breakpoint, command, env_var, fn, j, k, l, len, len1, len2, ref2, ref3, ref4, show_breakpoint_warning, started;
            if (options.env_vars != null) {
              ref2 = options.env_vars;
              for (j = 0, len = ref2.length; j < len; j++) {
                env_var = ref2[j];
                _this.sendCommand('set environment ' + env_var);
              }
            }
            task = Promise.resolve();
            ref3 = [].concat(options.gdb_commands || []);
            fn = function(command) {
              return task = task.then(function() {
                return _this.sendCommand(command);
              });
            };
            for (k = 0, len1 = ref3.length; k < len1; k++) {
              command = ref3[k];
              fn(command);
            }
            show_breakpoint_warning = false;
            ref4 = _this.breakpoints;
            for (l = 0, len2 = ref4.length; l < len2; l++) {
              breakpoint = ref4[l];
              task = task.then(function() {
                return _this.sendCommand('-break-insert -f ' + (escapePath(breakpoint.path)) + ':' + breakpoint.line, function(log) {
                  if (log.match(/no symbol table is loaded/i)) {
                    return show_breakpoint_warning = true;
                  }
                });
              });
            }
            started = function() {
              if (show_breakpoint_warning) {
                return atom.notifications.addError('Error inserting breakpoints', {
                  description: 'This program was not compiled with debug symbols.  \nBreakpoints cannot be used.',
                  dismissable: true
                });
              }
            };
            return task = task.then(function() {
              if (options.args != null) {
                _this.sendCommand('-exec-arguments ' + options.args.join(" "));
              }
              return _this.sendCommand('-exec-run').then(function() {
                return started();
              }, function(error) {
                if (typeof error !== 'string') {
                  return;
                }
                if (error.match(/target does not support "run"/)) {
                  _this.sendCommand('-exec-continue').then(function() {
                    return started();
                  }, function(error) {
                    if (typeof error !== 'string') {
                      return;
                    }
                    _this.handleMiError(error, 'Unable to debug this with GDB');
                    return _this.dbg.stop();
                  });
                  return;
                } else if (error.match(/no executable file specified/i)) {
                  atom.notifications.addError('Nothing to debug', {
                    description: 'Nothing was specified for GDB to debug. Specify a `path`, or `gdb_commands` to select a target',
                    dismissable: true
                  });
                } else {
                  _this.handleMiError(error, 'Unable to debug this with GDB');
                }
                return _this.dbg.stop();
              });
            });
          };
          return _this.sendCommand('-gdb-set mi-async on').then(function() {
            return begin();
          })["catch"](function() {
            return _this.sendCommand('-gdb-set target-async on').then(function() {
              return begin();
            })["catch"](function(error) {
              if (typeof error !== 'string') {
                return;
              }
              _this.handleMiError(error, 'Unable to debug this with GDB');
              return _this.dbg.stop();
            });
          });
        };
      })(this));
      return task["catch"]((function(_this) {
        return function(error) {
          if (typeof error !== 'string') {
            return;
          }
          if (error.match(/not in executable format/i)) {
            atom.notifications.addError('This file cannot be debugged', {
              description: 'It is not recognised by GDB as a supported executable file',
              dismissable: true
            });
          } else {
            _this.handleMiError(error, 'Unable to debug this with GDB');
          }
          return _this.dbg.stop();
        };
      })(this));
    },
    cleanupFrame: function() {
      var name, var_name;
      this.errorEncountered = null;
      return Promise.all((function() {
        var ref1, results;
        ref1 = this.variableRootObjects;
        results = [];
        for (name in ref1) {
          var_name = ref1[name];
          results.push(this.sendCommand('-var-delete ' + var_name));
        }
        return results;
      }).call(this)).then((function(_this) {
        return function() {
          _this.variableObjects = {};
          return _this.variableRootObjects = {};
        };
      })(this));
    },
    start: function(options) {
      var args, command, cwd, handleError, interactiveSession, matchAsyncHeader, matchStreamHeader, ref1;
      this.showOutputPanelNext = true;
      this.unseenOutputPanelContent = false;
      this.closedNaturally = false;
      if ((ref1 = this.outputPanel) != null) {
        ref1.clear();
      }
      matchAsyncHeader = /^([\^=*+])(.+?)(?:,(.*))?$/;
      matchStreamHeader = /^([~@&])(.*)?$/;
      command = options.gdb_executable || 'gdb';
      cwd = path.resolve(options.basedir || '', options.cwd || '');
      handleError = (function(_this) {
        return function(message) {
          atom.notifications.addError('Error running GDB', {
            description: message,
            dismissable: true
          });
          return _this.ui.stop();
        };
      })(this);
      if (!fs.existsSync(cwd)) {
        handleError("Working directory is invalid:  \n`" + cwd + "`");
        return;
      }
      args = ['-quiet', '--interpreter=mi2'];
      if (this.outputPanel && this.outputPanel.getInteractiveSession) {
        interactiveSession = this.outputPanel.getInteractiveSession();
        if (interactiveSession.pty) {
          this.interactiveSession = interactiveSession;
        }
      }
      if (this.interactiveSession) {
        args.push('--tty=' + this.interactiveSession.pty.pty);
        this.interactiveSession.pty.on('data', (function(_this) {
          return function(data) {
            if (_this.showOutputPanelNext) {
              _this.showOutputPanelNext = false;
              _this.outputPanel.show();
            }
            return _this.unseenOutputPanelContent = true;
          };
        })(this));
      } else if (process.platform === 'win32') {
        options.gdb_commands = ([].concat(options.gdb_commands || [])).concat('set new-console on');
      }
      args = args.concat(options.gdb_arguments || []);
      this.miEmitter = new Emitter();
      this.process = new BufferedProcess({
        command: command,
        args: args,
        options: {
          cwd: cwd
        },
        stdout: (function(_this) {
          return function(data) {
            var j, len, line, match, ref2, results, type;
            ref2 = data.replace(/\r?\n$/, '').split(/\r?\n/);
            results = [];
            for (j = 0, len = ref2.length; j < len; j++) {
              line = ref2[j];
              if (match = line.match(matchAsyncHeader)) {
                type = match[2];
                data = match[3] ? parseMi2(match[3]) : {};
                if (_this.logToConsole) {
                  console.log('dbg-gdb < ', match[1], type, data);
                }
                switch (match[1]) {
                  case '^':
                    results.push(_this.miEmitter.emit('result', {
                      type: type,
                      data: data
                    }));
                    break;
                  case '=':
                    results.push(_this.miEmitter.emit('notify', {
                      type: type,
                      data: data
                    }));
                    break;
                  case '*':
                    results.push(_this.miEmitter.emit('exec', {
                      type: type,
                      data: data
                    }));
                    break;
                  case '+':
                    results.push(_this.miEmitter.emit('status', {
                      type: type,
                      data: data
                    }));
                    break;
                  default:
                    results.push(void 0);
                }
              } else if (match = line.match(matchStreamHeader)) {
                data = parseMi2(match[2]);
                data = data ? data._ : '';
                if (_this.logToConsole) {
                  console.log('dbg-gdb < ', match[1], data);
                }
                switch (match[1]) {
                  case '~':
                    results.push(_this.miEmitter.emit('console', data.trim()));
                    break;
                  case '&':
                    results.push(_this.miEmitter.emit('log', data.trim()));
                    break;
                  default:
                    results.push(void 0);
                }
              } else {
                if (line !== '(gdb)' && line !== '(gdb) ') {
                  if (_this.logToConsole) {
                    console.log('dbg-gdb < ', line);
                  }
                  if (_this.outputPanel) {
                    if (_this.showOutputPanelNext) {
                      _this.showOutputPanelNext = false;
                      _this.outputPanel.show();
                    }
                    _this.unseenOutputPanelContent = true;
                    results.push(_this.outputPanel.print(line));
                  } else {
                    results.push(void 0);
                  }
                } else {
                  results.push(void 0);
                }
              }
            }
            return results;
          };
        })(this),
        stderr: (function(_this) {
          return function(data) {
            var j, len, line, ref2, results;
            if (_this.outputPanel) {
              if (_this.showOutputPanelNext) {
                _this.showOutputPanelNext = false;
                _this.outputPanel.show();
              }
              _this.unseenOutputPanelContent = true;
              ref2 = data.replace(/\r?\n$/, '').split(/\r?\n/);
              results = [];
              for (j = 0, len = ref2.length; j < len; j++) {
                line = ref2[j];
                results.push(_this.outputPanel.print(line));
              }
              return results;
            }
          };
        })(this),
        exit: (function(_this) {
          return function(data) {
            return _this.miEmitter.emit('exit');
          };
        })(this)
      });
      this.process.emitter.on('will-throw-error', (function(_this) {
        return function(event) {
          var error;
          event.handle();
          error = event.error;
          if (error.code === 'ENOENT' && (error.syscall.indexOf('spawn')) === 0) {
            return handleError("Could not find `" + command + "`  \nPlease ensure it is correctly installed and available in your system PATH");
          } else {
            return handleError(error.message);
          }
        };
      })(this));
      this.processAwaiting = false;
      return this.processQueued = [];
    },
    stop: function() {
      var ref1;
      this.errorEncountered = null;
      this.variableObjects = {};
      this.variableRootObjects = {};
      if ((ref1 = this.process) != null) {
        ref1.kill();
      }
      this.process = null;
      this.processAwaiting = false;
      this.processQueued = [];
      if (this.interactiveSession) {
        this.interactiveSession.discard();
        this.interactiveSession = null;
      }
      return setTimeout((function(_this) {
        return function() {
          var ref2;
          if (!_this.closedNaturally || !_this.unseenOutputPanelContent) {
            return (ref2 = _this.outputPanel) != null ? ref2.hide() : void 0;
          }
        };
      })(this), 0);
    },
    "continue": function() {
      return this.cleanupFrame().then((function(_this) {
        return function() {
          return _this.sendCommand('-exec-continue --all')["catch"](function(error) {
            if (typeof error !== 'string') {
              return;
            }
            return _this.handleMiError(error);
          });
        };
      })(this));
    },
    pause: function() {
      return this.cleanupFrame().then((function(_this) {
        return function() {
          return _this.sendCommand('-exec-interrupt --all')["catch"](function(error) {
            if (typeof error !== 'string') {
              return;
            }
            return _this.handleMiError(error);
          });
        };
      })(this));
    },
    selectFrame: function(index) {
      return this.cleanupFrame().then((function(_this) {
        return function() {
          var reversedIndex;
          reversedIndex = _this.stackList.length - 1 - index;
          _this.frame = reversedIndex;
          _this.ui.setFrame(index);
          return _this.refreshFrame();
        };
      })(this));
    },
    getVariableChildren: function(name) {
      return new Promise((function(_this) {
        return function(fulfill) {
          var seperator, variableName;
          seperator = name.lastIndexOf('.');
          if (seperator >= 0) {
            variableName = _this.variableObjects[name.substr(0, seperator)] + '.' + (name.substr(seperator + 1));
          } else {
            variableName = _this.variableObjects[name];
          }
          return _this.sendCommand('-var-list-children 1 ' + variableName).then(function(arg) {
            var child, children, data, j, len, ref1, type;
            type = arg.type, data = arg.data;
            children = [];
            if (data.children) {
              ref1 = data.children;
              for (j = 0, len = ref1.length; j < len; j++) {
                child = ref1[j];
                _this.variableObjects[name + '.' + child.exp] = child.name;
                children.push({
                  name: child.exp,
                  type: child.type,
                  value: prettyValue(child.value),
                  expandable: child.numchild && parseInt(child.numchild) > 0
                });
              }
            }
            return fulfill(children);
          })["catch"](function(error) {
            if (typeof error !== 'string') {
              return;
            }
            return fulfill([
              {
                name: '',
                type: '',
                value: error,
                expandable: false
              }
            ]);
          });
        };
      })(this));
    },
    selectThread: function(index) {
      return this.cleanupFrame().then((function(_this) {
        return function() {
          _this.thread = index;
          _this.ui.setThread(index);
          return _this.refreshFrame();
        };
      })(this));
    },
    refreshFrame: function() {
      return this.sendCommand('-stack-list-variables --thread ' + this.thread + ' --frame ' + this.frame + ' 1').then((function(_this) {
        return function(arg) {
          var data, fn, j, len, pending, ref1, start, stop, type, variable, variables;
          type = arg.type, data = arg.data;
          variables = [];
          pending = 0;
          start = function() {
            return pending++;
          };
          stop = function() {
            pending--;
            if (!pending) {
              return _this.ui.setVariables(variables);
            }
          };
          start();
          if (data.variables) {
            ref1 = data.variables;
            fn = function(variable) {
              start();
              return _this.sendCommand('-var-create - * ' + variable.name).then(function(arg1) {
                var data, type;
                type = arg1.type, data = arg1.data;
                _this.variableObjects[variable.name] = _this.variableRootObjects[variable.name] = data.name;
                variables.push({
                  name: variable.name,
                  value: prettyValue(variable.value),
                  type: data.type,
                  expandable: data.numchild && (parseInt(data.numchild)) > 0
                });
                return stop();
              })["catch"](function(error) {
                if (typeof error !== 'string') {
                  return;
                }
                if (variable.value !== '<optimized out>') {
                  _this.handleMiError(error);
                }
                variables.push({
                  name: variable.name,
                  value: variable.value
                });
                return stop();
              });
            };
            for (j = 0, len = ref1.length; j < len; j++) {
              variable = ref1[j];
              fn(variable);
            }
          }
          return stop();
        };
      })(this))["catch"]((function(_this) {
        return function(error) {
          if (typeof error !== 'string') {
            return;
          }
          return _this.handleMiError(error);
        };
      })(this));
    },
    stepIn: function() {
      return this.cleanupFrame().then((function(_this) {
        return function() {
          return _this.sendCommand('-exec-step')["catch"](function(error) {
            if (typeof error !== 'string') {
              return;
            }
            return _this.handleMiError(error);
          });
        };
      })(this));
    },
    stepOver: function() {
      return this.cleanupFrame().then((function(_this) {
        return function() {
          return _this.sendCommand('-exec-next')["catch"](function(error) {
            if (typeof error !== 'string') {
              return;
            }
            return _this.handleMiError(error);
          });
        };
      })(this));
    },
    stepOut: function() {
      return this.cleanupFrame().then((function(_this) {
        return function() {
          return _this.sendCommand('-exec-finish')["catch"](function(error) {
            if (typeof error !== 'string') {
              return;
            }
            return _this.handleMiError(error);
          });
        };
      })(this));
    },
    sendCommand: function(command, logCallback) {
      var exitEvent, logListener, promise, successEvent;
      if (this.processAwaiting) {
        return new Promise((function(_this) {
          return function(resolve, reject) {
            return _this.processQueued.push(function() {
              return _this.sendCommand(command).then(resolve, reject);
            });
          };
        })(this));
      }
      this.processAwaiting = true;
      logListener = null;
      if (logCallback) {
        logListener = this.miEmitter.on('log', logCallback);
      }
      successEvent = null;
      exitEvent = null;
      promise = Promise.race([
        new Promise((function(_this) {
          return function(resolve, reject) {
            return successEvent = _this.miEmitter.once('result', function(arg) {
              var data, type;
              type = arg.type, data = arg.data;
              exitEvent.dispose();
              if (type === 'error') {
                return reject(data.msg || 'Unknown GDB error');
              } else {
                return resolve({
                  type: type,
                  data: data
                });
              }
            });
          };
        })(this), new Promise((function(_this) {
          return function(resolve, reject) {
            return exitEvent = _this.miEmitter.once('exit', function() {
              successEvent.dispose();
              return reject('Debugger terminated');
            });
          };
        })(this)))
      ]);
      promise.then((function(_this) {
        return function() {
          if (logListener != null) {
            logListener.dispose();
          }
          _this.processAwaiting = false;
          if (_this.processQueued.length > 0) {
            return _this.processQueued.shift()();
          }
        };
      })(this), (function(_this) {
        return function(error) {
          if (logListener != null) {
            logListener.dispose();
          }
          _this.processAwaiting = false;
          if (typeof error !== 'string') {
            console.error(error);
          }
          if (_this.processQueued.length > 0) {
            return _this.processQueued.shift()();
          }
        };
      })(this));
      if (this.logToConsole) {
        console.log('dbg-gdb > ', command);
      }
      this.process.process.stdin.write(command + '\r\n', {
        binary: true
      });
      return promise;
    },
    handleMiError: function(error, title) {
      return atom.notifications.addError(title || 'Error received from GDB', {
        description: 'GDB said:\n\n> ' + error.trim().split(/\r?\n/).join('\n\n> '),
        dismissable: true
      });
    },
    addBreakpoint: function(breakpoint) {
      this.breakpoints.push(breakpoint);
      return this.sendCommand('-break-insert -f ' + (escapePath(breakpoint.path)) + ':' + breakpoint.line, (function(_this) {
        return function(log) {
          var matched;
          if (matched = log.match(/no source file named (.*?)\.?$/i)) {
            return atom.notifications.addError('Error inserting breakpoint', {
              description: 'This file was not found within the current executable.  \nPlease ensure debug symbols for this file are included in the compiled executable.',
              dismissable: true
            });
          } else if (log.match(/no symbol table is loaded/i)) {
            return atom.notifications.addError('Error inserting breakpoint', {
              description: 'This program was not compiled with debug symbols.  \nBreakpoints cannot be used.',
              dismissable: true
            });
          }
        };
      })(this));
    },
    removeBreakpoint: function(breakpoint) {
      var compare, i, j, len, ref1;
      ref1 = this.breakpoints;
      for (compare = j = 0, len = ref1.length; j < len; compare = ++j) {
        i = ref1[compare];
        if (compare === breakpoint) {
          this.breakpoints.splice(i, 1);
        }
      }
      return this.sendCommand('-break-list').then((function(_this) {
        return function(arg) {
          var data, entry, k, len1, ref2, results, type;
          type = arg.type, data = arg.data;
          if (data.BreakpointTable) {
            ref2 = data.BreakpointTable.body;
            results = [];
            for (k = 0, len1 = ref2.length; k < len1; k++) {
              entry = ref2[k];
              if (entry.fullname === breakpoint.path && parseInt(entry.line) === breakpoint.line) {
                results.push(_this.sendCommand('-break-delete ' + entry.number)["catch"](function(error) {
                  if (typeof error !== 'string') {
                    return;
                  }
                  return _this.handleMiError(error);
                }));
              } else {
                results.push(void 0);
              }
            }
            return results;
          }
        };
      })(this));
    },
    provideDbgProvider: function() {
      return {
        name: 'dbg-gdb',
        description: 'GDB debugger',
        canHandleOptions: (function(_this) {
          return function(options) {
            return new Promise(function(fulfill, reject) {
              _this.start(options);
              return _this.sendCommand('-file-exec-and-symbols ' + escapePath(path.resolve(options.basedir || '', options.path))).then(function() {
                _this.stop();
                return fulfill(true);
              })["catch"](function(error) {
                _this.stop();
                if (typeof error === 'string' && error.match(/not in executable format/)) {
                  return fulfill(false);
                } else {
                  return fulfill(true);
                }
              });
            });
          };
        })(this),
        debug: this.debug.bind(this),
        stop: this.stop.bind(this),
        "continue": this["continue"].bind(this),
        pause: this.pause.bind(this),
        selectFrame: this.selectFrame.bind(this),
        getVariableChildren: this.getVariableChildren.bind(this),
        stepIn: this.stepIn.bind(this),
        stepOver: this.stepOver.bind(this),
        stepOut: this.stepOut.bind(this),
        addBreakpoint: this.addBreakpoint.bind(this),
        removeBreakpoint: this.removeBreakpoint.bind(this)
      };
    },
    consumeDbg: function(dbg) {
      return this.dbg = dbg;
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbGVhcm4vLmF0b20vcGFja2FnZXMvZGJnLWdkYi9saWIvbWFpbi5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFBLFFBQUEsR0FBVyxPQUFBLENBQVEsWUFBUjs7RUFDWCxFQUFBLEdBQUssT0FBQSxDQUFRLElBQVI7O0VBQ0wsSUFBQSxHQUFPLE9BQUEsQ0FBUSxNQUFSOztFQUNQLE1BQWtELE9BQUEsQ0FBUSxNQUFSLENBQWxELEVBQUMscUNBQUQsRUFBa0IsNkNBQWxCLEVBQXVDOztFQUV2QyxVQUFBLEdBQWEsU0FBQyxJQUFEO0FBQ1osV0FBTyxDQUFDLElBQUksQ0FBQyxPQUFMLENBQWEsS0FBYixFQUFvQixHQUFwQixDQUFELENBQXlCLENBQUMsT0FBMUIsQ0FBa0MsV0FBbEMsRUFBK0MsS0FBL0M7RUFESzs7RUFHYixXQUFBLEdBQWMsU0FBQyxLQUFEO0FBQ2IsV0FBTyxDQUFDLEtBQUssQ0FBQyxPQUFOLENBQWMsUUFBZCxFQUF3QixNQUF4QixDQUFELENBQWdDLENBQUMsT0FBakMsQ0FBeUMsTUFBekMsRUFBaUQsTUFBakQ7RUFETTs7RUFHZCxNQUFNLENBQUMsT0FBUCxHQUFpQixNQUFBLEdBQ2hCO0lBQUEsTUFBQSxFQUNDO01BQUEsWUFBQSxFQUNDO1FBQUEsS0FBQSxFQUFPLDBCQUFQO1FBQ0EsV0FBQSxFQUFhLDRCQURiO1FBRUEsSUFBQSxFQUFNLFNBRk47UUFHQSxDQUFBLE9BQUEsQ0FBQSxFQUFTLEtBSFQ7T0FERDtLQUREO0lBTUEsR0FBQSxFQUFLLElBTkw7SUFPQSxZQUFBLEVBQWMsS0FQZDtJQVFBLFdBQUEsRUFBYSxFQVJiO0lBU0EsRUFBQSxFQUFJLElBVEo7SUFVQSxPQUFBLEVBQVMsSUFWVDtJQVdBLGVBQUEsRUFBaUIsS0FYakI7SUFZQSxhQUFBLEVBQWUsRUFaZjtJQWFBLGVBQUEsRUFBaUIsRUFiakI7SUFjQSxtQkFB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SUFBcEIsQ0FsQ2Y7UUFtQ0EsZ0JBQUEsRUFBa0IsSUFBQyxDQUFBLGdCQUFnQixDQUFDLElBQWxCLENBQXVCLElBQXZCLENBbkNsQjs7SUFEbUIsQ0FoakJwQjtJQXNsQkEsVUFBQSxFQUFZLFNBQUMsR0FBRDthQUNYLElBQUMsQ0FBQSxHQUFELEdBQU87SUFESSxDQXRsQlo7O0FBWkQiLCJzb3VyY2VzQ29udGVudCI6WyJwYXJzZU1pMiA9IHJlcXVpcmUgJy4vcGFyc2VNaTInXG5mcyA9IHJlcXVpcmUgJ2ZzJ1xucGF0aCA9IHJlcXVpcmUgJ3BhdGgnXG57QnVmZmVyZWRQcm9jZXNzLCBDb21wb3NpdGVEaXNwb3NhYmxlLCBFbWl0dGVyfSA9IHJlcXVpcmUgJ2F0b20nXG5cbmVzY2FwZVBhdGggPSAocGF0aCkgLT5cblx0cmV0dXJuIChwYXRoLnJlcGxhY2UgL1xcXFwvZywgJy8nKS5yZXBsYWNlIC9bXFxzXFx0XFxuXS9nLCAnXFxcXCAnXG5cbnByZXR0eVZhbHVlID0gKHZhbHVlKSAtPlxuXHRyZXR1cm4gKHZhbHVlLnJlcGxhY2UgLyh7fCwpL2csICckMVxcbicpLnJlcGxhY2UgLyh9KS9nLCAnXFxuJDEnICMgc3BsaXQgZ2RiJ3Mgc3VtbWFyaWVzIG9udG8gbXVsdGlwbGUgbGluZXMsIGF0IGNvbW1hcyBhbmQgYnJhY2VzLiBBbiB1Z2x5IGhhY2ssIGJ1dCBpdCdsbCBkbyBmb3Igbm93XG5cbm1vZHVsZS5leHBvcnRzID0gRGJnR2RiID1cblx0Y29uZmlnOlxuXHRcdGxvZ1RvQ29uc29sZTpcblx0XHRcdHRpdGxlOiAnTG9nIHRvIGRldmVsb3BlciBjb25zb2xlJ1xuXHRcdFx0ZGVzY3JpcHRpb246ICdGb3IgZGVidWdnaW5nIEdEQiBwcm9ibGVtcydcblx0XHRcdHR5cGU6ICdib29sZWFuJ1xuXHRcdFx0ZGVmYXVsdDogZmFsc2Vcblx0ZGJnOiBudWxsXG5cdGxvZ1RvQ29uc29sZTogZmFsc2Vcblx0YnJlYWtwb2ludHM6IFtdXG5cdHVpOiBudWxsXG5cdHByb2Nlc3M6IG51bGxcblx0cHJvY2Vzc0F3YWl0aW5nOiBmYWxzZVxuXHRwcm9jZXNzUXVldWVkOiBbXVxuXHR2YXJpYWJsZU9iamVjdHM6IHt9XG5cdHZhcmlhYmxlUm9vdE9iamVjdHM6IHt9XG5cdGVycm9yRW5jb3VudGVyZWQ6IG51bGxcblx0dGhyZWFkOiAxXG5cdGZyYW1lOiAwXG5cdG91dHB1dFBhbmVsOiBudWxsXG5cdHNob3dPdXRwdXRQYW5lbE5leHQ6IGZhbHNlICMgaXMgdGhlIG91dHB1dCBwYW5lbCBzY2hlZHVsZWQgdG8gYmUgZGlzcGxheWVkIG9uIG5leHQgcHJpbnQ/XG5cdHVuc2Vlbk91dHB1dFBhbmVsQ29udGVudDogZmFsc2UgIyBoYXMgdGhlcmUgYmVlbiBwcm9ncmFtIG91dHB1dCBwcmludGVkIHNpbmNlIHRoZSBwcm9ncmFtIHdhcyBsYXN0IHBhdXNlZD9cblx0Y2xvc2VkTmF0dXJhbGx5OiBmYWxzZSAjIGRpZCB0aGUgcHJvZ3JhbSBuYXR1cmFsbHkgdGVybWluYXRlLCB3aGlsZSBub3QgcGF1c2VkP1xuXHRpbnRlcmFjdGl2ZVNlc3Npb246IG51bGxcblx0bWlFbWl0dGVyOiBudWxsXG5cblx0YWN0aXZhdGU6IChzdGF0ZSkgLT5cblx0XHRyZXF1aXJlKCdhdG9tLXBhY2thZ2UtZGVwcycpLmluc3RhbGwoJ2RiZy1nZGInKVxuXG5cdFx0YXRvbS5jb25maWcub2JzZXJ2ZSAnZGJnLWdkYi5sb2dUb0NvbnNvbGUnLCAoc2V0KSA9PlxuXHRcdFx0QGxvZ1RvQ29uc29sZSA9IHNldFxuXG5cdGNvbnN1bWVPdXRwdXRQYW5lbDogKG91dHB1dFBhbmVsKSAtPlxuXHRcdEBvdXRwdXRQYW5lbCA9IG91dHB1dFBhbmVsXG5cblx0ZGVidWc6IChvcHRpb25zLCBhcGkpIC0+XG5cdFx0QHVpID0gYXBpLnVpXG5cdFx0QGJyZWFrcG9pbnRzID0gYXBpLmJyZWFrcG9pbnRzXG5cdFx0QG91dHB1dFBhbmVsPy5jbGVhcigpXG5cblx0XHRAc3RhcnQgb3B0aW9uc1xuXG5cdFx0QG1pRW1pdHRlci5vbiAnZXhpdCcsID0+XG5cdFx0XHRAdWkuc3RvcCgpXG5cblx0XHRAbWlFbWl0dGVyLm9uICdjb25zb2xlJywgKGxpbmUpID0+XG5cdFx0XHRpZiBAb3V0cHV0UGFuZWxcblx0XHRcdFx0aWYgQHNob3dPdXRwdXRQYW5lbE5leHRcblx0XHRcdFx0XHRAc2hvd091dHB1dFBhbmVsTmV4dCA9IGZhbHNlXG5cdFx0XHRcdFx0QG91dHB1dFBhbmVsLnNob3coKVxuXHRcdFx0XHRAb3V0cHV0UGFuZWwucHJpbnQgJ1xceDFiWzM3OzQwbScrbGluZS5yZXBsYWNlKC8oW15cXHJcXG5dKylcXHI/XFxuLywnXFx4MWJbMEskMVxcclxcbicpKydcXHgxYlszOTs0OW0nLCBmYWxzZVxuXG5cdFx0QG1pRW1pdHRlci5vbiAncmVzdWx0JywgKHt0eXBlLCBkYXRhfSkgPT5cblx0XHRcdHN3aXRjaCB0eXBlXG5cdFx0XHRcdHdoZW4gJ3J1bm5pbmcnXG5cdFx0XHRcdFx0QHVpLnJ1bm5pbmcoKVxuXG5cdFx0QG1pRW1pdHRlci5vbiAnZXhlYycsICh7dHlwZSwgZGF0YX0pID0+XG5cdFx0XHRzd2l0Y2ggdHlwZVxuXHRcdFx0XHR3aGVuICdydW5uaW5nJ1xuXHRcdFx0XHRcdEB1aS5ydW5uaW5nKClcblxuXHRcdFx0XHR3aGVuICdzdG9wcGVkJ1xuXHRcdFx0XHRcdGlmIGRhdGFbJ3RocmVhZC1pZCddXG5cdFx0XHRcdFx0XHRAdGhyZWFkID0gcGFyc2VJbnQgZGF0YVsndGhyZWFkLWlkJ10sIDEwXG5cdFx0XHRcdFx0XHQjIEB1aS5zZXRUaHJlYWQgQHRocmVhZFxuXG5cdFx0XHRcdFx0c3dpdGNoIGRhdGEucmVhc29uXG5cdFx0XHRcdFx0XHR3aGVuICdleGl0ZWQtbm9ybWFsbHknXG5cdFx0XHRcdFx0XHRcdEBjbG9zZWROYXR1cmFsbHkgPSB0cnVlXG5cdFx0XHRcdFx0XHRcdEB1aS5zdG9wKClcblx0XHRcdFx0XHRcdFx0cmV0dXJuXG5cblx0XHRcdFx0XHRcdCMgd2hlbiAnZXhpdGVkLXNpZ25hbGxlZCdcblx0XHRcdFx0XHRcdFx0IyBUT0RPOiBTb21laG93IGxldCBkYmcga25vdyB3ZSBjYW4ndCBjb250aW51ZS4gT3VyIG9ubHkgb3B0aW9uIGZyb20gaGVyZSBpcyB0byBzdG9wXG5cdFx0XHRcdFx0XHRcdCMgYWx0aG91Z2ggbGVhdmUgcGF1c2VkIGZvciBub3cgc28gdGhlIGV4aXQgc3RhdGUgY2FuIGJlIGluc3BlY3RlZFxuXG5cdFx0XHRcdFx0XHR3aGVuICdzaWduYWwtcmVjZWl2ZWQnXG5cdFx0XHRcdFx0XHRcdGlmIGRhdGFbJ3NpZ25hbC1uYW1lJ10gIT0gJ1NJR0lOVCdcblx0XHRcdFx0XHRcdFx0XHRAZXJyb3JFbmNvdW50ZXJlZCA9IGRhdGFbJ3NpZ25hbC1tZWFuaW5nJ10gb3IgaWYgZGF0YVsnc2lnbmFsLW5hbWUnXSB0aGVuIGRhdGFbJ3NpZ25hbC1uYW1lJ10rJ3NpZ25hbCByZWNlaXZlZCcgZWxzZSAnU2lnbmFsIHJlY2VpdmVkJ1xuXHRcdFx0XHRcdFx0XHRcdEB1aS5zaG93RXJyb3IgQGVycm9yRW5jb3VudGVyZWRcblxuXHRcdFx0XHRcdEB1bnNlZW5PdXRwdXRQYW5lbENvbnRlbnQgPSBmYWxzZVxuXHRcdFx0XHRcdEB1aS5wYXVzZWQoKVxuXG5cdFx0XHRcdFx0QHNlbmRDb21tYW5kICctc3RhY2stbGlzdC1mcmFtZXMgLS10aHJlYWQgJytAdGhyZWFkXG5cdFx0XHRcdFx0XHQudGhlbiAoe3R5cGUsIGRhdGF9KSA9PlxuXHRcdFx0XHRcdFx0XHRzdGFjayA9IFtdXG5cdFx0XHRcdFx0XHRcdGxhc3RWYWxpZCA9IGZhbHNlXG5cdFx0XHRcdFx0XHRcdEBzdGFja0xpc3QgPSBkYXRhLnN0YWNrXG5cdFx0XHRcdFx0XHRcdGlmIGRhdGEuc3RhY2subGVuZ3RoPjAgdGhlbiBmb3IgaSBpbiBbMC4uZGF0YS5zdGFjay5sZW5ndGgtMV1cblx0XHRcdFx0XHRcdFx0XHRmcmFtZSA9IGRhdGEuc3RhY2tbaV1cblx0XHRcdFx0XHRcdFx0XHRkZXNjcmlwdGlvblxuXG5cdFx0XHRcdFx0XHRcdFx0bmFtZSA9ICcnXG5cdFx0XHRcdFx0XHRcdFx0aWYgZnJhbWUuZnVuY1xuXHRcdFx0XHRcdFx0XHRcdFx0bmFtZSA9IGZyYW1lLmZ1bmMrJygpJ1xuXHRcdFx0XHRcdFx0XHRcdGVsc2Vcblx0XHRcdFx0XHRcdFx0XHRcdG5hbWUgPSBmcmFtZS5hZGRyXG5cblx0XHRcdFx0XHRcdFx0XHRmcmFtZVBhdGggPSAnJ1xuXHRcdFx0XHRcdFx0XHRcdGlmIGZyYW1lLmZpbGVcblx0XHRcdFx0XHRcdFx0XHRcdGZyYW1lUGF0aCA9IGZyYW1lLmZpbGUucmVwbGFjZSAvXlxcLlxcLy8sICcnXG5cdFx0XHRcdFx0XHRcdFx0ZWxzZVxuXHRcdFx0XHRcdFx0XHRcdFx0ZnJhbWVQYXRoID0gZnJhbWUuZnJvbVxuXHRcdFx0XHRcdFx0XHRcdFx0aWYgZnJhbWUuYWRkclxuXHRcdFx0XHRcdFx0XHRcdFx0XHRmcmFtZVBhdGggKz0gJzonK2ZyYW1lLmFkZHJcblxuXHRcdFx0XHRcdFx0XHRcdGRlc2NyaXB0aW9uID0gbmFtZSArICcgLSAnICsgZnJhbWVQYXRoXG5cblx0XHRcdFx0XHRcdFx0XHRhdG9tLnByb2plY3QuZ2V0UGF0aHMoKVswXVxuXG5cdFx0XHRcdFx0XHRcdFx0aXNMb2NhbCA9IGZhbHNlXG5cdFx0XHRcdFx0XHRcdFx0aWYgZnJhbWUuZmlsZVxuXHRcdFx0XHRcdFx0XHRcdFx0aWYgZnJhbWUuZmlsZS5tYXRjaCAvXlxcLlxcLy9cblx0XHRcdFx0XHRcdFx0XHRcdFx0aXNMb2NhbCA9IHRydWVcblx0XHRcdFx0XHRcdFx0XHRcdGVsc2UgaWYgZnMuZXhpc3RzU3luYyhhdG9tLnByb2plY3QuZ2V0UGF0aHMoKVswXSsnLycrZnJhbWUuZmlsZSlcblx0XHRcdFx0XHRcdFx0XHRcdFx0aXNMb2NhbCA9IHRydWVcblxuXHRcdFx0XHRcdFx0XHRcdGlmIGlzTG9jYWwgYW5kIGxhc3RWYWxpZD09ZmFsc2UgI2dldCB0aGUgZmlyc3QgdmFsaWQgYXMgdGhlIGxhc3QsIGFzIHRoaXMgbGlzdCBpcyByZXZlcnNlZFxuXHRcdFx0XHRcdFx0XHRcdFx0bGFzdFZhbGlkID0gaVxuXG5cdFx0XHRcdFx0XHRcdFx0c3RhY2sudW5zaGlmdFxuXHRcdFx0XHRcdFx0XHRcdFx0bG9jYWw6IGlzTG9jYWxcblx0XHRcdFx0XHRcdFx0XHRcdGZpbGU6IGZyYW1lLmZ1bGxuYW1lXG5cdFx0XHRcdFx0XHRcdFx0XHRsaW5lOiBpZiBmcmFtZS5saW5lIHRoZW4gcGFyc2VJbnQoZnJhbWUubGluZSkgZWxzZSB1bmRlZmluZWRcblx0XHRcdFx0XHRcdFx0XHRcdG5hbWU6IG5hbWVcblx0XHRcdFx0XHRcdFx0XHRcdHBhdGg6IGZyYW1lUGF0aFxuXHRcdFx0XHRcdFx0XHRcdFx0ZXJyb3I6IGlmIGk9PTAgdGhlbiBAZXJyb3JFbmNvdW50ZXJlZCBlbHNlIHVuZGVmaW5lZFxuXG5cdFx0XHRcdFx0XHRcdEB1aS5zZXRTdGFjayBzdGFja1xuXHRcdFx0XHRcdFx0XHQjIGlmIGxhc3RWYWxpZCE9ZmFsc2Vcblx0XHRcdFx0XHRcdFx0IyBcdEBmcmFtZSA9IGxhc3RWYWxpZFxuXHRcdFx0XHRcdFx0XHQjIFx0QHVpLnNldEZyYW1lIHN0YWNrLmxlbmd0aC0xLWxhc3RWYWxpZCAjcmV2ZXJzZSBpdFxuXHRcdFx0XHRcdFx0XHQjIFx0QHJlZnJlc2hGcmFtZSgpXG5cblx0XHRcdFx0XHRcdFx0QGZyYW1lID0gMFxuXHRcdFx0XHRcdFx0XHRAcmVmcmVzaEZyYW1lKClcblxuXHRcdHRhc2sgPSBQcm9taXNlLnJlc29sdmUoKVxuXG5cdFx0aWYgb3B0aW9ucy5wYXRoXG5cdFx0XHR0YXNrID0gdGFzay50aGVuID0+IEBzZW5kQ29tbWFuZCAnLWZpbGUtZXhlYy1hbmQtc3ltYm9scyAnK2VzY2FwZVBhdGggKHBhdGgucmVzb2x2ZSBvcHRpb25zLmJhc2VkaXJ8fCcnLCBvcHRpb25zLnBhdGgpXG5cblx0XHR0YXNrID0gdGFzay50aGVuID0+XG5cdFx0XHRiZWdpbiA9ICgpID0+XG5cdFx0XHRcdEBzZW5kQ29tbWFuZCAnc2V0IGVudmlyb25tZW50ICcgKyBlbnZfdmFyIGZvciBlbnZfdmFyIGluIG9wdGlvbnMuZW52X3ZhcnMgaWYgb3B0aW9ucy5lbnZfdmFycz9cblxuXHRcdFx0XHR0YXNrID0gUHJvbWlzZS5yZXNvbHZlKClcblxuXHRcdFx0XHRmb3IgY29tbWFuZCBpbiBbXS5jb25jYXQgb3B0aW9ucy5nZGJfY29tbWFuZHN8fFtdXG5cdFx0XHRcdFx0ZG8gKGNvbW1hbmQpID0+XG5cdFx0XHRcdFx0XHR0YXNrID0gdGFzay50aGVuID0+IEBzZW5kQ29tbWFuZCBjb21tYW5kXG5cblx0XHRcdFx0c2hvd19icmVha3BvaW50X3dhcm5pbmcgPSBmYWxzZVxuXHRcdFx0XHRmb3IgYnJlYWtwb2ludCBpbiBAYnJlYWtwb2ludHNcblx0XHRcdFx0XHR0YXNrID0gdGFzay50aGVuID0+XG5cdFx0XHRcdFx0XHRAc2VuZENvbW1hbmQgJy1icmVhay1pbnNlcnQgLWYgJysoZXNjYXBlUGF0aCBicmVha3BvaW50LnBhdGgpKyc6JyticmVha3BvaW50LmxpbmUsIChsb2cpID0+XG5cdFx0XHRcdFx0XHRcdGlmIGxvZy5tYXRjaCAvbm8gc3ltYm9sIHRhYmxlIGlzIGxvYWRlZC9pXG5cdFx0XHRcdFx0XHRcdFx0c2hvd19icmVha3BvaW50X3dhcm5pbmcgPSB0cnVlXG5cblx0XHRcdFx0c3RhcnRlZCA9ID0+XG5cdFx0XHRcdFx0aWYgc2hvd19icmVha3BvaW50X3dhcm5pbmdcblx0XHRcdFx0XHRcdGF0b20ubm90aWZpY2F0aW9ucy5hZGRFcnJvciAnRXJyb3IgaW5zZXJ0aW5nIGJyZWFrcG9pbnRzJyxcblx0XHRcdFx0XHRcdFx0ZGVzY3JpcHRpb246ICdUaGlzIHByb2dyYW0gd2FzIG5vdCBjb21waWxlZCB3aXRoIGRlYnVnIHN5bWJvbHMuICBcXG5CcmVha3BvaW50cyBjYW5ub3QgYmUgdXNlZC4nXG5cdFx0XHRcdFx0XHRcdGRpc21pc3NhYmxlOiB0cnVlXG5cblx0XHRcdFx0dGFzayA9IHRhc2sudGhlbiA9PlxuXHRcdFx0XHRcdEBzZW5kQ29tbWFuZCAnLWV4ZWMtYXJndW1lbnRzICcgKyBvcHRpb25zLmFyZ3Muam9pbihcIiBcIikgaWYgb3B0aW9ucy5hcmdzP1xuXHRcdFx0XHRcdEBzZW5kQ29tbWFuZCAnLWV4ZWMtcnVuJ1xuXHRcdFx0XHRcdFx0LnRoZW4gPT5cblx0XHRcdFx0XHRcdFx0c3RhcnRlZCgpXG5cdFx0XHRcdFx0XHQsIChlcnJvcikgPT5cblx0XHRcdFx0XHRcdFx0aWYgdHlwZW9mIGVycm9yICE9ICdzdHJpbmcnIHRoZW4gcmV0dXJuXG5cdFx0XHRcdFx0XHRcdGlmIGVycm9yLm1hdGNoIC90YXJnZXQgZG9lcyBub3Qgc3VwcG9ydCBcInJ1blwiL1xuXHRcdFx0XHRcdFx0XHRcdEBzZW5kQ29tbWFuZCAnLWV4ZWMtY29udGludWUnXG5cdFx0XHRcdFx0XHRcdFx0XHQudGhlbiA9PlxuXHRcdFx0XHRcdFx0XHRcdFx0XHRzdGFydGVkKClcblx0XHRcdFx0XHRcdFx0XHRcdCwgKGVycm9yKSA9PlxuXHRcdFx0XHRcdFx0XHRcdFx0XHRpZiB0eXBlb2YgZXJyb3IgIT0gJ3N0cmluZycgdGhlbiByZXR1cm5cblx0XHRcdFx0XHRcdFx0XHRcdFx0QGhhbmRsZU1pRXJyb3IgZXJyb3IsICdVbmFibGUgdG8gZGVidWcgdGhpcyB3aXRoIEdEQidcblx0XHRcdFx0XHRcdFx0XHRcdFx0QGRiZy5zdG9wKClcblx0XHRcdFx0XHRcdFx0XHRyZXR1cm5cblxuXHRcdFx0XHRcdFx0XHRlbHNlIGlmIGVycm9yLm1hdGNoIC9ubyBleGVjdXRhYmxlIGZpbGUgc3BlY2lmaWVkL2lcblx0XHRcdFx0XHRcdFx0XHRhdG9tLm5vdGlmaWNhdGlvbnMuYWRkRXJyb3IgJ05vdGhpbmcgdG8gZGVidWcnLFxuXHRcdFx0XHRcdFx0XHRcdFx0ZGVzY3JpcHRpb246ICdOb3RoaW5nIHdhcyBzcGVjaWZpZWQgZm9yIEdEQiB0byBkZWJ1Zy4gU3BlY2lmeSBhIGBwYXRoYCwgb3IgYGdkYl9jb21tYW5kc2AgdG8gc2VsZWN0IGEgdGFyZ2V0J1xuXHRcdFx0XHRcdFx0XHRcdFx0ZGlzbWlzc2FibGU6IHRydWVcblxuXHRcdFx0XHRcdFx0XHRlbHNlXG5cdFx0XHRcdFx0XHRcdFx0QGhhbmRsZU1pRXJyb3IgZXJyb3IsICdVbmFibGUgdG8gZGVidWcgdGhpcyB3aXRoIEdEQidcblxuXHRcdFx0XHRcdFx0XHRAZGJnLnN0b3AoKVxuXG5cdFx0XHRAc2VuZENvbW1hbmQgJy1nZGItc2V0IG1pLWFzeW5jIG9uJ1xuXHRcdFx0XHQudGhlbiA9PiBiZWdpbigpXG5cdFx0XHRcdC5jYXRjaCA9PlxuXHRcdFx0XHRcdEBzZW5kQ29tbWFuZCAnLWdkYi1zZXQgdGFyZ2V0LWFzeW5jIG9uJ1xuXHRcdFx0XHRcdFx0LnRoZW4gPT4gYmVnaW4oKVxuXHRcdFx0XHRcdFx0LmNhdGNoIChlcnJvcikgPT5cblx0XHRcdFx0XHRcdFx0aWYgdHlwZW9mIGVycm9yICE9ICdzdHJpbmcnIHRoZW4gcmV0dXJuXG5cdFx0XHRcdFx0XHRcdEBoYW5kbGVNaUVycm9yIGVycm9yLCAnVW5hYmxlIHRvIGRlYnVnIHRoaXMgd2l0aCBHREInXG5cdFx0XHRcdFx0XHRcdEBkYmcuc3RvcCgpXG5cblx0XHR0YXNrLmNhdGNoIChlcnJvcikgPT5cblx0XHRcdGlmIHR5cGVvZiBlcnJvciAhPSAnc3RyaW5nJyB0aGVuIHJldHVyblxuXHRcdFx0aWYgZXJyb3IubWF0Y2ggL25vdCBpbiBleGVjdXRhYmxlIGZvcm1hdC9pXG5cdFx0XHRcdGF0b20ubm90aWZpY2F0aW9ucy5hZGRFcnJvciAnVGhpcyBmaWxlIGNhbm5vdCBiZSBkZWJ1Z2dlZCcsXG5cdFx0XHRcdFx0ZGVzY3JpcHRpb246ICdJdCBpcyBub3QgcmVjb2duaXNlZCBieSBHREIgYXMgYSBzdXBwb3J0ZWQgZXhlY3V0YWJsZSBmaWxlJ1xuXHRcdFx0XHRcdGRpc21pc3NhYmxlOiB0cnVlXG5cdFx0XHRlbHNlXG5cdFx0XHRcdEBoYW5kbGVNaUVycm9yIGVycm9yLCAnVW5hYmxlIHRvIGRlYnVnIHRoaXMgd2l0aCBHREInXG5cdFx0XHRAZGJnLnN0b3AoKVxuXG5cdGNsZWFudXBGcmFtZTogLT5cblx0XHRAZXJyb3JFbmNvdW50ZXJlZCA9IG51bGxcblx0XHRyZXR1cm4gUHJvbWlzZS5hbGwgKEBzZW5kQ29tbWFuZCAnLXZhci1kZWxldGUgJyt2YXJfbmFtZSBmb3IgbmFtZSwgdmFyX25hbWUgb2YgQHZhcmlhYmxlUm9vdE9iamVjdHMpXG5cdFx0XHQudGhlbiA9PlxuXHRcdFx0XHRAdmFyaWFibGVPYmplY3RzID0ge31cblx0XHRcdFx0QHZhcmlhYmxlUm9vdE9iamVjdHMgPSB7fVxuXG5cdHN0YXJ0OiAob3B0aW9ucyktPlxuXHRcdEBzaG93T3V0cHV0UGFuZWxOZXh0ID0gdHJ1ZVxuXHRcdEB1bnNlZW5PdXRwdXRQYW5lbENvbnRlbnQgPSBmYWxzZVxuXHRcdEBjbG9zZWROYXR1cmFsbHkgPSBmYWxzZVxuXHRcdEBvdXRwdXRQYW5lbD8uY2xlYXIoKVxuXG5cdFx0bWF0Y2hBc3luY0hlYWRlciA9IC9eKFtcXF49KitdKSguKz8pKD86LCguKikpPyQvXG5cdFx0bWF0Y2hTdHJlYW1IZWFkZXIgPSAvXihbfkAmXSkoLiopPyQvXG5cblx0XHRjb21tYW5kID0gb3B0aW9ucy5nZGJfZXhlY3V0YWJsZXx8J2dkYidcblx0XHRjd2QgPSBwYXRoLnJlc29sdmUgb3B0aW9ucy5iYXNlZGlyfHwnJywgb3B0aW9ucy5jd2R8fCcnXG5cblx0XHRoYW5kbGVFcnJvciA9IChtZXNzYWdlKSA9PlxuXHRcdFx0YXRvbS5ub3RpZmljYXRpb25zLmFkZEVycm9yICdFcnJvciBydW5uaW5nIEdEQicsXG5cdFx0XHRcdGRlc2NyaXB0aW9uOiBtZXNzYWdlXG5cdFx0XHRcdGRpc21pc3NhYmxlOiB0cnVlXG5cblx0XHRcdEB1aS5zdG9wKClcblxuXHRcdGlmICFmcy5leGlzdHNTeW5jIGN3ZFxuXHRcdFx0aGFuZGxlRXJyb3IgXCJXb3JraW5nIGRpcmVjdG9yeSBpcyBpbnZhbGlkOiAgXFxuYCN7Y3dkfWBcIlxuXHRcdFx0cmV0dXJuXG5cblx0XHRhcmdzID0gWyctcXVpZXQnLCctLWludGVycHJldGVyPW1pMiddXG5cblx0XHRpZiBAb3V0cHV0UGFuZWwgYW5kIEBvdXRwdXRQYW5lbC5nZXRJbnRlcmFjdGl2ZVNlc3Npb25cblx0XHRcdGludGVyYWN0aXZlU2Vzc2lvbiA9IEBvdXRwdXRQYW5lbC5nZXRJbnRlcmFjdGl2ZVNlc3Npb24oKVxuXHRcdFx0aWYgaW50ZXJhY3RpdmVTZXNzaW9uLnB0eVxuXHRcdFx0XHRAaW50ZXJhY3RpdmVTZXNzaW9uID0gaW50ZXJhY3RpdmVTZXNzaW9uXG5cblx0XHRpZiBAaW50ZXJhY3RpdmVTZXNzaW9uXG5cdFx0XHRhcmdzLnB1c2ggJy0tdHR5PScrQGludGVyYWN0aXZlU2Vzc2lvbi5wdHkucHR5XG5cdFx0XHRAaW50ZXJhY3RpdmVTZXNzaW9uLnB0eS5vbiAnZGF0YScsIChkYXRhKSA9PlxuXHRcdFx0XHRpZiBAc2hvd091dHB1dFBhbmVsTmV4dFxuXHRcdFx0XHRcdEBzaG93T3V0cHV0UGFuZWxOZXh0ID0gZmFsc2Vcblx0XHRcdFx0XHRAb3V0cHV0UGFuZWwuc2hvdygpXG5cdFx0XHRcdEB1bnNlZW5PdXRwdXRQYW5lbENvbnRlbnQgPSB0cnVlXG5cblx0XHRlbHNlIGlmIHByb2Nlc3MucGxhdGZvcm09PSd3aW4zMidcblx0XHRcdG9wdGlvbnMuZ2RiX2NvbW1hbmRzID0gKFtdLmNvbmNhdCBvcHRpb25zLmdkYl9jb21tYW5kc3x8W10pLmNvbmNhdCAnc2V0IG5ldy1jb25zb2xlIG9uJ1xuXG5cdFx0YXJncyA9IGFyZ3MuY29uY2F0IG9wdGlvbnMuZ2RiX2FyZ3VtZW50c3x8W11cblxuXHRcdEBtaUVtaXR0ZXIgPSBuZXcgRW1pdHRlcigpXG5cdFx0QHByb2Nlc3MgPSBuZXcgQnVmZmVyZWRQcm9jZXNzXG5cdFx0XHRjb21tYW5kOiBjb21tYW5kXG5cdFx0XHRhcmdzOiBhcmdzXG5cdFx0XHRvcHRpb25zOlxuXHRcdFx0XHRjd2Q6IGN3ZFxuXHRcdFx0c3Rkb3V0OiAoZGF0YSkgPT5cblx0XHRcdFx0Zm9yIGxpbmUgaW4gZGF0YS5yZXBsYWNlKC9cXHI/XFxuJC8sJycpLnNwbGl0KC9cXHI/XFxuLylcblx0XHRcdFx0XHRpZiBtYXRjaCA9IGxpbmUubWF0Y2ggbWF0Y2hBc3luY0hlYWRlclxuXHRcdFx0XHRcdFx0dHlwZSA9IG1hdGNoWzJdXG5cdFx0XHRcdFx0XHRkYXRhID0gaWYgbWF0Y2hbM10gdGhlbiBwYXJzZU1pMiBtYXRjaFszXSBlbHNlIHt9XG5cblx0XHRcdFx0XHRcdGlmIEBsb2dUb0NvbnNvbGUgdGhlbiBjb25zb2xlLmxvZyAnZGJnLWdkYiA8ICcsbWF0Y2hbMV0sdHlwZSxkYXRhXG5cblx0XHRcdFx0XHRcdHN3aXRjaCBtYXRjaFsxXVxuXHRcdFx0XHRcdFx0XHR3aGVuICdeJyB0aGVuIEBtaUVtaXR0ZXIuZW1pdCAncmVzdWx0JyAsIHt0eXBlOnR5cGUsIGRhdGE6ZGF0YX1cblx0XHRcdFx0XHRcdFx0d2hlbiAnPScgdGhlbiBAbWlFbWl0dGVyLmVtaXQgJ25vdGlmeScgLCB7dHlwZTp0eXBlLCBkYXRhOmRhdGF9XG5cdFx0XHRcdFx0XHRcdHdoZW4gJyonIHRoZW4gQG1pRW1pdHRlci5lbWl0ICdleGVjJyAgICwge3R5cGU6dHlwZSwgZGF0YTpkYXRhfVxuXHRcdFx0XHRcdFx0XHR3aGVuICcrJyB0aGVuIEBtaUVtaXR0ZXIuZW1pdCAnc3RhdHVzJyAsIHt0eXBlOnR5cGUsIGRhdGE6ZGF0YX1cblxuXHRcdFx0XHRcdGVsc2UgaWYgbWF0Y2ggPSBsaW5lLm1hdGNoIG1hdGNoU3RyZWFtSGVhZGVyXG5cdFx0XHRcdFx0XHRkYXRhID0gcGFyc2VNaTIgbWF0Y2hbMl1cblx0XHRcdFx0XHRcdGRhdGEgPSBpZiBkYXRhIHRoZW4gZGF0YS5fIGVsc2UgJydcblxuXHRcdFx0XHRcdFx0aWYgQGxvZ1RvQ29uc29sZSB0aGVuIGNvbnNvbGUubG9nICdkYmctZ2RiIDwgJyxtYXRjaFsxXSxkYXRhXG5cblx0XHRcdFx0XHRcdHN3aXRjaCBtYXRjaFsxXVxuXHRcdFx0XHRcdFx0XHR3aGVuICd+JyB0aGVuIEBtaUVtaXR0ZXIuZW1pdCAnY29uc29sZScsIGRhdGEudHJpbSgpXG5cdFx0XHRcdFx0XHRcdHdoZW4gJyYnIHRoZW4gQG1pRW1pdHRlci5lbWl0ICdsb2cnLCBkYXRhLnRyaW0oKVxuXHRcdFx0XHRcdGVsc2Vcblx0XHRcdFx0XHRcdGlmIGxpbmUhPScoZ2RiKScgYW5kIGxpbmUhPScoZ2RiKSAnXG5cdFx0XHRcdFx0XHRcdGlmIEBsb2dUb0NvbnNvbGUgdGhlbiBjb25zb2xlLmxvZyAnZGJnLWdkYiA8ICcsbGluZVxuXHRcdFx0XHRcdFx0XHRpZiBAb3V0cHV0UGFuZWxcblx0XHRcdFx0XHRcdFx0XHRpZiBAc2hvd091dHB1dFBhbmVsTmV4dFxuXHRcdFx0XHRcdFx0XHRcdFx0QHNob3dPdXRwdXRQYW5lbE5leHQgPSBmYWxzZVxuXHRcdFx0XHRcdFx0XHRcdFx0QG91dHB1dFBhbmVsLnNob3coKVxuXHRcdFx0XHRcdFx0XHRcdEB1bnNlZW5PdXRwdXRQYW5lbENvbnRlbnQgPSB0cnVlXG5cdFx0XHRcdFx0XHRcdFx0QG91dHB1dFBhbmVsLnByaW50IGxpbmVcblxuXHRcdFx0c3RkZXJyOiAoZGF0YSkgPT5cblx0XHRcdFx0aWYgQG91dHB1dFBhbmVsXG5cdFx0XHRcdFx0aWYgQHNob3dPdXRwdXRQYW5lbE5leHRcblx0XHRcdFx0XHRcdEBzaG93T3V0cHV0UGFuZWxOZXh0ID0gZmFsc2Vcblx0XHRcdFx0XHRcdEBvdXRwdXRQYW5lbC5zaG93KClcblx0XHRcdFx0XHRAdW5zZWVuT3V0cHV0UGFuZWxDb250ZW50ID0gdHJ1ZVxuXHRcdFx0XHRcdEBvdXRwdXRQYW5lbC5wcmludCBsaW5lIGZvciBsaW5lIGluIGRhdGEucmVwbGFjZSgvXFxyP1xcbiQvLCcnKS5zcGxpdCgvXFxyP1xcbi8pXG5cblx0XHRcdGV4aXQ6IChkYXRhKSA9PlxuXHRcdFx0XHRAbWlFbWl0dGVyLmVtaXQgJ2V4aXQnXG5cblx0XHRAcHJvY2Vzcy5lbWl0dGVyLm9uICd3aWxsLXRocm93LWVycm9yJywgKGV2ZW50KSA9PlxuXHRcdFx0ZXZlbnQuaGFuZGxlKClcblxuXHRcdFx0ZXJyb3IgPSBldmVudC5lcnJvclxuXG5cdFx0XHRpZiBlcnJvci5jb2RlID09ICdFTk9FTlQnICYmIChlcnJvci5zeXNjYWxsLmluZGV4T2YgJ3NwYXduJykgPT0gMFxuXHRcdFx0XHRoYW5kbGVFcnJvciBcIkNvdWxkIG5vdCBmaW5kIGAje2NvbW1hbmR9YCAgXFxuUGxlYXNlIGVuc3VyZSBpdCBpcyBjb3JyZWN0bHkgaW5zdGFsbGVkIGFuZCBhdmFpbGFibGUgaW4geW91ciBzeXN0ZW0gUEFUSFwiXG5cdFx0XHRlbHNlXG5cdFx0XHRcdGhhbmRsZUVycm9yIGVycm9yLm1lc3NhZ2VcblxuXHRcdEBwcm9jZXNzQXdhaXRpbmcgPSBmYWxzZVxuXHRcdEBwcm9jZXNzUXVldWVkID0gW11cblxuXHRzdG9wOiAtPlxuXHRcdCMgQGNsZWFudXBGcmFtZSgpXG5cdFx0QGVycm9yRW5jb3VudGVyZWQgPSBudWxsXG5cdFx0QHZhcmlhYmxlT2JqZWN0cyA9IHt9XG5cdFx0QHZhcmlhYmxlUm9vdE9iamVjdHMgPSB7fVxuXG5cdFx0QHByb2Nlc3M/LmtpbGwoKVxuXHRcdEBwcm9jZXNzID0gbnVsbFxuXHRcdEBwcm9jZXNzQXdhaXRpbmcgPSBmYWxzZVxuXHRcdEBwcm9jZXNzUXVldWVkID0gW11cblxuXHRcdGlmIEBpbnRlcmFjdGl2ZVNlc3Npb25cblx0XHRcdEBpbnRlcmFjdGl2ZVNlc3Npb24uZGlzY2FyZCgpXG5cdFx0XHRAaW50ZXJhY3RpdmVTZXNzaW9uID0gbnVsbFxuXG5cdFx0c2V0VGltZW91dCA9PiAjIHdhaXQgZm9yIGFueSBxdWV1ZWQgb3V0cHV0IHRvIHByb2Nlc3MsIGZpcnN0XG5cdFx0XHRpZiAhQGNsb3NlZE5hdHVyYWxseSBvciAhQHVuc2Vlbk91dHB1dFBhbmVsQ29udGVudFxuXHRcdFx0XHRAb3V0cHV0UGFuZWw/LmhpZGUoKVxuXHRcdCwgMFxuXG5cdGNvbnRpbnVlOiAtPlxuXHRcdEBjbGVhbnVwRnJhbWUoKS50aGVuID0+XG5cdFx0XHRAc2VuZENvbW1hbmQgJy1leGVjLWNvbnRpbnVlIC0tYWxsJ1xuXHRcdFx0XHQuY2F0Y2ggKGVycm9yKSA9PlxuXHRcdFx0XHRcdGlmIHR5cGVvZiBlcnJvciAhPSAnc3RyaW5nJyB0aGVuIHJldHVyblxuXHRcdFx0XHRcdEBoYW5kbGVNaUVycm9yIGVycm9yXG5cblx0cGF1c2U6IC0+XG5cdFx0QGNsZWFudXBGcmFtZSgpLnRoZW4gPT5cblx0XHRcdEBzZW5kQ29tbWFuZCAnLWV4ZWMtaW50ZXJydXB0IC0tYWxsJ1xuXHRcdFx0XHQuY2F0Y2ggKGVycm9yKSA9PlxuXHRcdFx0XHRcdGlmIHR5cGVvZiBlcnJvciAhPSAnc3RyaW5nJyB0aGVuIHJldHVyblxuXHRcdFx0XHRcdEBoYW5kbGVNaUVycm9yIGVycm9yXG5cblx0c2VsZWN0RnJhbWU6IChpbmRleCkgLT5cblx0XHRAY2xlYW51cEZyYW1lKCkudGhlbiA9PlxuXHRcdFx0cmV2ZXJzZWRJbmRleCA9IEBzdGFja0xpc3QubGVuZ3RoLTEtaW5kZXhcblx0XHRcdEBmcmFtZSA9IHJldmVyc2VkSW5kZXhcblx0XHRcdEB1aS5zZXRGcmFtZSBpbmRleFxuXHRcdFx0QHJlZnJlc2hGcmFtZSgpXG5cblx0Z2V0VmFyaWFibGVDaGlsZHJlbjogKG5hbWUpIC0+IHJldHVybiBuZXcgUHJvbWlzZSAoZnVsZmlsbCkgPT5cblx0XHRzZXBlcmF0b3IgPSBuYW1lLmxhc3RJbmRleE9mICcuJ1xuXHRcdGlmIHNlcGVyYXRvciA+PSAwXG5cdFx0XHR2YXJpYWJsZU5hbWUgPSBAdmFyaWFibGVPYmplY3RzW25hbWUuc3Vic3RyIDAsIHNlcGVyYXRvcl0gKyAnLicgKyAobmFtZS5zdWJzdHIgc2VwZXJhdG9yKzEpXG5cdFx0ZWxzZVxuXHRcdFx0dmFyaWFibGVOYW1lID0gQHZhcmlhYmxlT2JqZWN0c1tuYW1lXVxuXG5cdFx0QHNlbmRDb21tYW5kICctdmFyLWxpc3QtY2hpbGRyZW4gMSAnK3ZhcmlhYmxlTmFtZVxuXHRcdFx0LnRoZW4gKHt0eXBlLCBkYXRhfSkgPT5cblx0XHRcdFx0Y2hpbGRyZW4gPSBbXVxuXHRcdFx0XHRpZiBkYXRhLmNoaWxkcmVuIHRoZW4gZm9yIGNoaWxkIGluIGRhdGEuY2hpbGRyZW5cblx0XHRcdFx0XHRAdmFyaWFibGVPYmplY3RzW25hbWUrJy4nK2NoaWxkLmV4cF0gPSBjaGlsZC5uYW1lXG5cblx0XHRcdFx0XHRjaGlsZHJlbi5wdXNoXG5cdFx0XHRcdFx0XHRuYW1lOiBjaGlsZC5leHBcblx0XHRcdFx0XHRcdHR5cGU6IGNoaWxkLnR5cGVcblx0XHRcdFx0XHRcdHZhbHVlOiBwcmV0dHlWYWx1ZSBjaGlsZC52YWx1ZVxuXHRcdFx0XHRcdFx0ZXhwYW5kYWJsZTogY2hpbGQubnVtY2hpbGQgYW5kIHBhcnNlSW50KGNoaWxkLm51bWNoaWxkKSA+IDBcblxuXHRcdFx0XHRmdWxmaWxsIGNoaWxkcmVuXG5cblx0XHRcdC5jYXRjaCAoZXJyb3IpID0+XG5cdFx0XHRcdGlmIHR5cGVvZiBlcnJvciAhPSAnc3RyaW5nJyB0aGVuIHJldHVyblxuXG5cdFx0XHRcdGZ1bGZpbGwgW1xuXHRcdFx0XHRcdG5hbWU6ICcnXG5cdFx0XHRcdFx0dHlwZTogJydcblx0XHRcdFx0XHR2YWx1ZTogZXJyb3Jcblx0XHRcdFx0XHRleHBhbmRhYmxlOiBmYWxzZVxuXHRcdFx0XHRdXG5cblx0c2VsZWN0VGhyZWFkOiAoaW5kZXgpIC0+XG5cdFx0QGNsZWFudXBGcmFtZSgpLnRoZW4gPT5cblx0XHRcdEB0aHJlYWQgPSBpbmRleFxuXHRcdFx0QHVpLnNldFRocmVhZCBpbmRleFxuXHRcdFx0QHJlZnJlc2hGcmFtZSgpXG5cblx0cmVmcmVzaEZyYW1lOiAtPlxuXHRcdCMgQHNlbmRDb21tYW5kICctc3RhY2stbGlzdC12YXJpYWJsZXMgLS10aHJlYWQgJytAdGhyZWFkKycgLS1mcmFtZSAnK0BmcmFtZSsnIDInXG5cdFx0IyBcdC50aGVuICh7dHlwZSwgZGF0YX0pID0+XG5cdFx0IyBcdFx0dmFyaWFibGVzID0gW11cblx0XHQjIFx0XHRpZiBkYXRhLnZhcmlhYmxlc1xuXHRcdCMgXHRcdFx0Zm9yIHZhcmlhYmxlIGluIGRhdGEudmFyaWFibGVzXG5cdFx0IyBcdFx0XHRcdHZhcmlhYmxlcy5wdXNoXG5cdFx0IyBcdFx0XHRcdFx0bmFtZTogdmFyaWFibGUubmFtZVxuXHRcdCMgXHRcdFx0XHRcdHR5cGU6IHZhcmlhYmxlLnR5cGVcblx0XHQjIFx0XHRcdFx0XHR2YWx1ZTogdmFyaWFibGUudmFsdWVcblx0XHQjIFx0XHRAdWkuc2V0VmFyaWFibGVzIHZhcmlhYmxlc1xuXHRcdCMgXHQuY2F0Y2ggKGVycm9yKSA9PlxuXHRcdCMgXHRpZiB0eXBlb2YgZXJyb3IgIT0gJ3N0cmluZycgdGhlbiByZXR1cm5cblx0XHQjIFx0QGhhbmRsZU1pRXJyb3IgZXJyb3JcblxuXHRcdEBzZW5kQ29tbWFuZCAnLXN0YWNrLWxpc3QtdmFyaWFibGVzIC0tdGhyZWFkICcrQHRocmVhZCsnIC0tZnJhbWUgJytAZnJhbWUrJyAxJ1xuXHRcdFx0LnRoZW4gKHt0eXBlLCBkYXRhfSkgPT5cblx0XHRcdFx0dmFyaWFibGVzID0gW11cblx0XHRcdFx0cGVuZGluZyA9IDBcblx0XHRcdFx0c3RhcnQgPSAtPiBwZW5kaW5nKytcblx0XHRcdFx0c3RvcCA9ID0+XG5cdFx0XHRcdFx0cGVuZGluZy0tXG5cdFx0XHRcdFx0aWYgIXBlbmRpbmdcblx0XHRcdFx0XHRcdEB1aS5zZXRWYXJpYWJsZXMgdmFyaWFibGVzXG5cblx0XHRcdFx0c3RhcnQoKVxuXHRcdFx0XHRpZiBkYXRhLnZhcmlhYmxlc1xuXHRcdFx0XHRcdGZvciB2YXJpYWJsZSBpbiBkYXRhLnZhcmlhYmxlc1xuXHRcdFx0XHRcdFx0ZG8gKHZhcmlhYmxlKSA9PlxuXHRcdFx0XHRcdFx0XHRzdGFydCgpXG5cdFx0XHRcdFx0XHRcdEBzZW5kQ29tbWFuZCAnLXZhci1jcmVhdGUgLSAqICcrdmFyaWFibGUubmFtZVxuXHRcdFx0XHRcdFx0XHRcdC50aGVuICh7dHlwZSwgZGF0YX0pID0+XG5cdFx0XHRcdFx0XHRcdFx0XHRAdmFyaWFibGVPYmplY3RzW3ZhcmlhYmxlLm5hbWVdID0gQHZhcmlhYmxlUm9vdE9iamVjdHNbdmFyaWFibGUubmFtZV0gPSBkYXRhLm5hbWVcblx0XHRcdFx0XHRcdFx0XHRcdHZhcmlhYmxlcy5wdXNoXG5cdFx0XHRcdFx0XHRcdFx0XHRcdG5hbWU6IHZhcmlhYmxlLm5hbWVcblx0XHRcdFx0XHRcdFx0XHRcdFx0dmFsdWU6IHByZXR0eVZhbHVlIHZhcmlhYmxlLnZhbHVlXG5cdFx0XHRcdFx0XHRcdFx0XHRcdHR5cGU6IGRhdGEudHlwZVxuXHRcdFx0XHRcdFx0XHRcdFx0XHRleHBhbmRhYmxlOiBkYXRhLm51bWNoaWxkIGFuZCAocGFyc2VJbnQgZGF0YS5udW1jaGlsZCkgPiAwXG5cdFx0XHRcdFx0XHRcdFx0XHRzdG9wKClcblxuXHRcdFx0XHRcdFx0XHRcdC5jYXRjaCAoZXJyb3IpID0+XG5cdFx0XHRcdFx0XHRcdFx0XHRpZiB0eXBlb2YgZXJyb3IgIT0gJ3N0cmluZycgdGhlbiByZXR1cm5cblx0XHRcdFx0XHRcdFx0XHRcdGlmIHZhcmlhYmxlLnZhbHVlICE9ICc8b3B0aW1pemVkIG91dD4nIHRoZW4gQGhhbmRsZU1pRXJyb3IgZXJyb3Jcblx0XHRcdFx0XHRcdFx0XHRcdHZhcmlhYmxlcy5wdXNoXG5cdFx0XHRcdFx0XHRcdFx0XHRcdG5hbWU6IHZhcmlhYmxlLm5hbWVcblx0XHRcdFx0XHRcdFx0XHRcdFx0dmFsdWU6IHZhcmlhYmxlLnZhbHVlXG5cdFx0XHRcdFx0XHRcdFx0XHRzdG9wKClcblxuXHRcdFx0XHRzdG9wKClcblxuXHRcdFx0LmNhdGNoIChlcnJvcikgPT5cblx0XHRcdFx0aWYgdHlwZW9mIGVycm9yICE9ICdzdHJpbmcnIHRoZW4gcmV0dXJuXG5cdFx0XHRcdEBoYW5kbGVNaUVycm9yIGVycm9yXG5cblx0c3RlcEluOiAtPlxuXHRcdEBjbGVhbnVwRnJhbWUoKS50aGVuID0+XG5cdFx0XHRAc2VuZENvbW1hbmQgJy1leGVjLXN0ZXAnXG5cdFx0XHRcdC5jYXRjaCAoZXJyb3IpID0+XG5cdFx0XHRcdFx0aWYgdHlwZW9mIGVycm9yICE9ICdzdHJpbmcnIHRoZW4gcmV0dXJuXG5cdFx0XHRcdFx0QGhhbmRsZU1pRXJyb3IgZXJyb3JcblxuXHRzdGVwT3ZlcjogLT5cblx0XHRAY2xlYW51cEZyYW1lKCkudGhlbiA9PlxuXHRcdFx0QHNlbmRDb21tYW5kICctZXhlYy1uZXh0J1xuXHRcdFx0XHQuY2F0Y2ggKGVycm9yKSA9PlxuXHRcdFx0XHRcdGlmIHR5cGVvZiBlcnJvciAhPSAnc3RyaW5nJyB0aGVuIHJldHVyblxuXHRcdFx0XHRcdEBoYW5kbGVNaUVycm9yIGVycm9yXG5cblx0c3RlcE91dDogLT5cblx0XHRAY2xlYW51cEZyYW1lKCkudGhlbiA9PlxuXHRcdFx0QHNlbmRDb21tYW5kICctZXhlYy1maW5pc2gnXG5cdFx0XHRcdC5jYXRjaCAoZXJyb3IpID0+XG5cdFx0XHRcdFx0aWYgdHlwZW9mIGVycm9yICE9ICdzdHJpbmcnIHRoZW4gcmV0dXJuXG5cdFx0XHRcdFx0QGhhbmRsZU1pRXJyb3IgZXJyb3JcblxuXHRzZW5kQ29tbWFuZDogKGNvbW1hbmQsIGxvZ0NhbGxiYWNrKSAtPlxuXHRcdGlmIEBwcm9jZXNzQXdhaXRpbmdcblx0XHRcdHJldHVybiBuZXcgUHJvbWlzZSAocmVzb2x2ZSwgcmVqZWN0KSA9PlxuXHRcdFx0XHRAcHJvY2Vzc1F1ZXVlZC5wdXNoID0+XG5cdFx0XHRcdFx0QHNlbmRDb21tYW5kIGNvbW1hbmRcblx0XHRcdFx0XHRcdC50aGVuIHJlc29sdmUsIHJlamVjdFxuXG5cdFx0QHByb2Nlc3NBd2FpdGluZyA9IHRydWVcblxuXHRcdGxvZ0xpc3RlbmVyID0gbnVsbFxuXHRcdGlmIGxvZ0NhbGxiYWNrXG5cdFx0XHRsb2dMaXN0ZW5lciA9IEBtaUVtaXR0ZXIub24gJ2xvZycsIGxvZ0NhbGxiYWNrXG5cblx0XHRzdWNjZXNzRXZlbnQgPSBudWxsXG5cdFx0ZXhpdEV2ZW50ID0gbnVsbFxuXHRcdHByb21pc2UgPSBQcm9taXNlLnJhY2UgW1xuXHRcdFx0bmV3IFByb21pc2UgKHJlc29sdmUsIHJlamVjdCkgPT5cblx0XHRcdFx0c3VjY2Vzc0V2ZW50ID0gQG1pRW1pdHRlci5vbmNlICdyZXN1bHQnLCAoe3R5cGUsIGRhdGF9KSA9PlxuXHRcdFx0XHRcdGV4aXRFdmVudC5kaXNwb3NlKClcblx0XHRcdFx0XHQjIFwiZG9uZVwiLCBcInJ1bm5pbmdcIiAoc2FtZSBhcyBkb25lKSwgXCJjb25uZWN0ZWRcIiwgXCJlcnJvclwiLCBcImV4aXRcIlxuXHRcdFx0XHRcdCMgaHR0cHM6Ly9zb3VyY2V3YXJlLm9yZy9nZGIvb25saW5lZG9jcy9nZGIvR0RCXzAwMmZNSS1SZXN1bHQtUmVjb3Jkcy5odG1sI0dEQl8wMDJmTUktUmVzdWx0LVJlY29yZHNcblx0XHRcdFx0XHRpZiB0eXBlPT0nZXJyb3InXG5cdFx0XHRcdFx0XHRyZWplY3QgZGF0YS5tc2d8fCdVbmtub3duIEdEQiBlcnJvcidcblx0XHRcdFx0XHRlbHNlXG5cdFx0XHRcdFx0XHRyZXNvbHZlIHt0eXBlOnR5cGUsIGRhdGE6ZGF0YX1cblx0XHRcdCxuZXcgUHJvbWlzZSAocmVzb2x2ZSwgcmVqZWN0KSA9PlxuXHRcdFx0XHRleGl0RXZlbnQgPSBAbWlFbWl0dGVyLm9uY2UgJ2V4aXQnLCA9PlxuXHRcdFx0XHRcdHN1Y2Nlc3NFdmVudC5kaXNwb3NlKClcblx0XHRcdFx0XHRyZWplY3QgJ0RlYnVnZ2VyIHRlcm1pbmF0ZWQnXG5cdFx0XVxuXG5cdFx0cHJvbWlzZS50aGVuID0+XG5cdFx0XHRsb2dMaXN0ZW5lcj8uZGlzcG9zZSgpXG5cdFx0XHRAcHJvY2Vzc0F3YWl0aW5nID0gZmFsc2Vcblx0XHRcdGlmIEBwcm9jZXNzUXVldWVkLmxlbmd0aCA+IDBcblx0XHRcdFx0QHByb2Nlc3NRdWV1ZWQuc2hpZnQoKSgpXG5cdFx0LCAoZXJyb3IpID0+XG5cdFx0XHRsb2dMaXN0ZW5lcj8uZGlzcG9zZSgpXG5cdFx0XHRAcHJvY2Vzc0F3YWl0aW5nID0gZmFsc2Vcblx0XHRcdGlmIHR5cGVvZiBlcnJvciAhPSAnc3RyaW5nJ1xuXHRcdFx0XHRjb25zb2xlLmVycm9yIGVycm9yXG5cdFx0XHRpZiBAcHJvY2Vzc1F1ZXVlZC5sZW5ndGggPiAwXG5cdFx0XHRcdEBwcm9jZXNzUXVldWVkLnNoaWZ0KCkoKVxuXG5cdFx0aWYgQGxvZ1RvQ29uc29sZSB0aGVuIGNvbnNvbGUubG9nICdkYmctZ2RiID4gJyxjb21tYW5kXG5cdFx0QHByb2Nlc3MucHJvY2Vzcy5zdGRpbi53cml0ZSBjb21tYW5kKydcXHJcXG4nLCBiaW5hcnk6IHRydWVcblx0XHRyZXR1cm4gcHJvbWlzZVxuXG5cdGhhbmRsZU1pRXJyb3I6IChlcnJvciwgdGl0bGUpIC0+XG5cdFx0YXRvbS5ub3RpZmljYXRpb25zLmFkZEVycm9yIHRpdGxlfHwnRXJyb3IgcmVjZWl2ZWQgZnJvbSBHREInLFxuXHRcdFx0ZGVzY3JpcHRpb246ICdHREIgc2FpZDpcXG5cXG4+ICcrZXJyb3IudHJpbSgpLnNwbGl0KC9cXHI/XFxuLykuam9pbignXFxuXFxuPiAnKVxuXHRcdFx0ZGlzbWlzc2FibGU6IHRydWVcblxuXHRhZGRCcmVha3BvaW50OiAoYnJlYWtwb2ludCkgLT5cblx0XHRAYnJlYWtwb2ludHMucHVzaCBicmVha3BvaW50XG5cdFx0QHNlbmRDb21tYW5kICctYnJlYWstaW5zZXJ0IC1mICcrKGVzY2FwZVBhdGggYnJlYWtwb2ludC5wYXRoKSsnOicrYnJlYWtwb2ludC5saW5lLCAobG9nKSA9PlxuXHRcdFx0aWYgbWF0Y2hlZCA9IGxvZy5tYXRjaCAvbm8gc291cmNlIGZpbGUgbmFtZWQgKC4qPylcXC4/JC9pXG5cdFx0XHRcdGF0b20ubm90aWZpY2F0aW9ucy5hZGRFcnJvciAnRXJyb3IgaW5zZXJ0aW5nIGJyZWFrcG9pbnQnLFxuXHRcdFx0XHRcdGRlc2NyaXB0aW9uOiAnVGhpcyBmaWxlIHdhcyBub3QgZm91bmQgd2l0aGluIHRoZSBjdXJyZW50IGV4ZWN1dGFibGUuICBcXG5QbGVhc2UgZW5zdXJlIGRlYnVnIHN5bWJvbHMgZm9yIHRoaXMgZmlsZSBhcmUgaW5jbHVkZWQgaW4gdGhlIGNvbXBpbGVkIGV4ZWN1dGFibGUuJ1xuXHRcdFx0XHRcdGRpc21pc3NhYmxlOiB0cnVlXG5cblx0XHRcdGVsc2UgaWYgbG9nLm1hdGNoIC9ubyBzeW1ib2wgdGFibGUgaXMgbG9hZGVkL2lcblx0XHRcdFx0YXRvbS5ub3RpZmljYXRpb25zLmFkZEVycm9yICdFcnJvciBpbnNlcnRpbmcgYnJlYWtwb2ludCcsXG5cdFx0XHRcdFx0ZGVzY3JpcHRpb246ICdUaGlzIHByb2dyYW0gd2FzIG5vdCBjb21waWxlZCB3aXRoIGRlYnVnIHN5bWJvbHMuICBcXG5CcmVha3BvaW50cyBjYW5ub3QgYmUgdXNlZC4nXG5cdFx0XHRcdFx0ZGlzbWlzc2FibGU6IHRydWVcblxuXHRyZW1vdmVCcmVha3BvaW50OiAoYnJlYWtwb2ludCkgLT5cblx0XHRmb3IgaSxjb21wYXJlIGluIEBicmVha3BvaW50c1xuXHRcdFx0aWYgY29tcGFyZT09YnJlYWtwb2ludFxuXHRcdFx0XHRAYnJlYWtwb2ludHMuc3BsaWNlIGksMVxuXG5cdFx0QHNlbmRDb21tYW5kICctYnJlYWstbGlzdCdcblx0XHRcdC50aGVuICh7dHlwZSwgZGF0YX0pID0+XG5cdFx0XHRcdGlmIGRhdGEuQnJlYWtwb2ludFRhYmxlXG5cdFx0XHRcdFx0Zm9yIGVudHJ5IGluIGRhdGEuQnJlYWtwb2ludFRhYmxlLmJvZHlcblx0XHRcdFx0XHRcdGlmIGVudHJ5LmZ1bGxuYW1lPT1icmVha3BvaW50LnBhdGggYW5kIHBhcnNlSW50KGVudHJ5LmxpbmUpPT1icmVha3BvaW50LmxpbmVcblx0XHRcdFx0XHRcdFx0QHNlbmRDb21tYW5kICctYnJlYWstZGVsZXRlICcrZW50cnkubnVtYmVyXG5cdFx0XHRcdFx0XHRcdFx0LmNhdGNoIChlcnJvcikgPT5cblx0XHRcdFx0XHRcdFx0XHRcdGlmIHR5cGVvZiBlcnJvciAhPSAnc3RyaW5nJyB0aGVuIHJldHVyblxuXHRcdFx0XHRcdFx0XHRcdFx0QGhhbmRsZU1pRXJyb3IgZXJyb3JcblxuXHRwcm92aWRlRGJnUHJvdmlkZXI6IC0+XG5cdFx0bmFtZTogJ2RiZy1nZGInXG5cdFx0ZGVzY3JpcHRpb246ICdHREIgZGVidWdnZXInXG5cblx0XHRjYW5IYW5kbGVPcHRpb25zOiAob3B0aW9ucykgPT5cblx0XHRcdHJldHVybiBuZXcgUHJvbWlzZSAoZnVsZmlsbCwgcmVqZWN0KSA9PlxuXHRcdFx0XHRAc3RhcnQgb3B0aW9uc1xuXG5cdFx0XHRcdEBzZW5kQ29tbWFuZCAnLWZpbGUtZXhlYy1hbmQtc3ltYm9scyAnK2VzY2FwZVBhdGggKHBhdGgucmVzb2x2ZSBvcHRpb25zLmJhc2VkaXJ8fCcnLCBvcHRpb25zLnBhdGgpXG5cdFx0XHRcdFx0LnRoZW4gPT5cblx0XHRcdFx0XHRcdEBzdG9wKClcblx0XHRcdFx0XHRcdGZ1bGZpbGwgdHJ1ZVxuXG5cdFx0XHRcdFx0LmNhdGNoIChlcnJvcikgPT5cblx0XHRcdFx0XHRcdEBzdG9wKClcblx0XHRcdFx0XHRcdGlmIHR5cGVvZiBlcnJvciA9PSAnc3RyaW5nJyAmJiBlcnJvci5tYXRjaCAvbm90IGluIGV4ZWN1dGFibGUgZm9ybWF0L1xuXHRcdFx0XHRcdFx0XHQjIEVycm9yIHdhcyBkZWZpbml0ZWx5IHRoZSBmaWxlLiBUaGlzIGlzIG5vdC1kZWJ1Z2dhYmxlXG5cdFx0XHRcdFx0XHRcdGZ1bGZpbGwgZmFsc2Vcblx0XHRcdFx0XHRcdGVsc2Vcblx0XHRcdFx0XHRcdFx0IyBFcnJvciB3YXMgc29tZXRoaW5nIGVsc2UuIFNheSBcInllc1wiIGZvciBub3csIHNvIHRoYXQgdGhlIHVzZXIgY2FuIGJlZ2luIHRoZSBkZWJ1ZyBhbmQgc2VlIHdoYXQgaXQgcmVhbGx5IGlzXG5cdFx0XHRcdFx0XHRcdGZ1bGZpbGwgdHJ1ZVxuXG5cdFx0ZGVidWc6IEBkZWJ1Zy5iaW5kIHRoaXNcblx0XHRzdG9wOiBAc3RvcC5iaW5kIHRoaXNcblxuXHRcdGNvbnRpbnVlOiBAY29udGludWUuYmluZCB0aGlzXG5cdFx0cGF1c2U6IEBwYXVzZS5iaW5kIHRoaXNcblxuXHRcdHNlbGVjdEZyYW1lOiBAc2VsZWN0RnJhbWUuYmluZCB0aGlzXG5cdFx0Z2V0VmFyaWFibGVDaGlsZHJlbjogQGdldFZhcmlhYmxlQ2hpbGRyZW4uYmluZCB0aGlzXG5cblx0XHRzdGVwSW46IEBzdGVwSW4uYmluZCB0aGlzXG5cdFx0c3RlcE92ZXI6IEBzdGVwT3Zlci5iaW5kIHRoaXNcblx0XHRzdGVwT3V0OiBAc3RlcE91dC5iaW5kIHRoaXNcblxuXHRcdGFkZEJyZWFrcG9pbnQ6IEBhZGRCcmVha3BvaW50LmJpbmQgdGhpc1xuXHRcdHJlbW92ZUJyZWFrcG9pbnQ6IEByZW1vdmVCcmVha3BvaW50LmJpbmQgdGhpc1xuXG5cdGNvbnN1bWVEYmc6IChkYmcpIC0+XG5cdFx0QGRiZyA9IGRiZ1xuIl19
