(function() {
  var $, $$, ThreadStackView, View, formatFrame, ref,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  ref = require('atom-space-pen-views'), View = ref.View, $ = ref.$, $$ = ref.$$;

  formatFrame = require('./utils').formatFrame;

  module.exports = ThreadStackView = (function(superClass) {
    extend(ThreadStackView, superClass);

    function ThreadStackView() {
      return ThreadStackView.__super__.constructor.apply(this, arguments);
    }

    ThreadStackView.prototype.initialize = function(gdb) {
      this.gdb = gdb;
      return this.gdb.exec.onStateChanged((function(_this) {
        return function(arg) {
          var frame, state;
          state = arg[0], frame = arg[1];
          if (state === 'STOPPED') {
            return _this.update();
          } else {
            return _this.empty();
          }
        };
      })(this));
    };

    ThreadStackView.content = function() {
      return this.div({
        id: 'backtrace'
      });
    };

    ThreadStackView.prototype.renderThreads = function(threads, selected) {
      var view;
      view = $$(function() {
        return this.ul({
          "class": 'list-tree has-collapsable-children'
        }, (function(_this) {
          return function() {
            var i, len, results, thread;
            results = [];
            for (i = 0, len = threads.length; i < len; i++) {
              thread = threads[i];
              results.push(_this.li({
                "class": 'list-nested-item collapsed',
                'thread-id': thread.id
              }, function() {
                return _this.div({
                  "class": 'list-item'
                }, function() {
                  return _this.span(thread['target-id']);
                });
              }));
            }
            return results;
          };
        })(this));
      });
      if (selected != null) {
        view.find("li[thread-id=" + selected + "]").addClass('selected');
      }
      view.find("li>div").on('click', (function(_this) {
        return function(ev) {
          var li, thread;
          li = $(ev.currentTarget).parent();
          if (!li.hasClass('selected')) {
            _this.find('li.selected').removeClass('selected');
            li.addClass('selected');
            li.find('li[frame-id="0"]').addClass('selected');
          }
          li.toggleClass('collapsed');
          if (!li.hasClass('collapsed') && li.find('ul').length === 0) {
            thread = li.attr('thread-id');
            return _this.gdb.exec.getFrames(thread).then(function(frames) {
              return li.append(_this.renderFrames(frames));
            });
          }
        };
      })(this));
      return view;
    };

    ThreadStackView.prototype.renderFrames = function(frames, selected) {
      var view;
      view = $$(function() {
        return this.ul({
          "class": 'list-tree'
        }, (function(_this) {
          return function() {
            var frame, i, len, results;
            results = [];
            for (i = 0, len = frames.length; i < len; i++) {
              frame = frames[i];
              results.push(_this.li({
                "class": 'list-nested-item collapsed',
                'frame-id': frame.level
              }, function() {
                return _this.div({
                  "class": 'list-item'
                }, function() {
                  return _this.span(formatFrame(frame));
                });
              }));
            }
            return results;
          };
        })(this));
      });
      if (selected != null) {
        view.find("li[frame-id=" + selected + "]").addClass('selected');
      }
      view.find("li>div").on('click', (function(_this) {
        return function(ev) {
          var frame, li, thread;
          li = $(ev.currentTarget).parent();
          li.toggleClass('collapsed');
          thread = li.parent().closest('li').attr('thread-id');
          frame = li.attr('frame-id');
          if (!li.hasClass('selected')) {
            _this.find('li.selected').removeClass('selected');
            li.addClass('selected');
            li.parent().closest('li').addClass('selected');
            _this.gdb.exec.selectFrame(frame, thread);
          }
          if (!li.hasClass('collapsed') && li.find('ul').length === 0) {
            return _this.gdb.exec.getLocals(frame, thread).then(function(locals) {
              return li.append(_this.renderLocals(locals));
            });
          }
        };
      })(this));
      return view;
    };

    ThreadStackView.prototype.renderLocals = function(locals) {
      var view;
      view = $$(function() {
        return this.ul({
          "class": 'list-tree'
        }, (function(_this) {
          return function() {
            var i, len, name, ref1, results, value;
            results = [];
            for (i = 0, len = locals.length; i < len; i++) {
              ref1 = locals[i], name = ref1.name, value = ref1.value;
              results.push(_this.li({
                "class": 'list-item locals',
                'data-name': name
              }, function() {
                return _this.span(name + " = " + value);
              }));
            }
            return results;
          };
        })(this));
      });
      view.find('li').on('dblclick', (function(_this) {
        return function(ev) {
          var exp, frame, li, thread;
          li = $(ev.currentTarget);
          exp = li.attr('data-name');
          li = li.parent().closest('li');
          frame = li.attr('frame-id');
          li = li.parent().closest('li');
          thread = li.attr('thread-id');
          return _this.gdb.vars.add(exp, frame, thread);
        };
      })(this));
      return view;
    };

    ThreadStackView.prototype.update = function() {
      this.empty();
      return this.gdb.exec.getThreads().then((function(_this) {
        return function(threads) {
          if (_this.selectedThread == null) {
            _this.selectedThread = threads[0].id;
          }
          _this.append(_this.renderThreads(threads, _this.selectedThread));
          return _this.gdb.exec.getFrames(_this.selectedThread);
        };
      })(this)).then((function(_this) {
        return function(frames) {
          _this.selectedFrame = 0;
          _this.find("li[thread-id=" + _this.selectedThread + "]").removeClass('collapsed').append(_this.renderFrames(frames, _this.selectedFrame));
          return _this.gdb.exec.getLocals(_this.selectedFrame, _this.selectedThread);
        };
      })(this)).then((function(_this) {
        return function(locals) {
          return _this.find("li[thread-id=" + _this.selectedThread + "] li[frame-id=" + _this.selectedFrame + "]").removeClass('collapsed').append(_this.renderLocals(locals));
        };
      })(this));
    };

    return ThreadStackView;

  })(View);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbGVhcm4vLmF0b20vcGFja2FnZXMvYXRvbS1nZGItZGVidWdnZXIvbGliL3RocmVhZC1zdGFjay12aWV3LmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsOENBQUE7SUFBQTs7O0VBQUEsTUFBZ0IsT0FBQSxDQUFRLHNCQUFSLENBQWhCLEVBQUMsZUFBRCxFQUFPLFNBQVAsRUFBVTs7RUFDVCxjQUFlLE9BQUEsQ0FBUSxTQUFSOztFQUVoQixNQUFNLENBQUMsT0FBUCxHQUNNOzs7Ozs7OzhCQUNGLFVBQUEsR0FBWSxTQUFDLEdBQUQ7TUFBQyxJQUFDLENBQUEsTUFBRDthQUNULElBQUMsQ0FBQSxHQUFHLENBQUMsSUFBSSxDQUFDLGNBQVYsQ0FBeUIsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFDLEdBQUQ7QUFDckIsY0FBQTtVQUR1QixnQkFBTztVQUM5QixJQUFHLEtBQUEsS0FBUyxTQUFaO21CQUNJLEtBQUMsQ0FBQSxNQUFELENBQUEsRUFESjtXQUFBLE1BQUE7bUJBR0ksS0FBQyxDQUFBLEtBQUQsQ0FBQSxFQUhKOztRQURxQjtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBekI7SUFEUTs7SUFPWixlQUFDLENBQUEsT0FBRCxHQUFVLFNBQUE7YUFDTixJQUFDLENBQUEsR0FBRCxDQUFLO1FBQUEsRUFBQSxFQUFJLFdBQUo7T0FBTDtJQURNOzs4QkFHVixhQUFBLEdBQWUsU0FBQyxPQUFELEVBQVUsUUFBVjtBQUNYLFVBQUE7TUFBQSxJQUFBLEdBQU8sRUFBQSxDQUFHLFNBQUE7ZUFDTixJQUFDLENBQUEsRUFBRCxDQUFJO1VBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxvQ0FBUDtTQUFKLEVBQWlELENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUE7QUFDN0MsZ0JBQUE7QUFBQTtpQkFBQSx5Q0FBQTs7MkJBQ0ksS0FBQyxDQUFBLEVBQUQsQ0FBSTtnQkFBQSxD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SSxDQUFDLE1BRkwsQ0FFWSxLQUFDLENBQUEsWUFBRCxDQUFjLE1BQWQsQ0FGWjtRQURFO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQVhWO0lBRkk7Ozs7S0EzRWtCO0FBSjlCIiwic291cmNlc0NvbnRlbnQiOlsie1ZpZXcsICQsICQkfSA9IHJlcXVpcmUgJ2F0b20tc3BhY2UtcGVuLXZpZXdzJ1xue2Zvcm1hdEZyYW1lfSA9IHJlcXVpcmUgJy4vdXRpbHMnXG5cbm1vZHVsZS5leHBvcnRzID1cbmNsYXNzIFRocmVhZFN0YWNrVmlldyBleHRlbmRzIFZpZXdcbiAgICBpbml0aWFsaXplOiAoQGdkYikgLT5cbiAgICAgICAgQGdkYi5leGVjLm9uU3RhdGVDaGFuZ2VkIChbc3RhdGUsIGZyYW1lXSkgPT5cbiAgICAgICAgICAgIGlmIHN0YXRlID09ICdTVE9QUEVEJ1xuICAgICAgICAgICAgICAgIEB1cGRhdGUoKVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEBlbXB0eSgpXG5cbiAgICBAY29udGVudDogLT5cbiAgICAgICAgQGRpdiBpZDogJ2JhY2t0cmFjZSdcblxuICAgIHJlbmRlclRocmVhZHM6ICh0aHJlYWRzLCBzZWxlY3RlZCkgLT5cbiAgICAgICAgdmlldyA9ICQkIC0+XG4gICAgICAgICAgICBAdWwgY2xhc3M6ICdsaXN0LXRyZWUgaGFzLWNvbGxhcHNhYmxlLWNoaWxkcmVuJywgPT5cbiAgICAgICAgICAgICAgICBmb3IgdGhyZWFkIGluIHRocmVhZHNcbiAgICAgICAgICAgICAgICAgICAgQGxpIGNsYXNzOiAnbGlzdC1uZXN0ZWQtaXRlbSBjb2xsYXBzZWQnLCAndGhyZWFkLWlkJzogdGhyZWFkLmlkLCA9PlxuICAgICAgICAgICAgICAgICAgICAgICAgQGRpdiBjbGFzczogJ2xpc3QtaXRlbScsID0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQHNwYW4gdGhyZWFkWyd0YXJnZXQtaWQnXVxuICAgICAgICBpZiBzZWxlY3RlZD9cbiAgICAgICAgICAgIHZpZXcuZmluZChcImxpW3RocmVhZC1pZD0je3NlbGVjdGVkfV1cIikuYWRkQ2xhc3MgJ3NlbGVjdGVkJ1xuICAgICAgICB2aWV3LmZpbmQoXCJsaT5kaXZcIikub24gJ2NsaWNrJywgKGV2KSA9PlxuICAgICAgICAgICAgbGkgPSAkKGV2LmN1cnJlbnRUYXJnZXQpLnBhcmVudCgpXG4gICAgICAgICAgICBpZiBub3QgbGkuaGFzQ2xhc3MgJ3NlbGVjdGVkJ1xuICAgICAgICAgICAgICAgIEBmaW5kKCdsaS5zZWxlY3RlZCcpLnJlbW92ZUNsYXNzICdzZWxlY3RlZCdcbiAgICAgICAgICAgICAgICBsaS5hZGRDbGFzcyAnc2VsZWN0ZWQnXG4gICAgICAgICAgICAgICAgbGkuZmluZCgnbGlbZnJhbWUtaWQ9XCIwXCJdJykuYWRkQ2xhc3MgJ3NlbGVjdGVkJ1xuICAgICAgICAgICAgbGkudG9nZ2xlQ2xhc3MgJ2NvbGxhcHNlZCdcbiAgICAgICAgICAgIGlmIG5vdCBsaS5oYXNDbGFzcygnY29sbGFwc2VkJykgYW5kIGxpLmZpbmQoJ3VsJykubGVuZ3RoID09IDBcbiAgICAgICAgICAgICAgICB0aHJlYWQgPSBsaS5hdHRyICd0aHJlYWQtaWQnXG4gICAgICAgICAgICAgICAgQGdkYi5leGVjLmdldEZyYW1lcyB0aHJlYWRcbiAgICAgICAgICAgICAgICAgICAgLnRoZW4gKGZyYW1lcykgPT5cbiAgICAgICAgICAgICAgICAgICAgICAgIGxpLmFwcGVuZCBAcmVuZGVyRnJhbWVzIGZyYW1lc1xuICAgICAgICB2aWV3XG5cbiAgICByZW5kZXJGcmFtZXM6IChmcmFtZXMsIHNlbGVjdGVkKSAtPlxuICAgICAgICB2aWV3ID0gJCQgLT5cbiAgICAgICAgICAgIEB1bCBjbGFzczogJ2xpc3QtdHJlZScsID0+XG4gICAgICAgICAgICAgICAgZm9yIGZyYW1lIGluIGZyYW1lc1xuICAgICAgICAgICAgICAgICAgICBAbGkgY2xhc3M6ICdsaXN0LW5lc3RlZC1pdGVtIGNvbGxhcHNlZCcsICdmcmFtZS1pZCc6IGZyYW1lLmxldmVsLCA9PlxuICAgICAgICAgICAgICAgICAgICAgICAgQGRpdiBjbGFzczogJ2xpc3QtaXRlbScsID0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQHNwYW4gZm9ybWF0RnJhbWUoZnJhbWUpXG4gICAgICAgIGlmIHNlbGVjdGVkP1xuICAgICAgICAgICAgdmlldy5maW5kKFwibGlbZnJhbWUtaWQ9I3tzZWxlY3RlZH1dXCIpLmFkZENsYXNzICdzZWxlY3RlZCdcbiAgICAgICAgdmlldy5maW5kKFwibGk+ZGl2XCIpLm9uICdjbGljaycsIChldikgPT5cbiAgICAgICAgICAgIGxpID0gJChldi5jdXJyZW50VGFyZ2V0KS5wYXJlbnQoKVxuICAgICAgICAgICAgbGkudG9nZ2xlQ2xhc3MgJ2NvbGxhcHNlZCdcbiAgICAgICAgICAgIHRocmVhZCA9IGxpLnBhcmVudCgpLmNsb3Nlc3QoJ2xpJykuYXR0ciAndGhyZWFkLWlkJ1xuICAgICAgICAgICAgZnJhbWUgPSBsaS5hdHRyICdmcmFtZS1pZCdcbiAgICAgICAgICAgIGlmIG5vdCBsaS5oYXNDbGFzcyAnc2VsZWN0ZWQnXG4gICAgICAgICAgICAgICAgQGZpbmQoJ2xpLnNlbGVjdGVkJykucmVtb3ZlQ2xhc3MgJ3NlbGVjdGVkJ1xuICAgICAgICAgICAgICAgIGxpLmFkZENsYXNzICdzZWxlY3RlZCdcbiAgICAgICAgICAgICAgICBsaS5wYXJlbnQoKS5jbG9zZXN0KCdsaScpLmFkZENsYXNzICdzZWxlY3RlZCdcbiAgICAgICAgICAgICAgICBAZ2RiLmV4ZWMuc2VsZWN0RnJhbWUgZnJhbWUsIHRocmVhZFxuICAgICAgICAgICAgaWYgbm90IGxpLmhhc0NsYXNzKCdjb2xsYXBzZWQnKSBhbmQgbGkuZmluZCgndWwnKS5sZW5ndGggPT0gMFxuICAgICAgICAgICAgICAgIEBnZGIuZXhlYy5nZXRMb2NhbHMgZnJhbWUsIHRocmVhZFxuICAgICAgICAgICAgICAgICAgICAudGhlbiAobG9jYWxzKSA9PlxuICAgICAgICAgICAgICAgICAgICAgICAgbGkuYXBwZW5kIEByZW5kZXJMb2NhbHMgbG9jYWxzXG4gICAgICAgIHZpZXdcblxuICAgIHJlbmRlckxvY2FsczogKGxvY2FscykgLT5cbiAgICAgICAgdmlldyA9ICQkIC0+XG4gICAgICAgICAgICBAdWwgY2xhc3M6ICdsaXN0LXRyZWUnLCA9PlxuICAgICAgICAgICAgICAgIGZvciB7bmFtZSwgdmFsdWV9IGluIGxvY2Fsc1xuICAgICAgICAgICAgICAgICAgICBAbGkgY2xhc3M6ICdsaXN0LWl0ZW0gbG9jYWxzJywgJ2RhdGEtbmFtZSc6IG5hbWUsID0+XG4gICAgICAgICAgICAgICAgICAgICAgICBAc3BhbiBcIiN7bmFtZX0gPSAje3ZhbHVlfVwiXG4gICAgICAgIHZpZXcuZmluZCgnbGknKS5vbiAnZGJsY2xpY2snLCAoZXYpID0+XG4gICAgICAgICAgICBsaSA9ICQoZXYuY3VycmVudFRhcmdldClcbiAgICAgICAgICAgIGV4cCA9IGxpLmF0dHIgJ2RhdGEtbmFtZSdcbiAgICAgICAgICAgIGxpID0gbGkucGFyZW50KCkuY2xvc2VzdCgnbGknKVxuICAgICAgICAgICAgZnJhbWUgPSBsaS5hdHRyICdmcmFtZS1pZCdcbiAgICAgICAgICAgIGxpID0gbGkucGFyZW50KCkuY2xvc2VzdCgnbGknKVxuICAgICAgICAgICAgdGhyZWFkID0gbGkuYXR0ciAndGhyZWFkLWlkJ1xuICAgICAgICAgICAgQGdkYi52YXJzLmFkZCBleHAsIGZyYW1lLCB0aHJlYWRcbiAgICAgICAgdmlld1xuXG4gICAgdXBkYXRlOiAtPlxuICAgICAgICBAZW1wdHkoKVxuICAgICAgICBAZ2RiLmV4ZWMuZ2V0VGhyZWFkcygpXG4gICAgICAgICAgICAudGhlbiAodGhyZWFkcykgPT5cbiAgICAgICAgICAgICAgICBAc2VsZWN0ZWRUaHJlYWQgPz0gdGhyZWFkc1swXS5pZFxuICAgICAgICAgICAgICAgIEBhcHBlbmQgQHJlbmRlclRocmVhZHMgdGhyZWFkcywgQHNlbGVjdGVkVGhyZWFkXG4gICAgICAgICAgICAgICAgQGdkYi5leGVjLmdldEZyYW1lcyBAc2VsZWN0ZWRUaHJlYWRcbiAgICAgICAgICAgIC50aGVuIChmcmFtZXMpID0+XG4gICAgICAgICAgICAgICAgQHNlbGVjdGVkRnJhbWUgPSAwXG4gICAgICAgICAgICAgICAgQGZpbmQoXCJsaVt0aHJlYWQtaWQ9I3tAc2VsZWN0ZWRUaHJlYWR9XVwiKVxuICAgICAgICAgICAgICAgICAgICAucmVtb3ZlQ2xhc3MgJ2NvbGxhcHNlZCdcbiAgICAgICAgICAgICAgICAgICAgLmFwcGVuZCBAcmVuZGVyRnJhbWVzIGZyYW1lcywgQHNlbGVjdGVkRnJhbWVcbiAgICAgICAgICAgICAgICBAZ2RiLmV4ZWMuZ2V0TG9jYWxzIEBzZWxlY3RlZEZyYW1lLCBAc2VsZWN0ZWRUaHJlYWRcbiAgICAgICAgICAgIC50aGVuIChsb2NhbHMpID0+XG4gICAgICAgICAgICAgICAgQGZpbmQoXCJsaVt0aHJlYWQtaWQ9I3tAc2VsZWN0ZWRUaHJlYWR9XSBsaVtmcmFtZS1pZD0je0BzZWxlY3RlZEZyYW1lfV1cIilcbiAgICAgICAgICAgICAgICAgICAgLnJlbW92ZUNsYXNzICdjb2xsYXBzZWQnXG4gICAgICAgICAgICAgICAgICAgIC5hcHBlbmQgQHJlbmRlckxvY2FscyBsb2NhbHNcbiJdfQ==
