
/**
 * Custom Error handling middleware that returns the http status to the user from custom errors.
 * Adapted from : https://scoutapm.com/blog/express-error-handling
 */
const errorResponder = (err, req, res, next) => {
    res.header("Content-Type", 'application/json')
    res.status(err.statusCode).send(JSON.stringify(err, null, 4)) // pretty print
}

module.exports = errorResponder;