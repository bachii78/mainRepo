(function() {
  module.exports = function(source) {
    var position, readList, readObjectContents, readPair, readString, readSymbol, readTuple, readValue, readValueOrPair, readWord;
    position = 0;
    readSymbol = function(symbol) {
      if (position < source.length && (source.charAt(position)) === symbol) {
        position++;
        return true;
      } else {
        return false;
      }
    };
    readWord = function() {
      var result, seperator;
      if (position >= source.length) {
        return false;
      }
      if (/[\[\]{}=,]/.test(source[position])) {
        return false;
      }
      seperator = source.indexOf('=', position);
      if (seperator >= 0) {
        if (seperator === position) {
          return false;
        }
        result = source.substr(position, seperator - position);
        position = seperator;
        return result;
      } else {
        result = source.substr(position);
        position = source.length;
        return result;
      }
    };
    readString = function() {
      var char, start, string;
      if (!readSymbol('"')) {
        return false;
      }
      start = position;
      string = '';
      while (position < source.length) {
        char = source.charAt(position);
        if (char === '\\') {
          position++;
          switch (char = source.charAt(position)) {
            case 't':
              string += '\t';
              break;
            case 'r':
              string += '\r';
              break;
            case 'n':
              string += '\n';
              break;
            default:
              string += char;
          }
        } else if (char === '"') {
          position++;
          return string;
        } else {
          string += char;
        }
        position++;
      }
      position = start;
      return false;
    };
    readTuple = function() {
      var contents, start;
      if (!readSymbol('{')) {
        return false;
      }
      start = position;
      contents = readObjectContents();
      if (!readSymbol('}')) {
        position = start;
        return false;
      }
      return contents;
    };
    readList = function() {
      var start, value, values;
      if (!readSymbol('[')) {
        return false;
      }
      start = position;
      values = [];
      while ((value = readValueOrPair()) !== false) {
        values.push(value);
        if (!readSymbol(',')) {
          break;
        }
      }
      if (!readSymbol(']')) {
        position = start;
        return false;
      }
      return values;
    };
    readValueOrPair = function() {
      var value;
      value = readValue();
      if (value === false) {
        value = readPair();
        if (value !== false) {
          value = value.value;
        }
      }
      return value;
    };
    readValue = function() {
      var value;
      if (position >= source.length) {
        return false;
      }
      value = readString();
      if (value !== false) {
        return value;
      }
      value = readTuple();
      if (value !== false) {
        return value;
      }
      value = readList();
      if (value !== false) {
        return value;
      }
      return false;
    };
    readPair = function() {
      var name, value;
      if (position >= source.length) {
        return false;
      }
      name = readWord();
      if (name === false) {
        return false;
      }
      if (!readSymbol('=')) {
        return false;
      }
      value = readValue();
      if (value === false) {
        return false;
      }
      return {
        name: name,
        value: value
      };
    };
    readObjectContents = function() {
      var nameless, pair, result;
      result = {};
      pair = null;
      nameless = readString();
      if (nameless !== false) {
        result._ = nameless;
        if (!readSymbol(',')) {
          return result;
        }
      }
      while (true) {
        if ((pair = readPair()) === false) {
          break;
        }
        result[pair.name] = pair.value;
        if (!readSymbol(',')) {
          break;
        }
      }
      return result;
    };
    return readObjectContents();
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvbGVhcm4vLmF0b20vcGFja2FnZXMvZGJnLWdkYi9saWIvcGFyc2VNaTIuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0VBQUEsTUFBTSxDQUFDLE9BQVAsR0FBaUIsU0FBQyxNQUFEO0FBQ2hCLFFBQUE7SUFBQSxRQUFBLEdBQVc7SUFFWCxVQUFBLEdBQWEsU0FBQyxNQUFEO01BQ1osSUFBRyxRQUFBLEdBQVMsTUFBTSxDQUFDLE1BQWhCLElBQTJCLENBQUMsTUFBTSxDQUFDLE1BQVAsQ0FBYyxRQUFkLENBQUQsQ0FBQSxLQUEwQixNQUF4RDtRQUNDLFFBQUE7QUFDQSxlQUFPLEtBRlI7T0FBQSxNQUFBO0FBSUMsZUFBTyxNQUpSOztJQURZO0lBT2IsUUFBQSxHQUFXLFNBQUE7QUFDVixVQUFBO01BQUEsSUFBRyxRQUFBLElBQVksTUFBTSxDQUFDLE1BQXRCO0FBQWtDLGVBQU8sTUFBekM7O01BQ0EsSUFBRyxZQUFZLENBQUMsSUFBYixDQUFrQixNQUFPLENBQUEsUUFBQSxDQUF6QixDQUFIO0FBQTJDLGVBQU8sTUFBbEQ7O01BQ0EsU0FBQSxHQUFZLE1BQU0sQ0FBQyxPQUFQLENBQWUsR0FBZixFQUFvQixRQUFwQjtNQUNaLElBQUcsU0FBQSxJQUFXLENBQWQ7UUFDQyxJQUFHLFNBQUEsS0FBVyxRQUFkO0FBQTRCLGlCQUFPLE1BQW5DOztRQUNBLE1BQUEsR0FBUyxNQUFNLENBQUMsTUFBUCxDQUFjLFFBQWQsRUFBd0IsU0FBQSxHQUFZLFFBQXBDO1FBQ1QsUUFBQSxHQUFXO0FBQ1gsZUFBTyxPQUpSO09BQUEsTUFBQTtRQU1DLE1BQUEsR0FBUyxNQUFNLENBQUMsTUFBUCxDQUFjLFFBQWQ7UUFDVCxRQUFBLEdBQVcsTUFBTSxDQUFDO0FBQ2xCLGVBQU8sT0FSUjs7SUFKVTtJQWNYLFVBQUEsR0FBYSxTQUFBO0FBQ1osVUFBQTtNQUFBLElBQUcsQ0FBQyxVQUFBLENBQVcsR0FB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LGFBQU87UUFBQyxJQUFBLEVBQUssSUFBTjtRQUFZLEtBQUEsRUFBTSxLQUFsQjs7SUFQRztJQVNYLGtCQUFBLEdBQXFCLFNBQUE7QUFDcEIsVUFBQTtNQUFBLE1BQUEsR0FBUztNQUNULElBQUEsR0FBTztNQUVQLFFBQUEsR0FBVyxVQUFBLENBQUE7TUFDWCxJQUFHLFFBQUEsS0FBVSxLQUFiO1FBQ0MsTUFBTSxDQUFDLENBQVAsR0FBVztRQUNYLElBQUcsQ0FBQyxVQUFBLENBQVcsR0FBWCxDQUFKO0FBQXdCLGlCQUFPLE9BQS9CO1NBRkQ7O0FBSUEsYUFBTSxJQUFOO1FBQ0MsSUFBRyxDQUFDLElBQUEsR0FBTyxRQUFBLENBQUEsQ0FBUixDQUFBLEtBQXFCLEtBQXhCO0FBQW1DLGdCQUFuQzs7UUFDQSxNQUFPLENBQUEsSUFBSSxDQUFDLElBQUwsQ0FBUCxHQUFvQixJQUFJLENBQUM7UUFDekIsSUFBRyxDQUFDLFVBQUEsQ0FBVyxHQUFYLENBQUo7QUFBd0IsZ0JBQXhCOztNQUhEO0FBSUEsYUFBTztJQWJhO0FBZXJCLFdBQU8sa0JBQUEsQ0FBQTtFQTdHUztBQUFqQiIsInNvdXJjZXNDb250ZW50IjpbIm1vZHVsZS5leHBvcnRzID0gKHNvdXJjZSkgLT5cblx0cG9zaXRpb24gPSAwXG5cblx0cmVhZFN5bWJvbCA9IChzeW1ib2wpIC0+XG5cdFx0aWYgcG9zaXRpb248c291cmNlLmxlbmd0aCBhbmQgKHNvdXJjZS5jaGFyQXQgcG9zaXRpb24pPT1zeW1ib2xcblx0XHRcdHBvc2l0aW9uKytcblx0XHRcdHJldHVybiB0cnVlXG5cdFx0ZWxzZVxuXHRcdFx0cmV0dXJuIGZhbHNlXG5cblx0cmVhZFdvcmQgPSAtPlxuXHRcdGlmIHBvc2l0aW9uID49IHNvdXJjZS5sZW5ndGggdGhlbiByZXR1cm4gZmFsc2Vcblx0XHRpZiAvW1xcW1xcXXt9PSxdLy50ZXN0IHNvdXJjZVtwb3NpdGlvbl0gdGhlbiByZXR1cm4gZmFsc2Vcblx0XHRzZXBlcmF0b3IgPSBzb3VyY2UuaW5kZXhPZiAnPScsIHBvc2l0aW9uXG5cdFx0aWYgc2VwZXJhdG9yPj0wXG5cdFx0XHRpZiBzZXBlcmF0b3I9PXBvc2l0aW9uIHRoZW4gcmV0dXJuIGZhbHNlXG5cdFx0XHRyZXN1bHQgPSBzb3VyY2Uuc3Vic3RyIHBvc2l0aW9uLCBzZXBlcmF0b3IgLSBwb3NpdGlvblxuXHRcdFx0cG9zaXRpb24gPSBzZXBlcmF0b3Jcblx0XHRcdHJldHVybiByZXN1bHRcblx0XHRlbHNlXG5cdFx0XHRyZXN1bHQgPSBzb3VyY2Uuc3Vic3RyIHBvc2l0aW9uXG5cdFx0XHRwb3NpdGlvbiA9IHNvdXJjZS5sZW5ndGhcblx0XHRcdHJldHVybiByZXN1bHRcblxuXHRyZWFkU3RyaW5nID0gLT5cblx0XHRpZiAhcmVhZFN5bWJvbCAnXCInIHRoZW4gcmV0dXJuIGZhbHNlXG5cdFx0c3RhcnQgPSBwb3NpdGlvblxuXHRcdHN0cmluZyA9ICcnXG5cdFx0d2hpbGUgcG9zaXRpb248c291cmNlLmxlbmd0aFxuXHRcdFx0Y2hhciA9IHNvdXJjZS5jaGFyQXQgcG9zaXRpb25cblx0XHRcdGlmIGNoYXI9PSdcXFxcJ1xuXHRcdFx0XHRwb3NpdGlvbisrXG5cdFx0XHRcdHN3aXRjaCBjaGFyPXNvdXJjZS5jaGFyQXQgcG9zaXRpb25cblx0XHRcdFx0XHR3aGVuICd0JyB0aGVuIHN0cmluZyArPSAnXFx0J1xuXHRcdFx0XHRcdHdoZW4gJ3InIHRoZW4gc3RyaW5nICs9ICdcXHInXG5cdFx0XHRcdFx0d2hlbiAnbicgdGhlbiBzdHJpbmcgKz0gJ1xcbidcblx0XHRcdFx0XHQjVE9ETzpvY3RhbCBhbmQgaGV4IHNlcXVlbmNlcz9cblx0XHRcdFx0XHRlbHNlIHN0cmluZyArPSBjaGFyXG5cdFx0XHRlbHNlIGlmIGNoYXI9PSdcIidcblx0XHRcdFx0cG9zaXRpb24rK1xuXHRcdFx0XHRyZXR1cm4gc3RyaW5nXG5cdFx0XHRlbHNlXG5cdFx0XHRcdHN0cmluZyArPSBjaGFyXG5cdFx0XHRwb3NpdGlvbisrXG5cdFx0cG9zaXRpb24gPSBzdGFydFxuXHRcdHJldHVybiBmYWxzZVxuXG5cdHJlYWRUdXBsZSA9IC0+XG5cdFx0aWYgIXJlYWRTeW1ib2wgJ3snIHRoZW4gcmV0dXJuIGZhbHNlXG5cdFx0c3RhcnQgPSBwb3NpdGlvblxuXHRcdGNvbnRlbnRzID0gcmVhZE9iamVjdENvbnRlbnRzKClcblx0XHRpZiAhcmVhZFN5bWJvbCAnfSdcblx0XHRcdHBvc2l0aW9uID0gc3RhcnRcblx0XHRcdHJldHVybiBmYWxzZVxuXHRcdHJldHVybiBjb250ZW50c1xuXG5cdHJlYWRMaXN0ID0gLT5cblx0XHRpZiAhcmVhZFN5bWJvbCAnWycgdGhlbiByZXR1cm4gZmFsc2Vcblx0XHRzdGFydCA9IHBvc2l0aW9uXG5cdFx0dmFsdWVzID0gW11cblx0XHR3aGlsZSAodmFsdWUgPSByZWFkVmFsdWVPclBhaXIoKSkgIT0gZmFsc2Vcblx0XHRcdHZhbHVlcy5wdXNoIHZhbHVlXG5cdFx0XHRpZiAhcmVhZFN5bWJvbCAnLCcgdGhlbiBicmVha1xuXHRcdGlmICFyZWFkU3ltYm9sICddJ1xuXHRcdFx0cG9zaXRpb24gPSBzdGFydFxuXHRcdFx0cmV0dXJuIGZhbHNlXG5cdFx0cmV0dXJuIHZhbHVlc1xuXG5cdHJlYWRWYWx1ZU9yUGFpciA9IC0+XG5cdFx0dmFsdWUgPSByZWFkVmFsdWUoKVxuXHRcdGlmIHZhbHVlPT1mYWxzZVxuXHRcdFx0dmFsdWUgPSByZWFkUGFpcigpXG5cdFx0XHRpZiB2YWx1ZSE9ZmFsc2UgdGhlbiB2YWx1ZSA9IHZhbHVlLnZhbHVlXG5cdFx0cmV0dXJuIHZhbHVlXG5cblx0cmVhZFZhbHVlID0gLT5cblx0XHRpZiBwb3NpdGlvbiA+PSBzb3VyY2UubGVuZ3RoIHRoZW4gcmV0dXJuIGZhbHNlXG5cdFx0dmFsdWUgPSByZWFkU3RyaW5nKClcblx0XHRpZiB2YWx1ZSE9ZmFsc2UgdGhlbiByZXR1cm4gdmFsdWVcblx0XHR2YWx1ZSA9IHJlYWRUdXBsZSgpXG5cdFx0aWYgdmFsdWUhPWZhbHNlIHRoZW4gcmV0dXJuIHZhbHVlXG5cdFx0dmFsdWUgPSByZWFkTGlzdCgpXG5cdFx0aWYgdmFsdWUhPWZhbHNlIHRoZW4gcmV0dXJuIHZhbHVlXG5cdFx0cmV0dXJuIGZhbHNlXG5cblx0cmVhZFBhaXIgPSAtPlxuXHRcdGlmIHBvc2l0aW9uID49IHNvdXJjZS5sZW5ndGggdGhlbiByZXR1cm4gZmFsc2Vcblx0XHRuYW1lID0gcmVhZFdvcmQoKVxuXHRcdGlmIG5hbWU9PWZhbHNlIHRoZW4gcmV0dXJuIGZhbHNlXG5cdFx0aWYgIXJlYWRTeW1ib2wgJz0nIHRoZW4gcmV0dXJuIGZhbHNlXG5cdFx0dmFsdWUgPSByZWFkVmFsdWUoKVxuXHRcdGlmIHZhbHVlPT1mYWxzZSB0aGVuIHJldHVybiBmYWxzZVxuXHRcdHJldHVybiB7bmFtZTpuYW1lLCB2YWx1ZTp2YWx1ZX1cblxuXHRyZWFkT2JqZWN0Q29udGVudHMgPSAtPlxuXHRcdHJlc3VsdCA9IHt9XG5cdFx0cGFpciA9IG51bGxcblxuXHRcdG5hbWVsZXNzID0gcmVhZFN0cmluZygpXG5cdFx0aWYgbmFtZWxlc3MhPWZhbHNlXG5cdFx0XHRyZXN1bHQuXyA9IG5hbWVsZXNzXG5cdFx0XHRpZiAhcmVhZFN5bWJvbCAnLCcgdGhlbiByZXR1cm4gcmVzdWx0XG5cblx0XHR3aGlsZSB0cnVlXG5cdFx0XHRpZiAocGFpciA9IHJlYWRQYWlyKCkpPT1mYWxzZSB0aGVuIGJyZWFrXG5cdFx0XHRyZXN1bHRbcGFpci5uYW1lXSA9IHBhaXIudmFsdWVcblx0XHRcdGlmICFyZWFkU3ltYm9sICcsJyB0aGVuIGJyZWFrXG5cdFx0cmV0dXJuIHJlc3VsdFxuXG5cdHJldHVybiByZWFkT2JqZWN0Q29udGVudHMoKTtcbiJdfQ==
