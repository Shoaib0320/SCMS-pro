import axios from 'axios';
import { API_CONFIG, buildUrl, getFullUrl } from '@/constants/api-endpoints';

/**
 * Enhanced API Client with Axios
 * Features:
 * - Automatic token management
 * - Request/response interceptors
 * - Error handling
 * - Loading states
 * - Retry logic
 */

// Create axios instance
const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management
let accessToken = null;

export const setAccessToken = (token) => {
  accessToken = token;
  if (typeof window !== 'undefined') {
    localStorage.setItem('accessToken', token);
  }
};

export const getAccessToken = () => {
  if (!accessToken && typeof window !== 'undefined') {
    accessToken = localStorage.getItem('accessToken');
  }
  return accessToken;
};

export const clearAccessToken = () => {
  accessToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('accessToken');
  }
};

// Request Interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Remove Content-Type header for FormData to let browser set it with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    
    // Add timestamp to prevent caching
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now(),
      };
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Maps standard HTTP status codes to clear, contextual messages
 */
function getStatusDefaultMessage(status) {
  switch (status) {
    case 400:
      return 'Bad request: Please verify the submitted information.';
    case 401:
      return 'Invalid credentials or session expired. Please log in again.';
    case 403:
      return 'Access denied: You do not have permission to perform this action.';
    case 404:
      return 'The requested resource or endpoint was not found.';
    case 409:
      return 'Conflict: A record with this information already exists.';
    case 422:
      return 'Validation failed: Please check the highlighted fields.';
    case 429:
      return 'Too many requests. Please slow down and try again.';
    case 500:
      return 'Internal server error. Please try again later or contact support.';
    case 502:
      return 'Bad gateway: The server received an invalid response.';
    case 503:
      return 'Service temporarily unavailable. Please try again in a few moments.';
    case 504:
      return 'Gateway timeout: The server took too long to respond.';
    default:
      return null;
  }
}

/**
 * Extracts a precise, readable error message from any Axios error
 */
function extractErrorMessage(error) {
  // Case 1: No HTTP response received (Network, Timeout, Server Down, CORS)
  if (!error.response) {
    if (error.code === 'ECONNABORTED' || error.message?.toLowerCase().includes('timeout')) {
      return 'Request timed out: The server took too long to respond. Please try again.';
    }
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return 'You appear to be offline. Please check your internet connection.';
    }
    if (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED' || error.message === 'Network Error') {
      return 'Unable to reach the server. Please verify the server is running and try again.';
    }
    if (error.message && error.message !== 'Error' && error.message !== 'Unknown Error') {
      return error.message;
    }
    return 'Unable to connect to the server. Please try again shortly.';
  }

  const { status, data, headers } = error.response;

  // Case 2: Response has no data
  if (!data) {
    return getStatusDefaultMessage(status) || `Request failed with status ${status}`;
  }

  // Case 3: Response data is a string
  if (typeof data === 'string') {
    const isHtml = data.includes('<!DOCTYPE') || data.includes('<html') || (headers && headers['content-type']?.includes('text/html'));
    if (isHtml) {
      return getStatusDefaultMessage(status) || `Server error (${status})`;
    }
    const trimmed = data.trim();
    if (trimmed.length > 0 && trimmed.length < 300) {
      return trimmed;
    }
    return getStatusDefaultMessage(status) || `Request failed with status ${status}`;
  }

  // Case 4: Sequelize or custom API validation errors in data.details
  if (Array.isArray(data.details) && data.details.length > 0) {
    const detailMsgs = data.details
      .map((d) => {
        if (typeof d === 'string') return d;
        if (d && typeof d === 'object') {
          return d.message || d.msg || (d.field ? `${d.field}: ${d.error || 'invalid'}` : null);
        }
        return null;
      })
      .filter(Boolean);
    if (detailMsgs.length > 0) {
      return detailMsgs.join('. ');
    }
  }

  // Case 5: Errors array in data.errors
  if (Array.isArray(data.errors) && data.errors.length > 0) {
    const errMsgs = data.errors
      .map((e) => {
        if (typeof e === 'string') return e;
        if (e && typeof e === 'object') {
          return e.message || e.msg || (e.field ? `${e.field}: ${e.error || 'invalid'}` : null);
        }
        return null;
      })
      .filter(Boolean);
    if (errMsgs.length > 0) {
      return errMsgs.join('. ');
    }
  }

  // Case 6: Errors dictionary in data.errors: { field1: 'msg1', field2: 'msg2' }
  if (data.errors && typeof data.errors === 'object' && !Array.isArray(data.errors)) {
    const errValues = Object.entries(data.errors)
      .map(([field, val]) => {
        if (typeof val === 'string') return `${field}: ${val}`;
        if (val && typeof val === 'object') return `${field}: ${val.message || val.msg || 'invalid'}`;
        return null;
      })
      .filter(Boolean);
    if (errValues.length > 0) {
      return errValues.join('. ');
    }
  }

  // Case 7: Direct string error in data.error
  if (typeof data.error === 'string' && data.error.trim()) {
    return data.error.trim();
  }

  // Case 8: Object error in data.error
  if (data.error && typeof data.error === 'object') {
    if (typeof data.error.message === 'string' && data.error.message.trim()) {
      return data.error.message.trim();
    }
  }

  // Case 9: Direct string message in data.message
  if (typeof data.message === 'string' && data.message.trim()) {
    return data.message.trim();
  }

  // Case 10: Direct string message in data.msg
  if (typeof data.msg === 'string' && data.msg.trim()) {
    return data.msg.trim();
  }

  return getStatusDefaultMessage(status) || `Request failed with status ${status}`;
}

