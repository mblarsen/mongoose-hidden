const mpath = require('mpath')

const _originalSet = mpath.set

// mpath will not set a value undefined keys
// so we traverse backwards to the last known
// key recursively
mpath.set = function(path, value, obj) {
  if (typeof path !== 'string') {
    throw new TypeError('Invalid `path`. Must be string')
  }
  _originalSet(path, value, obj)
  if (mpath.get(path, obj) !== value) {
    const pos = path.lastIndexOf('.')
    const key = path.substr(pos + 1)
    if (key === path) {
      obj[key] = value
    } else {
      mpath.set(path.substr(0, pos), { [key]: value }, obj)
    }
  }
}

module.exports = mpath
