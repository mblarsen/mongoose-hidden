'use strict';

const mpath = require('mpath')
const log = require('debug')('mongoose-hidden')

const hide = 'hide'
const hideObject = 'hideObject'
const hideJSON = 'hideJSON'
const hidden = 'hidden'
const defaultHidden = 'defaultHidden'
const virtuals = 'virtuals'

/**
 * Tests to see if the pathname for target is hidden by an option
 *
 * @access private
 * @param {object} options a set of options
 * @param {string} pathname property path
 * @returns {Boolen} true of pathname should be hidden
 */
function testOptions(options, pathname) {
  return options.defaultHidden[pathname] || options.virtuals[pathname]
}

/**
 * Tests to see if the hide property is set on the schema
 *
 * @access private
 * @param {Schema} schema a mongoose schema
 * @param {string} key the key to test
 * @param {object} doc original document
 * @param {object} transformed transformed document
 * @returns {Boolen} true of pathname should be hidden
 */
function testSchema(schema, key, doc, transformed) {
  if (typeof schema === 'undefined') {
    return false
  }

  return schema.options[key] === true
    || (typeof schema.options[key] === 'function' && schema.options[key](doc, transformed))
}

/**
 * Should a property by be hidden er not
 *
 * @access private
 * @param {Schema} schema a mongoose schema
 * @param {object} options a set of options
 * @param {string} target the target to test, e.g 'JSON'
 * @param {object} doc original document
 * @param {object} transformed transformed document
 * @param {string} pathname property path
 * @returns {Boolen} true of pathname should be hidden
 */
function shouldHide(schema, options, target, doc, transformed, pathname) {
  let hideTarget = hide + target

  // Is hiding turned off?
  if (options[hideTarget] === false) {
    return false
  }

  // Test hide by option or schema
  return testOptions(options, pathname)
    || testSchema(schema, hide, doc, transformed)
    || testSchema(schema, hideTarget, doc, transformed)
}

/**
 * Should a virtual property by be hidden er not
 *
 * @access private
 * @param {Schema} schema a mongoose schema
 * @param {string} key object key name
 * @param {object} options a set of options
 * @param {string} target the target to test, e.g 'JSON'
 * @returns {Boolen} true of pathname should be hidden
 */
function shouldCopyVirtual(schema, key, options, target) {
  return schema.pathType(key) === 'virtual'
    && [hide, `hide${target}`].indexOf(options.virtuals[key]) === -1
}

/**
 * Join key paths
 *
 * @access private
 * @param {string} parent first part
 * @param {string} child second part
 * @returns {string} combined path
 */
function joinKey(parent, child) {
  if (!parent) {
    return child
  }
  return parent + '.' + child
}

/**
 * Builds a list of paths based on the schema tree. This includes virtuals and nested objects as well
 *
 * @access private
 * @param {object} obj the root object
 * @param {string} parentPath the path taken to get to here
 * @returns {array} an array of paths from all children of the root object
 */
function pathsFromTree(obj, parentPath) {
  if (Array.isArray(obj)) {
    return parentPath
  }
  if (typeof obj === 'object' && obj.constructor.name === 'VirtualType') {
    return obj.path
  }

  if (obj.constructor.name === 'Schema') {
    obj = obj.tree
  }

  return Object.keys(obj).reduce((paths, key) => {
    if (typeof obj[key] !== 'object' || typeof obj[key].type !== 'undefined') {
      paths.push(joinKey(parentPath, key))
      return paths
    }
    return [].concat(paths, pathsFromTree(obj[key], joinKey(parentPath, key)))
  }, [])
}

/**
 * Returns an array of pathnames based on the schema and the default settings
 *
 * @access private
 * @param {object} options a set of options
 * @param {Schema} schema a mongoose schema
 * @returns {array} an array of paths
 */
function getPathnames(options, schema) {
  let paths = pathsFromTree(schema.tree)
  Object.keys(options['defaultHidden']).forEach(path => {
    if (paths.indexOf(path) === -1) {
      paths.push(path)
    }
  })
  return paths
}