// Response Interceptor
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;

    const isAuthRoute = originalRequest?.url?.includes('/api/auth/login') ||
                        originalRequest?.url?.includes('/api/auth/refresh') ||
                        originalRequest?.url?.includes('/api/auth/forgot-password') ||
                        originalRequest?.url?.includes('/api/auth/reset-password');

    // Handle 401 Unauthorized - Token expired (skip for auth routes like login)
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
      originalRequest._retry = true;

      try {
        // In the new system, refreshToken is in a cookie, so we just call the refresh endpoint
        const response = await axios.post('/api/auth/refresh', {}, { withCredentials: true });

        const { accessToken: newToken } = response.data;
        if (newToken) {
          setAccessToken(newToken);
          // Retry original request
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return axios(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        clearAccessToken();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    const errorMessage = extractErrorMessage(error);
    const errorStatus = error.response?.status || (error.code === 'ECONNABORTED' ? 408 : 0);

    // Create a comprehensive Error object that works both as an Error instance and with custom properties
    const formattedError = new Error(errorMessage);
    formattedError.message = errorMessage;
    formattedError.status = errorStatus;
    formattedError.statusCode = errorStatus;
    formattedError.data = error.response?.data;
    formattedError.response = error.response;
    formattedError.errors = error.response?.data?.errors;
    formattedError.details = error.response?.data?.details;
    formattedError.code = error.code;
    formattedError.originalError = error;

    return Promise.reject(formattedError);
  }
);

/**
 * API Client Class
 */
class ApiClient {
  constructor() {
    this.loading = false;
  }

  /**
   * Generic request method
   */
  async request(method, endpoint, data = null, config = {}) {
    this.loading = true;

    try {
      const response = await apiClient({
        method,
        url: endpoint,
        data,
        ...config,
      });

      this.loading = false;
      return response;
    } catch (error) {
      this.loading = false;
      console.error('API Client Error:', {
        method,
        endpoint,
        message: error?.message || (typeof error === 'string' ? error : 'Unknown Error'),
        status: error?.status,
        response: error?.response?.data,
        stack: error?.stack
      });
      
      // Additional log for easier debugging in some environments
      console.error(`[API Error] ${method} ${endpoint}: ${error?.message || 'Unknown Error'}`);
      throw error;
    }
  }

  /**
   * GET request
   */
  get(endpoint, params = {}, config = {}) {
    return this.request('GET', endpoint, null, { params, ...config });
  }

  /**
   * POST request
   */
  post(endpoint, data, config = {}) {
    return this.request('POST', endpoint, data, config);
  }

  /**
   * PUT request
   */
  put(endpoint, data, config = {}) {
    return this.request('PUT', endpoint, data, config);
  }

  /**
   * PATCH request
   */
  patch(endpoint, data, config = {}) {
    return this.request('PATCH', endpoint, data, config);
  }

  /**
   * DELETE request
   */
  delete(endpoint, config = {}) {
    return this.request('DELETE', endpoint, null, config);
  }

  /**
   * POST FormData request
   */
  postFormData(endpoint, formData, config = {}) {
    return this.request('POST', endpoint, formData, {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...config.headers,
      },
    });
  }

  /**
   * PUT FormData request
   */
  putFormData(endpoint, formData, config = {}) {
    return this.request('PUT', endpoint, formData, {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...config.headers,
      },
    });
  }

  /**
   * Upload file with progress tracking
   */
  async upload(endpoint, file, onProgress = null) {
    const formData = new FormData();
    formData.append('file', file);
    
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    };
    
    if (onProgress) {
      config.onUploadProgress = (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress(percentCompleted);
      };
    }
    
    return this.post(endpoint, formData, config);
  }

  /**
   * Bulk upload files
   */
  async uploadMultiple(endpoint, files, onProgress = null) {
    const formData = new FormData();
    
    files.forEach((file, index) => {
      formData.append(`files[${index}]`, file);
    });
    
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    };
    
    if (onProgress) {
      config.onUploadProgress = (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress(percentCompleted);
      };
    }
    
    return this.post(endpoint, formData, config);
  }

  /**
   * Download file
   */
  async download(endpoint, filename = 'download') {
    try {
      const response = await apiClient({
        method: 'GET',
        url: endpoint,
        responseType: 'blob',
      });
      
      // Create blob link to download
      const url = window.URL.createObjectURL(response);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!getAccessToken();
  }

  /**
   * Get loading state
   */
  isLoading() {
    return this.loading;
  }
}

// Export singleton instance
const client = new ApiClient();

export { client as apiClient, apiClient as axiosInstance };
export default client;
