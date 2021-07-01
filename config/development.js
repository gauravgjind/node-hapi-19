module.exports = {
  appName: 'hapi-20-boilerplate',
  port: 1400,
  debug: {
    request: ['error', 'info'],
    log: ['info', 'error', 'warning']
  },
  constants: {
    DEFAULT_COUNTRY: 'US',
    DEFAULT_TIMEZONE: 'America/New_York',
    EXPIRATION_PERIOD: '730h',
    JWT_SECRET: 'jwtsecret'
  },
  connections: {
    db: process.env.DB
  }
}
