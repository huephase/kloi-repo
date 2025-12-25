// 2025-12-25T22:57:00Z 🟡🟡🟡 - [IMAGE UPLOAD SERVICE] Image upload service for admin menu editor
// ⚠️⚠️⚠️ - [IMAGE UPLOAD SERVICE] Handles secure image uploads with validation and theme-scoped storage
import { MultipartFile } from '@fastify/multipart';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

// 🟡🟡🟡 - [CONSTANTS] Image upload configuration
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/svg+xml'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.svg'];
const MENUS_DIR = 'menus'; // Directory name for menu images

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

// 🟡🟡🟡 - [FILENAME] Generate unique filename with UUID
export function generateUniqueFilename(originalName: string, theme: string): string {
  const ext = path.extname(originalName).toLowerCase();
  const uuid = randomUUID();
  const filename = `${uuid}${ext}`;
  console.log('🟡🟡🟡 - [IMAGE UPLOAD] Generated unique filename:', filename, 'for theme:', theme);
  return filename;
}

// 🟡🟡🟡 - [DIRECTORY] Ensure theme directory exists
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

// 🟡🟡🟡 - [SAVE] Save image file to theme directory
export async function saveImageFile(file: MultipartFile, theme: string): Promise<{ filePath: string; relativePath: string }> {
  // 🟡🟡🟡 - [VALIDATION] Validate file before saving
  const validation = await validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error || 'File validation failed');
  }

  // 🟡🟡🟡 - [DIRECTORY] Ensure theme directory exists
  const themeDir = ensureThemeDirectory(theme);

  // 🟡🟡🟡 - [FILENAME] Generate unique filename
  const filename = generateUniqueFilename(file.filename || 'image', theme);
  const filePath = path.join(themeDir, filename);

  // 🟡🟡🟡 - [SAVE] Save file to disk using validated buffer
  const buffer = validation.buffer!;
  const writeStream = fs.createWriteStream(filePath);
  writeStream.write(buffer);
  writeStream.end();

  // 🟡🟡🟡 - [PROMISE] Wait for file write to complete
  await new Promise<void>((resolve, reject) => {
    writeStream.on('finish', () => {
      console.log('✅✅✅ - [IMAGE UPLOAD] File saved successfully:', filePath);
      resolve();
    });
    writeStream.on('error', (err) => {
      console.error('❗❗❗ - [IMAGE UPLOAD] Error writing file:', err);
      reject(err);
    });
  });

  // 🟡🟡🟡 - [PATH] Generate relative path for response
  const relativePath = `/public/${MENUS_DIR}/${theme}/${filename}`;

  return {
    filePath: filePath,
    relativePath: relativePath
  };
}

// 🟡🟡🟡 - [DELETE] Delete image file (for future use/cleanup)
export function deleteImageFile(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log('✅✅✅ - [IMAGE UPLOAD] File deleted:', filePath);
    } else {
      console.warn('⚠️⚠️⚠️ - [IMAGE UPLOAD] File not found for deletion:', filePath);
    }
  } catch (error) {
    console.error('❗❗❗ - [IMAGE UPLOAD] Error deleting file:', error);
    throw error;
  }
}

