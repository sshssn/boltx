// @ts-nocheck
import { tool, generateImage as ai_generateImage } from 'ai';
import { z } from 'zod';
import { openai } from '@ai-sdk/openai';

export const generateImage = tool({
  description: 'Generate an image from a text prompt using DALL-E 3.',
  parameters: z.object({
    prompt: z.string().describe('The description of the image to generate.'),
    size: z.enum(['1024x1024', '1024x1792', '1792x1024']).optional().default('1024x1024'),
  }),
  execute: async ({ prompt, size }) => {
    try {
      const { image } = await ai_generateImage({
        model: openai.image('dall-e-3'),
        prompt,
        size,
      });

      return {
        url: image.url,
        revisedPrompt: image.revisedPrompt,
      };
    } catch (error) {
      console.error('Image generation error:', error);
      throw new Error('Failed to generate image.');
    }
  },
});
