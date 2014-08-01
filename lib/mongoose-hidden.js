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

    var toJSONOptions = schema.get('toJSON') || { };

    schema.set('toJSON', {
      getters: toJSONOptions['getters'] || false,
      virtuals: toJSONOptions['virtuals'] || false,
      transform: function(doc, ret, opt) {
        if (typeof doc.ownerDocument === 'function') return ret;
        log(ret);
        var finalJson = { };
        schema.eachPath(function (pathname, schemaType) {
          schemaPaths[pathname] = true;
          if (
            options.hideJSON === false ||
            typeof options.defaultHidden[pathname] === 'undefined' &&
            typeof options.virtuals[pathname] === 'undefined' &&
            (
              (
                typeof schemaType.options['hide'] === 'undefined' &&
                typeof schemaType.options['hideJSON'] === 'undefined'
              ) ||
              (
                (schemaType.options['hide'] !== true && schemaType.options['hideJSON'] !== true) &&
                (typeof schemaType.options['hide'] !== 'function' || schemaType.options['hide'](doc, ret) !== true) &&
                (typeof schemaType.options['hideJSON'] !== 'function' || schemaType.options['hideJSON'](doc, ret) !== true)
              )
            )
          ) {
            log('json: copy "' + pathname + '"');
            finalJson[pathname] = ret[pathname];
          } else {
            log('json: hiding "' + pathname + '"');
          }
        });
        // TODO find a better way to include virtuals
        for (key in ret) {
          if (typeof schemaPaths[key] === 'undefined' && (typeof options.virtuals[key] === 'undefined' || (options.virtuals[key] !== 'hide' && options.virtuals[key] !== 'hideJSON'))) {
            log('json: copy "' + key + '"');
            finalJson[key] = ret[key];
          }
        }
        return finalJson;
      }
    });

    var toObjectOptions = schema.get('toObject') || { };

    schema.set('toObject', {
      getters: toObjectOptions['getters'] || false,
      virtuals: toObjectOptions['virtuals'] || false,
      transform: function(doc, ret, opt) {
        if (typeof doc.ownerDocument === 'function') return ret;
        log(ret);
        var finalObject = { };
        schema.eachPath(function (pathname, schemaType) {
          schemaPaths[pathname] = true;
          if (
            options.hideObject === false ||
            typeof options.defaultHidden[pathname] === 'undefined' &&
            typeof options.virtuals[pathname] === 'undefined' &&
            (
              (
                typeof schemaType.options['hide'] === 'undefined' &&
                typeof schemaType.options['hideObject'] === 'undefined'
              ) ||
              (
                (schemaType.options['hide'] !== true && schemaType.options['hideObject'] !== true) &&
                (typeof schemaType.options['hide'] !== 'function' || schemaType.options['hide'](doc, ret) !== true) &&
                (typeof schemaType.options['hideObject'] !== 'function' || schemaType.options['hideObject'](doc, ret) !== true)
              )
            )
          ) {
            log('obj: copy "' + pathname + '"');
            finalObject[pathname] = ret[pathname];
          } else {
            log('obj: hiding "' + pathname + '"');
          }
        });
        // TODO find a better way to include virtuals
        for (key in ret) {
          if (typeof schemaPaths[key] === 'undefined' && (typeof options.virtuals[key] === 'undefined' || (options.virtuals[key] !== 'hide' && options.virtuals[key] !== 'hideObject'))) {
            log('obj: copy "' + key + '"');
            finalObject[key] = ret[key];
          }
        }
        return finalObject;
      }
    });
  };
};
