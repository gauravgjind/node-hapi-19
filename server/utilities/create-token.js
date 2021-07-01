'use strict'

const Jwt = require('jsonwebtoken')
const config = require('config')
const errorHelper = require('./error-helper')

function createToken(user, expirationPeriod) {
  try {
    let token = {}

    const tokenUser = {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email
    }

    token = Jwt.sign(
      {
        user: tokenUser
      },
      config.constants.JWT_SECRET,
      {
        algorithm: 'HS256',
        expiresIn: expirationPeriod
      }
    )

    return token
  } catch (err) {
    errorHelper.handleError(err)
  }
}

module.exports = createToken
