(function() {
  var StatusView, View, formatFrame,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  View = require('atom-space-pen-views').View;

  formatFrame = require('./utils').formatFrame;

  module.exports = StatusView = (function(superClass) {
    extend(StatusView, superClass);

    function StatusView() {
      return StatusView.__super__.constructor.apply(this, arguments);
    }

    StatusView.prototype.initialize = function(gdb) {
      this.gdb = gdb;
      this.gdb.exec.onStateChanged(this._onStateChanged.bind(this));
      return this._onStateChanged([this.gdb.exec.state]);
    };

    StatusView.content = function() {
      return this.span('UNKNOWN', {
        "class": 'text-error'
      });
    };

    StatusView.prototype._onStateChanged = function(arg) {
      var cls, frame, state;
      state = arg[0], frame = arg[1];
      switch (state) {
        case 'DISCONNECTED':
          cls = 'text-error';
          break;
        case 'EXITED':
          cls = 'text-warning';
          break;
        case 'STOPPED':
          cls = 'text-info';
          break;
        case 'RUNNING':
          cls = 'text-success';
      }
      this.removeClass();
      if (frame != null) {
        this.text(formatFrame(frame));
      } else {
        this.text(state);
      }
      return this.addClass(cls);
    };

    return StatusView;

  })(View);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbGVhcm4vLmF0b20vcGFja2FnZXMvYXRvbS1nZGItZGVidWdnZXIvbGliL3N0YXR1cy12aWV3LmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsNkJBQUE7SUFBQTs7O0VBQUMsT0FBUSxPQUFBLENBQVEsc0JBQVI7O0VBQ1IsY0FBZSxPQUFBLENBQVEsU0FBUjs7RUFFaEIsTUFBTSxDQUFDLE9BQVAsR0FDTTs7Ozs7Ozt5QkFDRixVQUFBLEdBQVksU0FBQyxHQUFEO01BQUMsSUFBQyxDQUFBLE1BQUQ7TUFDVCxJQUFDLENBQUEsR0FBRyxDQUFDLElBQUksQ0FBQyxjQUFWLENBQXlCLElBQUMsQ0FBQSxlQUFlLENBQUMsSUFBakIsQ0FBc0IsSUFBdEIsQ0FBekI7YUFDQSxJQUFDLENBQUEsZUFBRCxDQUFpQixDQUFDLElBQUMsQ0FBQSxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQVgsQ0FBakI7SUFGUTs7SUFJWixVQUFDLENBQUEsT0FBRCxHQUFVLFNBQUE7YUFDTixJQUFDLENBQUEsSUFBRCxDQUFNLFNBQU4sRUFBaUI7UUFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLFlBQVA7T0FBakI7SUFETTs7eUJBR1YsZUFBQSxHQUFpQixTQUFDLEdBQUQ7QUFDYixVQUFBO01BRGUsZ0JBQU87QUFDdEIsY0FBTyxLQUFQO0FBQUEsYUFDUyxjQURUO1VBQzZCLEdBQUEsR0FBTTtBQUExQjtBQURULGFBRVMsUUFGVDtVQUV1QixHQUFBLEdBQU07QUFBcEI7QUFGVCxhQUdTLFNBSFQ7VUFHd0IsR0FBQSxHQUFNO0FBQXJCO0FBSFQsYUFJUyxTQUpUO1VBSXdCLEdBQUEsR0FBTTtBQUo5QjtNQU1BLElBQUMsQ0FBQSxXQUFELENBQUE7TUFDQSxJQUFHLGFBQUg7UUFDSSxJQUFDLENBQUEsSUFBRCxDQUFNLFdBQUEsQ0FBWSxLQUFaLENBQU4sRUFESjtPQUFBLE1BQUE7UUFHSSxJQUFDLENBQUEsSUFBRCxDQUFNLEtBQU4sRUFISjs7YUFJQSxJQUFDLENBQUEsUUFBRCxDQUFVLEdBQVY7SUFaYTs7OztLQVJJO0FBSnpCIiwic291cmNlc0NvbnRlbnQiOlsie1ZpZXd9ID0gcmVxdWlyZSAnYXRvbS1zcGFjZS1wZW4tdmlld3MnXG57Zm9ybWF0RnJhbWV9ID0gcmVxdWlyZSAnLi91dGlscydcblxubW9kdWxlLmV4cG9ydHMgPVxuY2xhc3MgU3RhdHVzVmlldyBleHRlbmRzIFZpZXdcbiAgICBpbml0aWFsaXplOiAoQGdkYikgLT5cbiAgICAgICAgQGdkYi5leGVjLm9uU3RhdGVDaGFuZ2VkIEBfb25TdGF0ZUNoYW5nZWQuYmluZCh0aGlzKVxuICAgICAgICBAX29uU3RhdGVDaGFuZ2VkIFtAZ2RiLmV4ZWMuc3RhdGVdXG5cbiAgICBAY29udGVudDogLT5cbiAgICAgICAgQHNwYW4gJ1VOS05PV04nLCBjbGFzczogJ3RleHQtZXJyb3InXG5cbiAgICBfb25TdGF0ZUNoYW5nZWQ6IChbc3RhdGUsIGZyYW1lXSkgLT5cbiAgICAgICAgc3dpdGNoIHN0YXRlXG4gICAgICAgICAgICB3aGVuICdESVNDT05ORUNURUQnIHRoZW4gY2xzID0gJ3RleHQtZXJyb3InXG4gICAgICAgICAgICB3aGVuICdFWElURUQnIHRoZW4gY2xzID0gJ3RleHQtd2FybmluZydcbiAgICAgICAgICAgIHdoZW4gJ1NUT1BQRUQnIHRoZW4gY2xzID0gJ3RleHQtaW5mbydcbiAgICAgICAgICAgIHdoZW4gJ1JVTk5JTkcnIHRoZW4gY2xzID0gJ3RleHQtc3VjY2VzcydcblxuICAgICAgICBAcmVtb3ZlQ2xhc3MoKVxuICAgICAgICBpZiBmcmFtZT9cbiAgICAgICAgICAgIEB0ZXh0IGZvcm1hdEZyYW1lKGZyYW1lKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAdGV4dCBzdGF0ZVxuICAgICAgICBAYWRkQ2xhc3MgY2xzXG4iXX0=
