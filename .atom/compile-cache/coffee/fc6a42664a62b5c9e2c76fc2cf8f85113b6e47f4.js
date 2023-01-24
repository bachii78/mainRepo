(function() {
  var Emitter;

  Emitter = require('atom').Emitter;

  this.Panel = (function() {
    function Panel(main) {
      var XTerm;
      this.main = main;
      this.is_interactive = false;
      this.emitter = new Emitter();
      this.element = document.createElement('div');
      this.element.classList.add('output-panel', 'tool-panel');
      this.body = document.createElement('div');
      this.body.classList.add('panel-body');
      this.element.appendChild(this.body);
      XTerm = require('xterm');
      XTerm.loadAddon('fit');
      this.terminal = new XTerm({
        cursorBlink: false,
        visualBell: true,
        convertEol: true,
        termName: 'xterm-256color',
        scrollback: 1000,
        rows: 8
      });
      this.terminal.on('data', (function(_this) {
        return function(data) {
          var ref;
          if (_this.is_interactive) {
            return (ref = _this.main.pty) != null ? ref.write(data) : void 0;
          }
        };
      })(this));
      this.terminal.attachCustomKeydownHandler((function(_this) {
        return function(event) {
          if (event.key === 'a' && event.ctrlKey && !event.shiftKey && !event.altKey) {
            event.preventDefault();
            event.stopPropagation();
            _this.selectAll();
            return false;
          } else if ((event.key === 'c' && event.ctrlKey && !event.shiftKey && !event.altKey || event.key === 'Insert' && event.ctrlKey && !event.shiftKey && !event.altKey) && window.getSelection().toString()) {
            event.preventDefault();
            event.stopPropagation();
            _this.main.copy();
            return false;
          } else if (event.key === 'v' && event.ctrlKey && !event.shiftKey && !event.altKey || event.key === 'Insert' && !event.ctrlKey && event.shiftKey && !event.altKey) {
            event.preventDefault();
            event.stopPropagation();
            _this.main.paste();
            return false;
          }
        };
      })(this));
      this.terminal.open(this.body);
      if (this.main.interactiveSessions.length) {
        this.setInteractive(true);
      }
      this.resize();
    }

    Panel.prototype.getTitle = function() {
      return 'Output';
    };

    Panel.prototype.getDefaultLocation = function() {
      return 'bottom';
    };

    Panel.prototype.resize = function(height) {
      var ref, size;
      size = this.terminal.proposeGeometry();
      this.terminal.resize(size.cols || 80, size.rows || 8);
      return (ref = this.main.pty) != null ? ref.resize(size.cols || 80, size.rows || 8) : void 0;
    };

    Panel.prototype.destroy = function() {
      this.element.remove();
      return this.emitter.emit('didDestroy');
    };

    Panel.prototype.onDidDestroy = function(callback) {
      return this.emitter.on('didDestroy', callback);
    };

    Panel.prototype.getElement = function() {
      return this.element;
    };

    Panel.prototype.clear = function() {
      return this.terminal.reset();
    };

    Panel.prototype.print = function(line, newline) {
      if (newline == null) {
        newline = true;
      }
      if (newline) {
        return this.terminal.writeln(line);
      } else {
        return this.terminal.write(line);
      }
    };

    Panel.prototype.selectAll = function() {
      var range, selection;
      range = document.createRange();
      range.selectNodeContents((this.body.getElementsByClassName('xterm-rows'))[0]);
      selection = window.getSelection();
      selection.removeAllRanges();
      return selection.addRange(range);
    };

    Panel.prototype.copy = function() {
      var selected, selection;
      selection = window.getSelection();
      selected = selection.toString();
      selected = selected.replace(/\xa0/g, ' ');
      selected = selected.replace(/\s+(\n|$)/g, '$1');
      atom.clipboard.write(selected);
      return selection.removeAllRanges();
    };

    Panel.prototype.setInteractive = function(set) {
      if (this.is_interactive = set) {
        this.terminal.setOption('cursorBlink', true);
        return this.terminal.showCursor();
      } else {
        return this.terminal.setOption('cursorBlink', false);
      }
    };

    return Panel;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbGVhcm4vLmF0b20vcGFja2FnZXMvb3V0cHV0LXBhbmVsL2xpYi92aWV3L1BhbmVsLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUMsVUFBVyxPQUFBLENBQVEsTUFBUjs7RUFFTixJQUFDLENBQUE7SUFDTyxlQUFDLElBQUQ7QUFDWixVQUFBO01BQUEsSUFBQyxDQUFBLElBQUQsR0FBUTtNQUNSLElBQUMsQ0FBQSxjQUFELEdBQWtCO01BQ2xCLElBQUMsQ0FBQSxPQUFELEdBQVcsSUFBSSxPQUFKLENBQUE7TUFFWCxJQUFDLENBQUEsT0FBRCxHQUFXLFFBQVEsQ0FBQyxhQUFULENBQXVCLEtBQXZCO01BQ1gsSUFBQyxDQUFBLE9BQU8sQ0FBQyxTQUFTLENBQUMsR0FBbkIsQ0FBdUIsY0FBdkIsRUFBdUMsWUFBdkM7TUFFQSxJQUFDLENBQUEsSUFBRCxHQUFRLFFBQVEsQ0FBQyxhQUFULENBQXVCLEtBQXZCO01BQ1IsSUFBQyxDQUFBLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBaEIsQ0FBb0IsWUFBcEI7TUFFQSxJQUFDLENBQUEsT0FBTyxDQUFDLFdBQVQsQ0FBcUIsSUFBQyxDQUFBLElBQXRCO01BRUEsS0FBQSxHQUFRLE9BQUEsQ0FBUSxPQUFSO01BQ1IsS0FBSyxDQUFDLFNBQU4sQ0FBZ0IsS0FBaEI7TUFFQSxJQUFDLENBQUEsUUFBRCxHQUFZLElBQUksS0FBSixDQUFVO1FBQ3JCLFdBQUEsRUFBYSxLQURRO1FBRXJCLFVBQUEsRUFBWSxJQUZTO1FBR3JCLFVBQUEsRUFBWSxJQUhTO1FBSXJCLFFBQUEsRUFBVSxnQkFKVztRQUtyQixVQUFBLEVBQVksSUFMUztRQU1yQixJQUFBLEVBQU0sQ0FOZTtPQUFWO01BU1osSUFBQyxDQUFBLFFBQVEsQ0FBQyxFQUFWLENBQWEsTUFBYixFQUFxQixDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUMsSUFBRDtBQUNw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LENBQUEsUUFBUSxDQUFDLFNBQVYsQ0FBb0IsYUFBcEIsRUFBbUMsSUFBbkM7ZUFDQSxJQUFDLENBQUEsUUFBUSxDQUFDLFVBQVYsQ0FBQSxFQUZEO09BQUEsTUFBQTtlQUlDLElBQUMsQ0FBQSxRQUFRLENBQUMsU0FBVixDQUFvQixhQUFwQixFQUFtQyxLQUFuQyxFQUpEOztJQURlOzs7OztBQTdHakIiLCJzb3VyY2VzQ29udGVudCI6WyJ7RW1pdHRlcn0gPSByZXF1aXJlICdhdG9tJ1xuXG5jbGFzcyBAUGFuZWxcblx0Y29uc3RydWN0b3I6IChtYWluKSAtPlxuXHRcdEBtYWluID0gbWFpblxuXHRcdEBpc19pbnRlcmFjdGl2ZSA9IGZhbHNlXG5cdFx0QGVtaXR0ZXIgPSBuZXcgRW1pdHRlcigpXG5cblx0XHRAZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgJ2Rpdidcblx0XHRAZWxlbWVudC5jbGFzc0xpc3QuYWRkICdvdXRwdXQtcGFuZWwnLCAndG9vbC1wYW5lbCdcblxuXHRcdEBib2R5ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCAnZGl2J1xuXHRcdEBib2R5LmNsYXNzTGlzdC5hZGQgJ3BhbmVsLWJvZHknXG5cblx0XHRAZWxlbWVudC5hcHBlbmRDaGlsZCBAYm9keVxuXG5cdFx0WFRlcm0gPSByZXF1aXJlICd4dGVybSdcblx0XHRYVGVybS5sb2FkQWRkb24gJ2ZpdCdcblxuXHRcdEB0ZXJtaW5hbCA9IG5ldyBYVGVybSB7XG5cdFx0XHRjdXJzb3JCbGluazogZmFsc2Vcblx0XHRcdHZpc3VhbEJlbGw6IHRydWVcblx0XHRcdGNvbnZlcnRFb2w6IHRydWVcblx0XHRcdHRlcm1OYW1lOiAneHRlcm0tMjU2Y29sb3InXG5cdFx0XHRzY3JvbGxiYWNrOiAxMDAwXG5cdFx0XHRyb3dzOiA4XG5cdFx0fVxuXG5cdFx0QHRlcm1pbmFsLm9uICdkYXRhJywgKGRhdGEpID0+XG5cdFx0XHRpZiBAaXNfaW50ZXJhY3RpdmVcblx0XHRcdFx0QG1haW4ucHR5Py53cml0ZSBkYXRhXG5cblx0XHRAdGVybWluYWwuYXR0YWNoQ3VzdG9tS2V5ZG93bkhhbmRsZXIgKGV2ZW50KSA9PlxuXHRcdFx0IyBjdHJsLWFcblx0XHRcdGlmIGV2ZW50LmtleT09J2EnIGFuZCBldmVudC5jdHJsS2V5IGFuZCAhZXZlbnQuc2hpZnRLZXkgYW5kICFldmVudC5hbHRLZXlcblx0XHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKVxuXHRcdFx0XHRldmVudC5zdG9wUHJvcGFnYXRpb24oKVxuXHRcdFx0XHRAc2VsZWN0QWxsKClcblx0XHRcdFx0cmV0dXJuIGZhbHNlXG5cblx0XHRcdCMgY3RybC1jIC8gY3RybC1pbnNlcnRcblx0XHRcdGVsc2UgaWYgKFxuXHRcdFx0XHRldmVudC5rZXk9PSdjJyBhbmQgZXZlbnQuY3RybEtleSBhbmQgIWV2ZW50LnNoaWZ0S2V5IGFuZCAhZXZlbnQuYWx0S2V5IHx8XG5cdFx0XHRcdGV2ZW50LmtleT09J0luc2VydCcgYW5kIGV2ZW50LmN0cmxLZXkgYW5kICFldmVudC5zaGlmdEtleSBhbmQgIWV2ZW50LmFsdEtleVxuXHRcdFx0KSBhbmQgd2luZG93LmdldFNlbGVjdGlvbigpLnRvU3RyaW5nKClcblx0XHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKVxuXHRcdFx0XHRldmVudC5zdG9wUHJvcGFnYXRpb24oKVxuXHRcdFx0XHRAbWFpbi5jb3B5KClcblx0XHRcdFx0cmV0dXJuIGZhbHNlXG5cblx0XHRcdCMgY3RybC12IC8gc2hpZnQtaW5zZXJ0XG5cdFx0XHRlbHNlIGlmIChcblx0XHRcdFx0ZXZlbnQua2V5PT0ndicgYW5kIGV2ZW50LmN0cmxLZXkgYW5kICFldmVudC5zaGlmdEtleSBhbmQgIWV2ZW50LmFsdEtleXx8XG5cdFx0XHRcdGV2ZW50LmtleT09J0luc2VydCcgYW5kICFldmVudC5jdHJsS2V5IGFuZCBldmVudC5zaGlmdEtleSBhbmQgIWV2ZW50LmFsdEtleVxuXHRcdFx0KVxuXHRcdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpXG5cdFx0XHRcdGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpXG5cdFx0XHRcdEBtYWluLnBhc3RlKClcblx0XHRcdFx0cmV0dXJuIGZhbHNlXG5cblx0XHRAdGVybWluYWwub3BlbiBAYm9keVxuXG5cdFx0aWYgQG1haW4uaW50ZXJhY3RpdmVTZXNzaW9ucy5sZW5ndGhcblx0XHRcdEBzZXRJbnRlcmFjdGl2ZSB0cnVlXG5cblx0XHRAcmVzaXplKClcblxuXHRnZXRUaXRsZTogLT4gJ091dHB1dCdcblx0Z2V0RGVmYXVsdExvY2F0aW9uOiAtPiAnYm90dG9tJ1xuXG5cdHJlc2l6ZTogKGhlaWdodCkgLT5cblx0XHRzaXplID0gQHRlcm1pbmFsLnByb3Bvc2VHZW9tZXRyeSgpXG5cdFx0QHRlcm1pbmFsLnJlc2l6ZSBzaXplLmNvbHN8fDgwLCBzaXplLnJvd3N8fDhcblx0XHRAbWFpbi5wdHk/LnJlc2l6ZSBzaXplLmNvbHN8fDgwLCBzaXplLnJvd3N8fDhcblxuXHRkZXN0cm95OiAtPlxuXHRcdEBlbGVtZW50LnJlbW92ZSgpXG5cdFx0QGVtaXR0ZXIuZW1pdCAnZGlkRGVzdHJveSdcblxuXHRvbkRpZERlc3Ryb3k6IChjYWxsYmFjaykgLT5cblx0XHRAZW1pdHRlci5vbiAnZGlkRGVzdHJveScsIGNhbGxiYWNrXG5cblx0Z2V0RWxlbWVudDogLT5cblx0XHRAZWxlbWVudFxuXG5cdGNsZWFyOiAtPlxuXHRcdEB0ZXJtaW5hbC5yZXNldCgpXG5cblx0cHJpbnQ6IChsaW5lLCBuZXdsaW5lID0gdHJ1ZSkgLT5cblx0XHRpZiBuZXdsaW5lXG5cdFx0XHRAdGVybWluYWwud3JpdGVsbiBsaW5lXG5cdFx0ZWxzZVxuXHRcdFx0QHRlcm1pbmFsLndyaXRlIGxpbmVcblxuXHRzZWxlY3RBbGw6IC0+XG5cdFx0cmFuZ2UgPSBkb2N1bWVudC5jcmVhdGVSYW5nZSgpXG5cdFx0cmFuZ2Uuc2VsZWN0Tm9kZUNvbnRlbnRzIChAYm9keS5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lICd4dGVybS1yb3dzJylbMF1cblx0XHRzZWxlY3Rpb24gPSB3aW5kb3cuZ2V0U2VsZWN0aW9uKClcblx0XHRzZWxlY3Rpb24ucmVtb3ZlQWxsUmFuZ2VzKClcblx0XHRzZWxlY3Rpb24uYWRkUmFuZ2UgcmFuZ2VcblxuXHRjb3B5OiAtPlxuXHRcdHNlbGVjdGlvbiA9IHdpbmRvdy5nZXRTZWxlY3Rpb24oKVxuXHRcdHNlbGVjdGVkID0gc2VsZWN0aW9uLnRvU3RyaW5nKClcblx0XHRzZWxlY3RlZCA9IHNlbGVjdGVkLnJlcGxhY2UgL1xceGEwL2csICcgJ1xuXHRcdHNlbGVjdGVkID0gc2VsZWN0ZWQucmVwbGFjZSAvXFxzKyhcXG58JCkvZywnJDEnXG5cdFx0YXRvbS5jbGlwYm9hcmQud3JpdGUgc2VsZWN0ZWRcblx0XHRzZWxlY3Rpb24ucmVtb3ZlQWxsUmFuZ2VzKCkgI2NsZWFyIGFsbCBzZWxlY3Rpb25zIGZvciBuZWF0bmVzc1xuXG5cdHNldEludGVyYWN0aXZlOiAoc2V0KSAtPlxuXHRcdGlmIEBpc19pbnRlcmFjdGl2ZSA9IHNldFxuXHRcdFx0QHRlcm1pbmFsLnNldE9wdGlvbiAnY3Vyc29yQmxpbmsnLCB0cnVlXG5cdFx0XHRAdGVybWluYWwuc2hvd0N1cnNvcigpXG5cdFx0ZWxzZVxuXHRcdFx0QHRlcm1pbmFsLnNldE9wdGlvbiAnY3Vyc29yQmxpbmsnLCBmYWxzZVxuXHRcdFx0IyBAdGVybWluYWwuaGlkZUN1cnNvcigpICMgZnVuY3Rpb24gYXBwYXJlbnRseSBkb2VzIG5vdCBleGlzdC4uXG4iXX0=
