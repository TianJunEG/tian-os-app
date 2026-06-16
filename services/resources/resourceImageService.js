import OpenAI from 'openai';
import { putUpload } from '../storage/objectStore.js';

let _client = null;
function getClient() {
  if (!_client) {
    if (!process.env.OPENAI_API_KEY) throw Object.assign(new Error('OPENAI_API_KEY not set'), { status: 503 });
    _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _client;
}

// Build a DALL-E 3 prompt from article metadata. Keeps images on-brand:
// warm educational, friendly illustration style, no text in image.
function buildPrompt({ title, summary, customPrompt }) {
  if (customPrompt) return customPrompt;
  const subject = summary ? `${title}. ${summary}` : title;
  return (
    `Warm, friendly educational illustration for a Singapore primary-school parent article: "${subject}". ` +
    'Flat vector style, soft pastel colours (warm cream, teal, gold accents), minimal background, ' +
    'diverse children and families, no text or letters in the image.'
  );
}

// Generate one DALL-E 3 image and persist it via object storage.
// Returns the fields to push into resource.images[].
export async function generateResourceImage({ title, summary, customPrompt = null, size = '1792x1024' } = {}) {
  const client = getClient();
  const prompt = buildPrompt({ title, summary, customPrompt });

  const response = await client.images.generate({
    model: 'dall-e-3',
    prompt,
    n: 1,
    size,
    response_format: 'b64_json',
    quality: 'standard',
  });

  const b64 = response.data[0]?.b64_json;
  if (!b64) throw new Error('DALL-E returned no image data');

  const buffer = Buffer.from(b64, 'base64');
  const filename = `resource-${Date.now()}.png`;
  const stored = await putUpload({ namespace: 'resource-images', filename, buffer, contentType: 'image/png' });

  return {
    alt: title,
    prompt,
    url: stored.fileUrl,
    storageKey: stored.storageKey,
    storageProvider: stored.storageProvider,
    generatedAt: new Date(),
  };
}

export default { generateResourceImage };
