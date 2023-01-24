(function() {
  var BreakListView, DebugPanelView, GdbToolbarView, SubPanel, ThreadStackView, VarWatchView, View,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  View = require('atom-space-pen-views').View;

  GdbToolbarView = require('./gdb-toolbar-view');

  VarWatchView = require('./var-watch-view');

  ThreadStackView = require('./thread-stack-view');

  BreakListView = require('./break-list-view');

  SubPanel = (function(superClass) {
    extend(SubPanel, superClass);

    function SubPanel() {
      return SubPanel.__super__.constructor.apply(this, arguments);
    }

    SubPanel.content = function(header, child) {
      return this.div({
        "class": 'debug-subpanel'
      }, (function(_this) {
        return function() {
          _this.div(header, {
            "class": 'header',
            click: 'toggleChild',
            outlet: 'header'
          });
          return _this.subview('child', function() {
            return child;
          });
        };
      })(this));
    };

    SubPanel.prototype.toggleChild = function() {
      if (this.child().css('display') === 'none') {
        this.child().show();
        return this.header.removeClass('collapsed');
      } else {
        this.child().hide();
        return this.header.addClass('collapsed');
      }
    };

    return SubPanel;

  })(View);

  module.exports = DebugPanelView = (function(superClass) {
    extend(DebugPanelView, superClass);

    function DebugPanelView() {
      return DebugPanelView.__super__.constructor.apply(this, arguments);
    }

    DebugPanelView.content = function(gdb) {
      return this.div((function(_this) {
        return function() {
          _this.subview('toolbar', new GdbToolbarView(gdb));
          _this.subview('watch', new SubPanel('Watch Variables', new VarWatchView(gdb)));
          _this.subview('breakpoints', new SubPanel('Breakpoints', new BreakListView(gdb)));
          return _this.subview('stacks', new SubPanel('Call Stacks', new ThreadStackView(gdb)));
        };
      })(this));
    };

    return DebugPanelView;

  })(View);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbGVhcm4vLmF0b20vcGFja2FnZXMvYXRvbS1nZGItZGVidWdnZXIvbGliL2RlYnVnLXBhbmVsLXZpZXcuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSw0RkFBQTtJQUFBOzs7RUFBQyxPQUFRLE9BQUEsQ0FBUSxzQkFBUjs7RUFDVCxjQUFBLEdBQWlCLE9BQUEsQ0FBUSxvQkFBUjs7RUFDakIsWUFBQSxHQUFlLE9BQUEsQ0FBUSxrQkFBUjs7RUFDZixlQUFBLEdBQWtCLE9BQUEsQ0FBUSxxQkFBUjs7RUFDbEIsYUFBQSxHQUFnQixPQUFBLENBQVEsbUJBQVI7O0VBRVY7Ozs7Ozs7SUFDRixRQUFDLENBQUEsT0FBRCxHQUFVLFNBQUMsTUFBRCxFQUFTLEtBQVQ7YUFDTixJQUFDLENBQUEsR0FBRCxDQUFLO1FBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxnQkFBUDtPQUFMLEVBQThCLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtVQUMxQixLQUFDLENBQUEsR0FBRCxDQUFLLE1BQUwsRUFBYTtZQUFBLENBQUEsS0FBQSxDQUFBLEVBQU8sUUFBUDtZQUFpQixLQUFBLEVBQU8sYUFBeEI7WUFBdUMsTUFBQSxFQUFRLFFBQS9DO1dBQWI7aUJBQ0EsS0FBQyxDQUFBLE9BQUQsQ0FBUyxPQUFULEVBQWtCLFNBQUE7bUJBQUc7VUFBSCxDQUFsQjtRQUYwQjtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBOUI7SUFETTs7dUJBS1YsV0FBQSxHQUFhLFNBQUE7TUFDVCxJQUFHLElBQUMsQ0FBQSxLQUFELENBQUEsQ0FBUSxDQUFDLEdBQVQsQ0FBYSxTQUFiLENBQUEsS0FBMkIsTUFBOUI7UUFDSSxJQUFDLENBQUEsS0FBRCxDQUFBLENBQVEsQ0FBQyxJQUFULENBQUE7ZUFDQSxJQUFDLENBQUEsTUFBTSxDQUFDLFdBQVIsQ0FBb0IsV0FBcEIsRUFGSjtPQUFBLE1BQUE7UUFJSSxJQUFDLENBQUEsS0FBRCxDQUFBLENBQVEsQ0FBQyxJQUFULENBQUE7ZUFDQSxJQUFDLENBQUEsTUFBTSxDQUFDLFFBQVIsQ0FBaUIsV0FBakIsRUFMSjs7SUFEUzs7OztLQU5NOztFQWN2QixNQUFNLENBQUMsT0FBUCxHQUNNOzs7Ozs7O0lBQ0YsY0FBQyxDQUFBLE9BQUQsR0FBVSxTQUFDLEdBQUQ7YUFDTixJQUFDLENBQUEsR0FBRCxDQUFLLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtVQUNELEtBQUMsQ0FBQSxPQUFELENBQVMsU0FBVCxFQUFvQixJQUFJLGNBQUosQ0FBbUIsR0FBbkIsQ0FBcEI7VUFDQSxLQUFDLENBQUEsT0FBRCxDQUFTLE9BQVQsRUFBa0IsSUFBSSxRQUFKLENBQWEsaUJBQWIsRUFBZ0MsSUFBSSxZQUFKLENBQWlCLEdBQWpCLENBQWhDLENBQWxCO1VBQ0EsS0FBQyxDQUFBLE9BQUQsQ0FBUyxhQUFULEVBQXdCLElBQUksUUFBSixDQUFhLGFBQWIsRUFBNEIsSUFBSSxhQUFKLENBQWtCLEdBQWxCLENBQTVCLENBQXhCO2lCQUNBLEtBQUMsQ0FBQSxPQUFELENBQVMsUUFBVCxFQUFtQixJQUFJLFFBQUosQ0FBYSxhQUFiLEVBQTRCLElBQUksZUFBSixDQUFvQixHQUFwQixDQUE1QixDQUFuQjtRQUpDO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFMO0lBRE07Ozs7S0FEZTtBQXJCN0IiLCJzb3VyY2VzQ29udGVudCI6WyJ7Vmlld30gPSByZXF1aXJlICdhdG9tLXNwYWNlLXBlbi12aWV3cydcbkdkYlRvb2xiYXJWaWV3ID0gcmVxdWlyZSAnLi9nZGItdG9vbGJhci12aWV3J1xuVmFyV2F0Y2hWaWV3ID0gcmVxdWlyZSAnLi92YXItd2F0Y2gtdmlldydcblRocmVhZFN0YWNrVmlldyA9IHJlcXVpcmUgJy4vdGhyZWFkLXN0YWNrLXZpZXcnXG5CcmVha0xpc3RWaWV3ID0gcmVxdWlyZSAnLi9icmVhay1saXN0LXZpZXcnXG5cbmNsYXNzIFN1YlBhbmVsIGV4dGVuZHMgVmlld1xuICAgIEBjb250ZW50OiAoaGVhZGVyLCBjaGlsZCktPlxuICAgICAgICBAZGl2IGNsYXNzOiAnZGVidWctc3VicGFuZWwnLCA9PlxuICAgICAgICAgICAgQGRpdiBoZWFkZXIsIGNsYXNzOiAnaGVhZGVyJywgY2xpY2s6ICd0b2dnbGVDaGlsZCcsIG91dGxldDogJ2hlYWRlcidcbiAgICAgICAgICAgIEBzdWJ2aWV3ICdjaGlsZCcsIC0+IGNoaWxkXG5cbiAgICB0b2dnbGVDaGlsZDogLT5cbiAgICAgICAgaWYgQGNoaWxkKCkuY3NzKCdkaXNwbGF5JykgPT0gJ25vbmUnXG4gICAgICAgICAgICBAY2hpbGQoKS5zaG93KClcbiAgICAgICAgICAgIEBoZWFkZXIucmVtb3ZlQ2xhc3MgJ2NvbGxhcHNlZCdcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQGNoaWxkKCkuaGlkZSgpXG4gICAgICAgICAgICBAaGVhZGVyLmFkZENsYXNzICdjb2xsYXBzZWQnXG5cbm1vZHVsZS5leHBvcnRzID1cbmNsYXNzIERlYnVnUGFuZWxWaWV3IGV4dGVuZHMgVmlld1xuICAgIEBjb250ZW50OiAoZ2RiKSAtPlxuICAgICAgICBAZGl2ID0+XG4gICAgICAgICAgICBAc3VidmlldyAndG9vbGJhcicsIG5ldyBHZGJUb29sYmFyVmlldyhnZGIpXG4gICAgICAgICAgICBAc3VidmlldyAnd2F0Y2gnLCBuZXcgU3ViUGFuZWwgJ1dhdGNoIFZhcmlhYmxlcycsIG5ldyBWYXJXYXRjaFZpZXcoZ2RiKVxuICAgICAgICAgICAgQHN1YnZpZXcgJ2JyZWFrcG9pbnRzJywgbmV3IFN1YlBhbmVsICdCcmVha3BvaW50cycsIG5ldyBCcmVha0xpc3RWaWV3KGdkYilcbiAgICAgICAgICAgIEBzdWJ2aWV3ICdzdGFja3MnLCBuZXcgU3ViUGFuZWwgJ0NhbGwgU3RhY2tzJywgbmV3IFRocmVhZFN0YWNrVmlldyhnZGIpXG4iXX0=
