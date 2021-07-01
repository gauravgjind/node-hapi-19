'use strict'

const Joi = require('joi')
const Boom = require('@hapi/boom')
const errorHelper = require('@utilities/error-helper')
const Bcrypt = require('bcrypt')
const Uuidv4 = require('uuid/v4')

const apiHeaders = () => {
  return Joi.object({
    authorization: Joi.string()
  }).options({
    allowUnknown: true
  })
}

const setCustomError = async (errorObj, type = null) => {
  let error
  if (type !== null && type !== '' && type !== undefined) {
    if (type === 'login') {
      error = Boom.unauthorized('invalid password')
    }
  } else {
    error = Boom.badRequest('Invalid Credential')
  }
  error.output.payload.validation = {}
  error.output.payload.validation.errors = errorObj
  errorHelper.handleError(error)
}

const generateHash = async key => {
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

module.exports = {
  apiHeaders,
  setCustomError,
  generateHash
}
