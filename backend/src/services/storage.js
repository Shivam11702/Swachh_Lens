const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const config = require('../config');
const { logger } = require('../utils/logger');

class StorageProvider {
  async upload(filePath, filename, mimetype) {
    throw new Error('Not implemented');
  }
  
  async delete(filename) {
    throw new Error('Not implemented');
  }
  
  getPublicUrl(filename) {
    throw new Error('Not implemented');
  }
  
  async createThumbnail(filePath, filename) {
    throw new Error('Not implemented');
  }
}

class LocalStorageProvider extends StorageProvider {
  constructor() {
    super();
    this.uploadsDir = config.storage.local.uploadsDir;
    this.thumbsDir = path.join(this.uploadsDir, 'thumbs');
    if (!fs.existsSync(this.uploadsDir)) fs.mkdirSync(this.uploadsDir, { recursive: true });
    if (!fs.existsSync(this.thumbsDir)) fs.mkdirSync(this.thumbsDir, { recursive: true });
  }
  
  async upload(filePath, filename, mimetype) {
    const destPath = path.join(this.uploadsDir, filename);
    if (path.resolve(filePath) !== path.resolve(destPath)) {
      fs.copyFileSync(filePath, destPath);
    }
    return { url: this.getPublicUrl(filename) };
  }
  
  async delete(filename) {
    const filePath = path.join(this.uploadsDir, filename);
    const thumbPath = path.join(this.thumbsDir, filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);
  }
  
  getPublicUrl(filename) {
    return `${config.storage.local.publicUrl}/uploads/${filename}`;
  }
  
  async createThumbnail(filePath, filename) {
    try {
      const ext = path.extname(filename) || '.jpg';
      const name = path.basename(filename, ext);
      const thumbName = `${name}-thumb${ext}`;
      const thumbPath = path.join(this.thumbsDir, thumbName);
      await sharp(filePath)
        .resize({ width: 400 })
        .jpeg({ quality: 80 })
        .toFile(thumbPath);
      return thumbName;
    } catch (err) {
      logger.error('Thumbnail generation failed', { filename, error: err.message });
      return null;
    }
  }
}

class S3StorageProvider extends StorageProvider {
  constructor() {
    super();
    const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
    const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
    
    this.client = new S3Client({
      region: config.storage.s3.region,
      credentials: {
        accessKeyId: config.storage.s3.accessKeyId,
        secretAccessKey: config.storage.s3.secretAccessKey,
      },
    });
    this.bucket = config.storage.s3.bucket;
    this.publicUrl = config.storage.s3.publicUrl;
    this.getSignedUrl = getSignedUrl;
    this.PutObjectCommand = PutObjectCommand;
    this.DeleteObjectCommand = DeleteObjectCommand;
    this.GetObjectCommand = GetObjectCommand;
  }
  
  async upload(filePath, filename, mimetype) {
    const fileContent = fs.readFileSync(filePath);
    const command = new this.PutObjectCommand({
      Bucket: this.bucket,
      Key: filename,
      Body: fileContent,
      ContentType: mimetype,
    });
    await this.client.send(command);
    return { url: this.getPublicUrl(filename) };
  }
  
  async delete(filename) {
    const command = new this.DeleteObjectCommand({
      Bucket: this.bucket,
      Key: filename,
    });
    await this.client.send(command);
  }
  
  getPublicUrl(filename) {
    if (this.publicUrl) {
      return `${this.publicUrl}/${filename}`;
    }
    const command = new this.GetObjectCommand({
      Bucket: this.bucket,
      Key: filename,
    });
    return this.getSignedUrl(this.client, command, { expiresIn: 3600 });
  }
  
  async createThumbnail(filePath, filename) {
    const ext = path.extname(filename) || '.jpg';
    const name = path.basename(filename, ext);
    const thumbName = `${name}-thumb${ext}`;
    const thumbPath = path.join('/tmp', thumbName);
    
    await sharp(filePath)
      .resize({ width: 400 })
      .jpeg({ quality: 80 })
      .toFile(thumbPath);
    
    await this.upload(thumbPath, thumbName, 'image/jpeg');
    fs.unlinkSync(thumbPath);
    
    return thumbName;
  }
}

class GCSStorageProvider extends StorageProvider {
  constructor() {
    super();
    const { Storage } = require('@google-cloud/storage');
    
    this.storage = new Storage({
      projectId: config.storage.gcs.projectId,
      keyFilename: config.storage.gcs.keyFilename,
    });
    this.bucketName = config.storage.gcs.bucket;
    this.bucket = this.storage.bucket(this.bucketName);
    this.publicUrl = config.storage.gcs.publicUrl;
  }
  
  async upload(filePath, filename, mimetype) {
    await this.bucket.upload(filePath, {
      destination: filename,
      metadata: { contentType: mimetype },
    });
    return { url: this.getPublicUrl(filename) };
  }
  
  async delete(filename) {
    await this.bucket.file(filename).delete();
  }
  
  async getPublicUrl(filename) {
    if (this.publicUrl) {
      return `${this.publicUrl}/${filename}`;
    }
    const file = this.bucket.file(filename);
    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 3600 * 1000,
    });
    return url;
  }
  
  async createThumbnail(filePath, filename) {
    const ext = path.extname(filename) || '.jpg';
    const name = path.basename(filename, ext);
    const thumbName = `${name}-thumb${ext}`;
    const thumbPath = path.join('/tmp', thumbName);
    
    await sharp(filePath)
      .resize({ width: 400 })
      .jpeg({ quality: 80 })
      .toFile(thumbPath);
    
    await this.upload(thumbPath, thumbName, 'image/jpeg');
    fs.unlinkSync(thumbPath);
    
    return thumbName;
  }
}

