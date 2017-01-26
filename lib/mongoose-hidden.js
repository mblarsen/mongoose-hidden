/* eslint-env node*/

'use strict';

const log = require('debug')('mongoose-hidden')

const hide = 'hide'
const hideObject = 'hideObject'
const hideJSON = 'hideJSON'
const hidden = 'hidden'
const defaultHidden = 'defaultHidden'
const virtuals = 'virtuals'

const _defaultOptions = {
  autoHide: true,
  autoHideJSON: true,
  autoHideObject: true,
  defaultHidden: { '_id': true, '__v': true },
  virtuals: {},
}

function testOptions(options, hideTarget, pathname) {
  return !!options.defaultHidden[pathname] || !!options.virtuals[pathname]
}

function testSchemaFunc(schemaType, key, doc, transformed) {
  if (typeof schemaType.options[key] === 'function') {
    return schemaType.options[key](doc, transformed)
  }
  return false
}

function testSchema(schemaType, key, doc, transformed) {
  if (typeof schemaType === 'undefined' || !(key in schemaType.options)) {
    return false
  }
  return schemaType.options[key] === true || testSchemaFunc(schemaType, key, doc, transformed)
}

function shouldHide(schemaType, options, target, doc, transformed, pathname) {
  let hideTarget = hide + target

  // If hiding has been disabled ignore other settings
  if (!options[hide] || !options[hideTarget]) {
    return false
  }

  // Test hide by option or schema
  return testOptions(options, hideTarget, pathname)
    || testSchema(schemaType, hide, doc, transformed)
    || testSchema(schemaType, hideTarget, doc, transformed)
}

function getPathnames(options, schema) {
  let paths = Object.keys(schema.paths)
  Object.keys(options["defaultHidden"]).forEach(path => {
    if (paths.indexOf(path) === -1) {
      paths.push(path)
    }
  })
  return paths
}

function prepOptions(options, defaults) {
  let _options = options = options || {}

  // Set defaults from options and default
  options = {
    hide: hide in options ? !!options[hide] : defaults.autoHide,
    hideJSON: hideJSON in options ? !!options[hideJSON] : defaults.autoHideJSON,
    hideObject: hideObject in options ? !!options[hideObject] : defaults.autoHideObject,
    defaultHidden: Object.assign({}, (defaultHidden in options ? options[defaultHidden] : defaults.defaultHidden)),
    virtuals: virtuals in options ? options[virtuals] : defaults.virtuals,
  }

  // Add to default hidden
  if (typeof _options[hidden] === 'object') {
    options[defaultHidden] = Object.assign(options[defaultHidden], _options[hidden])
  }

  // Set defaults based on hide
  options[hideJSON] = !options[hide] ? false : options[hideJSON]
  options[hideObject] = !options[hide] ? false : options[hideObject]

  return options
}

const getPath = function (obj, path) {
  let parts = path.split('.')
  while (parts.length) {
    obj = obj[parts.shift()]
    if (typeof obj !== 'object' && parts.length) {
      return
    }
  }
  return obj
}

const deletePath = function (obj, path) {
  let parts = path.split('.')
  while (parts.length > 1) {
    obj = obj[parts.shift()]
    if (typeof obj !== 'object' && parts.length) {
      return false
    }
  }
  delete obj[parts[0]]
  return true
}

const partsToObject = function (parts, value) {
  if (parts.length === 0) {
    return value
  }
  let obj = {}
  obj[parts[0]] = partsToObject(parts.slice(1), value)
  return obj
}

const setPath = function (obj, path, value) {
  if (typeof value === 'undefined') {
    return false
  }

  let parts = path.split('.')
  if (parts.length === 1) {
    obj[path] = value
    return true
  }

  while (parts.length > 1 && typeof obj[parts[0]] === 'object') {
    obj = obj[parts.shift()]
  }

  if (parts.length === 1) {
    obj[parts[0]] = value
  } else {
    obj[parts[0]] = partsToObject(parts.slice(1), value)
  }
  return true
}

module.exports = function (defaults) {
  let _defaults = Object.assign(Object.assign({}, _defaultOptions), defaults || {})

  log(_defaults)

  return function (schema, options) {
    options = prepOptions(options, _defaults)
    log(options)

    let paths = getPathnames(options, schema)

    log(paths)

    let transformer = function (target, prevTransform) {
      return function (doc, transformed, opt) {
        if (typeof doc.ownerDocument === 'function') {
          return transformed
        }

        log(transformed)

        // Apply existing transformer
        let finalTransform = {}
        if (typeof prevTransform === 'function') {
          log(target + ': running existing transform function')
          finalTransform = prevTransform(doc, transformed, opt)
          log(finalTransform)
        }

        // Copy real values
        paths.forEach(function (pathname) {
          let schemaType = schema.path(pathname)
          if (shouldHide(schemaType, options, target, doc, transformed, pathname)) {
            log(target + ': hiding "' + pathname + '"')
            deletePath(finalTransform, pathname)
          } else {
            log(target + ': copy "' + pathname + '"')
            setPath(finalTransform, pathname, getPath(transformed, pathname))
          }
        })

        // Copy virtual values
        for (let key in transformed) {
          if (schema.pathType(key) === 'virtual'
            && (options.virtuals[key] !== hide && options.virtuals[key] !== (`hide${target}`))) {
            log(target + ': copy virtual "' + key + '"')
            setPath(finalTransform, key, getPath(transformed, key))
          }
        }

        log(finalTransform)
        return finalTransform
      }
    }

    let toJSONOptions = schema.get('toJSON') || {}

    schema.set('toJSON', {
      getters: toJSONOptions['getters'] || false,
      virtuals: toJSONOptions[virtuals] || false,
      transform: transformer('JSON', toJSONOptions['transform'] || null)
    })

    let toObjectOptions = schema.get('toObject') || {}

    schema.set('toObject', {
      getters: toObjectOptions['getters'] || false,
      virtuals: toObjectOptions[virtuals] || false,
      transform: transformer('Object', toObjectOptions['transform'] || null)
    })
  }
}

/* for testing */
module.exports['__test'] = {
  getPath: getPath,
  setPath: setPath,
  deletePath: deletePath,
}
