// 2025-12-25T22:57:00Z 🟡🟡🟡 - [IMAGE UPLOAD SERVICE] Image upload service for admin menu editor
// 2026-01-09T16:40:00Z ⚠️⚠️⚠️ - [IMAGE UPLOAD SERVICE] Added S3 storage support to prevent folder destruction on deployments
// ⚠️⚠️⚠️ - [IMAGE UPLOAD SERVICE] Handles secure image uploads with validation and theme-scoped storage
import { MultipartFile } from '@fastify/multipart';
import fs from 'fs';
import path from 'path';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

// 🟡🟡🟡 - [CONSTANTS] Image upload configuration
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/svg+xml'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.svg'];
const MENUS_DIR = 'menus'; // Directory name for menu images

// 🟡🟡🟡 - [STORAGE INTERFACE] Storage adapter interface for abstraction
interface StorageAdapter {
  save(buffer: Buffer, key: string, contentType: string): Promise<string>;
  delete(key: string): Promise<void>;
  getUrl(key: string): string;
}

// 🟡🟡🟡 - [LOCAL STORAGE] Local filesystem storage implementation
class LocalStorage implements StorageAdapter {
  private baseDir: string;

  constructor() {
    // 🟡🟡🟡 - [BASE DIR] Set base directory for local storage
    this.baseDir = path.join(__dirname, '../../public');
    console.log('🟡🟡🟡 - [LOCAL STORAGE] Initialized with base directory:', this.baseDir);
  }

  async save(buffer: Buffer, key: string, contentType: string): Promise<string> {
    // 🟡🟡🟡 - [FILE PATH] Construct full file path
    const filePath = path.join(this.baseDir, key);
    const fileDir = path.dirname(filePath);

    // 🟡🟡🟡 - [DIRECTORY] Ensure directory exists
    if (!fs.existsSync(fileDir)) {
      fs.mkdirSync(fileDir, { recursive: true });
      console.log('✅✅✅ - [LOCAL STORAGE] Created directory:', fileDir);
    }

    // 🟡🟡🟡 - [SAVE] Write file to disk
    await new Promise<void>((resolve, reject) => {
      const writeStream = fs.createWriteStream(filePath);
      writeStream.write(buffer);
      writeStream.end();
      
      writeStream.on('finish', () => {
        console.log('✅✅✅ - [LOCAL STORAGE] File saved successfully:', filePath);
        resolve();
      });
      
      writeStream.on('error', (err) => {
        console.error('❗❗❗ - [LOCAL STORAGE] Error writing file:', err);
        reject(err);
      });
    });

    // 🟡🟡🟡 - [RETURN] Return relative path for local storage
    return `/${key}`;
  }

  async delete(key: string): Promise<void> {
    // 🟡🟡🟡 - [FILE PATH] Construct full file path
    const filePath = path.join(this.baseDir, key);
    
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log('✅✅✅ - [LOCAL STORAGE] File deleted:', filePath);
      } else {
        console.warn('⚠️⚠️⚠️ - [LOCAL STORAGE] File not found for deletion:', filePath);
      }
    } catch (error) {
      console.error('❗❗❗ - [LOCAL STORAGE] Error deleting file:', error);
      throw error;
    }
  }

  getUrl(key: string): string {
    // 🟡🟡🟡 - [URL] Return relative path for local storage
    return `/${key}`;
  }
}

// 🟡🟡🟡 - [S3 STORAGE] Amazon S3 storage implementation
class S3Storage implements StorageAdapter {
  private s3Client: S3Client;
  private bucketName: string;
  private publicBaseUrl: string;

