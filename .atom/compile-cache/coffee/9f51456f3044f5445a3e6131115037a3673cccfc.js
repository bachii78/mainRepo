(function() {
  var BreakpointList, CompositeDisposable, SidePane,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  CompositeDisposable = require('atom').CompositeDisposable;

  SidePane = require('./SidePane');

  module.exports = BreakpointList = (function(superClass) {
    extend(BreakpointList, superClass);

    BreakpointList.prototype.getTitle = function() {
      return 'Breakpoints';
    };

    BreakpointList.prototype.getDefaultLocation = function() {
      return 'right';
    };

    function BreakpointList(bugger) {
      var body, col, filter, row, showToolbar, toolbar;
      BreakpointList.__super__.constructor.apply(this, arguments);
      this.subscriptions = new CompositeDisposable();
      this.bugger = bugger;
      this.showSystemStack = false;
      showToolbar = false;
      this.element = document.createElement('div');
      this.element.classList.add('debug-sidebar', 'debug-sidebar-breakpoints');
      if (showToolbar) {
        this.element.classList.add('with-toolbar');
      }
      this.subscriptions.add(atom.commands.add(this.element, {
        'dbg:remove-breakpoint': (function(_this) {
          return function() {
            var selectedRow;
            if (selectedRow = _this.tableBody.querySelector('tr.selected')) {
              return _this.bugger.removeBreakpoint(selectedRow.dataset.path, parseInt(selectedRow.dataset.line));
            }
          };
        })(this)
      }));
      if (showToolbar) {
        toolbar = document.createElement('div');
        toolbar.classList.add('toolbar');
        this.element.appendChild(toolbar);
        filter = document.createElement('input');
        filter.type = 'search';
        filter.placeholder = 'Filter';
        filter.classList.add('input-search');
        toolbar.appendChild(filter);
      }
      body = document.createElement('div');
      body.classList.add('body');
      this.element.appendChild(body);
      this.table = document.createElement('table');
      body.appendChild(this.table);
      this.tableHead = document.createElement('thead');
      this.table.appendChild(this.tableHead);
      row = document.createElement('tr');
      this.tableHead.appendChild(row);
      col = document.createElement('th');
      col.textContent = 'Filename';
      row.appendChild(col);
      col = document.createElement('th');
      col.textContent = 'Line';
      col.style.textAlign = 'right';
      row.appendChild(col);
      this.tableBody = document.createElement('tbody');
      this.table.appendChild(this.tableBody);
    }

    BreakpointList.prototype.dispose = function() {
      this.destroy();
      return this.subscriptions.dispose();
    };

    BreakpointList.prototype.updateBreakpoints = function(breakpoints) {
      var breakpoint, col, fn, gotoBreakpoint, i, len, path, row, rows, selectRow, text;
      while (this.tableBody.firstChild) {
        this.tableBody.removeChild(this.tableBody.firstChild);
      }
      rows = [];
      selectRow = function(row) {
        var i, len, sibling;
        for (i = 0, len = rows.length; i < len; i++) {
          sibling = rows[i];
          if (sibling !== row) {
            sibling.classList.remove('selected');
          }
        }
        return row.classList.add('selected');
      };
      gotoBreakpoint = function(row, breakpoint, permanent) {
        selectRow(row);
        return atom.workspace.open(breakpoint.path, {
          pending: !permanent,
          activatePane: permanent,
          searchAllPanes: true,
          initialLine: breakpoint.line - 1
        });
      };
      fn = function(row, breakpoint) {
        row.addEventListener('mousedown', (function(_this) {
          return function() {
            return selectRow(row);
          };
        })(this));
        row.addEventListener('click', (function(_this) {
          return function() {
            return gotoBreakpoint(row, breakpoint, false);
          };
        })(this));
        return row.addEventListener('dblclick', (function(_this) {
          return function() {
            return gotoBreakpoint(row, breakpoint, true);
          };
        })(this));
      };
      for (i = 0, len = breakpoints.length; i < len; i++) {
        breakpoint = breakpoints[i];
        row = document.createElement('tr');
        row.dataset.path = breakpoint.path;
        row.dataset.line = breakpoint.line;
        rows.push(row);
        this.tableBody.appendChild(row);
        fn(row, breakpoint);
        path = atom.project.relativizePath(breakpoint.path);
        col = document.createElement('td');
        row.appendChild(col);
        text = document.createElement('span');
        text.textContent = path[1];
        col.appendChild(text);
        col = document.createElement('td');
        col.style.textAlign = 'right';
        row.appendChild(col);
        text = document.createElement('span');
        text.textContent = breakpoint.line;
        col.appendChild(text);
      }
      return this.table.style.display = this.tableBody.children.length === 0 ? 'none' : '';
    };

    return BreakpointList;

  })(SidePane);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbGVhcm4vLmF0b20vcGFja2FnZXMvZGJnL2xpYi92aWV3L0JyZWFrcG9pbnRMaXN0LmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsNkNBQUE7SUFBQTs7O0VBQUMsc0JBQXVCLE9BQUEsQ0FBUSxNQUFSOztFQUN4QixRQUFBLEdBQVcsT0FBQSxDQUFRLFlBQVI7O0VBRVgsTUFBTSxDQUFDLE9BQVAsR0FDTTs7OzZCQUNMLFFBQUEsR0FBVSxTQUFBO2FBQUc7SUFBSDs7NkJBQ1Ysa0JBQUEsR0FBb0IsU0FBQTthQUFHO0lBQUg7O0lBRVAsd0JBQUMsTUFBRDtBQUNaLFVBQUE7TUFBQSxpREFBQSxTQUFBO01BRUEsSUFBQyxDQUFBLGFBQUQsR0FBaUIsSUFBSSxtQkFBSixDQUFBO01BRWpCLElBQUMsQ0FBQSxNQUFELEdBQVU7TUFFVixJQUFDLENBQUEsZUFBRCxHQUFtQjtNQUVuQixXQUFBLEdBQWM7TUFFZCxJQUFDLENBQUEsT0FBRCxHQUFXLFFBQVEsQ0FBQyxhQUFULENBQXVCLEtBQXZCO01BQ1gsSUFBQyxDQUFBLE9BQU8sQ0FBQyxTQUFTLENBQUMsR0FBbkIsQ0FBdUIsZUFBdkIsRUFBd0MsMkJBQXhDO01BQ0EsSUFBeUMsV0FBekM7UUFBQSxJQUFDLENBQUEsT0FBTyxDQUFDLFNBQVMsQ0FBQyxHQUFuQixDQUF1QixjQUF2QixFQUFBOztNQUVBLElBQUMsQ0FBQSxhQUFhLENBQUMsR0FBZixDQUFtQixJQUFJLENBQUMsUUFBUSxDQUFDLEdBQWQsQ0FBa0IsSUFBQyxDQUFBLE9BQW5CLEVBQTRCO1FBQUEsdUJBQUEsRUFBeUIsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQTtBQUN2RSxnQkFBQTtZQUFBLElBQUcsV0FBQSxHQUFjLEtBQUMsQ0FBQSxTQUFTLENBQUMsYUFBWCxDQUF5QixhQUF6QixDQUFqQjtxQkFDQyxLQUFDLENBQUEsTUFBTSxDQUFDLGdC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R0FBaEI7UUFFQSxJQUFBLEdBQU8sUUFBUSxDQUFDLGFBQVQsQ0FBdUIsTUFBdkI7UUFDUCxJQUFJLENBQUMsV0FBTCxHQUFtQixJQUFLLENBQUEsQ0FBQTtRQUN4QixHQUFHLENBQUMsV0FBSixDQUFnQixJQUFoQjtRQUVBLEdBQUEsR0FBTSxRQUFRLENBQUMsYUFBVCxDQUF1QixJQUF2QjtRQUNOLEdBQUcsQ0FBQyxLQUFLLENBQUMsU0FBVixHQUFzQjtRQUN0QixHQUFHLENBQUMsV0FBSixDQUFnQixHQUFoQjtRQUVBLElBQUEsR0FBTyxRQUFRLENBQUMsYUFBVCxDQUF1QixNQUF2QjtRQUNQLElBQUksQ0FBQyxXQUFMLEdBQW1CLFVBQVUsQ0FBQztRQUM5QixHQUFHLENBQUMsV0FBSixDQUFnQixJQUFoQjtBQTNCRDthQTZCQSxJQUFDLENBQUEsS0FBSyxDQUFDLEtBQUssQ0FBQyxPQUFiLEdBQTBCLElBQUMsQ0FBQSxTQUFTLENBQUMsUUFBUSxDQUFDLE1BQXBCLEtBQTRCLENBQS9CLEdBQXNDLE1BQXRDLEdBQWtEO0lBNUN2RDs7OztLQS9EUztBQUo3QiIsInNvdXJjZXNDb250ZW50IjpbIntDb21wb3NpdGVEaXNwb3NhYmxlfSA9IHJlcXVpcmUgJ2F0b20nXG5TaWRlUGFuZSA9IHJlcXVpcmUgJy4vU2lkZVBhbmUnXG5cbm1vZHVsZS5leHBvcnRzID1cbmNsYXNzIEJyZWFrcG9pbnRMaXN0IGV4dGVuZHMgU2lkZVBhbmVcblx0Z2V0VGl0bGU6IC0+ICdCcmVha3BvaW50cydcblx0Z2V0RGVmYXVsdExvY2F0aW9uOiAtPiAncmlnaHQnXG5cblx0Y29uc3RydWN0b3I6IChidWdnZXIpIC0+XG5cdFx0c3VwZXJcblxuXHRcdEBzdWJzY3JpcHRpb25zID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKVxuXG5cdFx0QGJ1Z2dlciA9IGJ1Z2dlclxuXG5cdFx0QHNob3dTeXN0ZW1TdGFjayA9IGZhbHNlXG5cblx0XHRzaG93VG9vbGJhciA9IGZhbHNlXG5cblx0XHRAZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgJ2Rpdidcblx0XHRAZWxlbWVudC5jbGFzc0xpc3QuYWRkICdkZWJ1Zy1zaWRlYmFyJywgJ2RlYnVnLXNpZGViYXItYnJlYWtwb2ludHMnXG5cdFx0QGVsZW1lbnQuY2xhc3NMaXN0LmFkZCAnd2l0aC10b29sYmFyJyBpZiBzaG93VG9vbGJhclxuXG5cdFx0QHN1YnNjcmlwdGlvbnMuYWRkIGF0b20uY29tbWFuZHMuYWRkIEBlbGVtZW50LCAnZGJnOnJlbW92ZS1icmVha3BvaW50JzogPT5cblx0XHRcdGlmIHNlbGVjdGVkUm93ID0gQHRhYmxlQm9keS5xdWVyeVNlbGVjdG9yICd0ci5zZWxlY3RlZCdcblx0XHRcdFx0QGJ1Z2dlci5yZW1vdmVCcmVha3BvaW50IHNlbGVjdGVkUm93LmRhdGFzZXQucGF0aCwgcGFyc2VJbnQgc2VsZWN0ZWRSb3cuZGF0YXNldC5saW5lXG5cblx0XHRpZiBzaG93VG9vbGJhclxuXHRcdFx0dG9vbGJhciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgJ2Rpdidcblx0XHRcdHRvb2xiYXIuY2xhc3NMaXN0LmFkZCAndG9vbGJhcidcblx0XHRcdEBlbGVtZW50LmFwcGVuZENoaWxkIHRvb2xiYXJcblxuXHRcdFx0ZmlsdGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCAnaW5wdXQnXG5cdFx0XHRmaWx0ZXIudHlwZSA9ICdzZWFyY2gnXG5cdFx0XHRmaWx0ZXIucGxhY2Vob2xkZXIgPSAnRmlsdGVyJ1xuXHRcdFx0ZmlsdGVyLmNsYXNzTGlzdC5hZGQgJ2lucHV0LXNlYXJjaCdcblx0XHRcdHRvb2xiYXIuYXBwZW5kQ2hpbGQgZmlsdGVyXG5cblx0XHRib2R5ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCAnZGl2J1xuXHRcdGJvZHkuY2xhc3NMaXN0LmFkZCAnYm9keSdcblx0XHRAZWxlbWVudC5hcHBlbmRDaGlsZCBib2R5XG5cblx0XHRAdGFibGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50ICd0YWJsZSdcblx0XHRib2R5LmFwcGVuZENoaWxkIEB0YWJsZVxuXG5cdFx0QHRhYmxlSGVhZCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgJ3RoZWFkJ1xuXHRcdEB0YWJsZS5hcHBlbmRDaGlsZCBAdGFibGVIZWFkXG5cblx0XHRyb3cgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50ICd0cidcblx0XHRAdGFibGVIZWFkLmFwcGVuZENoaWxkIHJvd1xuXG5cdFx0Y29sID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCAndGgnXG5cdFx0Y29sLnRleHRDb250ZW50ID0gJ0ZpbGVuYW1lJ1xuXHRcdHJvdy5hcHBlbmRDaGlsZCBjb2xcblxuXHRcdGNvbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgJ3RoJ1xuXHRcdGNvbC50ZXh0Q29udGVudCA9ICdMaW5lJ1xuXHRcdGNvbC5zdHlsZS50ZXh0QWxpZ24gPSAncmlnaHQnXG5cdFx0cm93LmFwcGVuZENoaWxkIGNvbFxuXG5cdFx0QHRhYmxlQm9keSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgJ3Rib2R5J1xuXHRcdEB0YWJsZS5hcHBlbmRDaGlsZCBAdGFibGVCb2R5XG5cblx0ZGlzcG9zZTogLT5cblx0XHRAZGVzdHJveSgpXG5cdFx0QHN1YnNjcmlwdGlvbnMuZGlzcG9zZSgpXG5cblx0dXBkYXRlQnJlYWtwb2ludHM6IChicmVha3BvaW50cykgLT5cblx0XHR3aGlsZSBAdGFibGVCb2R5LmZpcnN0Q2hpbGRcblx0XHRcdEB0YWJsZUJvZHkucmVtb3ZlQ2hpbGQgQHRhYmxlQm9keS5maXJzdENoaWxkXG5cblx0XHRyb3dzID0gW11cblxuXHRcdHNlbGVjdFJvdyA9IChyb3cpIC0+XG5cdFx0XHRmb3Igc2libGluZyBpbiByb3dzXG5cdFx0XHRcdGlmIHNpYmxpbmcgIT0gcm93IHRoZW4gc2libGluZy5jbGFzc0xpc3QucmVtb3ZlICdzZWxlY3RlZCdcblx0XHRcdHJvdy5jbGFzc0xpc3QuYWRkICdzZWxlY3RlZCdcblxuXHRcdGdvdG9CcmVha3BvaW50ID0gKHJvdywgYnJlYWtwb2ludCwgcGVybWFuZW50KSAtPlxuXHRcdFx0c2VsZWN0Um93IHJvd1xuXHRcdFx0YXRvbS53b3Jrc3BhY2Uub3BlbiBicmVha3BvaW50LnBhdGgsIHBlbmRpbmc6ICFwZXJtYW5lbnQsIGFjdGl2YXRlUGFuZTogcGVybWFuZW50LCBzZWFyY2hBbGxQYW5lczogdHJ1ZSwgaW5pdGlhbExpbmU6YnJlYWtwb2ludC5saW5lLTFcblxuXHRcdGZvciBicmVha3BvaW50IGluIGJyZWFrcG9pbnRzXG5cdFx0XHRyb3cgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50ICd0cidcblx0XHRcdHJvdy5kYXRhc2V0LnBhdGggPSBicmVha3BvaW50LnBhdGhcblx0XHRcdHJvdy5kYXRhc2V0LmxpbmUgPSBicmVha3BvaW50LmxpbmVcblx0XHRcdHJvd3MucHVzaCByb3dcblx0XHRcdEB0YWJsZUJvZHkuYXBwZW5kQ2hpbGQgcm93XG5cblx0XHRcdGRvIChyb3csIGJyZWFrcG9pbnQpIC0+XG5cdFx0XHRcdHJvdy5hZGRFdmVudExpc3RlbmVyICdtb3VzZWRvd24nLCA9PiBzZWxlY3RSb3cgcm93XG5cdFx0XHRcdHJvdy5hZGRFdmVudExpc3RlbmVyICdjbGljaycsID0+IGdvdG9CcmVha3BvaW50IHJvdywgYnJlYWtwb2ludCwgZmFsc2Vcblx0XHRcdFx0cm93LmFkZEV2ZW50TGlzdGVuZXIgJ2RibGNsaWNrJywgPT4gZ290b0JyZWFrcG9pbnQgcm93LCBicmVha3BvaW50LCB0cnVlXG5cblx0XHRcdHBhdGggPSBhdG9tLnByb2plY3QucmVsYXRpdml6ZVBhdGggYnJlYWtwb2ludC5wYXRoXG5cblx0XHRcdGNvbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgJ3RkJ1xuXHRcdFx0cm93LmFwcGVuZENoaWxkIGNvbFxuXG5cdFx0XHR0ZXh0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCAnc3Bhbidcblx0XHRcdHRleHQudGV4dENvbnRlbnQgPSBwYXRoWzFdXG5cdFx0XHRjb2wuYXBwZW5kQ2hpbGQgdGV4dFxuXG5cdFx0XHRjb2wgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50ICd0ZCdcblx0XHRcdGNvbC5zdHlsZS50ZXh0QWxpZ24gPSAncmlnaHQnXG5cdFx0XHRyb3cuYXBwZW5kQ2hpbGQgY29sXG5cblx0XHRcdHRleHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50ICdzcGFuJ1xuXHRcdFx0dGV4dC50ZXh0Q29udGVudCA9IGJyZWFrcG9pbnQubGluZVxuXHRcdFx0Y29sLmFwcGVuZENoaWxkIHRleHRcblxuXHRcdEB0YWJsZS5zdHlsZS5kaXNwbGF5ID0gaWYgQHRhYmxlQm9keS5jaGlsZHJlbi5sZW5ndGg9PTAgdGhlbiAnbm9uZScgZWxzZSAnJ1xuIl19
