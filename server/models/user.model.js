'use strict'

const mongoose = require('mongoose')
const Joi = require('joi')
const Bcrypt = require('bcrypt')
const Schema = mongoose.Schema
const Uuidv4 = require('uuid/v4')
const Types = Schema.Types
const modelName = 'user'
const errorHelper = require('@utilities/error-helper')
const dbConn = require('@plugins/mongoose.plugin').plugin.dbConn()

const UserSchema = new Schema(
  {
    firstName: {
      type: Types.String,
      default: null,
      canSearch: true
    },
    lastName: {
      type: Types.String,
      default: null,
      canSearch: true
    },
    email: {
      type: Types.String,
      required: true,
      unique: true,
      index: true,
      stringType: 'email',
      canSearch: true
    },
    password: {
      type: Types.String,
      exclude: true,
      required: true
    },
    emailVerified: {
      type: Types.Boolean,
      allowOnUpdate: false,
      default: false
    },
    emailHash: {
      type: Types.String,
      default: null
    },
    passwordLastUpdated: {
      type: Types.Date,
      default: null
    },
    lastLogin: {
      type: Types.Date,
      default: null,
      canSort: true
    },
    phone: {
      type: Types.String,
      maxlength: 12,
      minxlength: 10,
      required: true,
      unique: true,
      index: true
    }
  },
  {
    collection: modelName,
    timestamps: true,
    versionKey: false
  }
)

UserSchema.pre('save', async function(next) {
  const user = this
  if (user.isNew) {
    // Set Password & hash before save it
    const passHash = await user.generateHash(user.password)
    user.password = passHash.hash
    const emailHash = await user.generateHash()
    user.emailHash = emailHash.hash
    user.wasNew = true
  }
  next()
})

UserSchema.methods = {
  generateHash: async function(key) {
    try {
      if (key === undefined) {
        key = Uuidv4()
      }
      const salt = await Bcrypt.genSalt(10)
      const hash = await Bcrypt.hash(key, salt)
      return {
        key,
        hash
      }
    } catch (err) {
      errorHelper.handleError(err)
    }
  }
}

UserSchema.statics = {
  findByCredentials: async function(username, password) {
    try {
      const self = this

      let query = {
        email: username.toLowerCase()
      }
      const schema = Joi.object({
        username: Joi.string().email()
      })
      const emailValidate = schema.validate({ username: username })
      if (emailValidate.error) {
        query = {
          phone: username
        }
      }

      const mongooseQuery = self.findOne(query)

      const user = await mongooseQuery.lean()

      if (!user) {
        return false
      }

      const source = user.password

      const passwordMatch = await Bcrypt.compare(password, source)
      if (passwordMatch) {
        return user
      }
    } catch (err) {
      errorHelper.handleError(err)
    }
  },
  generateHash: async function(key) {
    try {
      if (key === undefined) {
        key = Uuidv4()
      }
      const salt = await Bcrypt.genSalt(10)
      const hash = await Bcrypt.hash(key, salt)
      return {
        key,
        hash
      }
    } catch (err) {
      errorHelper.handleError(err)
    }
  }
}

exports.schema = dbConn.model(modelName, UserSchema)
