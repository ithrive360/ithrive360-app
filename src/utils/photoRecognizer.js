/**
 * Simulates meal photo recognition using a mock GPT response.
 * 
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
