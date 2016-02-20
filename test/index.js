var should = require('should'),
  mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  mongooseHidden = require('../index')(),
  log = require('debug')('mongoose-hidden::test');

describe("mongoose-hidden", function () {
  var testUser     = { name: "Joe", email: "joe@example.com", password: "secret" };
  var testUser2    = { name: "Marie", email: "marie@example.com", password: "secret" };
  var testUser3    = { name: "Joe", email: { prefix: 'joe', suffix: 'example.com' }, password: "secret" };
  var testCompany  = { "_id": "5613a1c7e1095d8e71ae90da", "name": "GOGGLE", "code": "GOG" };
  var testPassword = "secret";
  var keyVersion   = "__v";
  var keyId        = "_id";

  var defineModel = function (name, schemaProperties, pluginOptions) {
    if ("object" == typeof name) {
      pluginOptions = schemaProperties;
      schemaProperties = name;
      name = "User";
    }
    var schema = schemaProperties instanceof Schema ? schemaProperties : new Schema(schemaProperties);
    schema.plugin(mongooseHidden, pluginOptions || {});
    return mongoose.model(name, schema, undefined);
  };

  before(function (done) {
    mongoose.connect('mongodb://localhost/mongoose-hidden', function(err) {
      if (err) {
        console.error('MongoDB: ' + err.message);
        console.error('MongoDB is running? Is it accessible by this application?');
        return done(err);
      }
      mongoose.connection.db.dropDatabase(done);
    });
  });

  afterEach(function (done) {
    mongoose.modelSchemas = {};
    mongoose.models = {};
    mongoose.connection.db.dropDatabase(done);
  });

  after(function (done) {
    mongoose.connection.close(done);
  });

  describe("A model with no hidden properties defined", function () {
    it("Should return all properties", function (done) {
      var User = defineModel({
        name: String,
        email: String,
        password: String
      });
      var user = new User(testUser);
      var userJson = user.toJSON();
      userJson.name.should.equal("Joe");
      userJson.email.should.equal("joe@example.com");
      userJson.password.should.equal(testPassword);
      done();
    });
  });

  describe("A model with a hidden properties defined", function () {
    it("Shouldn't return that property", function (done) {
      var User = defineModel({
        name: String,
        email: String,
        password: { type: String, hide: true }
      });
      var user = new User(testUser);
      var userJson = user.toJSON();
      userJson.name.should.equal("Joe");
      userJson.email.should.equal("joe@example.com");
      should.not.exist(userJson.password);
      done();
    });
  });

  describe("A model with default hidden properties defined", function () {
    it("Shouldn't return __v property", function (done) {
      var User = defineModel({
        keyVersion: String,
        name: String,
        email: String,
        password: { type: String, hide: true }
      });
      var user = new User(testUser);
      user.save(function () {
        var userJson = user.toJSON();
        userJson.name.should.equal("Joe");
        userJson.email.should.equal("joe@example.com");
        should.not.exist(userJson.password);
        should.not.exist(userJson[keyVersion]);
        done();
      });
    });
  });

  describe("Default hiding turned off", function () {
    it("Shouldn't hide any properties", function (done) {
      var User = defineModel({
        name: String,
        email: String,
        password: { type: String, hide: true }
      }, { hide: false });
      var user = new User(testUser);
      user.save(function () {
        var userJson = user.toJSON();
        userJson.name.should.equal("Joe");
        userJson.email.should.equal("joe@example.com");
        testPassword.should.equal(userJson.password);
        should.exist(userJson[keyVersion]);
        should.exist(userJson[keyId]);
        done();
      });
    });
  });

  describe("Default hiding turned off for JSON only", function () {
    it("Shouldn't hide any properties", function (done) {
      var User = defineModel({
        name: String,
        email: String,
        password: { type: String, hide: true }
      }, { hideJSON: false });

      var user = new User(testUser);
      user.save(function () {
        var userJson = user.toJSON();
        userJson.name.should.equal("Joe");
        userJson.email.should.equal("joe@example.com");
        userJson.password.should.equal(testPassword);
        should.exist(userJson[keyVersion]);
        should.exist(userJson[keyId]);

        var userObject = user.toObject();
        userObject.name.should.equal("Joe");
        userObject.email.should.equal("joe@example.com");
        should.not.exist(userObject["password"]);
        should.not.exist(userObject[keyVersion]);
        should.not.exist(userObject[keyId]);
        done();
      });
    });
  });

  describe("Default hiding turned off for object only", function () {
    it("Shouldn't hide any properties", function (done) {
      var User = defineModel({
        name: String,
        email: String,
        password: { type: String, hide: true }
      }, { hideObject: false });

      var user = new User(testUser);
      user.save(function () {
        var userObject = user.toObject();
        userObject.name.should.equal("Joe");
        userObject.email.should.equal("joe@example.com");
        userObject.password.should.equal(testPassword);
        should.exist(userObject[keyVersion]);
        should.exist(userObject[keyId]);

        var userJson = user.toJSON();
        userJson.name.should.equal("Joe");
        userJson.email.should.equal("joe@example.com");
        should.not.exist(userJson["password"]);
        should.not.exist(userJson[keyVersion]);
        should.not.exist(userJson[keyId]);
        done();
      });
    });
  });

  describe("Default hiding on, JSON option property", function () {
    it("Shouldn't hide any properties", function (done) {
      var User = defineModel({
        name: String,
        email: String,
        password: { type: String, hideJSON: true }
      });

      var user = new User(testUser);
      user.save(function () {
        var userObject = user.toObject();
        userObject.name.should.equal("Joe");
        userObject.email.should.equal("joe@example.com");
        userObject.password.should.equal(testPassword);

        var userJson = user.toJSON();
        userJson.name.should.equal("Joe");
        userJson.email.should.equal("joe@example.com");
        should.not.exist(userJson["password"]);
        done();
      });
    });
  });

  describe("Default hiding on, object option property", function () {
    it("Shouldn't hide any properties", function (done) {
      var User = defineModel({
        name: String,
        email: String,
        password: { type: String, hideObject: true }
      });

      var user = new User(testUser);
      user.save(function () {
        var userObject = user.toObject();
        userObject.name.should.equal("Joe");
        userObject.email.should.equal("joe@example.com");
        should.not.exist(userObject["password"]);

        var userJson = user.toJSON();
        userJson.name.should.equal("Joe");
        userJson.email.should.equal("joe@example.com");
        userJson.password.should.equal(testPassword);
        done();
      });
    });
  });

  describe("Default hiding on, object option property off", function () {
    it("Shouldn't hide any properties", function (done) {
      var User = defineModel({
        name: String,
        email: String,
        password: { type: String, hideObject: false } // basically has no effect unless `true`
      });

      var user = new User(testUser);
      user.save(function () {
        var userObject = user.toObject();
        userObject.name.should.equal("Joe");
        userObject.email.should.equal("joe@example.com");
        userObject.password.should.equal(testPassword);

        var userJson = user.toJSON();
        userJson.name.should.equal("Joe");
        userJson.email.should.equal("joe@example.com");
        userJson.password.should.equal(testPassword);
        done();
      });
    });
  });

  describe("A model with a hidden properties defined using function", function () {
    it("Shouldn't return password property for Joe for both JSON and object", function (done) {
      var testFunction = function (doc, ret) {
        return doc.name === 'Joe';
      }
      var User = defineModel({
        name: String,
        email: String,
        password: { type: String, hide: testFunction }
      });

      var user = new User(testUser);
      var userJson = user.toJSON();
      userJson.name.should.equal("Joe");
      userJson.email.should.equal("joe@example.com");
      should.not.exist(userJson.password);
      var userObject = user.toObject();
      userObject.name.should.equal("Joe");
      userObject.email.should.equal("joe@example.com");
      should.not.exist(userObject.password);

      user = new User(testUser2);
      userJson = user.toJSON();
      userJson.name.should.equal("Marie");
      userJson.email.should.equal("marie@example.com");
      userJson.password.should.equal(testPassword);
      userObject = user.toJSON();
      userObject.name.should.equal("Marie");
      userObject.email.should.equal("marie@example.com");
      userObject.password.should.equal(testPassword);

      done();
    });
  });

  describe("A model with a hidden properties defined using function for JSON", function () {
    it("Shouldn't return password property for Joe for only for JSON", function (done) {
      var testFunction = function (doc, ret) {
        return doc.name === 'Joe';
      }
      var User = defineModel({
        name: String,
        email: String,
        password: { type: String, hideJSON: testFunction }
      });

      var user = new User(testUser);
      var userJson = user.toJSON();
      userJson.name.should.equal("Joe");
      userJson.email.should.equal("joe@example.com");
      should.not.exist(userJson.password);
      var userObject = user.toObject();
      userObject.name.should.equal("Joe");
      userObject.email.should.equal("joe@example.com");
      userObject.password.should.equal(testPassword);

      user = new User(testUser2);
      userJson = user.toJSON();
      userJson.name.should.equal("Marie");
      userJson.email.should.equal("marie@example.com");
      userJson.password.should.equal(testPassword);
      userObject = user.toObject();
      userObject.name.should.equal("Marie");
      userObject.email.should.equal("marie@example.com");
      userObject.password.should.equal(testPassword);

      done();
    });
  });

  describe("A model with a hidden properties defined using function for object", function () {
    it("Shouldn't return password property for Joe for only for object", function (done) {
      var testFunction = function (doc, ret) {
        return doc.name === 'Joe';
      }
      var User = defineModel({
        name: String,
        email: String,
        password: { type: String, hideObject: testFunction }
      });

      var user = new User(testUser);
      var userJson = user.toJSON();
      userJson.name.should.equal("Joe");
      userJson.email.should.equal("joe@example.com");
      userJson.password.should.equal(testPassword);
      var userObject = user.toObject();
      userObject.name.should.equal("Joe");
      userObject.email.should.equal("joe@example.com");
      should.not.exist(userObject.password);

      user = new User(testUser2);
      userJson = user.toJSON();
      userJson.name.should.equal("Marie");
      userJson.email.should.equal("marie@example.com");
      userJson.password.should.equal(testPassword);
      userObject = user.toObject();
      userObject.name.should.equal("Marie");
      userObject.email.should.equal("marie@example.com");
      userObject.password.should.equal(testPassword);

      done();
    });
  });

  describe("A model with password set as default hidden", function () {
    it("Shouldn't return password", function (done) {
      var UserSchema = new Schema({
        name: String,
        email: String,
        password: String
      });
      UserSchema.plugin(require('../index')({ defaultHidden: { "password" : true }}));
      var User = mongoose.model('User', UserSchema, undefined, { cache: false});
      var user = new User(testUser);
      user.save(function () {
        var userJson = user.toJSON();
        userJson.name.should.equal("Joe");
        userJson.email.should.equal("joe@example.com");
        should.not.exist(userJson["password"]);
        done();
      });
    });
  });

  describe("A model with password and password set as default hidden overriden with option", function () {
    it("Should return password", function (done) {
      var UserSchema = new Schema({
        name: String,
        email: String,
        password: String
      });
      UserSchema.plugin(require('../index')({ defaultHidden: { "password" : true }}), { defaultHidden: { }});
      var User = mongoose.model('User', UserSchema, undefined, { cache: false});
      var user = new User(testUser);
      user.save(function () {
        var userJson = user.toJSON();
        userJson.name.should.equal("Joe");
        userJson.email.should.equal("joe@example.com");
        userJson.password.should.equal(testPassword);
        done();
      });
    });
  });

  describe("A model with a virtuals defined", function () {
    it("Shouldn't return that property if option not passed", function (done) {
      var User = defineModel({
        name: String,
        email: String,
        password: { type: String, hide: true }
      });
      User.schema.virtual('niceEmail').get(function () { return '"' + this.name + '" <' + this.email + '>'; });
      var user = new User(testUser);
      var userJson = user.toJSON();
      userJson.name.should.equal("Joe");
      userJson.email.should.equal("joe@example.com");
      should.not.exist(userJson['niceEmail']);
      should.not.exist(userJson.password);
      done();
    });

    it("Should return that property if option is passed", function (done) {
      var schema = new Schema({
        name: String,
        email: String,
        password: { type: String, hide: true }
      });
      schema.set('toJSON', { getters: true, virtuals: true });
      schema.plugin(require('../index')());
      schema.virtual('niceEmail').get(function () { return '"' + this.name + '" <' + this.email + '>'; });
      var User = mongoose.model('VirtualUser', schema);
      var user = new User(testUser);
      user.niceEmail.should.equal('"Joe" <joe@example.com>');
      var userJson = user.toJSON();
      userJson.name.should.equal("Joe");
      userJson.email.should.equal("joe@example.com");
      should.exist(userJson['niceEmail']);
      userJson.niceEmail.should.equal('"Joe" <joe@example.com>');
      // should.not.exist(userJson['id']);
      should.not.exist(userJson.password);
      done();
    });

    it("Shouldn't return that property even if option is passed", function (done) {
      var schema = new Schema({
        name: String,
        email: String,
        password: { type: String, hide: true }
      });
      schema.set('toJSON', { getters: true, virtuals: true });
      schema.plugin(require('../index')(), { virtuals: { id: 'hide', niceEmail: 'hide' }});
      schema.virtual('niceEmail').get(function () { return '"' + this.name + '" <' + this.email + '>'; });
      var User = mongoose.model('VirtualUser2', schema);
      var user = new User(testUser);
      user.niceEmail.should.equal('"Joe" <joe@example.com>');
      var userJson = user.toJSON();
      userJson.name.should.equal("Joe");
      userJson.email.should.equal("joe@example.com");
      // should.not.exist(userJson['id']);
      should.not.exist(userJson['niceEmail']);
      should.not.exist(userJson.password);
      done();
    });

    it("Shouldn't return that property even if option is passed, unless object", function (done) {
      var schema = new Schema({
        name: String,
        email: String,
        password: { type: String, hide: true }
      });
      schema.set('toJSON', { getters: true, virtuals: true });
      schema.set('toObject', { getters: true, virtuals: true });
      schema.plugin(require('../index')(), { virtuals: { niceEmail: 'hideObject' }});
      schema.virtual('niceEmail').get(function () { return '"' + this.name + '" <' + this.email + '>'; });
      var User = mongoose.model('VirtualUser3', schema);
      var user = new User(testUser);
      user.niceEmail.should.equal('"Joe" <joe@example.com>');
      var userJson = user.toJSON();
      userJson.name.should.equal("Joe");
      userJson.email.should.equal("joe@example.com");
      should.exist(userJson['niceEmail']);
      userJson.niceEmail.should.equal('"Joe" <joe@example.com>');
      should.not.exist(userJson.password);

      var userObject = user.toObject();
      userObject.name.should.equal("Joe");
      userObject.email.should.equal("joe@example.com");
      should.not.exist(userObject['niceEmail']);
      should.not.exist(userObject.password);
      done();
    });
  });

  // Ticket: https://github.com/mblarsen/mongoose-hidden/issues/1
  describe("A document with nested documents when hiding", function () {
    it("Shouldn't remove it's nested documents", function (done) {
      mongoose.modelSchemas = {};
      mongoose.models = {};
      var Company = defineModel("Company", {
        name: String,
        code: String,
      }, { hideObject: false}, {});
      var User = defineModel("User", {
        name: String,
        email: String,
        company: { type: Schema.ObjectId, ref: 'Company' },
        password: { type: String, hide: true }
      });

      var company = new Company(testCompany);
      var user = new User(testUser);
      company.save(function(err, freshCompany) {
        user.company = company._id;
        user.save(function() {
          User.findOne().populate('company').exec(function (err, freshUser) {
            should.exist(freshUser.company);
            freshUser.company.name.should.equal('GOGGLE');
            var userJson = freshUser.toJSON();
            should.not.exist(userJson.password);
            should.exist(userJson.company);
            should.equal("GOGGLE", userJson.company.name);
            done();
          });
        });
      });
    });
  });

  describe("A model with a transform", function () {
    it("should transform", function (done) {
      var MrUserSchema = new Schema({
        name: String,
        password: { type: String, hide: true }
      });

      MrUserSchema.set('toJSON', { transform: function (doc, ret, opt) {
        ret['name'] = 'Mr. ' + ret['name'];
        return ret;
      }});

      var User = mongoose.model('User', MrUserSchema, undefined, { cache: false });
      var user = new User(testUser);

      var userJson = user.toJSON();
      userJson.name.should.equal("Mr. Joe");
      userJson.password.should.equal(testPassword);
      done();
    });
    it("should still transform after adding plugin", function (done) {
      var MrUserSchema = new Schema({
        name: String,
        password: { type: String, hide: true }
      });

      MrUserSchema.set('toJSON', { transform: function (doc, ret, opt) {
        ret['name'] = 'Mr. ' + ret['name'];
        return ret;
      }});

      var User = defineModel(MrUserSchema);
      var user = new User(testUser);

      var userJson = user.toJSON();
      userJson.name.should.equal("Mr. Joe");
      should.not.exist(userJson.password);
      done();
    });
  });

  // Github issue: https://github.com/mblarsen/mongoose-hidden/issues/3
  describe("A model with other documents", function () {
    it("Should return the object property", function (done) {
      var User = defineModel({
        name: String,
        email: {
          prefix: String,
          suffix: String
        },
        password: String
      });
      var user = new User(testUser3);
      var userJson = user.toObject();
      userJson.should.deepEqual(testUser3);
      done();
    });
  });
});
