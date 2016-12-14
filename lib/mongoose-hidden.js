'use strict';

const log = require('debug')('mongoose-hidden');

function shouldHide(schemaType, options, target, doc, transformed, pathname) {
  return ! (
        options['hide' + target] === false
    || !options.defaultHidden[pathname]
    && !options.virtuals[pathname]
    && (schemaType === undefined || (
          (
              typeof schemaType.options['hide'] === 'undefined'
            && typeof schemaType.options['hide' + target] === 'undefined'
          )
       || (
              (
                   schemaType.options['hide'] !== true
                && schemaType.options['hide' + target] !== true
              )
           && (
                   typeof schemaType.options['hide'] !== 'function'
                || schemaType.options['hide'](doc, transformed) !== true
              )
           && (
                   typeof schemaType.options['hide' + target] !== 'function'
                || schemaType.options['hide' + target](doc, transformed) !== true
              )
          )
        )
      )
  )
}

function getPathnames(options, schema) {
  let paths = Object.keys(schema.paths);
  Object.keys(options["defaultHidden"]).forEach(function (path) {
    if (paths.indexOf(path) === -1) {
      paths.push(path);
    }
  })
  return paths;
}

function prepOptions(options, defaults) {
  let _options = options || {}
  options = options || {};

  // Set defaults from options and default
  options = {
    hide: typeof options['hide'] === 'undefined' ? defaults.autoHide : !!options['hide'],
    hideJSON: typeof options['hideJSON'] === 'undefined' ? defaults.autoHideJSON : !!options['hideJSON'],
    hideObject: typeof options['hideObject'] === 'undefined' ? defaults.autoHideObject : !!options['hideObject'],
    defaultHidden: Object.assign({}, (typeof options['defaultHidden'] === 'undefined' ? defaults.defaultHidden : options['defaultHidden'])),
    virtuals: typeof options['virtuals'] === 'undefined' ? defaults.virtuals : options['virtuals']
  };

  // Add to default hidden
  if (typeof _options['hidden'] === 'object') {
    options['defaultHidden'] = Object.assign(options['defaultHidden'], _options['hidden'])
  }

  // Set defaults based on hide
  options.hideJSON = options.hide === false ? false : options.hideJSON;
  options.hideObject = options.hide === false ? false : options.hideObject;

  return options;
}


function getPath(obj, path) {
  let parts = path.split('.');
  while (parts.length) {
    obj = obj[parts.shift()];
    if (typeof obj !== 'object' && parts.length) {
      return undefine;
    }
  }
  return obj;
}

function deletePath(obj, path) {
  let parts = path.split('.');
  while (parts.length > 1) {
    obj = obj[parts.shift()];
    if (typeof obj !== 'object' && parts.length) {
      return false;
    }
  }
  delete obj[parts[0]];
  return true;
}

function setPath(obj, path, value) {
  if (typeof value === 'undefined') {
    return false;
  }

  let parts = path.split('.');
  if (parts.length === 1) {
    obj[path] = value;
    return true;
  }

  while (parts.length > 1 && typeof obj[parts[0]] === 'object') {
    obj = obj[parts.shift()];
  }

  if (parts.length === 1) {
    obj[parts[0]] = value;
  } else {
    obj[parts[0]] = partsToObject(parts.slice(1), value);
  }
  return true;
}

function partsToObject(parts, value) {
  if (parts.length === 0) {
    return value;
  }
  let obj = {};
  obj[parts[0]] = partsToObject(parts.slice(1), value);
  return obj;
}

const _defaultOptions = {
  autoHide: true,
  autoHideJSON: true,
  autoHideObject: true,
  defaultHidden: { '_id': true, '__v': true },
  virtuals: { },
};

exports = module.exports = function (defaults) {
  let _defaults = Object.assign(Object.assign({}, _defaultOptions), defaults || {});
  log(_defaults);

  return function (schema, options) {
    options = prepOptions(options, _defaults);
    log(options);

    let schemaPaths = {};
    let paths = getPathnames(options, schema);

    log(paths);

    let transformer = function (target, prevTransform) {
      return function (doc, transformed, opt) {
        if (typeof doc.ownerDocument === 'function') {
          return transformed;
        }

        log(transformed);

        // Apply existing transformer
        let finalTransform = {};
        if (typeof prevTransform === 'function') {
          log(target + ': running existing transform function');
          finalTransform = prevTransform(doc, transformed, opt);
          log(finalTransform);
        }

        // Copy real values
        paths.forEach(function (pathname) {
          let schemaType = schema.path(pathname);
          if ( ! shouldHide(schemaType, options, target, doc, transformed, pathname)) {
            log(target + ': copy "' + pathname + '"');
            setPath(finalTransform, pathname, getPath(transformed, pathname))
          } else {
            log(target + ': hiding "' + pathname + '"');
            deletePath(finalTransform, pathname);
          }
        });

        // Copy virtual values
        for (let key in transformed) {
          if (schema.pathType(key) === 'virtual'
            && (options.virtuals[key] !== 'hide' && options.virtuals[key] !== ('hide' + target))) {
            log(target + ': copy virtual "' + key + '"');
            setPath(finalTransform, key, getPath(transformed, key))
          }
        }

        log(finalTransform);
        return finalTransform;
      };
    };

    let toJSONOptions = schema.get('toJSON') || { };

    schema.set('toJSON', {
      getters: toJSONOptions['getters'] || false,
      virtuals: toJSONOptions['virtuals'] || false,
      transform: transformer('JSON', toJSONOptions['transform'] || null)
    });

    let toObjectOptions = schema.get('toObject') || { };

    schema.set('toObject', {
      getters: toObjectOptions['getters'] || false,
      virtuals: toObjectOptions['virtuals'] || false,
      transform: transformer('Object', toObjectOptions['transform'] || null)
    });
  };
};
