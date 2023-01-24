(function() {
  var CustomPanel, Emitter, path;

  path = require('path');

  Emitter = require('atom').Emitter;

  module.exports = CustomPanel = (function() {
    var bugger;

    bugger = null;

    function CustomPanel(bugger) {
      this.emitter = new Emitter();
      this.bugger = bugger;
      this.content();
    }

    CustomPanel.prototype.content = function() {
      var argsGroup, bgroup, body, closeButton, cwdButton, cwdGroup, div, fileGroup, header, inputBody, label, name, pathButton, ref, ref1, ref2, saveButton, section, startButton, value;
      this.element = document.createElement('div');
      this.element.setAttribute("tabIndex", -1);
      this.element.classList.add('debug-custom-panel');
      header = document.createElement('div');
      header.classList.add('panel-heading');
      header.textContent = "Configure Debug Session";
      this.element.appendChild(header);
      closeButton = document.createElement('button');
      closeButton.classList.add('btn', 'action-close', 'icon', 'icon-remove-close');
      header.appendChild(closeButton);
      closeButton.addEventListener('click', (function(_this) {
        return function() {
          return _this.emitter.emit('close');
        };
      })(this));
      div = document.createElement('div');
      div.classList.add('input-block-item', 'labeled-block');
      label = document.createElement('label');
      label.textContent = 'Debugger:';
      div.appendChild(label);
      this.debuggerList = document.createElement('select');
      this.debuggerList.classList.add('input-select', 'input-select-item');
      this.element.appendChild(div);
      div.appendChild(this.debuggerList);
      body = document.createElement('div');
      body.classList.add('body');
      inputBody = document.createElement('div');
      inputBody.classList.add('input-inline-block');
      body.appendChild(inputBody);
      section = document.createElement('section');
      section.classList.add('input-block');
      fileGroup = document.createElement('div');
      fileGroup.classList.add('input-block-item', 'input-block-item--flex', 'editor-container');
      inputBody.appendChild(section);
      section.appendChild(fileGroup);
      this.pathInput = document.createElement('atom-text-editor');
      ref = {
        "mini": true,
        "placeholder-text": "Path to the file to debug"
      };
      for (name in ref) {
        value = ref[name];
        this.pathInput.setAttribute(name, value);
      }
      this.pathInput.type = "text";
      fileGroup.appendChild(this.pathInput);
      div = document.createElement('div');
      div.classList.add('input-block-item');
      bgroup = document.createElement('div');
      bgroup.classList.add('btn-group');
      pathButton = document.createElement('button');
      pathButton.classList.add('btn-item', 'btn', 'icon', 'icon-file-binary');
      pathButton.textContent = "Choose File";
      pathButton.addEventListener('click', (function(_this) {
        return function() {
          return _this.pickFile();
        };
      })(this));
      section.appendChild(div);
      div.appendChild(bgroup);
      bgroup.appendChild(pathButton);
      section = document.createElement('section');
      section.classList.add('input-block');
      argsGroup = document.createElement('div');
      argsGroup.classList.add('input-block-item', 'input-block-item--flex', 'editor-container');
      inputBody.appendChild(section);
      section.appendChild(argsGroup);
      this.argsInput = document.createElement('atom-text-editor');
      ref1 = {
        "mini": true,
        "placeholder-text": "Optional: Arguments to pass to the file being debugged"
      };
      for (name in ref1) {
        value = ref1[name];
        this.argsInput.setAttribute(name, value);
      }
      this.argsInput.type = "text";
      argsGroup.appendChild(this.argsInput);
      section = document.createElement('section');
      section.classList.add('input-block');
      cwdGroup = document.createElement('div');
      cwdGroup.classList.add('input-block-item', 'input-block-item--flex', 'editor-container');
      inputBody.appendChild(section);
      section.appendChild(cwdGroup);
      this.cwdInput = document.createElement('atom-text-editor');
      ref2 = {
        "mini": true,
        "placeholder-text": "Optional: Working directory to use when debugging"
      };
      for (name in ref2) {
        value = ref2[name];
        this.cwdInput.setAttribute(name, value);
      }
      this.cwdInput.type = "text";
      cwdGroup.appendChild(this.cwdInput);
      div = document.createElement('div');
      div.classList.add('input-block-item');
      bgroup = document.createElement('div');
      bgroup.classList.add('btn-group');
      cwdButton = document.createElement('button');
      cwdButton.classList.add('btn-item', 'btn', 'icon', 'icon-file-directory');
      cwdButton.textContent = "Choose Directory";
      cwdButton.addEventListener('click', (function(_this) {
        return function() {
          return _this.pickCwd();
        };
      })(this));
      section.appendChild(div);
      div.appendChild(bgroup);
      bgroup.appendChild(cwdButton);
      div = document.createElement('div');
      div.classList.add('inline-block-start');
      body.appendChild(div);
      this.element.appendChild(body);
      startButton = document.createElement('button');
      startButton.classList.add('btn', 'btn-lg', 'btn-primary', 'icon', 'icon-chevron-right');
      startButton.textContent = "Debug";
      startButton.addEventListener('click', (function(_this) {
        return function() {
          return _this.startDebugging();
        };
      })(this));
      div.appendChild(startButton);
      saveButton = document.createElement('button');
      saveButton.classList.add('btn', 'btn-primary', 'icon', 'icon-file-add');
      saveButton.textContent = "Save";
      saveButton.addEventListener('click', (function(_this) {
        return function() {
          return _this.saveOptions();
        };
      })(this));
      div.appendChild(saveButton);
      return this.updateDebuggers();
    };

    CustomPanel.prototype.pickFile = function() {
      var dialog, file, openOptions, parentWindow;
      openOptions = {
        properties: ['openFile', 'createDirectory'],
        title: 'Select File'
      };
      parentWindow = process.platform === 'darwin' ? null : require('electron').remote.getCurrentWindow();
      dialog = require('electron').remote.dialog;
      file = dialog.showOpenDialog(parentWindow, openOptions);
      if (file != null) {
        return this.pathInput.getModel().buffer.setText(file[0]);
      }
    };

    CustomPanel.prototype.pickCwd = function() {
      var dialog, folder, openOptions, parentWindow;
      openOptions = {
        properties: ['openDirectory', 'createDirectory'],
        title: 'Select Folder'
      };
      parentWindow = process.platform === 'darwin' ? null : require('electron').remote.getCurrentWindow();
      dialog = require('electron').remote.dialog;
      folder = dialog.showOpenDialog(parentWindow, openOptions);
      if (folder != null) {
        return this.cwdInput.getModel().buffer.setText(folder[0]);
      }
    };

    CustomPanel.prototype.setOptions = function(options) {
      var i, len, option, ref;
      if (options["debugger"]) {
        ref = this.debuggerList.children;
        for (i = 0, len = ref.length; i < len; i++) {
          option = ref[i];
          if (option.value === options["debugger"]) {
            option.selected = true;
            break;
          }
        }
      }
      if (options.path) {
        this.pathInput.getModel().setText(options.path);
      }
      if (options.cwd) {
        this.cwdInput.getModel().setText(options.cwd);
      }
      if (options.args) {
        return this.argsInput.getModel().setText(options.args.join(' '));
      }
    };

    CustomPanel.prototype.getOptions = function() {
      var args;
      return {
        "debugger": this.debuggerList.value || null,
        path: this.pathInput.getModel().getText() || null,
        args: (args = this.argsInput.getModel().getText()) ? [args] : [],
        cwd: this.cwdInput.getModel().getText() || null
      };
    };

    CustomPanel.prototype.updateDebuggers = function() {
      var i, len, option, ref, results, selected;
      selected = null;
      while (this.debuggerList.firstChild) {
        if (selected === null && this.debuggerList.firstChild.selected) {
          selected = this.debuggerList.firstChild.value;
        }
        this.debuggerList.removeChild(this.debuggerList.firstChild);
      }
      option = document.createElement('option');
      option.textContent = 'automatic';
      option.value = '';
      option.selected = selected === option.value || selected === null;
      this.debuggerList.appendChild(option);
      ref = this.bugger.buggers;
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        bugger = ref[i];
        option = document.createElement('option');
        option.textContent = bugger.description || bugger.name;
        option.value = bugger.name;
        option.selected = selected === option.value;
        results.push(this.debuggerList.appendChild(option));
      }
      return results;
    };

    CustomPanel.prototype.startDebugging = function() {
      var options;
      options = this.getOptions();
      if (!options.path) {
        return;
      }
      this.emitter.emit('close');
      return this.bugger.debug(options);
    };

    CustomPanel.prototype.saveOptions = function() {
      var binding, options;
      options = this.getOptions();
      if (!options.path) {
        return;
      }
      this.emitter.emit('close');
      this.bugger.saveOptions(options);
      binding = atom.keymaps.findKeyBindings({
        command: 'dbg:pause-continue'
      });
      return atom.notifications.addSuccess('Debug configuration saved', {
        description: binding.length > 0 ? 'Press `' + binding[0].keystrokes + '` to start a new debug session and select' : void 0,
        dismissable: true
      });
    };

    CustomPanel.prototype.focus = function() {
      return this.pathInput.focus();
    };

    CustomPanel.prototype.destroy = function() {
      return this.element.remove();
    };

    CustomPanel.prototype.getElement = function() {
      return this.element;
    };

    return CustomPanel;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbGVhcm4vLmF0b20vcGFja2FnZXMvZGJnL2xpYi92aWV3L0N1c3RvbVBhbmVsLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUEsSUFBQSxHQUFPLE9BQUEsQ0FBUSxNQUFSOztFQUNOLFVBQVcsT0FBQSxDQUFRLE1BQVI7O0VBRVosTUFBTSxDQUFDLE9BQVAsR0FDTTtBQUNMLFFBQUE7O0lBQUEsTUFBQSxHQUFTOztJQUVJLHFCQUFDLE1BQUQ7TUFDWixJQUFDLENBQUEsT0FBRCxHQUFXLElBQUksT0FBSixDQUFBO01BQ1gsSUFBQyxDQUFBLE1BQUQsR0FBVTtNQUNWLElBQUMsQ0FBQSxPQUFELENBQUE7SUFIWTs7MEJBS2IsT0FBQSxHQUFTLFNBQUE7QUFDUixVQUFBO01BQUEsSUFBQyxDQUFBLE9BQUQsR0FBVyxRQUFRLENBQUMsYUFBVCxDQUF1QixLQUF2QjtNQUNYLElBQUMsQ0FBQSxPQUFPLENBQUMsWUFBVCxDQUFzQixVQUF0QixFQUFrQyxDQUFDLENBQW5DO01BQ0EsSUFBQyxDQUFBLE9BQU8sQ0FBQyxTQUFTLENBQUMsR0FBbkIsQ0FBdUIsb0JBQXZCO01BRUEsTUFBQSxHQUFTLFFBQVEsQ0FBQyxhQUFULENBQXVCLEtBQXZCO01BQ1QsTUFBTSxDQUFDLFNBQVMsQ0FBQyxHQUFqQixDQUFxQixlQUFyQjtNQUNBLE1BQU0sQ0FBQyxXQUFQLEdBQXFCO01BQ3JCLElBQUMsQ0FBQSxPQUFPLENBQUMsV0FBVCxDQUFxQixNQUFyQjtNQUVBLFdBQUEsR0FBYyxRQUFRLENBQUMsYUFBVCxDQUF1QixRQUF2QjtNQUNkLFdBQVcsQ0FBQyxTQUFTLENBQUMsR0FBdEIsQ0FBMEIsS0FBMUIsRUFBaUMsY0FBakMsRUFBaUQsTUFBakQsRUFBeUQsbUJBQXpEO01BQ0EsTUFBTSxDQUFDLFdBQVAsQ0FBbUIsV0FBbkI7TUFFQSxXQUFXLENBQUMsZ0JBQVosQ0FB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QUEsRUFBYSxJQURiO09BREQ7SUFYWTs7MEJBZWIsS0FBQSxHQUFPLFNBQUE7YUFDTixJQUFDLENBQUEsU0FBUyxDQUFDLEtBQVgsQ0FBQTtJQURNOzswQkFJUCxPQUFBLEdBQVMsU0FBQTthQUNSLElBQUMsQ0FBQSxPQUFPLENBQUMsTUFBVCxDQUFBO0lBRFE7OzBCQUdULFVBQUEsR0FBWSxTQUFBO2FBQ1gsSUFBQyxDQUFBO0lBRFU7Ozs7O0FBaFBiIiwic291cmNlc0NvbnRlbnQiOlsicGF0aCA9IHJlcXVpcmUgJ3BhdGgnXG57RW1pdHRlcn0gPSByZXF1aXJlICdhdG9tJ1xuXG5tb2R1bGUuZXhwb3J0cyA9XG5jbGFzcyBDdXN0b21QYW5lbFxuXHRidWdnZXIgPSBudWxsXG5cblx0Y29uc3RydWN0b3I6IChidWdnZXIpIC0+XG5cdFx0QGVtaXR0ZXIgPSBuZXcgRW1pdHRlcigpXG5cdFx0QGJ1Z2dlciA9IGJ1Z2dlclxuXHRcdEBjb250ZW50KClcblxuXHRjb250ZW50OiAtPlxuXHRcdEBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCAnZGl2J1xuXHRcdEBlbGVtZW50LnNldEF0dHJpYnV0ZSBcInRhYkluZGV4XCIsIC0xXG5cdFx0QGVsZW1lbnQuY2xhc3NMaXN0LmFkZCAnZGVidWctY3VzdG9tLXBhbmVsJ1xuXG5cdFx0aGVhZGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCAnZGl2J1xuXHRcdGhlYWRlci5jbGFzc0xpc3QuYWRkICdwYW5lbC1oZWFkaW5nJ1xuXHRcdGhlYWRlci50ZXh0Q29udGVudCA9IFwiQ29uZmlndXJlIERlYnVnIFNlc3Npb25cIlxuXHRcdEBlbGVtZW50LmFwcGVuZENoaWxkIGhlYWRlclxuXG5cdFx0Y2xvc2VCdXR0b24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50ICdidXR0b24nXG5cdFx0Y2xvc2VCdXR0b24uY2xhc3NMaXN0LmFkZCAnYnRuJywgJ2FjdGlvbi1jbG9zZScsICdpY29uJywgJ2ljb24tcmVtb3ZlLWNsb3NlJ1xuXHRcdGhlYWRlci5hcHBlbmRDaGlsZCBjbG9zZUJ1dHRvblxuXG5cdFx0Y2xvc2VCdXR0b24uYWRkRXZlbnRMaXN0ZW5lciAnY2xpY2snLCA9PlxuXHRcdFx0QGVtaXR0ZXIuZW1pdCAnY2xvc2UnXG5cblx0XHRkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50ICdkaXYnXG5cdFx0ZGl2LmNsYXNzTGlzdC5hZGQgJ2lucHV0LWJsb2NrLWl0ZW0nLCAnbGFiZWxlZC1ibG9jaydcblx0XHRsYWJlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgJ2xhYmVsJ1xuXHRcdGxhYmVsLnRleHRDb250ZW50ID0gJ0RlYnVnZ2VyOidcblx0XHRkaXYuYXBwZW5kQ2hpbGQgbGFiZWxcblxuXHRcdEBkZWJ1Z2dlckxpc3QgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50ICdzZWxlY3QnXG5cdFx0QGRlYnVnZ2VyTGlzdC5jbGFzc0xpc3QuYWRkICdpbnB1dC1zZWxlY3QnLCAnaW5wdXQtc2VsZWN0LWl0ZW0nXG5cdFx0QGVsZW1lbnQuYXBwZW5kQ2hpbGQgZGl2XG5cdFx0ZGl2LmFwcGVuZENoaWxkIEBkZWJ1Z2dlckxpc3RcblxuXHRcdGJvZHkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50ICdkaXYnXG5cdFx0Ym9keS5jbGFzc0xpc3QuYWRkICdib2R5J1xuXHRcdGlucHV0Qm9keSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgJ2Rpdidcblx0XHRpbnB1dEJvZHkuY2xhc3NMaXN0LmFkZCAnaW5wdXQtaW5saW5lLWJsb2NrJ1xuXHRcdGJvZHkuYXBwZW5kQ2hpbGQgaW5wdXRCb2R5XG5cblx0XHQjIGZpbGUgdG8gRGVidWdcblx0XHRzZWN0aW9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCAnc2VjdGlvbidcblx0XHRzZWN0aW9uLmNsYXNzTGlzdC5hZGQgJ2lucHV0LWJsb2NrJ1xuXHRcdGZpbGVHcm91cCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgJ2Rpdidcblx0XHRmaWxlR3JvdXAuY2xhc3NMaXN0LmFkZCAnaW5wdXQtYmxvY2staXRlbScsICdpbnB1dC1ibG9jay1pdGVtLS1mbGV4JywgJ2VkaXRvci1jb250YWluZXInXG5cdFx0aW5wdXRCb2R5LmFwcGVuZENoaWxkIHNlY3Rpb25cblx0XHRzZWN0aW9uLmFwcGVuZENoaWxkIGZpbGVHcm91cFxuXG5cdFx0QHBhdGhJbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgJ2F0b20tdGV4dC1lZGl0b3InXG5cdFx0QHBhdGhJbnB1dC5zZXRBdHRyaWJ1dGUobmFtZSwgdmFsdWUpIGZvciBuYW1lLCB2YWx1ZSBvZiB7XCJtaW5pXCI6IHRydWUsIFwicGxhY2Vob2xkZXItdGV4dFwiOiBcIlBhdGggdG8gdGhlIGZpbGUgdG8gZGVidWdcIn1cblx0XHRAcGF0aElucHV0LnR5cGUgPSBcInRleHRcIlxuXHRcdGZpbGVHcm91cC5hcHBlbmRDaGlsZCBAcGF0aElucHV0XG5cblx0XHRkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50ICdkaXYnXG5cdFx0ZGl2LmNsYXNzTGlzdC5hZGQgJ2lucHV0LWJsb2NrLWl0ZW0nXG5cdFx0Ymdyb3VwID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCAnZGl2J1xuXHRcdGJncm91cC5jbGFzc0xpc3QuYWRkICdidG4tZ3JvdXAnXG5cdFx0cGF0aEJ1dHRvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgJ2J1dHRvbidcblx0XHRwYXRoQnV0dG9uLmNsYXNzTGlzdC5hZGQgJ2J0bi1pdGVtJywgJ2J0bicsICdpY29uJywgJ2ljb24tZmlsZS1iaW5hcnknXG5cdFx0cGF0aEJ1dHRvbi50ZXh0Q29udGVudCA9IFwiQ2hvb3NlIEZpbGVcIlxuXHRcdHBhdGhCdXR0b24uYWRkRXZlbnRMaXN0ZW5lciAnY2xpY2snLCA9PiBAcGlja0ZpbGUoKVxuXHRcdHNlY3Rpb24uYXBwZW5kQ2hpbGQgZGl2XG5cdFx0ZGl2LmFwcGVuZENoaWxkIGJncm91cFxuXHRcdGJncm91cC5hcHBlbmRDaGlsZCBwYXRoQnV0dG9uXG5cblx0XHQjIGZpbGUgYXJnc1xuXHRcdHNlY3Rpb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50ICdzZWN0aW9uJ1xuXHRcdHNlY3Rpb24uY2xhc3NMaXN0LmFkZCAnaW5wdXQtYmxvY2snXG5cdFx0YXJnc0dyb3VwID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCAnZGl2J1xuXHRcdGFyZ3NHcm91cC5jbGFzc0xpc3QuYWRkICdpbnB1dC1ibG9jay1pdGVtJywgJ2lucHV0LWJsb2NrLWl0ZW0tLWZsZXgnLCAnZWRpdG9yLWNvbnRhaW5lcidcblx0XHRpbnB1dEJvZHkuYXBwZW5kQ2hpbGQgc2VjdGlvblxuXHRcdHNlY3Rpb24uYXBwZW5kQ2hpbGQgYXJnc0dyb3VwXG5cblx0XHRAYXJnc0lucHV0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCAnYXRvbS10ZXh0LWVkaXRvcidcblx0XHRAYXJnc0lucHV0LnNldEF0dHJpYnV0ZShuYW1lLCB2YWx1ZSkgZm9yIG5hbWUsIHZhbHVlIG9mIHtcIm1pbmlcIjogdHJ1ZSwgXCJwbGFjZWhvbGRlci10ZXh0XCI6IFwiT3B0aW9uYWw6IEFyZ3VtZW50cyB0byBwYXNzIHRvIHRoZSBmaWxlIGJlaW5nIGRlYnVnZ2VkXCJ9XG5cdFx0QGFyZ3NJbnB1dC50eXBlID0gXCJ0ZXh0XCJcblx0XHRhcmdzR3JvdXAuYXBwZW5kQ2hpbGQgQGFyZ3NJbnB1dFxuXG5cdFx0IyB3b3JraW5nIGRpcmVjdG9yeSBmb3IgZGVidWdnZXJcblx0XHRzZWN0aW9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCAnc2VjdGlvbidcblx0XHRzZWN0aW9uLmNsYXNzTGlzdC5hZGQgJ2lucHV0LWJsb2NrJ1xuXHRcdGN3ZEdyb3VwID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCAnZGl2J1xuXHRcdGN3ZEdyb3VwLmNsYXNzTGlzdC5hZGQgJ2lucHV0LWJsb2NrLWl0ZW0nLCAnaW5wdXQtYmxvY2staXRlbS0tZmxleCcsICdlZGl0b3ItY29udGFpbmVyJ1xuXHRcdGlucHV0Qm9keS5hcHBlbmRDaGlsZCBzZWN0aW9uXG5cdFx0c2VjdGlvbi5hcHBlbmRDaGlsZCBjd2RHcm91cFxuXG5cdFx0QGN3ZElucHV0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCAnYXRvbS10ZXh0LWVkaXRvcidcblx0XHRAY3dkSW5wdXQuc2V0QXR0cmlidXRlKG5hbWUsIHZhbHVlKSBmb3IgbmFtZSwgdmFsdWUgb2Yge1wibWluaVwiOiB0cnVlLCBcInBsYWNlaG9sZGVyLXRleHRcIjogXCJPcHRpb25hbDogV29ya2luZyBkaXJlY3RvcnkgdG8gdXNlIHdoZW4gZGVidWdnaW5nXCJ9XG5cdFx0QGN3ZElucHV0LnR5cGUgPSBcInRleHRcIlxuXHRcdGN3ZEdyb3VwLmFwcGVuZENoaWxkIEBjd2RJbnB1dFxuXG5cdFx0ZGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCAnZGl2J1xuXHRcdGRpdi5jbGFzc0xpc3QuYWRkICdpbnB1dC1ibG9jay1pdGVtJ1xuXHRcdGJncm91cCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgJ2Rpdidcblx0XHRiZ3JvdXAuY2xhc3NMaXN0LmFkZCAnYnRuLWdyb3VwJ1xuXHRcdGN3ZEJ1dHRvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgJ2J1dHRvbidcblx0XHRjd2RCdXR0b24uY2xhc3NMaXN0LmFkZCAnYnRuLWl0ZW0nLCAnYnRuJywgJ2ljb24nLCAnaWNvbi1maWxlLWRpcmVjdG9yeSdcblx0XHRjd2RCdXR0b24udGV4dENvbnRlbnQgPSBcIkNob29zZSBEaXJlY3RvcnlcIlxuXHRcdGN3ZEJ1dHRvbi5hZGRFdmVudExpc3RlbmVyICdjbGljaycsID0+IEBwaWNrQ3dkKClcblx0XHRzZWN0aW9uLmFwcGVuZENoaWxkIGRpdlxuXHRcdGRpdi5hcHBlbmRDaGlsZCBiZ3JvdXBcblx0XHRiZ3JvdXAuYXBwZW5kQ2hpbGQgY3dkQnV0dG9uXG5cblx0XHQjIFN0YXJ0IEJ1dHRvblxuXHRcdGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgJ2Rpdidcblx0XHRkaXYuY2xhc3NMaXN0LmFkZCAnaW5saW5lLWJsb2NrLXN0YXJ0J1xuXHRcdGJvZHkuYXBwZW5kQ2hpbGQgZGl2XG5cdFx0QGVsZW1lbnQuYXBwZW5kQ2hpbGQgYm9keVxuXG5cdFx0c3RhcnRCdXR0b24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50ICdidXR0b24nXG5cdFx0c3RhcnRCdXR0b24uY2xhc3NMaXN0LmFkZCAnYnRuJywgJ2J0bi1sZycsICdidG4tcHJpbWFyeScsICdpY29uJywgJ2ljb24tY2hldnJvbi1yaWdodCdcblx0XHRzdGFydEJ1dHRvbi50ZXh0Q29udGVudCA9IFwiRGVidWdcIlxuXHRcdHN0YXJ0QnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIgJ2NsaWNrJywgPT4gQHN0YXJ0RGVidWdnaW5nKClcblx0XHRkaXYuYXBwZW5kQ2hpbGQgc3RhcnRCdXR0b25cblxuXHRcdHNhdmVCdXR0b24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50ICdidXR0b24nXG5cdFx0c2F2ZUJ1dHRvbi5jbGFzc0xpc3QuYWRkICdidG4nLCAnYnRuLXByaW1hcnknLCAnaWNvbicsICdpY29uLWZpbGUtYWRkJ1xuXHRcdHNhdmVCdXR0b24udGV4dENvbnRlbnQgPSBcIlNhdmVcIlxuXHRcdHNhdmVCdXR0b24uYWRkRXZlbnRMaXN0ZW5lciAnY2xpY2snLCA9PiBAc2F2ZU9wdGlvbnMoKVxuXHRcdGRpdi5hcHBlbmRDaGlsZCBzYXZlQnV0dG9uXG5cblx0XHRAdXBkYXRlRGVidWdnZXJzKClcblxuXHRwaWNrRmlsZTogLT5cblx0XHRvcGVuT3B0aW9ucyA9XG5cdFx0XHRwcm9wZXJ0aWVzOiBbJ29wZW5GaWxlJywgJ2NyZWF0ZURpcmVjdG9yeSddXG5cdFx0XHR0aXRsZTogJ1NlbGVjdCBGaWxlJ1xuXG5cdFx0IyBTaG93IHRoZSBvcGVuIGRpYWxvZyBhcyBjaGlsZCB3aW5kb3cgb24gV2luZG93cyBhbmQgTGludXgsIGFuZCBhc1xuXHRcdCMgaW5kZXBlbmRlbnQgZGlhbG9nIG9uIG1hY09TLiBUaGlzIG1hdGNoZXMgbW9zdCBuYXRpdmUgYXBwcy5cblx0XHRwYXJlbnRXaW5kb3cgPVxuXHRcdFx0aWYgcHJvY2Vzcy5wbGF0Zm9ybSBpcyAnZGFyd2luJ1xuXHRcdFx0XHRudWxsXG5cdFx0XHRlbHNlXG5cdFx0XHRcdHJlcXVpcmUoJ2VsZWN0cm9uJykucmVtb3RlLmdldEN1cnJlbnRXaW5kb3coKVxuXG5cdFx0IyBGaWxlIGRpYWxvZyBkZWZhdWx0cyB0byBwcm9qZWN0IGRpcmVjdG9yeSBvZiBjdXJyZW50bHkgYWN0aXZlIGVkaXRvclxuXHRcdHtkaWFsb2d9ID0gcmVxdWlyZSgnZWxlY3Ryb24nKS5yZW1vdGVcblx0XHRmaWxlID0gZGlhbG9nLnNob3dPcGVuRGlhbG9nIHBhcmVudFdpbmRvdywgb3Blbk9wdGlvbnNcblx0XHRpZiBmaWxlP1xuXHRcdFx0QHBhdGhJbnB1dC5nZXRNb2RlbCgpLmJ1ZmZlci5zZXRUZXh0IGZpbGVbMF1cblxuXHRwaWNrQ3dkOiAtPlxuXHRcdG9wZW5PcHRpb25zID1cblx0XHRcdHByb3BlcnRpZXM6IFsnb3BlbkRpcmVjdG9yeScsICdjcmVhdGVEaXJlY3RvcnknXVxuXHRcdFx0dGl0bGU6ICdTZWxlY3QgRm9sZGVyJ1xuXG5cdFx0IyBTaG93IHRoZSBvcGVuIGRpYWxvZyBhcyBjaGlsZCB3aW5kb3cgb24gV2luZG93cyBhbmQgTGludXgsIGFuZCBhc1xuXHRcdCMgaW5kZXBlbmRlbnQgZGlhbG9nIG9uIG1hY09TLiBUaGlzIG1hdGNoZXMgbW9zdCBuYXRpdmUgYXBwcy5cblx0XHRwYXJlbnRXaW5kb3cgPVxuXHRcdFx0aWYgcHJvY2Vzcy5wbGF0Zm9ybSBpcyAnZGFyd2luJ1xuXHRcdFx0XHRudWxsXG5cdFx0XHRlbHNlXG5cdFx0XHRcdHJlcXVpcmUoJ2VsZWN0cm9uJykucmVtb3RlLmdldEN1cnJlbnRXaW5kb3coKVxuXG5cdFx0IyBGaWxlIGRpYWxvZyBkZWZhdWx0cyB0byBwcm9qZWN0IGRpcmVjdG9yeSBvZiBjdXJyZW50bHkgYWN0aXZlIGVkaXRvclxuXHRcdHtkaWFsb2d9ID0gcmVxdWlyZSgnZWxlY3Ryb24nKS5yZW1vdGVcblx0XHRmb2xkZXIgPSBkaWFsb2cuc2hvd09wZW5EaWFsb2cgcGFyZW50V2luZG93LCBvcGVuT3B0aW9uc1xuXHRcdGlmIGZvbGRlcj9cblx0XHRcdEBjd2RJbnB1dC5nZXRNb2RlbCgpLmJ1ZmZlci5zZXRUZXh0IGZvbGRlclswXVxuXG5cdHNldE9wdGlvbnM6IChvcHRpb25zKSAtPlxuXHRcdGlmIG9wdGlvbnMuZGVidWdnZXJcblx0XHRcdGZvciBvcHRpb24gaW4gQGRlYnVnZ2VyTGlzdC5jaGlsZHJlblxuXHRcdFx0XHRpZiBvcHRpb24udmFsdWUgPT0gb3B0aW9ucy5kZWJ1Z2dlclxuXHRcdFx0XHRcdG9wdGlvbi5zZWxlY3RlZCA9IHRydWVcblx0XHRcdFx0XHRicmVha1xuXG5cdFx0aWYgb3B0aW9ucy5wYXRoXG5cdFx0XHRAcGF0aElucHV0LmdldE1vZGVsKCkuc2V0VGV4dCBvcHRpb25zLnBhdGhcblxuXHRcdGlmIG9wdGlvbnMuY3dkXG5cdFx0XHRAY3dkSW5wdXQuZ2V0TW9kZWwoKS5zZXRUZXh0IG9wdGlvbnMuY3dkXG5cblx0XHRpZiBvcHRpb25zLmFyZ3Ncblx0XHRcdEBhcmdzSW5wdXQuZ2V0TW9kZWwoKS5zZXRUZXh0IG9wdGlvbnMuYXJncy5qb2luICcgJ1xuXG5cdGdldE9wdGlvbnM6IC0+XG5cdFx0ZGVidWdnZXIgOiBAZGVidWdnZXJMaXN0LnZhbHVlIG9yIG51bGwsXG5cdFx0cGF0aDogQHBhdGhJbnB1dC5nZXRNb2RlbCgpLmdldFRleHQoKSBvciBudWxsLFxuXHRcdGFyZ3MgOiBpZiBhcmdzID0gQGFyZ3NJbnB1dC5nZXRNb2RlbCgpLmdldFRleHQoKSB0aGVuIFthcmdzXSBlbHNlIFtdLCAjIFRPRE86IHBhcnNlIGludG8gYXJncz9cblx0XHRjd2QgOiBAY3dkSW5wdXQuZ2V0TW9kZWwoKS5nZXRUZXh0KCkgb3IgbnVsbFxuXG5cdHVwZGF0ZURlYnVnZ2VyczogLT5cblx0XHRzZWxlY3RlZCA9IG51bGxcblx0XHR3aGlsZSBAZGVidWdnZXJMaXN0LmZpcnN0Q2hpbGRcblx0XHRcdGlmIHNlbGVjdGVkPT1udWxsIGFuZCBAZGVidWdnZXJMaXN0LmZpcnN0Q2hpbGQuc2VsZWN0ZWRcblx0XHRcdFx0c2VsZWN0ZWQgPSBAZGVidWdnZXJMaXN0LmZpcnN0Q2hpbGQudmFsdWVcblx0XHRcdEBkZWJ1Z2dlckxpc3QucmVtb3ZlQ2hpbGQgQGRlYnVnZ2VyTGlzdC5maXJzdENoaWxkXG5cblx0XHRvcHRpb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50ICdvcHRpb24nXG5cdFx0b3B0aW9uLnRleHRDb250ZW50ID0gJ2F1dG9tYXRpYydcblx0XHRvcHRpb24udmFsdWUgPSAnJ1xuXHRcdG9wdGlvbi5zZWxlY3RlZCA9IHNlbGVjdGVkPT1vcHRpb24udmFsdWUgb3Igc2VsZWN0ZWQ9PW51bGxcblx0XHRAZGVidWdnZXJMaXN0LmFwcGVuZENoaWxkIG9wdGlvblxuXG5cdFx0Zm9yIGJ1Z2dlciBpbiBAYnVnZ2VyLmJ1Z2dlcnNcblx0XHRcdG9wdGlvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgJ29wdGlvbidcblx0XHRcdG9wdGlvbi50ZXh0Q29udGVudCA9IGJ1Z2dlci5kZXNjcmlwdGlvbiBvciBidWdnZXIubmFtZVxuXHRcdFx0b3B0aW9uLnZhbHVlID0gYnVnZ2VyLm5hbWVcblx0XHRcdG9wdGlvbi5zZWxlY3RlZCA9IHNlbGVjdGVkPT1vcHRpb24udmFsdWVcblx0XHRcdEBkZWJ1Z2dlckxpc3QuYXBwZW5kQ2hpbGQgb3B0aW9uXG5cblx0c3RhcnREZWJ1Z2dpbmc6IC0+XG5cdFx0b3B0aW9ucyA9IEBnZXRPcHRpb25zKClcblxuXHRcdGlmICFvcHRpb25zLnBhdGhcblx0XHRcdHJldHVyblxuXG5cdFx0QGVtaXR0ZXIuZW1pdCAnY2xvc2UnXG5cdFx0QGJ1Z2dlci5kZWJ1ZyBvcHRpb25zXG5cblx0c2F2ZU9wdGlvbnM6IC0+XG5cdFx0b3B0aW9ucyA9IEBnZXRPcHRpb25zKClcblxuXHRcdGlmICFvcHRpb25zLnBhdGhcblx0XHRcdHJldHVyblxuXG5cdFx0QGVtaXR0ZXIuZW1pdCAnY2xvc2UnXG5cdFx0QGJ1Z2dlci5zYXZlT3B0aW9ucyBvcHRpb25zXG5cblx0XHRiaW5kaW5nID0gYXRvbS5rZXltYXBzLmZpbmRLZXlCaW5kaW5ncyBjb21tYW5kOiAnZGJnOnBhdXNlLWNvbnRpbnVlJ1xuXG5cdFx0YXRvbS5ub3RpZmljYXRpb25zLmFkZFN1Y2Nlc3MgJ0RlYnVnIGNvbmZpZ3VyYXRpb24gc2F2ZWQnLFxuXHRcdFx0ZGVzY3JpcHRpb246IGlmIGJpbmRpbmcubGVuZ3RoID4gMCB0aGVuICdQcmVzcyBgJyArIGJpbmRpbmdbMF0ua2V5c3Ryb2tlcyArICdgIHRvIHN0YXJ0IGEgbmV3IGRlYnVnIHNlc3Npb24gYW5kIHNlbGVjdCcgZWxzZSB1bmRlZmluZWRcblx0XHRcdGRpc21pc3NhYmxlOiB0cnVlXG5cblx0Zm9jdXM6IC0+XG5cdFx0QHBhdGhJbnB1dC5mb2N1cygpXG5cblx0IyBUZWFyIGRvd24gYW55IHN0YXRlIGFuZCBkZXRhY2hcblx0ZGVzdHJveTogLT5cblx0XHRAZWxlbWVudC5yZW1vdmUoKVxuXG5cdGdldEVsZW1lbnQ6IC0+XG5cdFx0QGVsZW1lbnRcbiJdfQ==
