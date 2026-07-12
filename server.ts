import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

// Increase request size limits to handle base64 image uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Lazy initialize Gemini client to prevent crashing on startup if key is missing
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY environment variable is not defined.');
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// AI Analysis route using server-side Gemini SDK
app.post('/api/analyze-image', async (req, res) => {
  try {
    const { base64Image, mimeType } = req.body;

    if (!base64Image || !mimeType) {
      res.status(400).json({ error: 'Missing base64Image or mimeType in request body.' });
      return;
    }

    // Initialize/verify client
    const ai = getGeminiClient();

    // Prepare image and text parts as defined in gemini-api guidelines
    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: mimeType,
      },
    };

    const textPart = {
      text: `Analyze this image in detail and produce a structured JSON report.
Determine:
1. A beautiful, engaging caption.
2. A concise accessibility alt-text.
3. 4 to 6 descriptive search tags.
4. A professional analysis of its visual composition, lighting, focus, and overall mood (1-2 sentences).
5. Ideal color/exposure adjustment settings to "auto-enhance" or bring out the best in the image, specifying numeric values.
   - brightness: offset from -50 to 50
   - contrast: offset from -50 to 50
   - saturation: offset from -50 to 50
   - temperature: offset from -50 to 50 (warm/cool)
   - tint: offset from -50 to 50
   - sharpness: level from 0 to 50
Provide these values as offsets that can be directly applied as filters.`,
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            caption: { type: Type.STRING, description: 'A beautifully written engaging description of the image content' },
            altText: { type: Type.STRING, description: 'An accessibility-compliant alt-text for screen readers' },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'An array of 4-6 relevant descriptive keywords or tags',
            },
            compositionText: { type: Type.STRING, description: 'Professional short analysis of the image lighting, composition, and mood' },
            adjustments: {
              type: Type.OBJECT,
              properties: {
                brightness: { type: Type.NUMBER, description: 'Recommended brightness offset, from -50 to 50' },
                contrast: { type: Type.NUMBER, description: 'Recommended contrast offset, from -50 to 50' },
                saturation: { type: Type.NUMBER, description: 'Recommended saturation offset, from -50 to 50' },
                temperature: { type: Type.NUMBER, description: 'Recommended color temperature offset, from -50 to 50 (negative is cooler, positive is warmer)' },
                tint: { type: Type.NUMBER, description: 'Recommended tint offset, from -50 to 50' },
                sharpness: { type: Type.NUMBER, description: 'Recommended sharpness level, from 0 to 50' },
              },
              required: ['brightness', 'contrast', 'saturation', 'temperature', 'tint', 'sharpness'],
            },
          },
          required: ['caption', 'altText', 'tags', 'compositionText', 'adjustments'],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error('No text content returned from Gemini.');
    }

    const result = JSON.parse(text.trim());
    res.json(result);
  } catch (error: any) {
    console.error('Error analyzing image:', error);
    res.status(500).json({
      error: 'Failed to analyze image with Gemini.',
      details: error.message || error,
    });
  }
});

// Configure Vite middleware or static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
