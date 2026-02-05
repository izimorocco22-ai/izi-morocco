import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client
} from '@aws-sdk/client-s3';
import { ListBucketsCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import dotenv from 'dotenv';
import { matchedData } from 'express-validator';
import fs from 'fs';
import path from 'path';
import httpStatus from 'http-status';
import { v2 as cloudinary } from 'cloudinary';
import buildErrorObject from '../utils/buildErrorObject.js';
import handleError from '../utils/handleError.js';
import buildResponse from '../utils/buildResponse.js';

dotenv.config();
// Configure S3 Client
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

cloudinary.config({
  cloud_name: process.env.CDN_NAME,
  api_key: process.env.CDN_API_KEY,
  api_secret: process.env.CDN_API_SECRET
});

export const verifyAWSConnection = async () => {
  console.log('data');
  console.log('Verifying AWS connection...');
  try {
    const command = new ListBucketsCommand({});
    const response = await s3.send(command);
    console.log('AWS Connection Verified. Buckets:', response.Buckets);
  } catch (error) {
    console.error('Failed to connect to AWS:', error.message);
    process.exit(1);
  }
};

// Upload Controller
export const uploadController = async (req, res) => {
  try {
    const { images = [], videos = [], audios = [] } = req.files || {};
    const files = [...images, ...videos, ...audios];

    const bucketName = process.env.S3_BUCKET;

    if (!bucketName) {
      console.error('S3_BUCKET_NAME is not set in environment variables');
      throw buildErrorObject(
        httpStatus.INTERNAL_SERVER_ERROR,
        'S3_BUCKET_NAME is not set'
      );
    }
    if (!files.length) {
      throw buildErrorObject(httpStatus.BAD_REQUEST, 'No files uploaded');
    }

    const uploadPromises = files.map(async (file) => {
      const fileStream = fs.createReadStream(file.path);
      const uploadParams = {
        Bucket: bucketName,
        Key: `uploads/${file.originalname}`,
        Body: fileStream
      };

      const command = new PutObjectCommand(uploadParams);
      await s3.send(command);

      fs.unlinkSync(file.path);

      return `uploads/${file.originalname}`;
    });
    const uploadedFiles = await Promise.all(uploadPromises);
    res.status(httpStatus.OK).json({
      message: 'Files uploaded successfully',
      files: uploadedFiles
    });
  } catch (error) {
    handleError(res, error);
  }
};

export const cloudinaryUploadController = async (req, res) => {
  try {
    const response = {};

    const files = req.files;
    const images = req.files?.images;
    const videos = req.files?.videos;
    const audios = req.files?.audios;

    if (!files || files.length === 0) {
      throw buildErrorObject(httpStatus.BAD_REQUEST, 'No files uploaded');
    }

    if (files.length > 0) {
      response.files = await uploadFiles(files);
    }

    if (images && images.length > 0) {
      response.images = await uploadFiles(images);
    }

    if (videos && videos.length > 0) {
      response.videos = await uploadFiles(videos);
    }

    if(audios && audios.length > 0){
      response.audios = await uploadFiles(audios);
    }

    res.status(httpStatus.OK).json(buildResponse(httpStatus.OK, response));
  } catch (error) {
    handleError(res, error);
  }
};

export const localUploadController = async (req, res) => {
  try {
    const { images = [], videos = [], audios = [] } = req.files || {};
    
    if (!images.length && !videos.length && !audios.length) {
      throw buildErrorObject(httpStatus.BAD_REQUEST, 'No files uploaded');
    }

    const response = {};

    const processFiles = (fileList) => {
      return fileList.map((file) => {
        const targetDir = path.join('public', 'uploads');
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
        
        const fileName = file.originalname; 
        const targetPath = path.join(targetDir, fileName);
  
        fs.copyFileSync(file.path, targetPath);
        fs.unlinkSync(file.path);
  
        return `uploads/${fileName}`;
      });
    };

    if (images.length > 0) {
      response.images = processFiles(images);
    }

    if (videos.length > 0) {
      response.videos = processFiles(videos);
    }

    if (audios.length > 0) {
      response.audios = processFiles(audios);
    }

    res.status(httpStatus.OK).json(buildResponse(httpStatus.OK, response));
  } catch (error) {
    handleError(res, error);
  }
};

const uploadFiles = async (files) => {
  const uploadPromises = files.map((file) =>
    cloudinary.uploader
      .upload(file.path, {
        folder: 'uploads',
        resource_type: 'auto'
      })
      .then((result) => {
        fs.unlinkSync(file.path); 
        return result.public_id;
      })
      .catch((err) => {
        fs.unlinkSync(file.path);
        throw err;
      })
  );

  const uploadedFiles = await Promise.all(uploadPromises);
  return uploadedFiles;
};
