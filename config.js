/*
 * Create and export configugration variables
 *
 */

// Container for all environments
const environments = {}

// Staging ( default ) environment
environments.staging = {
    httpPort: 3000,
    httpsPort: 3001,
    envName: 'staging'
}

// Production environment
environments.production = {
    httpPort: 8000,
    httpsPort: 443,
    envName: 'production'
}

// Determiner which environment was passed as a command-line argument
const currentEnvironment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : ''

// Check that the current environment is one of the environments above, if not, default to staging
const environmentToExport = typeof(environments[currentEnvironment]) == 'object' ? environments[currentEnvironment] : environments.staging

// Export the module
module.exports = environmentToExport