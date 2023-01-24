(function() {
  var $$, ConfigView, Directory, File, View, dialog, findGDB, ref, ref1, remote,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  ref = require('atom-space-pen-views'), View = ref.View, $$ = ref.$$;

  ref1 = require('atom'), Directory = ref1.Directory, File = ref1.File;

  remote = require('remote');

  dialog = require('electron').remote.dialog;

  findGDB = function() {
    var dirName, pathsep;
    pathsep = process.platform === 'win32' ? ';' : ':';
    return Promise.all((function() {
      var i, len, ref2, results1;
      ref2 = process.env.PATH.split(pathsep);
      results1 = [];
      for (i = 0, len = ref2.length; i < len; i++) {
        dirName = ref2[i];
        results1.push(new Promise(function(resolve, reject) {
          return new Directory(dirName).getEntries(function(err, entries) {
            var file;
            if (err != null) {
              resolve([]);
              return;
            }
            return resolve((function() {
              var j, len1, results2;
              results2 = [];
              for (j = 0, len1 = entries.length; j < len1; j++) {
                file = entries[j];
                if (file.getBaseName().search(/^(.*-)?gdb(-.*)?(\..*)?$/) >= 0) {
                  results2.push(file.getBaseName());
                } else {
                  results2.push(void 0);
                }
              }
              return results2;
            })());
          });
        }));
      }
      return results1;
    })()).then(function(ll) {
      var f, i, j, l, len, len1, results;
      results = [];
      for (i = 0, len = ll.length; i < len; i++) {
        l = ll[i];
        for (j = 0, len1 = l.length; j < len1; j++) {
          f = l[j];
          if (f != null) {
            results.push(f);
          }
        }
      }
      return results;
    });
  };

  module.exports = ConfigView = (function(superClass) {
    extend(ConfigView, superClass);

    function ConfigView() {
      return ConfigView.__super__.constructor.apply(this, arguments);
    }

    ConfigView.prototype.initialize = function(config) {
      this.config = config;
      this.panel = atom.workspace.addModalPanel({
        item: this
      });
      this.panel.show();
      this._setFile(this.config.file);
      this.init.val(this.config.init);
      this.dummy.text(this.config.cmdline);
      this.cmdline.on('change', (function(_this) {
        return function() {
          return _this._validate();
        };
      })(this));
      return findGDB().then((function(_this) {
        return function(gdbs) {
          var gdb, i, len;
          if (gdbs.length === 0) {
            _this.dummy.text('No GDB found');
            _this.cmdline.addClass('error');
            _this._validate();
            return;
          }
          _this.cmdline.empty();
          for (i = 0, len = gdbs.length; i < len; i++) {
            gdb = gdbs[i];
            _this.cmdline.append($$(function() {
              return this.option(gdb, {
                value: gdb
              });
            }));
          }
          _this.cmdline[0].value = _this.config.cmdline;
          return _this._validate();
        };
      })(this));
    };

    ConfigView.content = function(gdb) {
      return this.div({
        "class": 'gdb-config-view'
      }, (function(_this) {
        return function() {
          _this.div({
            "class": 'block'
          }, function() {
            _this.label("GDB binary:");
            return _this.select({
              "class": 'input-text',
              outlet: 'cmdline'
            }, function() {
              return _this.option('gdb', {
                value: '',
                outlet: 'dummy'
              });
            });
          });
          _this.div({
            "class": 'block'
          }, function() {
            _this.label("Target binary:");
            return _this.div({
              style: 'display: flex',
              click: '_selectBinary'
            }, function() {
              _this.button('Browse', {
                "class": 'btn'
              });
              return _this.input({
                value: 'No file selected',
                style: 'flex: 1',
                "class": 'input-text native-key-bindings error',
                disabled: true,
                outlet: 'fileDisplay'
              });
            });
          });
          _this.div({
            "class": 'block'
          }, function() {
            _this.div("GDB init commands:");
            return _this.textarea({
              "class": 'input-textarea native-key-bindings',
              outlet: 'init'
            });
          });
          return _this.div({
            "class": 'block'
          }, function() {
            _this.button('Cancel', {
              "class": 'btn inline-block',
              click: 'do_close'
            });
            return _this.button('OK', {
              "class": 'btn inline-block',
              disabled: true,
              outlet: 'ok',
              click: 'do_ok'
            });
          });
        };
      })(this));
    };

    ConfigView.prototype.do_close = function() {
      return this.panel.destroy();
    };

    ConfigView.prototype.do_ok = function() {
      this.config.cmdline = this.cmdline.val();
      this.config.file = this.file;
      this.config.init = this.init.val();
      this.panel.destroy();
      return atom.commands.dispatch(atom.views.getView(atom.workspace), 'atom-gdb-debugger:connect');
    };

    ConfigView.prototype._setFile = function(path) {
      var f;
      if ((path == null) || path === '') {
        delete this.file;
        this.fileDisplay.val('No file selected');
        return;
      }
      f = new File(path, false);
      this.fileDisplay.val(f.getBaseName());
      return f.exists().then((function(_this) {
        return function(exists) {
          if (!exists) {
            _this.fileDisplay.addClass('error');
            delete _this.file;
          } else {
            _this.fileDisplay.removeClass('error');
            _this.file = path;
          }
          return _this._validate();
        };
      })(this));
    };

    ConfigView.prototype._selectBinary = function() {
      return dialog.showOpenDialog({
        title: 'Select target binary',
        defaultPath: this.config.cwd,
        properties: ['openFile']
      }, (function(_this) {
        return function(file) {
          if (file == null) {
            return;
          }
          return _this._setFile(file[0]);
        };
      })(this));
    };

    ConfigView.prototype._validate = function() {
      if ((this.file != null) && this.cmdline.val() !== '') {
        this.ok.attr('disabled', false);
        return false;
      } else {
        this.ok.attr('disabled', true);
        return true;
      }
    };

    return ConfigView;

  })(View);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbGVhcm4vLmF0b20vcGFja2FnZXMvYXRvbS1nZGItZGVidWdnZXIvbGliL2NvbmZpZy12aWV3LmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEseUVBQUE7SUFBQTs7O0VBQUEsTUFBYSxPQUFBLENBQVEsc0JBQVIsQ0FBYixFQUFDLGVBQUQsRUFBTzs7RUFDUCxPQUFvQixPQUFBLENBQVEsTUFBUixDQUFwQixFQUFDLDBCQUFELEVBQVk7O0VBQ1osTUFBQSxHQUFTLE9BQUEsQ0FBUSxRQUFSOztFQUNSLFNBQVUsT0FBQSxDQUFRLFVBQVIsQ0FBbUIsQ0FBQzs7RUFFL0IsT0FBQSxHQUFVLFNBQUE7QUFDTixRQUFBO0lBQUEsT0FBQSxHQUFhLE9BQU8sQ0FBQyxRQUFSLEtBQW9CLE9BQXZCLEdBQW9DLEdBQXBDLEdBQTZDO1dBQ3ZELE9BQU8sQ0FBQyxHQUFSOztBQUFhO0FBQUE7V0FBQSxzQ0FBQTs7c0JBQ1QsSUFBSSxPQUFKLENBQVksU0FBQyxPQUFELEVBQVUsTUFBVjtpQkFDUixJQUFJLFNBQUosQ0FBYyxPQUFkLENBQXNCLENBQUMsVUFBdkIsQ0FBa0MsU0FBQyxHQUFELEVBQU0sT0FBTjtBQUM5QixnQkFBQTtZQUFBLElBQUcsV0FBSDtjQUNJLE9BQUEsQ0FBUSxFQUFSO0FBQ0EscUJBRko7O21CQUdBLE9BQUE7O0FBQVE7bUJBQUEsMkNBQUE7O2dCQUNKLElBQUcsSUFBSSxDQUFDLFdBQUwsQ0FBQSxDQUFrQixDQUFDLE1BQW5CLENBQTBCLDBCQUExQixDQUFBLElBQXlELENBQTVEO2dDQUNJLElBQUksQ0FBQyxXQUFMLENBQUEsR0FESjtpQkFBQSxNQUFBO3dDQUFBOztBQURJOztnQkFBUjtVQUo4QixDQUFsQztRQURRLENBQVo7QUFEUzs7UUFBYixDQVdBLENBQUMsSUFYRCxDQVdNLFNBQUMsRUFBRDtBQUNGLFVBQUE7TUFBQSxPQUFBLEdBQVU7QUFD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Y0FBUCxDQUFzQjtRQUNsQixLQUFBLEVBQU8sc0JBRFc7UUFFbEIsV0FBQSxFQUFhLElBQUMsQ0FBQSxNQUFNLENBQUMsR0FGSDtRQUdsQixVQUFBLEVBQVksQ0FBQyxVQUFELENBSE07T0FBdEIsRUFJRyxDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUMsSUFBRDtVQUNDLElBQU8sWUFBUDtBQUFrQixtQkFBbEI7O2lCQUNBLEtBQUMsQ0FBQSxRQUFELENBQVUsSUFBSyxDQUFBLENBQUEsQ0FBZjtRQUZEO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUpIO0lBRFc7O3lCQVNmLFNBQUEsR0FBVyxTQUFBO01BQ1AsSUFBRyxtQkFBQSxJQUFXLElBQUMsQ0FBQSxPQUFPLENBQUMsR0FBVCxDQUFBLENBQUEsS0FBa0IsRUFBaEM7UUFDSSxJQUFDLENBQUEsRUFBRSxDQUFDLElBQUosQ0FBUyxVQUFULEVBQXFCLEtBQXJCO0FBQ0EsZUFBTyxNQUZYO09BQUEsTUFBQTtRQUlJLElBQUMsQ0FBQSxFQUFFLENBQUMsSUFBSixDQUFTLFVBQVQsRUFBcUIsSUFBckI7QUFDQSxlQUFPLEtBTFg7O0lBRE87Ozs7S0F2RlU7QUExQnpCIiwic291cmNlc0NvbnRlbnQiOlsie1ZpZXcsICQkfSA9IHJlcXVpcmUgJ2F0b20tc3BhY2UtcGVuLXZpZXdzJ1xue0RpcmVjdG9yeSwgRmlsZX0gPSByZXF1aXJlICdhdG9tJ1xucmVtb3RlID0gcmVxdWlyZSAncmVtb3RlJ1xue2RpYWxvZ30gPSByZXF1aXJlKCdlbGVjdHJvbicpLnJlbW90ZVxuXG5maW5kR0RCID0gLT5cbiAgICBwYXRoc2VwID0gaWYgcHJvY2Vzcy5wbGF0Zm9ybSA9PSAnd2luMzInIHRoZW4gJzsnIGVsc2UgJzonXG4gICAgUHJvbWlzZS5hbGwgKGZvciBkaXJOYW1lIGluIHByb2Nlc3MuZW52LlBBVEguc3BsaXQocGF0aHNlcClcbiAgICAgICAgbmV3IFByb21pc2UgKHJlc29sdmUsIHJlamVjdCkgLT5cbiAgICAgICAgICAgIG5ldyBEaXJlY3RvcnkoZGlyTmFtZSkuZ2V0RW50cmllcyAoZXJyLCBlbnRyaWVzKSAtPlxuICAgICAgICAgICAgICAgIGlmIGVycj9cbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSBbXVxuICAgICAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgICAgICByZXNvbHZlKGZvciBmaWxlIGluIGVudHJpZXNcbiAgICAgICAgICAgICAgICAgICAgaWYgZmlsZS5nZXRCYXNlTmFtZSgpLnNlYXJjaCgvXiguKi0pP2dkYigtLiopPyhcXC4uKik/JC8pID49IDBcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbGUuZ2V0QmFzZU5hbWUoKVxuICAgICAgICAgICAgICAgIClcbiAgICAgICAgKVxuICAgIC50aGVuIChsbCkgLT5cbiAgICAgICAgcmVzdWx0cyA9IFtdXG4gICAgICAgIGZvciBsIGluIGxsXG4gICAgICAgICAgICBmb3IgZiBpbiBsXG4gICAgICAgICAgICAgICAgaWYgZj8gdGhlbiByZXN1bHRzLnB1c2ggZlxuICAgICAgICByZXN1bHRzXG5cbm1vZHVsZS5leHBvcnRzID1cbmNsYXNzIENvbmZpZ1ZpZXcgZXh0ZW5kcyBWaWV3XG4gICAgaW5pdGlhbGl6ZTogKEBjb25maWcpIC0+XG4gICAgICAgIEBwYW5lbCA9IGF0b20ud29ya3NwYWNlLmFkZE1vZGFsUGFuZWwoaXRlbTogdGhpcylcbiAgICAgICAgQHBhbmVsLnNob3coKVxuXG4gICAgICAgIEBfc2V0RmlsZSBAY29uZmlnLmZpbGVcbiAgICAgICAgQGluaXQudmFsIEBjb25maWcuaW5pdFxuICAgICAgICBAZHVtbXkudGV4dCBAY29uZmlnLmNtZGxpbmVcblxuICAgICAgICBAY21kbGluZS5vbiAnY2hhbmdlJywgPT4gQF92YWxpZGF0ZSgpXG5cbiAgICAgICAgZmluZEdEQigpLnRoZW4gKGdkYnMpID0+XG4gICAgICAgICAgICBpZiBnZGJzLmxlbmd0aCA9PSAwXG4gICAgICAgICAgICAgICAgQGR1bW15LnRleHQgJ05vIEdEQiBmb3VuZCdcbiAgICAgICAgICAgICAgICBAY21kbGluZS5hZGRDbGFzcyAnZXJyb3InXG4gICAgICAgICAgICAgICAgQF92YWxpZGF0ZSgpXG4gICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICBAY21kbGluZS5lbXB0eSgpXG4gICAgICAgICAgICBmb3IgZ2RiIGluIGdkYnNcbiAgICAgICAgICAgICAgICBAY21kbGluZS5hcHBlbmQgJCQgLT4gQG9wdGlvbiBnZGIsIHZhbHVlOiBnZGJcbiAgICAgICAgICAgIEBjbWRsaW5lWzBdLnZhbHVlID0gQGNvbmZpZy5jbWRsaW5lXG4gICAgICAgICAgICBAX3ZhbGlkYXRlKClcblxuICAgIEBjb250ZW50OiAoZ2RiKSAtPlxuICAgICAgICBAZGl2IGNsYXNzOiAnZ2RiLWNvbmZpZy12aWV3JywgPT5cbiAgICAgICAgICAgIEBkaXYgY2xhc3M6ICdibG9jaycsID0+XG4gICAgICAgICAgICAgICAgQGxhYmVsIFwiR0RCIGJpbmFyeTpcIlxuICAgICAgICAgICAgICAgIEBzZWxlY3QgY2xhc3M6ICdpbnB1dC10ZXh0Jywgb3V0bGV0OiAnY21kbGluZScsID0+XG4gICAgICAgICAgICAgICAgICAgICMgSnVzdCBzbyB0aGlzIGRvZXNuJ3Qgc2l0IGVtcHR5IHdoaWxlIHdlIHdhaXQgZm9yIHByb21pc2VzXG4gICAgICAgICAgICAgICAgICAgIEBvcHRpb24gJ2dkYicsIHZhbHVlOiAnJywgb3V0bGV0OiAnZHVtbXknXG4gICAgICAgICAgICBAZGl2IGNsYXNzOiAnYmxvY2snLCA9PlxuICAgICAgICAgICAgICAgIEBsYWJlbCBcIlRhcmdldCBiaW5hcnk6XCJcbiAgICAgICAgICAgICAgICBAZGl2IHN0eWxlOiAnZGlzcGxheTogZmxleCcsIGNsaWNrOiAnX3NlbGVjdEJpbmFyeScsID0+XG4gICAgICAgICAgICAgICAgICAgIEBidXR0b24gJ0Jyb3dzZScsIGNsYXNzOiAnYnRuJ1xuICAgICAgICAgICAgICAgICAgICBAaW5wdXRcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiAnTm8gZmlsZSBzZWxlY3RlZCdcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlOiAnZmxleDogMSdcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzOiAnaW5wdXQtdGV4dCBuYXRpdmUta2V5LWJpbmRpbmdzIGVycm9yJ1xuICAgICAgICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ6IHRydWVcbiAgICAgICAgICAgICAgICAgICAgICAgIG91dGxldDogJ2ZpbGVEaXNwbGF5J1xuICAgICAgICAgICAgQGRpdiBjbGFzczogJ2Jsb2NrJywgPT5cbiAgICAgICAgICAgICAgICBAZGl2IFwiR0RCIGluaXQgY29tbWFuZHM6XCJcbiAgICAgICAgICAgICAgICBAdGV4dGFyZWEgY2xhc3M6ICdpbnB1dC10ZXh0YXJlYSBuYXRpdmUta2V5LWJpbmRpbmdzJywgb3V0bGV0OiAnaW5pdCdcblxuICAgICAgICAgICAgQGRpdiBjbGFzczogJ2Jsb2NrJywgPT5cbiAgICAgICAgICAgICAgICBAYnV0dG9uICdDYW5jZWwnLCBjbGFzczogJ2J0biBpbmxpbmUtYmxvY2snLCBjbGljazogJ2RvX2Nsb3NlJ1xuICAgICAgICAgICAgICAgIEBidXR0b24gJ09LJyxcbiAgICAgICAgICAgICAgICAgICAgY2xhc3M6ICdidG4gaW5saW5lLWJsb2NrJ1xuICAgICAgICAgICAgICAgICAgICBkaXNhYmxlZDogdHJ1ZVxuICAgICAgICAgICAgICAgICAgICBvdXRsZXQ6ICdvaydcbiAgICAgICAgICAgICAgICAgICAgY2xpY2s6ICdkb19vaydcblxuICAgIGRvX2Nsb3NlOiAtPlxuICAgICAgICBAcGFuZWwuZGVzdHJveSgpXG5cbiAgICBkb19vazogLT5cbiAgICAgICAgQGNvbmZpZy5jbWRsaW5lID0gQGNtZGxpbmUudmFsKClcbiAgICAgICAgQGNvbmZpZy5maWxlID0gQGZpbGVcbiAgICAgICAgQGNvbmZpZy5pbml0ID0gQGluaXQudmFsKClcbiAgICAgICAgQHBhbmVsLmRlc3Ryb3koKVxuICAgICAgICBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoIGF0b20udmlld3MuZ2V0VmlldyhhdG9tLndvcmtzcGFjZSksICdhdG9tLWdkYi1kZWJ1Z2dlcjpjb25uZWN0J1xuXG4gICAgX3NldEZpbGU6IChwYXRoKSAtPlxuICAgICAgICBpZiBub3QgcGF0aD8gb3IgcGF0aCA9PSAnJ1xuICAgICAgICAgICAgZGVsZXRlIEBmaWxlXG4gICAgICAgICAgICBAZmlsZURpc3BsYXkudmFsICdObyBmaWxlIHNlbGVjdGVkJ1xuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIGYgPSBuZXcgRmlsZSBwYXRoLCBmYWxzZVxuICAgICAgICBAZmlsZURpc3BsYXkudmFsIGYuZ2V0QmFzZU5hbWUoKVxuICAgICAgICBmLmV4aXN0cygpLnRoZW4gKGV4aXN0cykgPT5cbiAgICAgICAgICAgIGlmIG5vdCBleGlzdHNcbiAgICAgICAgICAgICAgICBAZmlsZURpc3BsYXkuYWRkQ2xhc3MgJ2Vycm9yJ1xuICAgICAgICAgICAgICAgIGRlbGV0ZSBAZmlsZVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEBmaWxlRGlzcGxheS5yZW1vdmVDbGFzcyAnZXJyb3InXG4gICAgICAgICAgICAgICAgQGZpbGUgPSBwYXRoXG4gICAgICAgICAgICBAX3ZhbGlkYXRlKClcblxuICAgIF9zZWxlY3RCaW5hcnk6IC0+XG4gICAgICAgIGRpYWxvZy5zaG93T3BlbkRpYWxvZyB7XG4gICAgICAgICAgICB0aXRsZTogJ1NlbGVjdCB0YXJnZXQgYmluYXJ5J1xuICAgICAgICAgICAgZGVmYXVsdFBhdGg6IEBjb25maWcuY3dkXG4gICAgICAgICAgICBwcm9wZXJ0aWVzIDpbJ29wZW5GaWxlJ11cbiAgICAgICAgfSwgKGZpbGUpID0+XG4gICAgICAgICAgICBpZiBub3QgZmlsZT8gdGhlbiByZXR1cm5cbiAgICAgICAgICAgIEBfc2V0RmlsZSBmaWxlWzBdXG5cbiAgICBfdmFsaWRhdGU6IC0+XG4gICAgICAgIGlmIEBmaWxlPyBhbmQgQGNtZGxpbmUudmFsKCkgIT0gJydcbiAgICAgICAgICAgIEBvay5hdHRyICdkaXNhYmxlZCcsIGZhbHNlXG4gICAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQG9rLmF0dHIgJ2Rpc2FibGVkJywgdHJ1ZVxuICAgICAgICAgICAgcmV0dXJuIHRydWVcbiJdfQ==
