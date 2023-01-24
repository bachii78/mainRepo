(function() {
  var CompositeDisposable, Emitter, Toolbar, ref;

  ref = require('atom'), CompositeDisposable = ref.CompositeDisposable, Emitter = ref.Emitter;

  module.exports = Toolbar = (function() {
    function Toolbar(bugger) {
      var buttonGroup, buttonToolbar, createSvgIcon, optionGroup, svg;
      this.subscriptions = new CompositeDisposable();
      this.emitter = new Emitter();
      this.bugger = bugger;
      this.element = document.createElement('div');
      this.element.classList.add('debug-toolbar', 'tool-panel');
      this.showHints = true;
      svg = document.createElement('div');
      svg.innerHTML = '<svg xmlns:xlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg" version="1.1" style="display:none">\n	<symbol id="debug-symbol-step-over" viewbox="0 0 17 19">\n		<circle cx="8" cy="6" r="3"></circle>\n		<polygon points="17,14 12,9 12,19"></polygon>\n		<rect x="0" y="12" width="13" height="4"></rect>\n	</symbol>\n	<symbol id="debug-symbol-step-in" viewBox="0 0 17 19">\n		<circle cx="9" cy="5" r="3"></circle>\n		<polygon points="9,10 14,15 4,15"></polygon>\n		<rect x="7" y="15" width="4" height="6"></rect>\n	</symbol>\n	<symbol id="debug-symbol-step-out" viewBox="0 0 17 19">\n		<circle cx="9" cy="5" r="3"></circle>\n		<polygon points="9,19 14,14 4,14"></polygon>\n		<rect x="7" y="10" width="4" height="6"></rect>\n	</symbol>\n</svg>';
      this.element.appendChild(svg);
      createSvgIcon = function(iconName) {
        var icon, iconUse, svgNamespace, xlinkNamespace, xmlnsNamespace;
        svgNamespace = 'http://www.w3.org/2000/svg';
        xlinkNamespace = 'http://www.w3.org/1999/xlink';
        xmlnsNamespace = 'http://www.w3.org/2000/xmlns/';
        icon = document.createElementNS(svgNamespace, 'svg');
        icon.setAttributeNS('http://www.w3.org/2000/xmlns/', 'xmlns', svgNamespace);
        icon.setAttributeNS('http://www.w3.org/2000/xmlns/', 'xmlns', 'xmlns:xlink', xlinkNamespace);
        icon.classList.add('icon');
        iconUse = document.createElementNS(svgNamespace, 'use');
        iconUse.setAttributeNS(xlinkNamespace, 'xlink:href', '#' + iconName);
        icon.appendChild(iconUse);
        return icon;
      };
      this.options = document.createElement('div');
      this.options.classList.add('options');
      this.element.appendChild(this.options);
      buttonToolbar = document.createElement('div');
      buttonToolbar.classList.add('btn-toolbar');
      this.element.appendChild(buttonToolbar);
      optionGroup = document.createElement('div');
      optionGroup.classList.add('btn-group');
      optionGroup.classList.add('options');
      buttonToolbar.appendChild(optionGroup);
      this.buttonHints = document.createElement('button');
      this.buttonHints.classList.add('btn', 'icon', 'icon-comment', 'selected');
      this.buttonHints.addEventListener('click', (function(_this) {
        return function() {
          return _this.bugger.ui.setShowHints(!_this.bugger.ui.showHints);
        };
      })(this));
      this.subscriptions.add(atom.tooltips.add(this.buttonHints, {
        title: 'Show inline hints'
      }));
      optionGroup.appendChild(this.buttonHints);
      this.bugger.ui.emitter.on('setShowHints', (function(_this) {
        return function(set) {
          return _this.buttonHints.classList.toggle('selected', set);
        };
      })(this));
      optionGroup = document.createElement('div');
      optionGroup.classList.add('btn-group');
      optionGroup.classList.add('options');
      buttonToolbar.appendChild(optionGroup);
      this.buttonToggleStack = document.createElement('button');
      this.buttonToggleStack.classList.add('btn', 'icon', 'icon-steps');
      this.buttonToggleStack.addEventListener('click', (function(_this) {
        return function() {
          return _this.bugger.stackList.toggle();
        };
      })(this));
      this.bugger.stackList.emitter.on('shown', (function(_this) {
        return function() {
          return _this.buttonToggleStack.classList.add('selected');
        };
      })(this));
      this.bugger.stackList.emitter.on('hidden', (function(_this) {
        return function() {
          return _this.buttonToggleStack.classList.remove('selected');
        };
      })(this));
      this.subscriptions.add(atom.tooltips.add(this.buttonToggleStack, {
        title: 'Show stack list'
      }));
      optionGroup.appendChild(this.buttonToggleStack);
      this.buttonToggleVariables = document.createElement('button');
      this.buttonToggleVariables.classList.add('btn', 'icon', 'icon-list-unordered');
      this.buttonToggleVariables.addEventListener('click', (function(_this) {
        return function() {
          return _this.bugger.variableList.toggle();
        };
      })(this));
      this.bugger.variableList.emitter.on('shown', (function(_this) {
        return function() {
          return _this.buttonToggleVariables.classList.add('selected');
        };
      })(this));
      this.bugger.variableList.emitter.on('hidden', (function(_this) {
        return function() {
          return _this.buttonToggleVariables.classList.remove('selected');
        };
      })(this));
      this.subscriptions.add(atom.tooltips.add(this.buttonToggleVariables, {
        title: 'Show variables'
      }));
      optionGroup.appendChild(this.buttonToggleVariables);
      this.buttonToggleBreakpoints = document.createElement('button');
      this.buttonToggleBreakpoints.classList.add('btn', 'icon', 'icon-stop');
      this.buttonToggleBreakpoints.addEventListener('click', (function(_this) {
        return function() {
          return _this.bugger.breakpointList.toggle();
        };
      })(this));
      this.bugger.breakpointList.emitter.on('shown', (function(_this) {
        return function() {
          return _this.buttonToggleBreakpoints.classList.add('selected');
        };
      })(this));
      this.bugger.breakpointList.emitter.on('hidden', (function(_this) {
        return function() {
          return _this.buttonToggleBreakpoints.classList.remove('selected');
        };
      })(this));
      this.subscriptions.add(atom.tooltips.add(this.buttonToggleBreakpoints, {
        title: 'Show breakpoints'
      }));
      optionGroup.appendChild(this.buttonToggleBreakpoints);
      buttonGroup = document.createElement('div');
      buttonGroup.classList.add('btn-group');
      buttonToolbar.appendChild(buttonGroup);
      this.buttonPlay = document.createElement('button');
      this.buttonPlay.classList.add('btn', 'icon', 'icon-playback-play');
      this.buttonPlay.addEventListener('click', function() {
        return bugger["continue"]();
      });
      this.subscriptions.add(atom.tooltips.add(this.buttonPlay, {
        title: 'Continue'
      }));
      buttonGroup.appendChild(this.buttonPlay);
      this.buttonPause = document.createElement('button');
      this.buttonPause.classList.add('btn', 'icon', 'icon-playback-pause');
      this.buttonPause.addEventListener('click', function() {
        return bugger.pause();
      });
      this.subscriptions.add(atom.tooltips.add(this.buttonPause, {
        title: 'Pause'
      }));
      buttonGroup.appendChild(this.buttonPause);
      this.buttonStop = document.createElement('button');
      this.buttonStop.classList.add('btn', 'icon', 'icon-primitive-square');
      this.buttonStop.addEventListener('click', function() {
        return bugger.stop();
      });
      this.subscriptions.add(atom.tooltips.add(this.buttonStop, {
        title: 'Stop debugging'
      }));
      buttonGroup.appendChild(this.buttonStop);
      buttonGroup = document.createElement('div');
      buttonGroup.classList.add('btn-group');
      buttonToolbar.appendChild(buttonGroup);
      this.buttonStepOver = document.createElement('button');
      this.buttonStepOver.classList.add('btn');
      this.buttonStepOver.addEventListener('click', function() {
        return bugger.stepOver();
      });
      this.buttonStepOver.appendChild(createSvgIcon('debug-symbol-step-over'));
      this.subscriptions.add(atom.tooltips.add(this.buttonStepOver, {
        title: 'Step over'
      }));
      buttonGroup.appendChild(this.buttonStepOver);
      this.buttonStepIn = document.createElement('button');
      this.buttonStepIn.classList.add('btn');
      this.buttonStepIn.addEventListener('click', function() {
        return bugger.stepIn();
      });
      this.buttonStepIn.appendChild(createSvgIcon('debug-symbol-step-in'));
      this.subscriptions.add(atom.tooltips.add(this.buttonStepIn, {
        title: 'Step into'
      }));
      buttonGroup.appendChild(this.buttonStepIn);
      this.buttonStepOut = document.createElement('button');
      this.buttonStepOut.classList.add('btn', this.buttonStepOut.addEventListener('click', function() {
        return bugger.stepOut();
      }));
      this.buttonStepOut.appendChild(createSvgIcon('debug-symbol-step-out'));
      this.subscriptions.add(atom.tooltips.add(this.buttonStepOut, {
        title: 'Step out'
      }));
      buttonGroup.appendChild(this.buttonStepOut);
      this.updateButtons();
    }

    Toolbar.prototype.destroy = function() {
      this.subscriptions.dispose();
      return this.element.remove();
    };

    Toolbar.prototype.updateButtons = function() {
      if (this.bugger.ui.isPaused) {
        this.buttonPlay.classList.remove('selected');
        this.buttonPause.classList.add('selected');
        this.buttonStepIn.disabled = false;
        this.buttonStepOver.disabled = false;
        return this.buttonStepOut.disabled = this.bugger.ui.currentFrame < 1;
      } else {
        this.buttonPlay.classList.add('selected');
        this.buttonPause.classList.remove('selected');
        this.buttonStepIn.disabled = true;
        this.buttonStepOver.disabled = true;
        return this.buttonStepOut.disabled = true;
      }
    };

    Toolbar.prototype.getElement = function() {
      return this.element;
    };

    return Toolbar;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbGVhcm4vLmF0b20vcGFja2FnZXMvZGJnL2xpYi92aWV3L1Rvb2xiYXIuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQTs7RUFBQSxNQUFpQyxPQUFBLENBQVEsTUFBUixDQUFqQyxFQUFDLDZDQUFELEVBQXNCOztFQUV0QixNQUFNLENBQUMsT0FBUCxHQUNNO0lBQ1EsaUJBQUMsTUFBRDtBQUNaLFVBQUE7TUFBQSxJQUFDLENBQUEsYUFBRCxHQUFpQixJQUFJLG1CQUFKLENBQUE7TUFDakIsSUFBQyxDQUFBLE9BQUQsR0FBVyxJQUFJLE9BQUosQ0FBQTtNQUNYLElBQUMsQ0FBQSxNQUFELEdBQVU7TUFFVixJQUFDLENBQUEsT0FBRCxHQUFXLFFBQVEsQ0FBQyxhQUFULENBQXVCLEtBQXZCO01BQ1gsSUFBQyxDQUFBLE9BQU8sQ0FBQyxTQUFTLENBQUMsR0FBbkIsQ0FBdUIsZUFBdkIsRUFBd0MsWUFBeEM7TUFFQSxJQUFDLENBQUEsU0FBRCxHQUFhO01BRWIsR0FBQSxHQUFNLFFBQVEsQ0FBQyxhQUFULENBQXVCLEtBQXZCO01BQ04sR0FBRyxDQUFDLFNBQUosR0FDQztNQW1CRCxJQUFDLENBQUEsT0FBTyxDQUFDLFdBQVQsQ0FBcUIsR0FBckI7TUFFQSxhQUFBLEdBQWdCLFNBQUMsUUFBRDtBQUNmLFlBQUE7UUFBQSxZQUFBLEdBQWM7UUFDZCxjQUFBLEdBQWdCO1FBQ2hCLGNBQUEsR0FBZ0I7UUFFaEIsSUFBQSxHQUFPLFFBQVEsQ0FBQyxlQUFULENBQXlCLFlBQXpCLEVBQXVDLEtBQXZDO1FBQ1AsSUFBSSxDQUFDLGNBQUwsQ0FBb0IsK0JBQXBCLEVBQXFELE9BQXJELEVBQThELFlBQTlEO1FBQ0EsSUFBSSxDQUFDLGNBQUwsQ0FBb0IsK0JBQXBCLEVBQXFELE9BQXJELEVBQThELGFBQTlELEVBQTZFLGNBQTdFO1FBQ0EsSUFBSSxDQUFDLFNBQVMsQ0FBQyxH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QUFDLE1BQXZCLENBQThCLFVBQTlCO1FBQ0EsSUFBQyxDQUFBLFlBQVksQ0FBQyxRQUFkLEdBQXlCO1FBQ3pCLElBQUMsQ0FBQSxjQUFjLENBQUMsUUFBaEIsR0FBMkI7ZUFDM0IsSUFBQyxDQUFBLGFBQWEsQ0FBQyxRQUFmLEdBQTBCLEtBWDNCOztJQURjOztzQkFjZixVQUFBLEdBQVksU0FBQTthQUNYLElBQUMsQ0FBQTtJQURVOzs7OztBQTVLYiIsInNvdXJjZXNDb250ZW50IjpbIntDb21wb3NpdGVEaXNwb3NhYmxlLCBFbWl0dGVyfSA9IHJlcXVpcmUgJ2F0b20nXG5cbm1vZHVsZS5leHBvcnRzID1cbmNsYXNzIFRvb2xiYXJcblx0Y29uc3RydWN0b3I6IChidWdnZXIpIC0+XG5cdFx0QHN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpXG5cdFx0QGVtaXR0ZXIgPSBuZXcgRW1pdHRlcigpXG5cdFx0QGJ1Z2dlciA9IGJ1Z2dlclxuXG5cdFx0QGVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50ICdkaXYnXG5cdFx0QGVsZW1lbnQuY2xhc3NMaXN0LmFkZCAnZGVidWctdG9vbGJhcicsICd0b29sLXBhbmVsJ1xuXG5cdFx0QHNob3dIaW50cyA9IHRydWVcblxuXHRcdHN2ZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgJ2Rpdidcblx0XHRzdmcuaW5uZXJIVE1MID1cblx0XHRcdCcnJ1xuXHRcdFx0PHN2ZyB4bWxuczp4bGluaz1cImh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmtcIiB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgdmVyc2lvbj1cIjEuMVwiIHN0eWxlPVwiZGlzcGxheTpub25lXCI+XG5cdFx0XHRcdDxzeW1ib2wgaWQ9XCJkZWJ1Zy1zeW1ib2wtc3RlcC1vdmVyXCIgdmlld2JveD1cIjAgMCAxNyAxOVwiPlxuXHRcdFx0XHRcdDxjaXJjbGUgY3g9XCI4XCIgY3k9XCI2XCIgcj1cIjNcIj48L2NpcmNsZT5cblx0XHRcdFx0XHQ8cG9seWdvbiBwb2ludHM9XCIxNywxNCAxMiw5IDEyLDE5XCI+PC9wb2x5Z29uPlxuXHRcdFx0XHRcdDxyZWN0IHg9XCIwXCIgeT1cIjEyXCIgd2lkdGg9XCIxM1wiIGhlaWdodD1cIjRcIj48L3JlY3Q+XG5cdFx0XHRcdDwvc3ltYm9sPlxuXHRcdFx0XHQ8c3ltYm9sIGlkPVwiZGVidWctc3ltYm9sLXN0ZXAtaW5cIiB2aWV3Qm94PVwiMCAwIDE3IDE5XCI+XG5cdFx0XHRcdFx0PGNpcmNsZSBjeD1cIjlcIiBjeT1cIjVcIiByPVwiM1wiPjwvY2lyY2xlPlxuXHRcdFx0XHRcdDxwb2x5Z29uIHBvaW50cz1cIjksMTAgMTQsMTUgNCwxNVwiPjwvcG9seWdvbj5cblx0XHRcdFx0XHQ8cmVjdCB4PVwiN1wiIHk9XCIxNVwiIHdpZHRoPVwiNFwiIGhlaWdodD1cIjZcIj48L3JlY3Q+XG5cdFx0XHRcdDwvc3ltYm9sPlxuXHRcdFx0XHQ8c3ltYm9sIGlkPVwiZGVidWctc3ltYm9sLXN0ZXAtb3V0XCIgdmlld0JveD1cIjAgMCAxNyAxOVwiPlxuXHRcdFx0XHRcdDxjaXJjbGUgY3g9XCI5XCIgY3k9XCI1XCIgcj1cIjNcIj48L2NpcmNsZT5cblx0XHRcdFx0XHQ8cG9seWdvbiBwb2ludHM9XCI5LDE5IDE0LDE0IDQsMTRcIj48L3BvbHlnb24+XG5cdFx0XHRcdFx0PHJlY3QgeD1cIjdcIiB5PVwiMTBcIiB3aWR0aD1cIjRcIiBoZWlnaHQ9XCI2XCI+PC9yZWN0PlxuXHRcdFx0XHQ8L3N5bWJvbD5cblx0XHRcdDwvc3ZnPlxuXHRcdFx0JycnXG5cdFx0QGVsZW1lbnQuYXBwZW5kQ2hpbGQgc3ZnXG5cblx0XHRjcmVhdGVTdmdJY29uID0gKGljb25OYW1lKSAtPlxuXHRcdFx0c3ZnTmFtZXNwYWNlPSAnaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnXG5cdFx0XHR4bGlua05hbWVzcGFjZT0gJ2h0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsnXG5cdFx0XHR4bWxuc05hbWVzcGFjZT0gJ2h0dHA6Ly93d3cudzMub3JnLzIwMDAveG1sbnMvJ1xuXG5cdFx0XHRpY29uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TIHN2Z05hbWVzcGFjZSwgJ3N2Zydcblx0XHRcdGljb24uc2V0QXR0cmlidXRlTlMgJ2h0dHA6Ly93d3cudzMub3JnLzIwMDAveG1sbnMvJywgJ3htbG5zJywgc3ZnTmFtZXNwYWNlXG5cdFx0XHRpY29uLnNldEF0dHJpYnV0ZU5TICdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3htbG5zLycsICd4bWxucycsICd4bWxuczp4bGluaycsIHhsaW5rTmFtZXNwYWNlXG5cdFx0XHRpY29uLmNsYXNzTGlzdC5hZGQgJ2ljb24nXG5cblx0XHRcdGljb25Vc2UgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMgc3ZnTmFtZXNwYWNlLCAndXNlJ1xuXHRcdFx0aWNvblVzZS5zZXRBdHRyaWJ1dGVOUyB4bGlua05hbWVzcGFjZSwgJ3hsaW5rOmhyZWYnLCAnIycraWNvbk5hbWVcblx0XHRcdGljb24uYXBwZW5kQ2hpbGQgaWNvblVzZVxuXG5cdFx0XHRyZXR1cm4gaWNvblxuXG5cdFx0QG9wdGlvbnMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50ICdkaXYnXG5cdFx0QG9wdGlvbnMuY2xhc3NMaXN0LmFkZCAnb3B0aW9ucydcblx0XHRAZWxlbWVudC5hcHBlbmRDaGlsZCBAb3B0aW9uc1xuXG5cdFx0YnV0dG9uVG9vbGJhciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgJ2Rpdidcblx0XHRidXR0b25Ub29sYmFyLmNsYXNzTGlzdC5hZGQgJ2J0bi10b29sYmFyJ1xuXHRcdEBlbGVtZW50LmFwcGVuZENoaWxkIGJ1dHRvblRvb2xiYXJcblxuXHRcdG9wdGlvbkdyb3VwID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCAnZGl2J1xuXHRcdG9wdGlvbkdyb3VwLmNsYXNzTGlzdC5hZGQgJ2J0bi1ncm91cCdcblx0XHRvcHRpb25Hcm91cC5jbGFzc0xpc3QuYWRkICdvcHRpb25zJ1xuXHRcdGJ1dHRvblRvb2xiYXIuYXBwZW5kQ2hpbGQgb3B0aW9uR3JvdXBcblxuXHRcdEBidXR0b25IaW50cyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgJ2J1dHRvbidcblx0XHRAYnV0dG9uSGludHMuY2xhc3NMaXN0LmFkZCAnYnRuJywgJ2ljb24nLCAnaWNvbi1jb21tZW50JywgJ3NlbGVjdGVkJ1xuXHRcdEBidXR0b25IaW50cy5hZGRFdmVudExpc3RlbmVyICdjbGljaycsID0+XG5cdFx0XHRAYnVnZ2VyLnVpLnNldFNob3dIaW50cyAhQGJ1Z2dlci51aS5zaG93SGludHNcblx0XHRAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS50b29sdGlwcy5hZGQgQGJ1dHRvbkhpbnRzLCB0aXRsZTogJ1Nob3cgaW5saW5lIGhpbnRzJ1xuXHRcdG9wdGlvbkdyb3VwLmFwcGVuZENoaWxkIEBidXR0b25IaW50c1xuXG5cdFx0QGJ1Z2dlci51aS5lbWl0dGVyLm9uICdzZXRTaG93SGludHMnLCAoc2V0KSA9PlxuXHRcdFx0QGJ1dHRvbkhpbnRzLmNsYXNzTGlzdC50b2dnbGUgJ3NlbGVjdGVkJywgc2V0XG5cblx0XHRvcHRpb25Hcm91cCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgJ2Rpdidcblx0XHRvcHRpb25Hcm91cC5jbGFzc0xpc3QuYWRkICdidG4tZ3JvdXAnXG5cdFx0b3B0aW9uR3JvdXAuY2xhc3NMaXN0LmFkZCAnb3B0aW9ucydcblx0XHRidXR0b25Ub29sYmFyLmFwcGVuZENoaWxkIG9wdGlvbkdyb3VwXG5cblx0XHRAYnV0dG9uVG9nZ2xlU3RhY2sgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50ICdidXR0b24nXG5cdFx0QGJ1dHRvblRvZ2dsZVN0YWNrLmNsYXNzTGlzdC5hZGQgJ2J0bicsICdpY29uJywgJ2ljb24tc3RlcHMnXG5cdFx0QGJ1dHRvblRvZ2dsZVN0YWNrLmFkZEV2ZW50TGlzdGVuZXIgJ2NsaWNrJywgPT4gQGJ1Z2dlci5zdGFja0xpc3QudG9nZ2xlKClcblx0XHRAYnVnZ2VyLnN0YWNrTGlzdC5lbWl0dGVyLm9uICdzaG93bicsID0+IEBidXR0b25Ub2dnbGVTdGFjay5jbGFzc0xpc3QuYWRkICdzZWxlY3RlZCdcblx0XHRAYnVnZ2VyLnN0YWNrTGlzdC5lbWl0dGVyLm9uICdoaWRkZW4nLCA9PiBAYnV0dG9uVG9nZ2xlU3RhY2suY2xhc3NMaXN0LnJlbW92ZSAnc2VsZWN0ZWQnXG5cdFx0QHN1YnNjcmlwdGlvbnMuYWRkIGF0b20udG9vbHRpcHMuYWRkIEBidXR0b25Ub2dnbGVTdGFjaywgdGl0bGU6ICdTaG93IHN0YWNrIGxpc3QnXG5cdFx0b3B0aW9uR3JvdXAuYXBwZW5kQ2hpbGQgQGJ1dHRvblRvZ2dsZVN0YWNrXG5cblx0XHRAYnV0dG9uVG9nZ2xlVmFyaWFibGVzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCAnYnV0dG9uJ1xuXHRcdEBidXR0b25Ub2dnbGVWYXJpYWJsZXMuY2xhc3NMaXN0LmFkZCAnYnRuJywgJ2ljb24nLCAnaWNvbi1saXN0LXVub3JkZXJlZCdcblx0XHRAYnV0dG9uVG9nZ2xlVmFyaWFibGVzLmFkZEV2ZW50TGlzdGVuZXIgJ2NsaWNrJywgPT4gQGJ1Z2dlci52YXJpYWJsZUxpc3QudG9nZ2xlKClcblx0XHRAYnVnZ2VyLnZhcmlhYmxlTGlzdC5lbWl0dGVyLm9uICdzaG93bicsID0+IEBidXR0b25Ub2dnbGVWYXJpYWJsZXMuY2xhc3NMaXN0LmFkZCAnc2VsZWN0ZWQnXG5cdFx0QGJ1Z2dlci52YXJpYWJsZUxpc3QuZW1pdHRlci5vbiAnaGlkZGVuJywgPT4gQGJ1dHRvblRvZ2dsZVZhcmlhYmxlcy5jbGFzc0xpc3QucmVtb3ZlICdzZWxlY3RlZCdcblx0XHRAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS50b29sdGlwcy5hZGQgQGJ1dHRvblRvZ2dsZVZhcmlhYmxlcywgdGl0bGU6ICdTaG93IHZhcmlhYmxlcydcblx0XHRvcHRpb25Hcm91cC5hcHBlbmRDaGlsZCBAYnV0dG9uVG9nZ2xlVmFyaWFibGVzXG5cblx0XHRAYnV0dG9uVG9nZ2xlQnJlYWtwb2ludHMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50ICdidXR0b24nXG5cdFx0QGJ1dHRvblRvZ2dsZUJyZWFrcG9pbnRzLmNsYXNzTGlzdC5hZGQgJ2J0bicsICdpY29uJywgJ2ljb24tc3RvcCdcblx0XHRAYnV0dG9uVG9nZ2xlQnJlYWtwb2ludHMuYWRkRXZlbnRMaXN0ZW5lciAnY2xpY2snLCA9PiBAYnVnZ2VyLmJyZWFrcG9pbnRMaXN0LnRvZ2dsZSgpXG5cdFx0QGJ1Z2dlci5icmVha3BvaW50TGlzdC5lbWl0dGVyLm9uICdzaG93bicsID0+IEBidXR0b25Ub2dnbGVCcmVha3BvaW50cy5jbGFzc0xpc3QuYWRkICdzZWxlY3RlZCdcblx0XHRAYnVnZ2VyLmJyZWFrcG9pbnRMaXN0LmVtaXR0ZXIub24gJ2hpZGRlbicsID0+IEBidXR0b25Ub2dnbGVCcmVha3BvaW50cy5jbGFzc0xpc3QucmVtb3ZlICdzZWxlY3RlZCdcblx0XHRAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS50b29sdGlwcy5hZGQgQGJ1dHRvblRvZ2dsZUJyZWFrcG9pbnRzLCB0aXRsZTogJ1Nob3cgYnJlYWtwb2ludHMnXG5cdFx0b3B0aW9uR3JvdXAuYXBwZW5kQ2hpbGQgQGJ1dHRvblRvZ2dsZUJyZWFrcG9pbnRzXG5cblx0XHRidXR0b25Hcm91cCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgJ2Rpdidcblx0XHRidXR0b25Hcm91cC5jbGFzc0xpc3QuYWRkICdidG4tZ3JvdXAnXG5cdFx0YnV0dG9uVG9vbGJhci5hcHBlbmRDaGlsZCBidXR0b25Hcm91cFxuXG5cdFx0QGJ1dHRvblBsYXkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50ICdidXR0b24nXG5cdFx0QGJ1dHRvblBsYXkuY2xhc3NMaXN0LmFkZCAnYnRuJywgJ2ljb24nLCAnaWNvbi1wbGF5YmFjay1wbGF5J1xuXHRcdEBidXR0b25QbGF5LmFkZEV2ZW50TGlzdGVuZXIgJ2NsaWNrJywgLT4gYnVnZ2VyLmNvbnRpbnVlKClcblx0XHRAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS50b29sdGlwcy5hZGQgQGJ1dHRvblBsYXksIHRpdGxlOiAnQ29udGludWUnXG5cdFx0YnV0dG9uR3JvdXAuYXBwZW5kQ2hpbGQgQGJ1dHRvblBsYXlcblxuXHRcdEBidXR0b25QYXVzZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgJ2J1dHRvbidcblx0XHRAYnV0dG9uUGF1c2UuY2xhc3NMaXN0LmFkZCAnYnRuJywgJ2ljb24nLCAnaWNvbi1wbGF5YmFjay1wYXVzZSdcblx0XHRAYnV0dG9uUGF1c2UuYWRkRXZlbnRMaXN0ZW5lciAnY2xpY2snLCAtPiBidWdnZXIucGF1c2UoKVxuXHRcdEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLnRvb2x0aXBzLmFkZCBAYnV0dG9uUGF1c2UsIHRpdGxlOiAnUGF1c2UnXG5cdFx0YnV0dG9uR3JvdXAuYXBwZW5kQ2hpbGQgQGJ1dHRvblBhdXNlXG5cblx0XHRAYnV0dG9uU3RvcCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgJ2J1dHRvbidcblx0XHRAYnV0dG9uU3RvcC5jbGFzc0xpc3QuYWRkICdidG4nLCAnaWNvbicsICdpY29uLXByaW1pdGl2ZS1zcXVhcmUnXG5cdFx0QGJ1dHRvblN0b3AuYWRkRXZlbnRMaXN0ZW5lciAnY2xpY2snLCAtPiBidWdnZXIuc3RvcCgpXG5cdFx0QHN1YnNjcmlwdGlvbnMuYWRkIGF0b20udG9vbHRpcHMuYWRkIEBidXR0b25TdG9wLCB0aXRsZTogJ1N0b3AgZGVidWdnaW5nJ1xuXHRcdGJ1dHRvbkdyb3VwLmFwcGVuZENoaWxkIEBidXR0b25TdG9wXG5cblx0XHRidXR0b25Hcm91cCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQgJ2Rpdidcblx0XHRidXR0b25Hcm91cC5jbGFzc0xpc3QuYWRkICdidG4tZ3JvdXAnXG5cdFx0YnV0dG9uVG9vbGJhci5hcHBlbmRDaGlsZCBidXR0b25Hcm91cFxuXG5cdFx0QGJ1dHRvblN0ZXBPdmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCAnYnV0dG9uJ1xuXHRcdEBidXR0b25TdGVwT3Zlci5jbGFzc0xpc3QuYWRkICdidG4nXG5cdFx0QGJ1dHRvblN0ZXBPdmVyLmFkZEV2ZW50TGlzdGVuZXIgJ2NsaWNrJywgLT4gYnVnZ2VyLnN0ZXBPdmVyKClcblx0XHRAYnV0dG9uU3RlcE92ZXIuYXBwZW5kQ2hpbGQgY3JlYXRlU3ZnSWNvbiAnZGVidWctc3ltYm9sLXN0ZXAtb3Zlcidcblx0XHRAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS50b29sdGlwcy5hZGQgQGJ1dHRvblN0ZXBPdmVyLCB0aXRsZTogJ1N0ZXAgb3Zlcidcblx0XHRidXR0b25Hcm91cC5hcHBlbmRDaGlsZCBAYnV0dG9uU3RlcE92ZXJcblxuXHRcdEBidXR0b25TdGVwSW4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50ICdidXR0b24nXG5cdFx0QGJ1dHRvblN0ZXBJbi5jbGFzc0xpc3QuYWRkICdidG4nXG5cdFx0QGJ1dHRvblN0ZXBJbi5hZGRFdmVudExpc3RlbmVyICdjbGljaycsIC0+IGJ1Z2dlci5zdGVwSW4oKVxuXHRcdEBidXR0b25TdGVwSW4uYXBwZW5kQ2hpbGQgY3JlYXRlU3ZnSWNvbiAnZGVidWctc3ltYm9sLXN0ZXAtaW4nXG5cdFx0QHN1YnNjcmlwdGlvbnMuYWRkIGF0b20udG9vbHRpcHMuYWRkIEBidXR0b25TdGVwSW4sIHRpdGxlOiAnU3RlcCBpbnRvJ1xuXHRcdGJ1dHRvbkdyb3VwLmFwcGVuZENoaWxkIEBidXR0b25TdGVwSW5cblxuXHRcdEBidXR0b25TdGVwT3V0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCAnYnV0dG9uJ1xuXHRcdEBidXR0b25TdGVwT3V0LmNsYXNzTGlzdC5hZGQgJ2J0bicsXG5cdFx0QGJ1dHRvblN0ZXBPdXQuYWRkRXZlbnRMaXN0ZW5lciAnY2xpY2snLCAtPiBidWdnZXIuc3RlcE91dCgpXG5cdFx0QGJ1dHRvblN0ZXBPdXQuYXBwZW5kQ2hpbGQgY3JlYXRlU3ZnSWNvbiAnZGVidWctc3ltYm9sLXN0ZXAtb3V0J1xuXHRcdEBzdWJzY3JpcHRpb25zLmFkZCBhdG9tLnRvb2x0aXBzLmFkZCBAYnV0dG9uU3RlcE91dCwgdGl0bGU6ICdTdGVwIG91dCdcblx0XHRidXR0b25Hcm91cC5hcHBlbmRDaGlsZCBAYnV0dG9uU3RlcE91dFxuXG5cdFx0QHVwZGF0ZUJ1dHRvbnMoKVxuXG5cdGRlc3Ryb3k6IC0+XG5cdFx0QHN1YnNjcmlwdGlvbnMuZGlzcG9zZSgpXG5cdFx0QGVsZW1lbnQucmVtb3ZlKClcblxuXHR1cGRhdGVCdXR0b25zOiAtPlxuXHRcdGlmIEBidWdnZXIudWkuaXNQYXVzZWRcblx0XHRcdEBidXR0b25QbGF5LmNsYXNzTGlzdC5yZW1vdmUgJ3NlbGVjdGVkJ1xuXHRcdFx0QGJ1dHRvblBhdXNlLmNsYXNzTGlzdC5hZGQgJ3NlbGVjdGVkJ1xuXHRcdFx0QGJ1dHRvblN0ZXBJbi5kaXNhYmxlZCA9IGZhbHNlXG5cdFx0XHRAYnV0dG9uU3RlcE92ZXIuZGlzYWJsZWQgPSBmYWxzZVxuXHRcdFx0QGJ1dHRvblN0ZXBPdXQuZGlzYWJsZWQgPSBAYnVnZ2VyLnVpLmN1cnJlbnRGcmFtZSA8IDFcblx0XHRlbHNlXG5cdFx0XHRAYnV0dG9uUGxheS5jbGFzc0xpc3QuYWRkICdzZWxlY3RlZCdcblx0XHRcdEBidXR0b25QYXVzZS5jbGFzc0xpc3QucmVtb3ZlICdzZWxlY3RlZCdcblx0XHRcdEBidXR0b25TdGVwSW4uZGlzYWJsZWQgPSB0cnVlXG5cdFx0XHRAYnV0dG9uU3RlcE92ZXIuZGlzYWJsZWQgPSB0cnVlXG5cdFx0XHRAYnV0dG9uU3RlcE91dC5kaXNhYmxlZCA9IHRydWVcblxuXHRnZXRFbGVtZW50OiAtPlxuXHRcdEBlbGVtZW50XG4iXX0=
