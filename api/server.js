import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { OpenAI } from 'openai';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Initialize OpenAI with mock functionality if API key is missing
let openai;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.warn('Missing OPENAI_API_KEY environment variable. Using mock analysis.');
  
  // Mock OpenAI functionality
  openai = {
    chat: {
      completions: {
        create: async () => ({
          choices: [{
            message: {
              content: JSON.stringify({
                name: "Sample Item",
                description: "This is a sample item description generated because no OpenAI API key was provided.",
                tags: ["sample", "mock", "demo"]
              })
            }
          }]
        })
      }
    }
  };
} else {
  openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
    timeout: 60000,
    maxRetries: 3
  });
}

app.use(cors());
app.use(express.json());

app.post('/api/analyze-image', async (req, res) => {
  try {
    const { imageUrl } = req.body;
    
    if (!imageUrl || typeof imageUrl !== 'string') {
      throw new Error('Invalid image URL provided');
    }

    // Decode the URL if it's already encoded
    const decodedUrl = decodeURIComponent(imageUrl);

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            { 
              type: "text", 
              text: "Describe this found item in JSON format with fields: name (short title), description (characteristics and condition), tags (2-3 keywords)" 
            },
            {
              type: "image_url",
              image_url: {
                url: decodedUrl
              }
            }
          ]
        }
      ],
      max_tokens: 500,
      response_format: { type: "json_object" }
    });
    
    const analysis = JSON.parse(response.choices[0].message.content);
    
    const formattedAnalysis = {
      name: analysis.name || '',
      description: analysis.description || '',
      tags: Array.isArray(analysis.tags) ? analysis.tags : []
    };
    
    res.json(formattedAnalysis);
  } catch (error) {
    console.error('Error analyzing image:', error);
    
    let errorMessage = 'Failed to analyze image';
    let statusCode = 500;
    
    if (error.code === 'ECONNRESET' || error.type === 'system') {
      errorMessage = 'Connection error. Please try again.';
    } else if (error.status === 429) {
      errorMessage = 'Too many requests. Please try again later.';
      statusCode = 429;
    }
    
    res.status(statusCode).json({ 
      error: errorMessage,
      details: error.message 
    });
  }
});

app.listen(port, () => {
  console.log(`API server running on port ${port}`);
  if (!OPENAI_API_KEY) {
    console.log('Running in mock mode - no OpenAI API key provided');
  }
});