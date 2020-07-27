# mongoose-hidden :see_no_evil:

[![Build status](http://img.shields.io/travis/mblarsen/mongoose-hidden.svg)](http://travis-ci.org/mblarsen/mongoose-hidden)
[![codebeat badge](https://codebeat.co/badges/05e78d4b-9038-4339-8e67-0702cc4416a2)](https://codebeat.co/projects/github-com-mblarsen-mongoose-hidden-master)
[![Coverage status](https://coveralls.io/repos/github/mblarsen/mongoose-hidden/badge.svg?branch=master)](https://coveralls.io/github/mblarsen/mongoose-hidden?branch=master)
[![Known vulnerabilities](https://snyk.io/test/github/mblarsen/mongoose-hidden/badge.svg)](https://snyk.io/test/github/mblarsen/mongoose-hidden)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)
[![Monthly downloads](https://img.shields.io/npm/dm/mongoose-hidden.svg)](https://www.npmjs.com/package/mongoose-hidden)
[![NPM version](http://img.shields.io/npm/v/mongoose-hidden.svg)](https://www.npmjs.com/package/mongoose-hidden)

A Mongoose schema plugin that hooks into `toJSON()` and `toObject()` to allow hiding of properties you do not want sent client-side, like passwords and other secrets and sensitive information.

 [![Contact me on Codementor](https://www.codementor.io/m-badges/mblarsen/im-a-cm-b.svg)](https://www.codementor.io/@mblarsen?refer=badge)

# Install

```
npm i mongoose-hidden
```

# Usage

A simple example that hides passwords:

```javascript
let mongoose = require('mongoose')
let Schema = mongoose.Schema
let mongooseHidden = require('mongoose-hidden')()

let UserSchema = new Schema(
  name: String,
  password: { type: String, hide: true },
  email: String
)

UserSchema.plugin(mongooseHidden)

let User = mongoose.model('User', UserSchema)
let user = new User({
  name: 'Joe',
  email: 'joe@example.com',
  password: 'secret'
})

user.save(function() {
  console.log(user.toJSON()) // { name: 'Joe', email: 'joe@example.com' }
})
```

### Property params: `hide`, `hideJSON`, `hideObject`

A property will be hidden in all cases when `toJSON` and `toObject` is invoked if the property parameter `hide` is used. Alternatively use `hideJSON` or `hideObject` to target either of the serialization functions.

```javascript
let UserSchema = new Schema(
  ...
  password: { type: String, hideJSON: true }, // hidden for toJSON but not for toObject
  ...
)
```

The value of `hide`, `hideJSON`, and `hideObject` can be a callback with the following signature:

```javascript
function (doc, ret) // same as the transform function callback
```

### Option: `hidden`

If you find yourself hiding the same properties over and over again you can initialize the plugin with the `hidden` option.

There are two ways to set this up and they can be combined for more granular control.

```javascript
// Passing constructor parameters
const mongooseHidden = require('mongoose-hidden')({ hidden: { _id: true, password: true } })
UserSchema.plugin(mongooseHidden)

// Passing plugin parameters when attaching to schema
const mongooseHidden = require('mongoose-hidden')()
UserSchema.plugin(mongooseHidden, { hidden: { _id: true, password: true } })

// Here they are used together
const mongooseHidden = require('mongoose-hidden')({ hidden: { _id: true, password: true } })
UserSchema.plugin(mongooseHidden, { hidden: { resetToken: true } })
PaymentSchema.plugin(mongooseHidden, { hidden: { _id: false, authToken: true } }) // unhides _id

//.. another example:

if (app === 'web') {
  UserSchema.plugin(mongooseHidden, { hidden: { _id: true, password: true } })
} else if (app == 'private-api') {
  UserSchema.plugin(mongooseHidden, { hidden: { password: true } })
} else {
  UserSchema.plugin(mongooseHidden)
}
```

### Option: `defaultHidden`

By default `_id` and `__v` properties are hidden. You can override this behaviour, when you load the plugin:

```javascript
let mongooseHidden = require('mongoose-hidden')({ defaultHidden: { password: true } })
UserSchema.plugin(mongooseHidden)
```

This effectively overrides the plugin defaults leaving only `password` hidden and `_id` and `__v` are left untouched.

Alternatively if you only want to unhide the params hidden by the plugin by default you can pass the plugin option `autoHideJSON` and `autoHideObject` with a value of `false`.

### Option: `virtuals`

Hiding of virtuals can be done as well. Be sure to include the plugin after you turn on virtuals.

```javascript
// By default in Mongoose virtuals will not be included. Turn on before enabling plugin.
schema.set('toJSON', { virtuals: true })
schema.set('toObject', { virtuals: true })

// Enable plugin
schema.plugin(mongooseHidden, { virtuals: { fullname: 'hideJSON' } })
```

The value of the virtuals key can be: `hide`, `hideJSON` and `hideObject`.

For nested virtuals use the path for the key above, e.g. `'nested.virtual': 'hideJSON'`.

_Note: If you don't turn on virtuals for `toObject`, `fullname` in the above example `fullname` will *NOT* be hidden despite its `hideJSON` value._

### Option: `applyRecursively`

Off by default, but when turned on the plugin will attach itself to any child
schemas as well.

### Transform

The `mongoose-hidden` is written as a transform function. If you implement your own transform functions be sure to add them prior to applying the plugin. The plugin will then invoke that function before hiding properties.

```javascript
let mongooseHidden = require('mongoose-hidden')()

// First define transform function
UserSchema.set('toJSON', {
  transform: function (doc, ret, opt) {
    ret['name'] = 'Mr ' + ret['name']
    return ret
  },
})

// Then apply plugin
UserSchema.plugin(mongooseHidden)
```

All names will now be prefixed with "Mr".

# Changelog

See [CHANGELOG.md](https://github.com/mblarsen/mongoose-hidden/blob/master/CHANGELOG.md)

# Limitations

- Always set `{ getters: true, virtuals: true }` before installing plugin if you want virtuals to be returned:

```javascript
schema.set('toJSON', { getters: true, virtuals: true })
schema.plugin(require(mongooseHidden))
```

## Contributors ✨

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="https://github.com/AlbertHambardzumyan"><img src="https://avatars3.githubusercontent.com/u/11527341?v=4" width="100px;" alt=""/><br /><sub><b>Albert Hambardzumyan</b></sub></a><br /><a href="https://github.com/mblarsen/mongoose-hidden/commits?author=AlbertHambardzumyan" title="Tests">⚠️</a> <a href="https://github.com/mblarsen/mongoose-hidden/issues?q=author%3AAlbertHambardzumyan" title="Bug reports">🐛</a></td>
    <td align="center"><a href="https://github.com/awelllle"><img src="https://avatars0.githubusercontent.com/u/25726727?v=4" width="100px;" alt=""/><br /><sub><b>Awele</b></sub></a><br /><a href="https://github.com/mblarsen/mongoose-hidden/commits?author=awelllle" title="Documentation">📖</a></td>
    <td align="center"><a href="http://infiniscene.com"><img src="https://avatars3.githubusercontent.com/u/938128?v=4" width="100px;" alt=""/><br /><sub><b>Dan Trocchio</b></sub></a><br /><a href="https://github.com/mblarsen/mongoose-hidden/issues?q=author%3Alavarsicious" title="Bug reports">🐛</a> <a href="https://github.com/mblarsen/mongoose-hidden/commits?author=lavarsicious" title="Tests">⚠️</a> <a href="https://github.com/mblarsen/mongoose-hidden/commits?author=lavarsicious" title="Code">💻</a></td>
    <td align="center"><a href="https://www.codeboutique.com"><img src="https://avatars0.githubusercontent.com/u/247048?v=4" width="100px;" alt=""/><br /><sub><b>Michael Bøcker-Larsen</b></sub></a><br /><a href="https://github.com/mblarsen/mongoose-hidden/issues?q=author%3Amblarsen" title="Bug reports">🐛</a> <a href="https://github.com/mblarsen/mongoose-hidden/commits?author=mblarsen" title="Code">💻</a> <a href="#maintenance-mblarsen" title="Maintenance">🚧</a> <a href="https://github.com/mblarsen/mongoose-hidden/commits?author=mblarsen" title="Documentation">📖</a></td>
    <td align="center"><a href="https://twitter.com/ohnobinki"><img src="https://avatars2.githubusercontent.com/u/82626?v=4" width="100px;" alt=""/><br /><sub><b>Nathan Phillip Brink</b></sub></a><br /><a href="https://github.com/mblarsen/mongoose-hidden/commits?author=binki" title="Documentation">📖</a></td>
    <td align="center"><a href="https://github.com/Santinell"><img src="https://avatars2.githubusercontent.com/u/3122009?v=4" width="100px;" alt=""/><br /><sub><b>Pavel Evdokimov</b></sub></a><br /><a href="https://github.com/mblarsen/mongoose-hidden/issues?q=author%3ASantinell" title="Bug reports">🐛</a> <a href="https://github.com/mblarsen/mongoose-hidden/commits?author=Santinell" title="Code">💻</a> <a href="https://github.com/mblarsen/mongoose-hidden/commits?author=Santinell" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://github.com/Bajix"><img src="https://avatars3.githubusercontent.com/u/4229773?v=4" width="100px;" alt=""/><br /><sub><b>Thomas Sieverding</b></sub></a><br /><a href="https://github.com/mblarsen/mongoose-hidden/issues?q=author%3ABajix" title="Bug reports">🐛</a> <a href="https://github.com/mblarsen/mongoose-hidden/commits?author=Bajix" title="Code">💻</a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/lykmapipo"><img src="https://avatars3.githubusercontent.com/u/1610857?v=4" width="100px;" alt=""/><br /><sub><b>lally elias</b></sub></a><br /><a href="https://github.com/mblarsen/mongoose-hidden/issues?q=author%3Alykmapipo" title="Bug reports">🐛</a> <a href="https://github.com/mblarsen/mongoose-hidden/commits?author=lykmapipo" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/marshalys"><img src="https://avatars3.githubusercontent.com/u/344530?v=4" width="100px;" alt=""/><br /><sub><b>mars</b></sub></a><br /><a href="https://github.com/mblarsen/mongoose-hidden/issues?q=author%3Amarshalys" title="Bug reports">🐛</a> <a href="https://github.com/mblarsen/mongoose-hidden/commits?author=marshalys" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/proswdev"><img src="https://avatars3.githubusercontent.com/u/9143637?v=4" width="100px;" alt=""/><br /><sub><b>proswdev</b></sub></a><br /><a href="https://github.com/mblarsen/mongoose-hidden/issues?q=author%3Aproswdev" title="Bug reports">🐛</a> <a href="https://github.com/mblarsen/mongoose-hidden/commits?author=proswdev" title="Tests">⚠️</a> <a href="https://github.com/mblarsen/mongoose-hidden/commits?author=proswdev" title="Code">💻</a></td>
  </tr>
</table>

<!-- markdownlint-enable -->
<!-- prettier-ignore-end -->
<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!

