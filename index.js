/*
 * Primary file for the API
 *
 */

// Dependencies
const cluster = require('cluster')
const http = require('http')
const https = require('https')
const os = require('os')
const url = require('url')
const { StringDecoder } = require('string_decoder')
const fs = require('fs')

const config = require('./config')

// Start http server
const httpsServerOptions = {
    key: fs.readFileSync('./https/key.pem'),
    cert: fs.readFileSync('./https/cert.pem')
}

// All the server logic for both the http and https server
const unifiedServer = (req, res) => {
    // Get the url and parse it
    const parsedUrl = url.parse(req.url, true)

    // Get the path
    const path = parsedUrl.pathname
    const trimmedPath = path.replace(/^\/+|\/+$/g, '')

    // Get the query string as an object
    const queryStringObject = parsedUrl.query

    // Get the http method
    const method = req.method.toLowerCase()

    // Get the headers as an object
    const headers = req.headers

    // Get the payload, if any
    const decoder = new StringDecoder('utf-8')
    let buffer = ''
    req.on('data', (data) => {
        buffer += decoder.write(data)
    })
    req.on('end', () => {
        buffer += decoder.end()

        // Choose the handler this request should go to
        const chosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound

        // Construct the data object to send to the handler
        const data = {
            trimmedPath,
            queryStringObject,
            method,
            headers,
            payload: buffer
        }

        // Route the request to the handler specified in the router
        chosenHandler(data, (statusCode, payload) => {
            // Use the status code called back by the handler, or default to 200
            statusCode = typeof(statusCode) == 'number' ? statusCode : 200

            // Use the payload called back by the handler, or default to an empty objzect
            payload = typeof(payload) == 'object' ? payload : {}

            // Convert the payload to a string
            const payloadString = JSON.stringify(payload)

            // Return the response
            res.setHeader('Content-Type', 'application/json')
            res.writeHead(statusCode)

            // Send the response
            res.end(payloadString)

            console.log(`Returning this response ${statusCode} ${payloadString}`)
        })
    })
}

// Instantiate the http server
const httpServer = http.createServer((req, res) => {
    unifiedServer(req, res)
})



// Instantiate the https server
const httpsServer = https.createServer(httpsServerOptions, (req, res) => {
    unifiedServer(req, res)
})



// Define the handlers
const handlers = {}

// Sample handler
handlers.hello = (data, cb) => {
    // callback a http status code and a payload object
    cb(200, { msg: 'Hello world' })
}

// Not found handler
handlers.notFound = (data, cb) => {
    cb(404)
}

// Define a request router
const router = {
    hello: handlers.hello
}


// Init function
const init = () => {
    if (cluster.isMaster) {
        for (let i = 0; i < os.cpus().length; i++) {
            cluster.fork()
        }
    } else {
        // Start http server
        httpServer.listen(config.httpPort, () => {
            console.log('\x1b[36m%s\x1b[0m', `The server listen on port ${config.httpPort} in config ${config.envName} mode`)
        })

        // Start https server
        httpsServer.listen(config.httpsPort, () => {
            console.log('\x1b[35m%s\x1b[0m', `The server listen on port ${config.httpsPort} in config ${config.envName} mode`)
        })
    }

}

init()