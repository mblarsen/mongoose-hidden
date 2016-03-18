var log = require('debug')('mongoose-hidden');
Object.assign = Object.assign || require('object-assign')

exports = module.exports = function (defaults) {
  var _defaultOptions = {
    autoHide: true,
    autoHideJSON: true,
    autoHideObject: true,
    defaultHidden: { '_id': true, '__v': true },
    virtuals: { } //virtuals: { 'id': 'hide' }
  };
  var _defaults = defaults || _defaultOptions;
  _defaults = Object.assign(_defaultOptions, _defaults);

  log(_defaults);

  return function (schema, options) {
    options = options || { };

    // Set defaults from options and default
    options = {
      hide: typeof options['hide'] === 'undefined' ? _defaults.autoHide : !!options['hide'],
      hideJSON: typeof options['hideJSON'] === 'undefined' ? _defaults.autoHideJSON : !!options['hideJSON'],
      hideObject: typeof options['hideObject'] === 'undefined' ? _defaults.autoHideObject : !!options['hideObject'],
      defaultHidden: typeof options['defaultHidden'] === 'undefined' ? _defaults.defaultHidden : options['defaultHidden'],
      virtuals: typeof options['virtuals'] === 'undefined' ? _defaults.virtuals : options['virtuals']
    };

    // Set defaults based on `hide`
    options.hideJSON = options.hide === false ? false : options.hideJSON;
    options.hideObject = options.hide === false ? false : options.hideObject;

    log(options);

    var schemaPaths = {};
    var key = null;

    var transformer = function (target, prevTransform) {
      return function(doc, ret, opt) {
        if (typeof doc.ownerDocument === 'function') {
          return ret;
        }
        log(ret);
        var finalTransform = { };
        if (typeof prevTransform === 'function') {
          log(target + ': running existing transform function');
          finalTransform = prevTransform(doc, ret, opt);
          log(finalTransform);
        }
        schema.eachPath(function (pathname, schemaType) {
          var _pathname = pathname;
          if (pathname.indexOf('.') !== -1) {
            _pathname = pathname.substring(0, pathname.indexOf('.'));
          }
          schemaPaths[_pathname] = true;
          if (
            options['hide' + target] === false
            || typeof options.defaultHidden[_pathname] === 'undefined' && typeof options.virtuals[_pathname] === 'undefined'
            && (
              (typeof schemaType.options['hide'] === 'undefined' && typeof schemaType.options['hide' + target] === 'undefined')
              || (
                (schemaType.options['hide'] !== true && schemaType.options['hide' + target] !== true)
                && (typeof schemaType.options['hide'] !== 'function' || schemaType.options['hide'](doc, ret) !== true)
                && (typeof schemaType.options['hide' + target] !== 'function' || schemaType.options['hide' + target](doc, ret) !== true)
              )
            )
          ) {
            log(target + ': copy "' + _pathname + '"');
            if (typeof finalTransform[_pathname] === 'undefined') {
              finalTransform[_pathname] = ret[_pathname];
            }
          } else {
            log(target + ': hiding "' + _pathname + '"');
            delete finalTransform[_pathname];
          }
        });
        // TODO find a better way to include virtuals
        for (key in ret) {
          if (typeof schemaPaths[key] === 'undefined' && (typeof options.virtuals[key] === 'undefined' || (options.virtuals[key] !== 'hide' && options.virtuals[key] !== ('hide' + target)))) {
            log(target + ': copy "' + key + '"');
            finalTransform[key] = ret[key];
          }
        }
        log(finalTransform);
        return finalTransform;
      };
    };

    var toJSONOptions = schema.get('toJSON') || { };

    schema.set('toJSON', {
      getters: toJSONOptions['getters'] || false,
      virtuals: toJSONOptions['virtuals'] || false,
      transform: transformer('JSON', toJSONOptions['transform'] || null)
    });

    var toObjectOptions = schema.get('toObject') || { };

    schema.set('toObject', {
      getters: toObjectOptions['getters'] || false,
      virtuals: toObjectOptions['virtuals'] || false,
      transform: transformer('Object', toObjectOptions['transform'] || null)
    });
  };
};
