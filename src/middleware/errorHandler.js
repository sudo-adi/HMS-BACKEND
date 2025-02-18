const errorHandler = (err, req, res, next) => {
    // Log error for debugging
    console.error(err.stack);

    // Default error status and message
    const status = err.status || 500;
    const message = err.message || 'Internal Server Error';

    // Structured error response
    const errorResponse = {
        status,
        error: err.name || 'Error',
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    };

    // Send error response
    res.status(status).json(errorResponse);
};

module.exports = errorHandler;