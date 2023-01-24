(function() {
  var CSON, ConfigManager, Workspace, chokidar, fs, path;

  fs = require('fs');

  path = require('path');

  CSON = require('cson-parser');

  chokidar = require('chokidar');

  Workspace = require('atom').Workspace;

  module.exports = ConfigManager = (function() {
    function ConfigManager() {
      this.debugConfigs = {};
      this.watcher = null;
      this.projectPaths = [];
      this.startWatching(atom.project.getPaths());
      atom.project.onDidChangePaths((function(_this) {
        return function(projectPaths) {
          _this.debugConfigs = {};
          _this.watcher.close;
          return _this.startWatching(projectPaths);
        };
      })(this));
    }

    ConfigManager.prototype.startWatching = function(dirs) {
      var globs, p;
      this.projectPaths = dirs;
      globs = [
        (function() {
          var i, len, results;
          results = [];
          for (i = 0, len = dirs.length; i < len; i++) {
            p = dirs[i];
            results.push(path.resolve(p, ".atom-dbg.[jc]son"));
          }
          return results;
        })()
      ];
      this.watcher = chokidar.watch(globs);
      this.watcher.on('add', (function(_this) {
        return function(f) {
          return _this.readFile(f);
        };
      })(this));
      this.watcher.on('change', (function(_this) {
        return function(f) {
          return _this.readFile(f);
        };
      })(this));
      this.watcher.on('unlink', (function(_this) {
        return function(f) {
          return delete _this.debugConfigs[f];
        };
      })(this));
      return this.watcher.on('error', (function(_this) {
        return function(error) {
          return atom.notifications.addError('Unable to monitor dbg config files', {
            description: "A system error occurred trying to monitor dbg config files for updates (" + ((error != null ? error.code : void 0) || 'UNKNOWN') + ").  \ndbg configurations will not automatically update if the files are modified.",
            dismissable: true
          });
        };
      })(this));
    };

    ConfigManager.prototype.destructor = function() {
      return this.watcher.close();
    };

    ConfigManager.prototype.readFile = function(f) {
      var basedir, configs, error, filename;
      configs = {};
      try {
        configs = (function() {
          switch (path.extname(f)) {
            case '.json':
              return JSON.parse(fs.readFileSync(f));
            case '.cson':
              return CSON.parse(fs.readFileSync(f));
            default:
              throw 'Unsupported file extension';
          }
        })();
      } catch (error1) {
        error = error1;
        atom.notifications.addError("Error loading debug file `" + f + "`", {
          description: error.message,
          dismissable: true
        });
        console.error("Error loading debug file " + f + ":\n", error);
        delete this.debugConfigs[f];
      }
      basedir = path.dirname(f);
      for (filename in configs) {
        configs[filename].basedir = basedir;
      }
      return this.debugConfigs[f] = configs;
    };

    ConfigManager.prototype.getConfigOptions = function() {
      var configFile, configs, f, name;
      configs = [];
      for (f in this.debugConfigs) {
        configFile = this.debugConfigs[f];
        for (name in configFile) {
          configs.push({
            name: name,
            config: configFile[name]
          });
        }
      }
      return configs;
    };

    ConfigManager.prototype.openConfigFile = function() {
      var filename;
      filename = this.getDefaultConfigPath();
      if (!filename) {
        return;
      }
      return atom.workspace.open(filename);
    };

    ConfigManager.prototype.getDefaultConfigPath = function() {
      var configFilename, filename;
      filename = null;
      for (configFilename in this.debugConfigs) {
        if ((path.dirname(configFilename)) === this.projectPaths[0]) {
          filename = configFilename;
        }
      }
      if (!filename) {
        if (!this.projectPaths.length) {
          return null;
        }
        filename = path.resolve(this.projectPaths[0], '.atom-dbg.cson');
      }
      return filename;
    };

    ConfigManager.prototype.getUniqueConfigName = function(suggestion) {
      var configOption, name, nameCount, names;
      names = (function() {
        var i, len, ref, results;
        ref = this.getConfigOptions();
        results = [];
        for (i = 0, len = ref.length; i < len; i++) {
          configOption = ref[i];
          results.push(configOption.name);
        }
        return results;
      }).call(this);
      name = suggestion;
      nameCount = 1;
      while ((names.indexOf(name)) >= 0) {
        name = suggestion + ' ' + (++nameCount);
      }
      return name;
    };

    ConfigManager.prototype.saveOptions = function(options) {
      var filename, name;
      filename = this.getDefaultConfigPath();
      if (!filename) {
        return;
      }
      name = this.getUniqueConfigName((options.path.charAt(0)) !== '/' ? options.path : path.basename(options.path));
      if (!this.debugConfigs[filename]) {
        this.debugConfigs[filename] = {};
      }
      this.debugConfigs[filename][name] = options;
      return fs.readFile(filename, 'utf8', (function(_this) {
        return function(err, data) {
          var first, stringifyIdentifier;
          if (err) {
            if (err.code === 'ENOENT') {
              data = '';
            } else {
              throw err;
            }
          }
          switch (path.extname(filename)) {
            case '.json':
              data = data.replace(/\s*}?\s*$/, '');
              data = data.replace(/([^{])$/, '$1,');
              data += '\n\t' + (JSON.stringify(name)) + ': {';
              first = true;
              for (name in options) {
                if (!options[name] || options[name] instanceof Array && options[name].length < 1) {
                  continue;
                }
                if (!first) {
                  data += ',';
                }
                data += '\n\t\t' + (JSON.stringify(name)) + ': ' + (JSON.stringify(options[name]));
                first = false;
              }
              data += '\n\t}';
              data += '\n}';
              data += '\n';
              break;
            case '.cson':
              stringifyIdentifier = function(data) {
                var value;
                value = CSON.stringify(data);
                value = value.replace(/^"([a-z0-9]+)"$/, '$1');
                return value;
              };
              data = data.replace(/\s*$/, '');
              if (data.length > 0) {
                data += '\n\n';
              }
              data += (stringifyIdentifier(name)) + ':';
              for (name in options) {
                if (!options[name] || options[name] instanceof Array && options[name].length < 1) {
                  continue;
                }
                data += '\n\t' + (stringifyIdentifier(name)) + ': ' + (CSON.stringify(options[name]));
              }
              data += '\n';
          }
          return fs.writeFile(filename, data, 'utf8');
        };
      })(this));
    };

    return ConfigManager;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbGVhcm4vLmF0b20vcGFja2FnZXMvZGJnL2xpYi9Db25maWdNYW5hZ2VyLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUEsRUFBQSxHQUFLLE9BQUEsQ0FBUSxJQUFSOztFQUNMLElBQUEsR0FBTyxPQUFBLENBQVEsTUFBUjs7RUFDUCxJQUFBLEdBQU8sT0FBQSxDQUFRLGFBQVI7O0VBQ1AsUUFBQSxHQUFXLE9BQUEsQ0FBUSxVQUFSOztFQUNWLFlBQWEsT0FBQSxDQUFRLE1BQVI7O0VBRWQsTUFBTSxDQUFDLE9BQVAsR0FDTTtJQUNRLHVCQUFBO01BQ1osSUFBQyxDQUFBLFlBQUQsR0FBZ0I7TUFDaEIsSUFBQyxDQUFBLE9BQUQsR0FBVztNQUNYLElBQUMsQ0FBQSxZQUFELEdBQWdCO01BRWhCLElBQUMsQ0FBQSxhQUFELENBQWUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFiLENBQUEsQ0FBZjtNQUVBLElBQUksQ0FBQyxPQUFPLENBQUMsZ0JBQWIsQ0FBOEIsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFDLFlBQUQ7VUFDN0IsS0FBQyxDQUFBLFlBQUQsR0FBZ0I7VUFDaEIsS0FBQyxDQUFBLE9BQU8sQ0FBQztpQkFDVCxLQUFDLENBQUEsYUFBRCxDQUFlLFlBQWY7UUFINkI7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQTlCO0lBUFk7OzRCQVliLGFBQUEsR0FBZSxTQUFDLElBQUQ7QUFDZCxVQUFBO01BQUEsSUFBQyxDQUFBLFlBQUQsR0FBZ0I7TUFHaEIsS0FBQSxHQUFROzs7QUFBQztlQUFBLHNDQUFBOzt5QkFBQSxJQUFJLENBQUMsT0FBTCxDQUFhLENBQWIsRUFBZSxtQkFBZjtBQUFBOztZQUFEOztNQUNSLElBQUMsQ0FBQSxPQUFELEdBQVcsUUFBUSxDQUFDLEtBQVQsQ0FBZSxLQUFmO01BQ1gsSUFBQyxDQUFBLE9BQU8sQ0FBQyxFQUFULENB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ID0gcmVxdWlyZSAncGF0aCdcbkNTT04gPSByZXF1aXJlICdjc29uLXBhcnNlcidcbmNob2tpZGFyID0gcmVxdWlyZSAnY2hva2lkYXInXG57V29ya3NwYWNlfSA9IHJlcXVpcmUgJ2F0b20nXG5cbm1vZHVsZS5leHBvcnRzID1cbmNsYXNzIENvbmZpZ01hbmFnZXJcblx0Y29uc3RydWN0b3I6IC0+XG5cdFx0QGRlYnVnQ29uZmlncyA9IHt9XG5cdFx0QHdhdGNoZXIgPSBudWxsXG5cdFx0QHByb2plY3RQYXRocyA9IFtdXG5cblx0XHRAc3RhcnRXYXRjaGluZyBhdG9tLnByb2plY3QuZ2V0UGF0aHMoKVxuXG5cdFx0YXRvbS5wcm9qZWN0Lm9uRGlkQ2hhbmdlUGF0aHMgKHByb2plY3RQYXRocykgPT5cblx0XHRcdEBkZWJ1Z0NvbmZpZ3MgPSB7fVxuXHRcdFx0QHdhdGNoZXIuY2xvc2Vcblx0XHRcdEBzdGFydFdhdGNoaW5nIHByb2plY3RQYXRoc1xuXG5cdHN0YXJ0V2F0Y2hpbmc6IChkaXJzKSAtPlxuXHRcdEBwcm9qZWN0UGF0aHMgPSBkaXJzXG5cdFx0I1RPRE86IHRoaXMgZ2xvYiB3b3JrcywgYnV0IGZvciBzb21lIHJlYXNvbiBpdCBncmFicyBtb3JlIGZpbGVzIHRoYW4gZXhwZWN0ZWRcblx0XHQjIGdsb2JzID0gW3BhdGgucmVzb2x2ZSBwLCBcIioqXCIsXCIuYXRvbS1kYmcuW2pjXXNvblwiIGZvciBwIGluIGRpcnNdICMgd2F0Y2ggcmVjdXJzaXZseSBpbiBkaXJlY3Rvcmllc1xuXHRcdGdsb2JzID0gW3BhdGgucmVzb2x2ZSBwLFwiLmF0b20tZGJnLltqY11zb25cIiBmb3IgcCBpbiBkaXJzXSAjIG9ubHkgd2F0Y2ggaW4gZGlyZWN0b3JpZXNcblx0XHRAd2F0Y2hlciA9IGNob2tpZGFyLndhdGNoIGdsb2JzXG5cdFx0QHdhdGNoZXIub24gJ2FkZCcsIChmKSA9PiBAcmVhZEZpbGUgZlxuXHRcdEB3YXRjaGVyLm9uICdjaGFuZ2UnLCAoZikgPT4gQHJlYWRGaWxlIGZcblx0XHRAd2F0Y2hlci5vbiAndW5saW5rJywgKGYpID0+IGRlbGV0ZSBAZGVidWdDb25maWdzW2ZdXG5cdFx0QHdhdGNoZXIub24gJ2Vycm9yJywgKGVycm9yKSA9PlxuXHRcdFx0YXRvbS5ub3RpZmljYXRpb25zLmFkZEVycm9yICdVbmFibGUgdG8gbW9uaXRvciBkYmcgY29uZmlnIGZpbGVzJyxcblx0XHRcdFx0ZGVzY3JpcHRpb246IFwiQSBzeXN0ZW0gZXJyb3Igb2NjdXJyZWQgdHJ5aW5nIHRvIG1vbml0b3IgZGJnIGNvbmZpZyBmaWxlcyBmb3IgdXBkYXRlcyAoI3tlcnJvcj8uY29kZXx8J1VOS05PV04nfSkuICBcXG5kYmcgY29uZmlndXJhdGlvbnMgd2lsbCBub3QgYXV0b21hdGljYWxseSB1cGRhdGUgaWYgdGhlIGZpbGVzIGFyZSBtb2RpZmllZC5cIlxuXHRcdFx0XHRkaXNtaXNzYWJsZTogdHJ1ZVxuXG5cdGRlc3RydWN0b3I6IC0+XG5cdFx0QHdhdGNoZXIuY2xvc2UoKVxuXG5cdHJlYWRGaWxlOiAoZikgLT5cblx0XHRjb25maWdzID0ge31cblx0XHR0cnkgY29uZmlncyA9IHN3aXRjaCBwYXRoLmV4dG5hbWUgZlxuXHRcdFx0d2hlbiAnLmpzb24nIHRoZW4gSlNPTi5wYXJzZSBmcy5yZWFkRmlsZVN5bmMgZlxuXHRcdFx0d2hlbiAnLmNzb24nIHRoZW4gQ1NPTi5wYXJzZSBmcy5yZWFkRmlsZVN5bmMgZlxuXHRcdFx0ZWxzZSB0aHJvdyAnVW5zdXBwb3J0ZWQgZmlsZSBleHRlbnNpb24nXG5cblx0XHRjYXRjaCBlcnJvclxuXHRcdFx0YXRvbS5ub3RpZmljYXRpb25zLmFkZEVycm9yIFwiRXJyb3IgbG9hZGluZyBkZWJ1ZyBmaWxlIGAje2Z9YFwiLFxuXHRcdFx0XHRkZXNjcmlwdGlvbjogZXJyb3IubWVzc2FnZVxuXHRcdFx0XHRkaXNtaXNzYWJsZTogdHJ1ZVxuXHRcdFx0Y29uc29sZS5lcnJvciBcIkVycm9yIGxvYWRpbmcgZGVidWcgZmlsZSAje2Z9OlxcblwiLCBlcnJvclxuXHRcdFx0ZGVsZXRlIEBkZWJ1Z0NvbmZpZ3NbZl1cblxuXHRcdGJhc2VkaXIgPSBwYXRoLmRpcm5hbWUgZlxuXHRcdGNvbmZpZ3NbZmlsZW5hbWVdLmJhc2VkaXIgPSBiYXNlZGlyIGZvciBmaWxlbmFtZSBvZiBjb25maWdzXG5cblx0XHRAZGVidWdDb25maWdzW2ZdID0gY29uZmlnc1xuXG5cdGdldENvbmZpZ09wdGlvbnM6IC0+XG5cdFx0Y29uZmlncyA9IFtdXG5cdFx0Zm9yIGYgb2YgQGRlYnVnQ29uZmlnc1xuXHRcdFx0Y29uZmlnRmlsZSA9IEBkZWJ1Z0NvbmZpZ3NbZl1cblx0XHRcdGNvbmZpZ3MucHVzaCB7bmFtZTpuYW1lLCBjb25maWc6Y29uZmlnRmlsZVtuYW1lXX0gZm9yIG5hbWUgb2YgY29uZmlnRmlsZVxuXHRcdHJldHVybiBjb25maWdzXG5cblx0b3BlbkNvbmZpZ0ZpbGU6IC0+XG5cdFx0ZmlsZW5hbWUgPSBAZ2V0RGVmYXVsdENvbmZpZ1BhdGgoKVxuXHRcdGlmICFmaWxlbmFtZSB0aGVuIHJldHVyblxuXG5cdFx0YXRvbS53b3Jrc3BhY2Uub3BlbiBmaWxlbmFtZVxuXG5cdGdldERlZmF1bHRDb25maWdQYXRoOiAtPlxuXHRcdCMgZmluZCB0aGUgZmlyc3QgY29uZmlnIGZpbGUgd2l0aGluIHByb2plY3RQYXRoc1swXSAob25seSB0aGUgZmlyc3QgaXMgdXNlZCwgYXMgdGhpcyBpcyB3aGF0IGRlYnVnIHBhdGhzIGFyZSByZWxhdGl2ZSB0byBieSBkZWZhdWx0KVxuXHRcdGZpbGVuYW1lID0gbnVsbFxuXHRcdGZvciBjb25maWdGaWxlbmFtZSBvZiBAZGVidWdDb25maWdzXG5cdFx0XHRpZiAocGF0aC5kaXJuYW1lIGNvbmZpZ0ZpbGVuYW1lKSA9PSBAcHJvamVjdFBhdGhzWzBdXG5cdFx0XHRcdGZpbGVuYW1lID0gY29uZmlnRmlsZW5hbWVcblxuXHRcdGlmICFmaWxlbmFtZVxuXHRcdFx0aWYgIUBwcm9qZWN0UGF0aHMubGVuZ3RoIHRoZW4gcmV0dXJuIG51bGxcblx0XHRcdGZpbGVuYW1lID0gcGF0aC5yZXNvbHZlIEBwcm9qZWN0UGF0aHNbMF0sICcuYXRvbS1kYmcuY3Nvbidcblx0XHRyZXR1cm4gZmlsZW5hbWVcblxuXHRnZXRVbmlxdWVDb25maWdOYW1lOiAoc3VnZ2VzdGlvbikgLT5cblx0XHRuYW1lcyA9IChjb25maWdPcHRpb24ubmFtZSBmb3IgY29uZmlnT3B0aW9uIGluIEBnZXRDb25maWdPcHRpb25zKCkpXG5cdFx0bmFtZSA9IHN1Z2dlc3Rpb25cblx0XHRuYW1lQ291bnQgPSAxXG5cblx0XHR3aGlsZSAobmFtZXMuaW5kZXhPZiBuYW1lKSA+PSAwXG5cdFx0XHRuYW1lID0gc3VnZ2VzdGlvbiArICcgJyArICgrK25hbWVDb3VudClcblxuXHRcdHJldHVybiBuYW1lXG5cblx0c2F2ZU9wdGlvbnM6IChvcHRpb25zKSAtPlxuXHRcdGZpbGVuYW1lID0gQGdldERlZmF1bHRDb25maWdQYXRoKClcblx0XHRpZiAhZmlsZW5hbWUgdGhlbiByZXR1cm5cblxuXHRcdG5hbWUgPSBAZ2V0VW5pcXVlQ29uZmlnTmFtZSBpZiAob3B0aW9ucy5wYXRoLmNoYXJBdCAwKSE9Jy8nIHRoZW4gb3B0aW9ucy5wYXRoIGVsc2UgcGF0aC5iYXNlbmFtZSBvcHRpb25zLnBhdGhcblxuXHRcdGlmICFAZGVidWdDb25maWdzW2ZpbGVuYW1lXVxuXHRcdFx0QGRlYnVnQ29uZmlnc1tmaWxlbmFtZV0gPSB7fVxuXHRcdEBkZWJ1Z0NvbmZpZ3NbZmlsZW5hbWVdW25hbWVdID0gb3B0aW9uc1xuXG5cdFx0ZnMucmVhZEZpbGUgZmlsZW5hbWUsICd1dGY4JywgKGVyciwgZGF0YSkgPT5cblx0XHRcdGlmIGVyclxuXHRcdFx0XHRpZiBlcnIuY29kZSA9PSAnRU5PRU5UJ1xuXHRcdFx0XHRcdGRhdGEgPSAnJ1xuXHRcdFx0XHRlbHNlXG5cdFx0XHRcdFx0dGhyb3cgZXJyXG5cblx0XHRcdHN3aXRjaCBwYXRoLmV4dG5hbWUgZmlsZW5hbWVcblx0XHRcdFx0d2hlbiAnLmpzb24nXG5cdFx0XHRcdFx0ZGF0YSA9IGRhdGEucmVwbGFjZSAvXFxzKn0/XFxzKiQvLCAnJyAjIHJlbW92ZSBjbG9zaW5nIH1cblx0XHRcdFx0XHRkYXRhID0gZGF0YS5yZXBsYWNlIC8oW157XSkkLywgJyQxLCcgIyBjb250aW51aW5nIGNvbW1hIGlmIGFueSBwcmV2aW91cyBkYXRhXG5cblx0XHRcdFx0XHRkYXRhICs9ICdcXG5cXHQnICsgKEpTT04uc3RyaW5naWZ5IG5hbWUpICsgJzogeydcblx0XHRcdFx0XHRmaXJzdCA9IHRydWVcblx0XHRcdFx0XHRmb3IgbmFtZSBvZiBvcHRpb25zXG5cdFx0XHRcdFx0XHRpZiAhb3B0aW9uc1tuYW1lXSB8fCBvcHRpb25zW25hbWVdIGluc3RhbmNlb2YgQXJyYXkgJiYgb3B0aW9uc1tuYW1lXS5sZW5ndGggPCAxXG5cdFx0XHRcdFx0XHRcdGNvbnRpbnVlXG5cblx0XHRcdFx0XHRcdGlmICFmaXJzdCB0aGVuIGRhdGEgKz0gJywnXG5cblx0XHRcdFx0XHRcdGRhdGEgKz0gJ1xcblxcdFxcdCcgKyAoSlNPTi5zdHJpbmdpZnkgbmFtZSkgKyAnOiAnICsgKEpTT04uc3RyaW5naWZ5IG9wdGlvbnNbbmFtZV0pXG5cdFx0XHRcdFx0XHRmaXJzdCA9IGZhbHNlXG5cblx0XHRcdFx0XHRkYXRhICs9ICdcXG5cXHR9J1xuXHRcdFx0XHRcdGRhdGEgKz0gJ1xcbn0nXG5cdFx0XHRcdFx0ZGF0YSArPSAnXFxuJ1xuXG5cdFx0XHRcdHdoZW4gJy5jc29uJ1xuXHRcdFx0XHRcdHN0cmluZ2lmeUlkZW50aWZpZXIgPSAoZGF0YSkgLT5cblx0XHRcdFx0XHRcdHZhbHVlID0gQ1NPTi5zdHJpbmdpZnkgZGF0YVxuXHRcdFx0XHRcdFx0dmFsdWUgPSB2YWx1ZS5yZXBsYWNlIC9eXCIoW2EtejAtOV0rKVwiJC8sICckMSdcblx0XHRcdFx0XHRcdHJldHVybiB2YWx1ZVxuXG5cdFx0XHRcdFx0ZGF0YSA9IGRhdGEucmVwbGFjZSAvXFxzKiQvLCAnJ1xuXG5cdFx0XHRcdFx0aWYgZGF0YS5sZW5ndGggPiAwXG5cdFx0XHRcdFx0XHRkYXRhICs9ICdcXG5cXG4nXG5cblx0XHRcdFx0XHRkYXRhICs9IChzdHJpbmdpZnlJZGVudGlmaWVyIG5hbWUpICsgJzonXG5cdFx0XHRcdFx0Zm9yIG5hbWUgb2Ygb3B0aW9uc1xuXHRcdFx0XHRcdFx0aWYgIW9wdGlvbnNbbmFtZV0gfHwgb3B0aW9uc1tuYW1lXSBpbnN0YW5jZW9mIEFycmF5ICYmIG9wdGlvbnNbbmFtZV0ubGVuZ3RoIDwgMVxuXHRcdFx0XHRcdFx0XHRjb250aW51ZVxuXG5cdFx0XHRcdFx0XHRkYXRhICs9ICdcXG5cXHQnICsgKHN0cmluZ2lmeUlkZW50aWZpZXIgbmFtZSkgKyAnOiAnICsgKENTT04uc3RyaW5naWZ5IG9wdGlvbnNbbmFtZV0pXG5cblx0XHRcdFx0XHRkYXRhICs9ICdcXG4nXG5cblx0XHRcdGZzLndyaXRlRmlsZSBmaWxlbmFtZSwgZGF0YSwgJ3V0ZjgnXG4iXX0=
