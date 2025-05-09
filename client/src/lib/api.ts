/**
 * API client utility for making requests to the backend
 */

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * Makes an API request to the backend
 * @param method HTTP method
 * @param endpoint API endpoint (starting with /)
 * @param data Request body data (for POST, PUT, PATCH)
 * @returns Promise with the response data
 */
export async function apiRequest<T = any>(
  method: HttpMethod,
  endpoint: string,
  data?: any
): Promise<T> {
  const url = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    credentials: 'same-origin',
  };
  
  if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    options.body = JSON.stringify(data);
  }
  
  const response = await fetch(url, options);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.error || `API request failed with status ${response.status}`;
    throw new Error(errorMessage);
  }
  
  // For 204 No Content responses
  if (response.status === 204) {
    return {} as T;
  }
  
  return await response.json();
}
