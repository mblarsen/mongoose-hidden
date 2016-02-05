var log = require('debug')('mongoose-hidden'),
  _ = require('lodash');

exports = module.exports = function (defaults) {
  var _defaultOptions = {
    autoHide: true,
    autoHideJSON: true,
    autoHideObject: true,
    defaultHidden: { '_id': true, '__v': true },
    virtuals: { } //virtuals: { 'id': 'hide' }
  };
  var _defaults = defaults || _defaultOptions;
  _defaults = _.extend(_defaultOptions, _defaults);

  log(_defaults);

  return function (schema, options) {
    var options = options || { }
    var self = this;

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
        if (typeof doc.ownerDocument === 'function') return ret;
        log(ret);
        var finalTransform = { };
        if (typeof prevTransform === 'function') {
          log(target + ': running existing transform function');
          finalTransform = prevTransform(doc, ret, opt);
          log(finalTransform);
        }
        schema.eachPath(function (pathname, schemaType) {
          schemaPaths[pathname] = true;
          if (
            options['hide' + target] === false
            || typeof options.defaultHidden[pathname] === 'undefined' && typeof options.virtuals[pathname] === 'undefined'
            && (
              (typeof schemaType.options['hide'] === 'undefined' && typeof schemaType.options['hide' + target] === 'undefined') 
              || (
                (schemaType.options['hide'] !== true && schemaType.options['hide' + target] !== true)
                && (typeof schemaType.options['hide'] !== 'function' || schemaType.options['hide'](doc, ret) !== true)
                && (typeof schemaType.options['hide' + target] !== 'function' || schemaType.options['hide' + target](doc, ret) !== true)
              )
            )
          ) {
            log(target + ': copy "' + pathname + '"');
            if (typeof finalTransform[pathname] === 'undefined') {
              finalTransform[pathname] = ret[pathname];
            }
          } else {
            log(target + ': hiding "' + pathname + '"');
            delete finalTransform[pathname];
            if (typeof finalTransform[pathname] !== 'undefined') {
            }
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
      transform: transformer('JSON', toJSONOptions['transform'] || undefined)
    });

    var toObjectOptions = schema.get('toObject') || { };

    schema.set('toObject', {
      getters: toObjectOptions['getters'] || false,
      virtuals: toObjectOptions['virtuals'] || false,
      transform: transformer('Object', toObjectOptions['transform'] || undefined)
    });
  };
};
