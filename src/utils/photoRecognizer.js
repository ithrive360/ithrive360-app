/**
 * Converts a File object to a Base64 string.
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
}

/**
 * Sends a meal photo to OpenAI's GPT-4o model to parse nutritional data.
 * 
 * @param {File} file - The image file from the camera
 * @returns {Promise<{ success: boolean, label?: string, nutrients_json?: object, raw_json?: object, message?: string }>}
 */
export async function analyzeMealImage(file) {
  try {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      return { success: false, message: 'OpenAI API key is missing. Please check your .env settings.' };
    }

    const base64Image = await fileToBase64(file);

    const payload = {
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert nutritionist algorithm. Analyze the food in the image and return ONLY a valid JSON object matching this structure EXACTLY. No markdown, no conversational text.
{
  "label": "Brief but descriptive name of the meal",
  "nutrients_json": {
    "energy_kcal": number,
    "protein_g": number,
    "fat_g": number,
    "carbohydrates_g": number,
    "fiber_g": number,
    "sugar_g": number,
    "sodium_mg": number,
    "saturated_fat_g": number
  }
}`
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Please estimate the nutritional content of this meal based on standard portion sizes." },
            {
              type: "image_url",
              image_url: {
                url: base64Image,
                detail: "low"
              }
            }
          ]
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 300
    };

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("[analyzeMealImage] API Error:", errorData);
      return { success: false, message: 'Failed to contact the AI analyzer.' };
    }

    const data = await response.json();
    const resultText = data.choices[0].message.content;
    const parsed = JSON.parse(resultText);

    return {
      success: true,
      label: parsed.label || "Unknown Meal",
      nutrients_json: parsed.nutrients_json || {},
      raw_json: parsed
    };

  } catch (err) {
    console.error('[analyzeMealImage] Error:', err.message);
    return { success: false, message: err.message };
  }
}
