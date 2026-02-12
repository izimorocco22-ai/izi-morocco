import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '@env';
import { apiPaths } from './apiPaths';

const API_BASE_URL: string = API_URL || 'https://izi-morocco-1.onrender.com';

export const uploadFile = async (uri: string) => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    const formData = new FormData();
    
    // Extract file name and type from URI
    const uriParts = uri.split('.');
    const fileType = uriParts[uriParts.length - 1];
    const fileName = uri.split('/').pop();

    formData.append('file', {
      uri,
      name: fileName || `upload.${fileType}`,
      type: fileType === 'mp4' ? 'video/mp4' : 'image/jpeg',
    } as any);

    const response = await fetch(`${API_BASE_URL.replace(/\/$/, '')}/${apiPaths.upload}`, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: token ? `Bearer ${token}` : '',
      },
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Upload failed');
    }

    return result.data; // Should contain { url, public_id }
  } catch (error: any) {
    console.error('Upload service error:', error);
    throw error;
  }
};
