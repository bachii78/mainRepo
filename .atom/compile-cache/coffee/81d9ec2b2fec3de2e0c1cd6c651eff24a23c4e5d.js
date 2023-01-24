(function() {
  var CompositeDisposable, InteractiveSession, Pty;

  CompositeDisposable = require('atom').CompositeDisposable;

  Pty = null;

  if (process.platform !== 'win32') {
    try {
      Pty = require('node-pty');
    } catch (error) {
      Pty = null;
    }
  }

  InteractiveSession = require('./InteractiveSession').InteractiveSession;

  module.exports = {
    process: null,
    panel: null,
    subscriptions: null,
    activate: function() {
      var ref;
      this.subscriptions = new CompositeDisposable;
      this.subscriptions.add(atom.commands.add('atom-workspace', {
        'output-panel:show': (function(_this) {
          return function() {
            return _this.show();
          };
        })(this)
      }));
      this.subscriptions.add(atom.commands.add('atom-workspace', {
        'output-panel:hide': (function(_this) {
          return function() {
            return _this.hide();
          };
        })(this)
      }));
      this.subscriptions.add(atom.commands.add('atom-workspace', {
        'output-panel:toggle': (function(_this) {
          return function() {
            return _this.toggle();
          };
        })(this)
      }));
      this.subscriptions.add(atom.commands.add('atom-workspace', {
        'core:cancel': (function(_this) {
          return function() {
            return _this.hide();
          };
        })(this)
      }));
      this.subscriptions.add(atom.commands.add('.output-panel .terminal', {
        'core:copy': (function(_this) {
          return function(event) {
            event.stopPropagation();
            return _this.copy();
          };
        })(this)
      }));
      this.subscriptions.add(atom.commands.add('.output-panel .terminal', {
        'core:paste': (function(_this) {
          return function(event) {
            event.stopPropagation();
            return _this.paste();
          };
        })(this)
      }));
      this.subscriptions.add(atom.commands.add('.output-panel .terminal', {
        'core:select-all': (function(_this) {
          return function(event) {
            event.stopPropagation();
            return _this.selectAll();
          };
        })(this)
      }));
      this.interactiveSessions = [];
      this.pty = Pty != null ? Pty.open({
        name: 'xterm-256color',
        cols: 80,
        rows: 8
      }) : void 0;
      return (ref = this.pty) != null ? ref.on('data', (function(_this) {
        return function(data) {
          return _this.print(data, false);
        };
      })(this)) : void 0;
    },
    deactivate: function() {
      var ref;
      if ((ref = this.panel) != null) {
        ref.destroy();
      }
      return this.subscriptions.dispose();
    },
    _create: function() {
      return new Promise((function(_this) {
        return function(fulfill) {
          var Panel;
          if (!_this.panel) {
            Panel = require('./view/Panel').Panel;
            _this.panel = new Panel(_this);
            _this.panel.onDidDestroy(function() {
              return _this.panel = null;
            });
          }
          return atom.workspace.open(_this.panel, {
            searchAllPanes: true
          }).then(function() {
            if (_this.panel) {
              _this._onItemResize(_this.panel, function() {
                var ref;
                return (ref = _this.panel) != null ? ref.resize() : void 0;
              });
            }
            return fulfill();
          });
        };
      })(this));
    },
    show: function() {
      return new Promise((function(_this) {
        return function(fulfill) {
          return _this._create();
        };
      })(this));
    },
    hide: function() {
      if (this.panel) {
        return atom.workspace.hide(this.panel);
      }
    },
    toggle: function() {
      if (!this.panel || !atom.workspace.hide(this.panel)) {
        return this.show();
      }
    },
    print: function(data, newline) {
      if (newline == null) {
        newline = true;
      }
      if (this.panel) {
        return this.panel.print(data, newline);
      } else {
        return this._create().then((function(_this) {
          return function() {
            var ref;
            return (ref = _this.panel) != null ? ref.print(data, newline) : void 0;
          };
        })(this));
      }
    },
    copy: function() {
      var ref;
      return (ref = this.panel) != null ? ref.copy() : void 0;
    },
    paste: function() {
      var ref;
      if (this.panel && this.panel.is_interactive) {
        return (ref = this.pty) != null ? ref.write(atom.clipboard.read()) : void 0;
      }
    },
    selectAll: function() {
      var ref;
      return (ref = this.panel) != null ? ref.selectAll() : void 0;
    },
    _onItemResize: function(item, callback) {
      var observer, pane, windowCallback, wrapper;
      observer = null;
      if (wrapper = item.element.closest('.atom-dock-content-wrapper')) {
        observer = new MutationObserver((function(_this) {
          return function() {
            return callback();
          };
        })(this));
        observer.observe(wrapper, {
          attributes: true
        });
      }
      windowCallback = (function(_this) {
        return function() {
          return callback();
        };
      })(this);
      window.addEventListener('resize', windowCallback);
      if (pane = atom.workspace.paneForItem(item)) {
        pane.observeFlexScale((function(_this) {
          return function() {
            return item.resize();
          };
        })(this));
        return pane.onDidRemoveItem((function(_this) {
          return function(event) {
            if (event.item === item) {
              if (observer != null) {
                observer.disconnect();
              }
              window.removeEventListener('resize', windowCallback);
              if (!event.removed) {
                return setTimeout(function() {
                  return _this._onItemResize(event.item, callback);
                }, 1);
              }
            }
          };
        })(this));
      }
    },
    run: function(show, path, args, options) {
      var firstOutput, spawn;
      this.initialise();
      this.stop();
      spawn = require('cross-spawn').spawn;
      this.process = spawn(path, args || [], options || {});
      this.process.stdout.setEncoding('utf8');
      this.process.stdout.pipe(this.panel.terminal);
      this.process.stderr.setEncoding('utf8');
      this.process.stderr.pipe(this.panel.terminal);
      if (show === true) {
        this.show();
      } else if (show === 'auto') {
        firstOutput = (function(_this) {
          return function() {
            _this.process.stdout.removeListener('data', firstOutput);
            _this.process.stderr.removeListener('data', firstOutput);
            return _this.show();
          };
        })(this);
        this.process.stdout.on('data', firstOutput);
        this.process.stderr.on('data', firstOutput);
      }
      return this.process;
    },
    stop: function() {
      if (this.process !== null) {
        this.process.kill();
        return this.process = null;
      }
    },
    getInteractiveSession: function() {
      return new InteractiveSession(this);
    },
    provideOutputPanel: function() {
      return {
        isVisible: (function(_this) {
          return function() {
            return _this.panel !== null;
          };
        })(this),
        run: this.run.bind(this),
        stop: this.stop.bind(this),
        show: this.show.bind(this),
        hide: this.hide.bind(this),
        toggle: this.toggle.bind(this),
        print: this.print.bind(this),
        clear: (function(_this) {
          return function() {
            var ref;
            return (ref = _this.panel) != null ? ref.clear() : void 0;
          };
        })(this),
        getInteractiveSession: this.getInteractiveSession.bind(this)
      };
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbGVhcm4vLmF0b20vcGFja2FnZXMvb3V0cHV0LXBhbmVsL2xpYi9tYWluLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUMsc0JBQXVCLE9BQUEsQ0FBUSxNQUFSOztFQUN4QixHQUFBLEdBQU07O0VBRU4sSUFBRyxPQUFPLENBQUMsUUFBUixLQUFrQixPQUFyQjtBQUNDO01BQ0MsR0FBQSxHQUFNLE9BQUEsQ0FBUSxVQUFSLEVBRFA7S0FBQSxhQUFBO01BR0MsR0FBQSxHQUFNLEtBSFA7S0FERDs7O0VBTUMscUJBQXNCLE9BQUEsQ0FBUSxzQkFBUjs7RUFFdkIsTUFBTSxDQUFDLE9BQVAsR0FDQztJQUFBLE9BQUEsRUFBUyxJQUFUO0lBQ0EsS0FBQSxFQUFPLElBRFA7SUFFQSxhQUFBLEVBQWUsSUFGZjtJQUlBLFFBQUEsRUFBVSxTQUFBO0FBQ1QsVUFBQTtNQUFBLElBQUMsQ0FBQSxhQUFELEdBQWlCLElBQUk7TUFDckIsSUFBQyxDQUFBLGFBQWEsQ0FBQyxHQUFmLENBQW1CLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBZCxDQUFrQixnQkFBbEIsRUFBb0M7UUFBQSxtQkFBQSxFQUFxQixDQUFBLFNBQUEsS0FBQTtpQkFBQSxTQUFBO21CQUFHLEtBQUMsQ0FBQSxJQUFELENBQUE7VUFBSDtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBckI7T0FBcEMsQ0FBbkI7TUFDQSxJQUFDLENBQUEsYUFBYSxDQUFDLEdBQWYsQ0FBbUIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFkLENBQWtCLGdCQUFsQixFQUFvQztRQUFBLG1CQUFBLEVBQXFCLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUE7bUJBQUcsS0FBQyxDQUFBLElBQUQsQ0FBQTtVQUFIO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFyQjtPQUFwQyxDQUFuQjtNQUNBLElBQUMsQ0FBQSxhQUFhLENB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QUFDLElBQU4sQ0FBVyxJQUFYLENBRk47UUFHQSxJQUFBLEVBQU0sSUFBQyxDQUFBLElBQUksQ0FBQyxJQUFOLENBQVcsSUFBWCxDQUhOO1FBSUEsSUFBQSxFQUFNLElBQUMsQ0FBQSxJQUFJLENBQUMsSUFBTixDQUFXLElBQVgsQ0FKTjtRQUtBLE1BQUEsRUFBUSxJQUFDLENBQUEsTUFBTSxDQUFDLElBQVIsQ0FBYSxJQUFiLENBTFI7UUFNQSxLQUFBLEVBQU8sSUFBQyxDQUFBLEtBQUssQ0FBQyxJQUFQLENBQVksSUFBWixDQU5QO1FBT0EsS0FBQSxFQUFPLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUE7QUFDTixnQkFBQTtvREFBTSxDQUFFLEtBQVIsQ0FBQTtVQURNO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQVBQO1FBU0EscUJBQUEsRUFBdUIsSUFBQyxDQUFBLHFCQUFxQixDQUFDLElBQXZCLENBQTRCLElBQTVCLENBVHZCOztJQURtQixDQXpJcEI7O0FBWkQiLCJzb3VyY2VzQ29udGVudCI6WyJ7Q29tcG9zaXRlRGlzcG9zYWJsZX0gPSByZXF1aXJlICdhdG9tJ1xuUHR5ID0gbnVsbFxuXG5pZiBwcm9jZXNzLnBsYXRmb3JtIT0nd2luMzInXG5cdHRyeVxuXHRcdFB0eSA9IHJlcXVpcmUgJ25vZGUtcHR5J1xuXHRjYXRjaFxuXHRcdFB0eSA9IG51bGxcblxue0ludGVyYWN0aXZlU2Vzc2lvbn0gPSByZXF1aXJlICcuL0ludGVyYWN0aXZlU2Vzc2lvbidcblxubW9kdWxlLmV4cG9ydHMgPVxuXHRwcm9jZXNzOiBudWxsXG5cdHBhbmVsOiBudWxsXG5cdHN1YnNjcmlwdGlvbnM6IG51bGxcblxuXHRhY3RpdmF0ZTogLT5cblx0XHRAc3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlXG5cdFx0QHN1YnNjcmlwdGlvbnMuYWRkIGF0b20uY29tbWFuZHMuYWRkICdhdG9tLXdvcmtzcGFjZScsICdvdXRwdXQtcGFuZWw6c2hvdyc6ID0+IEBzaG93KClcblx0XHRAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5jb21tYW5kcy5hZGQgJ2F0b20td29ya3NwYWNlJywgJ291dHB1dC1wYW5lbDpoaWRlJzogPT4gQGhpZGUoKVxuXHRcdEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLmNvbW1hbmRzLmFkZCAnYXRvbS13b3Jrc3BhY2UnLCAnb3V0cHV0LXBhbmVsOnRvZ2dsZSc6ID0+IEB0b2dnbGUoKVxuXHRcdCMgQHN1YnNjcmlwdGlvbnMuYWRkIGF0b20uY29tbWFuZHMuYWRkICdhdG9tLXdvcmtzcGFjZScsICdvdXRwdXQtcGFuZWw6cnVuJzogPT4ge1xuXHRcdCMgXHQjVE9ETzpwcm9tcHQgZm9yIHNvbWV0aGluZyB0byBydW5cblx0XHQjIH1cblx0XHQjIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLmNvbW1hbmRzLmFkZCAnYXRvbS13b3Jrc3BhY2UnLCAnb3V0cHV0LXBhbmVsOnN0b3AnOiA9PiBAc3RvcCgpXG5cdFx0QHN1YnNjcmlwdGlvbnMuYWRkIGF0b20uY29tbWFuZHMuYWRkICdhdG9tLXdvcmtzcGFjZScsICdjb3JlOmNhbmNlbCc6ID0+IEBoaWRlKClcblxuXHRcdEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLmNvbW1hbmRzLmFkZCAnLm91dHB1dC1wYW5lbCAudGVybWluYWwnLCAnY29yZTpjb3B5JzogKGV2ZW50KSA9PlxuXHRcdFx0ZXZlbnQuc3RvcFByb3BhZ2F0aW9uKClcblx0XHRcdEBjb3B5KClcblxuXHRcdEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLmNvbW1hbmRzLmFkZCAnLm91dHB1dC1wYW5lbCAudGVybWluYWwnLCAnY29yZTpwYXN0ZSc6IChldmVudCkgPT5cblx0XHRcdGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpXG5cdFx0XHRAcGFzdGUoKVxuXG5cdFx0QHN1YnNjcmlwdGlvbnMuYWRkIGF0b20uY29tbWFuZHMuYWRkICcub3V0cHV0LXBhbmVsIC50ZXJtaW5hbCcsICdjb3JlOnNlbGVjdC1hbGwnOiAoZXZlbnQpID0+XG5cdFx0XHRldmVudC5zdG9wUHJvcGFnYXRpb24oKVxuXHRcdFx0QHNlbGVjdEFsbCgpXG5cblx0XHRAaW50ZXJhY3RpdmVTZXNzaW9ucyA9IFtdXG5cblx0XHRAcHR5ID0gUHR5Py5vcGVuIHtcblx0XHRcdG5hbWU6ICd4dGVybS0yNTZjb2xvcidcblx0XHRcdGNvbHM6IDgwXG5cdFx0XHRyb3dzOiA4XG5cdFx0fVxuXG5cdFx0QHB0eT8ub24gJ2RhdGEnLCAoZGF0YSkgPT5cblx0XHRcdEBwcmludCBkYXRhLCBmYWxzZVxuXG5cdGRlYWN0aXZhdGU6IC0+XG5cdFx0QHBhbmVsPy5kZXN0cm95KClcblx0XHRAc3Vic2NyaXB0aW9ucy5kaXNwb3NlKClcblxuXHRfY3JlYXRlOiAtPiBuZXcgUHJvbWlzZSAoZnVsZmlsbCkgPT5cblx0XHRpZiAhQHBhbmVsXG5cdFx0XHR7UGFuZWx9ID0gcmVxdWlyZSAnLi92aWV3L1BhbmVsJ1xuXG5cdFx0XHRAcGFuZWwgPSBuZXcgUGFuZWwgdGhpc1xuXHRcdFx0QHBhbmVsLm9uRGlkRGVzdHJveSA9PiBAcGFuZWwgPSBudWxsXG5cblx0XHRhdG9tLndvcmtzcGFjZS5vcGVuIEBwYW5lbCwgc2VhcmNoQWxsUGFuZXM6IHRydWVcblx0XHRcdC50aGVuID0+XG5cdFx0XHRcdGlmIEBwYW5lbCB0aGVuIEBfb25JdGVtUmVzaXplIEBwYW5lbCwgPT4gQHBhbmVsPy5yZXNpemUoKVxuXHRcdFx0XHRmdWxmaWxsKClcblxuXHRzaG93OiAtPiBuZXcgUHJvbWlzZSAoZnVsZmlsbCkgPT5cblx0XHRyZXR1cm4gQF9jcmVhdGUoKVxuXG5cdGhpZGU6IC0+XG5cdFx0YXRvbS53b3Jrc3BhY2UuaGlkZSBAcGFuZWwgaWYgQHBhbmVsXG5cblx0dG9nZ2xlOiAtPlxuXHRcdGlmICFAcGFuZWwgfHwgIWF0b20ud29ya3NwYWNlLmhpZGUgQHBhbmVsIHRoZW4gQHNob3coKVxuXG5cdHByaW50OiAoZGF0YSwgbmV3bGluZSA9IHRydWUpIC0+XG5cdFx0aWYgQHBhbmVsICMgcHJpbnQgaWYgcGFuZWwgZXhpc3RzLCBidXQgdG8gbm90IG5lY2Nhc2FyaWx5IHNob3cgKGluIGNhc2Ugb2YgbWluaW1pc2F0aW9uKVxuXHRcdFx0QHBhbmVsLnByaW50IGRhdGEsIG5ld2xpbmVcblx0XHRlbHNlICNidXQgaWYgaXQgZG9lc24ndCBleGlzdCB0aGVuIHNwYXduIGEgbmV3IG9uZSAoYW5kIHNob3cgaXQpLCBiZWZvcmUgcHJpbnRpbmcgdGhlIHRleHRcblx0XHRcdEBfY3JlYXRlKCkudGhlbiA9PiBAcGFuZWw/LnByaW50IGRhdGEsIG5ld2xpbmVcblxuXHRjb3B5OiAtPiBAcGFuZWw/LmNvcHkoKVxuXG5cdHBhc3RlOiAtPlxuXHRcdGlmIEBwYW5lbCBhbmQgQHBhbmVsLmlzX2ludGVyYWN0aXZlXG5cdFx0XHRAcHR5Py53cml0ZSBhdG9tLmNsaXBib2FyZC5yZWFkKClcblxuXHRzZWxlY3RBbGw6IC0+IEBwYW5lbD8uc2VsZWN0QWxsKClcblxuXHRfb25JdGVtUmVzaXplOiAoaXRlbSwgY2FsbGJhY2spIC0+XG5cdFx0b2JzZXJ2ZXIgPSBudWxsXG5cblx0XHRpZiB3cmFwcGVyID0gaXRlbS5lbGVtZW50LmNsb3Nlc3QgJy5hdG9tLWRvY2stY29udGVudC13cmFwcGVyJ1xuXHRcdFx0b2JzZXJ2ZXIgPSBuZXcgTXV0YXRpb25PYnNlcnZlciA9PiBjYWxsYmFjaygpXG5cdFx0XHRvYnNlcnZlci5vYnNlcnZlIHdyYXBwZXIsIGF0dHJpYnV0ZXM6IHRydWVcblxuXHRcdHdpbmRvd0NhbGxiYWNrID0gPT4gY2FsbGJhY2soKVxuXHRcdHdpbmRvdy5hZGRFdmVudExpc3RlbmVyICdyZXNpemUnLCB3aW5kb3dDYWxsYmFja1xuXG5cdFx0aWYgcGFuZSA9IGF0b20ud29ya3NwYWNlLnBhbmVGb3JJdGVtIGl0ZW1cblx0XHRcdHBhbmUub2JzZXJ2ZUZsZXhTY2FsZSA9PiBpdGVtLnJlc2l6ZSgpXG5cdFx0XHRwYW5lLm9uRGlkUmVtb3ZlSXRlbSAoZXZlbnQpID0+XG5cdFx0XHRcdGlmIGV2ZW50Lml0ZW0gPT0gaXRlbVxuXHRcdFx0XHRcdG9ic2VydmVyPy5kaXNjb25uZWN0KClcblx0XHRcdFx0XHR3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lciAncmVzaXplJywgd2luZG93Q2FsbGJhY2tcblx0XHRcdFx0XHRpZiAhZXZlbnQucmVtb3ZlZFxuXHRcdFx0XHRcdFx0c2V0VGltZW91dCA9PlxuXHRcdFx0XHRcdFx0XHRAX29uSXRlbVJlc2l6ZSBldmVudC5pdGVtLCBjYWxsYmFja1xuXHRcdFx0XHRcdFx0LDFcblxuXHRydW46IChzaG93LCBwYXRoLCBhcmdzLCBvcHRpb25zKSAtPlxuXHRcdEBpbml0aWFsaXNlKClcblx0XHRAc3RvcCgpXG5cblx0XHR7c3Bhd259ID0gcmVxdWlyZSAnY3Jvc3Mtc3Bhd24nXG5cdFx0QHByb2Nlc3MgPSBzcGF3biBwYXRoLCBhcmdzfHxbXSwgb3B0aW9uc3x8e31cblxuXHRcdEBwcm9jZXNzLnN0ZG91dC5zZXRFbmNvZGluZyAndXRmOCdcblx0XHRAcHJvY2Vzcy5zdGRvdXQucGlwZSBAcGFuZWwudGVybWluYWxcblxuXHRcdEBwcm9jZXNzLnN0ZGVyci5zZXRFbmNvZGluZyAndXRmOCdcblx0XHRAcHJvY2Vzcy5zdGRlcnIucGlwZSBAcGFuZWwudGVybWluYWxcblxuXHRcdCMgQHByb2Nlc3Muc3RkaW4uc2V0RW5jb2RpbmcgJ3V0Zi04J1xuXHRcdCMgQHBhbmVsLnRlcm1pbmFsLm9uICdkYXRhJywgKGRhdGEpID0+XG5cdFx0IyBcdEBwcm9jZXNzLnN0ZGluLndyaXRlIGRhdGFcblxuXHRcdGlmKHNob3c9PXRydWUpXG5cdFx0XHRAc2hvdygpXG5cblx0XHRlbHNlIGlmKHNob3c9PSdhdXRvJylcblx0XHRcdGZpcnN0T3V0cHV0ID0gPT5cblx0XHRcdFx0QHByb2Nlc3Muc3Rkb3V0LnJlbW92ZUxpc3RlbmVyICdkYXRhJywgZmlyc3RPdXRwdXRcblx0XHRcdFx0QHByb2Nlc3Muc3RkZXJyLnJlbW92ZUxpc3RlbmVyICdkYXRhJywgZmlyc3RPdXRwdXRcblx0XHRcdFx0QHNob3coKVxuXG5cdFx0XHRAcHJvY2Vzcy5zdGRvdXQub24gJ2RhdGEnLCBmaXJzdE91dHB1dFxuXHRcdFx0QHByb2Nlc3Muc3RkZXJyLm9uICdkYXRhJywgZmlyc3RPdXRwdXRcblxuXHRcdHJldHVybiBAcHJvY2Vzc1xuXG5cdHN0b3A6IC0+XG5cdFx0aWYgQHByb2Nlc3MhPW51bGxcblx0XHRcdEBwcm9jZXNzLmtpbGwoKVxuXHRcdFx0QHByb2Nlc3MgPSBudWxsXG5cblx0Z2V0SW50ZXJhY3RpdmVTZXNzaW9uOiAtPlxuXHRcdHJldHVybiBuZXcgSW50ZXJhY3RpdmVTZXNzaW9uIHRoaXNcblxuXHRwcm92aWRlT3V0cHV0UGFuZWw6IC0+XG5cdFx0aXNWaXNpYmxlOiA9PiByZXR1cm4gQHBhbmVsIT1udWxsXG5cdFx0cnVuOiBAcnVuLmJpbmQgdGhpc1xuXHRcdHN0b3A6IEBzdG9wLmJpbmQgdGhpc1xuXHRcdHNob3c6IEBzaG93LmJpbmQgdGhpc1xuXHRcdGhpZGU6IEBoaWRlLmJpbmQgdGhpc1xuXHRcdHRvZ2dsZTogQHRvZ2dsZS5iaW5kIHRoaXNcblx0XHRwcmludDogQHByaW50LmJpbmQgdGhpc1xuXHRcdGNsZWFyOiA9PlxuXHRcdFx0QHBhbmVsPy5jbGVhcigpXG5cdFx0Z2V0SW50ZXJhY3RpdmVTZXNzaW9uOiBAZ2V0SW50ZXJhY3RpdmVTZXNzaW9uLmJpbmQgdGhpc1xuIl19
