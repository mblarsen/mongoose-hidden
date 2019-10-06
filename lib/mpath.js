const mpath = require('mpath')

/**
 * Convert path parts into a nested object
 *
 * @access private
 * @param {array} parts an array of parts on the path
 * @param {mixed} value the value to set at the end of the path
 * @returns {object} an object corresponding to the path that the parts represents
 */
const partsToValue = function(parts, value) {
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
const setPath = function(obj, path, value) {
  const parts = path.split('.')

  /* traverse existing path to nearest object */
  while (parts.length > 1 && typeof obj[parts[0]] === 'object') {
    obj = obj[parts.shift()]
  }

  /* set value */
  obj[parts[0]] = partsToValue(parts.slice(1), value)
}

module.exports = {
  set: function(path, value, obj) {
    setPath(obj, path, value)
  },
  get: mpath.get,
  unset: mpath.unset,
}
