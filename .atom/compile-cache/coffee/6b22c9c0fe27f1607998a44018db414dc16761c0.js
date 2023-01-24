(function() {
  var Emitter;

  Emitter = require('atom').Emitter;

  this.InteractiveSession = (function() {
    function InteractiveSession(main) {
      var ref;
      this.main = main;
      this.pty = this.main.pty;
      if (!this.main.interactiveSessions.length) {
        if ((ref = this.main.panel) != null) {
          ref.setInteractive(true);
        }
      }
      this.main.interactiveSessions.push(this);
    }

    InteractiveSession.prototype.discard = function() {
      var index, ref;
      index = this.main.interactiveSessions.indexOf(this);
      this.main.interactiveSessions.splice(index, 1);
      if (!this.main.interactiveSessions.length) {
        return (ref = this.main.panel) != null ? ref.setInteractive(false) : void 0;
      }
    };

    return InteractiveSession;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbGVhcm4vLmF0b20vcGFja2FnZXMvb3V0cHV0LXBhbmVsL2xpYi9JbnRlcmFjdGl2ZVNlc3Npb24uY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQTs7RUFBQyxVQUFXLE9BQUEsQ0FBUSxNQUFSOztFQUVOLElBQUMsQ0FBQTtJQUNPLDRCQUFDLElBQUQ7QUFDWixVQUFBO01BQUEsSUFBQyxDQUFBLElBQUQsR0FBUTtNQUNSLElBQUMsQ0FBQSxHQUFELEdBQU8sSUFBQyxDQUFBLElBQUksQ0FBQztNQUNiLElBQUcsQ0FBQyxJQUFDLENBQUEsSUFBSSxDQUFDLG1CQUFtQixDQUFDLE1BQTlCOzthQUNZLENBQUUsY0FBYixDQUE0QixJQUE1QjtTQUREOztNQUVBLElBQUMsQ0FBQSxJQUFJLENBQUMsbUJBQW1CLENBQUMsSUFBMUIsQ0FBK0IsSUFBL0I7SUFMWTs7aUNBT2IsT0FBQSxHQUFTLFNBQUE7QUFDUixVQUFBO01BQUEsS0FBQSxHQUFRLElBQUMsQ0FBQSxJQUFJLENBQUMsbUJBQW1CLENBQUMsT0FBMUIsQ0FBa0MsSUFBbEM7TUFDUixJQUFDLENBQUEsSUFBSSxDQUFDLG1CQUFtQixDQUFDLE1BQTFCLENBQWlDLEtBQWpDLEVBQXdDLENBQXhDO01BQ0EsSUFBRyxDQUFDLElBQUMsQ0FBQSxJQUFJLENBQUMsbUJBQW1CLENBQUMsTUFBOUI7b0RBQ1ksQ0FBRSxjQUFiLENBQTRCLEtBQTVCLFdBREQ7O0lBSFE7Ozs7O0FBVlYiLCJzb3VyY2VzQ29udGVudCI6WyJ7RW1pdHRlcn0gPSByZXF1aXJlICdhdG9tJ1xuXG5jbGFzcyBASW50ZXJhY3RpdmVTZXNzaW9uXG5cdGNvbnN0cnVjdG9yOiAobWFpbikgLT5cblx0XHRAbWFpbiA9IG1haW5cblx0XHRAcHR5ID0gQG1haW4ucHR5XG5cdFx0aWYgIUBtYWluLmludGVyYWN0aXZlU2Vzc2lvbnMubGVuZ3RoXG5cdFx0XHRAbWFpbi5wYW5lbD8uc2V0SW50ZXJhY3RpdmUgdHJ1ZVxuXHRcdEBtYWluLmludGVyYWN0aXZlU2Vzc2lvbnMucHVzaCB0aGlzXG5cblx0ZGlzY2FyZDogLT5cblx0XHRpbmRleCA9IEBtYWluLmludGVyYWN0aXZlU2Vzc2lvbnMuaW5kZXhPZiB0aGlzXG5cdFx0QG1haW4uaW50ZXJhY3RpdmVTZXNzaW9ucy5zcGxpY2UgaW5kZXgsIDFcblx0XHRpZiAhQG1haW4uaW50ZXJhY3RpdmVTZXNzaW9ucy5sZW5ndGhcblx0XHRcdEBtYWluLnBhbmVsPy5zZXRJbnRlcmFjdGl2ZSBmYWxzZVxuIl19
