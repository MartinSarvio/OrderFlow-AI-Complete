// api/generate-image.js
// Vercel Serverless Function for Google Gemini Image Generation

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt, style = 'photorealistic', size = '1024x1024' } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
    const API_KEY = process.env.GOOGLE_AI_API_KEY || 'AIzaSyCYzcmitNO40SBaj8QHCqavbijFblM5zmk';

    // Using Gemini 2.0 Flash with image generation capability
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Generate a high-quality ${style} image: ${prompt}.
                     Style: Professional marketing material for a restaurant technology platform.
                     Aspect ratio: ${size === '1920x1080' ? '16:9 widescreen' : '1:1 square'}.
                     Quality: High resolution, suitable for web use.`
            }]
          }],
          generationConfig: {
            responseModalities: ["image", "text"],
            responseMimeType: "text/plain"
          }
        })
      }
    );

    const data = await response.json();

    if (data.error) {
      console.error('Gemini API error:', data.error);
      return res.status(500).json({
        error: data.error.message || 'Failed to generate image',
        details: data.error
      });
    }

    // Check if we got an image response
    if (data.candidates && data.candidates[0]?.content?.parts) {
      const parts = data.candidates[0].content.parts;

      // Look for image data in the response
      const imagePart = parts.find(p => p.inlineData);
      const textPart = parts.find(p => p.text);

      if (imagePart) {
        return res.status(200).json({
          success: true,
          image: {
            data: imagePart.inlineData.data,
            mimeType: imagePart.inlineData.mimeType
          },
          description: textPart?.text || ''
        });
      }
    }

    // If no image was generated, return the text response
    return res.status(200).json({
      success: false,
      message: 'Image generation not available for this prompt',
      textResponse: data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response'
    });

  } catch (error) {
    console.error('Generate image error:', error);
    return res.status(500).json({
      error: 'Failed to generate image',
      message: error.message
    });
  }
}
