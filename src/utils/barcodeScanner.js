import { BrowserMultiFormatReader } from '@zxing/browser';

/**
 * Decodes a barcode from a provided image File.
 * @param {File} file - The image file from the camera or file picker.
 * @returns {Promise<{ success: boolean, code?: string, message?: string }>}
 */
export async function decodeBarcodeFromImage(file) {
  return new Promise((resolve) => {
    try {
      const codeReader = new BrowserMultiFormatReader();
      const imageUrl = URL.createObjectURL(file);

      const img = new Image();
      img.onload = async () => {
        try {
          const result = await codeReader.decodeFromImageElement(img);
          URL.revokeObjectURL(imageUrl);
          if (result && result.text) {
            resolve({ success: true, code: result.text });
          } else {
            resolve({ success: false, message: 'No barcode detected' });
          }
        } catch (err) {
          URL.revokeObjectURL(imageUrl);
          resolve({ success: false, message: 'No barcode detected in image.' });
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(imageUrl);
        resolve({ success: false, message: 'Failed to load image.' });
      };

      img.src = imageUrl;
    } catch (err) {
      console.error('[decodeBarcodeFromImage] Error:', err.message);
      resolve({ success: false, message: err.message });
    }
  });
}
