import { BrowserMultiFormatReader } from '@zxing/browser';

/**
 * Launches the phone camera and detects a barcode using the ZXing scanner.
 * @returns {Promise<{ success: boolean, code?: string, message?: string }>}
 */
export async function launchBarcodeScanner() {
  return new Promise(async (resolve) => {
    try {
      const codeReader = new BrowserMultiFormatReader();

      const videoInputDevices = await BrowserMultiFormatReader.listVideoInputDevices();
      const backCamera = videoInputDevices.find((device) =>
        device.label.toLowerCase().includes('back')
      ) || videoInputDevices[0];

      if (!backCamera) {
        return resolve({ success: false, message: 'No camera available' });
      }

      const videoElement = document.createElement('video');
      videoElement.style.position = 'fixed';
      videoElement.style.top = '50%';
      videoElement.style.left = '50%';
      videoElement.style.transform = 'translate(-50%, -50%)';
      videoElement.style.width = '100vw';
      videoElement.style.height = '100vh';
      videoElement.style.zIndex = 10000;
      videoElement.style.objectFit = 'cover';
      videoElement.style.backgroundColor = '#000';

      document.body.appendChild(videoElement);

      const result = await codeReader.decodeOnceFromVideoDevice(backCamera.deviceId, videoElement);

      codeReader.reset();
      document.body.removeChild(videoElement);

      if (result?.text) {
        return resolve({ success: true, code: result.text });
      } else {
        return resolve({ success: false, message: 'No barcode detected' });
      }
    } catch (err) {
      console.error('[launchBarcodeScanner] Error:', err.message);
      return resolve({ success: false, message: err.message });
    }
  });
}
