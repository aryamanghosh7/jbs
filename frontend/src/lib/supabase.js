import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

export const bge3ApiKey = process.env.REACT_APP_NVIDIA_BGE3_API_KEY;
export const mistralApiKey = process.env.REACT_APP_NVIDIA_MISTRAL_API_KEY;

// BGE-3 model endpoint
export const BGE3_ENDPOINT = 'https://integrate.api.nvidia.com/v1/embeddings';
export const BGE3_MODEL = 'nvidia/nv-embedqa-e5-v5';

// Mistral endpoint
export const MISTRAL_ENDPOINT = 'https://integrate.api.nvidia.com/v1/chat/completions';
export const MISTRAL_MODEL = 'mistralai/mistral-small';

// Helper function to generate embeddings
export async function generateEmbedding(text) {
  try {
    const response = await fetch(BGE3_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${bge3ApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input: [text.substring(0, 8000)],
        model: BGE3_MODEL,
        input_type: 'query',
        encoding_format: 'float',
        truncate: 'END'
      })
    });

    if (!response.ok) {
      throw new Error('Failed to generate embedding');
    }

    const data = await response.json();
    return data.data[0].embedding;
  } catch (error) {
    console.error('Embedding error:', error);
    return null;
  }
}

// Helper function to calculate cosine similarity
export function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Helper function to generate AI insights
export async function generateInsights(prompt) {
  try {
    const response = await fetch(MISTRAL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mistralApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: MISTRAL_MODEL,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 200,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      throw new Error('Failed to generate insights');
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Insights error:', error);
    return null;
  }
}
