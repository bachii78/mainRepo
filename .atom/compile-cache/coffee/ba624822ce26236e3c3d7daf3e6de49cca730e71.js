(function() {
  var $, Resizable, View, ref,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  ref = require('atom-space-pen-views'), View = ref.View, $ = ref.$;

  module.exports = Resizable = (function(superClass) {
    extend(Resizable, superClass);

    function Resizable() {
      return Resizable.__super__.constructor.apply(this, arguments);
    }

    Resizable.prototype.initialize = function(side1, size, child) {
      this.side = side1;
      if (this.side === 'left' || this.side === 'right') {
        this.size = this.width;
        this.evkey = 'pageX';
      } else {
        this.size = this.height;
        this.evkey = 'pageY';
      }
      return this.size(size);
    };

    Resizable.content = function(side, intialSize, child) {
      return this.div({
        "class": 'gdb-resizeable'
      }, (function(_this) {
        return function() {
          _this.div({
            "class": "gdb-resize-grip " + side,
            mousedown: '_resizeStart',
            outlet: 'grip'
          });
          return _this.subview('child', child);
        };
      })(this));
    };

    Resizable.prototype._resizeStart = function(ev) {
      this._startev = ev;
      this.initialSize = this.size();
      $(document).on('mousemove', (function(_this) {
        return function(ev) {
          return _this._resize(ev);
        };
      })(this));
      return $(document).on('mouseup', (function(_this) {
        return function() {
          return _this._resizeStop();
        };
      })(this));
    };

    Resizable.prototype._resizeStop = function() {
      $(document).off('mousemove');
      return $(document).off('mouseup');
    };

    Resizable.prototype._resize = function(ev) {
      var adjust;
      adjust = this._startev[this.evkey] - ev[this.evkey];
      if (this.side === 'bottom' || this.side === 'right') {
        adjust = -adjust;
      }
      return this.size(this.initialSize + adjust);
    };

    return Resizable;

  })(View);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbGVhcm4vLmF0b20vcGFja2FnZXMvYXRvbS1nZGItZGVidWdnZXIvbGliL3Jlc2l6YWJsZS5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLHVCQUFBO0lBQUE7OztFQUFBLE1BQVksT0FBQSxDQUFRLHNCQUFSLENBQVosRUFBQyxlQUFELEVBQU87O0VBRVAsTUFBTSxDQUFDLE9BQVAsR0FDTTs7Ozs7Ozt3QkFDRixVQUFBLEdBQVksU0FBQyxLQUFELEVBQVEsSUFBUixFQUFjLEtBQWQ7TUFBQyxJQUFDLENBQUEsT0FBRDtNQUNULElBQUcsSUFBQyxDQUFBLElBQUQsS0FBUyxNQUFULElBQW1CLElBQUMsQ0FBQSxJQUFELEtBQVMsT0FBL0I7UUFDSSxJQUFDLENBQUEsSUFBRCxHQUFRLElBQUMsQ0FBQTtRQUNULElBQUMsQ0FBQSxLQUFELEdBQVMsUUFGYjtPQUFBLE1BQUE7UUFJSSxJQUFDLENBQUEsSUFBRCxHQUFRLElBQUMsQ0FBQTtRQUNULElBQUMsQ0FBQSxLQUFELEdBQVMsUUFMYjs7YUFNQSxJQUFDLENBQUEsSUFBRCxDQUFNLElBQU47SUFQUTs7SUFTWixTQUFDLENBQUEsT0FBRCxHQUFVLFNBQUMsSUFBRCxFQUFPLFVBQVAsRUFBbUIsS0FBbkI7YUFDTixJQUFDLENBQUEsR0FBRCxDQUFLO1FBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxnQkFBUDtPQUFMLEVBQThCLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtVQUMxQixLQUFDLENBQUEsR0FBRCxDQUNJO1lBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxrQkFBQSxHQUFtQixJQUExQjtZQUNBLFNBQUEsRUFBVyxjQURYO1lBRUEsTUFBQSxFQUFRLE1BRlI7V0FESjtpQkFJQSxLQUFDLENBQUEsT0FBRCxDQUFTLE9BQVQsRUFBa0IsS0FBbEI7UUFMMEI7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQTlCO0lBRE07O3dCQVFWLFlBQUEsR0FBYyxTQUFDLEVBQUQ7TUFDVixJQUFDLENBQUEsUUFBRCxHQUFZO01BQ1osSUFBQyxDQUFBLFdBQUQsR0FBZSxJQUFDLENBQUEsSUFBRCxDQUFBO01BQ2YsQ0FBQSxDQUFFLFFBQUYsQ0FBVyxDQUFDLEVBQVosQ0FBZSxXQUFmLEVBQTRCLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQyxFQUFEO2lCQUFRLEtBQUMsQ0FBQSxPQUFELENBQVMsRUFBVDtRQUFSO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUE1QjthQUNBLENBQUEsQ0FBRSxRQUFGLENBQVcsQ0FBQyxFQUFaLENBQWUsU0FBZixFQUEwQixDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUE7aUJBQUcsS0FBQyxDQUFBLFdBQUQsQ0FBQTtRQUFIO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUExQjtJQUpVOzt3QkFNZCxXQUFBLEdBQWEsU0FBQTtNQUNULENBQUEsQ0FBRSxRQUFGLENBQVcsQ0FBQyxHQUFaLENBQWdCLFdBQWhCO2FBQ0EsQ0FBQSxDQUFFLFFBQUYsQ0FBVyxDQUFDLEdBQVosQ0FBZ0IsU0FBaEI7SUFGUzs7d0JBSWIsT0FBQSxHQUFTLFNBQUMsRUFBRDtBQUVMLFVBQUE7TUFBQSxNQUFBLEdBQVMsSUFBQyxDQUFBLFFBQVMsQ0FBQSxJQUFDLENBQUEsS0FBRCxDQUFWLEdBQW9CLEVBQUcsQ0FBQSxJQUFDLENBQUEsS0FBRDtNQUNoQyxJQUFHLElBQUMsQ0FBQSxJQUFELEtBQVMsUUFBVCxJQUFxQixJQUFDLENBQUEsSUFBRCxLQUFTLE9BQWpDO1FBQ0ksTUFBQSxHQUFTLENBQUMsT0FEZDs7YUFFQSxJQUFDLENBQUEsSUFBRCxDQUFNLElBQUMsQ0FBQSxXQUFELEdBQWUsTUFBckI7SUFMSzs7OztLQTVCVztBQUh4QiIsInNvdXJjZXNDb250ZW50IjpbIntWaWV3LCAkfSA9IHJlcXVpcmUgJ2F0b20tc3BhY2UtcGVuLXZpZXdzJ1xuXG5tb2R1bGUuZXhwb3J0cyA9XG5jbGFzcyBSZXNpemFibGUgZXh0ZW5kcyBWaWV3XG4gICAgaW5pdGlhbGl6ZTogKEBzaWRlLCBzaXplLCBjaGlsZCkgLT5cbiAgICAgICAgaWYgQHNpZGUgPT0gJ2xlZnQnIG9yIEBzaWRlID09ICdyaWdodCdcbiAgICAgICAgICAgIEBzaXplID0gQHdpZHRoXG4gICAgICAgICAgICBAZXZrZXkgPSAncGFnZVgnXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBzaXplID0gQGhlaWdodFxuICAgICAgICAgICAgQGV2a2V5ID0gJ3BhZ2VZJ1xuICAgICAgICBAc2l6ZSBzaXplXG5cbiAgICBAY29udGVudDogKHNpZGUsIGludGlhbFNpemUsIGNoaWxkKSAtPlxuICAgICAgICBAZGl2IGNsYXNzOiAnZ2RiLXJlc2l6ZWFibGUnLCA9PlxuICAgICAgICAgICAgQGRpdlxuICAgICAgICAgICAgICAgIGNsYXNzOiBcImdkYi1yZXNpemUtZ3JpcCAje3NpZGV9XCJcbiAgICAgICAgICAgICAgICBtb3VzZWRvd246ICdfcmVzaXplU3RhcnQnXG4gICAgICAgICAgICAgICAgb3V0bGV0OiAnZ3JpcCdcbiAgICAgICAgICAgIEBzdWJ2aWV3ICdjaGlsZCcsIGNoaWxkXG5cbiAgICBfcmVzaXplU3RhcnQ6IChldikgLT5cbiAgICAgICAgQF9zdGFydGV2ID0gZXZcbiAgICAgICAgQGluaXRpYWxTaXplID0gQHNpemUoKVxuICAgICAgICAkKGRvY3VtZW50KS5vbiAnbW91c2Vtb3ZlJywgKGV2KSA9PiBAX3Jlc2l6ZShldilcbiAgICAgICAgJChkb2N1bWVudCkub24gJ21vdXNldXAnLCA9PiBAX3Jlc2l6ZVN0b3AoKVxuXG4gICAgX3Jlc2l6ZVN0b3A6IC0+XG4gICAgICAgICQoZG9jdW1lbnQpLm9mZiAnbW91c2Vtb3ZlJ1xuICAgICAgICAkKGRvY3VtZW50KS5vZmYgJ21vdXNldXAnXG5cbiAgICBfcmVzaXplOiAoZXYpIC0+XG4gICAgICAgICNjb25zb2xlLmxvZyB0aGlzLCBldlxuICAgICAgICBhZGp1c3QgPSBAX3N0YXJ0ZXZbQGV2a2V5XSAtIGV2W0BldmtleV1cbiAgICAgICAgaWYgQHNpZGUgPT0gJ2JvdHRvbScgb3IgQHNpZGUgPT0gJ3JpZ2h0J1xuICAgICAgICAgICAgYWRqdXN0ID0gLWFkanVzdFxuICAgICAgICBAc2l6ZSBAaW5pdGlhbFNpemUgKyBhZGp1c3RcbiJdfQ==
