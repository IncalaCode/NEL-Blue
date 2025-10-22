class ErrorResponse extends Error {
    /**
     * Create a custom error response
     * @param {string} message - Error message
     * @param {number} statusCode - HTTP status code
     */
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true; // This is to distinguish operational errors from programming errors
        
        // Capture the stack trace (excluding the constructor call from it)
        Error.captureStackTrace(this, this.constructor);
    }
    
    /**
     * Create a not found error
     * @param {string} [message='Resource not found'] - Error message
     * @returns {ErrorResponse} - 404 error response
     */
    static notFound(message = 'Resource not found') {
        return new ErrorResponse(message, 404);
    }
    
    /**
     * Create a bad request error
     * @param {string} [message='Bad request'] - Error message
     * @returns {ErrorResponse} - 400 error response
     */
    static badRequest(message = 'Bad request') {
        return new ErrorResponse(message, 400);
    }
    
    /**
     * Create an unauthorized error
     * @param {string} [message='Not authorized'] - Error message
     * @returns {ErrorResponse} - 401 error response
     */
    static unauthorized(message = 'Not authorized') {
        return new ErrorResponse(message, 401);
    }
    
    /**
     * Create a forbidden error
     * @param {string} [message='Forbidden'] - Error message
     * @returns {ErrorResponse} - 403 error response
     */
    static forbidden(message = 'Forbidden') {
        return new ErrorResponse(message, 403);
    }
    
    /**
     * Create a validation error
     * @param {string|Array} errors - Validation errors
     * @returns {ErrorResponse} - 422 error response
     */
    static validationError(errors) {
        let message = 'Validation failed';
        if (Array.isArray(errors)) {
            message = errors.map(err => err.message || err.msg).join('. ');
        } else if (typeof errors === 'string') {
            message = errors;
        }
        return new ErrorResponse(message, 422);
    }
}

module.exports = ErrorResponse;