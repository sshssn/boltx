// lib/cloudflare-ai.ts
export const CLOUDFLARE_CONFIG = {
  accountId: '9da8a2bb48668ff798b91bd00e9ae005',
  apiToken: process.env.CLOUDFLARE_API_TOKEN, // Add this to your .env
  baseUrl: 'https://api.cloudflare.com/client/v4/accounts',
};

export const CLOUDFLARE_MODELS = {
  IMAGE_GENERATION: '@cf/bytedance/stable-diffusion-xl-lightning',
  LLAMA_SCOUT: '@cf/meta/llama-4-scout-17b-16e-instruct',
};

export interface CloudflareAIResponse {
  success: boolean;
  result?: any;
  errors?: Array<{
    code: number;
    message: string;
  }>;
}

export async function runCloudflareAI(
  model: string,
  input: any,
): Promise<CloudflareAIResponse> {
  try {
    const response = await fetch(
      `${CLOUDFLARE_CONFIG.baseUrl}/${CLOUDFLARE_CONFIG.accountId}/ai/run/${model}`,
      {
        headers: {
          Authorization: `Bearer ${CLOUDFLARE_CONFIG.apiToken}`,
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify(input),
      },
    );

    if (!response.ok) {
      throw new Error(
        `Cloudflare AI API error: ${response.status} ${response.statusText}`,
      );
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Cloudflare AI Error:', error);
    throw error;
  }
}