  constructor() {
    // 🟡🟡🟡 - [CONFIG] Load S3 configuration from environment variables
    const region = process.env.AWS_S3_REGION;
    const accessKeyId = process.env.AWS_S3_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_S3_SECRET_ACCESS_KEY;
    const bucketArn = process.env.AWS_S3_BUCKET;
    const publicBaseUrl = process.env.AWS_S3_PUBLIC_BASE_URL;

    // 🟡🟡🟡 - [VALIDATION] Validate required S3 configuration
    if (!region || !accessKeyId || !secretAccessKey || !bucketArn || !publicBaseUrl) {
      const missing = [];
      if (!region) missing.push('AWS_S3_REGION');
      if (!accessKeyId) missing.push('AWS_S3_ACCESS_KEY_ID');
      if (!secretAccessKey) missing.push('AWS_S3_SECRET_ACCESS_KEY');
      if (!bucketArn) missing.push('AWS_S3_BUCKET');
      if (!publicBaseUrl) missing.push('AWS_S3_PUBLIC_BASE_URL');
      
      console.error('❗❗❗ - [S3 STORAGE] Missing required environment variables:', missing.join(', '));
      throw new Error(`S3 storage configuration incomplete. Missing: ${missing.join(', ')}`);
    }

    // 🟡🟡🟡 - [BUCKET NAME] Extract bucket name from ARN if needed
    // ARN format: arn:aws:s3:::bucket-name
    if (bucketArn.startsWith('arn:aws:s3:::')) {
      this.bucketName = bucketArn.replace('arn:aws:s3:::', '');
    } else {
      // 🟡🟡🟡 - [BUCKET NAME] Assume it's already a bucket name if not ARN format
      this.bucketName = bucketArn;
    }

    // 🟡🟡🟡 - [PUBLIC URL] Store public base URL (ensure it doesn't end with slash)
    this.publicBaseUrl = publicBaseUrl.endsWith('/') ? publicBaseUrl.slice(0, -1) : publicBaseUrl;

    // 🟡🟡🟡 - [S3 CLIENT] Initialize S3 client with credentials
    this.s3Client = new S3Client({
      region: region,
      credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
      },
    });

    console.log('✅✅✅ - [S3 STORAGE] Initialized with bucket:', this.bucketName, 'region:', region);
    console.log('🟡🟡🟡 - [S3 STORAGE] Public base URL:', this.publicBaseUrl);
  }

  async save(buffer: Buffer, key: string, contentType: string): Promise<string> {
    // 🟡🟡🟡 - [UPLOAD] Upload file to S3 using multipart upload for better performance
    const upload = new Upload({
      client: this.s3Client,
      params: {
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        // 🟡🟡🟡 - [ACL] Set public read access for uploaded images
        ACL: 'public-read',
      },
    });

    try {
      // 🟡🟡🟡 - [UPLOAD] Execute upload and wait for completion
      const result = await upload.done();
      console.log('✅✅✅ - [S3 STORAGE] File uploaded successfully:', key, 'ETag:', result.ETag);
      
      // 🟡🟡🟡 - [URL] Return public URL for the uploaded file
      return this.getUrl(key);
    } catch (error) {
      console.error('❗❗❗ - [S3 STORAGE] Error uploading file:', error);
      throw new Error(`Failed to upload file to S3: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async delete(key: string): Promise<void> {
    // 🟡🟡🟡 - [DELETE] Delete file from S3
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    try {
      await this.s3Client.send(command);
      console.log('✅✅✅ - [S3 STORAGE] File deleted successfully:', key);
    } catch (error) {
      console.error('❗❗❗ - [S3 STORAGE] Error deleting file:', error);
      throw new Error(`Failed to delete file from S3: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  getUrl(key: string): string {
    // 🟡🟡🟡 - [URL] Construct and return public URL for S3 object
    const url = `${this.publicBaseUrl}/${key}`;
    return url;
  }
}

// 🟡🟡🟡 - [STORAGE FACTORY] Get storage adapter based on environment configuration
function getStorageAdapter(): StorageAdapter {
  const storageType = process.env.STORAGE_TYPE || 'local';
  
  console.log('🟡🟡🟡 - [STORAGE FACTORY] Storage type:', storageType);
  
  if (storageType === 's3') {
    try {
      return new S3Storage();
    } catch (error) {
      console.error('❗❗❗ - [STORAGE FACTORY] Failed to initialize S3 storage, falling back to local storage');
      console.error('❗❗❗ - [STORAGE FACTORY] Error:', error);
      // 🟡🟡🟡 - [FALLBACK] Fall back to local storage if S3 initialization fails
      return new LocalStorage();
    }
  } else {
    // 🟡🟡🟡 - [DEFAULT] Default to local storage
    return new LocalStorage();
  }
}

// 🟡🟡🟡 - [STORAGE INSTANCE] Initialize storage adapter (lazy initialization)
let storageAdapter: StorageAdapter | null = null;

function getStorage(): StorageAdapter {
  if (!storageAdapter) {
    storageAdapter = getStorageAdapter();
  }
  return storageAdapter;
}

// 🟡🟡🟡 - [VALIDATION] Validate image file type and size
export async function validateImageFile(file: MultipartFile, maxSize: number = MAX_FILE_SIZE): Promise<{ valid: boolean; error?: string; buffer?: Buffer }> {
  // 🟡🟡🟡 - [BUFFER] Read file into buffer to check size
  const buffer = await file.toBuffer();
  
  // 🟡🟡🟡 - [VALIDATION] Check file size
  if (buffer.length > maxSize) {
    console.error('❗❗❗ - [IMAGE UPLOAD] File size exceeds limit:', buffer.length, 'bytes');
    return {
      valid: false,
      error: `File size exceeds ${maxSize / (1024 * 1024)}MB limit`,
      buffer: buffer
    };
  }

  // 🟡🟡🟡 - [VALIDATION] Check MIME type
  const mimeType = file.mimetype;
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    console.error('❗❗❗ - [IMAGE UPLOAD] Invalid MIME type:', mimeType);
    return {
      valid: false,
      error: `Invalid file type. Only JPG, PNG, and SVG images are allowed.`
    };
  }

  // 🟡🟡🟡 - [VALIDATION] Check file extension
  const filename = file.filename || '';
  const ext = path.extname(filename).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    console.error('❗❗❗ - [IMAGE UPLOAD] Invalid file extension:', ext);
    return {
      valid: false,
      error: `Invalid file extension. Only .jpg, .jpeg, .png, and .svg files are allowed.`
    };
  }

  // 🟡🟡🟡 - [VALIDATION] Additional security: verify MIME type matches extension
  const mimeToExt: { [key: string]: string[] } = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/svg+xml': ['.svg']
  };

  const expectedExts = mimeToExt[mimeType] || [];
  if (!expectedExts.includes(ext)) {
    console.error('❗❗❗ - [IMAGE UPLOAD] MIME type does not match extension:', mimeType, 'vs', ext);
    return {
      valid: false,
      error: 'File type mismatch. MIME type does not match file extension.'
    };
  }

  console.log('✅✅✅ - [IMAGE UPLOAD] File validation passed:', filename, mimeType, ext, 'size:', buffer.length, 'bytes');
  return { valid: true, buffer: buffer };
}

