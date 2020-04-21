/* eslint no-use-before-define: 0 operator-linebreak: 0 */

'use strict'

const mpath = require('./mpath.js')

const applyRecursively = 'applyRecursively'
const hide = 'hide'
const hideObject = 'hideObject'
const hideJSON = 'hideJSON'
const hidden = 'hidden'
const defaultHidden = 'defaultHidden'
const virtuals = 'virtuals'

/**
 * Plugin constructor
 *
 * @param {Schema} schema a mongoose schema
 * @param {Object} options a set of options
 *
 * @return {void}
 */
function plugin(schema, options) {
  const paths = getPathnames(options, schema)

  const transformer = transformerFactory(schema, options, paths)

  applyTransformers(schema, transformer)

  applyToChildren(schema, options)
}

/**
 * Returns an array of pathnames based on the schema and the default settings
 *
 * @access private
 *
 * @param {Object} options a set of options
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
 * Constructs a transformer function that can be applied to toJSON and toObject
 * on the schema
 *
 * @param {Schema} schema a mongoose schema
 * @param {Object} options a set of options
 * @param {array} paths an array of paths
 * @return {Function} a transformer function
 */
function transformerFactory(schema, options, paths) {
  return (target, prevTransform) => (doc, transformed, opt) => {
    const transformation = {
      finalTransform: {},
      options,
      schema,
      target,
      transformed,
    }

    // Apply existing transformer
    applyExisting(transformation, prevTransform, opt)

    // Copy real values
    paths.forEach(copyRealValues(transformation, doc))

    // Copy virtual values
    Object.keys(transformed).forEach(copyVirtualValues(transformation))

    return transformation.finalTransform
  }
}

/**
 * Applies existing transformation if any
 *
 * @param {Object} transformation a transformation value object
 * @param {Function} prevTransform existing transformer function
 * @param {Object} opt transformation options
 *
 * @return {void}
 */
function applyExisting(transformation, prevTransform, opt) {
  if (typeof prevTransform === 'function') {
    const { doc, transformed } = transformation
    transformation.finalTransform = prevTransform(doc, transformed, opt)
  }
}

/**
 * Copy 'real' values (non-virtuals) onto the finalTransform
 *
 * @param {Object} transformation a transformation value object
 * @param {Object} doc the document being transformed
 *
 * @return {Function} transformer function for a given path
 */
function copyRealValues(transformation, doc) {
  return pathname => {
    const { finalTransform, transformed } = transformation

    if (shouldHide(transformation, doc, pathname)) {
      mpath.unset(pathname, finalTransform)
      return
    }

    const value = mpath.get(pathname, transformed)
    if (typeof value !== 'undefined') {
      mpath.set(pathname, value, finalTransform)
    }
  }
}

/**
 * Copy virtual values onto the finalTransform
 *
 * @param {Object} transformation a transformation value object
 * @return {Function} transformer function for a given key
 */
function copyVirtualValues(transformation) {
  return key => {
    const { finalTransform, transformed } = transformation
    if (shouldCopyVirtual(transformation, key)) {
      mpath.set(key, mpath.get(key, transformed), finalTransform)
    }
  }
}

/**
 * Tests to see if the pathname for target is hidden by an option
 *
 * @access private
 *
 * @param {Object} options a set of options
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
 *
 * @param {Schema} schema a mongoose schema
 * @param {string} key the key to test
 * @param {Object} doc original document
 * @param {Object} transformed transformed document
 * @returns {Boolen} true of pathname should be hidden
 */
function testSchema(schema, key, doc, transformed) {
  if (typeof schema === 'undefined') {
    return false
  }

  return (
    schema.options[key] === true ||
    (typeof schema.options[key] === 'function' && schema.options[key](doc, transformed))
  )
}

/**
 * Should a property be hidden er not
 *
 * @access private
 *
 * @param {Object} transformation a transformation value object
 * @param {Object} doc original document
 * @param {string} pathname property path
 * @returns {Boolen} true of pathname should be hidden
 */
function shouldHide({ options, schema, target, transformed }, doc, pathname) {
  const schemaType = schema.path(pathname)
  const hideTarget = hide + target

  // Is hiding turned off?
  if (options[hideTarget] === false) {
    return false
  }

  // Test hide by option or schema
  return (
    testOptions(options, pathname) ||
    testSchema(schemaType, hide, doc, transformed) ||
    testSchema(schemaType, hideTarget, doc, transformed)
  )
}

/**
 * Should a virtual property by be hidden er not
 *
 * @access private
 *
 * @param {Schema} schema a mongoose schema
 * @param {string} key object key name
 * @returns {Boolen} true of pathname should be hidden
 */
function shouldCopyVirtual({ options, schema, target }, key) {
  return (
    schema.pathType(key) === 'virtual' &&
    [hide, `hide${target}`].indexOf(options.virtuals[key]) === -1
  )
}

/**
 * Join key paths
 *
 * @access private
 *
 * @param {string} parent first part
 * @param {string} child second part
 * @returns {string} combined path
 */
function joinKey(parent, child) {
  return parent ? parent + '.' + child : child
}

/**
 * Builds a list of paths based on the schema tree. This includes virtuals and nested objects as well
 *
 * @access private
 *
 * @param {Object} obj the root object
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
 * Returns a safe options lookup function
 *
 * @private
 *
 * @param {Object} options plugin options
 * @return {Function} ensure function
 */
function ensureOption(options) {
  return (option, fallback) => (option in options ? options[option] : fallback)
}

/**
 * Merges interal defaults with plugin defaults
 *
 * @access private
 *
 * @param {Object} defaults the default set of options
 * @returns {Object} a combined options set
 */
function prepDefaults(defaults) {
  return Object.assign(
    {},
    {
      applyRecursively: false,
      autoHide: true,
      autoHideJSON: true,
      autoHideObject: true,
      defaultHidden: { _id: true, __v: true },
      virtuals: {},
    },
    defaults || {}
  )
}

/**
 * Merges options from defaults
 *
 * @access private
 *
 * @param {Object} options an optional set of options
 * @param {Object} defaults the default set of options
 * @returns {Object} a combined options set
 */
function prepOptions(options, defaults) {
  let _options = (options = options || {})

  // Set defaults from options and default
  let ensure = ensureOption(options)
  options = {
    applyRecursively: ensure(applyRecursively, defaults.applyRecursively),
    hide: ensure(hide, defaults.autoHide),
    hideJSON: ensure(hideJSON, defaults.autoHideJSON),
    hideObject: ensure(hideObject, defaults.autoHideObject),
    defaultHidden: Object.assign({}, ensure(defaultHidden, defaults.defaultHidden)),
    virtuals: ensure(virtuals, defaults.virtuals),
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

function applyTransformers(schema, transformer) {
  let toJSONOptions = schema.get('toJSON') || {}

  schema.set('toJSON', {
    getters: toJSONOptions['getters'] || false,
    virtuals: toJSONOptions[virtuals] || false,
    transform: transformer('JSON', toJSONOptions['transform'] || null),
  })

  let toObjectOptions = schema.get('toObject') || {}

  schema.set('toObject', {
    getters: toObjectOptions['getters'] || false,
    virtuals: toObjectOptions[virtuals] || false,
    transform: transformer('Object', toObjectOptions['transform'] || null),
  })
}

function applyToChildren(schema, options) {
  if (options.applyRecursively) {
    schema.childSchemas.forEach(child => {
      plugin(child.schema, options)
    })
  }
}

module.exports = function (defaults) {
  let _defaults = prepDefaults(defaults)

  return function (schema, options) {
    options = prepOptions(options, _defaults)
    return plugin(schema, options)
  }
}
