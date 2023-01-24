(function() {
  var $, GdbCliView, View, escapeHTML, ref,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  ref = require('atom-space-pen-views'), View = ref.View, $ = ref.$;

  escapeHTML = require('./utils').escapeHTML;

  module.exports = GdbCliView = (function(superClass) {
    extend(GdbCliView, superClass);

    function GdbCliView() {
      return GdbCliView.__super__.constructor.apply(this, arguments);
    }

    GdbCliView.prototype.history = [];

    GdbCliView.prototype.initialize = function(gdb) {
      this.gdb = gdb;
      this.gdb.onConsoleOutput((function(_this) {
        return function(arg) {
          var cls, stream, text;
          stream = arg[0], text = arg[1];
          switch (stream) {
            case 'LOG':
              cls = 'text-error';
              break;
            case 'TARGET':
              cls = 'text-info';
          }
          return _this._text_output(text, cls);
        };
      })(this));
      return this.gdb.exec.onStateChanged((function(_this) {
        return function(arg) {
          var state;
          state = arg[0];
          if (state === 'DISCONNECTED' || state === 'RUNNING') {
            return _this.cliDiv.css('visibility', 'hidden');
          } else {
            return _this.cliDiv.css('visibility', 'visible');
          }
        };
      })(this));
    };

    GdbCliView.content = function(gdb) {
      return this.div({
        "class": 'gdb-cli',
        click: '_focusInput'
      }, (function(_this) {
        return function() {
          return _this.div({
            outlet: 'scrolledContainer'
          }, function() {
            _this.pre({
              outlet: 'console'
            });
            return _this.div({
              "class": 'gdb-cli-input',
              outlet: 'cliDiv'
            }, function() {
              _this.pre('(gdb)');
              return _this.input({
                "class": 'native-key-bindings',
                keydown: '_keyDown',
                keypress: '_doCli',
                outlet: 'cmd'
              });
            });
          });
        };
      })(this));
    };

    GdbCliView.prototype._focusInput = function() {
      return this.cmd.focus();
    };

    GdbCliView.prototype._doCli = function(event) {
      var cmd;
      if (event.charCode === 13) {
        delete this.histPos;
        delete this.editHistory;
        cmd = this.cmd.val();
        this.cmd.val('');
        if (cmd === '') {
          cmd = this.history.slice(-1)[0];
        } else {
          this.history.push(cmd);
        }
        this._text_output("(gdb) ");
        this._text_output(cmd + '\n', 'text-highlight');
        return this.gdb.send_cli(cmd).then((function(_this) {
          return function() {
            if (_this.gdb.exec.state !== 'RUNNING') {
              return;
            }
            return new Promise(function(resolve, reject) {
              var x;
              return x = _this.gdb.exec.onStateChanged(function(arg) {
                var state;
                state = arg[0];
                if (state === 'RUNNING') {
                  return;
                }
                x.dispose();
                return resolve();
              });
            });
          };
        })(this)).then((function(_this) {
          return function() {
            return _this._focusInput();
          };
        })(this))["catch"](function() {});
      }
    };

    GdbCliView.prototype._text_output = function(text, cls) {
      text = escapeHTML(text);
      if (cls != null) {
        text = "<span class='" + cls + "'>" + text + "</span>";
      }
      this.console.append(text);
      return this.prop('scrollTop', this.scrolledContainer.height() - this.height());
    };

    GdbCliView.prototype._keyDown = function(ev) {
      switch (ev.keyCode) {
        case 38:
          return this._histUp(ev);
        case 40:
          return this._histDown(ev);
      }
    };

    GdbCliView.prototype._histUpDown = function(ev, f) {
      var v;
      if (this.histPos != null) {
        this.editHistory[this.histPos] = this.cmd.val();
      } else {
        this.editHistory = this.history.slice();
        this.editHistory.push(this.cmd.val());
        this.histPos = this.editHistory.length - 1;
      }
      f();
      v = this.editHistory[this.histPos];
      this.cmd.val(v);
      this.cmd[0].setSelectionRange(v.length, v.length);
      return ev.preventDefault();
    };

    GdbCliView.prototype._histUp = function(ev) {
      return this._histUpDown(ev, (function(_this) {
        return function() {
          if (_this.histPos > 0) {
            return _this.histPos--;
          }
        };
      })(this));
    };

    GdbCliView.prototype._histDown = function(ev) {
      return this._histUpDown(ev, (function(_this) {
        return function() {
          if (_this.histPos < _this.history.length) {
            return _this.histPos++;
          }
        };
      })(this));
    };

    return GdbCliView;

  })(View);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbGVhcm4vLmF0b20vcGFja2FnZXMvYXRvbS1nZGItZGVidWdnZXIvbGliL2dkYi1jbGktdmlldy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLG9DQUFBO0lBQUE7OztFQUFBLE1BQVksT0FBQSxDQUFRLHNCQUFSLENBQVosRUFBQyxlQUFELEVBQU87O0VBQ04sYUFBYyxPQUFBLENBQVEsU0FBUjs7RUFFZixNQUFNLENBQUMsT0FBUCxHQUNNOzs7Ozs7O3lCQUNGLE9BQUEsR0FBUzs7eUJBRVQsVUFBQSxHQUFZLFNBQUMsR0FBRDtNQUNSLElBQUMsQ0FBQSxHQUFELEdBQU87TUFDUCxJQUFDLENBQUEsR0FBRyxDQUFDLGVBQUwsQ0FBcUIsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFDLEdBQUQ7QUFDakIsY0FBQTtVQURtQixpQkFBUTtBQUMzQixrQkFBTyxNQUFQO0FBQUEsaUJBQ1MsS0FEVDtjQUNvQixHQUFBLEdBQU07QUFBakI7QUFEVCxpQkFFUyxRQUZUO2NBRXVCLEdBQUEsR0FBTTtBQUY3QjtpQkFHQSxLQUFDLENBQUEsWUFBRCxDQUFjLElBQWQsRUFBb0IsR0FBcEI7UUFKaUI7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQXJCO2FBS0EsSUFBQyxDQUFBLEdBQUcsQ0FBQyxJQUFJLENBQUMsY0FBVixDQUF5QixDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUMsR0FBRDtBQUNyQixjQUFBO1VBRHVCLFFBQUQ7VUFDdEIsSUFBRyxLQUFBLEtBQVMsY0FBVCxJQUEyQixLQUFBLEtBQVMsU0FBdkM7bUJBQ0ksS0FBQyxDQUFBLE1BQU0sQ0FBQyxHQUFSLENBQVksWUFBWixFQUEwQixRQUExQixFQURKO1dBQUEsTUFBQTttQkFHSSxLQUFDLENBQUEsTUFBTSxDQUFDLEdBQVIsQ0FBWSxZQUFaLEVBQTBCLFNBQTFCLEVBSEo7O1FBRHFCO01BQUEsQ0FBQSxDQUFB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QUFDLE1BQXRDO2FBQ0EsRUFBRSxDQUFDLGNBQUgsQ0FBQTtJQVhTOzt5QkFhYixPQUFBLEdBQVMsU0FBQyxFQUFEO2FBQ0wsSUFBQyxDQUFBLFdBQUQsQ0FBYSxFQUFiLEVBQWlCLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtVQUFJLElBQWMsS0FBQyxDQUFBLE9BQUQsR0FBVyxDQUF6QjttQkFBQSxLQUFDLENBQUEsT0FBRCxHQUFBOztRQUFKO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFqQjtJQURLOzt5QkFFVCxTQUFBLEdBQVcsU0FBQyxFQUFEO2FBQ1AsSUFBQyxDQUFBLFdBQUQsQ0FBYSxFQUFiLEVBQWlCLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtVQUFJLElBQWMsS0FBQyxDQUFBLE9BQUQsR0FBVyxLQUFDLENBQUEsT0FBTyxDQUFDLE1BQWxDO21CQUFBLEtBQUMsQ0FBQSxPQUFELEdBQUE7O1FBQUo7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQWpCO0lBRE87Ozs7S0FwRlU7QUFKekIiLCJzb3VyY2VzQ29udGVudCI6WyJ7VmlldywgJH0gPSByZXF1aXJlICdhdG9tLXNwYWNlLXBlbi12aWV3cydcbntlc2NhcGVIVE1MfSA9IHJlcXVpcmUgJy4vdXRpbHMnXG5cbm1vZHVsZS5leHBvcnRzID1cbmNsYXNzIEdkYkNsaVZpZXcgZXh0ZW5kcyBWaWV3XG4gICAgaGlzdG9yeTogW11cblxuICAgIGluaXRpYWxpemU6IChnZGIpIC0+XG4gICAgICAgIEBnZGIgPSBnZGJcbiAgICAgICAgQGdkYi5vbkNvbnNvbGVPdXRwdXQgKFtzdHJlYW0sIHRleHRdKSA9PlxuICAgICAgICAgICAgc3dpdGNoIHN0cmVhbVxuICAgICAgICAgICAgICAgIHdoZW4gJ0xPRycgdGhlbiBjbHMgPSAndGV4dC1lcnJvcidcbiAgICAgICAgICAgICAgICB3aGVuICdUQVJHRVQnIHRoZW4gY2xzID0gJ3RleHQtaW5mbydcbiAgICAgICAgICAgIEBfdGV4dF9vdXRwdXQodGV4dCwgY2xzKVxuICAgICAgICBAZ2RiLmV4ZWMub25TdGF0ZUNoYW5nZWQgKFtzdGF0ZV0pID0+XG4gICAgICAgICAgICBpZiBzdGF0ZSA9PSAnRElTQ09OTkVDVEVEJyBvciBzdGF0ZSA9PSAnUlVOTklORydcbiAgICAgICAgICAgICAgICBAY2xpRGl2LmNzcyAndmlzaWJpbGl0eScsICdoaWRkZW4nXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgQGNsaURpdi5jc3MgJ3Zpc2liaWxpdHknLCAndmlzaWJsZSdcblxuICAgIEBjb250ZW50OiAoZ2RiKSAtPlxuICAgICAgICBAZGl2IGNsYXNzOiAnZ2RiLWNsaScsIGNsaWNrOiAnX2ZvY3VzSW5wdXQnLCA9PlxuICAgICAgICAgICAgQGRpdiBvdXRsZXQ6ICdzY3JvbGxlZENvbnRhaW5lcicsID0+XG4gICAgICAgICAgICAgICAgQHByZSBvdXRsZXQ6ICdjb25zb2xlJ1xuICAgICAgICAgICAgICAgIEBkaXYgY2xhc3M6ICdnZGItY2xpLWlucHV0Jywgb3V0bGV0OiAnY2xpRGl2JywgPT5cbiAgICAgICAgICAgICAgICAgICAgQHByZSAnKGdkYiknXG4gICAgICAgICAgICAgICAgICAgIEBpbnB1dFxuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3M6ICduYXRpdmUta2V5LWJpbmRpbmdzJ1xuICAgICAgICAgICAgICAgICAgICAgICAga2V5ZG93bjogJ19rZXlEb3duJ1xuICAgICAgICAgICAgICAgICAgICAgICAga2V5cHJlc3M6ICdfZG9DbGknXG4gICAgICAgICAgICAgICAgICAgICAgICBvdXRsZXQ6ICdjbWQnXG5cbiAgICBfZm9jdXNJbnB1dDogLT5cbiAgICAgICAgQGNtZC5mb2N1cygpXG5cbiAgICBfZG9DbGk6IChldmVudCkgLT5cbiAgICAgICAgaWYgZXZlbnQuY2hhckNvZGUgPT0gMTNcbiAgICAgICAgICAgIGRlbGV0ZSBAaGlzdFBvc1xuICAgICAgICAgICAgZGVsZXRlIEBlZGl0SGlzdG9yeVxuICAgICAgICAgICAgY21kID0gQGNtZC52YWwoKVxuICAgICAgICAgICAgQGNtZC52YWwgJydcbiAgICAgICAgICAgIGlmIGNtZCA9PSAnJ1xuICAgICAgICAgICAgICAgIGNtZCA9IEBoaXN0b3J5LnNsaWNlKC0xKVswXVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEBoaXN0b3J5LnB1c2ggY21kXG4gICAgICAgICAgICBAX3RleHRfb3V0cHV0IFwiKGdkYikgXCJcbiAgICAgICAgICAgIEBfdGV4dF9vdXRwdXQgY21kICsgJ1xcbicsICd0ZXh0LWhpZ2hsaWdodCdcbiAgICAgICAgICAgIEBnZGIuc2VuZF9jbGkgY21kXG4gICAgICAgICAgICAudGhlbiA9PlxuICAgICAgICAgICAgICAgIGlmIEBnZGIuZXhlYy5zdGF0ZSAhPSAnUlVOTklORycgdGhlbiByZXR1cm5cbiAgICAgICAgICAgICAgICBuZXcgUHJvbWlzZSAocmVzb2x2ZSwgcmVqZWN0KSA9PlxuICAgICAgICAgICAgICAgICAgICB4ID0gQGdkYi5leGVjLm9uU3RhdGVDaGFuZ2VkIChbc3RhdGVdKSAtPlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgc3RhdGUgPT0gJ1JVTk5JTkcnIHRoZW4gcmV0dXJuXG4gICAgICAgICAgICAgICAgICAgICAgICB4LmRpc3Bvc2UoKVxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgpXG4gICAgICAgICAgICAudGhlbiA9PlxuICAgICAgICAgICAgICAgIEBfZm9jdXNJbnB1dCgpXG4gICAgICAgICAgICAuY2F0Y2ggLT5cblxuICAgIF90ZXh0X291dHB1dDogKHRleHQsIGNscykgLT5cbiAgICAgICAgdGV4dCA9IGVzY2FwZUhUTUwodGV4dClcbiAgICAgICAgaWYgY2xzP1xuICAgICAgICAgICAgdGV4dCA9IFwiPHNwYW4gY2xhc3M9JyN7Y2xzfSc+I3t0ZXh0fTwvc3Bhbj5cIlxuICAgICAgICBAY29uc29sZS5hcHBlbmQgdGV4dFxuICAgICAgICBAcHJvcCAnc2Nyb2xsVG9wJywgQHNjcm9sbGVkQ29udGFpbmVyLmhlaWdodCgpIC0gQGhlaWdodCgpXG5cbiAgICBfa2V5RG93bjogKGV2KSAtPlxuICAgICAgICBzd2l0Y2ggZXYua2V5Q29kZVxuICAgICAgICAgICAgd2hlbiAzOCAjdXBcbiAgICAgICAgICAgICAgICBAX2hpc3RVcCBldlxuICAgICAgICAgICAgd2hlbiA0MCAjZG93blxuICAgICAgICAgICAgICAgIEBfaGlzdERvd24gZXZcblxuICAgIF9oaXN0VXBEb3duOiAoZXYsIGYpLT5cbiAgICAgICAgaWYgQGhpc3RQb3M/XG4gICAgICAgICAgICBAZWRpdEhpc3RvcnlbQGhpc3RQb3NdID0gQGNtZC52YWwoKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAZWRpdEhpc3RvcnkgPSBAaGlzdG9yeS5zbGljZSgpXG4gICAgICAgICAgICBAZWRpdEhpc3RvcnkucHVzaCBAY21kLnZhbCgpXG4gICAgICAgICAgICBAaGlzdFBvcyA9IEBlZGl0SGlzdG9yeS5sZW5ndGggLSAxXG4gICAgICAgIGYoKVxuICAgICAgICB2ID0gQGVkaXRIaXN0b3J5W0BoaXN0UG9zXVxuICAgICAgICBAY21kLnZhbCB2XG4gICAgICAgIEBjbWRbMF0uc2V0U2VsZWN0aW9uUmFuZ2Uodi5sZW5ndGgsIHYubGVuZ3RoKVxuICAgICAgICBldi5wcmV2ZW50RGVmYXVsdCgpXG5cbiAgICBfaGlzdFVwOiAoZXYpIC0+XG4gICAgICAgIEBfaGlzdFVwRG93biBldiwgPT4gKEBoaXN0UG9zLS0gaWYgQGhpc3RQb3MgPiAwKVxuICAgIF9oaXN0RG93bjogKGV2KSAtPlxuICAgICAgICBAX2hpc3RVcERvd24gZXYsID0+IChAaGlzdFBvcysrIGlmIEBoaXN0UG9zIDwgQGhpc3RvcnkubGVuZ3RoKVxuIl19
