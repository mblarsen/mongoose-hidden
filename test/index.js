"use strict";

const should = require('should')
const mongoose = require('mongoose')
const plugin = require('../index')

const Schema = mongoose.Schema
const mongooseHidden = plugin()

const setPath = plugin.__test__.setPath

describe("mongoose-hidden", function () {
  let testUser = { name: "Joe", email: "joe@example.com", password: "secret" }
  let testUserSub = { name: "Joe", email: "joe@example.com", password: "secret", spouse: { name: "Maries" } }
  let testUserSub2 = { name: "Joe", email: "joe@example.com", password: "secret", spouse: { name: "Maries", age: 37 } }
  let testUser2 = { name: "Marie", email: "marie@example.com", password: "secret" }
  let testUser3 = { name: "Joe", email: { prefix: 'joe', suffix: 'example.com' }, password: "secret" }
  let testCompany = { "_id": "5613a1c7e1095d8e71ae90da", "name": "GOGGLE", "code": "GOG" }
  let testCompany2 = { "_id": "5613a1c7e1095d8e71ae90db", "name": "APPLE", "code": "APL" }
  let testPassword = "secret"
  let keyVersion = "__v"
  let keyId = "_id"

  let defineModel = function (name, schemaProperties, pluginOptions) {
    if (typeof name === 'object') {
      pluginOptions = schemaProperties
      schemaProperties = name
      name = "User"
    }
    let schema = schemaProperties instanceof Schema ? schemaProperties : new Schema(schemaProperties)
    schema.plugin(mongooseHidden, pluginOptions || {})
    return mongoose.model(name, schema, undefined)
  }

  before(function (done) {
    mongoose.connect('mongodb://localhost/mongoose-hidden', function (err) {
      if (err) {
        console.error('MongoDB: ' + err.message)
        console.error(
          'MongoDB is running? Is it accessible by this application?'
        )
        return done(err)
      }
      mongoose.connection.db.dropDatabase(done)
    })
  })

  afterEach(function (done) {
    mongoose.modelSchemas = {}
    mongoose.models = {}
    mongoose.connection.db.dropDatabase(done)
  })

  after(function (done) {
    mongoose.connection.close(done)
  })

  describe("A model with no hidden properties defined", function () {
    it("should return all properties", function (done) {
      let User = defineModel({
        name: String,
        email: String,
        password: String
      })
      let user = new User(testUser)
      let userJson = user.toJSON()
      userJson.name.should.equal("Joe")
      userJson.email.should.equal("joe@example.com")
      userJson.password.should.equal(testPassword)
      done()
    })
  })

  describe("A model with a hidden properties defined", function () {
    it("shouldn't return those property", function (done) {
      let User = defineModel({
        name: String,
        email: String,
        password: {
          type: String,
          hide: true
        }
      })
      let user = new User(testUser)
      let userJson = user.toJSON()
      userJson.name.should.equal("Joe")
      userJson.email.should.equal("joe@example.com")
      should.not.exist(userJson.password)
      done()
    })
  })

  describe("A model with default hidden properties defined", function () {
    it("shouldn't return __v property", function (done) {
      let User = defineModel({
        name: String,
        email: String,
        password: {
          type: String,
          hide: true
        }
      })
      let user = new User(testUser)
      user.save(function () {
        let userJson = user.toJSON()
        userJson.name.should.equal("Joe")
        userJson.email.should.equal("joe@example.com")
        should.not.exist(userJson.password)
        should.not.exist(userJson[keyVersion])
        done()
      })
    })
  })

  describe("Default hiding turned off", function () {
    it("shouldn't hide any properties", function (done) {
      let User = defineModel({
        name: String,
        email: String,
        password: {
          type: String,
          hide: true
        }
      }, { hide: false, hideJSON: true, hideObject: true })
      let user = new User(testUser)
      user.save(function () {
        let userJson = user.toJSON()
        userJson.name.should.equal("Joe")
        userJson.email.should.equal("joe@example.com")
        testPassword.should.equal(userJson.password)
        should.exist(userJson[keyVersion])
        should.exist(userJson[keyId])
        done()
      })
    })
  })

  describe("Default hiding turned off for JSON only", function () {
    it("shouldn't hide any properties", function (done) {
      let User = defineModel({
        name: String,
        email: String,
        password: {
          type: String,
          hide: true
        }
      }, { hideJSON: false })

      let user = new User(testUser)
      user.save(function () {
        let userJson = user.toJSON()
        userJson.name.should.equal("Joe")
        userJson.email.should.equal("joe@example.com")
        userJson.password.should.equal(testPassword)
        should.exist(userJson[keyVersion])
        should.exist(userJson[keyId])

        let userObject = user.toObject()
        userObject.name.should.equal("Joe")
        userObject.email.should.equal("joe@example.com")
        should.not.exist(userObject["password"])
        should.not.exist(userObject[keyVersion])
        should.not.exist(userObject[keyId])
        done()
      })
    })
  })

  describe("Default hiding turned off for object only", function () {
    it("shouldn't hide any properties", function (done) {
      let User = defineModel({
        name: String,
        email: String,
        password: {
          type: String,
          hide: true
        }
      }, { hideObject: false })

      let user = new User(testUser)
      user.save(function () {
        let userObject = user.toObject()
        userObject.name.should.equal("Joe")
        userObject.email.should.equal("joe@example.com")
        userObject.password.should.equal(testPassword)
        should.exist(userObject[keyVersion])
        should.exist(userObject[keyId])

        let userJson = user.toJSON()
        userJson.name.should.equal("Joe")
        userJson.email.should.equal("joe@example.com")
        should.not.exist(userJson["password"])
        should.not.exist(userJson[keyVersion])
        should.not.exist(userJson[keyId])
        done()
      })
    })
  })

  describe("Default hiding on, JSON option property", function () {
    it("shouldn't hide any properties", function (done) {
      let User = defineModel({
        name: String,
        email: String,
        password: {
          type: String,
          hideJSON: true
        }
      })

      let user = new User(testUser)
      user.save(function () {
        let userObject = user.toObject()
        userObject.name.should.equal("Joe")
        userObject.email.should.equal("joe@example.com")
        userObject.password.should.equal(testPassword)

        let userJson = user.toJSON()
        userJson.name.should.equal("Joe")
        userJson.email.should.equal("joe@example.com")
        should.not.exist(userJson["password"])
        done()
      })
    })
  })

  describe("Default hiding on, object option property", function () {
    it("shouldn't hide any properties", function (done) {
      let User = defineModel({
        name: String,
        email: String,
        password: {
          type: String,
          hideObject: true
        }
      })

      let user = new User(testUser)
      user.save(function () {
        let userObject = user.toObject()
        userObject.name.should.equal("Joe")
        userObject.email.should.equal("joe@example.com")
        should.not.exist(userObject["password"])

        let userJson = user.toJSON()
        userJson.name.should.equal("Joe")
        userJson.email.should.equal("joe@example.com")
        userJson.password.should.equal(testPassword)
        done()
      })
    })
  })

  describe("Default hiding on, object option property off", function () {
    it("shouldn't hide any properties", function (done) {
      let User = defineModel({
        name: String,
        email: String,
        password: {
          type: String,
          hideObject: false
        }
      })

      let user = new User(testUser)
      user.save(function () {
        let userObject = user.toObject()
        userObject.name.should.equal("Joe")
        userObject.email.should.equal("joe@example.com")
        userObject.password.should.equal(testPassword)

        let userJson = user.toJSON()
        userJson.name.should.equal("Joe")
        userJson.email.should.equal("joe@example.com")
        userJson.password.should.equal(testPassword)
        done()
      })
    })
  })

  describe("A model with hidden properties defined using function",
    function () {
      it(
        "shouldn't return password property for Joe for both JSON and object",
        function (done) {
          let testFunction = function (doc, ret) {
            return doc.name === 'Joe'
          }
          let User = defineModel({
            name: String,
            email: String,
            password: {
              type: String,
              hide: testFunction
            }
          })

          let user = new User(testUser)
          let userJson = user.toJSON()
          userJson.name.should.equal("Joe")
          userJson.email.should.equal("joe@example.com")
          should.not.exist(userJson.password)
          let userObject = user.toObject()
          userObject.name.should.equal("Joe")
          userObject.email.should.equal("joe@example.com")
          should.not.exist(userObject.password)

          user = new User(testUser2)
          userJson = user.toJSON()
          userJson.name.should.equal("Marie")
          userJson.email.should.equal("marie@example.com")
          userJson.password.should.equal(testPassword)
          userObject = user.toJSON()
          userObject.name.should.equal("Marie")
          userObject.email.should.equal("marie@example.com")
          userObject.password.should.equal(testPassword)

          done()
        })
    })

  describe(
    "A model with a hidden properties defined using function for JSON",
    function () {
      it("shouldn't return password property for Joe for only for JSON",
        function (done) {
          let testFunction = function (doc) {
            return doc.name === 'Joe'
          }
          let User = defineModel({
            name: String,
            email: String,
            password: {
              type: String,
              hideJSON: testFunction
            }
          })

          let user = new User(testUser)
          let userJson = user.toJSON()
          userJson.name.should.equal("Joe")
          userJson.email.should.equal("joe@example.com")
          should.not.exist(userJson.password)
          let userObject = user.toObject()
          userObject.name.should.equal("Joe")
          userObject.email.should.equal("joe@example.com")
          userObject.password.should.equal(testPassword)

          user = new User(testUser2)
          userJson = user.toJSON()
          userJson.name.should.equal("Marie")
          userJson.email.should.equal("marie@example.com")
          userJson.password.should.equal(testPassword)
          userObject = user.toObject()
          userObject.name.should.equal("Marie")
          userObject.email.should.equal("marie@example.com")
          userObject.password.should.equal(testPassword)

          done()
        })
    })

  describe(
    "A model with a hidden properties defined using function for object",
    function () {
      it("shouldn't return password property for Joe for only for object",
        function (done) {
          let testFunction = function (doc) {
            return doc.name === 'Joe'
          }
          let User = defineModel({
            name: String,
            email: String,
            password: {
              type: String,
              hideObject: testFunction
            }
          })

          let user = new User(testUser)
          let userJson = user.toJSON()
          userJson.name.should.equal("Joe")
          userJson.email.should.equal("joe@example.com")
          userJson.password.should.equal(testPassword)
          let userObject = user.toObject()
          userObject.name.should.equal("Joe")
          userObject.email.should.equal("joe@example.com")
          should.not.exist(userObject.password)

          user = new User(testUser2)
          userJson = user.toJSON()
          userJson.name.should.equal("Marie")
          userJson.email.should.equal("marie@example.com")
          userJson.password.should.equal(testPassword)
          userObject = user.toObject()
          userObject.name.should.equal("Marie")
          userObject.email.should.equal("marie@example.com")
          userObject.password.should.equal(testPassword)

          done()
        })
    })

  describe("A model with password set as default hidden", function () {
    it("shouldn't return password, but __v", function (done) {
      let UserSchema = new Schema({
        name: String,
        email: String,
        password: String
      })
      UserSchema.plugin(plugin({ defaultHidden: { "password": true } }))
      let User = mongoose.model('User', UserSchema, undefined, { cache: false })
      let user = new User(testUser)
      user.save(function () {
        let userJson = user.toJSON()
        userJson.name.should.equal("Joe")
        user[keyVersion].should.exist // eslint-disable-line
        userJson.email.should.equal("joe@example.com")
        should.not.exist(userJson["password"])
        done()
      })
    })
  })

  describe(
    "A model with password and password set as default hidden overriden with option",
    function () {
      it("should return password", function (done) {
        let UserSchema = new Schema({
          name: String,
          email: String,
          password: String
        })
        UserSchema.plugin(plugin({ defaultHidden: { "password": true } }), { defaultHidden: {} })
        let User = mongoose.model('User', UserSchema, undefined, { cache: false })
        let user = new User(testUser)
        user.save(function () {
          let userJson = user.toJSON()
          userJson.name.should.equal("Joe")
          userJson.email.should.equal("joe@example.com")
          userJson.password.should.equal(testPassword)
          done()
        })
      })
    })

  // Github issue https://github.com/mblarsen/mongoose-hidden/issues/11
  describe("A model with password set as hidden as option", function () {
    it("shouldn't return password nor __v", function (done) {
      let UserSchema = new Schema({
        name: String,
        email: String,
        password: String
      })
      UserSchema.plugin(plugin(), { hidden: { "password": true } })
      let User = mongoose.model('User', UserSchema, undefined, { cache: false })
      let user = new User(testUser)
      user.save(function () {
        let userJson = user.toJSON()
        userJson.name.should.equal("Joe")
        user[keyVersion].should.exist // eslint-disable-line
        userJson.email.should.equal("joe@example.com")
        should.not.exist(userJson["password"])
        should.not.exist(userJson[keyVersion])
        done()
      })
    })
  })

  describe("A model with a virtuals defined", function () {
    it("shouldn't return that property if option not passed", function (
      done) {
      let User = defineModel({
        name: String,
        email: String,
        password: {
          type: String,
          hide: true
        }
      })
      User.schema.virtual('niceEmail').get(function () {
        return '"' + this.name + '" <' + this.email + '>'
      })
      let user = new User(testUser)
      let userJson = user.toJSON()
      userJson.name.should.equal("Joe")
      userJson.email.should.equal("joe@example.com")
      should.not.exist(userJson['niceEmail'])
      should.not.exist(userJson.password)
      done()
    })

    it("should return that property if option is passed", function (done) {
      let schema = new Schema({
        name: String,
        email: String,
        password: {
          type: String,
          hide: true
        }
      })
      schema.set('toJSON', {
        getters: true,
        virtuals: true
      })
      schema.plugin(require('../index')())
      schema.virtual('niceEmail').get(function () {
        return '"' + this.name + '" <' + this.email + '>'
      })
      let User = mongoose.model('VirtualUser', schema)
      let user = new User(testUser)
      user.niceEmail.should.equal('"Joe" <joe@example.com>')
      let userJson = user.toJSON()
      userJson.name.should.equal("Joe")
      userJson.email.should.equal("joe@example.com")
      should.exist(userJson['niceEmail'])
      userJson.niceEmail.should.equal('"Joe" <joe@example.com>')
      should.not.exist(userJson.password)
      done()
    })

    // Github issue https://github.com/mblarsen/mongoose-hidden/issues/12
    it("should return and hide nested virtuals", function (done) {
      let schema = new Schema({
        name: {
          type: String,
          hidden: false
        },
        email: String,
        nice: {
          bro: String,
          baz: { aaa: String }
        },
        password: {
          type: String,
          hide: true
        }
      })
      schema.set('toJSON', {
        getters: true,
        virtuals: true
      })
      schema.virtual('fancyEmail').get(function () {
        return '"' + this.name + '" <' + this.email + '>'
      })
      schema.virtual('nice.email').get(function () {
        return '"' + this.name + '" <' + this.email + '>'
      })
      schema.plugin(plugin(), { virtuals: { 'nice.email': 'hideObject' } })
      let User = mongoose.model('VirtualUser', schema)
      let user = new User(Object.assign({ nice: { bro: 'foo' } }, testUser))
      user.nice.email.should.equal('"Joe" <joe@example.com>')
      let userJson = user.toJSON()
      userJson.name.should.equal("Joe")
      userJson.email.should.equal("joe@example.com")
      should.exist(userJson.nice)
      should.exist(userJson.nice.bro)
      should.not.exist(userJson.nice.email)
      should.not.exist(userJson.password)
      done()
    })

    it("shouldn't return that property even if option is passed",
      function (done) {
        let schema = new Schema({
          name: String,
          email: String,
          password: {
            type: String,
            hide: true
          }
        })
        schema.set('toJSON', {
          getters: true,
          virtuals: true
        })
        schema.plugin(plugin(), {
          virtuals: {
            id: 'hide',
            niceEmail: 'hide'
          }
        })
        schema.virtual('niceEmail').get(function () {
          return '"' + this.name + '" <' + this.email + '>'
        })
        let User = mongoose.model('VirtualUser2', schema)
        let user = new User(testUser)
        user.niceEmail.should.equal('"Joe" <joe@example.com>')
        let userJson = user.toJSON()
        userJson.name.should.equal("Joe")
        userJson.email.should.equal("joe@example.com")
        // should.not.exist(userJson['id'])
        should.not.exist(userJson['niceEmail'])
        should.not.exist(userJson.password)
        done()
      })

    it(
      "shouldn't return that property even if option is passed, unless object",
      function (done) {
        let schema = new Schema({
          name: String,
          email: String,
          password: {
            type: String,
            hide: true
          }
        })
        schema.set('toJSON', {
          getters: true,
          virtuals: true
        })
        schema.set('toObject', {
          getters: true,
          virtuals: true
        })
        schema.plugin(require('../index')(), {
          virtuals: { niceEmail: 'hideObject' }
        })
        schema.virtual('niceEmail').get(function () {
          return '"' + this.name + '" <' + this.email + '>'
        })
        let User = mongoose.model('VirtualUser3', schema)
        let user = new User(testUser)
        user.niceEmail.should.equal('"Joe" <joe@example.com>')
        let userJson = user.toJSON()
        userJson.name.should.equal("Joe")
        userJson.email.should.equal("joe@example.com")
        should.exist(userJson['niceEmail'])
        userJson.niceEmail.should.equal('"Joe" <joe@example.com>')
        should.not.exist(userJson.password)

        let userObject = user.toObject()
        userObject.name.should.equal("Joe")
        userObject.email.should.equal("joe@example.com")
        should.not.exist(userObject['niceEmail'])
        should.not.exist(userObject.password)
        done()
      })
  })

  // Github issue https://github.com/mblarsen/mongoose-hidden/issues/1
  describe("A document with nested documents when hiding", function () {
    it("shouldn't remove its nested documents", function (done) {
      mongoose.modelSchemas = {}
      mongoose.models = {}
      let Company = defineModel("Company", {
        name: String,
        code: String,
      }, { hideObject: false }, {})
      let User = defineModel("User", {
        name: String,
        email: String,
        company: {
          type: Schema.ObjectId,
          ref: 'Company'
        },
        password: {
          type: String,
          hide: true
        }
      })

      let company = new Company(testCompany)
      let user = new User(testUser)
      company.save(function (err, freshCompany) {
        user.company = company._id
        user.save(function () {
          User.findOne().populate('company').exec(function (
            err, freshUser) {
            should.exist(freshUser.company)
            freshUser.company.name.should.equal(
              'GOGGLE')
            let userJson = freshUser.toJSON()
            should.not.exist(userJson.password)
            should.exist(userJson.company)
            should.equal("GOGGLE", userJson.company.name)
            done()
          })
        })
      })
    })
  })

  describe("A document with a collection of nested documents", function () {
    it("shouldn't remove its nested documents", function (done) {
      mongoose.modelSchemas = {}
      mongoose.models = {}
      let Company = defineModel("Company", {
        name: String,
        code: String,
      }, {
        hideObject: false
      }, {})
      let User = defineModel("User", {
        name: String,
        email: String,
        companies: [{
          type: Schema.ObjectId,
          ref: 'Company'
        }],
        password: {
          type: String,
          hide: true
        }
      })

      let company = new Company(testCompany)
      let company2 = new Company(testCompany2)
      let user = new User(testUser)
      company.save(function (err, freshCompany) {
        company2.save(function (err, freshCompany2) {
          user.companies.push(company)
          user.companies.push(company2)
          user.save(function () {
            User.findOne().populate('companies').exec(
              function (err, freshUser) {
                should.exist(freshUser.companies)
                freshUser.companies[0].name.should.equal(
                  'GOGGLE')
                freshUser.companies[1].name.should.equal(
                  'APPLE')
                let userJson = freshUser.toJSON()
                should.not.exist(userJson.password)
                should.exist(userJson.companies)
                should.equal("GOGGLE", userJson.companies[
                  0].name)
                should.equal("APPLE", userJson.companies[
                  1].name)
                done()
              })
          })
        })
      })
    })
  })

  describe("A model with a transform", function () {
    it("should transform", function (done) {
      let MrUserSchema = new Schema({
        name: String,
        password: {
          type: String,
          hide: true
        }
      })

      MrUserSchema.set('toJSON', {
        transform: function (doc, ret) {
          ret['name'] = 'Mr. ' + ret['name']
          return ret
        }
      })

      let User = mongoose.model('User', MrUserSchema, undefined, { cache: false })
      let user = new User(testUser)

      let userJson = user.toJSON()
      userJson.name.should.equal("Mr. Joe")
      userJson.password.should.equal(testPassword)
      done()
    })
    it("should still transform after adding plugin", function (done) {
      let MrUserSchema = new Schema({
        name: String,
        password: {
          type: String,
          hide: true
        }
      })

      MrUserSchema.set('toJSON', {
        transform: function (doc, ret) {
          ret['name'] = 'Mr. ' + ret['name']
          return ret
        }
      })

      let User = defineModel(MrUserSchema)
      let user = new User(testUser)

      let userJson = user.toJSON()
      userJson.name.should.equal("Mr. Joe")
      should.not.exist(userJson.password)
      done()
    })
  })

  // Github issue https://github.com/mblarsen/mongoose-hidden/issues/3
  describe("A model with other documents", function () {
    it("should return the object property", function (done) {
      let User = defineModel({
        name: String,
        email: {
          prefix: String,
          suffix: String
        },
        password: String
      })
      let user = new User(testUser3)
      let userJson = user.toObject()
      userJson.should.deepEqual(testUser3)
      done()
    })
  })
  describe("A model with other documents partially hidden", function () {
    it("should return the object property", function (done) {
      let User = defineModel({
        name: String,
        email: {
          prefix: String,
          suffix: String
        },
        password: String
      }, { hidden: { 'email.suffix': true } })
      let user = new User(testUser3)
      let userJson = user.toObject()
      let testUser3WithoutEmailSuffix = Object.assign({}, testUser3)
      delete testUser3WithoutEmailSuffix.email.suffix
      userJson.should.deepEqual(testUser3WithoutEmailSuffix)
      done()
    })
  })

  // Github issue https://github.com/mblarsen/mongoose-hidden/issues/13
  describe("A documents with non-schema properties set to hidden", function () {
    it("should hide the properties", function (done) {
      let User = defineModel({
        name: String,
        email: String,
        password: String
      }, { hidden: { email: true } })
      let user = new User(testUser)
      user.save(function (err, savedUser) {
        User.schema.remove('email')
        let User2 = mongoose.model('User', User.schema, undefined, { cache: false })
        User2.findById(savedUser['_id'], function (err2, john) {
          let userJson = john.toObject()
          let testUserWithoutEmail = {
            name: testUser.name,
            password: testUser.password
          }
          userJson.should.deepEqual(testUserWithoutEmail)
          done()
        })
      })
    })
  })

  // Github issue https://github.com/mblarsen/mongoose-hidden/issues/12
  describe("A model with nested documents", function () {
    it("should return only the visible parts", function (done) {
      let User = defineModel({
        name: String,
        email: {
          prefix: { type: String },
          suffix: { type: String, hide: true }
        },
        password: String
      })
      let user = new User(testUser3)
      let userJson = user.toObject()
      let testUser3WithoutEmailSuffix = Object.assign({}, testUser3)
      delete testUser3WithoutEmailSuffix.email.suffix
      userJson.should.deepEqual(testUser3WithoutEmailSuffix)
      done()
    })
  })

  describe("Setting a path on an object", function () {
    it("should set plain property", function () {
      let obj = { password: "secret", }
      setPath(obj, "password", "no more secrets")
      obj.password.should.equal("no more secrets")
    })
    it("should set plain property and create if it doesn't exist",
      function () {
        let obj = {}
        setPath(obj, "password", "no more secrets")
        obj.password.should.equal("no more secrets")
      })
    it("should set nested property", function () {
      let obj = { name: { first: "Joe" } }
      setPath(obj, "name.first", "Jane")
      obj.name.first.should.equal("Jane")
      setPath(obj, "name.last", "Doe")
      obj.name.last.should.equal("Doe")
    })
    it("should set nested property and create path if it doesn't exist",
      function () {
        let obj = {}
        setPath(obj, "name.first", "Jane")
        obj.name.first.should.equal("Jane")
        setPath(obj, "rights.inland.case", "A0003")
        obj.rights.inland.case.should.equal("A0003")
        setPath(obj, "rights.outlandish.case", "A0004")
        obj.rights.outlandish.case.should.equal("A0004")
      })
  })

  describe('Model with embedded schema', function () {
    it('should return all properties', function (done) {
      let User = defineModel({
        name: String,
        email: String,
        password: String,
        spouse: new Schema({ name: { type: String } })
      })
      let user = new User(testUserSub)
      let userJson = user.toJSON()
      userJson.name.should.equal('Joe')
      userJson.email.should.equal('joe@example.com')
      userJson.password.should.equal(testPassword)
      userJson.spouse.name.should.equal(testUserSub.spouse.name)
      done()
    })

    it('shouldn\'t return those property', function (done) {
      let User = defineModel({
        name: String,
        email: String,
        password: String,
        spouse: new Schema({
          name: { type: String, hide: true },
          age: { type: Number }
        })
      })
      let user = new User(testUserSub2)
      let userJson = user.toJSON()
      userJson.name.should.equal('Joe')
      userJson.email.should.equal('joe@example.com')
      should.not.exist(userJson.spouse.name)
      done()
    })
  })
})