/**
 * Returns a safe options lookup function
 *
 * @private
 * @param {Object} options
 * @return {Function}
 */
function ensureOption(options) {
  return function (option, fallback) {
    return option in options ? options[option] : fallback
  }
}

/**
 * Merges options from defaults and instantiation
 *
 * @access private
 * @param {Object} options an optional set of options
 * @param {Object} defaults the default set of options
 * @returns {Object} a combined options set
 */
function prepOptions(options, defaults) {
  let _options = options = options || {}

  // Set defaults from options and default
  let ensure = ensureOption(options)
  options = {
    hide: ensure(hide, defaults.autoHide),
    hideJSON: ensure(hideJSON, defaults.autoHideJSON),
    hideObject: ensure(hideObject, defaults.autoHideObject),
    defaultHidden: Object.assign({}, ensure(defaultHidden, defaults.defaultHidden)),
    virtuals: ensure(virtuals, defaults.virtuals)
  }

  // Add to list of default hidden
  if (typeof _options[hidden] === 'object') {
    options[defaultHidden] = Object.assign(options[defaultHidden], _options[hidden])
  }

  if (options[hide] === false) {
    options[hideJSON] = false
    options[hideObject] = false
  }

  return options
}

/**
 * Convert path parts into a nested object
 *
 * @access private
 * @param {array} parts an array of parts on the path
 * @param {mixed} value the value to set at the end of the path
 * @returns {object} an object corresponding to the path that the parts represents
 */
const partsToValue = function (parts, value) {
  if (parts.length === 0) {
    return value
  }
  let obj = {}
  obj[parts[0]] = partsToValue(parts.slice(1), value)
  return obj
}

/**
 * Set a value in object denoted by dot-path
 *
 * @access private
 * @param {object} obj source object
 * @param {string} path a dot-path
 * @param {mixed} value the value to set at the end of the path
 */
const setPath = function (obj, path, value) {
  const parts = path.split('.')

  /* traverse existing path to nearest object */
  while (parts.length > 1 && typeof obj[parts[0]] === 'object') {
    obj = obj[parts.shift()]
  }

  /* set value */
  obj[parts[0]] = partsToValue(parts.slice(1), value)
}

module.exports = function (defaults) {
  let _defaults = Object.assign({}, {
    autoHide: true,
    autoHideJSON: true,
    autoHideObject: true,
    defaultHidden: { '_id': true, '__v': true },
    virtuals: {},
  }, defaults || {})

  return function (schema, options) {
    options = prepOptions(options, _defaults)
    log(options)

    let paths = getPathnames(options, schema)
    log(paths)

    let transformer = function (target, prevTransform) {
      return function (doc, transformed, opt) {
        log(transformed)

        // Apply existing transformer
        let finalTransform = {}
        if (typeof prevTransform === 'function') {
          log('%s: running existing transform function', target)
          finalTransform = prevTransform(doc, transformed, opt)
          log(finalTransform)
        }

        // Copy real values
        log('REAL AND NESTED VALUES')
        paths.forEach(function (pathname) {
          let schemaType = schema.path(pathname)
          if (shouldHide(schemaType, options, target, doc, transformed, pathname)) {
            log('%s: hiding "%s"', target, pathname)
            mpath.unset(pathname, finalTransform)
          } else {
            let value = mpath.get(pathname, transformed)
            if (typeof value !== 'undefined') {
              log('%s: copy "%s"', target, pathname)
              setPath(finalTransform, pathname, value)
            }
          }
        })

        // Copy virtual values
        log('VIRTUAL VALUES')
        for (let key in transformed) {
          if (shouldCopyVirtual(schema, key, options, target)) {
            log('%s: copy virtual "%s"', target, key)
            setPath(finalTransform, key, mpath.get(key, transformed))
          }
        }

        log('FINAL TRANSFORM')
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
module.exports['__test__'] = {
  setPath: setPath,
}

