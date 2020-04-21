'use strict'

const should = require('should')
const mongoose = require('mongoose')
const plugin = require('../index')

const Schema = mongoose.Schema
const mongooseHidden = plugin()

describe('github-issues', function() {
  let testUser = { name: 'Joe', email: 'joe@example.com', password: 'secret' }
  let testUserSub = {
    name: 'Joe',
    email: 'joe@example.com',
    password: 'secret',
    spouse: { name: 'Maries' },
  }
  let testUserSub2 = {
    name: 'Joe',
    email: 'joe@example.com',
    password: 'secret',
    spouse: { name: 'Maries', age: 37 },
  }
  let testUser2 = { name: 'Marie', email: 'marie@example.com', password: 'secret' }
  let testUser3 = {
    name: 'Joe',
    email: { prefix: 'joe', suffix: 'example.com' },
    password: 'secret',
  }
  let testCompany = { _id: '5613a1c7e1095d8e71ae90da', name: 'GOGGLE', code: 'GOG' }
  let testCompany2 = { _id: '5613a1c7e1095d8e71ae90db', name: 'APPLE', code: 'APL' }
  let testPassword = 'secret'
  let keyVersion = '__v'
  let keyId = '_id'

  let defineModel = function(name, schemaProperties, pluginOptions) {
    if (typeof name === 'object') {
      pluginOptions = schemaProperties
      schemaProperties = name
      name = 'User'
    }
    let schema =
      schemaProperties instanceof Schema ? schemaProperties : new Schema(schemaProperties)
    schema.plugin(mongooseHidden, pluginOptions || {})
    return mongoose.model(name, schema, undefined)
  }

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

  afterEach(function(done) {
    mongoose.modelSchemas = {}
    mongoose.models = {}
    mongoose.connection.db.dropDatabase(done)
  })

  after(function(done) {
    mongoose.connection.close(done)
  })

  // Github issue https://github.com/mblarsen/mongoose-hidden/issues/13
  describe('A documents with non-schema properties set to hidden', function() {
    it('should hide the properties', function(done) {
      let User = defineModel(
        {
          name: String,
          email: String,
          password: String,
        },
        { hidden: { email: true } }
      )
      let user = new User(testUser)
      user.save(function(err, savedUser) {
        User.schema.remove('email')
        let User2 = mongoose.model('User', User.schema, undefined, { cache: false })
        User2.findById(savedUser['_id'], function(err2, john) {
          let userJson = john.toObject()
          let testUserWithoutEmail = {
            name: testUser.name,
            password: testUser.password,
          }
          userJson.should.deepEqual(testUserWithoutEmail)
          done()
        })
      })
    })
  })

  // Github issue https://github.com/mblarsen/mongoose-hidden/issues/12
  describe('A model with nested documents', function() {
    it('should return only the visible parts', function(done) {
      let User = defineModel({
        name: String,
        email: {
          prefix: { type: String },
          suffix: { type: String, hide: true },
        },
        password: String,
      })
      let user = new User(testUser3)
      let userJson = user.toObject()
      let testUser3WithoutEmailSuffix = Object.assign({}, testUser3)
      delete testUser3WithoutEmailSuffix.email.suffix
      userJson.should.deepEqual(testUser3WithoutEmailSuffix)
      done()
    })
  })

  // Github issue https://github.com/mblarsen/mongoose-hidden/issues/75
  describe('Bug: subDocument returns unpopulated if its not found', function() {
    it('should return empty array', function(done) {
      const HostSchema = new mongoose.Schema(
        {
          ipAddress: String,
          status: String,
        },
        {
          timestamps: { createdAt: 'created', updatedAt: 'modified' },
        }
      )
      HostSchema.set('toObject', { virtuals: true })
      HostSchema.set('toJSON', { virtuals: true })
      HostSchema.plugin(mongooseHidden)
      const Host = mongoose.model('Host', HostSchema)

      const ProjectSchema = new mongoose.Schema(
        {
          name: String,
          hosts: [
            {
              type: mongoose.Schema.Types.ObjectId,
              ref: 'Host',
              required: true,
            },
          ],
        },
        {
          timestamps: { createdAt: 'created', updatedAt: 'modified' },
        }
      )
      ProjectSchema.set('toObject', { virtuals: true })
      ProjectSchema.set('toJSON', { virtuals: true })
      ProjectSchema.plugin(mongooseHidden)
      const Project = mongoose.model('Project', ProjectSchema)

      Host.create({ ipAddress: '192.168.1.1', status: 'OFFLINE' }).then(host => {
        Project.create({ name: 'Default', hosts: [host._id] }).then(() => {
          Project.find({})
            .populate({
              path: 'hosts',
              match: { status: 'ONLINE' },
            })
            .then(projects => {
              projects.length.should.equal(1)
              projects[0].hosts.length.should.equal(0)
              done()
            })
        })
      })
    })
  })

  // Github issue https://github.com/mblarsen/mongoose-hidden/issues/82
  describe('Bug: elements of array is visible', function() {
    it('password should be hidden', function(done) {
      const AuthSchema = new mongoose.Schema(
        {
          login: String,
          password: {
            type: String,
            hide: true,
          }
        }, { _id: false }
      )
      const HostSchema = new mongoose.Schema(
        {
          name: String,
          credentials: [AuthSchema],
        },
        {
          timestamps: { createdAt: 'created', updatedAt: 'modified' },
        }
      )
      HostSchema.set('toObject', { virtuals: true })
      HostSchema.set('toJSON', { virtuals: true })
      HostSchema.plugin(mongooseHidden, { applyRecursively: true })
      const Host = mongoose.model('Host', HostSchema)

      Host.create({ name: 'Main', credentials: [{ login: 'root', password: '123456' }] }).then(() => {
        Host.findOne({ name: 'Main' }).then(host => {
          const obj = host.toObject();
          for (const cred of obj.credentials) {
            Object.keys(cred).should.deepEqual(['login'])
          }
          done()
        }).catch(done)
      })
    })
  })
})