// 🟡🟡🟡 - [FILENAME] Generate unique filename with theme name and date-time stamp
export function generateUniqueFilename(originalName: string, theme: string): string {
  const ext = path.extname(originalName).toLowerCase();
  
  // 🟡🟡🟡 - [DATE] Get current server date and time
  const now = new Date();
  const day = now.getDate(); // Day of month (1-31)
  const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const month = monthNames[now.getMonth()]; // 3-letter month abbreviation (lowercase)
  const year = now.getFullYear(); // Full year (e.g., 2026)
  const hours = now.getHours().toString().padStart(2, '0'); // Hours (00-23)
  const minutes = now.getMinutes().toString().padStart(2, '0'); // Minutes (00-59)
  
  // 🟡🟡🟡 - [TIMESTAMP] Format date-time stamp: day-month-year_hourminute
  // Format matches user request: {theme}_{day-month-year_hourminute}_{randomSuffix}.{ext}
  // Example: default_6-jan-2026_1714_847.jpg
  const dateStamp = `${day}-${month}-${year}`;
  const timeStamp = `${hours}${minutes}`;
  const dateTimeStamp = `${dateStamp}_${timeStamp}`;
  
  // 🟡🟡🟡 - [RANDOM SUFFIX] Generate random 3-digit suffix to prevent overwrites
  // Ensures uniqueness even if multiple files uploaded in same minute
  const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  
  // 🟡🟡🟡 - [SANITIZE] Sanitize theme name to ensure filesystem-safe filename
  // Remove any characters that might cause issues in filenames
  const sanitizedTheme = theme.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
  
  // 🟡🟡🟡 - [FILENAME] Generate filename: {theme}_{date-time-stamp}_{randomSuffix}.{ext}
  const filename = `${sanitizedTheme}_${dateTimeStamp}_${randomSuffix}${ext}`;
  
  console.log('🟡🟡🟡 - [IMAGE UPLOAD] Generated unique filename:', filename, 'for theme:', theme);
  return filename;
}

// 🟡🟡🟡 - [DIRECTORY] Ensure theme directory exists (for local storage only)
export function ensureThemeDirectory(theme: string): string {
  const publicDir = path.join(__dirname, '../../public');
  const menusDir = path.join(publicDir, MENUS_DIR);
  const themeDir = path.join(menusDir, theme);

  // 🟡🟡🟡 - [DIRECTORY] Create menus directory if it doesn't exist
  if (!fs.existsSync(menusDir)) {
    fs.mkdirSync(menusDir, { recursive: true });
    console.log('✅✅✅ - [IMAGE UPLOAD] Created menus directory:', menusDir);
  }

  // 🟡🟡🟡 - [DIRECTORY] Create theme directory if it doesn't exist
  if (!fs.existsSync(themeDir)) {
    fs.mkdirSync(themeDir, { recursive: true });
    console.log('✅✅✅ - [IMAGE UPLOAD] Created theme directory:', themeDir);
  }

  return themeDir;
}

