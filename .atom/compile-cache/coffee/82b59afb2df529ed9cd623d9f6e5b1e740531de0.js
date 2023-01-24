(function() {
  var $, ConfigView, GdbToolbarView, View, ref,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  ref = require('atom-space-pen-views'), View = ref.View, $ = ref.$;

  ConfigView = require('./config-view');

  module.exports = GdbToolbarView = (function(superClass) {
    extend(GdbToolbarView, superClass);

    function GdbToolbarView() {
      return GdbToolbarView.__super__.constructor.apply(this, arguments);
    }

    GdbToolbarView.cmdMask = {
      'DISCONNECTED': ['connect', 'configure'],
      'EXITED': ['connect', 'configure', 'continue'],
      'STOPPED': ['connect', 'configure', 'continue', 'next', 'step', 'finish'],
      'RUNNING': ['connect', 'configure', 'interrupt']
    };

    GdbToolbarView.prototype.initialize = function(gdb) {
      var button, cmd, i, len, ref1, results;
      this.gdb = gdb;
      this.gdb.exec.onStateChanged(this._onStateChanged.bind(this));
      ref1 = this.find('button');
      results = [];
      for (i = 0, len = ref1.length; i < len; i++) {
        button = ref1[i];
        cmd = button.getAttribute('command');
        this[cmd] = $(button);
        if (cmd === 'connect') {
          continue;
        }
        results.push(button.addEventListener('click', this["do"]));
      }
      return results;
    };

    GdbToolbarView.content = function() {
      return this.div({
        "class": 'btn-toolbar'
      }, (function(_this) {
        return function() {
          _this.div({
            "class": 'btn-group'
          }, function() {
            _this.button({
              "class": 'btn icon icon-plug',
              command: 'connect',
              click: 'toggleConnect'
            });
            return _this.button({
              "class": 'btn icon icon-tools',
              command: 'configure'
            });
          });
          _this.div({
            "class": 'btn-group'
          }, function() {
            _this.button({
              "class": 'btn icon icon-playback-play',
              command: 'continue'
            });
            return _this.button({
              "class": 'btn icon icon-playback-pause',
              command: 'interrupt'
            });
          });
          return _this.div({
            "class": 'btn-group'
          }, function() {
            _this.button('Next', {
              "class": 'btn',
              command: 'next'
            });
            _this.button('Step', {
              "class": 'btn',
              command: 'step'
            });
            return _this.button('Finish', {
              "class": 'btn',
              command: 'finish'
            });
          });
        };
      })(this));
    };

    GdbToolbarView.prototype["do"] = function(ev) {
      var command;
      command = ev.target.getAttribute('command');
      return atom.commands.dispatch(atom.views.getView(atom.workspace), "atom-gdb-debugger:" + command);
    };

    GdbToolbarView.prototype.toggleConnect = function() {
      if (this.connect.hasClass('selected')) {
        return atom.commands.dispatch(atom.views.getView(atom.workspace), "atom-gdb-debugger:disconnect");
      } else {
        return atom.commands.dispatch(atom.views.getView(atom.workspace), "atom-gdb-debugger:connect");
      }
    };

    GdbToolbarView.prototype._onStateChanged = function(arg) {
      var button, enabledCmds, frame, i, len, ref1, ref2, results, state;
      state = arg[0], frame = arg[1];
      if (state === 'DISCONNECTED') {
        this.connect.removeClass('selected');
      } else {
        this.connect.addClass('selected');
      }
      enabledCmds = GdbToolbarView.cmdMask[state];
      ref1 = this.find('button');
      results = [];
      for (i = 0, len = ref1.length; i < len; i++) {
        button = ref1[i];
        if (ref2 = button.getAttribute('command'), indexOf.call(enabledCmds, ref2) >= 0) {
          results.push(button.removeAttribute('disabled'));
        } else {
          results.push(button.setAttribute('disabled', true));
        }
      }
      return results;
    };

    return GdbToolbarView;

  })(View);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbGVhcm4vLmF0b20vcGFja2FnZXMvYXRvbS1nZGItZGVidWdnZXIvbGliL2dkYi10b29sYmFyLXZpZXcuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSx3Q0FBQTtJQUFBOzs7O0VBQUEsTUFBWSxPQUFBLENBQVEsc0JBQVIsQ0FBWixFQUFDLGVBQUQsRUFBTzs7RUFDUCxVQUFBLEdBQWEsT0FBQSxDQUFRLGVBQVI7O0VBRWIsTUFBTSxDQUFDLE9BQVAsR0FDTTs7Ozs7OztJQUNGLGNBQUMsQ0FBQSxPQUFELEdBQ0k7TUFBQSxjQUFBLEVBQWdCLENBQUMsU0FBRCxFQUFZLFdBQVosQ0FBaEI7TUFDQSxRQUFBLEVBQVUsQ0FBQyxTQUFELEVBQVksV0FBWixFQUF5QixVQUF6QixDQURWO01BRUEsU0FBQSxFQUFXLENBQUMsU0FBRCxFQUFZLFdBQVosRUFBeUIsVUFBekIsRUFBcUMsTUFBckMsRUFBNkMsTUFBN0MsRUFBcUQsUUFBckQsQ0FGWDtNQUdBLFNBQUEsRUFBVyxDQUFDLFNBQUQsRUFBWSxXQUFaLEVBQXlCLFdBQXpCLENBSFg7Ozs2QkFLSixVQUFBLEdBQVksU0FBQyxHQUFEO0FBQ1IsVUFBQTtNQUFBLElBQUMsQ0FBQSxHQUFELEdBQU87TUFDUCxJQUFDLENBQUEsR0FBRyxDQUFDLElBQUksQ0FBQyxjQUFWLENBQXlCLElBQUMsQ0FBQSxlQUFlLENBQUMsSUFBakIsQ0FBc0IsSUFBdEIsQ0FBekI7QUFDQTtBQUFBO1dBQUEsc0NBQUE7O1FBQ0ksR0FBQSxHQUFNLE1BQU0sQ0FBQyxZQUFQLENBQW9CLFNBQXBCO1FBQ04sSUFBSyxDQUFBLEdBQUEsQ0FBTCxHQUFZLENBQUEsQ0FBRSxNQUFGO1FBQ1osSUFBRyxHQUFBLEtBQU8sU0FBVjtBQUF5QixtQkFBekI7O3FCQUNBLE1BQU0sQ0FBQyxnQkFBUCxDQUF3QixPQUF4QixFQUFpQyxJQUFDLEVBQUEsRUFBQSxFQUFsQztBQUpKOztJQUhROztJQVNaLGNBQUMsQ0FBQSxPQUFELEdBQVUsU0FBQTthQUNOLElBQUMsQ0FBQSxHQUFELENBQUs7UUFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLGFBQVA7T0FBTCxFQUEyQixDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUE7VUFDdkIsS0FBQyxDQUFBLEdBQUQsQ0FBSztZQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sV0FBUDtXQUFMLEVBQXlCLFNBQUE7WUFDckIsS0FBQyxDQUFBLE1BQUQsQ0FBUTtjQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sb0JBQVA7Y0FBNkIsT0FBQSxFQUFTLFNBQXRDO2NBQWlELEtBQUEsRUFBTyxlQUF4RDthQUFSO21CQUNBLEtBQUMsQ0FBQSxNQUFELENBQVE7Y0FBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLHFCQUFQO2NBQThCLE9BQUEsRUFBUyxXQUF2QzthQUFSO1VBRnFCLENBQXpCO1VBR0EsS0FBQyxDQUFBLEdBQUQsQ0FBSztZQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sV0FBUDtXQUFMLEVBQXlCLFNBQUE7WUFDckIsS0FBQyxDQUFBLE1BQUQsQ0FBUTtjQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sNkJBQVA7Y0FBc0MsT0FBQSxFQUFTLFVBQS9DO2FBQVI7bUJBQ0EsS0FBQyxDQUFBLE1BQUQsQ0FBUTtjQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sOEJBQVA7Y0FBdUMsT0FBQSxFQUFTLFdBQWhEO2FBQVI7VUFGcUIsQ0FBekI7aUJBR0EsS0FBQyxDQUFBLEdBQUQsQ0FBSztZQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sV0FBUDtXQUFMLEVBQXlCLFNBQUE7WUFDckIsS0FBQyxDQUFBLE1BQUQsQ0FBUSxNQUFSLEVBQWdCO2NBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxLQUFQO2NBQWMsT0FBQSxFQUFTLE1BQXZCO2FBQWhCO1lBQ0EsS0FBQyxDQUFBLE1BQUQsQ0FBUSxNQUFSLEVBQWdCO2NBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxLQUFQO2NBQWMsT0FBQSxFQUFTLE1BQXZCO2FBQWhCO21CQUNBLEtBQUMsQ0FBQSxNQUFELENBQVEsUUFBUixFQUFrQjtjQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sS0FBUDtjQUFjLE9BQUEsRUFBUyxRQUF2QjthQUFsQjtVQUhxQixDQUF6QjtRQVB1QjtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBM0I7SUFETTs7OEJBYVYsSUFBQSxHQUFJLFNBQUMsRUFBRDtBQUNBLFVBQUE7TUFBQSxPQUFBLEdBQVUsRUFBRSxDQUFDLE1BQU0sQ0FBQyxZQUFWLENBQXVCLFNBQXZCO2FBQ1YsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFkLENBQXVCLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBWCxDQUFtQixJQUFJLENBQUMsU0FBeEIsQ0FBdkIsRUFBMkQsb0JBQUEsR0FBcUIsT0FBaEY7SUFGQTs7NkJBSUosYUFBQSxHQUFlLFNBQUE7TUFDWCxJQUFHLElBQUMsQ0FBQSxPQUFPLENBQUMsUUFBVCxDQUFrQixVQUFsQixDQUFIO2VBQ0ksSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFkLENBQXVCLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBWCxDQUFtQixJQUFJLENBQUMsU0FBeEIsQ0FBdkIsRUFBMkQsOEJBQTNELEVBREo7T0FBQSxNQUFBO2VBR0ksSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFkLENBQXVCLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBWCxDQUFtQixJQUFJLENBQUMsU0FBeEIsQ0FBdkIsRUFBMkQsMkJBQTNELEVBSEo7O0lBRFc7OzZCQU1mLGVBQUEsR0FBaUIsU0FBQyxHQUFEO0FBQ2IsVUFBQTtNQURlLGdCQUFPO01BQ3RCLElBQUcsS0FBQSxLQUFTLGNBQVo7UUFDSSxJQUFDLENBQUEsT0FBTyxDQUFDLFdBQVQsQ0FBcUIsVUFBckIsRUFESjtPQUFBLE1BQUE7UUFHSSxJQUFDLENBQUEsT0FBTyxDQUFDLFFBQVQsQ0FBa0IsVUFBbEIsRUFISjs7TUFLQSxXQUFBLEdBQWMsY0FBYyxDQUFDLE9BQVEsQ0FBQSxLQUFBO0FBQ3JDO0FBQUE7V0FBQSxzQ0FBQTs7UUFDSSxXQUFHLE1BQU0sQ0FBQyxZQUFQLENBQW9CLFNBQXBCLENBQUEsRUFBQSxhQUFrQyxXQUFsQyxFQUFBLElBQUEsTUFBSDt1QkFDSSxNQUFNLENBQUMsZUFBUCxDQUF1QixVQUF2QixHQURKO1NBQUEsTUFBQTt1QkFHSSxNQUFNLENBQUMsWUFBUCxDQUFvQixVQUFwQixFQUFnQyxJQUFoQyxHQUhKOztBQURKOztJQVBhOzs7O0tBdkNRO0FBSjdCIiwic291cmNlc0NvbnRlbnQiOlsie1ZpZXcsICR9ID0gcmVxdWlyZSAnYXRvbS1zcGFjZS1wZW4tdmlld3MnXG5Db25maWdWaWV3ID0gcmVxdWlyZSAnLi9jb25maWctdmlldydcblxubW9kdWxlLmV4cG9ydHMgPVxuY2xhc3MgR2RiVG9vbGJhclZpZXcgZXh0ZW5kcyBWaWV3XG4gICAgQGNtZE1hc2s6XG4gICAgICAgICdESVNDT05ORUNURUQnOiBbJ2Nvbm5lY3QnLCAnY29uZmlndXJlJ11cbiAgICAgICAgJ0VYSVRFRCc6IFsnY29ubmVjdCcsICdjb25maWd1cmUnLCAnY29udGludWUnXVxuICAgICAgICAnU1RPUFBFRCc6IFsnY29ubmVjdCcsICdjb25maWd1cmUnLCAnY29udGludWUnLCAnbmV4dCcsICdzdGVwJywgJ2ZpbmlzaCddXG4gICAgICAgICdSVU5OSU5HJzogWydjb25uZWN0JywgJ2NvbmZpZ3VyZScsICdpbnRlcnJ1cHQnXVxuXG4gICAgaW5pdGlhbGl6ZTogKGdkYikgLT5cbiAgICAgICAgQGdkYiA9IGdkYlxuICAgICAgICBAZ2RiLmV4ZWMub25TdGF0ZUNoYW5nZWQgQF9vblN0YXRlQ2hhbmdlZC5iaW5kKHRoaXMpXG4gICAgICAgIGZvciBidXR0b24gaW4gQGZpbmQoJ2J1dHRvbicpXG4gICAgICAgICAgICBjbWQgPSBidXR0b24uZ2V0QXR0cmlidXRlICdjb21tYW5kJ1xuICAgICAgICAgICAgdGhpc1tjbWRdID0gJChidXR0b24pXG4gICAgICAgICAgICBpZiBjbWQgPT0gJ2Nvbm5lY3QnIHRoZW4gY29udGludWVcbiAgICAgICAgICAgIGJ1dHRvbi5hZGRFdmVudExpc3RlbmVyICdjbGljaycsIEBkb1xuXG4gICAgQGNvbnRlbnQ6IC0+XG4gICAgICAgIEBkaXYgY2xhc3M6ICdidG4tdG9vbGJhcicsID0+XG4gICAgICAgICAgICBAZGl2IGNsYXNzOiAnYnRuLWdyb3VwJywgPT5cbiAgICAgICAgICAgICAgICBAYnV0dG9uIGNsYXNzOiAnYnRuIGljb24gaWNvbi1wbHVnJywgY29tbWFuZDogJ2Nvbm5lY3QnLCBjbGljazogJ3RvZ2dsZUNvbm5lY3QnXG4gICAgICAgICAgICAgICAgQGJ1dHRvbiBjbGFzczogJ2J0biBpY29uIGljb24tdG9vbHMnLCBjb21tYW5kOiAnY29uZmlndXJlJ1xuICAgICAgICAgICAgQGRpdiBjbGFzczogJ2J0bi1ncm91cCcsID0+XG4gICAgICAgICAgICAgICAgQGJ1dHRvbiBjbGFzczogJ2J0biBpY29uIGljb24tcGxheWJhY2stcGxheScsIGNvbW1hbmQ6ICdjb250aW51ZSdcbiAgICAgICAgICAgICAgICBAYnV0dG9uIGNsYXNzOiAnYnRuIGljb24gaWNvbi1wbGF5YmFjay1wYXVzZScsIGNvbW1hbmQ6ICdpbnRlcnJ1cHQnXG4gICAgICAgICAgICBAZGl2IGNsYXNzOiAnYnRuLWdyb3VwJywgPT5cbiAgICAgICAgICAgICAgICBAYnV0dG9uICdOZXh0JywgY2xhc3M6ICdidG4nLCBjb21tYW5kOiAnbmV4dCdcbiAgICAgICAgICAgICAgICBAYnV0dG9uICdTdGVwJywgY2xhc3M6ICdidG4nLCBjb21tYW5kOiAnc3RlcCdcbiAgICAgICAgICAgICAgICBAYnV0dG9uICdGaW5pc2gnLCBjbGFzczogJ2J0bicsIGNvbW1hbmQ6ICdmaW5pc2gnXG5cbiAgICBkbzogKGV2KSAtPlxuICAgICAgICBjb21tYW5kID0gZXYudGFyZ2V0LmdldEF0dHJpYnV0ZSAnY29tbWFuZCdcbiAgICAgICAgYXRvbS5jb21tYW5kcy5kaXNwYXRjaCBhdG9tLnZpZXdzLmdldFZpZXcoYXRvbS53b3Jrc3BhY2UpLCBcImF0b20tZ2RiLWRlYnVnZ2VyOiN7Y29tbWFuZH1cIlxuXG4gICAgdG9nZ2xlQ29ubmVjdDogLT5cbiAgICAgICAgaWYgQGNvbm5lY3QuaGFzQ2xhc3MgJ3NlbGVjdGVkJ1xuICAgICAgICAgICAgYXRvbS5jb21tYW5kcy5kaXNwYXRjaCBhdG9tLnZpZXdzLmdldFZpZXcoYXRvbS53b3Jrc3BhY2UpLCBcImF0b20tZ2RiLWRlYnVnZ2VyOmRpc2Nvbm5lY3RcIlxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoIGF0b20udmlld3MuZ2V0VmlldyhhdG9tLndvcmtzcGFjZSksIFwiYXRvbS1nZGItZGVidWdnZXI6Y29ubmVjdFwiXG5cbiAgICBfb25TdGF0ZUNoYW5nZWQ6IChbc3RhdGUsIGZyYW1lXSkgLT5cbiAgICAgICAgaWYgc3RhdGUgPT0gJ0RJU0NPTk5FQ1RFRCdcbiAgICAgICAgICAgIEBjb25uZWN0LnJlbW92ZUNsYXNzICdzZWxlY3RlZCdcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQGNvbm5lY3QuYWRkQ2xhc3MgJ3NlbGVjdGVkJ1xuXG4gICAgICAgIGVuYWJsZWRDbWRzID0gR2RiVG9vbGJhclZpZXcuY21kTWFza1tzdGF0ZV1cbiAgICAgICAgZm9yIGJ1dHRvbiBpbiBAZmluZCgnYnV0dG9uJylcbiAgICAgICAgICAgIGlmIGJ1dHRvbi5nZXRBdHRyaWJ1dGUoJ2NvbW1hbmQnKSBpbiBlbmFibGVkQ21kc1xuICAgICAgICAgICAgICAgIGJ1dHRvbi5yZW1vdmVBdHRyaWJ1dGUgJ2Rpc2FibGVkJ1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGJ1dHRvbi5zZXRBdHRyaWJ1dGUgJ2Rpc2FibGVkJywgdHJ1ZVxuIl19
