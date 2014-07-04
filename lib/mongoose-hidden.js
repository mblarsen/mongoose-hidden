var log = require('debug')('mongoose-hidden'),
  _ = require('lodash');

exports = module.exports = function (defaults) {
  var _defaultOptions = { 
    autoHide: true,
    autoHideJSON: true,
    autoHideObject: true,
    defaultHidden: { "_id": true, "__v": true }
  };
  var _defaults = defaults || _defaultOptions;
  _defaults = _.extend(_defaultOptions, _defaults);
  
  log(_defaults);
  
  return function (schema, options) {
    var options = options || { }
    var self = this;

    // Set defaults from options and default
    options = {
      hide: typeof options["hide"] === "undefined" ? _defaults.autoHide : !!options["hide"],
      hideJSON: typeof options["hideJSON"] === "undefined" ? _defaults.autoHideJSON : !!options["hideJSON"],
      hideObject: typeof options["hideObject"] === "undefined" ? _defaults.autoHideObject : !!options["hideObject"],
      defaultHidden: typeof options["defaultHidden"] === "undefined" ? _defaults.defaultHidden : options["defaultHidden"]
    };

    // Set defaults based on `hide`
    options.hideJSON = options.hide === false ? false : options.hideJSON;
    options.hideObject = options.hide === false ? false : options.hideObject;

    schema.set('toJSON', {
      transform: function(doc, ret, opt) {
        var finalJson = { };
        schema.eachPath(function (pathname, schemaType) {
          if (
            options.hideJSON === false ||
            typeof options.defaultHidden[pathname] === 'undefined' &&
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
            finalJson[pathname] = ret[pathname];
          } else {
            log("json: hiding '" + pathname + "'");
          }

        });
        return finalJson;
      }
    });

    schema.set('toObject', {
      transform: function(doc, ret, opt) {
        var finalObject = { };
        schema.eachPath(function (pathname, schemaType) {
          if (
            options.hideObject === false ||
            typeof options.defaultHidden[pathname] === 'undefined' &&
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
            finalObject[pathname] = ret[pathname];
          } else {
            log("obj: hiding '" + pathname + "'");
          }

        });
        return finalObject;
      }
    });
  };
};
