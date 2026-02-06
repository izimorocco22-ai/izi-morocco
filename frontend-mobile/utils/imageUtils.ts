import { API_URL, VITE_MEDIA_URL } from '@env';

export const getCleanMediaUrl = (url: string | undefined | null, type: 'image' | 'video' = 'image') => {
  if (!url) return null;
  if (typeof url !== 'string') return url;
  if (url.startsWith('file://')) return url;

  // Decode HTML entities (basic handling)
  let cleanUrl = url.replace(/&#x2F;/g, "/");

  // Check for nested Cloudinary URL
  const cloudinaryMatch = cleanUrl.match(/(https:\/\/res\.cloudinary\.com\/.*)/);
  if (cloudinaryMatch) {
    return cloudinaryMatch[1];
  }

  // Check for izi_morocco prefix
  if (cleanUrl.startsWith('izi_morocco/')) {
    const resourceType = type === 'video' ? 'video' : 'image';
    return `https://res.cloudinary.com/dik1l8tqu/${resourceType}/upload/${cleanUrl}`;
  }

  // Check if it's already a full URL
  if (cleanUrl.startsWith('http')) {
    return cleanUrl;
  }

  // Fallback to MEDIA_URL
  if (VITE_MEDIA_URL) {
      const mediaUrl = VITE_MEDIA_URL.trim().replace(/\/$/, '');
      const path = cleanUrl.startsWith('/') ? cleanUrl.slice(1) : cleanUrl;
      return `${mediaUrl}/${path}`;
  }

  // Default fallback
  const base = (API_URL || 'https://izi-morocco-1.onrender.com').replace(/\/$/, '');
  const path = cleanUrl.startsWith('uploads/') ? cleanUrl : `uploads/${cleanUrl}`;
  return `${base}/public/${path}`;
};

export const getCleanImageUrl = (url: string | undefined | null) => getCleanMediaUrl(url, 'image');
