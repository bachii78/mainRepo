(function() {
  var AtomGdbDebugger, CompositeDisposable, ConfigView, DebugPanelView, EditorIntegration, GDB, GdbCliView, GdbMiView, Resizable, openInPane;

  GdbMiView = require('./gdb-mi-view');

  CompositeDisposable = require('atom').CompositeDisposable;

  GDB = require('node-gdb');

  DebugPanelView = require('./debug-panel-view');

  ConfigView = require('./config-view');

  Resizable = require('./resizable');

  GdbCliView = require('./gdb-cli-view');

  EditorIntegration = require('./editor-integration');

  openInPane = function(view) {
    var pane;
    pane = atom.workspace.getActivePane();
    pane.addItem(view);
    return pane.activateItem(view);
  };

  module.exports = AtomGdbDebugger = {
    subscriptions: null,
    gdb: null,
    activate: function(state) {
      this.gdb = new GDB(state);
      window.gdb = this.gdb;
      this.gdbConfig = state.gdbConfig || {};
      this.gdbConfig.cwd = atom.project.getPaths()[0];
      this.panelVisible = state.panelVisible;
      if (this.panelVisible == null) {
        this.panelVisible = true;
      }
      this.cliVisible = state.cliVisible;
      this.cliPanel = atom.workspace.addBottomPanel({
        item: new Resizable('top', state.cliSize || 150, new GdbCliView(this.gdb)),
        visible: false
      });
      this.panel = atom.workspace.addRightPanel({
        item: new Resizable('left', state.panelSize || 300, new DebugPanelView(this.gdb)),
        visible: false
      });
      this.subscriptions = new CompositeDisposable;
      this.subscriptions.add(atom.commands.add('atom-workspace', {
        'atom-gdb-debugger:configure': (function(_this) {
          return function() {
            return new ConfigView(_this.gdbConfig);
          };
        })(this),
        'atom-gdb-debugger:connect': (function(_this) {
          return function() {
            return _this.connect();
          };
        })(this),
        'atom-gdb-debugger:disconnect': (function(_this) {
          return function() {
            return _this.cmdWrap(function() {
              return _this.gdb.disconnect();
            });
          };
        })(this),
        'atom-gdb-debugger:continue': (function(_this) {
          return function() {
            return _this.cmdWrap(function() {
              return _this.gdb.exec["continue"]();
            });
          };
        })(this),
        'atom-gdb-debugger:step': (function(_this) {
          return function() {
            return _this.cmdWrap(function() {
              return _this.gdb.exec.step();
            });
          };
        })(this),
        'atom-gdb-debugger:next': (function(_this) {
          return function() {
            return _this.cmdWrap(function() {
              return _this.gdb.exec.next();
            });
          };
        })(this),
        'atom-gdb-debugger:finish': (function(_this) {
          return function() {
            return _this.cmdWrap(function() {
              return _this.gdb.exec.finish();
            });
          };
        })(this),
        'atom-gdb-debugger:interrupt': (function(_this) {
          return function() {
            return _this.cmdWrap(function() {
              return _this.gdb.exec.interrupt();
            });
          };
        })(this),
        'atom-gdb-debugger:toggle-panel': (function(_this) {
          return function() {
            return _this.toggle(_this.panel, 'panelVisible');
          };
        })(this),
        'atom-gdb-debugger:toggle-cli': (function(_this) {
          return function() {
            return _this.toggle(_this.cliPanel, 'cliVisible');
          };
        })(this),
        'atom-gdb-debugger:open-mi-log': (function(_this) {
          return function() {
            return openInPane(new GdbMiView(_this.gdb));
          };
        })(this)
      }));
      return this.editorIntegration = new EditorIntegration(this.gdb);
    },
    cmdWrap: function(cmd) {
      return cmd()["catch"](function(err) {
        return atom.notifications.addError(err.toString());
      });
    },
    connect: function() {
      if ((this.gdbConfig.file == null) || this.gdbConfig.file === '') {
        return new ConfigView(this.gdbConfig);
      } else {
        return this.gdb.connect(this.gdbConfig.cmdline).then((function(_this) {
          return function() {
            return _this.gdb.set('confirm', 'off');
          };
        })(this)).then((function(_this) {
          return function() {
            return _this.gdb.setCwd(_this.gdbConfig.cwd);
          };
        })(this)).then((function(_this) {
          return function() {
            return _this.gdb.setFile(_this.gdbConfig.file);
          };
        })(this)).then((function(_this) {
          return function() {
            var cmd;
            return Promise.all((function() {
              var i, len, ref, results;
              ref = this.gdbConfig.init.split('\n');
              results = [];
              for (i = 0, len = ref.length; i < len; i++) {
                cmd = ref[i];
                results.push(this.gdb.send_cli(cmd));
              }
              return results;
            }).call(_this));
          };
        })(this)).then((function(_this) {
          return function() {
            if (_this.panelVisible) {
              _this.panel.show();
            }
            if (_this.cliVisible) {
              return _this.cliPanel.show();
            }
          };
        })(this))["catch"]((function(_this) {
          return function(err) {
            var x;
            return x = atom.notifications.addError('Error launching GDB', {
              description: err.toString(),
              buttons: [
                {
                  text: 'Reconfigure',
                  onDidClick: function() {
                    x.dismiss();
                    return new ConfigView(_this.gdbConfig);
                  }
                }
              ]
            });
          };
        })(this));
      }
    },
    consumeStatusBar: function(statusBar) {
      var StatusView;
      StatusView = require('./status-view');
      return this.statusBarTile = statusBar.addLeftTile({
        item: new StatusView(this.gdb),
        priority: 100
      });
    },
    serialize: function() {
      return {
        gdbConfig: this.gdbConfig,
        panelVisible: this.panelVisible,
        cliVisible: this.cliVisible,
        panelSize: this.panel.getItem().size(),
        cliSize: this.cliPanel.getItem().size()
      };
    },
    deactivate: function() {
      var ref;
      if ((ref = this.statusBarTile) != null) {
        ref.destroy();
      }
      this.statusBarTile = null;
      this.gdb.disconnect();
      this.panel.destroy();
      this.subscriptions.dispose();
      return this.atomGdbDebuggerView.destroy();
    },
    toggle: function(panel, visibleFlag) {
      if (panel.isVisible()) {
        panel.hide();
      } else {
        panel.show();
      }
      return this[visibleFlag] = panel.isVisible();
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbGVhcm4vLmF0b20vcGFja2FnZXMvYXRvbS1nZGItZGVidWdnZXIvbGliL2F0b20tZ2RiLWRlYnVnZ2VyLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUEsU0FBQSxHQUFZLE9BQUEsQ0FBUSxlQUFSOztFQUNYLHNCQUF1QixPQUFBLENBQVEsTUFBUjs7RUFDeEIsR0FBQSxHQUFNLE9BQUEsQ0FBUSxVQUFSOztFQUNOLGNBQUEsR0FBaUIsT0FBQSxDQUFRLG9CQUFSOztFQUNqQixVQUFBLEdBQWEsT0FBQSxDQUFRLGVBQVI7O0VBQ2IsU0FBQSxHQUFZLE9BQUEsQ0FBUSxhQUFSOztFQUNaLFVBQUEsR0FBYSxPQUFBLENBQVEsZ0JBQVI7O0VBQ2IsaUJBQUEsR0FBb0IsT0FBQSxDQUFRLHNCQUFSOztFQUVwQixVQUFBLEdBQWEsU0FBQyxJQUFEO0FBQ1QsUUFBQTtJQUFBLElBQUEsR0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLGFBQWYsQ0FBQTtJQUNQLElBQUksQ0FBQyxPQUFMLENBQWEsSUFBYjtXQUNBLElBQUksQ0FBQyxZQUFMLENBQWtCLElBQWxCO0VBSFM7O0VBS2IsTUFBTSxDQUFDLE9BQVAsR0FBaUIsZUFBQSxHQUNiO0lBQUEsYUFBQSxFQUFlLElBQWY7SUFDQSxHQUFBLEVBQUssSUFETDtJQUdBLFFBQUEsRUFBVSxTQUFDLEtBQUQ7TUFDTixJQUFDLENBQUEsR0FBRCxHQUFPLElBQUksR0FBSixDQUFRLEtBQVI7TUFDUCxNQUFNLENBQUMsR0FBUCxHQUFhLElBQUMsQ0FBQTtNQUNkLElBQUMsQ0FBQSxTQUFELEdBQWEsS0FBSyxDQUFDLFNBQU4sSUFBbUI7TUFDaEMsSUFBQyxDQUFBLFNBQVMsQ0FBQyxHQUFYLEdBQWlCLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBYixDQUFBLENBQXdCLENBQUEsQ0FBQTtNQUN6QyxJQUFDLENBQUEsWUFBRCxH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QixDQUFDLE9BQXJCLENBQUE7SUFOUSxDQWxGWjtJQTBGQSxNQUFBLEVBQVEsU0FBQyxLQUFELEVBQVEsV0FBUjtNQUNKLElBQUcsS0FBSyxDQUFDLFNBQU4sQ0FBQSxDQUFIO1FBQ0ksS0FBSyxDQUFDLElBQU4sQ0FBQSxFQURKO09BQUEsTUFBQTtRQUdJLEtBQUssQ0FBQyxJQUFOLENBQUEsRUFISjs7YUFJQSxJQUFLLENBQUEsV0FBQSxDQUFMLEdBQW9CLEtBQUssQ0FBQyxTQUFOLENBQUE7SUFMaEIsQ0ExRlI7O0FBZkoiLCJzb3VyY2VzQ29udGVudCI6WyJHZGJNaVZpZXcgPSByZXF1aXJlICcuL2dkYi1taS12aWV3J1xue0NvbXBvc2l0ZURpc3Bvc2FibGV9ID0gcmVxdWlyZSAnYXRvbSdcbkdEQiA9IHJlcXVpcmUgJ25vZGUtZ2RiJ1xuRGVidWdQYW5lbFZpZXcgPSByZXF1aXJlICcuL2RlYnVnLXBhbmVsLXZpZXcnXG5Db25maWdWaWV3ID0gcmVxdWlyZSAnLi9jb25maWctdmlldydcblJlc2l6YWJsZSA9IHJlcXVpcmUgJy4vcmVzaXphYmxlJ1xuR2RiQ2xpVmlldyA9IHJlcXVpcmUgJy4vZ2RiLWNsaS12aWV3J1xuRWRpdG9ySW50ZWdyYXRpb24gPSByZXF1aXJlICcuL2VkaXRvci1pbnRlZ3JhdGlvbidcblxub3BlbkluUGFuZSA9ICh2aWV3KSAtPlxuICAgIHBhbmUgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVQYW5lKClcbiAgICBwYW5lLmFkZEl0ZW0gdmlld1xuICAgIHBhbmUuYWN0aXZhdGVJdGVtIHZpZXdcblxubW9kdWxlLmV4cG9ydHMgPSBBdG9tR2RiRGVidWdnZXIgPVxuICAgIHN1YnNjcmlwdGlvbnM6IG51bGxcbiAgICBnZGI6IG51bGxcblxuICAgIGFjdGl2YXRlOiAoc3RhdGUpIC0+XG4gICAgICAgIEBnZGIgPSBuZXcgR0RCKHN0YXRlKVxuICAgICAgICB3aW5kb3cuZ2RiID0gQGdkYlxuICAgICAgICBAZ2RiQ29uZmlnID0gc3RhdGUuZ2RiQ29uZmlnIG9yIHt9XG4gICAgICAgIEBnZGJDb25maWcuY3dkID0gYXRvbS5wcm9qZWN0LmdldFBhdGhzKClbMF1cbiAgICAgICAgQHBhbmVsVmlzaWJsZSA9IHN0YXRlLnBhbmVsVmlzaWJsZVxuICAgICAgICBAcGFuZWxWaXNpYmxlID89IHRydWVcbiAgICAgICAgQGNsaVZpc2libGUgPSBzdGF0ZS5jbGlWaXNpYmxlXG5cbiAgICAgICAgQGNsaVBhbmVsID0gYXRvbS53b3Jrc3BhY2UuYWRkQm90dG9tUGFuZWxcbiAgICAgICAgICAgIGl0ZW06IG5ldyBSZXNpemFibGUgJ3RvcCcsIHN0YXRlLmNsaVNpemUgb3IgMTUwLCBuZXcgR2RiQ2xpVmlldyhAZ2RiKVxuICAgICAgICAgICAgdmlzaWJsZTogZmFsc2VcblxuICAgICAgICBAcGFuZWwgPSBhdG9tLndvcmtzcGFjZS5hZGRSaWdodFBhbmVsXG4gICAgICAgICAgICBpdGVtOiBuZXcgUmVzaXphYmxlICdsZWZ0Jywgc3RhdGUucGFuZWxTaXplIG9yIDMwMCwgbmV3IERlYnVnUGFuZWxWaWV3KEBnZGIpXG4gICAgICAgICAgICB2aXNpYmxlOiBmYWxzZVxuXG4gICAgICAgICMgRXZlbnRzIHN1YnNjcmliZWQgdG8gaW4gYXRvbSdzIHN5c3RlbSBjYW4gYmUgZWFzaWx5IGNsZWFuZWQgdXAgd2l0aCBhIENvbXBvc2l0ZURpc3Bvc2FibGVcbiAgICAgICAgQHN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZVxuXG4gICAgICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLmNvbW1hbmRzLmFkZCAnYXRvbS13b3Jrc3BhY2UnLFxuICAgICAgICAgICAgJ2F0b20tZ2RiLWRlYnVnZ2VyOmNvbmZpZ3VyZSc6ID0+IG5ldyBDb25maWdWaWV3KEBnZGJDb25maWcpXG4gICAgICAgICAgICAnYXRvbS1nZGItZGVidWdnZXI6Y29ubmVjdCc6ID0+IEBjb25uZWN0KClcbiAgICAgICAgICAgICdhdG9tLWdkYi1kZWJ1Z2dlcjpkaXNjb25uZWN0JzogPT4gQGNtZFdyYXAgPT4gQGdkYi5kaXNjb25uZWN0KClcbiAgICAgICAgICAgICdhdG9tLWdkYi1kZWJ1Z2dlcjpjb250aW51ZSc6ID0+IEBjbWRXcmFwID0+IEBnZGIuZXhlYy5jb250aW51ZSgpXG4gICAgICAgICAgICAnYXRvbS1nZGItZGVidWdnZXI6c3RlcCc6ID0+IEBjbWRXcmFwID0+IEBnZGIuZXhlYy5zdGVwKClcbiAgICAgICAgICAgICdhdG9tLWdkYi1kZWJ1Z2dlcjpuZXh0JzogPT4gQGNtZFdyYXAgPT4gQGdkYi5leGVjLm5leHQoKVxuICAgICAgICAgICAgJ2F0b20tZ2RiLWRlYnVnZ2VyOmZpbmlzaCc6ID0+IEBjbWRXcmFwID0+IEBnZGIuZXhlYy5maW5pc2goKVxuICAgICAgICAgICAgJ2F0b20tZ2RiLWRlYnVnZ2VyOmludGVycnVwdCc6ID0+IEBjbWRXcmFwID0+IEBnZGIuZXhlYy5pbnRlcnJ1cHQoKVxuICAgICAgICAgICAgJ2F0b20tZ2RiLWRlYnVnZ2VyOnRvZ2dsZS1wYW5lbCc6ID0+IEB0b2dnbGUoQHBhbmVsLCAncGFuZWxWaXNpYmxlJylcbiAgICAgICAgICAgICdhdG9tLWdkYi1kZWJ1Z2dlcjp0b2dnbGUtY2xpJzogPT4gQHRvZ2dsZShAY2xpUGFuZWwsICdjbGlWaXNpYmxlJylcbiAgICAgICAgICAgICdhdG9tLWdkYi1kZWJ1Z2dlcjpvcGVuLW1pLWxvZyc6ID0+IG9wZW5JblBhbmUgbmV3IEdkYk1pVmlldyhAZ2RiKVxuXG4gICAgICAgIEBlZGl0b3JJbnRlZ3JhdGlvbiA9IG5ldyBFZGl0b3JJbnRlZ3JhdGlvbihAZ2RiKVxuXG4gICAgY21kV3JhcDogKGNtZCkgLT5cbiAgICAgICAgY21kKClcbiAgICAgICAgICAgIC5jYXRjaCAoZXJyKSAtPlxuICAgICAgICAgICAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRFcnJvciBlcnIudG9TdHJpbmcoKVxuXG4gICAgY29ubmVjdDogLT5cbiAgICAgICAgaWYgbm90IEBnZGJDb25maWcuZmlsZT8gb3IgQGdkYkNvbmZpZy5maWxlID09ICcnXG4gICAgICAgICAgICBuZXcgQ29uZmlnVmlldyhAZ2RiQ29uZmlnKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAZ2RiLmNvbm5lY3QoQGdkYkNvbmZpZy5jbWRsaW5lKVxuICAgICAgICAgICAgLnRoZW4gPT5cbiAgICAgICAgICAgICAgICBAZ2RiLnNldCAnY29uZmlybScsICdvZmYnXG4gICAgICAgICAgICAudGhlbiA9PlxuICAgICAgICAgICAgICAgIEBnZGIuc2V0Q3dkIEBnZGJDb25maWcuY3dkXG4gICAgICAgICAgICAudGhlbiA9PlxuICAgICAgICAgICAgICAgIEBnZGIuc2V0RmlsZSBAZ2RiQ29uZmlnLmZpbGVcbiAgICAgICAgICAgIC50aGVuID0+XG4gICAgICAgICAgICAgICAgUHJvbWlzZS5hbGwoQGdkYi5zZW5kX2NsaSBjbWQgZm9yIGNtZCBpbiBAZ2RiQ29uZmlnLmluaXQuc3BsaXQgJ1xcbicpXG4gICAgICAgICAgICAudGhlbiA9PlxuICAgICAgICAgICAgICAgIGlmIEBwYW5lbFZpc2libGUgdGhlbiBAcGFuZWwuc2hvdygpXG4gICAgICAgICAgICAgICAgaWYgQGNsaVZpc2libGUgdGhlbiBAY2xpUGFuZWwuc2hvdygpXG4gICAgICAgICAgICAuY2F0Y2ggKGVycikgPT5cbiAgICAgICAgICAgICAgICB4ID0gYXRvbS5ub3RpZmljYXRpb25zLmFkZEVycm9yICdFcnJvciBsYXVuY2hpbmcgR0RCJyxcbiAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IGVyci50b1N0cmluZygpXG4gICAgICAgICAgICAgICAgICAgIGJ1dHRvbnM6IFtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6ICdSZWNvbmZpZ3VyZSdcbiAgICAgICAgICAgICAgICAgICAgICAgIG9uRGlkQ2xpY2s6ID0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeC5kaXNtaXNzKClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXcgQ29uZmlnVmlldyhAZ2RiQ29uZmlnKVxuICAgICAgICAgICAgICAgICAgICBdXG5cbiAgICBjb25zdW1lU3RhdHVzQmFyOiAoc3RhdHVzQmFyKSAtPlxuICAgICAgICBTdGF0dXNWaWV3ID0gcmVxdWlyZSAnLi9zdGF0dXMtdmlldydcbiAgICAgICAgQHN0YXR1c0JhclRpbGUgPSBzdGF0dXNCYXIuYWRkTGVmdFRpbGVcbiAgICAgICAgICAgIGl0ZW06IG5ldyBTdGF0dXNWaWV3KEBnZGIpXG4gICAgICAgICAgICBwcmlvcml0eTogMTAwXG5cbiAgICBzZXJpYWxpemU6IC0+XG4gICAgICAgIGdkYkNvbmZpZzogQGdkYkNvbmZpZ1xuICAgICAgICBwYW5lbFZpc2libGU6IEBwYW5lbFZpc2libGVcbiAgICAgICAgY2xpVmlzaWJsZTogQGNsaVZpc2libGVcbiAgICAgICAgcGFuZWxTaXplOiBAcGFuZWwuZ2V0SXRlbSgpLnNpemUoKVxuICAgICAgICBjbGlTaXplOiBAY2xpUGFuZWwuZ2V0SXRlbSgpLnNpemUoKVxuXG4gICAgZGVhY3RpdmF0ZTogLT5cbiAgICAgICAgQHN0YXR1c0JhclRpbGU/LmRlc3Ryb3koKVxuICAgICAgICBAc3RhdHVzQmFyVGlsZSA9IG51bGxcbiAgICAgICAgQGdkYi5kaXNjb25uZWN0KClcbiAgICAgICAgQHBhbmVsLmRlc3Ryb3koKVxuICAgICAgICBAc3Vic2NyaXB0aW9ucy5kaXNwb3NlKClcbiAgICAgICAgQGF0b21HZGJEZWJ1Z2dlclZpZXcuZGVzdHJveSgpXG5cbiAgICB0b2dnbGU6IChwYW5lbCwgdmlzaWJsZUZsYWcpIC0+XG4gICAgICAgIGlmIHBhbmVsLmlzVmlzaWJsZSgpXG4gICAgICAgICAgICBwYW5lbC5oaWRlKClcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgcGFuZWwuc2hvdygpXG4gICAgICAgIHRoaXNbdmlzaWJsZUZsYWddID0gcGFuZWwuaXNWaXNpYmxlKClcbiJdfQ==
