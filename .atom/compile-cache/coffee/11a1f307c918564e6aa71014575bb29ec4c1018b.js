(function() {
  var CompositeDisposable, SidePane, StackList,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  CompositeDisposable = require('atom').CompositeDisposable;

  SidePane = require('./SidePane');

  module.exports = StackList = (function(superClass) {
    extend(StackList, superClass);

    StackList.prototype.getTitle = function() {
      return 'Call Stack';
    };

    StackList.prototype.getDefaultLocation = function() {
      return 'right';
    };

    function StackList(bugger) {
      var body, option, options, showToolbar, spacer, stackListTable, toolbar;
      StackList.__super__.constructor.apply(this, arguments);
      this.subscriptions = new CompositeDisposable();
      this.bugger = bugger;
      this.showSystemStack = false;
      showToolbar = false;
      this.element = document.createElement('div');
      this.element.classList.add('debug-sidebar');
      if (showToolbar) {
        this.element.classList.add('with-toolbar');
      }
      options = document.createElement('div');
      options.classList.add('options', 'btn-group', 'btn-toggle');
      this.optionSystem = document.createElement('button');
      this.optionSystem.classList.add('btn', 'btn-sm', 'icon', 'icon-circuit-board');
      this.optionSystem.title = 'Show system paths';
      this.optionSystem.addEventListener('click', (function(_this) {
        return function() {
          return _this.setShowSystemStack(!_this.showSystemStack);
        };
      })(this));
      this.subscriptions.add(atom.tooltips.add(this.optionSystem, {
        title: this.optionSystem.title,
        placement: 'bottom'
      }));
      options.appendChild(this.optionSystem);
      if (showToolbar) {
        toolbar = document.createElement('div');
        toolbar.classList.add('toolbar');
        this.element.appendChild(toolbar);
        toolbar.appendChild(options);
        spacer = document.createElement('div');
        spacer.classList.add('spacer');
        toolbar.appendChild(spacer);
        this.threadSelector = document.createElement('select');
        this.threadSelector.classList.add('input-select');
        toolbar.appendChild(this.threadSelector);
        option = document.createElement('option');
        option.textContent = 'thread name';
        this.threadSelector.appendChild(option);
      }
      body = document.createElement('div');
      body.classList.add('body');
      this.element.appendChild(body);
      if (!toolbar) {
        this.element.appendChild(options);
      }
      stackListTable = document.createElement('table');
      body.appendChild(stackListTable);
      this.stackListTBody = document.createElement('tbody');
      stackListTable.appendChild(this.stackListTBody);
    }

    StackList.prototype.dispose = function() {
      this.destroy();
      return this.subscriptions.dispose();
    };

    StackList.prototype.setShowSystemStack = function(visible) {
      var element, j, len, ref, results;
      this.showSystemStack = visible;
      this.optionSystem.classList.toggle('selected', visible);
      ref = this.stackListTBody.childNodes;
      results = [];
      for (j = 0, len = ref.length; j < len; j++) {
        element = ref[j];
        if (!(element.classList.contains('local'))) {
          results.push(element.style.display = visible ? '' : 'none');
        } else {
          results.push(void 0);
        }
      }
      return results;
    };

    StackList.prototype.updateStack = function(stack) {
      var cellLocation, cellPath, fn, frame, i, icon, j, listRow, path, ref, results, text;
      while (this.stackListTBody.firstChild) {
        this.stackListTBody.removeChild(this.stackListTBody.firstChild);
      }
      if (stack.length > 0) {
        fn = (function(_this) {
          return function(i) {
            return listRow.addEventListener('click', function() {
              var ref1;
              return (ref1 = _this.bugger.activeBugger) != null ? ref1.selectFrame(i) : void 0;
            });
          };
        })(this);
        results = [];
        for (i = j = 0, ref = stack.length - 1; 0 <= ref ? j <= ref : j >= ref; i = 0 <= ref ? ++j : --j) {
          frame = stack[i];
          listRow = document.createElement('tr');
          if (frame.error) {
            listRow.classList.add('text-error');
          }
          if (frame.local) {
            listRow.classList.add('local');
          } else {
            if (!this.showSystemStack) {
              listRow.style.display = 'none';
            }
          }
          fn(i);
          this.stackListTBody.insertBefore(listRow, this.stackListTBody.firstChild);
          listRow.setAttribute('title', frame.name + ' - ' + frame.path + (frame.line ? ':' + frame.line : ''));
          cellLocation = document.createElement('td');
          listRow.appendChild(cellLocation);
          text = document.createElement('code');
          text.classList.add('identifier');
          text.textContent = frame.name;
          cellLocation.appendChild(text);
          cellPath = document.createElement('td');
          listRow.appendChild(cellPath);
          path = document.createElement('span');
          path.classList.add('path');
          cellPath.appendChild(path);
          icon = document.createElement('span');
          if (frame.local) {
            icon.classList.add('icon', 'icon-file-text');
          } else {
            icon.classList.add('no-icon');
          }
          path.appendChild(icon);
          text = document.createElement('span');
          text.classList.add('filepath');
          text.textContent = frame.path + (frame.line ? ':' + frame.line : '');
          results.push(path.appendChild(text));
        }
        return results;
      }
    };

    StackList.prototype.setFrame = function(index) {
      var i, j, ref, results;
      index = this.stackListTBody.childNodes.length - 1 - index;
      if (this.stackListTBody.childNodes.length > 0) {
        results = [];
        for (i = j = 0, ref = this.stackListTBody.childNodes.length - 1; 0 <= ref ? j <= ref : j >= ref; i = 0 <= ref ? ++j : --j) {
          if (i === index) {
            results.push(this.stackListTBody.childNodes[i].classList.add('selected'));
          } else {
            results.push(this.stackListTBody.childNodes[i].classList.remove('selected'));
          }
        }
        return results;
      }
    };

    return StackList;

  })(SidePane);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbGVhcm4vLmF0b20vcGFja2FnZXMvZGJnL2xpYi92aWV3L1N0YWNrTGlzdC5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLHdDQUFBO0lBQUE7OztFQUFDLHNCQUF1QixPQUFBLENBQVEsTUFBUjs7RUFDeEIsUUFBQSxHQUFXLE9BQUEsQ0FBUSxZQUFSOztFQUVYLE1BQU0sQ0FBQyxPQUFQLEdBQ007Ozt3QkFDTCxRQUFBLEdBQVUsU0FBQTthQUFHO0lBQUg7O3dCQUNWLGtCQUFBLEdBQW9CLFNBQUE7YUFBRztJQUFIOztJQUVQLG1CQUFDLE1BQUQ7QUFDWixVQUFBO01BQUEsNENBQUEsU0FBQTtNQUVBLElBQUMsQ0FBQSxhQUFELEdBQWlCLElBQUksbUJBQUosQ0FBQTtNQUVqQixJQUFDLENBQUEsTUFBRCxHQUFVO01BRVYsSUFBQyxDQUFBLGVBQUQsR0FBbUI7TUFFbkIsV0FBQSxHQUFjO01BRWQsSUFBQyxDQUFBLE9BQUQsR0FBVyxRQUFRLENBQUMsYUFBVCxDQUF1QixLQUF2QjtNQUNYLElBQUMsQ0FBQSxPQUFPLENBQUMsU0FBUyxDQUFDLEdBQW5CLENBQXVCLGVBQXZCO01BQ0EsSUFBeUMsV0FBekM7UUFBQSxJQUFDLENBQUEsT0FBTyxDQUFDLFNBQVMsQ0FBQyxHQUFuQixDQUF1QixjQUF2QixFQUFBOztNQUVBLE9BQUEsR0FBVSxRQUFRLENBQUMsYUFBVCxDQUF1QixLQUF2QjtNQUNWLE9BQU8sQ0FBQyxTQUFTLENBQUMsR0FBbEIsQ0FBc0IsU0FBdEIsRUFBaUMsV0FBakMsRUFBOEMsWUFBOUM7TUFFQSxJQUFDLENBQUEsWUFBRCxHQUFnQixRQUFRLENBQUMsYUFBVCxDQUF1QixRQUF2QjtNQUNoQixJQUFDLENBQUEsWUFBWSxDQUFDLFNBQVMsQ0FBQyxHQUF4QixDQUE0QixLQUE1QixFQUFtQyxRQUFuQyxFQUE2QyxNQUE3QyxFQUFxRCxvQkFBckQ7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LFVBQVUsQ0FBQyxNQUEzQixHQUFrQyxDQUFsQyxHQUFvQztNQUM1QyxJQUFHLElBQUMsQ0FBQSxjQUFjLENBQUMsVUFBVSxDQUFDLE1BQTNCLEdBQWtDLENBQXJDO0FBQTRDO2FBQVMsb0hBQVQ7VUFDM0MsSUFBRyxDQUFBLEtBQUcsS0FBTjt5QkFDQyxJQUFDLENBQUEsY0FBYyxDQUFDLFVBQVcsQ0FBQSxDQUFBLENBQUUsQ0FBQyxTQUFTLENBQUMsR0FBeEMsQ0FBNEMsVUFBNUMsR0FERDtXQUFBLE1BQUE7eUJBR0MsSUFBQyxDQUFBLGNBQWMsQ0FBQyxVQUFXLENBQUEsQ0FBQSxDQUFFLENBQUMsU0FBUyxDQUFDLE1BQXhDLENBQStDLFVBQS9DLEdBSEQ7O0FBRDJDO3VCQUE1Qzs7SUFGUzs7OztLQXJJYTtBQUp4QiIsInNvdXJjZXNDb250ZW50IjpbIntDb21wb3NpdGVEaXNwb3NhYmxlfSA9IHJlcXVpcmUgJ2F0b20nXG5TaWRlUGFuZSA9IHJlcXVpcmUgJy4vU2lkZVBhbmUnXG5cbm1vZHVsZS5leHBvcnRzID1cbmNsYXNzIFN0YWNrTGlzdCBleHRlbmRzIFNpZGVQYW5lXG5cdGdldFRpdGxlOiAtPiAnQ2FsbCBTdGFjaydcblx0Z2V0RGVmYXVsdExvY2F0aW9uOiAtPiAncmlnaHQnXG5cblx0Y29uc3RydWN0b3I6IChidWdnZXIpIC0+XG5cdFx0c3VwZXJcblxuXHRcdEBzdWJzY3JpcHRpb25zID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKVxuXG5cdFx0QGJ1Z2dlciA9IGJ1Z2dlclxuXG5cdFx0QHNob3dTeXN0ZW1TdGFjayA9IGZhbHNlXG5cblx0XHRzaG93VG9vbGJhciA9IGZhbHNlXG5cblx0XHRAZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgJ2Rpdidcblx0XHRAZWxlbWVudC5jbGFzc0xpc3QuYWRkICdkZWJ1Zy1zaWRlYmFyJ1xuXHRcdEBlbGVtZW50LmNsYXNzTGlzdC5hZGQgJ3dpdGgtdG9vbGJhcicgaWYgc2hvd1Rvb2xiYXJcblxuXHRcdG9wdGlvbnMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50ICdkaXYnXG5cdFx0b3B0aW9ucy5jbGFzc0xpc3QuYWRkICdvcHRpb25zJywgJ2J0bi1ncm91cCcsICdidG4tdG9nZ2xlJ1xuXG5cdFx0QG9wdGlvblN5c3RlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgJ2J1dHRvbidcblx0XHRAb3B0aW9uU3lzdGVtLmNsYXNzTGlzdC5hZGQgJ2J0bicsICdidG4tc20nLCAnaWNvbicsICdpY29uLWNpcmN1aXQtYm9hcmQnXG5cdFx0QG9wdGlvblN5c3RlbS50aXRsZSA9ICdTaG93IHN5c3RlbSBwYXRocydcblx0XHRAb3B0aW9uU3lzdGVtLmFkZEV2ZW50TGlzdGVuZXIgJ2NsaWNrJywgPT5cblx0XHRcdEBzZXRTaG93U3lzdGVtU3RhY2sgIUBzaG93U3lzdGVtU3RhY2tcblxuXHRcdEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLnRvb2x0aXBzLmFkZCBAb3B0aW9uU3lzdGVtLFxuXHRcdFx0dGl0bGU6IEBvcHRpb25TeXN0ZW0udGl0bGVcblx0XHRcdHBsYWNlbWVudDogJ2JvdHRvbSdcblxuXHRcdG9wdGlvbnMuYXBwZW5kQ2hpbGQgQG9wdGlvblN5c3RlbVxuXG5cdFx0aWYgc2hvd1Rvb2xiYXJcblx0XHRcdHRvb2xiYXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50ICdkaXYnXG5cdFx0XHR0b29sYmFyLmNsYXNzTGlzdC5hZGQgJ3Rvb2xiYXInXG5cdFx0XHRAZWxlbWVudC5hcHBlbmRDaGlsZCB0b29sYmFyXG5cblx0XHRcdHRvb2xiYXIuYXBwZW5kQ2hpbGQgb3B0aW9uc1xuXG5cdFx0XHQjIGZpbHRlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgJ2lucHV0J1xuXHRcdFx0IyBmaWx0ZXIudHlwZSA9ICdzZWFyY2gnXG5cdFx0XHQjIGZpbHRlci5wbGFjZWhvbGRlciA9ICdGaWx0ZXInXG5cdFx0XHQjIGZpbHRlci5jbGFzc0xpc3QuYWRkICdpbnB1dC1zZWFyY2gnXG5cdFx0XHQjIHRvb2xiYXIuYXBwZW5kQ2hpbGQgZmlsdGVyXG5cblx0XHRcdHNwYWNlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgJ2Rpdidcblx0XHRcdHNwYWNlci5jbGFzc0xpc3QuYWRkICdzcGFjZXInXG5cdFx0XHR0b29sYmFyLmFwcGVuZENoaWxkIHNwYWNlclxuXG5cdFx0XHRAdGhyZWFkU2VsZWN0b3IgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50ICdzZWxlY3QnXG5cdFx0XHRAdGhyZWFkU2VsZWN0b3IuY2xhc3NMaXN0LmFkZCAnaW5wdXQtc2VsZWN0J1xuXHRcdFx0dG9vbGJhci5hcHBlbmRDaGlsZCBAdGhyZWFkU2VsZWN0b3JcblxuXHRcdFx0b3B0aW9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCAnb3B0aW9uJ1xuXHRcdFx0b3B0aW9uLnRleHRDb250ZW50ID0gJ3RocmVhZCBuYW1lJ1xuXHRcdFx0QHRocmVhZFNlbGVjdG9yLmFwcGVuZENoaWxkIG9wdGlvblxuXG5cdFx0Ym9keSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgJ2Rpdidcblx0XHRib2R5LmNsYXNzTGlzdC5hZGQgJ2JvZHknXG5cdFx0QGVsZW1lbnQuYXBwZW5kQ2hpbGQgYm9keVxuXG5cdFx0aWYgIXRvb2xiYXJcblx0XHRcdEBlbGVtZW50LmFwcGVuZENoaWxkIG9wdGlvbnNcblxuXHRcdHN0YWNrTGlzdFRhYmxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCAndGFibGUnXG5cdFx0Ym9keS5hcHBlbmRDaGlsZCBzdGFja0xpc3RUYWJsZVxuXG5cdFx0QHN0YWNrTGlzdFRCb2R5ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCAndGJvZHknXG5cdFx0c3RhY2tMaXN0VGFibGUuYXBwZW5kQ2hpbGQgQHN0YWNrTGlzdFRCb2R5XG5cblx0ZGlzcG9zZTogLT5cblx0XHRAZGVzdHJveSgpXG5cdFx0QHN1YnNjcmlwdGlvbnMuZGlzcG9zZSgpXG5cblx0c2V0U2hvd1N5c3RlbVN0YWNrOiAodmlzaWJsZSkgLT5cblx0XHRAc2hvd1N5c3RlbVN0YWNrID0gdmlzaWJsZVxuXHRcdEBvcHRpb25TeXN0ZW0uY2xhc3NMaXN0LnRvZ2dsZSAnc2VsZWN0ZWQnLCB2aXNpYmxlXG5cdFx0Zm9yIGVsZW1lbnQgaW4gQHN0YWNrTGlzdFRCb2R5LmNoaWxkTm9kZXNcblx0XHRcdGlmICEoZWxlbWVudC5jbGFzc0xpc3QuY29udGFpbnMgJ2xvY2FsJylcblx0XHRcdFx0ZWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gaWYgdmlzaWJsZSB0aGVuICcnIGVsc2UgJ25vbmUnXG5cblx0dXBkYXRlU3RhY2s6IChzdGFjaykgLT5cblx0XHR3aGlsZSBAc3RhY2tMaXN0VEJvZHkuZmlyc3RDaGlsZFxuXHRcdFx0QHN0YWNrTGlzdFRCb2R5LnJlbW92ZUNoaWxkIEBzdGFja0xpc3RUQm9keS5maXJzdENoaWxkXG5cblx0XHRpZiBzdGFjay5sZW5ndGg+MCB0aGVuIGZvciBpIGluIFswLi5zdGFjay5sZW5ndGgtMV1cblx0XHRcdGZyYW1lID0gc3RhY2tbaV1cblxuXHRcdFx0bGlzdFJvdyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgJ3RyJ1xuXHRcdFx0aWYgZnJhbWUuZXJyb3Jcblx0XHRcdFx0bGlzdFJvdy5jbGFzc0xpc3QuYWRkICd0ZXh0LWVycm9yJ1xuXG5cdFx0XHRpZiBmcmFtZS5sb2NhbFxuXHRcdFx0XHRsaXN0Um93LmNsYXNzTGlzdC5hZGQgJ2xvY2FsJ1xuXHRcdFx0ZWxzZVxuXHRcdFx0XHRpZiAhQHNob3dTeXN0ZW1TdGFja1xuXHRcdFx0XHRcdGxpc3RSb3cuc3R5bGUuZGlzcGxheSA9ICdub25lJ1xuXG5cdFx0XHRkbyAoaSkgPT5cblx0XHRcdFx0bGlzdFJvdy5hZGRFdmVudExpc3RlbmVyICdjbGljaycsID0+IEBidWdnZXIuYWN0aXZlQnVnZ2VyPy5zZWxlY3RGcmFtZSBpXG5cdFx0XHRAc3RhY2tMaXN0VEJvZHkuaW5zZXJ0QmVmb3JlIGxpc3RSb3csIEBzdGFja0xpc3RUQm9keS5maXJzdENoaWxkXG5cblx0XHRcdGxpc3RSb3cuc2V0QXR0cmlidXRlICd0aXRsZScsIGZyYW1lLm5hbWUgKyAnIC0gJyArIGZyYW1lLnBhdGggKyAoaWYgZnJhbWUubGluZSB0aGVuICc6JytmcmFtZS5saW5lIGVsc2UgJycpXG5cblx0XHRcdGNlbGxMb2NhdGlvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgJ3RkJ1xuXHRcdFx0bGlzdFJvdy5hcHBlbmRDaGlsZCBjZWxsTG9jYXRpb25cblxuXHRcdFx0dGV4dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgJ2NvZGUnXG5cdFx0XHR0ZXh0LmNsYXNzTGlzdC5hZGQgJ2lkZW50aWZpZXInXG5cdFx0XHR0ZXh0LnRleHRDb250ZW50ID0gZnJhbWUubmFtZVxuXHRcdFx0Y2VsbExvY2F0aW9uLmFwcGVuZENoaWxkIHRleHRcblxuXHRcdFx0Y2VsbFBhdGggPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50ICd0ZCdcblx0XHRcdGxpc3RSb3cuYXBwZW5kQ2hpbGQgY2VsbFBhdGhcblxuXHRcdFx0cGF0aCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgJ3NwYW4nXG5cdFx0XHRwYXRoLmNsYXNzTGlzdC5hZGQgJ3BhdGgnXG5cdFx0XHRjZWxsUGF0aC5hcHBlbmRDaGlsZCBwYXRoXG5cblx0XHRcdGljb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50ICdzcGFuJ1xuXHRcdFx0aWYgZnJhbWUubG9jYWxcblx0XHRcdFx0aWNvbi5jbGFzc0xpc3QuYWRkICdpY29uJywgJ2ljb24tZmlsZS10ZXh0J1xuXHRcdFx0ZWxzZVxuXHRcdFx0XHRpY29uLmNsYXNzTGlzdC5hZGQgJ25vLWljb24nXG5cdFx0XHRwYXRoLmFwcGVuZENoaWxkIGljb25cblxuXHRcdFx0dGV4dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgJ3NwYW4nXG5cdFx0XHR0ZXh0LmNsYXNzTGlzdC5hZGQgJ2ZpbGVwYXRoJ1xuXHRcdFx0dGV4dC50ZXh0Q29udGVudCA9IGZyYW1lLnBhdGggKyAoaWYgZnJhbWUubGluZSB0aGVuICc6JytmcmFtZS5saW5lIGVsc2UgJycpXG5cdFx0XHRwYXRoLmFwcGVuZENoaWxkIHRleHRcblxuXHRzZXRGcmFtZTogKGluZGV4KSAtPlxuXHRcdGluZGV4ID0gQHN0YWNrTGlzdFRCb2R5LmNoaWxkTm9kZXMubGVuZ3RoLTEtaW5kZXggI3JldmVyc2UgaXRcblx0XHRpZiBAc3RhY2tMaXN0VEJvZHkuY2hpbGROb2Rlcy5sZW5ndGg+MCB0aGVuIGZvciBpIGluIFswLi5Ac3RhY2tMaXN0VEJvZHkuY2hpbGROb2Rlcy5sZW5ndGgtMV1cblx0XHRcdGlmIGk9PWluZGV4XG5cdFx0XHRcdEBzdGFja0xpc3RUQm9keS5jaGlsZE5vZGVzW2ldLmNsYXNzTGlzdC5hZGQgJ3NlbGVjdGVkJ1xuXHRcdFx0ZWxzZVxuXHRcdFx0XHRAc3RhY2tMaXN0VEJvZHkuY2hpbGROb2Rlc1tpXS5jbGFzc0xpc3QucmVtb3ZlICdzZWxlY3RlZCdcbiJdfQ==
