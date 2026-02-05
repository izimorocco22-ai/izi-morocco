// services/imageUploadService.js
import { MEDIA_URL } from '../utils/config';
import { getCleanImageUrl } from '../utils/common';
import { extractImagesAsFiles } from '../utils/quill';
import { callAPI } from './callApi'; // Your existing API utility

/**
 * Upload images using your existing API pattern
 */
export const uploadImagesToServer = async (imageFiles) => {
    if (!imageFiles || imageFiles.length === 0) {
        return { images: [] };
    }

    const formData = new FormData();

    // Append all image files
    imageFiles.forEach((fileObj) => {
        formData.append("images", fileObj.file);
    });

    try {
        const response = await callAPI("/upload", {
            method: "POST",
            data: formData,
            headers: { "Content-Type": "multipart/form-data" },
            suppressError: true,
        });

        if (!response.error) {
            const { images = [] } = response?.data?.response || {};

            // Map uploaded URLs back to their original indices
            return imageFiles.map((fileObj, index) => ({
                originalIndex: fileObj.originalIndex,
                url: images[index] || '', // Adjust based on your API response structure
                filename: fileObj.filename
            }));
        } else {
            throw new Error('Upload failed');
        }
    } catch (error) {
        console.error('Image upload error:', error);
        throw error;
    }
};

/**
 * Replace base64 images in Delta with URLs after upload
 */
export const replaceBase64WithUrls = (delta, uploadResults) => {
    if (!delta || !delta.ops) return delta;

    const newOps = [...delta.ops];

    uploadResults.forEach((result) => {
        if (newOps[result.originalIndex] &&
            newOps[result.originalIndex].insert &&
            typeof newOps[result.originalIndex].insert === 'object' &&
            newOps[result.originalIndex].insert.image) {

            newOps[result.originalIndex] = {
                ...newOps[result.originalIndex],
                insert: {
                    image: getCleanImageUrl(result.url),
                }
            };
        }
    });

    return {
        ...delta,
        ops: newOps
    };
};

/**
 * Process Delta: extract images, upload, and replace with URLs
 */
export const processDeltaImages = async (delta) => {
    if (!delta) return delta;

    // Extract images from Delta and convert to files
    const imageFiles = extractImagesAsFiles(delta);

    if (imageFiles.length === 0) {
        return delta; // No images to process
    }

    try {
        // Upload images using your existing API pattern
        const uploadResults = await uploadImagesToServer(imageFiles);

        // Replace base64 with URLs in Delta
        const processedDelta = replaceBase64WithUrls(delta, uploadResults);

        return processedDelta;

    } catch (error) {
        console.error('Failed to process images:', error);
        // Return original delta if upload fails
        return delta;
    }
};

