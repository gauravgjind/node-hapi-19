'use strict'

// const DEVELOPMENT = 'development'
const PRODUCTION = 'production'

const getArgument = argument => {
  return process.argv.indexOf(argument)
}

if (getArgument('--development') !== -1) {
  process.env.NODE_ENV = 'development'
}

if (getArgument('--prod') !== -1) {
  process.env.NODE_ENV = 'production'
}

if (getArgument('--development') !== -1 || getArgument('--prod') !== -1) {
  process.env.NODE_CONFIG_DIR = `${__dirname}`
}

const config = require('config')
const mongoose = require('mongoose')
const Config = JSON.parse(JSON.stringify(config))

const swaggerOptions = {
  info: {
    title: 'hapi-20-boilerplate',
    version: require('../package.json').version,
    description: 'hapi-20-boilerplate'
  },
  documentationPath: '/docs',
  basePath: '/api',
  tags: [],
  grouping: 'tags',
  securityDefinitions: {
    jwt: {
      type: 'apiKey',
      name: 'Authorization',
      in: 'header'
    }
  },
  security: [
    {
      Basic: []
    }
  ]
}

const DEFAULT = 'default'

let plugins = []
const ENV = config.util.getEnv('NODE_ENV').trim()

if (ENV !== DEFAULT) {
  swaggerOptions.schemes = ['https', 'http']
  swaggerOptions.host = 'productionurl.com'
  mongoose.set('debug', true)
}
if (ENV !== PRODUCTION) {
  plugins = [
    {
      plugin: '@hapi/inert'
    },
    {
      plugin: '@hapi/vision'
    },
    {
      plugin: 'hapi-swagger',
      options: swaggerOptions
    },
    {
      plugin: 'hapi-dev-errors',
      options: {
        showErrors: process.env.NODE_ENV !== 'production',
        toTerminal: true
      }
    }
  ]
}
plugins = plugins.concat([
  {
    plugin: 'hapi-auth-jwt2'
  },
  {
    plugin: '@hapi/basic'
  },
  {
    plugin: 'schmervice'
  },
  {
    plugin: 'mrhorse',
    options: {
      policyDirectory: `${__dirname}/../server/policies`,
      defaultApplyPoint:
        'onPreHandler' /* optional.  Defaults to onPreHandler */
    }
  },
  {
    plugin: '@plugins/mongoose.plugin',
    options: {
      connections: Config.connections
    }
  },
  {
    // if you need authentication then uncomment this plugin, and remove "auth: false" below
    plugin: '@plugins/auth.plugin'
  },
  {
    plugin: '@routes/root.route'
  }
])

const routesOb = {
  'auth.route': 'auth'
}

const routes = Object.keys(routesOb)
routes.forEach(r => {
  plugins = plugins.concat([
    {
      plugin: `@routes/${r}`,
      routes: {
        prefix: `/api/v1${routesOb[r] ? `/${routesOb[r]}` : ``}`
      }
    }
  ])
})

exports.manifest = {
  server: {
    router: {
      stripTrailingSlash: true,
      isCaseSensitive: false
    },
    routes: {
      security: {
        hsts: false,
        xss: true,
        noOpen: true,
        noSniff: true,
        xframe: false
      },
      cors: {
        origin: ['*'],
        // ref: https://github.com/hapijs/hapi/issues/2986
        headers: ['Accept', 'Authorization', 'Content-Type']
      },
      validate: {
        failAction: async (request, h, err) => {
          request.server.log(
            ['validation', 'error'],
            'Joi throw validation error'
          )
          throw err
        }
      },
      jsonp: 'callback', // <3 Hapi,
      auth: false // remove this to enable authentication or set your authentication profile ie. auth: 'jwt'
    },
    debug: Config.debug,
    port: Config.port
  },
  register: {
    plugins
  }
}

exports.options = {}
