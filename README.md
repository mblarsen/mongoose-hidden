# mongoose-hidden

[![build status](http://img.shields.io/travis/mblarsen/mongoose-hidden.svg)](http://travis-ci.org/mblarsen/mongoose-hidden) [![Average time to resolve an issue](http://isitmaintained.com/badge/resolution/mblarsen/mongoose-hidden.svg)](http://isitmaintained.com/project/mblarsen/mongoose-hidden "Average time to resolve an issue") [![Coverage Status](https://coveralls.io/repos/github/mblarsen/mongoose-hidden/badge.svg?branch=master)](https://coveralls.io/github/mblarsen/mongoose-hidden?branch=master) [![NPM version](http://img.shields.io/npm/v/mongoose-hidden.svg)](https://www.npmjs.com/package/mongoose-hidden/) [![](https://img.shields.io/npm/dm/mongoose-hidden.svg)](https://www.npmjs.com/package/mongoose-hidden/)
[![Get help on Codementor](https://cdn.codementor.io/badges/get_help_github.svg)](https://www.codementor.io/mblarsen) [![Join the chat at https://gitter.im/mblarsen/mongoose-hidden](https://badges.gitter.im/mblarsen/mongoose-hidden.svg)](https://gitter.im/mblarsen/mongoose-hidden?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

[![Beerpay](https://beerpay.io/mblarsen/mongoose-hidden/badge.svg?style=beer)](https://beerpay.io/mblarsen/mongoose-hidden) [![Beerpay](https://beerpay.io/mblarsen/mongoose-hidden/make-wish.svg?style=flat)](https://beerpay.io/mblarsen/mongoose-hidden)  

A Mongoose schema plugin that hooks into `toJSON()` and `toObject()` to allow hiding of properties you do not want sent client-side.

# Install

    npm install --save mongoose-hidden

# Usage

A simple example the hides passwords:

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

### Property params: `hide`, `hideJSON`, `hideObject`

A property will be hidden in all cases when `toJSON` and `toObject` is invoked if the property parameter `hide` is used. Alternatively use `hideJSON` or `hideObject` to target either of the serialization functions.

    let UserSchema = new Schema(
        ...
        password: { type: String, hideJSON: true }, // hidden for toJSON but not for toObject
        ...
    )

The value of `hide`, `hideJSON`, and `hideObject` can be a callback with the following signature:

    function (doc, ret) // same as the transform function callback

### Option: `hidden`

_since 0.7_

If you find yourself hiding the same properties over and over again you can initialize the plugin with the `hidden` option.

There are two methods: when creating the plugin and when attaching the plugin, and they can be combined.

#### Method 1: constructor param

    let mongooseHidden = require('mongoose-hidden')({ hidden: { _id: true, password: true } })
    UserSchema.plugin(mongooseHidden)

#### Method 2: attach plugin param

    let mongooseHidden = require('mongoose-hidden')()
    UserSchema.plugin(mongooseHidden, { hidden: { _id: true, password: true } })

#### Method 1+2: combination

    let mongooseHidden = require('mongoose-hidden')({ hidden: { _id: true, password: true } })
    UserSchema.plugin(mongooseHidden, { hidden: { resetToken: true } })
    PaymentSchema.plugin(mongooseHidden, { hidden: { _id: false, authToken: true } }) // unhides _id

.. another example:

    if (app === 'web') {
        UserSchema.plugin(mongooseHidden, { hidden: { _id: true, password: true } })
    } else if (app == 'private-api') {
        UserSchema.plugin(mongooseHidden, { hidden: { password: true } })
    } else {
        UserSchema.plugin(mongooseHidden)
    }

### Option: `defaultHidden`

By default `_id` and `__v` properties are hidden. You can override this behaviour, when you load the plugin:

    let mongooseHidden = require('mongoose-hidden')({ defaultHidden: { password: true } })
    UserSchema.plugin(mongooseHidden)

This effectively overrides the plugin defaults leaving only `password` hidden and `_id` and `__v` are left untouched.

Alternatively if you only want to unhide the params hidden by the plugin by default you can pass the plugin option `autoHideJSON` and `autoHideObject` with a value of `false`.

### Option: `virtuals`

_since 0.3.1_

Hiding of virtuals can be done as well. Be sure to include the plugin after you turn on virtuals.

    // By default in Mongoose virtuals will not be included. Turn on before enabling plugin.
    schema.set('toJSON', { virtuals: true });
    schema.set('toObject', { virtuals: true });

    // Enable plugin
    schema.plugin(mongooseHidden, { virtuals: { fullname: 'hideJSON' }});

The value of the virtuals key can be: `hide`, `hideJSON` and `hideObject`.

If have nested virtuals use the path for the key above, e.g. `'nested.virtual': 'hideJSON'`.

_Note: If you don't turn on virtuals for `toObject`, `fullname` in the above example `fullname` will *NOT* be hidden despite its `hideJSON` value._

### Transform

_since 0.6_

The `mongoose-hidden` is written as a transform function. If you implement your own transform functions be sure to add them to prior to applying the plugin. The plugin will then invoke that function before hiding properties.

    let mongooseHidden = require('mongoose-hidden')()

    // First define transform function
    UserSchema.set('toJSON', { transform: function (doc, ret, opt) {
        ret['name'] = 'Mr ' + ret['name']
        return ret
    }})

    // Then apply plugin
    UserSchema.plugin(mongooseHidden)

All names will now be prefixed with "Mr".

# Changelog

See [CHANGELOG.md](https://github.com/mblarsen/mongoose-hidden/blob/master/CHANGELOG.md)

# Limitations

* Always set `{ getters: true, virtuals: true }` before installing plugin if you want virtuals to be returned:

    schema.set('toJSON', { getters: true, virtuals: true });
    schema.plugin(require(mongooseHidden));

* Recursive use of hide not supported, but nested documents/objects are supported.
