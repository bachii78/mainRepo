(function() {
  var Emitter, Pane, SidePane,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Emitter = require('atom').Emitter;

  Pane = require('./Pane');

  module.exports = SidePane = (function(superClass) {
    extend(SidePane, superClass);

    function SidePane() {
      SidePane.__super__.constructor.apply(this, arguments);
      this.isVisible = false;
    }

    SidePane.prototype.destroy = function() {
      SidePane.__super__.destroy.apply(this, arguments);
      this.isVisible = false;
      return this.emitter.emit('hidden');
    };

    SidePane.prototype.show = function() {
      return new Promise((function(_this) {
        return function(resolve) {
          var split;
          _this.isVisible = true;
          split = atom.workspace.getRightDock().getPaneItems().length > 0;
          return (atom.workspace.open(_this, {
            searchAllPanes: true,
            split: split ? 'down' : 'up'
          })).then(function() {
            _this.emitter.emit('shown');
            return resolve();
          });
        };
      })(this));
    };

    SidePane.prototype.hide = function() {
      return this.destroy();
    };

    SidePane.prototype.toggle = function() {
      if (this.isVisible) {
        return this.hide();
      } else {
        return this.show();
      }
    };

    return SidePane;

  })(Pane);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbGVhcm4vLmF0b20vcGFja2FnZXMvZGJnL2xpYi92aWV3L1NpZGVQYW5lLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsdUJBQUE7SUFBQTs7O0VBQUMsVUFBVyxPQUFBLENBQVEsTUFBUjs7RUFDWixJQUFBLEdBQU8sT0FBQSxDQUFRLFFBQVI7O0VBRVAsTUFBTSxDQUFDLE9BQVAsR0FDTTs7O0lBQ1Esa0JBQUE7TUFDWiwyQ0FBQSxTQUFBO01BQ0EsSUFBQyxDQUFBLFNBQUQsR0FBYTtJQUZEOzt1QkFJYixPQUFBLEdBQVMsU0FBQTtNQUNSLHVDQUFBLFNBQUE7TUFDQSxJQUFDLENBQUEsU0FBRCxHQUFhO2FBQ2IsSUFBQyxDQUFBLE9BQU8sQ0FBQyxJQUFULENBQWMsUUFBZDtJQUhROzt1QkFLVCxJQUFBLEdBQU0sU0FBQTtBQUFHLGFBQU8sSUFBSSxPQUFKLENBQVksQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFDLE9BQUQ7QUFDM0IsY0FBQTtVQUFBLEtBQUMsQ0FBQSxTQUFELEdBQWE7VUFDYixLQUFBLEdBQVEsSUFBSSxDQUFDLFNBQVMsQ0FBQyxZQUFmLENBQUEsQ0FBNkIsQ0FBQyxZQUE5QixDQUFBLENBQTRDLENBQUMsTUFBN0MsR0FBc0Q7aUJBQzlELENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFmLENBQW9CLEtBQXBCLEVBQTBCO1lBQUEsY0FBQSxFQUFlLElBQWY7WUFBcUIsS0FBQSxFQUFTLEtBQUgsR0FBYyxNQUFkLEdBQTBCLElBQXJEO1dBQTFCLENBQUQsQ0FBcUYsQ0FBQyxJQUF0RixDQUEyRixTQUFBO1lBQzFGLEtBQUMsQ0FBQSxPQUFPLENBQUMsSUFBVCxDQUFjLE9BQWQ7bUJBQ0EsT0FBQSxDQUFBO1VBRjBGLENBQTNGO1FBSDJCO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFaO0lBQVY7O3VCQU9OLElBQUEsR0FBTSxTQUFBO2FBQ0wsSUFBQyxDQUFBLE9BQUQsQ0FBQTtJQURLOzt1QkFHTixNQUFBLEdBQVEsU0FBQTtNQUNQLElBQUcsSUFBQyxDQUFBLFNBQUo7ZUFBbUIsSUFBQyxDQUFBLElBQUQsQ0FBQSxFQUFuQjtPQUFBLE1BQUE7ZUFBZ0MsSUFBQyxDQUFBLElBQUQsQ0FBQSxFQUFoQzs7SUFETzs7OztLQXBCYztBQUp2QiIsInNvdXJjZXNDb250ZW50IjpbIntFbWl0dGVyfSA9IHJlcXVpcmUgJ2F0b20nXG5QYW5lID0gcmVxdWlyZSAnLi9QYW5lJ1xuXG5tb2R1bGUuZXhwb3J0cyA9XG5jbGFzcyBTaWRlUGFuZSBleHRlbmRzIFBhbmVcblx0Y29uc3RydWN0b3I6IC0+XG5cdFx0c3VwZXJcblx0XHRAaXNWaXNpYmxlID0gZmFsc2VcblxuXHRkZXN0cm95OiAtPlxuXHRcdHN1cGVyXG5cdFx0QGlzVmlzaWJsZSA9IGZhbHNlXG5cdFx0QGVtaXR0ZXIuZW1pdCAnaGlkZGVuJ1xuXG5cdHNob3c6IC0+IHJldHVybiBuZXcgUHJvbWlzZSAocmVzb2x2ZSkgPT5cblx0XHRAaXNWaXNpYmxlID0gdHJ1ZVxuXHRcdHNwbGl0ID0gYXRvbS53b3Jrc3BhY2UuZ2V0UmlnaHREb2NrKCkuZ2V0UGFuZUl0ZW1zKCkubGVuZ3RoID4gMFxuXHRcdChhdG9tLndvcmtzcGFjZS5vcGVuIHRoaXMsIHNlYXJjaEFsbFBhbmVzOnRydWUsIHNwbGl0OmlmIHNwbGl0IHRoZW4gJ2Rvd24nIGVsc2UgJ3VwJykudGhlbiA9PlxuXHRcdFx0QGVtaXR0ZXIuZW1pdCAnc2hvd24nXG5cdFx0XHRyZXNvbHZlKClcblxuXHRoaWRlOiAtPlxuXHRcdEBkZXN0cm95KClcblxuXHR0b2dnbGU6IC0+XG5cdFx0aWYgQGlzVmlzaWJsZSB0aGVuIEBoaWRlKCkgZWxzZSBAc2hvdygpXG4iXX0=
