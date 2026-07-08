import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosRequestConfig } from 'axios';
import { API_URL, APP_NAME } from '@env';

const API_BASE_URL: string = API_URL || 'https://izi-morocco-1-epjo.onrender.com';

console.log('API_BASE_URL loaded:', API_BASE_URL);

/**
 * Interface for defining the properties required for making an API service request
 * @interface ApiServiceProps
 */
interface ApiServiceProps {
  method: string;
  endpoint: string;
  headers?: Record<string, string>;
  data?: any;
  params?: any;
}

/**
 * Function to make API requests using Axios
 * @param method The HTTP method (GET, POST, PUT, DELETE, etc.)
 * @param endpoint The API endpoint
 * @param headers Additional headers for the request
 * @param data Data to be sent with the request (for POST and PUT requests)
 * @returns A Promise that resolves with the API response data
 */
const ApiService = async ({
  method,
  endpoint,
  headers = {},
  data,
  params,
}: ApiServiceProps): Promise<any> => {
  try {
    const token = await AsyncStorage.getItem('accessToken');

    // Ensure the endpoint is not undefined
    if (!endpoint) {
      throw new Error('API endpoint is undefined.');
    }

    const fullUrl = `${API_BASE_URL.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;
    
    console.log(`[ApiService] Request: ${method} ${fullUrl}`);
    if (data) console.log('[ApiService] Data:', JSON.stringify(data, null, 2));

    const axiosConfig: AxiosRequestConfig = {
      method,
      url: fullUrl,
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
        ...headers,
      },
      data,
      params,
    };

    const api = axios.create();

    api.interceptors.response.use(
      (response: { data: any }) => response.data,
      (error: any) => {
        throw error;
      },
    );

    const response = await api(axiosConfig);
    console.log(`[ApiService] Success: ${method} ${fullUrl}`);
    return response;
  } catch (error: any) {
    console.error(`[ApiService] Error: ${method} ${endpoint}`, error?.response?.data || error?.message || error);
    throw error;
  }
};

export default ApiService;
