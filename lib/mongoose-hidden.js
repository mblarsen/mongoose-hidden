var log = require('debug')('mongoose-hidden');

exports = module.exports = function (schema, options) {  
  var options = options || { }
  var self = this;
  
  // Set defaults from options
  self.defaultOptions = { 
    autoHide: typeof options["hide"] !== "undefined" && options.hide === false ? false : true,
    autoHideJSON: typeof options["hideJSON"] !== "undefined" && options.hideJSON === false ? false : true,
    autoHideObject: typeof options["hideObject"] !== "undefined" && options.hideObject === false ? false : true,
  };
  
  // Set defaults based on `hide`
  self.defaultOptions.autoHideJSON = self.defaultOptions.autoHide === false ? false : self.defaultOptions.autoHideJSON;
  self.defaultOptions.autoHideObject= self.defaultOptions.autoHide === false ? false : self.defaultOptions.autoHideObject;
  self.defaultHidden = options.defaultHidden || { "_id": true, "__v": true };
    
  schema.set('toJSON', {
    transform: function(doc, ret, options) {
      var hide = defaultOptions.autoHide,
        hideJSON = defaultOptions.autoHideJSON;
      
      if (typeof options["hide"] !== 'undefined') {
        hide = !! options["hide"];
        hideJSON = hide;
      }
      if (typeof options["hideJSON"] !== 'undefined') {
        hideJSON = !! options["hideJSON"];
        hide = hideJSON === true ? true : hide;
      }
      
      // console.log({ hide: hide, hideObject: hideObject, hideJSON: hideJSON});
      
      var finalJson = { };
      schema.eachPath(function (pathname, schemaType) {
        if (
          hideJSON === false ||
          typeof defaultHidden[pathname] === 'undefined' && 
          (
            (
              typeof schemaType.options['hide'] === 'undefined' && 
              typeof schemaType.options['hideJSON'] === 'undefined'
            ) ||
            (schemaType.options['hide'] !== true && schemaType.options['hideJSON'] !== true)
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
    transform: function(doc, ret, options) {
      var hide = defaultOptions.autoHide,
        hideObject = defaultOptions.autoHideObject;
      
      // if (typeof options["hide"] !== 'undefined') {
      //   hide = !! options["hide"];
      //   hideObject = hide;
      // }
      // if (typeof options["hideObject"] !== 'undefined') {
      //   hideObject = !! options["hideObject"];
      //   hide = hideObject === true ? true : hide;
      // }
            
      var finalObject = { };
      schema.eachPath(function (pathname, schemaType) {
        if (
          hideObject === false ||
          typeof defaultHidden[pathname] === 'undefined' && 
          (
            (
              typeof schemaType.options['hide'] === 'undefined' && 
              typeof schemaType.options['hideObject'] === 'undefined'
            ) ||
            (schemaType.options['hide'] !== true && schemaType.options['hideObject'] !== true)
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
  
  
  // TODO do the same for toObject()
};
