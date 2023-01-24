(function() {
  var GdbMiView, View, escapeHTML,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  View = require('atom-space-pen-views').View;

  escapeHTML = require('./utils').escapeHTML;

  module.exports = GdbMiView = (function(superClass) {
    extend(GdbMiView, superClass);

    function GdbMiView() {
      return GdbMiView.__super__.constructor.apply(this, arguments);
    }

    GdbMiView.prototype.initialize = function(gdb) {
      this.gdb = gdb;
      return this.gdb.onGdbmiRaw((function(_this) {
        return function(data) {
          return _this._text_output(data);
        };
      })(this));
    };

    GdbMiView.content = function(gdb) {
      return this.div({
        "class": 'gdb-cli'
      }, (function(_this) {
        return function() {
          return _this.div({
            "class": 'scrolled-window',
            outlet: 'scrolled_window'
          }, function() {
            return _this.pre({
              outlet: 'console'
            });
          });
        };
      })(this));
    };

    GdbMiView.prototype._text_output = function(text) {
      text = escapeHTML(text);
      this.console.append(text + '\n');
      return this.scrolled_window.prop('scrollTop', this.console.height() - this.scrolled_window.height());
    };

    GdbMiView.prototype.getTitle = function() {
      return 'GDB/MI';
    };

    return GdbMiView;

  })(View);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbGVhcm4vLmF0b20vcGFja2FnZXMvYXRvbS1nZGItZGVidWdnZXIvbGliL2dkYi1taS12aWV3LmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsMkJBQUE7SUFBQTs7O0VBQUMsT0FBUSxPQUFBLENBQVEsc0JBQVI7O0VBQ1IsYUFBYyxPQUFBLENBQVEsU0FBUjs7RUFDZixNQUFNLENBQUMsT0FBUCxHQUNNOzs7Ozs7O3dCQUNGLFVBQUEsR0FBWSxTQUFDLEdBQUQ7TUFDUixJQUFDLENBQUEsR0FBRCxHQUFPO2FBQ1AsSUFBQyxDQUFBLEdBQUcsQ0FBQyxVQUFMLENBQWdCLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQyxJQUFEO2lCQUNaLEtBQUMsQ0FBQSxZQUFELENBQWMsSUFBZDtRQURZO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFoQjtJQUZROztJQUtaLFNBQUMsQ0FBQSxPQUFELEdBQVUsU0FBQyxHQUFEO2FBQ04sSUFBQyxDQUFBLEdBQUQsQ0FBSztRQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sU0FBUDtPQUFMLEVBQXVCLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtpQkFDbkIsS0FBQyxDQUFBLEdBQUQsQ0FBSztZQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8saUJBQVA7WUFBMEIsTUFBQSxFQUFRLGlCQUFsQztXQUFMLEVBQTBELFNBQUE7bUJBQ3RELEtBQUMsQ0FBQSxHQUFELENBQUs7Y0FBQSxNQUFBLEVBQVEsU0FBUjthQUFMO1VBRHNELENBQTFEO1FBRG1CO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUF2QjtJQURNOzt3QkFLVixZQUFBLEdBQWMsU0FBQyxJQUFEO01BQ1YsSUFBQSxHQUFPLFVBQUEsQ0FBVyxJQUFYO01BQ1AsSUFBQyxDQUFBLE9BQU8sQ0FBQyxNQUFULENBQWdCLElBQUEsR0FBTyxJQUF2QjthQUNBLElBQUMsQ0FBQSxlQUFlLENBQUMsSUFBakIsQ0FBc0IsV0FBdEIsRUFDc0IsSUFBQyxDQUFBLE9BQU8sQ0FBQyxNQUFULENBQUEsQ0FBQSxHQUFvQixJQUFDLENBQUEsZUFBZSxDQUFDLE1BQWpCLENBQUEsQ0FEMUM7SUFIVTs7d0JBTWQsUUFBQSxHQUFVLFNBQUE7YUFBRztJQUFIOzs7O0tBakJVO0FBSHhCIiwic291cmNlc0NvbnRlbnQiOlsie1ZpZXd9ID0gcmVxdWlyZSAnYXRvbS1zcGFjZS1wZW4tdmlld3MnXG57ZXNjYXBlSFRNTH0gPSByZXF1aXJlICcuL3V0aWxzJ1xubW9kdWxlLmV4cG9ydHMgPVxuY2xhc3MgR2RiTWlWaWV3IGV4dGVuZHMgVmlld1xuICAgIGluaXRpYWxpemU6IChnZGIpIC0+XG4gICAgICAgIEBnZGIgPSBnZGJcbiAgICAgICAgQGdkYi5vbkdkYm1pUmF3IChkYXRhKSA9PlxuICAgICAgICAgICAgQF90ZXh0X291dHB1dChkYXRhKVxuXG4gICAgQGNvbnRlbnQ6IChnZGIpIC0+XG4gICAgICAgIEBkaXYgY2xhc3M6ICdnZGItY2xpJywgPT5cbiAgICAgICAgICAgIEBkaXYgY2xhc3M6ICdzY3JvbGxlZC13aW5kb3cnLCBvdXRsZXQ6ICdzY3JvbGxlZF93aW5kb3cnLCA9PlxuICAgICAgICAgICAgICAgIEBwcmUgb3V0bGV0OiAnY29uc29sZSdcblxuICAgIF90ZXh0X291dHB1dDogKHRleHQpIC0+XG4gICAgICAgIHRleHQgPSBlc2NhcGVIVE1MKHRleHQpXG4gICAgICAgIEBjb25zb2xlLmFwcGVuZCh0ZXh0ICsgJ1xcbicpXG4gICAgICAgIEBzY3JvbGxlZF93aW5kb3cucHJvcCAnc2Nyb2xsVG9wJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEBjb25zb2xlLmhlaWdodCgpIC0gQHNjcm9sbGVkX3dpbmRvdy5oZWlnaHQoKVxuXG4gICAgZ2V0VGl0bGU6IC0+ICdHREIvTUknXG4iXX0=
