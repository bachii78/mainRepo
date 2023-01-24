(function() {
  var $, VarItemView, VarWatchView, View, ref,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  ref = require('atom-space-pen-views'), View = ref.View, $ = ref.$;

  VarItemView = (function(superClass) {
    extend(VarItemView, superClass);

    function VarItemView() {
      return VarItemView.__super__.constructor.apply(this, arguments);
    }

    VarItemView.prototype.initialize = function(gdb1, item1) {
      this.gdb = gdb1;
      this.item = item1;
      this.item.onChanged((function(_this) {
        return function() {
          return _this._updated();
        };
      })(this));
      this.item.onDeleted((function(_this) {
        return function() {
          return _this._deleted();
        };
      })(this));
      return this._updated();
    };

    VarItemView.prototype._updated = function() {
      var badge, v, wp;
      switch (this.item.in_scope) {
        case 'false':
          this.addClass('out-of-scope');
          this.item.value = '';
          break;
        case 'invalid':
          this._remove();
          break;
        default:
          this.removeClass('out-of-scope');
      }
      if (+this.item.numchild !== 0) {
        this.find('input#value').attr('disabled', true);
        this.addClass('collapsable');
        if (this.item.children == null) {
          this.addClass('collapsed');
        }
      }
      if (this.item.watchpoint != null) {
        this.find('input#wp-toggle').prop('checked', true);
      }
      v = this.find('input#value');
      if (v.val() !== this.item.value) {
        v.val(this.item.value);
        v.addClass('changed');
      }
      wp = this.find('input#wp-toggle');
      wp.prop('checked', this.item.watchpoint != null);
      badge = this.find('.badge');
      if (this.item.watchpoint != null) {
        badge.show();
        if (this.item.watchpoint.times !== badge.text()) {
          badge.addClass('badge-info');
        }
        return badge.text(this.item.watchpoint.times);
      } else {
        badge.text('0');
        return badge.hide();
      }
    };

    VarItemView.prototype._deleted = function() {
      return this.remove();
    };

    VarItemView.content = function(gdb, item) {
      var ref1;
      return this.tr({
        name: item.name,
        parent: (ref1 = item.parent) != null ? ref1.name : void 0
      }, (function(_this) {
        return function() {
          _this.td({
            "class": 'expand-column',
            click: 'toggleCollapse'
          }, function() {
            _this.span(item.exp, {
              style: "margin-left: " + item.nest + "em"
            });
            _this.span(' ');
            return _this.span('0', {
              "class": 'badge'
            });
          });
          if (+item.numchild === 0) {
            _this.td(function() {
              return _this.input({
                id: 'wp-toggle',
                "class": 'input-toggle',
                type: 'checkbox',
                click: '_toggleWP'
              });
            });
          } else {
            _this.td();
          }
          _this.td({
            style: 'width: 100%'
          }, function() {
            return _this.input({
              id: 'value',
              "class": 'input-text native-key-bindings',
              value: item.value,
              focus: '_valueFocus',
              blur: '_valueBlur',
              keydown: '_valueKeydown'
            });
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

    VarItemView.prototype._hideTree = function(id) {
      var child, children, i, len, results;
      children = $(this).parent().find("tr[parent='" + id + "']");
      children.hide();
      results = [];
      for (i = 0, len = children.length; i < len; i++) {
        child = children[i];
        results.push(this._hideTree(child.getAttribute('name')));
      }
      return results;
    };

    VarItemView.prototype._showTree = function(id) {
      var $child, child, children, i, len, results;
      children = $(this).parent().find("tr[parent='" + id + "']");
      children.show();
      results = [];
      for (i = 0, len = children.length; i < len; i++) {
        child = children[i];
        $child = $(child);
        if (!$child.hasClass('collapsed')) {
          results.push(this._showTree($child.attr('name')));
        } else {
          results.push(void 0);
        }
      }
      return results;
    };

    VarItemView.prototype._remove = function() {
      return this.item.remove();
    };

    VarItemView.prototype._toggleWP = function(ev) {
      if (ev.target.checked) {
        return this.item.setWatch()["catch"](function(err) {
          atom.notifications.addError(err.toString());
          return ev.target.checked = false;
        });
      } else {
        return this.item.clearWatch()["catch"](function(err) {
          atom.notifications.addError(err.toString());
          return ev.target.checked = true;
        });
      }
    };

    VarItemView.prototype.toggleCollapse = function() {
      if (this.hasClass('collapsable')) {
        this.toggleClass('collapsed');
        if (this.hasClass('collapsed')) {
          return this._hideTree(this.item.name);
        } else {
          if (this.item.children == null) {
            this.item.addChildren();
          }
          return this._showTree(this.item.name);
        }
      }
    };

    VarItemView.prototype._valueFocus = function(ev) {
      ev.target.oldValue = ev.target.value;
      return ev.target.select();
    };

    VarItemView.prototype._valueBlur = function(ev) {
      return ev.target.value = ev.target.oldValue;
    };

    VarItemView.prototype._valueKeydown = function(ev) {
      switch (ev.keyCode) {
        case 13:
          return this.item.assign(ev.target.value).then(function(val) {
            ev.target.oldValue = ev.target.value = val;
            return ev.target.blur();
          })["catch"](function(err) {
            ev.target.blur();
            return atom.notifications.addError(err.toString());
          });
        case 27:
          return ev.target.blur();
      }
    };

    return VarItemView;

  })(View);

  module.exports = VarWatchView = (function(superClass) {
    extend(VarWatchView, superClass);

    function VarWatchView() {
      return VarWatchView.__super__.constructor.apply(this, arguments);
    }

    VarWatchView.prototype.initialize = function(gdb1) {
      this.gdb = gdb1;
      this.varviews = {};
      this.gdb.vars.observe(this._addItem.bind(this));
      return this.gdb.exec.onStateChanged(this._execStateChanged.bind(this));
    };

    VarWatchView.content = function(gdb) {
      return this.div({
        "class": 'var-watch-view'
      }, (function(_this) {
        return function() {
          _this.div({
            "class": 'block'
          }, function() {
            _this.label('Add expression to watch:');
            return _this.input({
              "class": 'input-textarea native-key-bindings',
              keypress: '_addExpr',
              outlet: 'expr'
            });
          });
          _this.div({
            "class": 'block'
          }, function() {
            return _this.div({
              "class": 'error-message',
              outlet: 'error'
            });
          });
          return _this.div({
            "class": 'block'
          }, function() {
            return _this.div({
              "class": 'var-watch-tree'
            }, function() {
              return _this.table({
                outlet: 'table'
              }, function() {
                return _this.tr(function() {
                  _this.th('Expression');
                  _this.th('WP', {
                    style: 'text-align: center'
                  });
                  return _this.th('Value');
                });
              });
            });
          });
        };
      })(this));
    };

    VarWatchView.prototype.getTitle = function() {
      return 'Watch Variables';
    };

    VarWatchView.prototype._addExpr = function(ev) {
      if (ev.charCode !== 13) {
        return;
      }
      this.gdb.vars.add(this.expr.val()).then((function(_this) {
        return function() {
          return _this.error.text('');
        };
      })(this))["catch"]((function(_this) {
        return function(err) {
          return _this.error.text(err);
        };
      })(this));
      return this.expr.val('');
    };

    VarWatchView.prototype._findLast = function(name) {
      var children, nextName;
      children = this.find("tr[parent='" + name + "']");
      if (children.length) {
        nextName = children[children.length - 1].getAttribute('name');
        return this._findLast(nextName);
      }
      return name;
    };

    VarWatchView.prototype._addItem = function(val) {
      var last, lastName, view;
      view = new VarItemView(this.gdb, val);
      if (val.parent == null) {
        this.table.append(view);
      } else {
        lastName = this._findLast(val.parent.name);
        last = this.find("tr[name='" + lastName + "']");
        view.insertAfter(last);
      }
      return view;
    };

    VarWatchView.prototype._execStateChanged = function(arg) {
      var frame, state;
      state = arg[0], frame = arg[1];
      if (state === 'RUNNING') {
        this.find('.changed').removeClass('changed');
        return this.find('.badge-info').removeClass('badge-info');
      }
    };

    return VarWatchView;

  })(View);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbGVhcm4vLmF0b20vcGFja2FnZXMvYXRvbS1nZGItZGVidWdnZXIvbGliL3Zhci13YXRjaC12aWV3LmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsdUNBQUE7SUFBQTs7O0VBQUEsTUFBWSxPQUFBLENBQVEsc0JBQVIsQ0FBWixFQUFDLGVBQUQsRUFBTzs7RUFFRDs7Ozs7OzswQkFDRixVQUFBLEdBQVksU0FBQyxJQUFELEVBQU8sS0FBUDtNQUFDLElBQUMsQ0FBQSxNQUFEO01BQU0sSUFBQyxDQUFBLE9BQUQ7TUFDZixJQUFDLENBQUEsSUFBSSxDQUFDLFNBQU4sQ0FBZ0IsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFBO2lCQUFHLEtBQUMsQ0FBQSxRQUFELENBQUE7UUFBSDtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBaEI7TUFDQSxJQUFDLENBQUEsSUFBSSxDQUFDLFNBQU4sQ0FBZ0IsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFBO2lCQUFHLEtBQUMsQ0FBQSxRQUFELENBQUE7UUFBSDtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBaEI7YUFDQSxJQUFDLENBQUEsUUFBRCxDQUFBO0lBSFE7OzBCQUtaLFFBQUEsR0FBVSxTQUFBO0FBQ04sVUFBQTtBQUFBLGNBQU8sSUFBQyxDQUFBLElBQUksQ0FBQyxRQUFiO0FBQUEsYUFDUyxPQURUO1VBRVEsSUFBQyxDQUFBLFFBQUQsQ0FBVSxjQUFWO1VBQ0EsSUFBQyxDQUFBLElBQUksQ0FBQyxLQUFOLEdBQWM7QUFGYjtBQURULGFBSVMsU0FKVDtVQUl3QixJQUFDLENBQUEsT0FBRCxDQUFBO0FBQWY7QUFKVDtVQUtTLElBQUMsQ0FBQSxXQUFELENBQWEsY0FBYjtBQUxUO01BT0EsSUFBRyxDQUFDLElBQUMsQ0FBQSxJQUFJLENBQUMsUUFBUCxLQUFtQixDQUF0QjtRQUNJLElBQUMsQ0FBQSxJQUFELENBQU0s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SUFBTyxrQkFBUDtRQUNJLElBQUMsQ0FBQSxLQUFLLENBQUMsTUFBUCxDQUFjLElBQWQsRUFESjtPQUFBLE1BQUE7UUFHSSxRQUFBLEdBQVcsSUFBQyxDQUFBLFNBQUQsQ0FBVyxHQUFHLENBQUMsTUFBTSxDQUFDLElBQXRCO1FBQ1gsSUFBQSxHQUFPLElBQUMsQ0FBQSxJQUFELENBQU0sV0FBQSxHQUFZLFFBQVosR0FBcUIsSUFBM0I7UUFDUCxJQUFJLENBQUMsV0FBTCxDQUFpQixJQUFqQixFQUxKOzthQU1BO0lBUk07OzJCQVVWLGlCQUFBLEdBQW1CLFNBQUMsR0FBRDtBQUNmLFVBQUE7TUFEaUIsZ0JBQU87TUFDeEIsSUFBRyxLQUFBLEtBQVMsU0FBWjtRQUNJLElBQUMsQ0FBQSxJQUFELENBQU0sVUFBTixDQUFpQixDQUFDLFdBQWxCLENBQThCLFNBQTlCO2VBQ0EsSUFBQyxDQUFBLElBQUQsQ0FBTSxhQUFOLENBQW9CLENBQUMsV0FBckIsQ0FBaUMsWUFBakMsRUFGSjs7SUFEZTs7OztLQXBESTtBQWpJM0IiLCJzb3VyY2VzQ29udGVudCI6WyJ7VmlldywgJH0gPSByZXF1aXJlICdhdG9tLXNwYWNlLXBlbi12aWV3cydcblxuY2xhc3MgVmFySXRlbVZpZXcgZXh0ZW5kcyBWaWV3XG4gICAgaW5pdGlhbGl6ZTogKEBnZGIsIEBpdGVtKSAtPlxuICAgICAgICBAaXRlbS5vbkNoYW5nZWQgPT4gQF91cGRhdGVkKClcbiAgICAgICAgQGl0ZW0ub25EZWxldGVkID0+IEBfZGVsZXRlZCgpXG4gICAgICAgIEBfdXBkYXRlZCgpXG5cbiAgICBfdXBkYXRlZDogLT5cbiAgICAgICAgc3dpdGNoIEBpdGVtLmluX3Njb3BlXG4gICAgICAgICAgICB3aGVuICdmYWxzZSdcbiAgICAgICAgICAgICAgICBAYWRkQ2xhc3MgJ291dC1vZi1zY29wZSdcbiAgICAgICAgICAgICAgICBAaXRlbS52YWx1ZSA9ICcnXG4gICAgICAgICAgICB3aGVuICdpbnZhbGlkJyB0aGVuIEBfcmVtb3ZlKClcbiAgICAgICAgICAgIGVsc2UgQHJlbW92ZUNsYXNzICdvdXQtb2Ytc2NvcGUnXG5cbiAgICAgICAgaWYgK0BpdGVtLm51bWNoaWxkICE9IDBcbiAgICAgICAgICAgIEBmaW5kKCdpbnB1dCN2YWx1ZScpLmF0dHIoJ2Rpc2FibGVkJywgdHJ1ZSlcbiAgICAgICAgICAgIEBhZGRDbGFzcygnY29sbGFwc2FibGUnKVxuICAgICAgICAgICAgaWYgbm90IEBpdGVtLmNoaWxkcmVuP1xuICAgICAgICAgICAgICAgIEBhZGRDbGFzcygnY29sbGFwc2VkJylcbiAgICAgICAgaWYgQGl0ZW0ud2F0Y2hwb2ludD9cbiAgICAgICAgICAgIEBmaW5kKCdpbnB1dCN3cC10b2dnbGUnKS5wcm9wKCdjaGVja2VkJywgdHJ1ZSlcblxuICAgICAgICB2ID0gQGZpbmQoJ2lucHV0I3ZhbHVlJylcbiAgICAgICAgaWYgdi52YWwoKSAhPSBAaXRlbS52YWx1ZVxuICAgICAgICAgICAgdi52YWwgQGl0ZW0udmFsdWVcbiAgICAgICAgICAgIHYuYWRkQ2xhc3MgJ2NoYW5nZWQnXG5cbiAgICAgICAgd3AgPSBAZmluZCgnaW5wdXQjd3AtdG9nZ2xlJylcbiAgICAgICAgd3AucHJvcCAnY2hlY2tlZCcsIEBpdGVtLndhdGNocG9pbnQ/XG4gICAgICAgIGJhZGdlID0gQGZpbmQoJy5iYWRnZScpXG4gICAgICAgIGlmIEBpdGVtLndhdGNocG9pbnQ/XG4gICAgICAgICAgICBiYWRnZS5zaG93KClcbiAgICAgICAgICAgIGlmIEBpdGVtLndhdGNocG9pbnQudGltZXMgIT0gYmFkZ2UudGV4dCgpXG4gICAgICAgICAgICAgICAgYmFkZ2UuYWRkQ2xhc3MgJ2JhZGdlLWluZm8nXG4gICAgICAgICAgICBiYWRnZS50ZXh0IEBpdGVtLndhdGNocG9pbnQudGltZXNcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgYmFkZ2UudGV4dCAnMCdcbiAgICAgICAgICAgIGJhZGdlLmhpZGUoKVxuXG4gICAgX2RlbGV0ZWQ6IC0+XG4gICAgICAgIEByZW1vdmUoKVxuXG4gICAgQGNvbnRlbnQ6IChnZGIsIGl0ZW0pIC0+XG4gICAgICAgIEB0ciBuYW1lOiBpdGVtLm5hbWUsIHBhcmVudDogaXRlbS5wYXJlbnQ/Lm5hbWUsID0+XG4gICAgICAgICAgICBAdGQgY2xhc3M6ICdleHBhbmQtY29sdW1uJywgY2xpY2s6ICd0b2dnbGVDb2xsYXBzZScsID0+XG4gICAgICAgICAgICAgICAgQHNwYW4gaXRlbS5leHAsXG4gICAgICAgICAgICAgICAgICAgIHN0eWxlOiBcIm1hcmdpbi1sZWZ0OiAje2l0ZW0ubmVzdH1lbVwiXG4gICAgICAgICAgICAgICAgQHNwYW4gJyAnXG4gICAgICAgICAgICAgICAgQHNwYW4gJzAnLCBjbGFzczogJ2JhZGdlJ1xuICAgICAgICAgICAgaWYgK2l0ZW0ubnVtY2hpbGQgPT0gMFxuICAgICAgICAgICAgICAgIEB0ZCA9PlxuICAgICAgICAgICAgICAgICAgICBAaW5wdXRcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkOiAnd3AtdG9nZ2xlJ1xuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3M6ICdpbnB1dC10b2dnbGUnXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnY2hlY2tib3gnXG4gICAgICAgICAgICAgICAgICAgICAgICBjbGljazogJ190b2dnbGVXUCdcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBAdGQoKVxuICAgICAgICAgICAgQHRkIHN0eWxlOiAnd2lkdGg6IDEwMCUnLCA9PlxuICAgICAgICAgICAgICAgIEBpbnB1dFxuICAgICAgICAgICAgICAgICAgICBpZDogJ3ZhbHVlJ1xuICAgICAgICAgICAgICAgICAgICBjbGFzczogJ2lucHV0LXRleHQgbmF0aXZlLWtleS1iaW5kaW5ncydcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGl0ZW0udmFsdWVcbiAgICAgICAgICAgICAgICAgICAgZm9jdXM6ICdfdmFsdWVGb2N1cydcbiAgICAgICAgICAgICAgICAgICAgYmx1cjogJ192YWx1ZUJsdXInXG4gICAgICAgICAgICAgICAgICAgIGtleWRvd246ICdfdmFsdWVLZXlkb3duJ1xuICAgICAgICAgICAgQHRkIGNsaWNrOiAnX3JlbW92ZScsID0+XG4gICAgICAgICAgICAgICAgQHNwYW4gY2xhc3M6ICdkZWxldGUnXG5cbiAgICBfaGlkZVRyZWU6IChpZCkgLT5cbiAgICAgICAgY2hpbGRyZW4gPSAkKHRoaXMpLnBhcmVudCgpLmZpbmQoXCJ0cltwYXJlbnQ9JyN7aWR9J11cIilcbiAgICAgICAgY2hpbGRyZW4uaGlkZSgpXG4gICAgICAgIGZvciBjaGlsZCBpbiBjaGlsZHJlblxuICAgICAgICAgICAgQF9oaWRlVHJlZSBjaGlsZC5nZXRBdHRyaWJ1dGUoJ25hbWUnKVxuXG4gICAgX3Nob3dUcmVlOiAoaWQpIC0+XG4gICAgICAgIGNoaWxkcmVuID0gJCh0aGlzKS5wYXJlbnQoKS5maW5kKFwidHJbcGFyZW50PScje2lkfSddXCIpXG4gICAgICAgIGNoaWxkcmVuLnNob3coKVxuICAgICAgICBmb3IgY2hpbGQgaW4gY2hpbGRyZW5cbiAgICAgICAgICAgICRjaGlsZCA9ICQoY2hpbGQpXG4gICAgICAgICAgICBpZiBub3QgJGNoaWxkLmhhc0NsYXNzICdjb2xsYXBzZWQnXG4gICAgICAgICAgICAgICAgQF9zaG93VHJlZSAkY2hpbGQuYXR0ciAnbmFtZSdcblxuICAgIF9yZW1vdmU6IC0+XG4gICAgICAgIEBpdGVtLnJlbW92ZSgpXG5cbiAgICBfdG9nZ2xlV1A6IChldikgLT5cbiAgICAgICAgaWYgZXYudGFyZ2V0LmNoZWNrZWRcbiAgICAgICAgICAgIEBpdGVtLnNldFdhdGNoKClcbiAgICAgICAgICAgICAgICAuY2F0Y2ggKGVycikgLT5cbiAgICAgICAgICAgICAgICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEVycm9yIGVyci50b1N0cmluZygpXG4gICAgICAgICAgICAgICAgICAgIGV2LnRhcmdldC5jaGVja2VkID0gZmFsc2VcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQGl0ZW0uY2xlYXJXYXRjaCgpXG4gICAgICAgICAgICAgICAgLmNhdGNoIChlcnIpIC0+XG4gICAgICAgICAgICAgICAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRFcnJvciBlcnIudG9TdHJpbmcoKVxuICAgICAgICAgICAgICAgICAgICBldi50YXJnZXQuY2hlY2tlZCA9IHRydWVcblxuICAgIHRvZ2dsZUNvbGxhcHNlOiAtPlxuICAgICAgICBpZiBAaGFzQ2xhc3MgJ2NvbGxhcHNhYmxlJ1xuICAgICAgICAgICAgQHRvZ2dsZUNsYXNzICdjb2xsYXBzZWQnXG4gICAgICAgICAgICBpZiBAaGFzQ2xhc3MgJ2NvbGxhcHNlZCdcbiAgICAgICAgICAgICAgICBAX2hpZGVUcmVlIEBpdGVtLm5hbWVcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBpZiBub3QgQGl0ZW0uY2hpbGRyZW4/XG4gICAgICAgICAgICAgICAgICAgIEBpdGVtLmFkZENoaWxkcmVuKClcbiAgICAgICAgICAgICAgICBAX3Nob3dUcmVlIEBpdGVtLm5hbWVcblxuICAgIF92YWx1ZUZvY3VzOiAoZXYpIC0+XG4gICAgICAgIGV2LnRhcmdldC5vbGRWYWx1ZSA9IGV2LnRhcmdldC52YWx1ZVxuICAgICAgICBldi50YXJnZXQuc2VsZWN0KClcbiAgICBfdmFsdWVCbHVyOiAoZXYpIC0+XG4gICAgICAgIGV2LnRhcmdldC52YWx1ZSA9IGV2LnRhcmdldC5vbGRWYWx1ZVxuICAgIF92YWx1ZUtleWRvd246IChldikgLT5cbiAgICAgICAgc3dpdGNoIGV2LmtleUNvZGVcbiAgICAgICAgICAgIHdoZW4gMTMgIyBFbnRlclxuICAgICAgICAgICAgICAgIEBpdGVtLmFzc2lnbiBldi50YXJnZXQudmFsdWVcbiAgICAgICAgICAgICAgICAgICAgLnRoZW4gKHZhbCkgLT5cbiAgICAgICAgICAgICAgICAgICAgICAgIGV2LnRhcmdldC5vbGRWYWx1ZSA9IGV2LnRhcmdldC52YWx1ZSA9IHZhbFxuICAgICAgICAgICAgICAgICAgICAgICAgZXYudGFyZ2V0LmJsdXIoKVxuICAgICAgICAgICAgICAgICAgICAuY2F0Y2ggKGVycikgLT5cbiAgICAgICAgICAgICAgICAgICAgICAgIGV2LnRhcmdldC5ibHVyKClcbiAgICAgICAgICAgICAgICAgICAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRFcnJvciBlcnIudG9TdHJpbmcoKVxuICAgICAgICAgICAgd2hlbiAyNyAjIEVzY2FwZVxuICAgICAgICAgICAgICAgIGV2LnRhcmdldC5ibHVyKClcblxubW9kdWxlLmV4cG9ydHMgPVxuY2xhc3MgVmFyV2F0Y2hWaWV3IGV4dGVuZHMgVmlld1xuICAgIGluaXRpYWxpemU6IChAZ2RiKSAtPlxuICAgICAgICBAdmFydmlld3MgPSB7fVxuICAgICAgICBAZ2RiLnZhcnMub2JzZXJ2ZSBAX2FkZEl0ZW0uYmluZCh0aGlzKVxuICAgICAgICBAZ2RiLmV4ZWMub25TdGF0ZUNoYW5nZWQgQF9leGVjU3RhdGVDaGFuZ2VkLmJpbmQodGhpcylcblxuICAgIEBjb250ZW50OiAoZ2RiKSAtPlxuICAgICAgICBAZGl2IGNsYXNzOiAndmFyLXdhdGNoLXZpZXcnLCA9PlxuICAgICAgICAgICAgQGRpdiBjbGFzczogJ2Jsb2NrJywgPT5cbiAgICAgICAgICAgICAgICBAbGFiZWwgJ0FkZCBleHByZXNzaW9uIHRvIHdhdGNoOidcbiAgICAgICAgICAgICAgICBAaW5wdXRcbiAgICAgICAgICAgICAgICAgICAgY2xhc3M6ICdpbnB1dC10ZXh0YXJlYSBuYXRpdmUta2V5LWJpbmRpbmdzJ1xuICAgICAgICAgICAgICAgICAgICBrZXlwcmVzczogJ19hZGRFeHByJ1xuICAgICAgICAgICAgICAgICAgICBvdXRsZXQ6ICdleHByJ1xuICAgICAgICAgICAgQGRpdiBjbGFzczogJ2Jsb2NrJywgPT5cbiAgICAgICAgICAgICAgICBAZGl2IGNsYXNzOiAnZXJyb3ItbWVzc2FnZScsIG91dGxldDogJ2Vycm9yJ1xuICAgICAgICAgICAgQGRpdiBjbGFzczogJ2Jsb2NrJywgPT5cbiAgICAgICAgICAgICAgICBAZGl2IGNsYXNzOiAndmFyLXdhdGNoLXRyZWUnLCA9PlxuICAgICAgICAgICAgICAgICAgICBAdGFibGUgb3V0bGV0OiAndGFibGUnLCA9PlxuICAgICAgICAgICAgICAgICAgICAgICAgQHRyID0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQHRoICdFeHByZXNzaW9uJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEB0aCAnV1AnLCBzdHlsZTogJ3RleHQtYWxpZ246IGNlbnRlcidcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBAdGggJ1ZhbHVlJ1xuXG4gICAgZ2V0VGl0bGU6IC0+ICdXYXRjaCBWYXJpYWJsZXMnXG5cbiAgICBfYWRkRXhwcjogKGV2KSAtPlxuICAgICAgICBpZiBldi5jaGFyQ29kZSAhPSAxMyB0aGVuIHJldHVyblxuICAgICAgICBAZ2RiLnZhcnMuYWRkIEBleHByLnZhbCgpXG4gICAgICAgICAgICAudGhlbiA9PlxuICAgICAgICAgICAgICAgIEBlcnJvci50ZXh0ICcnXG4gICAgICAgICAgICAuY2F0Y2ggKGVycikgPT5cbiAgICAgICAgICAgICAgICBAZXJyb3IudGV4dCBlcnJcbiAgICAgICAgQGV4cHIudmFsICcnXG5cbiAgICBfZmluZExhc3Q6IChuYW1lKSAtPlxuICAgICAgICBjaGlsZHJlbiA9IEBmaW5kKFwidHJbcGFyZW50PScje25hbWV9J11cIilcbiAgICAgICAgaWYgY2hpbGRyZW4ubGVuZ3RoXG4gICAgICAgICAgICBuZXh0TmFtZSA9IGNoaWxkcmVuW2NoaWxkcmVuLmxlbmd0aC0xXS5nZXRBdHRyaWJ1dGUoJ25hbWUnKVxuICAgICAgICAgICAgcmV0dXJuIEBfZmluZExhc3QgbmV4dE5hbWVcbiAgICAgICAgcmV0dXJuIG5hbWVcblxuICAgIF9hZGRJdGVtOiAodmFsKSAtPlxuICAgICAgICB2aWV3ID0gbmV3IFZhckl0ZW1WaWV3KEBnZGIsIHZhbClcbiAgICAgICAgaWYgbm90IHZhbC5wYXJlbnQ/XG4gICAgICAgICAgICBAdGFibGUuYXBwZW5kIHZpZXdcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgbGFzdE5hbWUgPSBAX2ZpbmRMYXN0IHZhbC5wYXJlbnQubmFtZVxuICAgICAgICAgICAgbGFzdCA9IEBmaW5kKFwidHJbbmFtZT0nI3tsYXN0TmFtZX0nXVwiKVxuICAgICAgICAgICAgdmlldy5pbnNlcnRBZnRlciBsYXN0XG4gICAgICAgIHZpZXdcblxuICAgIF9leGVjU3RhdGVDaGFuZ2VkOiAoW3N0YXRlLCBmcmFtZV0pIC0+XG4gICAgICAgIGlmIHN0YXRlID09ICdSVU5OSU5HJ1xuICAgICAgICAgICAgQGZpbmQoJy5jaGFuZ2VkJykucmVtb3ZlQ2xhc3MgJ2NoYW5nZWQnXG4gICAgICAgICAgICBAZmluZCgnLmJhZGdlLWluZm8nKS5yZW1vdmVDbGFzcygnYmFkZ2UtaW5mbycpXG4iXX0=
