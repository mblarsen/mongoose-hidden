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

/**
 * Tests to see if the pathname for target is hidden by an option
 *
 * @access private
 * @param {object} options a set of options
 * @param {string} pathname property path
 * @returns {bool} true of pathname should be hidden
 */
function testOptions(options, pathname) {
  return !!options.defaultHidden[pathname] || !!options.virtuals[pathname]
}

/**
 * Tests to see if the hide property is set on the schema and if
 * it is a function evaluate that
 *
 * @access private
 * @param {Schema} schemaType a mongoose schema
 * @param {string} key the key to test
 * @param {object} doc original document
 * @param {object} transformed transformed document
 * @returns {bool} true of pathname should be hidden
 */
function testSchemaFunc(schemaType, key, doc, transformed) {
  if (typeof schemaType.options[key] === 'function') {
    return schemaType.options[key](doc, transformed)
  }
  return false
}

/**
 * Tests to see if the hide property is set on the schema
 *
 * @access private
 * @param {Schema} schemaType a mongoose schema
 * @param {string} key the key to test
 * @param {object} doc original document
 * @param {object} transformed transformed document
 * @returns {bool} true of pathname should be hidden
 */
function testSchema(schemaType, key, doc, transformed) {
  if (typeof schemaType === 'undefined' || !(key in schemaType.options)) {
    return false
  }
  return schemaType.options[key] === true || testSchemaFunc(schemaType, key, doc, transformed)
}

/**
 * Ties all tests together
 *
 * @access private
 * @param {Schema} schemaType a mongoose schema
 * @param {object} options a set of options
 * @param {string} target the target to test, e.g 'JSON'
 * @param {object} doc original document
 * @param {object} transformed transformed document
 * @param {string} pathname property path
 * @returns {bool} true of pathname should be hidden
 */
function shouldHide(schemaType, options, target, doc, transformed, pathname) {
  let hideTarget = hide + target

  // If hiding has been disabled ignore other settings
  if (!options[hide] || !options[hideTarget]) {
    return false
  }

  // Test hide by option or schema
  return testOptions(options, pathname)
    || testSchema(schemaType, hide, doc, transformed)
    || testSchema(schemaType, hideTarget, doc, transformed)
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
  Object.keys(options["defaultHidden"]).forEach(path => {
    if (paths.indexOf(path) === -1) {
      paths.push(path)
    }
  })
  return paths
}

/**
 * Merges options from defaults and instantiation
 *
 * @access private
 * @param {object} options an optional set of options
 * @param {object} defaults the default set of options
 * @returns {object} a combined options set
 */
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

/**
 * Gets value in object from dot-path
 *
 * @access private
 * @param {source} obj source object
 * @param {string} path a dot-path
 * @returns {mixed} a value or undefined
 */
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

/**
 * Deletes the key in object dentod by dot-path
 *
 * @access private
 * @param {source} obj source object
 * @param {string} path a dot-path
 * @returns {bool} true if found and deleted
 */
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

/**
 * Convert path parts into a nested object
 *
 * @access private
 * @param {array} parts an array of parts on the path
 * @param {mixed} value the value to set at the end of the path
 * @returns {object} an object corresponding to the path that the parts represents
 */
const partsToObject = function (parts, value) {
  if (parts.length === 0) {
    return value
  }
  let obj = {}
  obj[parts[0]] = partsToObject(parts.slice(1), value)
  return obj
}

/**
 * Set a value in object denoted by dot-path
 *
 * @access private
 * @param {object} obj source object
 * @param {string} path a dot-path
 * @param {mixed} value the value to set at the end of the path
 * @returns {bool} true if value was set
 */
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
        log('Handle real values')
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
        log('Handle virtual values')
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

