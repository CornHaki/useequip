import { imageFileToDataUrl } from './imageData';

const MAX_EVIDENCE_DATA_LENGTH = 450_000;
const MAX_EVIDENCE_FILE_SIZE = 3 * 1024 * 1024;
const ALLOWED_EVIDENCE_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp'
]);

export async function evidenceFileToDataUrl(file) {
  if (!file || !ALLOWED_EVIDENCE_TYPES.has(file.type)) {
    throw new Error('Choose a PDF, JPG, PNG, or WebP evidence file.');
  }
  if (file.size > MAX_EVIDENCE_FILE_SIZE) {
    throw new Error('Choose an evidence file smaller than 3 MB.');
  }

  if (file.type.startsWith('image/')) {
    const dataUrl = await imageFileToDataUrl(file);
    if (dataUrl.length > MAX_EVIDENCE_DATA_LENGTH) {
      throw new Error('This image is too large to store as qualification evidence. Choose a smaller image.');
    }
    return { dataUrl, mimeType: 'image/jpeg' };
  }

  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(reader.result));
    reader.addEventListener('error', () => reject(new Error('Could not read the evidence file.')));
    reader.readAsDataURL(file);
  });
  if (typeof dataUrl !== 'string' || dataUrl.length > MAX_EVIDENCE_DATA_LENGTH) {
    throw new Error('This PDF is too large to store privately in Firestore. Choose a PDF smaller than 320 KB.');
  }
  return { dataUrl, mimeType: file.type };
}
