# mongoose-hidden 

[![build status](https://secure.travis-ci.org/mblarsen/mongoose-hidden.png)](http://travis-ci.org/mblarsen/mongoose-hidden)

A Mongoose schema plugin that hooks into `toJSON` and `toObject` to allow filtering of properties you usually do not want to sent client-side.

# Intall

`npm install mongoose-hidden`

# Usage

    var mongoose = require('mongoose'),
        Schema = mongoose.Schema,
        mongooseHidden = require('mongoose-hidden');
    
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

# TODO

* Implement turning on and off on a single invocation (if possible). Something like this:

    `var jsonUser = user.toJSON({ hide: false });`