// 🟡🟡🟡 - [SAVE] Save image file using storage adapter (local or S3)
export async function saveImageFile(file: MultipartFile, theme: string): Promise<{ filePath: string; relativePath: string }> {
  // 🟡🟡🟡 - [VALIDATION] Validate file before saving
  const validation = await validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error || 'File validation failed');
  }

  // 🟡🟡🟡 - [STORAGE] Get storage adapter (local or S3)
  const storage = getStorage();
  const storageType = process.env.STORAGE_TYPE || 'local';

  // 🟡🟡🟡 - [FILENAME] Generate unique filename
  const filename = generateUniqueFilename(file.filename || 'image', theme);
  
  // 🟡🟡🟡 - [KEY] Construct storage key (path in storage)
  const storageKey = `${MENUS_DIR}/${theme}/${filename}`;

  // 🟡🟡🟡 - [SAVE] Save file using storage adapter
  const buffer = validation.buffer!;
  const mimeType = file.mimetype;
  const url = await storage.save(buffer, storageKey, mimeType);

  // 🟡🟡🟡 - [RESPONSE] Prepare response based on storage type
  let filePath: string;
  let relativePath: string;

  if (storageType === 's3') {
    // 🟡🟡🟡 - [S3] For S3, filePath is the S3 key, relativePath is the public URL
    filePath = storageKey;
    relativePath = url; // Full S3 public URL
    console.log('✅✅✅ - [IMAGE UPLOAD] File saved to S3:', storageKey, 'Public URL:', url);
  } else {
    // 🟡🟡🟡 - [LOCAL] For local storage, maintain backward compatibility
    const themeDir = ensureThemeDirectory(theme);
    filePath = path.join(themeDir, filename);
    relativePath = url; // Relative path like /public/menus/theme/filename
    console.log('✅✅✅ - [IMAGE UPLOAD] File saved locally:', filePath);
  }

  return {
    filePath: filePath,
    relativePath: relativePath
  };
}

// 🟡🟡🟡 - [DELETE] Delete image file using storage adapter (local or S3)
export async function deleteImageFile(filePath: string): Promise<void> {
  // 🟡🟡🟡 - [STORAGE] Get storage adapter
  const storage = getStorage();
  const storageType = process.env.STORAGE_TYPE || 'local';

  // 🟡🟡🟡 - [KEY] Determine storage key based on storage type
  let storageKey: string;

  if (storageType === 's3') {
    // 🟡🟡🟡 - [S3] Handle S3 URLs or storage keys
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      // 🟡🟡🟡 - [S3 URL] Extract storage key from S3 URL
      // URL format: {AWS_S3_PUBLIC_BASE_URL}/menus/{theme}/{filename}
      const publicBaseUrl = process.env.AWS_S3_PUBLIC_BASE_URL || '';
      if (publicBaseUrl && filePath.startsWith(publicBaseUrl)) {
        storageKey = filePath.replace(publicBaseUrl, '').replace(/^\/+/, '');
      } else {
        // 🟡🟡🟡 - [FALLBACK] Try to extract key from URL path
        try {
          const url = new URL(filePath);
          storageKey = url.pathname.replace(/^\/+/, '');
        } catch {
          // 🟡🟡🟡 - [FALLBACK] If URL parsing fails, assume it's already a key
          storageKey = filePath;
        }
      }
    } else {
      // 🟡🟡🟡 - [S3 KEY] For S3, filePath is already the storage key
      storageKey = filePath;
    }
  } else {
    // 🟡🟡🟡 - [LOCAL] For local storage, convert file path to relative key
    const publicDir = path.join(__dirname, '../../public');
    if (filePath.startsWith(publicDir)) {
      storageKey = filePath.replace(publicDir, '').replace(/^[\/\\]/, '').replace(/\\/g, '/');
    } else if (filePath.startsWith('/public/')) {
      storageKey = filePath.replace(/^\/public\//, '');
    } else {
      storageKey = filePath;
    }
  }

  // 🟡🟡🟡 - [DELETE] Delete file using storage adapter
  await storage.delete(storageKey);
}
