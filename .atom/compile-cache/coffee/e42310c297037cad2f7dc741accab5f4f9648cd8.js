(function() {
  var CompositeDisposable, SidePane, VariableList,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  CompositeDisposable = require('atom').CompositeDisposable;

  SidePane = require('./SidePane');

  module.exports = VariableList = (function(superClass) {
    extend(VariableList, superClass);

    VariableList.prototype.getTitle = function() {
      return 'Variables';
    };

    VariableList.prototype.getDefaultLocation = function() {
      return 'right';
    };

    function VariableList(bugger) {
      var body, filter, options, showToolbar, toolbar;
      VariableList.__super__.constructor.apply(this, arguments);
      this.subscriptions = new CompositeDisposable();
      this.bugger = bugger;
      this.showVariableTypes = false;
      showToolbar = false;
      this.element = document.createElement('div');
      this.element.classList.add('debug-sidebar');
      if (showToolbar) {
        this.element.classList.add('with-toolbar');
      }
      options = document.createElement('div');
      options.classList.add('options', 'btn-group', 'btn-toggle');
      this.variableOptionTypes = document.createElement('button');
      this.variableOptionTypes.classList.add('btn', 'btn-sm', 'icon', 'icon-info');
      this.variableOptionTypes.title = 'Show variable types';
      this.variableOptionTypes.addEventListener('click', (function(_this) {
        return function() {
          return _this.setShowVariableTypes(!_this.showVariableTypes);
        };
      })(this));
      this.subscriptions.add(atom.tooltips.add(this.variableOptionTypes, {
        title: this.variableOptionTypes.title,
        placement: 'bottom'
      }));
      options.appendChild(this.variableOptionTypes);
      if (showToolbar) {
        toolbar = document.createElement('div');
        toolbar.classList.add('toolbar');
        this.element.appendChild(toolbar);
        toolbar.appendChild(options);
        filter = document.createElement('input');
        filter.type = 'search';
        filter.placeholder = 'Filter';
        filter.classList.add('input-search');
        toolbar.appendChild(filter);
      }
      body = document.createElement('div');
      body.classList.add('body');
      this.element.appendChild(body);
      if (!toolbar) {
        this.element.appendChild(options);
      }
      this.variableList = document.createElement('ul');
      this.variableList.classList.add('list-tree', 'has-collapsable-children', 'variable-list');
      body.appendChild(this.variableList);
      this.expandedVariables = {};
      this.isVisible = false;
    }

    VariableList.prototype.dispose = function() {
      this.destroy();
      return this.subscriptions.dispose();
    };

    VariableList.prototype.setShowVariableTypes = function(visible) {
      this.showVariableTypes = visible;
      this.variableOptionTypes.classList.toggle('selected', visible);
      return this.variableList.classList.toggle('show-types', this.showVariableTypes);
    };

    VariableList.prototype.updateVariables = function(variables) {
      var addItem, i, len, results, variable;
      while (this.variableList.firstChild) {
        this.variableList.removeChild(this.variableList.firstChild);
      }
      addItem = (function(_this) {
        return function(list, name, variable) {
          var branch, item, listItem, stringName, stringType, stringValue, text, title, tree;
          stringName = variable.name;
          stringType = variable.type ? ' (' + variable.type + ') ' : null;
          stringValue = variable.value ? variable.value : null;
          title = stringName && (stringType || stringValue) ? ("<strong>" + stringName + "</strong>") + stringType + (stringValue ? (stringName ? ': ' : '') + (stringValue.replace(/\n/g, '<br />')) : '') : null;
          listItem = null;
          if (variable.expandable) {
            tree = document.createElement('li');
            tree.classList.add('list-nested-item', 'collapsed');
            list.appendChild(tree);
            listItem = document.createElement('div');
            listItem.classList.add('list-item');
            listItem.addEventListener('click', function() {
              var loader, loaderItem, ref;
              tree.classList.toggle('collapsed');
              if (branch.childNodes.length < 1) {
                loaderItem = document.createElement('li');
                loaderItem.classList.add('list-item');
                branch.appendChild(loaderItem);
                loader = document.createElement('span');
                loader.classList.add('loading', 'loading-spinner-tiny', 'inline-block', 'debug-fadein');
                loaderItem.appendChild(loader);
                return (ref = _this.bugger.activeBugger) != null ? ref.getVariableChildren(name).then(function(children) {
                  var child, i, len, results;
                  branch.removeChild(loaderItem);
                  results = [];
                  for (i = 0, len = children.length; i < len; i++) {
                    child = children[i];
                    results.push(addItem(branch, name + '.' + child.name, child));
                  }
                  return results;
                }, function() {
                  return branch.removeChild(loaderItem);
                }) : void 0;
              }
            });
            tree.appendChild(listItem);
            branch = document.createElement('ul');
            branch.classList.add('list-tree');
            tree.appendChild(branch);
          } else {
            listItem = document.createElement('li');
            listItem.classList.add('list-item');
            list.appendChild(listItem);
          }
          if (title) {
            _this.subscriptions.add(atom.tooltips.add(listItem, {
              html: true,
              title: "<div class='debug-variable-tooltip'>" + title + "</div>",
              placement: 'top'
            }));
          }
          item = document.createElement('code');
          listItem.appendChild(item);
          text = document.createElement('span');
          text.classList.add('identifier');
          text.textContent = stringName;
          item.appendChild(text);
          text = document.createElement('span');
          text.classList.add('type');
          text.textContent = stringType;
          item.appendChild(text);
          if (stringValue !== null) {
            if (stringName) {
              text = document.createTextNode(': ');
              item.appendChild(text);
            }
            text = document.createElement(stringName ? 'span' : 'em');
            text.classList.add('value', 'selectable');
            text.textContent = stringValue;
            return item.appendChild(text);
          }
        };
      })(this);
      results = [];
      for (i = 0, len = variables.length; i < len; i++) {
        variable = variables[i];
        results.push(addItem(this.variableList, variable.name, variable));
      }
      return results;
    };

    return VariableList;

  })(SidePane);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbGVhcm4vLmF0b20vcGFja2FnZXMvZGJnL2xpYi92aWV3L1ZhcmlhYmxlTGlzdC5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLDJDQUFBO0lBQUE7OztFQUFDLHNCQUF1QixPQUFBLENBQVEsTUFBUjs7RUFDeEIsUUFBQSxHQUFXLE9BQUEsQ0FBUSxZQUFSOztFQUVYLE1BQU0sQ0FBQyxPQUFQLEdBQ007OzsyQkFDTCxRQUFBLEdBQVUsU0FBQTthQUFHO0lBQUg7OzJCQUNWLGtCQUFBLEdBQW9CLFNBQUE7YUFBRztJQUFIOztJQUVQLHNCQUFDLE1BQUQ7QUFDWixVQUFBO01BQUEsK0NBQUEsU0FBQTtNQUVBLElBQUMsQ0FBQSxhQUFELEdBQWlCLElBQUksbUJBQUosQ0FBQTtNQUVqQixJQUFDLENBQUEsTUFBRCxHQUFVO01BRVYsSUFBQyxDQUFBLGlCQUFELEdBQXFCO01BRXJCLFdBQUEsR0FBYztNQUVkLElBQUMsQ0FBQSxPQUFELEdBQVcsUUFBUSxDQUFDLGFBQVQsQ0FBdUIsS0FBdkI7TUFDWCxJQUFDLENBQUEsT0FBTyxDQUFDLFNBQVMsQ0FBQyxHQUFuQixDQUF1QixlQUF2QjtNQUNBLElBQXlDLFdBQXpDO1FBQUEsSUFBQyxDQUFBLE9BQU8sQ0FBQyxTQUFTLENBQUMsR0FBbkIsQ0FBdUIsY0FBdkIsRUFBQTs7TUFFQSxPQUFBLEdBQVUsUUFBUSxDQUFDLGFBQVQsQ0FBdUIsS0FBdkI7TUFDVixPQUFPLENBQUMsU0FBUyxDQUFDLEdBQWxCLENBQXNCLFNBQXRCLEVBQWlDLFdBQWpDLEVBQThDLFlBQTlDO01BRUEsSUFBQyxDQUFBLG1CQUFELEdBQXVCLFFBQVEsQ0FBQyxhQUFULENBQXVCLFFBQXZCO01BQ3ZCLElBQUMsQ0FBQSxtQkFBbUIsQ0FBQyxTQUFTLENBQUMsR0FBL0IsQ0FBbUMsS0FBbkMsRUFBMEMsUUFBMUMsRUFBb0QsTUFBcEQsRUFBNEQs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USxDQUFDLGFBQVQsQ0FBdUIsTUFBdkI7VUFDUCxRQUFRLENBQUMsV0FBVCxDQUFxQixJQUFyQjtVQUVBLElBQUEsR0FBTyxRQUFRLENBQUMsYUFBVCxDQUF1QixNQUF2QjtVQUNQLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBZixDQUFtQixZQUFuQjtVQUNBLElBQUksQ0FBQyxXQUFMLEdBQW1CO1VBQ25CLElBQUksQ0FBQyxXQUFMLENBQWlCLElBQWpCO1VBRUEsSUFBQSxHQUFPLFFBQVEsQ0FBQyxhQUFULENBQXVCLE1BQXZCO1VBQ1AsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFmLENBQW1CLE1BQW5CO1VBQ0EsSUFBSSxDQUFDLFdBQUwsR0FBbUI7VUFDbkIsSUFBSSxDQUFDLFdBQUwsQ0FBaUIsSUFBakI7VUFFQSxJQUFHLFdBQUEsS0FBZSxJQUFsQjtZQUNDLElBQUcsVUFBSDtjQUNDLElBQUEsR0FBTyxRQUFRLENBQUMsY0FBVCxDQUF3QixJQUF4QjtjQUNQLElBQUksQ0FBQyxXQUFMLENBQWlCLElBQWpCLEVBRkQ7O1lBSUEsSUFBQSxHQUFPLFFBQVEsQ0FBQyxhQUFULENBQTBCLFVBQUgsR0FBbUIsTUFBbkIsR0FBK0IsSUFBdEQ7WUFDUCxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQWYsQ0FBbUIsT0FBbkIsRUFBNEIsWUFBNUI7WUFDQSxJQUFJLENBQUMsV0FBTCxHQUFtQjttQkFDbkIsSUFBSSxDQUFDLFdBQUwsQ0FBaUIsSUFBakIsRUFSRDs7UUFuRVM7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBO0FBNkVWO1dBQUEsMkNBQUE7O3FCQUNDLE9BQUEsQ0FBUSxJQUFDLENBQUEsWUFBVCxFQUF1QixRQUFRLENBQUMsSUFBaEMsRUFBc0MsUUFBdEM7QUFERDs7SUFqRmdCOzs7O0tBdkVTO0FBSjNCIiwic291cmNlc0NvbnRlbnQiOlsie0NvbXBvc2l0ZURpc3Bvc2FibGV9ID0gcmVxdWlyZSAnYXRvbSdcblNpZGVQYW5lID0gcmVxdWlyZSAnLi9TaWRlUGFuZSdcblxubW9kdWxlLmV4cG9ydHMgPVxuY2xhc3MgVmFyaWFibGVMaXN0IGV4dGVuZHMgU2lkZVBhbmVcblx0Z2V0VGl0bGU6IC0+ICdWYXJpYWJsZXMnXG5cdGdldERlZmF1bHRMb2NhdGlvbjogLT4gJ3JpZ2h0J1xuXG5cdGNvbnN0cnVjdG9yOiAoYnVnZ2VyKSAtPlxuXHRcdHN1cGVyXG5cblx0XHRAc3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKClcblxuXHRcdEBidWdnZXIgPSBidWdnZXJcblxuXHRcdEBzaG93VmFyaWFibGVUeXBlcyA9IGZhbHNlXG5cblx0XHRzaG93VG9vbGJhciA9IGZhbHNlXG5cblx0XHRAZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgJ2Rpdidcblx0XHRAZWxlbWVudC5jbGFzc0xpc3QuYWRkICdkZWJ1Zy1zaWRlYmFyJ1xuXHRcdEBlbGVtZW50LmNsYXNzTGlzdC5hZGQgJ3dpdGgtdG9vbGJhcicgaWYgc2hvd1Rvb2xiYXJcblxuXHRcdG9wdGlvbnMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50ICdkaXYnXG5cdFx0b3B0aW9ucy5jbGFzc0xpc3QuYWRkICdvcHRpb25zJywgJ2J0bi1ncm91cCcsICdidG4tdG9nZ2xlJ1xuXG5cdFx0QHZhcmlhYmxlT3B0aW9uVHlwZXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50ICdidXR0b24nXG5cdFx0QHZhcmlhYmxlT3B0aW9uVHlwZXMuY2xhc3NMaXN0LmFkZCAnYnRuJywgJ2J0bi1zbScsICdpY29uJywgJ2ljb24taW5mbydcblx0XHRAdmFyaWFibGVPcHRpb25UeXBlcy50aXRsZSA9ICdTaG93IHZhcmlhYmxlIHR5cGVzJ1xuXHRcdEB2YXJpYWJsZU9wdGlvblR5cGVzLmFkZEV2ZW50TGlzdGVuZXIgJ2NsaWNrJywgPT5cblx0XHRcdEBzZXRTaG93VmFyaWFibGVUeXBlcyAhQHNob3dWYXJpYWJsZVR5cGVzXG5cblx0XHRAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS50b29sdGlwcy5hZGQgQHZhcmlhYmxlT3B0aW9uVHlwZXMsXG5cdFx0XHR0aXRsZTogQHZhcmlhYmxlT3B0aW9uVHlwZXMudGl0bGVcblx0XHRcdHBsYWNlbWVudDogJ2JvdHRvbSdcblxuXHRcdG9wdGlvbnMuYXBwZW5kQ2hpbGQgQHZhcmlhYmxlT3B0aW9uVHlwZXNcblxuXHRcdGlmIHNob3dUb29sYmFyXG5cdFx0XHR0b29sYmFyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCAnZGl2J1xuXHRcdFx0dG9vbGJhci5jbGFzc0xpc3QuYWRkICd0b29sYmFyJ1xuXHRcdFx0QGVsZW1lbnQuYXBwZW5kQ2hpbGQgdG9vbGJhclxuXG5cdFx0XHR0b29sYmFyLmFwcGVuZENoaWxkIG9wdGlvbnNcblxuXHRcdFx0ZmlsdGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCAnaW5wdXQnXG5cdFx0XHRmaWx0ZXIudHlwZSA9ICdzZWFyY2gnXG5cdFx0XHRmaWx0ZXIucGxhY2Vob2xkZXIgPSAnRmlsdGVyJ1xuXHRcdFx0ZmlsdGVyLmNsYXNzTGlzdC5hZGQgJ2lucHV0LXNlYXJjaCdcblx0XHRcdHRvb2xiYXIuYXBwZW5kQ2hpbGQgZmlsdGVyXG5cblx0XHRib2R5ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCAnZGl2J1xuXHRcdGJvZHkuY2xhc3NMaXN0LmFkZCAnYm9keSdcblx0XHRAZWxlbWVudC5hcHBlbmRDaGlsZCBib2R5XG5cblx0XHRpZiAhdG9vbGJhclxuXHRcdFx0QGVsZW1lbnQuYXBwZW5kQ2hpbGQgb3B0aW9uc1xuXG5cdFx0QHZhcmlhYmxlTGlzdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgJ3VsJ1xuXHRcdEB2YXJpYWJsZUxpc3QuY2xhc3NMaXN0LmFkZCAnbGlzdC10cmVlJywgJ2hhcy1jb2xsYXBzYWJsZS1jaGlsZHJlbicsICd2YXJpYWJsZS1saXN0J1xuXHRcdGJvZHkuYXBwZW5kQ2hpbGQgQHZhcmlhYmxlTGlzdFxuXG5cdFx0QGV4cGFuZGVkVmFyaWFibGVzID0ge31cblxuXHRcdEBpc1Zpc2libGUgPSBmYWxzZVxuXG5cdGRpc3Bvc2U6IC0+XG5cdFx0QGRlc3Ryb3koKVxuXHRcdEBzdWJzY3JpcHRpb25zLmRpc3Bvc2UoKVxuXG5cdHNldFNob3dWYXJpYWJsZVR5cGVzOiAodmlzaWJsZSkgLT5cblx0XHRAc2hvd1ZhcmlhYmxlVHlwZXMgPSB2aXNpYmxlXG5cdFx0QHZhcmlhYmxlT3B0aW9uVHlwZXMuY2xhc3NMaXN0LnRvZ2dsZSAnc2VsZWN0ZWQnLCB2aXNpYmxlXG5cdFx0QHZhcmlhYmxlTGlzdC5jbGFzc0xpc3QudG9nZ2xlICdzaG93LXR5cGVzJywgQHNob3dWYXJpYWJsZVR5cGVzXG5cblx0dXBkYXRlVmFyaWFibGVzOiAodmFyaWFibGVzKSAtPlxuXHRcdHdoaWxlIEB2YXJpYWJsZUxpc3QuZmlyc3RDaGlsZFxuXHRcdFx0QHZhcmlhYmxlTGlzdC5yZW1vdmVDaGlsZCBAdmFyaWFibGVMaXN0LmZpcnN0Q2hpbGRcblxuXHRcdGFkZEl0ZW0gPSAobGlzdCwgbmFtZSwgdmFyaWFibGUpID0+XG5cdFx0XHRzdHJpbmdOYW1lID0gdmFyaWFibGUubmFtZVxuXHRcdFx0c3RyaW5nVHlwZSA9IGlmIHZhcmlhYmxlLnR5cGUgdGhlbiAnICgnICsgdmFyaWFibGUudHlwZSArICcpICcgZWxzZSBudWxsXG5cdFx0XHRzdHJpbmdWYWx1ZSA9IGlmIHZhcmlhYmxlLnZhbHVlIHRoZW4gdmFyaWFibGUudmFsdWUgZWxzZSBudWxsXG5cdFx0XHR0aXRsZSA9IGlmIHN0cmluZ05hbWUgYW5kIChzdHJpbmdUeXBlIG9yIHN0cmluZ1ZhbHVlKSB0aGVuIFwiPHN0cm9uZz4je3N0cmluZ05hbWV9PC9zdHJvbmc+XCIgKyBzdHJpbmdUeXBlICsgKGlmIHN0cmluZ1ZhbHVlIHRoZW4gKGlmIHN0cmluZ05hbWUgdGhlbiAnOiAnIGVsc2UgJycpICsgKHN0cmluZ1ZhbHVlLnJlcGxhY2UgL1xcbi9nLCc8YnIgLz4nKSBlbHNlICcnKSBlbHNlIG51bGxcblxuXHRcdFx0bGlzdEl0ZW0gPSBudWxsXG5cblx0XHRcdGlmIHZhcmlhYmxlLmV4cGFuZGFibGVcblx0XHRcdFx0dHJlZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgJ2xpJ1xuXHRcdFx0XHR0cmVlLmNsYXNzTGlzdC5hZGQgJ2xpc3QtbmVzdGVkLWl0ZW0nLCAnY29sbGFwc2VkJ1xuXHRcdFx0XHRsaXN0LmFwcGVuZENoaWxkIHRyZWVcblxuXHRcdFx0XHRsaXN0SXRlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgJ2Rpdidcblx0XHRcdFx0bGlzdEl0ZW0uY2xhc3NMaXN0LmFkZCAnbGlzdC1pdGVtJ1xuXHRcdFx0XHRsaXN0SXRlbS5hZGRFdmVudExpc3RlbmVyICdjbGljaycsID0+XG5cdFx0XHRcdFx0dHJlZS5jbGFzc0xpc3QudG9nZ2xlICdjb2xsYXBzZWQnXG5cdFx0XHRcdFx0aWYgYnJhbmNoLmNoaWxkTm9kZXMubGVuZ3RoPDFcblx0XHRcdFx0XHRcdGxvYWRlckl0ZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50ICdsaSdcblx0XHRcdFx0XHRcdGxvYWRlckl0ZW0uY2xhc3NMaXN0LmFkZCAnbGlzdC1pdGVtJ1xuXHRcdFx0XHRcdFx0YnJhbmNoLmFwcGVuZENoaWxkIGxvYWRlckl0ZW1cblxuXHRcdFx0XHRcdFx0IyBsb2FkZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50ICdwcm9ncmVzcydcblx0XHRcdFx0XHRcdCMgbG9hZGVyLmNsYXNzTGlzdC5hZGQgJ2lubGluZS1ibG9jaycsICdkZWJ1Zy1mYWRlaW4nXG5cdFx0XHRcdFx0XHQjIGxvYWRlckl0ZW0uYXBwZW5kQ2hpbGQgbG9hZGVyXG5cblx0XHRcdFx0XHRcdGxvYWRlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgJ3NwYW4nXG5cdFx0XHRcdFx0XHRsb2FkZXIuY2xhc3NMaXN0LmFkZCAnbG9hZGluZycsICdsb2FkaW5nLXNwaW5uZXItdGlueScsICdpbmxpbmUtYmxvY2snLCAnZGVidWctZmFkZWluJ1xuXHRcdFx0XHRcdFx0bG9hZGVySXRlbS5hcHBlbmRDaGlsZCBsb2FkZXJcblxuXHRcdFx0XHRcdFx0QGJ1Z2dlci5hY3RpdmVCdWdnZXI/LmdldFZhcmlhYmxlQ2hpbGRyZW4gbmFtZVxuXHRcdFx0XHRcdFx0XHQudGhlbiAoY2hpbGRyZW4pID0+XG5cdFx0XHRcdFx0XHRcdFx0YnJhbmNoLnJlbW92ZUNoaWxkIGxvYWRlckl0ZW1cblx0XHRcdFx0XHRcdFx0XHRmb3IgY2hpbGQgaW4gY2hpbGRyZW5cblx0XHRcdFx0XHRcdFx0XHRcdGFkZEl0ZW0gYnJhbmNoLCBuYW1lKycuJytjaGlsZC5uYW1lLCBjaGlsZFxuXHRcdFx0XHRcdFx0XHQsID0+XG5cdFx0XHRcdFx0XHRcdFx0YnJhbmNoLnJlbW92ZUNoaWxkIGxvYWRlckl0ZW1cblxuXHRcdFx0XHR0cmVlLmFwcGVuZENoaWxkIGxpc3RJdGVtXG5cblx0XHRcdFx0YnJhbmNoID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCAndWwnXG5cdFx0XHRcdGJyYW5jaC5jbGFzc0xpc3QuYWRkICdsaXN0LXRyZWUnXG5cdFx0XHRcdHRyZWUuYXBwZW5kQ2hpbGQgYnJhbmNoXG5cdFx0XHRlbHNlXG5cdFx0XHRcdGxpc3RJdGVtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCAnbGknXG5cdFx0XHRcdGxpc3RJdGVtLmNsYXNzTGlzdC5hZGQgJ2xpc3QtaXRlbSdcblx0XHRcdFx0bGlzdC5hcHBlbmRDaGlsZCBsaXN0SXRlbVxuXG5cdFx0XHRpZiB0aXRsZVxuXHRcdFx0XHRAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS50b29sdGlwcy5hZGQgbGlzdEl0ZW0sXG5cdFx0XHRcdFx0aHRtbDogdHJ1ZVxuXHRcdFx0XHRcdHRpdGxlOiBcIjxkaXYgY2xhc3M9J2RlYnVnLXZhcmlhYmxlLXRvb2x0aXAnPiN7dGl0bGV9PC9kaXY+XCJcblx0XHRcdFx0XHRwbGFjZW1lbnQ6ICd0b3AnXG5cblx0XHRcdGl0ZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50ICdjb2RlJ1xuXHRcdFx0bGlzdEl0ZW0uYXBwZW5kQ2hpbGQgaXRlbVxuXG5cdFx0XHR0ZXh0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCAnc3Bhbidcblx0XHRcdHRleHQuY2xhc3NMaXN0LmFkZCAnaWRlbnRpZmllcidcblx0XHRcdHRleHQudGV4dENvbnRlbnQgPSBzdHJpbmdOYW1lXG5cdFx0XHRpdGVtLmFwcGVuZENoaWxkIHRleHRcblxuXHRcdFx0dGV4dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgJ3NwYW4nXG5cdFx0XHR0ZXh0LmNsYXNzTGlzdC5hZGQgJ3R5cGUnXG5cdFx0XHR0ZXh0LnRleHRDb250ZW50ID0gc3RyaW5nVHlwZVxuXHRcdFx0aXRlbS5hcHBlbmRDaGlsZCB0ZXh0XG5cblx0XHRcdGlmIHN0cmluZ1ZhbHVlICE9IG51bGxcblx0XHRcdFx0aWYgc3RyaW5nTmFtZVxuXHRcdFx0XHRcdHRleHQgPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSAnOiAnXG5cdFx0XHRcdFx0aXRlbS5hcHBlbmRDaGlsZCB0ZXh0XG5cblx0XHRcdFx0dGV4dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgaWYgc3RyaW5nTmFtZSB0aGVuICdzcGFuJyBlbHNlICdlbSdcblx0XHRcdFx0dGV4dC5jbGFzc0xpc3QuYWRkICd2YWx1ZScsICdzZWxlY3RhYmxlJ1xuXHRcdFx0XHR0ZXh0LnRleHRDb250ZW50ID0gc3RyaW5nVmFsdWVcblx0XHRcdFx0aXRlbS5hcHBlbmRDaGlsZCB0ZXh0XG5cblx0XHRmb3IgdmFyaWFibGUgaW4gdmFyaWFibGVzXG5cdFx0XHRhZGRJdGVtIEB2YXJpYWJsZUxpc3QsIHZhcmlhYmxlLm5hbWUsIHZhcmlhYmxlXG4iXX0=
