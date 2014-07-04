# mongoose-hidden 

[![build status](https://secure.travis-ci.org/mblarsen/mongoose-hidden.png)](http://travis-ci.org/mblarsen/mongoose-hidden)

A Mongoose schema plugin that hooks into `toJSON` and `toObject` to allow filtering of properties you usually do not want to sent client-side.

# Intall

`npm install mongoose-hidden`

# Usage

    var mongoose = require('mongoose'),
        Schema = mongoose.Schema,
        mongooseHidden = require('mongoose-hidden')(defaults);
    
    var UserSchema = new Schema(
        name: String,
        password: { type: String, hide: true },
        email: String
    );

    UserSchema.plugin(mongooseHidden);

    var User = mongoose.model('User', UserSchema);
    var user = new User({ name: "Joe", email: "joe@example.com", password: "secret" });
    user.save(function() {
        var jsonUser = user.toJSON();
        console.log(jsonUser);

        // Outputs: { name: "Joe", email: "joe@example.com" }
    });


In stead of `hide: true` you can specify the property to only be hiden for `toJSON` or `toObject` be writing: `hideJSON: true` or `hideObject` respectivly.

Optionally you can use a `function` for `hide`, `hideJSON` or `hideObject`. The function has the following signature and must return `true` if
the property should be filtered:

    function (doc, ret) {
        // return true to filter
    }

The paramters `doc` and `ret` are passed in from the transform fuction. See `toJSON` and `toObject` in the Mongoose documentation.

### Default Hidden

By default `_id` and `__v` properties are hidden when calling either `toJSON` or `toObject`. You can override this behaviour, when you load the plugin:

    var mongooseHidden = require("mongoose-hidden")({ defaultHidden: { password: true } });
    UserSchema.plugin(mongooseHidden);
    
By default `password` and only `password` will be hidden. You don't need to specify `hide: true` in the schema.

To really make use of this feature, make sure to pass in your defaults in a variable like this:

    // app.js
    var modelConfig = { defaultHidden: { password: true } };
    require ('./models/user')(modelConfig);
    
    // models/user.js
    module.exports = function (config) {
        var mongooseHidden = require('mongoose-hidden')(config);
        
        ... schema stuff ...
        
        schema.plugin(mongooseHidden);
        
        ... profit! ...
    };

A different way to configure default hidden properties, is when applying the plugin to the schema:

    UserSchema.plugin(mongooseHidden, { defaultHidden: { password: true } });
    
Doing it this way instead of adding it to the schema direclty allows you to conditionally hide properties. E.g. 

    if (app === 'web') {
        UserSchema.plugin(mongooseHidden, { defaultHidden: { "_id": true, password: true } });
    } else if (app == 'private-api') {
        UserSchema.plugin(mongooseHidden, { defaultHidden: { password: true } });
    } else {
        UserSchema.plugin(mongooseHidden);
    }
    
So depending on the app using the model, different properties would be hidden.

Note: you can change the default behaviour for this `defaultHidden` properties by using `autoHideJSON` and `autoHideObject` in the same way (but only when instantiating the module):

    var mongooseHidden = require("mongoose-hidden")({ autoHideObject: false });
    
What this does, is that when you invoke `toObject` the default hidden properties will no longer be exclude, but they will when invoking `toJSON`.

# Changes

From `0.2.1` => `0.3.0`:

* `require("mongoose-hidden")` is now `require("mongoose-hidden")(defaults)` with optional defaults.

# TODO

* Figure out how to attach `hide` option to virtuals.
* Implement turning on and off on a single invocation (if possible). Something like this:

    `var jsonUser = user.toJSON({ hide: false });`
