(function() {
  module.exports = {
    formatFrame: function(arg) {
      var addr, file, fmt, func, level, line;
      level = arg.level, addr = arg.addr, func = arg.func, file = arg.file, line = arg.line;
      if (level == null) {
        level = 0;
      }
      if (file != null) {
        addr = '';
      }
      fmt = "#" + level + "  " + addr + " in " + func + " ()";
      if (file != null) {
        fmt += " at " + file + ":" + line;
      }
      return fmt;
    },
    cidentFromLine: function(line, pos) {
      var cident, match, ret;
      cident = /^[A-Za-z0-9_\.]+/;
      while ((match = line.slice(pos).match(cident)) && pos >= 0) {
        ret = match[0];
        pos--;
      }
      return ret;
    },
    escapeHTML: function(text) {
      return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbGVhcm4vLmF0b20vcGFja2FnZXMvYXRvbS1nZGItZGVidWdnZXIvbGliL3V0aWxzLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtFQUFBLE1BQU0sQ0FBQyxPQUFQLEdBQ0k7SUFBQSxXQUFBLEVBQWEsU0FBQyxHQUFEO0FBQ1QsVUFBQTtNQURXLG1CQUFPLGlCQUFNLGlCQUFNLGlCQUFNO01BQ3BDLElBQU8sYUFBUDtRQUFtQixLQUFBLEdBQVEsRUFBM0I7O01BQ0EsSUFBRyxZQUFIO1FBQ0ksSUFBQSxHQUFPLEdBRFg7O01BRUEsR0FBQSxHQUFNLEdBQUEsR0FBSSxLQUFKLEdBQVUsSUFBVixHQUFjLElBQWQsR0FBbUIsTUFBbkIsR0FBeUIsSUFBekIsR0FBOEI7TUFDcEMsSUFBRyxZQUFIO1FBQ0ksR0FBQSxJQUFPLE1BQUEsR0FBTyxJQUFQLEdBQVksR0FBWixHQUFlLEtBRDFCOztBQUVBLGFBQU87SUFQRSxDQUFiO0lBU0EsY0FBQSxFQUFnQixTQUFDLElBQUQsRUFBTyxHQUFQO0FBQ1osVUFBQTtNQUFBLE1BQUEsR0FBUztBQUNULGFBQU0sQ0FBQyxLQUFBLEdBQVEsSUFBSSxDQUFDLEtBQUwsQ0FBVyxHQUFYLENBQWUsQ0FBQyxLQUFoQixDQUFzQixNQUF0QixDQUFULENBQUEsSUFBMkMsR0FBQSxJQUFPLENBQXhEO1FBQ0ksR0FBQSxHQUFNLEtBQU0sQ0FBQSxDQUFBO1FBQ1osR0FBQTtNQUZKO2FBR0E7SUFMWSxDQVRoQjtJQWdCQSxVQUFBLEVBQVksU0FBQyxJQUFEO2FBQ1IsSUFBSSxDQUFDLE9BQUwsQ0FBYSxJQUFiLEVBQW1CLE9BQW5CLENBQTJCLENBQUMsT0FBNUIsQ0FBb0MsSUFBcEMsRUFBMEMsTUFBMUMsQ0FBaUQsQ0FBQyxPQUFsRCxDQUEwRCxJQUExRCxFQUFnRSxNQUFoRTtJQURRLENBaEJaOztBQURKIiwic291cmNlc0NvbnRlbnQiOlsibW9kdWxlLmV4cG9ydHMgPVxuICAgIGZvcm1hdEZyYW1lOiAoe2xldmVsLCBhZGRyLCBmdW5jLCBmaWxlLCBsaW5lfSkgLT5cbiAgICAgICAgaWYgbm90IGxldmVsPyB0aGVuIGxldmVsID0gMFxuICAgICAgICBpZiBmaWxlP1xuICAgICAgICAgICAgYWRkciA9ICcnXG4gICAgICAgIGZtdCA9IFwiIyN7bGV2ZWx9ICAje2FkZHJ9IGluICN7ZnVuY30gKClcIlxuICAgICAgICBpZiBmaWxlP1xuICAgICAgICAgICAgZm10ICs9IFwiIGF0ICN7ZmlsZX06I3tsaW5lfVwiXG4gICAgICAgIHJldHVybiBmbXRcblxuICAgIGNpZGVudEZyb21MaW5lOiAobGluZSwgcG9zKSAtPlxuICAgICAgICBjaWRlbnQgPSAvXltBLVphLXowLTlfXFwuXSsvXG4gICAgICAgIHdoaWxlIChtYXRjaCA9IGxpbmUuc2xpY2UocG9zKS5tYXRjaCBjaWRlbnQpIGFuZCBwb3MgPj0gMFxuICAgICAgICAgICAgcmV0ID0gbWF0Y2hbMF1cbiAgICAgICAgICAgIHBvcy0tXG4gICAgICAgIHJldFxuXG4gICAgZXNjYXBlSFRNTDogKHRleHQpIC0+XG4gICAgICAgIHRleHQucmVwbGFjZSgvJi9nLCBcIiZhbXA7XCIpLnJlcGxhY2UoLzwvZywgXCImbHQ7XCIpLnJlcGxhY2UoLz4vZywgXCImZ3Q7XCIpXG4iXX0=