class AzureStorageProvider extends StorageProvider {
  constructor() {
    super();
    const { BlobServiceClient } = require('@azure/storage-blob');
    
    const connectionString = `DefaultEndpointsProtocol=https;AccountName=${config.storage.azure.accountName};AccountKey=${config.storage.azure.accountKey};EndpointSuffix=core.windows.net`;
    this.blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    this.containerClient = this.blobServiceClient.getContainerClient(config.storage.azure.container);
    this.publicUrl = config.storage.azure.publicUrl;
  }
  
  async upload(filePath, filename, mimetype) {
    const blockBlobClient = this.containerClient.getBlockBlobClient(filename);
    await blockBlobClient.uploadFile(filePath, {
      blobHTTPHeaders: { blobContentType: mimetype },
    });
    return { url: this.getPublicUrl(filename) };
  }
  
  async delete(filename) {
    const blockBlobClient = this.containerClient.getBlockBlobClient(filename);
    await blockBlobClient.delete();
  }
  
  getPublicUrl(filename) {
    if (this.publicUrl) {
      return `${this.publicUrl}/${filename}`;
    }
    const blockBlobClient = this.containerClient.getBlockBlobClient(filename);
    return blockBlobClient.url;
  }
  
  async createThumbnail(filePath, filename) {
    const ext = path.extname(filename) || '.jpg';
    const name = path.basename(filename, ext);
    const thumbName = `${name}-thumb${ext}`;
    const thumbPath = path.join('/tmp', thumbName);
    
    await sharp(filePath)
      .resize({ width: 400 })
      .jpeg({ quality: 80 })
      .toFile(thumbPath);
    
    await this.upload(thumbPath, thumbName, 'image/jpeg');
    fs.unlinkSync(thumbPath);
    
    return thumbName;
  }
}

class ImageKitProvider extends StorageProvider {
  constructor() {
    super();
    if (config.storage.imagekit.publicKey && config.storage.imagekit.privateKey && config.storage.imagekit.urlEndpoint) {
      try {
        const ImageKit = require('imagekit');
        this.imagekit = new ImageKit({
          publicKey: config.storage.imagekit.publicKey,
          privateKey: config.storage.imagekit.privateKey,
          urlEndpoint: config.storage.imagekit.urlEndpoint,
        });
        this.enabled = true;
      } catch (e) {
        logger.warn('ImageKit SDK not available');
        this.enabled = false;
      }
    } else {
      this.enabled = false;
    }
  }
  
  async upload(filePath, filename, mimetype) {
    if (!this.enabled) throw new Error('ImageKit not configured');
    
    const data = fs.readFileSync(filePath).toString('base64');
    const base64 = `data:${mimetype};base64,${data}`;
    
    return new Promise((resolve, reject) => {
      this.imagekit.upload({ file: base64, fileName: filename }, (err, resp) => {
        if (err) return reject(err);
        resolve({ url: resp.url });
      });
    });
  }
  
  async delete(filename) {
    if (!this.enabled) return;
    
    return new Promise((resolve, reject) => {
      this.imagekit.deleteFile(filename, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  }
  
  getPublicUrl(filename) {
    if (!this.enabled) return null;
    return this.imagekit.url({ src: filename });
  }
  
  async createThumbnail(filePath, filename) {
    if (!this.enabled) return null;
    
    try {
      return this.imagekit.url({
        src: filename, 
        transformation: [{ width: 400 }] 
      });
    } catch (e) {
      return null;
    }
  }
}

function createStorageProvider() {
  switch (config.storage.provider) {
    case 's3':
      return new S3StorageProvider();
    case 'gcs':
      return new GCSStorageProvider();
    case 'azure':
      return new AzureStorageProvider();
    case 'imagekit':
      return new ImageKitProvider();
    case 'local':
    default:
      return new LocalStorageProvider();
  }
}

const provider = createStorageProvider();

async function storeMediaFiles(files) {
  const results = [];
  for (const f of (files || [])) {
    try {
      const uploadResult = await provider.upload(f.path, f.filename, f.mimetype || 'image/jpeg');
      let thumbnailUrl = null;
      
      try {
        const thumbResult = await provider.createThumbnail(f.path, f.filename);
        if (thumbResult) {
          thumbnailUrl = /^https?:\/\//i.test(thumbResult) ? thumbResult : provider.getPublicUrl(thumbResult);
        }
      } catch (e) {
        logger.warn('Thumbnail creation failed', { filename: f.filename, error: e.message });
      }
      
      results.push({ 
        url: uploadResult.url, 
        thumbnail_url: thumbnailUrl 
      });
      
      const shouldDeleteSource =
        !(provider instanceof LocalStorageProvider) ||
        path.resolve(f.path) !== path.resolve(path.join(provider.uploadsDir, f.filename));

      if (shouldDeleteSource) {
        try { fs.unlinkSync(f.path); } catch (e) {}
      }
    } catch (err) {
      logger.error('File upload failed', { filename: f.filename, error: err.message });
      throw err;
    }
  }
  return results;
}

async function deleteMediaFile(filename) {
  return provider.delete(filename);
}

module.exports = { 
  storeMediaFiles, 
  deleteMediaFile, 
  getPublicUrl: (filename) => provider.getPublicUrl(filename),
  provider,
};
