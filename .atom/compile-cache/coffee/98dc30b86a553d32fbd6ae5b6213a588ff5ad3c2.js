(function() {
  var CompositeDisposable, EditorIntegration, cidentFromLine, cidentFromMouse, decorate, fs, posFromMouse,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  CompositeDisposable = require('atom').CompositeDisposable;

  fs = require('fs');

  cidentFromLine = require('./utils').cidentFromLine;

  posFromMouse = function(editor, ev) {
    var screenPosition;
    screenPosition = editor.editorElement.component.screenPositionForMouseEvent(ev);
    return editor.bufferPositionForScreenPosition(screenPosition);
  };

  cidentFromMouse = function(ev) {
    var buffer, cident, column, ed, line, ref, row;
    try {
      ed = ev.target.model;
      ref = posFromMouse(ed, ev), row = ref.row, column = ref.column;
      buffer = ed.getBuffer();
      line = buffer.lineForRow(row);
      cident = cidentFromLine(line, column);
    } catch (error) {
      return;
    }
    return cident;
  };

  decorate = function(file, line, decoration) {
    line = +line - 1;
    return new Promise(function(resolve, reject) {
      return fs.access(file, fs.R_OK, function(err) {
        if (err) {
          return reject(err);
        } else {
          return resolve();
        }
      });
    }).then(function() {
      return atom.workspace.open(file, {
        activatePane: false,
        initialLine: line,
        searchAllPanes: true,
        pending: true
      });
    }).then(function(editor) {
      var mark;
      mark = editor.markBufferPosition([line, 1]);
      editor.decorateMarker(mark, decoration);
      return mark;
    });
  };

  module.exports = EditorIntegration = (function() {
    function EditorIntegration(gdb) {
      this.gdb = gdb;
      this._hookEditor = bind(this._hookEditor, this);
      this._frameChanged = bind(this._frameChanged, this);
      this._toggleBreakpoint = bind(this._toggleBreakpoint, this);
      this._ctxWatchExpr = bind(this._ctxWatchExpr, this);
      this.breakMarks = {};
      this.subscriptions = new CompositeDisposable;
      this.subscriptions.add(this.gdb.exec.onFrameChanged(this._frameChanged));
      this.subscriptions.add(this.gdb.breaks.observe(this._breakpointCreated));
      this.subscriptions.add(atom.commands.add('atom-text-editor', {
        'atom-gdb-debugger:toggle-breakpoint': this._toggleBreakpoint,
        'atom-gdb-debugger:context-watch-expression': this._ctxWatchExpr
      }));
      this.subscriptions.add(atom.workspace.observeTextEditors(this._hookEditor));
      this.subscriptions.add(atom.contextMenu.add({
        'atom-text-editor': [
          {
            label: "Toggle Breakpoint",
            command: "atom-gdb-debugger:toggle-breakpoint",
            created: (function(_this) {
              return function(ev) {
                return _this.ctxEvent = ev;
              };
            })(this)
          }, {
            command: "atom-gdb-debugger:context-watch-expression",
            shouldDisplay: (function(_this) {
              return function(ev) {
                var cident;
                _this.ctxEvent = ev;
                cident = cidentFromMouse(ev);
                return (cident != null) && cident !== '';
              };
            })(this),
            created: function(ev) {
              return this.label = "Watch '" + (cidentFromMouse(ev)) + "'";
            }
          }
        ]
      }));
    }

    EditorIntegration.prototype._ctxWatchExpr = function(ev) {
      return this.gdb.vars.add(cidentFromMouse(this.ctxEvent))["catch"](function(err) {
        return atom.notifications.addError(err.toString());
      });
    };

    EditorIntegration.prototype._toggleBreakpoint = function(ev) {
      var editor, file, ref, row;
      editor = ev.currentTarget.component.editor;
      if ((ref = ev.detail) != null ? ref[0].contextCommand : void 0) {
        row = posFromMouse(ev.currentTarget.model, this.ctxEvent).row;
      } else {
        row = editor.getCursorBufferPosition().row;
      }
      file = editor.getBuffer().getPath();
      return this.gdb.breaks.toggle(file, row + 1);
    };

    EditorIntegration.prototype._frameChanged = function(frame) {
      if (this.mark != null) {
        this.mark.destroy();
      }
      this.mark = null;
      if (frame == null) {
        return;
      }
      if (frame.fullname == null) {
        atom.notifications.addWarning("Debug info not available", {
          description: "This may be because the function is part of an external library, or the binary was compiled without debug information."
        });
        return;
      }
      return decorate(frame.fullname, frame.line, {
        type: 'line',
        "class": 'gdb-frame'
      }).then((function(_this) {
        return function(mark) {
          return _this.mark = mark;
        };
      })(this))["catch"](function() {
        return atom.notifications.addWarning("Source file not available", {
          description: "Unable to open `" + frame.file + "` for the current frame.  This may be because the function is part of a external included library."
        });
      });
    };

    EditorIntegration.prototype._breakpointCreated = function(id, bkpt) {
      var fullname, line;
      fullname = bkpt.fullname, line = bkpt.line;
      if (fullname == null) {
        return;
      }
      return decorate(fullname, line, {
        type: 'line-number',
        "class": 'gdb-bkpt'
      }).then(function(mark) {
        bkpt.onChanged(function() {
          return mark.setBufferRange([[line - 1, 0], [line - 1, 0]]);
        });
        return bkpt.onDeleted(function() {
          return mark.destroy();
        });
      });
    };

    EditorIntegration.prototype._hookEditor = function(ed) {
      var el, hover, timeout;
      timeout = null;
      el = ed.editorElement;
      hover = (function(_this) {
        return function(ev) {
          var cident;
          try {
            cident = cidentFromMouse(ev);
            if ((cident == null) || cident === '') {
              return;
            }
          } catch (error) {
            return;
          }
          return _this.gdb.vars.evalExpression(cident).then(function(val) {
            return atom.notifications.addInfo("`" + cident + " = " + val + "`");
          })["catch"](function() {});
        };
      })(this);
      el.addEventListener('mousemove', function(ev) {
        if (timeout != null) {
          clearTimeout(timeout);
        }
        return timeout = setTimeout(hover.bind(null, ev), 2000);
      });
      return el.addEventListener('mouseout', function() {
        clearTimeout(timeout);
        return timeout = null;
      });
    };

    return EditorIntegration;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbGVhcm4vLmF0b20vcGFja2FnZXMvYXRvbS1nZGItZGVidWdnZXIvbGliL2VkaXRvci1pbnRlZ3JhdGlvbi5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLG1HQUFBO0lBQUE7O0VBQUMsc0JBQXVCLE9BQUEsQ0FBUSxNQUFSOztFQUN4QixFQUFBLEdBQUssT0FBQSxDQUFRLElBQVI7O0VBQ0osaUJBQWtCLE9BQUEsQ0FBUSxTQUFSOztFQUVuQixZQUFBLEdBQWUsU0FBQyxNQUFELEVBQVMsRUFBVDtBQUNYLFFBQUE7SUFBQSxjQUFBLEdBQ0ksTUFBTSxDQUFDLGFBQWEsQ0FBQyxTQUFTLENBQUMsMkJBQS9CLENBQTJELEVBQTNEO1dBQ0osTUFBTSxDQUFDLCtCQUFQLENBQXVDLGNBQXZDO0VBSFc7O0VBS2YsZUFBQSxHQUFrQixTQUFDLEVBQUQ7QUFDZCxRQUFBO0FBQUE7TUFDSSxFQUFBLEdBQUssRUFBRSxDQUFDLE1BQU0sQ0FBQztNQUNmLE1BQWdCLFlBQUEsQ0FBYSxFQUFiLEVBQWlCLEVBQWpCLENBQWhCLEVBQUMsYUFBRCxFQUFNO01BQ04sTUFBQSxHQUFTLEVBQUUsQ0FBQyxTQUFILENBQUE7TUFDVCxJQUFBLEdBQU8sTUFBTSxDQUFDLFVBQVAsQ0FBa0IsR0FBbEI7TUFDUCxNQUFBLEdBQVMsY0FBQSxDQUFlLElBQWYsRUFBcUIsTUFBckIsRUFMYjtLQUFBLGFBQUE7QUFPSSxhQVBKOztBQVFBLFdBQU87RUFUTzs7RUFXbEIsUUFBQSxHQUFXLFNBQUMsSUFBRCxFQUFPLElBQVAsRUFBYSxVQUFiO0lBQ1AsSUFBQSxHQUFPLENBQUMsSUFBRCxHQUFNO1dBQ2IsSUFBSSxPQUFKLENBQVksU0FBQyxPQUFELEVBQVUsTUFBVjthQUNSLEVBQUUsQ0FBQyxNQUFILENBQVUsSUFBVixFQUFnQixFQUFFLENBQUMsSUFBbkIsRUFBeUIsU0FBQyxHQUFEO1FBQ3JC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bUJBQ0YsSUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFuQixDQUEyQixHQUFBLEdBQUksTUFBSixHQUFXLEtBQVgsR0FBZ0IsR0FBaEIsR0FBb0IsR0FBL0M7VUFERSxDQURWLENBR0ksRUFBQyxLQUFELEVBSEosQ0FHVyxTQUFBLEdBQUEsQ0FIWDtRQU5JO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQTtNQVdSLEVBQUUsQ0FBQyxnQkFBSCxDQUFvQixXQUFwQixFQUFpQyxTQUFDLEVBQUQ7UUFDN0IsSUFBRyxlQUFIO1VBQ0ksWUFBQSxDQUFhLE9BQWIsRUFESjs7ZUFFQSxPQUFBLEdBQVUsVUFBQSxDQUFXLEtBQUssQ0FBQyxJQUFOLENBQVcsSUFBWCxFQUFpQixFQUFqQixDQUFYLEVBQWlDLElBQWpDO01BSG1CLENBQWpDO2FBSUEsRUFBRSxDQUFDLGdCQUFILENBQW9CLFVBQXBCLEVBQWdDLFNBQUE7UUFDNUIsWUFBQSxDQUFhLE9BQWI7ZUFDQSxPQUFBLEdBQVU7TUFGa0IsQ0FBaEM7SUFsQlM7Ozs7O0FBOUdqQiIsInNvdXJjZXNDb250ZW50IjpbIntDb21wb3NpdGVEaXNwb3NhYmxlfSA9IHJlcXVpcmUgJ2F0b20nXG5mcyA9IHJlcXVpcmUgJ2ZzJ1xue2NpZGVudEZyb21MaW5lfSA9IHJlcXVpcmUgJy4vdXRpbHMnXG5cbnBvc0Zyb21Nb3VzZSA9IChlZGl0b3IsIGV2KSAtPlxuICAgIHNjcmVlblBvc2l0aW9uID1cbiAgICAgICAgZWRpdG9yLmVkaXRvckVsZW1lbnQuY29tcG9uZW50LnNjcmVlblBvc2l0aW9uRm9yTW91c2VFdmVudCBldlxuICAgIGVkaXRvci5idWZmZXJQb3NpdGlvbkZvclNjcmVlblBvc2l0aW9uIHNjcmVlblBvc2l0aW9uXG5cbmNpZGVudEZyb21Nb3VzZSA9IChldikgLT5cbiAgICB0cnlcbiAgICAgICAgZWQgPSBldi50YXJnZXQubW9kZWxcbiAgICAgICAge3JvdywgY29sdW1ufSA9IHBvc0Zyb21Nb3VzZSBlZCwgZXZcbiAgICAgICAgYnVmZmVyID0gZWQuZ2V0QnVmZmVyKClcbiAgICAgICAgbGluZSA9IGJ1ZmZlci5saW5lRm9yUm93IHJvd1xuICAgICAgICBjaWRlbnQgPSBjaWRlbnRGcm9tTGluZSBsaW5lLCBjb2x1bW5cbiAgICBjYXRjaFxuICAgICAgICByZXR1cm5cbiAgICByZXR1cm4gY2lkZW50XG5cbmRlY29yYXRlID0gKGZpbGUsIGxpbmUsIGRlY29yYXRpb24pIC0+XG4gICAgbGluZSA9ICtsaW5lLTFcbiAgICBuZXcgUHJvbWlzZSAocmVzb2x2ZSwgcmVqZWN0KSAtPlxuICAgICAgICBmcy5hY2Nlc3MgZmlsZSwgZnMuUl9PSywgKGVycikgLT5cbiAgICAgICAgICAgIGlmIGVyciB0aGVuIHJlamVjdChlcnIpIGVsc2UgcmVzb2x2ZSgpXG4gICAgLnRoZW4gKCkgLT5cbiAgICAgICAgYXRvbS53b3Jrc3BhY2Uub3BlbiBmaWxlLFxuICAgICAgICAgICAgYWN0aXZhdGVQYW5lOiBmYWxzZVxuICAgICAgICAgICAgaW5pdGlhbExpbmU6IGxpbmVcbiAgICAgICAgICAgIHNlYXJjaEFsbFBhbmVzOiB0cnVlXG4gICAgICAgICAgICBwZW5kaW5nOiB0cnVlXG4gICAgLnRoZW4gKGVkaXRvcikgLT5cbiAgICAgICAgbWFyayA9IGVkaXRvci5tYXJrQnVmZmVyUG9zaXRpb24oW2xpbmUsIDFdKVxuICAgICAgICBlZGl0b3IuZGVjb3JhdGVNYXJrZXIgbWFyaywgZGVjb3JhdGlvblxuICAgICAgICBtYXJrXG5cbm1vZHVsZS5leHBvcnRzID1cbmNsYXNzIEVkaXRvckludGVncmF0aW9uXG4gICAgY29uc3RydWN0b3I6IChAZ2RiKSAtPlxuICAgICAgICBAYnJlYWtNYXJrcyA9IHt9XG5cbiAgICAgICAgQHN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZVxuXG4gICAgICAgIEBzdWJzY3JpcHRpb25zLmFkZCBAZ2RiLmV4ZWMub25GcmFtZUNoYW5nZWQgQF9mcmFtZUNoYW5nZWRcbiAgICAgICAgQHN1YnNjcmlwdGlvbnMuYWRkIEBnZGIuYnJlYWtzLm9ic2VydmUgQF9icmVha3BvaW50Q3JlYXRlZFxuXG4gICAgICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLmNvbW1hbmRzLmFkZCAnYXRvbS10ZXh0LWVkaXRvcicsXG4gICAgICAgICAgICAnYXRvbS1nZGItZGVidWdnZXI6dG9nZ2xlLWJyZWFrcG9pbnQnOiBAX3RvZ2dsZUJyZWFrcG9pbnRcbiAgICAgICAgICAgICdhdG9tLWdkYi1kZWJ1Z2dlcjpjb250ZXh0LXdhdGNoLWV4cHJlc3Npb24nOiBAX2N0eFdhdGNoRXhwclxuXG4gICAgICAgIEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLndvcmtzcGFjZS5vYnNlcnZlVGV4dEVkaXRvcnMgQF9ob29rRWRpdG9yXG5cbiAgICAgICAgQHN1YnNjcmlwdGlvbnMuYWRkIGF0b20uY29udGV4dE1lbnUuYWRkXG4gICAgICAgICAgICAnYXRvbS10ZXh0LWVkaXRvcic6IFt7XG4gICAgICAgICAgICAgICAgbGFiZWw6IFwiVG9nZ2xlIEJyZWFrcG9pbnRcIlxuICAgICAgICAgICAgICAgIGNvbW1hbmQ6IFwiYXRvbS1nZGItZGVidWdnZXI6dG9nZ2xlLWJyZWFrcG9pbnRcIlxuICAgICAgICAgICAgICAgIGNyZWF0ZWQ6IChldikgPT4gQGN0eEV2ZW50ID0gZXZcbiAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICBjb21tYW5kOiBcImF0b20tZ2RiLWRlYnVnZ2VyOmNvbnRleHQtd2F0Y2gtZXhwcmVzc2lvblwiXG4gICAgICAgICAgICAgICAgc2hvdWxkRGlzcGxheTogKGV2KSA9PlxuICAgICAgICAgICAgICAgICAgICBAY3R4RXZlbnQgPSBldlxuICAgICAgICAgICAgICAgICAgICBjaWRlbnQgPSBjaWRlbnRGcm9tTW91c2UgZXZcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNpZGVudD8gYW5kIGNpZGVudCAhPSAnJ1xuICAgICAgICAgICAgICAgIGNyZWF0ZWQ6IChldikgLT5cbiAgICAgICAgICAgICAgICAgICAgQGxhYmVsID0gXCJXYXRjaCAnI3tjaWRlbnRGcm9tTW91c2UgZXZ9J1wiXG4gICAgICAgICAgICB9XVxuXG4gICAgX2N0eFdhdGNoRXhwcjogKGV2KSA9PlxuICAgICAgICBAZ2RiLnZhcnMuYWRkKGNpZGVudEZyb21Nb3VzZShAY3R4RXZlbnQpKVxuICAgICAgICAuY2F0Y2ggKGVycikgLT5cbiAgICAgICAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRFcnJvcihlcnIudG9TdHJpbmcoKSlcblxuICAgIF90b2dnbGVCcmVha3BvaW50OiAoZXYpID0+XG4gICAgICAgIGVkaXRvciA9IGV2LmN1cnJlbnRUYXJnZXQuY29tcG9uZW50LmVkaXRvclxuICAgICAgICBpZiBldi5kZXRhaWw/WzBdLmNvbnRleHRDb21tYW5kXG4gICAgICAgICAgICB7cm93fSA9IHBvc0Zyb21Nb3VzZShldi5jdXJyZW50VGFyZ2V0Lm1vZGVsLCBAY3R4RXZlbnQpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHtyb3d9ID0gZWRpdG9yLmdldEN1cnNvckJ1ZmZlclBvc2l0aW9uKClcbiAgICAgICAgZmlsZSA9IGVkaXRvci5nZXRCdWZmZXIoKS5nZXRQYXRoKClcbiAgICAgICAgQGdkYi5icmVha3MudG9nZ2xlKGZpbGUsIHJvdysxKVxuXG4gICAgX2ZyYW1lQ2hhbmdlZDogKGZyYW1lKSA9PlxuICAgICAgICBpZiBAbWFyaz8gdGhlbiBAbWFyay5kZXN0cm95KClcbiAgICAgICAgQG1hcmsgPSBudWxsXG4gICAgICAgIGlmIG5vdCBmcmFtZT8gdGhlbiByZXR1cm5cbiAgICAgICAgaWYgbm90IGZyYW1lLmZ1bGxuYW1lP1xuICAgICAgICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZFdhcm5pbmcgXCJEZWJ1ZyBpbmZvIG5vdCBhdmFpbGFibGVcIixcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJUaGlzIG1heSBiZSBiZWNhdXNlIHRoZSBmdW5jdGlvbiBpcyBwYXJ0IG9mIGFuXG4gICAgICAgICAgICAgICAgZXh0ZXJuYWwgbGlicmFyeSwgb3IgdGhlIGJpbmFyeSB3YXMgY29tcGlsZWQgd2l0aG91dCBkZWJ1Z1xuICAgICAgICAgICAgICAgIGluZm9ybWF0aW9uLlwiXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgZGVjb3JhdGUgZnJhbWUuZnVsbG5hbWUsIGZyYW1lLmxpbmUsIHR5cGU6ICdsaW5lJywgY2xhc3M6ICdnZGItZnJhbWUnXG4gICAgICAgICAgICAudGhlbiAobWFyaykgPT4gQG1hcmsgPSBtYXJrXG4gICAgICAgICAgICAuY2F0Y2ggKCkgLT5cbiAgICAgICAgICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkV2FybmluZyBcIlNvdXJjZSBmaWxlIG5vdCBhdmFpbGFibGVcIixcbiAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiVW5hYmxlIHRvIG9wZW4gYCN7ZnJhbWUuZmlsZX1gIGZvciB0aGVcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudCBmcmFtZS4gIFRoaXMgbWF5IGJlIGJlY2F1c2UgdGhlIGZ1bmN0aW9uIGlzIHBhcnRcbiAgICAgICAgICAgICAgICAgICAgb2YgYSBleHRlcm5hbCBpbmNsdWRlZCBsaWJyYXJ5LlwiXG5cbiAgICBfYnJlYWtwb2ludENyZWF0ZWQ6IChpZCwgYmtwdCkgLT5cbiAgICAgICAge2Z1bGxuYW1lLCBsaW5lfSA9IGJrcHRcbiAgICAgICAgaWYgbm90IGZ1bGxuYW1lPyB0aGVuIHJldHVyblxuICAgICAgICBkZWNvcmF0ZSBmdWxsbmFtZSwgbGluZSxcbiAgICAgICAgICAgICAgICB0eXBlOiAnbGluZS1udW1iZXInLCBjbGFzczogJ2dkYi1ia3B0J1xuICAgICAgICAgICAgLnRoZW4gKG1hcmspIC0+XG4gICAgICAgICAgICAgICAgYmtwdC5vbkNoYW5nZWQgLT5cbiAgICAgICAgICAgICAgICAgICAgbWFyay5zZXRCdWZmZXJSYW5nZSBbW2xpbmUtMSwgMF0sIFtsaW5lLTEsIDBdXVxuICAgICAgICAgICAgICAgIGJrcHQub25EZWxldGVkIC0+XG4gICAgICAgICAgICAgICAgICAgIG1hcmsuZGVzdHJveSgpXG5cbiAgICBfaG9va0VkaXRvcjogKGVkKSA9PlxuICAgICAgICB0aW1lb3V0ID0gbnVsbFxuICAgICAgICBlbCA9IGVkLmVkaXRvckVsZW1lbnRcbiAgICAgICAgaG92ZXIgPSAoZXYpID0+XG4gICAgICAgICAgICB0cnlcbiAgICAgICAgICAgICAgICBjaWRlbnQgPSBjaWRlbnRGcm9tTW91c2UgZXZcbiAgICAgICAgICAgICAgICBpZiBub3QgY2lkZW50PyBvciBjaWRlbnQgPT0gJycgdGhlbiByZXR1cm5cbiAgICAgICAgICAgIGNhdGNoXG4gICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICBAZ2RiLnZhcnMuZXZhbEV4cHJlc3Npb24gY2lkZW50XG4gICAgICAgICAgICAgICAgLnRoZW4gKHZhbCkgLT5cbiAgICAgICAgICAgICAgICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEluZm8gXCJgI3tjaWRlbnR9ID0gI3t2YWx9YFwiXG4gICAgICAgICAgICAgICAgLmNhdGNoICgpIC0+XG5cbiAgICAgICAgZWwuYWRkRXZlbnRMaXN0ZW5lciAnbW91c2Vtb3ZlJywgKGV2KSAtPlxuICAgICAgICAgICAgaWYgdGltZW91dD9cbiAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQgdGltZW91dFxuICAgICAgICAgICAgdGltZW91dCA9IHNldFRpbWVvdXQgaG92ZXIuYmluZChudWxsLCBldiksIDIwMDBcbiAgICAgICAgZWwuYWRkRXZlbnRMaXN0ZW5lciAnbW91c2VvdXQnLCAoKSAtPlxuICAgICAgICAgICAgY2xlYXJUaW1lb3V0IHRpbWVvdXRcbiAgICAgICAgICAgIHRpbWVvdXQgPSBudWxsXG4iXX0=
