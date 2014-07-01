var should = require('should'),
  mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  mongooseHidden = require('../index');
  
describe("mongoose-hidden", function () {
  
  before(function(done) {
    mongoose.connect('mongodb://localhost/mongoose-hidden', function(err) {
      if (err) {
        console.error('MongoDB: ' + err.message)
        console.error('MongoDB is running? Is it accessible by this application?')
        return done(err)
      }
      mongoose.connection.db.dropDatabase(done)
    })
  })

  after(function(done) {
    mongoose.connection.close(done)
  })
  
  describe("A model with no hidden properties defined", function () {
    it("Should return all properties", function (done) {
      var UserSchema = new Schema({
        name: String,
        email: String,
        password: String
      });
      UserSchema.plugin(mongooseHidden);
      var User = mongoose.model('User', UserSchema);
      var user = new User({ name: "Joe", email: "foo@example.com", password: "secret" });
      var userJson = user.toJSON();
      userJson.name.should.equal("Joe");
      userJson.email.should.equal("foo@example.com");
      userJson.password.should.equal("secret");
      done();
    });
  });

  describe("A model with a hidden properties defined", function () {
    it("Shouldn't return that property", function (done) {
      var UserHiddenSchema = new Schema({
        name: String,
        email: String,
        password: { type: String, hide: true }
      });
      UserHiddenSchema.plugin(mongooseHidden);
      var UserHidden = mongoose.model('UserHidden', UserHiddenSchema);
      var userHidden = new UserHidden({ name: "Joe", email: "foo@example.com", password: "secret" });
      var userJson = userHidden.toJSON();
      userJson.name.should.equal("Joe");
      userJson.email.should.equal("foo@example.com");
      should.not.exist(userJson.password);
      done();
    });
  });

  describe("A model with default hidden properties defined", function () {
    it("Shouldn't return that property", function (done) {
      var UserHiddenSchema = new Schema({
        "__v": String,
        name: String,
        email: String,
        password: { type: String, hide: true }
      });
      UserHiddenSchema.plugin(mongooseHidden);
      var UserHidden = mongoose.model('UserHidden2', UserHiddenSchema);
      var userHidden = new UserHidden({ name: "Joe", email: "foo@example.com", password: "secret" });
      userHidden.save(function () {
        var userJson = userHidden.toJSON();
        userJson.name.should.equal("Joe");
        userJson.email.should.equal("foo@example.com");
        should.not.exist(userJson.password);
        should.not.exist(userJson["__v"]);
        done();
      });
    });
  });
  
  describe("Default hiding turned off", function () {
    it("Shouldn't hide any properties", function (done) {
      var UserHiddenSchema = new Schema({
        name: String,
        email: String,
        password: { type: String, hide: true }
      });
      UserHiddenSchema.plugin(mongooseHidden, { hide: false });
      var UserHidden = mongoose.model('UserHidden3', UserHiddenSchema);
      var userHidden = new UserHidden({ name: "Joe", email: "foo@example.com", password: "secret" });
      userHidden.save(function () {
        var userJson = userHidden.toJSON();
        userJson.name.should.equal("Joe");
        userJson.email.should.equal("foo@example.com");
        userJson.password.should.equal("secret");
        should.exist(userJson["__v"]);
        should.exist(userJson["_id"]);
      
        done();
      });
    });
  });

  describe("Default hiding turned off for JSON only", function () {
    it("Shouldn't hide any properties", function (done) {
      var UserHiddenSchema = new Schema({
        name: String,
        email: String,
        password: { type: String, hide: true }
      });
      UserHiddenSchema.plugin(mongooseHidden, { hideJSON: false });
      var UserHidden = mongoose.model('UserHidden4', UserHiddenSchema);
      var userHidden = new UserHidden({ name: "Joe", email: "foo@example.com", password: "secret" });
      userHidden.save(function () {
        var userJson = userHidden.toJSON();
        userJson.name.should.equal("Joe");
        userJson.email.should.equal("foo@example.com");
        userJson.password.should.equal("secret");
        should.exist(userJson["__v"]);
        should.exist(userJson["_id"]);

        var userObject = userHidden.toObject();
        userObject.name.should.equal("Joe");
        userObject.email.should.equal("foo@example.com");
        should.not.exist(userObject["password"]);
        should.not.exist(userObject["__v"]);
        should.not.exist(userObject["_id"]);
        done();
      });
    });
  });  

  describe("Default hiding turned off for object only", function () {
    it("Shouldn't hide any properties", function (done) {
      var UserHiddenSchema = new Schema({
        name: String,
        email: String,
        password: { type: String, hide: true }
      });
      UserHiddenSchema.plugin(mongooseHidden, { hideObject: false });
      var UserHidden = mongoose.model('UserHidden5', UserHiddenSchema);
      var userHidden = new UserHidden({ name: "Joe", email: "foo@example.com", password: "secret" });
      userHidden.save(function () {
        var userObject = userHidden.toObject();
        userObject.name.should.equal("Joe");
        userObject.email.should.equal("foo@example.com");
        userObject.password.should.equal("secret");
        should.exist(userObject["__v"]);
        should.exist(userObject["_id"]);

        var userJson = userHidden.toJSON();
        userJson.name.should.equal("Joe");
        userJson.email.should.equal("foo@example.com");
        should.not.exist(userJson["password"]);
        should.not.exist(userJson["__v"]);
        should.not.exist(userJson["_id"]);
        done();
      });
    });
  });  
  
  describe("Default hiding on, JSON option property", function () {
    it("Shouldn't hide any properties", function (done) {
      var UserHiddenSchema = new Schema({
        name: String,
        email: String,
        password: { type: String, hideJSON: true }
      });
      UserHiddenSchema.plugin(mongooseHidden);
      var UserHidden = mongoose.model('UserHidden6', UserHiddenSchema);
      var userHidden = new UserHidden({ name: "Joe", email: "foo@example.com", password: "secret" });
      userHidden.save(function () {
        var userObject = userHidden.toObject();
        userObject.name.should.equal("Joe");
        userObject.email.should.equal("foo@example.com");
        userObject.password.should.equal("secret");

        var userJson = userHidden.toJSON();
        userJson.name.should.equal("Joe");
        userJson.email.should.equal("foo@example.com");
        should.not.exist(userJson["password"]);
        done();
      });
    });
  });  

  describe("Default hiding on, object option property", function () {
    it("Shouldn't hide any properties", function (done) {
      var UserHiddenSchema = new Schema({
        name: String,
        email: String,
        password: { type: String, hideObject: true }
      });
      UserHiddenSchema.plugin(mongooseHidden);
      var UserHidden = mongoose.model('UserHidden7', UserHiddenSchema);
      var userHidden = new UserHidden({ name: "Joe", email: "foo@example.com", password: "secret" });
      userHidden.save(function () {
        var userObject = userHidden.toObject();
        userObject.name.should.equal("Joe");
        userObject.email.should.equal("foo@example.com");
        should.not.exist(userObject["password"]);

        var userJson = userHidden.toJSON();
        userJson.name.should.equal("Joe");
        userJson.email.should.equal("foo@example.com");
        userJson.password.should.equal("secret");
        done();
      });
    });
  });
  
  describe("Default hiding on, object option property off", function () {
    it("Shouldn't hide any properties", function (done) {
      var UserHiddenSchema = new Schema({
        name: String,
        email: String,
        password: { type: String, hideObject: false } // basically has no effect unless `true`
      });
      UserHiddenSchema.plugin(mongooseHidden);
      var UserHidden = mongoose.model('UserHidden8', UserHiddenSchema);
      var userHidden = new UserHidden({ name: "Joe", email: "foo@example.com", password: "secret" });
      userHidden.save(function () {
        var userObject = userHidden.toObject();
        userObject.name.should.equal("Joe");
        userObject.email.should.equal("foo@example.com");
        userObject.password.should.equal("secret");

        var userJson = userHidden.toJSON();
        userJson.name.should.equal("Joe");
        userJson.email.should.equal("foo@example.com");
        userJson.password.should.equal("secret");
        done();
      });
    });
  });  
});
