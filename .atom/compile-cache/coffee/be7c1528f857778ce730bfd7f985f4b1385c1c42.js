(function() {
  var Emitter, File, Ui, ref, trimString;

  ref = require('atom'), Emitter = ref.Emitter, File = ref.File;

  trimString = function(string, length) {
    if (string.length <= length) {
      return string;
    } else {
      return (string.substr(0, length / 2 - 1)) + '...' + (string.substr(string.length - (length / 2 - 2)));
    }
  };

  module.exports = Ui = (function() {
    function Ui(bugger) {
      this.emitter = new Emitter;
      this.bugger = bugger;
      this.isPaused = false;
      this.isStepping = false;
      this.stack = [];
      this.currentPath = null;
      this.currentLine = 0;
      this.currentFrame = 0;
      this.variables = [];
      this.lastVariables = {};
      this.lastPosition = {};
      this.markers = [];
      this.openFiles = {};
      this.hintMarkers = {};
      this.showHints = true;
      atom.workspace.observeTextEditors((function(_this) {
        return function(editor) {
          return _this.addEditorMarkers(editor);
        };
      })(this));
    }

    Ui.prototype.serialize = function() {};

    Ui.prototype.clear = function() {};

    Ui.prototype.setLocation = function(filename, lineNumber) {
      var file;
      if (!filename) {
        return;
      }
      file = new File(filename);
      return file.exists().then((function(_this) {
        return function(exists) {
          if (exists) {
            return atom.workspace.open(filename, {
              initialLine: lineNumber - 1,
              pending: true,
              searchAllPanes: true
            }).then(function(textEditor) {
              _this.openFiles[filename] = textEditor;
              return textEditor.onDidDestroy(function() {
                return delete _this.openFiles[filename];
              });
            });
          }
        };
      })(this));
    };

    Ui.prototype.setStack = function(stack) {
      var editor, i, len, ref1;
      this.stack = stack;
      this.bugger.stackList.updateStack(this.stack);
      this.clearEditorMarkers();
      ref1 = atom.workspace.getTextEditors();
      for (i = 0, len = ref1.length; i < len; i++) {
        editor = ref1[i];
        this.addEditorMarkers(editor);
      }
      if (stack.length > 0) {
        return this.setFrame(this.stack.length - 1);
      }
    };

    Ui.prototype.setVariables = function(variables) {
      var i, lastPosition, lastVariables, len, old, updateMessages, variable;
      this.variables = variables;
      if (this.currentPath) {
        lastVariables = this.lastVariables[this.currentPath];
        lastPosition = this.lastPosition[this.currentPath];
        if (!lastVariables) {
          lastVariables = this.lastVariables[this.currentPath] = {};
        }
        updateMessages = [];
        for (i = 0, len = variables.length; i < len; i++) {
          variable = variables[i];
          if (this.isStepping) {
            old = lastVariables[variable.name];
            if (variable.value && (!old || old.value !== variable.value)) {
              updateMessages.push(variable.name + ' = ' + trimString(variable.value.replace(/\s*[\r\n]\s*/g, ' '), 48));
            }
          }
          lastVariables[variable.name] = variable;
        }
        if (this.isStepping && updateMessages.length) {
          if (!lastPosition) {
            this.setHint(this.currentPath, this.currentLine, updateMessages.join('\n'));
          } else if (this.currentFrame !== lastPosition.frame) {
            this.setHint(this.currentPath, Math.max(this.currentLine - 1, 1), updateMessages.join('\n'));
          } else {
            this.setHint(this.currentPath, lastPosition.line, updateMessages.join('\n'));
          }
        }
      }
      return this.bugger.variableList.updateVariables(this.variables);
    };

    Ui.prototype.setFrame = function(index) {
      var frame;
      this.bugger.stackList.setFrame(index);
      frame = this.stack[index];
      if (!frame.local) {
        this.bugger.stackList.setShowSystemStack(true);
      }
      if (frame.file !== this.currentPath || frame.line !== this.currentLine) {
        this.lastPosition[this.currentPath] = {
          line: this.currentLine,
          frame: this.currentFrame
        };
      }
      this.currentPath = frame.file;
      this.currentLine = frame.line;
      this.currentFrame = index;
      this.bugger.toolbar.updateButtons();
      return this.setLocation(frame.file, frame.line);
    };

    Ui.prototype.clearEditorMarkers = function() {
      var i, len, marker, ref1;
      ref1 = this.markers;
      for (i = 0, len = ref1.length; i < len; i++) {
        marker = ref1[i];
        marker.destroy();
      }
      return this.markers = [];
    };

    Ui.prototype.setHint = function(filename, lineNumber, info) {
      var content, element, hash, i, indent, j, len, len1, line, lineIndent, lineMarker, lineWidth, markerObject, ref1, ref2, ref3, textEditor;
      if (!this.showHints) {
        return;
      }
      textEditor = this.openFiles[filename];
      if (!textEditor) {
        return;
      }
      while (true) {
        line = (textEditor.lineTextForBufferRow(lineNumber - 1)) || '';
        if (lineNumber > 1 && /^\s*$/.test(line)) {
          lineNumber--;
          continue;
        } else {
          break;
        }
      }
      lineWidth = line.length;
      lineIndent = textEditor.indentationForBufferRow(lineNumber - 1);
      lineMarker = textEditor.markBufferRange([[lineNumber - 1, lineIndent], [lineNumber - 1, lineWidth]]);
      markerObject = {
        marker: lineMarker,
        decoration: null,
        element: null
      };
      hash = filename + '-' + lineNumber;
      if ((ref1 = this.hintMarkers[hash]) != null) {
        ref1.marker.destroy();
      }
      this.hintMarkers[hash] = markerObject;
      if (false) {
        markerObject.element = element = document.createElement('div');
        element.classList.add('debug-hint-overlay');
        element.classList.add('inline');
        element.classList.toggle('hidden', !this.showHints);
        ref2 = info.split('\n');
        for (i = 0, len = ref2.length; i < len; i++) {
          line = ref2[i];
          element.append(document.createElement('br'));
          element.append(document.createTextNode(line));
        }
        element.removeChild(element.children[0]);
        atom.config.observe('editor.lineHeight', function(h) {
          element.style.top = -h + 'em';
          return element.style.height = h + 'em';
        });
        return markerObject.decoration = textEditor.decorateMarker(lineMarker, {
          type: 'overlay',
          item: element
        });
      } else {
        markerObject.element = element = document.createElement('div');
        element.classList.add('debug-hint-block');
        element.classList.toggle('hidden', !this.showHints);
        indent = document.createElement('div');
        indent.classList.add('indent');
        atom.config.observe('editor.tabLength', function(w) {
          return indent.textContent = Array(lineIndent * w + 1).join(' ');
        });
        element.appendChild(indent);
        content = document.createElement('div');
        content.classList.add('content');
        ref3 = info.split('\n');
        for (j = 0, len1 = ref3.length; j < len1; j++) {
          line = ref3[j];
          content.appendChild(document.createElement('br'));
          content.appendChild(document.createTextNode(line));
        }
        content.removeChild(content.children[0]);
        element.appendChild(content);
        return markerObject.decoration = textEditor.decorateMarker(lineMarker, {
          type: 'block',
          position: 'after',
          item: element
        });
      }
    };

    Ui.prototype.clearHints = function() {
      var hash, marker, ref1;
      ref1 = this.hintMarkers;
      for (hash in ref1) {
        marker = ref1[hash];
        marker.marker.destroy();
      }
      return this.hintMarkers = {};
    };

    Ui.prototype.clearAll = function() {
      this.currentPath = null;
      this.currentLine = 0;
      this.variables = [];
      this.lastVariables = {};
      this.lastPositions = {};
      this.isPaused = false;
      this.isStepping = false;
      this.clearHints();
      this.clearEditorMarkers();
      this.setStack([]);
      return this.setVariables([]);
    };

    Ui.prototype.addEditorMarkers = function(textEditor) {
      var _class, frame, i, len, lineMarker, path, ref1, results;
      path = textEditor.getPath();
      ref1 = this.stack;
      results = [];
      for (i = 0, len = ref1.length; i < len; i++) {
        frame = ref1[i];
        if (frame.file === path) {
          this.markers.push(lineMarker = textEditor.markBufferRange([[frame.line - 1, 0], [frame.line - 1, 0]]));
          _class = frame.error ? 'debug-position-error' : 'debug-position';
          textEditor.decorateMarker(lineMarker, {
            type: 'line-number',
            "class": _class
          });
          results.push(textEditor.decorateMarker(lineMarker, {
            type: 'line',
            "class": _class
          }));
        } else {
          results.push(void 0);
        }
      }
      return results;
    };

    Ui.prototype.running = function() {
      this.isPaused = false;
      this.setStack([]);
      this.setVariables([]);
      return this.bugger.toolbar.updateButtons();
    };

    Ui.prototype.paused = function() {
      var currentWindow;
      currentWindow = (require('electron')).remote.getCurrentWindow();
      currentWindow.focus();
      this.isPaused = true;
      return this.bugger.toolbar.updateButtons();
    };

    Ui.prototype.stop = function() {
      this.isStepping = false;
      return this.bugger.stop();
    };

    Ui.prototype.showWarning = function(message) {
      return atom.notifications.addWarning(message, {
        dismissable: true
      });
    };

    Ui.prototype.showError = function(message) {
      return atom.notifications.addError(message, {
        dismissable: true
      });
    };

    Ui.prototype.setShowHints = function(set) {
      this.showHints = set;
      this.emitter.emit('setShowHints', set);
      if (!set) {
        return this.clearHints();
      }
    };

    return Ui;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbGVhcm4vLmF0b20vcGFja2FnZXMvZGJnL2xpYi9VaS5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFBLE1BQWtCLE9BQUEsQ0FBUSxNQUFSLENBQWxCLEVBQUMscUJBQUQsRUFBVTs7RUFFVixVQUFBLEdBQWEsU0FBQyxNQUFELEVBQVMsTUFBVDtJQUNaLElBQUcsTUFBTSxDQUFDLE1BQVAsSUFBZSxNQUFsQjtBQUNDLGFBQU8sT0FEUjtLQUFBLE1BQUE7QUFHQyxhQUFPLENBQUMsTUFBTSxDQUFDLE1BQVAsQ0FBYyxDQUFkLEVBQWlCLE1BQUEsR0FBTyxDQUFQLEdBQVMsQ0FBMUIsQ0FBRCxDQUFBLEdBQWdDLEtBQWhDLEdBQXdDLENBQUMsTUFBTSxDQUFDLE1BQVAsQ0FBYyxNQUFNLENBQUMsTUFBUCxHQUFnQixDQUFDLE1BQUEsR0FBTyxDQUFQLEdBQVMsQ0FBVixDQUE5QixDQUFELEVBSGhEOztFQURZOztFQU1iLE1BQU0sQ0FBQyxPQUFQLEdBQ007SUFDUSxZQUFDLE1BQUQ7TUFDWixJQUFDLENBQUEsT0FBRCxHQUFXLElBQUk7TUFDZixJQUFDLENBQUEsTUFBRCxHQUFVO01BRVYsSUFBQyxDQUFBLFFBQUQsR0FBWTtNQUNaLElBQUMsQ0FBQSxVQUFELEdBQWM7TUFDZCxJQUFDLENBQUEsS0FBRCxHQUFTO01BQ1QsSUFBQyxDQUFBLFdBQUQsR0FBZTtNQUNmLElBQUMsQ0FBQSxXQUFELEdBQWU7TUFDZixJQUFDLENBQUEsWUFBRCxHQUFnQjtNQUNoQixJQUFDLENBQUEsU0FBRCxHQUFhO01BQ2IsSUFBQyxDQUFBLGFBQUQsR0FBaUI7TUFDakIsSUFBQyxDQUFBLFlBQUQsR0FBZ0I7TUFDaEIsSUFBQyxDQUFBLE9BQUQsR0FBVztNQUNYLElBQUMsQ0FBQSxTQUFELEdBQWE7TUFDYixJQUFDLENBQUEsV0FBRCxHQUFlO01BQ2YsSUFBQyxDQUFBLFNB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YixJQUFDLENBQUEsU0FBRCxHQUFhO01BQ2IsSUFBQyxDQUFBLE9BQU8sQ0FBQyxJQUFULENBQWMsY0FBZCxFQUE4QixHQUE5QjtNQUNBLElBQUcsQ0FBQyxHQUFKO2VBQ0MsSUFBQyxDQUFBLFVBQUQsQ0FBQSxFQUREOztJQUhhOzs7OztBQTFQZiIsInNvdXJjZXNDb250ZW50IjpbIntFbWl0dGVyLCBGaWxlfSA9IHJlcXVpcmUgJ2F0b20nXG5cbnRyaW1TdHJpbmcgPSAoc3RyaW5nLCBsZW5ndGgpIC0+XG5cdGlmIHN0cmluZy5sZW5ndGg8PWxlbmd0aFxuXHRcdHJldHVybiBzdHJpbmdcblx0ZWxzZVxuXHRcdHJldHVybiAoc3RyaW5nLnN1YnN0ciAwLCBsZW5ndGgvMi0xKSArICcuLi4nICsgKHN0cmluZy5zdWJzdHIgc3RyaW5nLmxlbmd0aCAtIChsZW5ndGgvMi0yKSlcblxubW9kdWxlLmV4cG9ydHMgPVxuY2xhc3MgVWlcblx0Y29uc3RydWN0b3I6IChidWdnZXIpIC0+XG5cdFx0QGVtaXR0ZXIgPSBuZXcgRW1pdHRlclxuXHRcdEBidWdnZXIgPSBidWdnZXJcblxuXHRcdEBpc1BhdXNlZCA9IGZhbHNlXG5cdFx0QGlzU3RlcHBpbmcgPSBmYWxzZVxuXHRcdEBzdGFjayA9IFtdXG5cdFx0QGN1cnJlbnRQYXRoID0gbnVsbFxuXHRcdEBjdXJyZW50TGluZSA9IDBcblx0XHRAY3VycmVudEZyYW1lID0gMFxuXHRcdEB2YXJpYWJsZXMgPSBbXVxuXHRcdEBsYXN0VmFyaWFibGVzID0ge31cblx0XHRAbGFzdFBvc2l0aW9uID0ge31cblx0XHRAbWFya2VycyA9IFtdXG5cdFx0QG9wZW5GaWxlcyA9IHt9XG5cdFx0QGhpbnRNYXJrZXJzID0ge31cblx0XHRAc2hvd0hpbnRzID0gdHJ1ZVxuXG5cdFx0YXRvbS53b3Jrc3BhY2Uub2JzZXJ2ZVRleHRFZGl0b3JzIChlZGl0b3IpID0+XG5cdFx0XHRAYWRkRWRpdG9yTWFya2VycyBlZGl0b3JcblxuXHRzZXJpYWxpemU6IC0+XG5cblx0Y2xlYXI6IC0+XG5cdFx0I1RPRE9cblxuXHRzZXRMb2NhdGlvbjogKGZpbGVuYW1lLCBsaW5lTnVtYmVyKSAtPlxuXHRcdGlmICFmaWxlbmFtZSB0aGVuIHJldHVyblxuXG5cdFx0ZmlsZSA9IG5ldyBGaWxlIGZpbGVuYW1lXG5cblx0XHRmaWxlLmV4aXN0cygpXG5cdFx0XHQudGhlbiAoZXhpc3RzKSA9PlxuXHRcdFx0XHRpZiBleGlzdHNcblx0XHRcdFx0XHRhdG9tLndvcmtzcGFjZS5vcGVuIGZpbGVuYW1lLFxuXHRcdFx0XHRcdFx0aW5pdGlhbExpbmU6IGxpbmVOdW1iZXItMVxuXHRcdFx0XHRcdFx0cGVuZGluZzogdHJ1ZVxuXHRcdFx0XHRcdFx0c2VhcmNoQWxsUGFuZXM6IHRydWVcblx0XHRcdFx0XHQudGhlbiAodGV4dEVkaXRvcikgPT5cblx0XHRcdFx0XHRcdEBvcGVuRmlsZXNbZmlsZW5hbWVdID0gdGV4dEVkaXRvclxuXHRcdFx0XHRcdFx0dGV4dEVkaXRvci5vbkRpZERlc3Ryb3kgPT5cblx0XHRcdFx0XHRcdFx0ZGVsZXRlIEBvcGVuRmlsZXNbZmlsZW5hbWVdXG5cblx0c2V0U3RhY2s6IChzdGFjaykgLT5cblx0XHRAc3RhY2sgPSBzdGFja1xuXHRcdEBidWdnZXIuc3RhY2tMaXN0LnVwZGF0ZVN0YWNrIEBzdGFja1xuXG5cdFx0QGNsZWFyRWRpdG9yTWFya2VycygpXG5cdFx0Zm9yIGVkaXRvciBpbiBhdG9tLndvcmtzcGFjZS5nZXRUZXh0RWRpdG9ycygpXG5cdFx0XHRAYWRkRWRpdG9yTWFya2VycyBlZGl0b3JcblxuXHRcdGlmIHN0YWNrLmxlbmd0aD4wXG5cdFx0XHRAc2V0RnJhbWUgQHN0YWNrLmxlbmd0aCAtIDFcblxuXHRzZXRWYXJpYWJsZXM6ICh2YXJpYWJsZXMpIC0+XG5cdFx0QHZhcmlhYmxlcyA9IHZhcmlhYmxlc1xuXG5cdFx0aWYgQGN1cnJlbnRQYXRoXG5cdFx0XHRsYXN0VmFyaWFibGVzID0gQGxhc3RWYXJpYWJsZXNbQGN1cnJlbnRQYXRoXVxuXHRcdFx0bGFzdFBvc2l0aW9uID0gQGxhc3RQb3NpdGlvbltAY3VycmVudFBhdGhdXG5cdFx0XHRpZiAhbGFzdFZhcmlhYmxlc1xuXHRcdFx0XHRsYXN0VmFyaWFibGVzID0gQGxhc3RWYXJpYWJsZXNbQGN1cnJlbnRQYXRoXSA9IHt9XG5cblx0XHRcdHVwZGF0ZU1lc3NhZ2VzID0gW11cblxuXHRcdFx0Zm9yIHZhcmlhYmxlIGluIHZhcmlhYmxlc1xuXHRcdFx0XHRpZiBAaXNTdGVwcGluZ1xuXHRcdFx0XHRcdG9sZCA9IGxhc3RWYXJpYWJsZXNbdmFyaWFibGUubmFtZV1cblx0XHRcdFx0XHRpZiB2YXJpYWJsZS52YWx1ZSAmJiAoIW9sZCB8fCBvbGQudmFsdWUhPXZhcmlhYmxlLnZhbHVlKVxuXHRcdFx0XHRcdFx0IyB1cGRhdGVNZXNzYWdlcy5wdXNoIHZhcmlhYmxlLm5hbWUrJyA9ICcrdmFyaWFibGUudmFsdWVcblx0XHRcdFx0XHRcdHVwZGF0ZU1lc3NhZ2VzLnB1c2ggdmFyaWFibGUubmFtZSsnID0gJyt0cmltU3RyaW5nICh2YXJpYWJsZS52YWx1ZS5yZXBsYWNlIC9cXHMqW1xcclxcbl1cXHMqL2csICcgJyksIDQ4XG5cblx0XHRcdFx0bGFzdFZhcmlhYmxlc1t2YXJpYWJsZS5uYW1lXSA9IHZhcmlhYmxlXG5cblx0XHRcdGlmIEBpc1N0ZXBwaW5nICYmIHVwZGF0ZU1lc3NhZ2VzLmxlbmd0aFxuXHRcdFx0XHRpZiAhbGFzdFBvc2l0aW9uXG5cdFx0XHRcdFx0QHNldEhpbnQgQGN1cnJlbnRQYXRoLCBAY3VycmVudExpbmUsIHVwZGF0ZU1lc3NhZ2VzLmpvaW4gJ1xcbidcblxuXHRcdFx0XHRlbHNlIGlmIEBjdXJyZW50RnJhbWUgIT0gbGFzdFBvc2l0aW9uLmZyYW1lXG5cdFx0XHRcdFx0IyBpZiB3ZSd2ZSBlbnRlcmVkIGEgbmV3IHNjb3BlIChwcmVzdW1hYmx5IGVpdGhlciBlbnRlcmluZyBhIG5ldywgb3IgcmV0dXJuaW5nIGZyb20gYW4gb2xkIGZ1bmN0aW9uKS4gUGxhY2UgYW55IG5ldyB2YXJpYWJsZXMganVzdCBhYm92ZSB0aGUgY3VycmVudCBwb3NpdGlvbiwgbm90IGF0IHRoZSBwcmV2aW91cyBzY29wZVxuXHRcdFx0XHRcdEBzZXRIaW50IEBjdXJyZW50UGF0aCwgKE1hdGgubWF4IEBjdXJyZW50TGluZS0xLCAxKSwgdXBkYXRlTWVzc2FnZXMuam9pbiAnXFxuJ1xuXG5cdFx0XHRcdGVsc2Vcblx0XHRcdFx0XHRAc2V0SGludCBAY3VycmVudFBhdGgsIGxhc3RQb3NpdGlvbi5saW5lLCB1cGRhdGVNZXNzYWdlcy5qb2luICdcXG4nXG5cblx0XHRAYnVnZ2VyLnZhcmlhYmxlTGlzdC51cGRhdGVWYXJpYWJsZXMgQHZhcmlhYmxlc1xuXG5cdHNldEZyYW1lOiAoaW5kZXgpIC0+XG5cdFx0QGJ1Z2dlci5zdGFja0xpc3Quc2V0RnJhbWUgaW5kZXhcblx0XHRmcmFtZSA9IEBzdGFja1tpbmRleF1cblx0XHRpZiAhZnJhbWUubG9jYWxcblx0XHRcdEBidWdnZXIuc3RhY2tMaXN0LnNldFNob3dTeXN0ZW1TdGFjayB0cnVlXG5cblx0XHRpZiBmcmFtZS5maWxlICE9IEBjdXJyZW50UGF0aCB8fCBmcmFtZS5saW5lICE9IEBjdXJyZW50TGluZVxuXHRcdFx0QGxhc3RQb3NpdGlvbltAY3VycmVudFBhdGhdID1cblx0XHRcdFx0bGluZTogQGN1cnJlbnRMaW5lXG5cdFx0XHRcdGZyYW1lOiBAY3VycmVudEZyYW1lXG5cblx0XHRAY3VycmVudFBhdGggPSBmcmFtZS5maWxlXG5cdFx0QGN1cnJlbnRMaW5lID0gZnJhbWUubGluZVxuXHRcdEBjdXJyZW50RnJhbWUgPSBpbmRleFxuXG5cdFx0QGJ1Z2dlci50b29sYmFyLnVwZGF0ZUJ1dHRvbnMoKVxuXHRcdEBzZXRMb2NhdGlvbiBmcmFtZS5maWxlLCBmcmFtZS5saW5lXG5cblx0Y2xlYXJFZGl0b3JNYXJrZXJzOiAtPlxuXHRcdGZvciBtYXJrZXIgaW4gQG1hcmtlcnNcblx0XHRcdG1hcmtlci5kZXN0cm95KClcblx0XHRAbWFya2VycyA9IFtdXG5cblx0c2V0SGludDogKGZpbGVuYW1lLCBsaW5lTnVtYmVyLCBpbmZvKSAtPlxuXHRcdGlmICFAc2hvd0hpbnRzIHRoZW4gcmV0dXJuXG5cblx0XHR0ZXh0RWRpdG9yID0gQG9wZW5GaWxlc1tmaWxlbmFtZV1cblx0XHRpZiAhdGV4dEVkaXRvciB0aGVuIHJldHVyblxuXG5cdFx0bG9vcFxuXHRcdFx0bGluZSA9ICh0ZXh0RWRpdG9yLmxpbmVUZXh0Rm9yQnVmZmVyUm93IGxpbmVOdW1iZXItMSl8fCcnXG5cblx0XHRcdCMgZ28gdXAgYSBsaW5lIGlmIHRoZSBjdXJyZW50IGlzIGVtcHR5XG5cdFx0XHRpZiBsaW5lTnVtYmVyID4gMSAmJiAvXlxccyokLy50ZXN0IGxpbmVcblx0XHRcdFx0bGluZU51bWJlci0tXG5cdFx0XHRcdGNvbnRpbnVlXG5cdFx0XHRlbHNlXG5cdFx0XHRcdGJyZWFrXG5cblx0XHRsaW5lV2lkdGggPSBsaW5lLmxlbmd0aFxuXG5cdFx0bGluZUluZGVudCA9IHRleHRFZGl0b3IuaW5kZW50YXRpb25Gb3JCdWZmZXJSb3cgbGluZU51bWJlci0xXG5cdFx0bGluZU1hcmtlciA9IHRleHRFZGl0b3IubWFya0J1ZmZlclJhbmdlIFtbbGluZU51bWJlci0xLCBsaW5lSW5kZW50XSwgW2xpbmVOdW1iZXItMSwgbGluZVdpZHRoXV1cblxuXHRcdG1hcmtlck9iamVjdCA9XG5cdFx0XHRtYXJrZXI6IGxpbmVNYXJrZXJcblx0XHRcdGRlY29yYXRpb246IG51bGxcblx0XHRcdGVsZW1lbnQ6IG51bGxcblxuXHRcdGhhc2ggPSBmaWxlbmFtZSsnLScrbGluZU51bWJlclxuXHRcdEBoaW50TWFya2Vyc1toYXNoXT8ubWFya2VyLmRlc3Ryb3koKVxuXHRcdEBoaW50TWFya2Vyc1toYXNoXSA9IG1hcmtlck9iamVjdFxuXG5cdFx0aWYgZmFsc2Vcblx0XHRcdG1hcmtlck9iamVjdC5lbGVtZW50ID0gZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgJ2Rpdidcblx0XHRcdGVsZW1lbnQuY2xhc3NMaXN0LmFkZCAnZGVidWctaGludC1vdmVybGF5J1xuXHRcdFx0ZWxlbWVudC5jbGFzc0xpc3QuYWRkICdpbmxpbmUnXG5cdFx0XHRlbGVtZW50LmNsYXNzTGlzdC50b2dnbGUgJ2hpZGRlbicsICFAc2hvd0hpbnRzXG5cblx0XHRcdGZvciBsaW5lIGluIGluZm8uc3BsaXQgJ1xcbidcblx0XHRcdFx0ZWxlbWVudC5hcHBlbmQgZG9jdW1lbnQuY3JlYXRlRWxlbWVudCAnYnInXG5cdFx0XHRcdGVsZW1lbnQuYXBwZW5kIGRvY3VtZW50LmNyZWF0ZVRleHROb2RlIGxpbmVcblx0XHRcdGVsZW1lbnQucmVtb3ZlQ2hpbGQgZWxlbWVudC5jaGlsZHJlblswXVxuXHRcdFx0IyBlbGVtZW50LnRleHRDb250ZW50ID0gaW5mb1xuXG5cdFx0XHRhdG9tLmNvbmZpZy5vYnNlcnZlICdlZGl0b3IubGluZUhlaWdodCcsIChoKSAtPlxuXHRcdFx0XHRlbGVtZW50LnN0eWxlLnRvcCA9IC1oKydlbSdcblx0XHRcdFx0ZWxlbWVudC5zdHlsZS5oZWlnaHQgPSBoKydlbSdcblxuXHRcdFx0bWFya2VyT2JqZWN0LmRlY29yYXRpb24gPSB0ZXh0RWRpdG9yLmRlY29yYXRlTWFya2VyIGxpbmVNYXJrZXIsXG5cdFx0XHRcdHR5cGU6ICdvdmVybGF5J1xuXHRcdFx0XHRpdGVtOiBlbGVtZW50XG5cblx0XHRlbHNlXG5cdFx0XHRtYXJrZXJPYmplY3QuZWxlbWVudCA9IGVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50ICdkaXYnXG5cdFx0XHRlbGVtZW50LmNsYXNzTGlzdC5hZGQgJ2RlYnVnLWhpbnQtYmxvY2snXG5cdFx0XHRlbGVtZW50LmNsYXNzTGlzdC50b2dnbGUgJ2hpZGRlbicsICFAc2hvd0hpbnRzXG5cblx0XHRcdGluZGVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgJ2Rpdidcblx0XHRcdGluZGVudC5jbGFzc0xpc3QuYWRkICdpbmRlbnQnXG5cdFx0XHRhdG9tLmNvbmZpZy5vYnNlcnZlICdlZGl0b3IudGFiTGVuZ3RoJywgKHcpIC0+XG5cdFx0XHRcdGluZGVudC50ZXh0Q29udGVudCA9IEFycmF5KGxpbmVJbmRlbnQqdyArIDEpLmpvaW4oJyAnKTtcblx0XHRcdGVsZW1lbnQuYXBwZW5kQ2hpbGQgaW5kZW50XG5cblx0XHRcdGNvbnRlbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50ICdkaXYnXG5cdFx0XHRjb250ZW50LmNsYXNzTGlzdC5hZGQgJ2NvbnRlbnQnXG5cdFx0XHRmb3IgbGluZSBpbiBpbmZvLnNwbGl0ICdcXG4nXG5cdFx0XHRcdGNvbnRlbnQuYXBwZW5kQ2hpbGQgZG9jdW1lbnQuY3JlYXRlRWxlbWVudCAnYnInXG5cdFx0XHRcdGNvbnRlbnQuYXBwZW5kQ2hpbGQgZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUgbGluZVxuXHRcdFx0Y29udGVudC5yZW1vdmVDaGlsZCBjb250ZW50LmNoaWxkcmVuWzBdXG5cdFx0XHQjIGVsZW1lbnQudGV4dENvbnRlbnQgPSBpbmZvXG5cblx0XHRcdGVsZW1lbnQuYXBwZW5kQ2hpbGQgY29udGVudFxuXG5cdFx0XHRtYXJrZXJPYmplY3QuZGVjb3JhdGlvbiA9IHRleHRFZGl0b3IuZGVjb3JhdGVNYXJrZXIgbGluZU1hcmtlcixcblx0XHRcdFx0dHlwZTogJ2Jsb2NrJ1xuXHRcdFx0XHRwb3NpdGlvbjogJ2FmdGVyJ1xuXHRcdFx0XHRpdGVtOiBlbGVtZW50XG5cblx0Y2xlYXJIaW50czogLT5cblx0XHRmb3IgaGFzaCxtYXJrZXIgb2YgQGhpbnRNYXJrZXJzXG5cdFx0XHRtYXJrZXIubWFya2VyLmRlc3Ryb3koKVxuXHRcdEBoaW50TWFya2VycyA9IHt9XG5cblx0Y2xlYXJBbGw6IC0+XG5cdFx0QGN1cnJlbnRQYXRoID0gbnVsbFxuXHRcdEBjdXJyZW50TGluZSA9IDBcblx0XHRAdmFyaWFibGVzID0gW11cblx0XHRAbGFzdFZhcmlhYmxlcyA9IHt9XG5cdFx0QGxhc3RQb3NpdGlvbnMgPSB7fVxuXHRcdEBpc1BhdXNlZCA9IGZhbHNlXG5cdFx0QGlzU3RlcHBpbmcgPSBmYWxzZVxuXHRcdEBjbGVhckhpbnRzKClcblx0XHRAY2xlYXJFZGl0b3JNYXJrZXJzKClcblx0XHRAc2V0U3RhY2sgW11cblx0XHRAc2V0VmFyaWFibGVzIFtdXG5cblx0YWRkRWRpdG9yTWFya2VyczogKHRleHRFZGl0b3IpIC0+XG5cdFx0cGF0aCA9IHRleHRFZGl0b3IuZ2V0UGF0aCgpXG5cdFx0Zm9yIGZyYW1lIGluIEBzdGFja1xuXHRcdFx0aWYgZnJhbWUuZmlsZSA9PSBwYXRoXG5cdFx0XHRcdEBtYXJrZXJzLnB1c2ggbGluZU1hcmtlciA9IHRleHRFZGl0b3IubWFya0J1ZmZlclJhbmdlIFtbZnJhbWUubGluZS0xLCAwXSwgW2ZyYW1lLmxpbmUtMSwgMF1dXG5cdFx0XHRcdF9jbGFzcyA9IGlmIGZyYW1lLmVycm9yIHRoZW4gJ2RlYnVnLXBvc2l0aW9uLWVycm9yJyBlbHNlICdkZWJ1Zy1wb3NpdGlvbidcblx0XHRcdFx0dGV4dEVkaXRvci5kZWNvcmF0ZU1hcmtlciBsaW5lTWFya2VyLFxuXHRcdFx0XHRcdHR5cGU6ICdsaW5lLW51bWJlcidcblx0XHRcdFx0XHRjbGFzczogX2NsYXNzXG5cdFx0XHRcdHRleHRFZGl0b3IuZGVjb3JhdGVNYXJrZXIgbGluZU1hcmtlcixcblx0XHRcdFx0XHR0eXBlOiAnbGluZSdcblx0XHRcdFx0XHRjbGFzczogX2NsYXNzXG5cblx0cnVubmluZzogLT5cblx0XHRAaXNQYXVzZWQgPSBmYWxzZVxuXHRcdEBzZXRTdGFjayBbXVxuXHRcdEBzZXRWYXJpYWJsZXMgW11cblx0XHRAYnVnZ2VyLnRvb2xiYXIudXBkYXRlQnV0dG9ucygpXG5cblx0cGF1c2VkOiAtPlxuXHRcdGN1cnJlbnRXaW5kb3cgPSAocmVxdWlyZSAnZWxlY3Ryb24nKS5yZW1vdGUuZ2V0Q3VycmVudFdpbmRvdygpXG5cdFx0Y3VycmVudFdpbmRvdy5mb2N1cygpO1xuXG5cdFx0QGlzUGF1c2VkID0gdHJ1ZVxuXHRcdEBidWdnZXIudG9vbGJhci51cGRhdGVCdXR0b25zKClcblxuXHRzdG9wOiAtPlxuXHRcdEBpc1N0ZXBwaW5nID0gZmFsc2Vcblx0XHRAYnVnZ2VyLnN0b3AoKVxuXG5cdHNob3dXYXJuaW5nOiAobWVzc2FnZSkgLT5cblx0XHRhdG9tLm5vdGlmaWNhdGlvbnMuYWRkV2FybmluZyBtZXNzYWdlLCB7ZGlzbWlzc2FibGU6IHRydWV9XG5cblx0c2hvd0Vycm9yOiAobWVzc2FnZSkgLT5cblx0XHRhdG9tLm5vdGlmaWNhdGlvbnMuYWRkRXJyb3IgbWVzc2FnZSwge2Rpc21pc3NhYmxlOiB0cnVlfVxuXG5cdHNldFNob3dIaW50czogKHNldCkgLT5cblx0XHRAc2hvd0hpbnRzID0gc2V0XG5cdFx0QGVtaXR0ZXIuZW1pdCAnc2V0U2hvd0hpbnRzJywgc2V0XG5cdFx0aWYgIXNldFxuXHRcdFx0QGNsZWFySGludHMoKVxuXG5cdFx0IyBmb3IgaGFzaCwgbWFya2VyIG9mIEBoaW50TWFya2Vyc1xuXHRcdCMgXHRtYXJrZXIuZWxlbWVudC5jbGFzc0xpc3QudG9nZ2xlICdoaWRkZW4nLCAhc2V0XG4iXX0=
