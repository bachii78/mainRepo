(function() {
  var $$, BreakListView, BreakView, View, ref,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  ref = require('atom-space-pen-views'), View = ref.View, $$ = ref.$$;

  BreakView = (function(superClass) {
    extend(BreakView, superClass);

    function BreakView() {
      return BreakView.__super__.constructor.apply(this, arguments);
    }

    BreakView.prototype.initialize = function(bkpt1) {
      this.bkpt = bkpt1;
      this.bkpt.onDeleted((function(_this) {
        return function() {
          return _this.remove();
        };
      })(this));
      this.bkpt.onChanged((function(_this) {
        return function() {
          return _this.update();
        };
      })(this));
      return this.update();
    };

    BreakView.content = function() {
      return this.tr((function(_this) {
        return function() {
          _this.td({
            "class": 'expand-column'
          }, function() {
            _this.span({
              outlet: 'what'
            });
            _this.span(' ');
            return _this.span('0', {
              outlet: 'times',
              "class": 'badge'
            });
          });
          _this.td({
            style: 'width: 100%'
          });
          return _this.td({
            click: '_remove'
          }, function() {
            return _this.span({
              "class": 'delete'
            });
          });
        };
      })(this));
    };

    BreakView.prototype.update = function() {
      var file, func, line, ref1, times;
      ref1 = this.bkpt, func = ref1.func, file = ref1.file, line = ref1.line, times = ref1.times;
      this.what.text("in " + func + " () at " + file + ":" + line);
      if (this.times.text() !== times) {
        this.times.addClass('badge-info');
      }
      return this.times.text(times);
    };

    BreakView.prototype._remove = function() {
      return this.bkpt.remove();
    };

    return BreakView;

  })(View);

  module.exports = BreakListView = (function(superClass) {
    extend(BreakListView, superClass);

    function BreakListView() {
      return BreakListView.__super__.constructor.apply(this, arguments);
    }

    BreakListView.prototype.initialize = function(gdb) {
      this.gdb = gdb;
      this.gdb.breaks.observe(this.breakpointObserver.bind(this));
      return this.gdb.exec.onStateChanged(this._execStateChanged.bind(this));
    };

    BreakListView.content = function() {
      return this.table({
        id: 'break-list',
        "class": 'list-tree'
      }, function() {});
    };

    BreakListView.prototype.breakpointObserver = function(id, bkpt) {
      if (!bkpt.type.endsWith('breakpoint')) {
        return;
      }
      return this.append(new BreakView(bkpt));
    };

    BreakListView.prototype._execStateChanged = function(arg) {
      var frame, state, v;
      state = arg[0], frame = arg[1];
      if (state === 'RUNNING') {
        v = this.find('.badge-info');
        return v.removeClass('badge-info');
      }
    };

    return BreakListView;

  })(View);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbGVhcm4vLmF0b20vcGFja2FnZXMvYXRvbS1nZGItZGVidWdnZXIvbGliL2JyZWFrLWxpc3Qtdmlldy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLHVDQUFBO0lBQUE7OztFQUFBLE1BQWEsT0FBQSxDQUFRLHNCQUFSLENBQWIsRUFBQyxlQUFELEVBQU87O0VBRUQ7Ozs7Ozs7d0JBQ0YsVUFBQSxHQUFZLFNBQUMsS0FBRDtNQUFDLElBQUMsQ0FBQSxPQUFEO01BQ1QsSUFBQyxDQUFBLElBQUksQ0FBQyxTQUFOLENBQWdCLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtpQkFBRyxLQUFDLENBQUEsTUFBRCxDQUFBO1FBQUg7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQWhCO01BQ0EsSUFBQyxDQUFBLElBQUksQ0FBQyxTQUFOLENBQWdCLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtpQkFBRyxLQUFDLENBQUEsTUFBRCxDQUFBO1FBQUg7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQWhCO2FBQ0EsSUFBQyxDQUFBLE1BQUQsQ0FBQTtJQUhROztJQUtaLFNBQUMsQ0FBQSxPQUFELEdBQVUsU0FBQTthQUNOLElBQUMsQ0FBQSxFQUFELENBQUksQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFBO1VBQ0EsS0FBQyxDQUFBLEVBQUQsQ0FBSTtZQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sZUFBUDtXQUFKLEVBQTRCLFNBQUE7WUFDeEIsS0FBQyxDQUFBLElBQUQsQ0FBTTtjQUFBLE1BQUEsRUFBUSxNQUFSO2FBQU47WUFDQSxLQUFDLENBQUEsSUFBRCxDQUFNLEdBQU47bUJBQ0EsS0FBQyxDQUFBLElBQUQsQ0FBTSxHQUFOLEVBQVc7Y0FBQSxNQUFBLEVBQVEsT0FBUjtjQUFpQixDQUFBLEtBQUEsQ0FBQSxFQUFPLE9BQXhCO2FBQVg7VUFId0IsQ0FBNUI7VUFJQSxLQUFDLENBQUEsRUFBRCxDQUFJO1lBQUEsS0FBQSxFQUFPLGFBQVA7V0FBSjtpQkFDQSxLQUFDLENBQUEsRUFBRCxDQUFJO1lBQUEsS0FBQSxFQUFPLFNBQVA7V0FBSixFQUFzQixTQUFBO21CQUNsQixLQUFDLENBQUEsSUFBRCxDQUFNO2NBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxRQUFQO2FBQU47VUFEa0IsQ0FBdEI7UUFOQTtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBSjtJQURNOzt3QkFVVixNQUFBLEdBQVEsU0FBQTtBQUNKLFVBQUE7TUFBQSxPQUE0QixJQUFDLENBQUEsSUFBN0IsRUFBQyxnQkFBRCxFQUFPLGdCQUFQLEVBQWEsZ0JBQWIsRUFBbUI7TUFDbkIsSUFBQyxDQUFBLElBQUksQ0FBQyxJQUFOLENBQVcsS0FBQSxHQUFNLElBQU4sR0FBVyxTQUFYLEdBQW9CLElBQXBCLEdBQXlCLEdBQXpCLEdBQTRCLElBQXZDO01BQ0EsSUFBRyxJQUFDLENBQUEsS0FBSyxDQUFDLElBQVAsQ0FBQSxDQUFBLEtBQWlCLEtBQXBCO1FBQ0ksSUFBQyxDQUFBLEtBQUssQ0FBQyxRQUFQLENBQWdCLFlBQWhCLEVBREo7O2FBRUEsSUFBQyxDQUFBLEtBQUssQ0FBQyxJQUFQLENBQVksS0FBWjtJQUxJOzt3QkFPUixPQUFBLEdBQVMsU0FBQTthQUNMLElBQUMsQ0FBQSxJQUFJLENBQUMsTUFBTixDQUFBO0lBREs7Ozs7S0F2Qlc7O0VBMEJ4QixNQUFNLENBQUMsT0FBUCxHQUNNOzs7Ozs7OzRCQUNGLFVBQUEsR0FBWSxTQUFDLEdBQUQ7TUFBQyxJQUFDLENBQUEsTUFBRDtNQUNULElBQUMsQ0FBQSxHQUFHLENBQUMsTUFBTSxDQUFDLE9BQVosQ0FBb0IsSUFBQyxDQUFBLGtCQUFrQixDQUFDLElBQXBCLENBQXlCLElBQXpCLENBQXBCO2FBQ0EsSUFBQyxDQUFBLEdBQUcsQ0FBQyxJQUFJLENBQUMsY0FBVixDQUF5QixJQUFDLENBQUEsaUJBQWlCLENBQUMsSUFBbkIsQ0FBd0IsSUFBeEIsQ0FBekI7SUFGUTs7SUFJWixhQUFDLENBQUEsT0FBRCxHQUFVLFNBQUE7YUFDTixJQUFDLENBQUEsS0FBRCxDQUFPO1FBQUEsRUFBQSxFQUFJLFlBQUo7UUFBa0IsQ0FBQSxLQUFBLENBQUEsRUFBTyxXQUF6QjtPQUFQLEVBQTZDLFNBQUEsR0FBQSxDQUE3QztJQURNOzs0QkFHVixrQkFBQSxHQUFvQixTQUFDLEVBQUQsRUFBSyxJQUFMO01BRWhCLElBQUcsQ0FBSSxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVYsQ0FBbUIsWUFBbkIsQ0FBUDtBQUNJLGVBREo7O2FBRUEsSUFBQyxDQUFBLE1BQUQsQ0FBUSxJQUFJLFNBQUosQ0FBYyxJQUFkLENBQVI7SUFKZ0I7OzRCQU1wQixpQkFBQSxHQUFtQixTQUFDLEdBQUQ7QUFDZixVQUFBO01BRGlCLGdCQUFPO01BQ3hCLElBQUcsS0FBQSxLQUFTLFNBQVo7UUFDSSxDQUFBLEdBQUksSUFBQyxDQUFBLElBQUQsQ0FBTSxhQUFOO2VBQ0osQ0FBQyxDQUFDLFdBQUYsQ0FBYyxZQUFkLEVBRko7O0lBRGU7Ozs7S0FkSztBQTdCNUIiLCJzb3VyY2VzQ29udGVudCI6WyJ7VmlldywgJCR9ID0gcmVxdWlyZSAnYXRvbS1zcGFjZS1wZW4tdmlld3MnXG5cbmNsYXNzIEJyZWFrVmlldyBleHRlbmRzIFZpZXdcbiAgICBpbml0aWFsaXplOiAoQGJrcHQpIC0+XG4gICAgICAgIEBia3B0Lm9uRGVsZXRlZCA9PiBAcmVtb3ZlKClcbiAgICAgICAgQGJrcHQub25DaGFuZ2VkID0+IEB1cGRhdGUoKVxuICAgICAgICBAdXBkYXRlKClcblxuICAgIEBjb250ZW50OiAtPlxuICAgICAgICBAdHIgPT5cbiAgICAgICAgICAgIEB0ZCBjbGFzczogJ2V4cGFuZC1jb2x1bW4nLCA9PlxuICAgICAgICAgICAgICAgIEBzcGFuIG91dGxldDogJ3doYXQnXG4gICAgICAgICAgICAgICAgQHNwYW4gJyAnXG4gICAgICAgICAgICAgICAgQHNwYW4gJzAnLCBvdXRsZXQ6ICd0aW1lcycsIGNsYXNzOiAnYmFkZ2UnXG4gICAgICAgICAgICBAdGQgc3R5bGU6ICd3aWR0aDogMTAwJSdcbiAgICAgICAgICAgIEB0ZCBjbGljazogJ19yZW1vdmUnLCA9PlxuICAgICAgICAgICAgICAgIEBzcGFuIGNsYXNzOiAnZGVsZXRlJ1xuXG4gICAgdXBkYXRlOiAtPlxuICAgICAgICB7ZnVuYywgZmlsZSwgbGluZSwgdGltZXN9ID0gQGJrcHRcbiAgICAgICAgQHdoYXQudGV4dCBcImluICN7ZnVuY30gKCkgYXQgI3tmaWxlfToje2xpbmV9XCJcbiAgICAgICAgaWYgQHRpbWVzLnRleHQoKSAhPSB0aW1lc1xuICAgICAgICAgICAgQHRpbWVzLmFkZENsYXNzICdiYWRnZS1pbmZvJ1xuICAgICAgICBAdGltZXMudGV4dCB0aW1lc1xuXG4gICAgX3JlbW92ZTogLT5cbiAgICAgICAgQGJrcHQucmVtb3ZlKClcblxubW9kdWxlLmV4cG9ydHMgPVxuY2xhc3MgQnJlYWtMaXN0VmlldyBleHRlbmRzIFZpZXdcbiAgICBpbml0aWFsaXplOiAoQGdkYikgLT5cbiAgICAgICAgQGdkYi5icmVha3Mub2JzZXJ2ZSBAYnJlYWtwb2ludE9ic2VydmVyLmJpbmQodGhpcylcbiAgICAgICAgQGdkYi5leGVjLm9uU3RhdGVDaGFuZ2VkIEBfZXhlY1N0YXRlQ2hhbmdlZC5iaW5kKHRoaXMpXG5cbiAgICBAY29udGVudDogLT5cbiAgICAgICAgQHRhYmxlIGlkOiAnYnJlYWstbGlzdCcsIGNsYXNzOiAnbGlzdC10cmVlJywgLT5cblxuICAgIGJyZWFrcG9pbnRPYnNlcnZlcjogKGlkLCBia3B0KSAtPlxuICAgICAgICAjIERvbid0IHNob3cgd2F0Y2hwb2ludHMgaW4gaGVyZVxuICAgICAgICBpZiBub3QgYmtwdC50eXBlLmVuZHNXaXRoICdicmVha3BvaW50J1xuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgIEBhcHBlbmQgbmV3IEJyZWFrVmlldyBia3B0XG5cbiAgICBfZXhlY1N0YXRlQ2hhbmdlZDogKFtzdGF0ZSwgZnJhbWVdKSAtPlxuICAgICAgICBpZiBzdGF0ZSA9PSAnUlVOTklORydcbiAgICAgICAgICAgIHYgPSBAZmluZCgnLmJhZGdlLWluZm8nKVxuICAgICAgICAgICAgdi5yZW1vdmVDbGFzcyAnYmFkZ2UtaW5mbydcbiJdfQ==
