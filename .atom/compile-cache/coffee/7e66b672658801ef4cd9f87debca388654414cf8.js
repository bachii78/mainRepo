(function() {
  var CompositeDisposable, Emitter, Pane, ref;

  ref = require('atom'), Emitter = ref.Emitter, CompositeDisposable = ref.CompositeDisposable;

  module.exports = Pane = (function() {
    function Pane() {
      this.emitter = new Emitter();
    }

    Pane.prototype.destroy = function() {
      return this.emitter.emit('did-destroy');
    };

    Pane.prototype.onDidDestroy = function(callback) {
      return this.emitter.on('did-destroy', callback);
    };

    return Pane;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbGVhcm4vLmF0b20vcGFja2FnZXMvZGJnL2xpYi92aWV3L1BhbmUuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQTs7RUFBQSxNQUFpQyxPQUFBLENBQVEsTUFBUixDQUFqQyxFQUFDLHFCQUFELEVBQVU7O0VBRVYsTUFBTSxDQUFDLE9BQVAsR0FDTTtJQUNRLGNBQUE7TUFDWixJQUFDLENBQUEsT0FBRCxHQUFXLElBQUksT0FBSixDQUFBO0lBREM7O21CQUdiLE9BQUEsR0FBUyxTQUFBO2FBQ1IsSUFBQyxDQUFBLE9BQU8sQ0FBQyxJQUFULENBQWMsYUFBZDtJQURROzttQkFHVCxZQUFBLEdBQWMsU0FBQyxRQUFEO2FBQ2IsSUFBQyxDQUFBLE9BQU8sQ0FBQyxFQUFULENBQVksYUFBWixFQUEyQixRQUEzQjtJQURhOzs7OztBQVZmIiwic291cmNlc0NvbnRlbnQiOlsie0VtaXR0ZXIsIENvbXBvc2l0ZURpc3Bvc2FibGV9ID0gcmVxdWlyZSAnYXRvbSdcblxubW9kdWxlLmV4cG9ydHMgPVxuY2xhc3MgUGFuZVxuXHRjb25zdHJ1Y3RvcjogLT5cblx0XHRAZW1pdHRlciA9IG5ldyBFbWl0dGVyKClcblxuXHRkZXN0cm95OiAtPlxuXHRcdEBlbWl0dGVyLmVtaXQgJ2RpZC1kZXN0cm95J1xuXG5cdG9uRGlkRGVzdHJveTogKGNhbGxiYWNrKSAtPlxuXHRcdEBlbWl0dGVyLm9uICdkaWQtZGVzdHJveScsIGNhbGxiYWNrXG4iXX0=
