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
    
    if (!uri) {
      throw new Error('No file URI provided');
    }

    const cleanPath = uri.split('?')[0];
    const fileName = cleanPath.split('/').pop() || `upload_${Date.now()}.jpg`;
    const extension = fileName.split('.').pop()?.toLowerCase() || 'jpg';
    
    let type = 'image/jpeg';
    if (['mp4', 'mov', 'm4v', '3gp'].includes(extension)) {
      type = 'video/mp4';
    } else if (['jpg', 'jpeg'].includes(extension)) {
      type = 'image/jpeg';
    } else if (['png'].includes(extension)) {
      type = 'image/png';
    }

    const formData = new FormData();
    formData.append('file', {
      uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
      name: fileName,
      type: type,
    } as any);

    const fullUrl = `${API_BASE_URL.replace(/\/$/, '')}/${apiPaths.upload}`;
    console.log('[uploadFile] Uploading:', fileName);

    const response = await axios.post(fullUrl, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: token ? `Bearer ${token}` : '',
      },
      transformRequest: (data) => data,
      timeout: 60000,
    });

    console.log('[uploadFile] Response:', response.data);

    if (response.data?.success && response.data?.data) {
      return response.data.data;
    }
    
    throw new Error(response.data?.message || 'Upload failed');
  } catch (error: any) {
    console.error('[uploadFile] Error:', error.message);
    throw new Error(error.response?.data?.message || error.message || 'Upload failed');
  }
};
