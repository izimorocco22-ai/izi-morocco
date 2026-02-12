import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiPaths } from './apiPaths';
import { Platform } from 'react-native';
import axios from 'axios';

// Get API_URL from a safer place or use fallback
// We use a fallback to avoid "Cannot find module '@env'" if the .env is not set up
const API_BASE_URL = 'https://izi-morocco-1.onrender.com';

export const uploadFile = async (uri: string) => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    
    // Clean the URI and get filename/extension
    const cleanPath = uri.split('?')[0];
    const fileName = cleanPath.split('/').pop() || 'upload.jpg';
    const extension = fileName.split('.').pop()?.toLowerCase() || 'jpg';
    
    let type = '';
    if (['mp4', 'mov', 'm4v', '3gp'].includes(extension)) {
      type = 'video/mp4';
    } else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
      type = `image/${extension === 'jpg' ? 'jpeg' : extension}`;
    } else {
      type = 'image/jpeg';
    }

    const formData = new FormData();
    // For React Native, the object must have uri, name, and type
    const fileToUpload = {
      uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
      name: fileName,
      type: type,
    };

    formData.append('file', fileToUpload as any);

    const fullUrl = `${API_BASE_URL.replace(/\/$/, '')}/${apiPaths.upload}`;
    console.log('[uploadFile] Uploading to:', fullUrl);

    const response = await axios.post(fullUrl, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: token ? `Bearer ${token}` : '',
      },
      // This is crucial for Axios to correctly handle FormData in React Native
      transformRequest: (data, headers) => {
        return data;
      },
    });

    if (response.data && response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data?.message || 'Upload failed');
    }
  } catch (error: any) {
    console.error('Upload service error:', error);
    const errorMessage = error.response?.data?.message || error.message || 'Unknown upload error';
    throw new Error(errorMessage);
  }
};
