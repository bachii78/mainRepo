(function() {
  var ConfigList, SelectListView;

  SelectListView = require('atom-select-list');

  module.exports = ConfigList = (function() {
    function ConfigList(bugger) {
      this.bugger = bugger;
      this.selectListView = new SelectListView({
        items: [],
        filterKeyForItem: (function(_this) {
          return function(item) {
            return item.name;
          };
        })(this),
        elementForItem: (function(_this) {
          return function(item) {
            var div, element;
            element = document.createElement('li');
            if (item.description) {
              element.classList.add('two-lines');
              div = document.createElement('div');
              div.classList.add('primary-line');
              div.textContent = item.name;
              element.appendChild(div);
              div = document.createElement('div');
              div.classList.add('secondary-line');
              div.textContent = item.description;
              element.appendChild(div);
            } else {
              element.textContent = item.name;
            }
            return element;
          };
        })(this),
        didConfirmSelection: (function(_this) {
          return function(item) {
            _this.hide();
            if (item.config) {
              return _this.bugger.debug(item.config);
            } else if (item.callback) {
              return item.callback();
            }
          };
        })(this),
        didCancelSelection: (function(_this) {
          return function() {
            return _this.hide();
          };
        })(this)
      });
      this.modelPanel = atom.workspace.addModalPanel({
        item: this.selectListView,
        visible: false
      });
    }

    ConfigList.prototype.destroy = function() {
      this.selectListView.destroy();
      return this.modelPanel.destroy();
    };

    ConfigList.prototype.setConfigs = function(configs) {
      var items;
      items = configs.slice();
      items.push({
        name: 'Custom',
        description: 'Configure a custom debug session',
        callback: (function(_this) {
          return function() {
            return _this.bugger.customDebug();
          };
        })(this)
      });
      items.push({
        name: 'Edit',
        description: 'Edit your project debug settings',
        callback: (function(_this) {
          return function() {
            return _this.bugger.openConfigFile();
          };
        })(this)
      });
      return this.selectListView.update({
        items: items
      });
    };

    ConfigList.prototype.hide = function() {
      return this.modelPanel.hide();
    };

    ConfigList.prototype.show = function() {
      this.modelPanel.show();
      this.selectListView.reset();
      return this.selectListView.focus();
    };

    return ConfigList;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbGVhcm4vLmF0b20vcGFja2FnZXMvZGJnL2xpYi92aWV3L0NvbmZpZ0xpc3QuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQTs7RUFBQSxjQUFBLEdBQWlCLE9BQUEsQ0FBUSxrQkFBUjs7RUFFakIsTUFBTSxDQUFDLE9BQVAsR0FDTTtJQUNRLG9CQUFDLE1BQUQ7TUFDWixJQUFDLENBQUEsTUFBRCxHQUFVO01BQ1YsSUFBQyxDQUFBLGNBQUQsR0FBa0IsSUFBSSxjQUFKLENBQ2pCO1FBQUEsS0FBQSxFQUFPLEVBQVA7UUFDQSxnQkFBQSxFQUFrQixDQUFBLFNBQUEsS0FBQTtpQkFBQSxTQUFDLElBQUQ7bUJBQVUsSUFBSSxDQUFDO1VBQWY7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBRGxCO1FBRUEsY0FBQSxFQUFnQixDQUFBLFNBQUEsS0FBQTtpQkFBQSxTQUFDLElBQUQ7QUFDZixnQkFBQTtZQUFBLE9BQUEsR0FBVSxRQUFRLENBQUMsYUFBVCxDQUF1QixJQUF2QjtZQUNWLElBQUcsSUFBSSxDQUFDLFdBQVI7Y0FDQyxPQUFPLENBQUMsU0FBUyxDQUFDLEdBQWxCLENBQXNCLFdBQXRCO2NBQ0EsR0FBQSxHQUFNLFFBQVEsQ0FBQyxhQUFULENBQXVCLEtBQXZCO2NBQ04sR0FBRyxDQUFDLFNBQVMsQ0FBQyxHQUFkLENBQWtCLGNBQWxCO2NBQ0EsR0FBRyxDQUFDLFdBQUosR0FBa0IsSUFBSSxDQUFDO2NBQ3ZCLE9BQU8sQ0FBQyxXQUFSLENBQW9CLEdBQXBCO2NBQ0EsR0FBQSxHQUFNLFFBQVEsQ0FBQyxhQUFULENBQXVCLEtBQXZCO2NBQ04sR0FBRyxDQUFDLFNBQVMsQ0FBQyxHQUFkLENBQWtCLGdCQUFsQjtjQUNBLEdBQUcsQ0FBQyxXQUFKLEdBQWtCLElBQUksQ0FBQztjQUN2QixPQUFPLENBQUMsV0FBUixDQUFvQixHQUFwQixFQVREO2FBQUEsTUFBQTtjQVdDLE9BQU8sQ0FBQyxXQUFSLEdBQXNCLElBQUksQ0FBQyxLQVg1Qjs7QUFZQSxtQkFBTztVQWRRO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUZoQjtRQWlCQSxtQkFBQSxFQUFxQixDQUFBLFNBQUEsS0FBQTtpQkFBQSxTQUFDLElBQUQ7WUFDcEIsS0FBQyxDQUFBLElBQUQsQ0FBQTtZQUNBLElBQUcsSUFBSSxDQUFDLE1BQVI7cUJBQ0MsS0FBQyxDQUFBLE1BQU0sQ0FBQyxLQUFSLENBQWMsSUFBSSxDQUFDLE1BQW5CLEVBREQ7YUFBQSxNQUVLLElBQUcsSUFBSSxDQUFDLFFBQVI7cUJBQ0osSUFBSSxDQUFDLFFBQUwsQ0FBQSxFQURJOztVQUplO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQWpCckI7UUF1QkEsa0JBQUEsRUFBb0IsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQTttQkFBRyxLQUFDLENBQUEsSUFBRCxDQUFBO1VBQUg7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBdkJwQjtPQURpQjtNQXlCbEIsSUFBQyxDQUFBLFVBQUQsR0FBYyxJQUFJLENBQUMsU0FBUyxDQUFDLGFBQWYsQ0FBNkI7UUFBQSxJQUFBLEVBQU0sSUFBQyxDQUFBLGNBQVA7UUFBdUIsT0FBQSxFQUFTLEtBQWhDO09BQTdCO0lBM0JGOzt5QkE2QmIsT0FBQSxHQUFTLFNBQUE7TUFDUixJQUFDLENBQUEsY0FBYyxDQUFDLE9BQWhCLENBQUE7YUFDQSxJQUFDLENBQUEsVUFBVSxDQUFDLE9BQVosQ0FBQTtJQUZROzt5QkFJVCxVQUFBLEdBQVksU0FBQyxPQUFEO0FBQ1gsVUFBQTtNQUFBLEtBQUEsR0FBUSxPQUFPLENBQUMsS0FBUixDQUFBO01BRVIsS0FBSyxDQUFDLElBQU4sQ0FBVztRQUFBLElBQUEsRUFBSyxRQUFMO1FBQWUsV0FBQSxFQUFZLGtDQUEzQjtRQUErRCxRQUFBLEVBQVUsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQTttQkFBRyxLQUFDLENBQUEsTUFBTSxDQUFDLFdBQVIsQ0FBQTtVQUFIO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUF6RTtPQUFYO01BQ0EsS0FBSyxDQUFDLElBQU4sQ0FBVztRQUFBLElBQUEsRUFBSyxNQUFMO1FBQWEsV0FBQSxFQUFZLGtDQUF6QjtRQUE2RCxRQUFBLEVBQVUsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQTttQkFBRyxLQUFDLENBQUEsTUFBTSxDQUFDLGNBQVIsQ0FBQTtVQUFIO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUF2RTtPQUFYO2FBRUEsSUFBQyxDQUFBLGNBQWMsQ0FBQyxNQUFoQixDQUF1QjtRQUFBLEtBQUEsRUFBTyxLQUFQO09BQXZCO0lBTlc7O3lCQVFaLElBQUEsR0FBTSxTQUFBO2FBQUcsSUFBQyxDQUFBLFVBQVUsQ0FBQyxJQUFaLENBQUE7SUFBSDs7eUJBRU4sSUFBQSxHQUFNLFNBQUE7TUFDTCxJQUFDLENBQUEsVUFBVSxDQUFDLElBQVosQ0FBQTtNQUNBLElBQUMsQ0FBQSxjQUFjLENBQUMsS0FBaEIsQ0FBQTthQUNBLElBQUMsQ0FBQSxjQUFjLENBQUMsS0FBaEIsQ0FBQTtJQUhLOzs7OztBQS9DUCIsInNvdXJjZXNDb250ZW50IjpbIlNlbGVjdExpc3RWaWV3ID0gcmVxdWlyZSAnYXRvbS1zZWxlY3QtbGlzdCdcblxubW9kdWxlLmV4cG9ydHMgPVxuY2xhc3MgQ29uZmlnTGlzdFxuXHRjb25zdHJ1Y3RvcjogKGJ1Z2dlcikgLT5cblx0XHRAYnVnZ2VyID0gYnVnZ2VyXG5cdFx0QHNlbGVjdExpc3RWaWV3ID0gbmV3IFNlbGVjdExpc3RWaWV3XG5cdFx0XHRpdGVtczogW11cblx0XHRcdGZpbHRlcktleUZvckl0ZW06IChpdGVtKSA9PiBpdGVtLm5hbWVcblx0XHRcdGVsZW1lbnRGb3JJdGVtOiAoaXRlbSkgPT5cblx0XHRcdFx0ZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgJ2xpJ1xuXHRcdFx0XHRpZiBpdGVtLmRlc2NyaXB0aW9uXG5cdFx0XHRcdFx0ZWxlbWVudC5jbGFzc0xpc3QuYWRkICd0d28tbGluZXMnXG5cdFx0XHRcdFx0ZGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCAnZGl2J1xuXHRcdFx0XHRcdGRpdi5jbGFzc0xpc3QuYWRkICdwcmltYXJ5LWxpbmUnXG5cdFx0XHRcdFx0ZGl2LnRleHRDb250ZW50ID0gaXRlbS5uYW1lXG5cdFx0XHRcdFx0ZWxlbWVudC5hcHBlbmRDaGlsZCBkaXZcblx0XHRcdFx0XHRkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50ICdkaXYnXG5cdFx0XHRcdFx0ZGl2LmNsYXNzTGlzdC5hZGQgJ3NlY29uZGFyeS1saW5lJ1xuXHRcdFx0XHRcdGRpdi50ZXh0Q29udGVudCA9IGl0ZW0uZGVzY3JpcHRpb25cblx0XHRcdFx0XHRlbGVtZW50LmFwcGVuZENoaWxkIGRpdlxuXHRcdFx0XHRlbHNlXG5cdFx0XHRcdFx0ZWxlbWVudC50ZXh0Q29udGVudCA9IGl0ZW0ubmFtZVxuXHRcdFx0XHRyZXR1cm4gZWxlbWVudFxuXHRcdFx0ZGlkQ29uZmlybVNlbGVjdGlvbjogKGl0ZW0pID0+XG5cdFx0XHRcdEBoaWRlKClcblx0XHRcdFx0aWYgaXRlbS5jb25maWdcblx0XHRcdFx0XHRAYnVnZ2VyLmRlYnVnIGl0ZW0uY29uZmlnXG5cdFx0XHRcdGVsc2UgaWYgaXRlbS5jYWxsYmFja1xuXHRcdFx0XHRcdGl0ZW0uY2FsbGJhY2soKVxuXHRcdFx0ZGlkQ2FuY2VsU2VsZWN0aW9uOiA9PiBAaGlkZSgpXG5cdFx0QG1vZGVsUGFuZWwgPSBhdG9tLndvcmtzcGFjZS5hZGRNb2RhbFBhbmVsIGl0ZW06IEBzZWxlY3RMaXN0VmlldywgdmlzaWJsZTogZmFsc2VcblxuXHRkZXN0cm95OiAtPlxuXHRcdEBzZWxlY3RMaXN0Vmlldy5kZXN0cm95KClcblx0XHRAbW9kZWxQYW5lbC5kZXN0cm95KClcblxuXHRzZXRDb25maWdzOiAoY29uZmlncykgLT5cblx0XHRpdGVtcyA9IGNvbmZpZ3Muc2xpY2UoKVxuXG5cdFx0aXRlbXMucHVzaCBuYW1lOidDdXN0b20nLCBkZXNjcmlwdGlvbjonQ29uZmlndXJlIGEgY3VzdG9tIGRlYnVnIHNlc3Npb24nLCBjYWxsYmFjazogPT4gQGJ1Z2dlci5jdXN0b21EZWJ1ZygpXG5cdFx0aXRlbXMucHVzaCBuYW1lOidFZGl0JywgZGVzY3JpcHRpb246J0VkaXQgeW91ciBwcm9qZWN0IGRlYnVnIHNldHRpbmdzJywgY2FsbGJhY2s6ID0+IEBidWdnZXIub3BlbkNvbmZpZ0ZpbGUoKVxuXG5cdFx0QHNlbGVjdExpc3RWaWV3LnVwZGF0ZSBpdGVtczogaXRlbXNcblxuXHRoaWRlOiAtPiBAbW9kZWxQYW5lbC5oaWRlKClcblxuXHRzaG93OiAtPlxuXHRcdEBtb2RlbFBhbmVsLnNob3coKVxuXHRcdEBzZWxlY3RMaXN0Vmlldy5yZXNldCgpXG5cdFx0QHNlbGVjdExpc3RWaWV3LmZvY3VzKClcbiJdfQ==
