'use strict'
const Boom = require('@hapi/boom')

function handleError(err, customMessage = null) {
  if (err.isBoom) {
    if (!err.output.payload.errorCode) {
      err.output.payload.errorCode = err.output.payload.error
        .toLowerCase()
        .split(' ')
        .join('_')
    }
    err.reformat()
    throw err
  } else if (
    !(err instanceof Error) &&
    typeof err === 'object' &&
    err.message
  ) {
    if (customMessage) {
      err.message = customMessage
    }
    const error = Boom.badRequest(err.message)
    error.output.payload.errorCode = err.code
    error.output.statusCode = err.status || 400
    error.reformat()
    throw error
  } else {
    console.error(err)
    throw Boom.badImplementation(err)
  }
}

module.exports = {
  handleError
}
