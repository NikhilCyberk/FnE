class ErrorHandler {
  static handleApiError(error) {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          return data.error || 'Bad request. Please check your input.';
        case 401:
          return 'Unauthorized. Please log in again.';
        case 403:
          return 'Forbidden. You do not have permission to perform this action.';
        case 404:
          return 'Not found. The requested resource does not exist.';
        case 409:
          return data.error || 'Conflict. The resource already exists.';
        case 422:
          return data.error || 'Validation error. Please check your input.';
        case 500:
          return 'Server error. Please try again later.';
        default:
          return data.error || `Request failed with status ${status}.`;
      }
    } else if (error.request) {
      // The request was made but no response was received
      return 'Network error. Please check your internet connection.';
    } else {
      // Something happened in setting up the request that triggered an Error
      return error.message || 'An unexpected error occurred.';
    }
  }

  static logError(error, context = {}) {
    console.error('Error occurred:', {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString()
    });
  }

  static createError(message, code = 'UNKNOWN_ERROR') {
    const error = new Error(message);
    error.code = code;
    return error;
  }
}

export default ErrorHandler;
