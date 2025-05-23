/**
 * Simulates meal photo recognition using a mock GPT response.
 * This function is kept for now but new camera functionalities are below.
 * @returns {Promise<{ success: boolean, label: string, nutrients_json: object, raw_json: object, imageUrl: string }>}
 */
export async function launchPhotoRecognizer() {
  return new Promise((resolve) => {
    // Simulate user taking a photo (real version would use input type="file")
    const mockImage = 'https://source.unsplash.com/800x600/?salad'; // placeholder image

    // Simulated GPT response
    const mock = {
      label: 'Grilled salmon salad with avocado and quinoa',
      nutrients_json: {
        energy_kcal: 520,
        protein_g: 32,
        fat_g: 28,
        carbohydrates_g: 35,
        fiber_g: 7,
        sugar_g: 4,
        sodium_mg: 360
      },
      raw_json: {
        gpt_response: "Detected: Grilled salmon salad. Estimated nutrients: 520 kcal, 32g protein, 28g fat, 35g carbs."
      }
    };

    setTimeout(() => {
      resolve({
        success: true,
        ...mock,
        imageUrl: mockImage
      });
    }, 1000); // Simulate brief delay
  });
}

/**
 * Starts the camera and streams the video to the provided video element.
 * @param {HTMLVideoElement} videoElement The video element to display the stream.
 * @returns {Promise<MediaStream | null>} A promise that resolves with the MediaStream object or null if an error occurs.
 */
export async function startCamera(videoElement) {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    console.error('getUserMedia is not supported in this browser.');
    alert('Camera access is not supported by your browser.');
    return null;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    if (videoElement) {
      videoElement.srcObject = stream;
      videoElement.play(); // Ensure video plays
    }
    return stream;
  } catch (err) {
    console.error('Error accessing the camera:', err);
    if (err.name === 'NotAllowedError') {
      alert('Camera permission was denied. Please enable camera access in your browser settings.');
    } else if (err.name === 'NotFoundError') {
      alert('No camera was found. Please ensure a camera is connected and enabled.');
    } else {
      alert(`An error occurred while accessing the camera: ${err.name}`);
    }
    return null;
  }
}

/**
 * Captures a photo from the video stream displayed on the video element.
 * @param {HTMLVideoElement} videoElement The video element displaying the camera stream.
 * @returns {string | null} The captured image as a data URL (PNG format) or null if an error occurs.
 */
export function capturePhoto(videoElement) {
  if (!videoElement || !videoElement.srcObject) {
    console.error('Video element is not available or not streaming.');
    alert('Camera stream is not available to capture a photo.');
    return null;
  }

  try {
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const context = canvas.getContext('2d');
    if (!context) {
        console.error('Could not get 2D context from canvas.');
        alert('Could not capture photo. Canvas context is not available.');
        return null;
    }
    context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/png');
  } catch (err) {
    console.error('Error capturing photo:', err);
    alert('An error occurred while capturing the photo.');
    return null;
  }
}

/**
 * Stops the camera stream and clears the video element's source.
 * @param {MediaStream} stream The MediaStream object to stop.
 * @param {HTMLVideoElement} [videoElement] The video element to clear (optional).
 */
export function stopCamera(stream, videoElement) {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }
  if (videoElement) {
    videoElement.srcObject = null;
  }
  console.log('Camera stopped.');
}
