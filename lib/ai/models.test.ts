import { MockLanguageModelV3, simulateReadableStream } from 'ai/test';
import { getResponseChunksByPrompt } from '@/tests/prompts/utils';
import type { LanguageModelV3GenerateResult, LanguageModelV3StreamResult } from 'ai';

export const chatModel = new MockLanguageModelV3({
  doGenerate: async () => ({
    finishReason: 'stop',
    usage: { inputTokens: 10, outputTokens: 20 },
    text: 'Hello, world!',
    content: [{ type: 'text', text: 'Hello, world!' }],
    rawCall: { rawPrompt: null, rawSettings: {} },
    warnings: [],
  } as LanguageModelV3GenerateResult),
  doStream: async ({ prompt }) => ({
    stream: simulateReadableStream({
      chunkDelayInMs: 500,
      initialDelayInMs: 1000,
      chunks: getResponseChunksByPrompt(prompt).map(chunk => ({
        ...chunk,
        id: '1',
      } as any)),
    }),
    rawCall: { rawPrompt: null, rawSettings: {} },
  } as LanguageModelV3StreamResult),
});

export const reasoningModel = new MockLanguageModelV3({
  doGenerate: async () => ({
    finishReason: 'stop',
    usage: { inputTokens: 10, outputTokens: 20 },
    text: 'Hello, world!',
    content: [{ type: 'text', text: 'Hello, world!' }],
    rawCall: { rawPrompt: null, rawSettings: {} },
    warnings: [],
  } as LanguageModelV3GenerateResult),
  doStream: async ({ prompt }) => ({
    stream: simulateReadableStream({
      chunkDelayInMs: 500,
      initialDelayInMs: 1000,
      chunks: getResponseChunksByPrompt(prompt, true).map(chunk => ({
        ...chunk,
        id: '1',
      } as any)),
    }),
    rawCall: { rawPrompt: null, rawSettings: {} },
  } as LanguageModelV3StreamResult),
});

export const titleModel = new MockLanguageModelV3({
  doGenerate: async () => ({
    finishReason: 'stop',
    usage: { inputTokens: 3, outputTokens: 10 },
    text: 'This is a test title',
    content: [{ type: 'text', text: 'This is a test title' }],
    rawCall: { rawPrompt: null, rawSettings: {} },
    warnings: [],
  } as LanguageModelV3GenerateResult),
  doStream: async () => ({
    stream: simulateReadableStream({
      chunkDelayInMs: 500,
      initialDelayInMs: 1000,
      chunks: [
        { type: 'text-delta', id: '1', delta: 'This is a test title' },
        {
          type: 'finish',
          finishReason: 'stop',
          usage: { inputTokens: 3, outputTokens: 10 },
        },
      ] as any,
    }),
    rawCall: { rawPrompt: null, rawSettings: {} },
  } as LanguageModelV3StreamResult),
});

export const artifactModel = new MockLanguageModelV3({
  doGenerate: async () => ({
    finishReason: 'stop',
    usage: { inputTokens: 10, outputTokens: 20 },
    text: 'Hello, world!',
    content: [{ type: 'text', text: 'Hello, world!' }],
    rawCall: { rawPrompt: null, rawSettings: {} },
    warnings: [],
  } as LanguageModelV3GenerateResult),
  doStream: async ({ prompt }) => ({
    stream: simulateReadableStream({
      chunkDelayInMs: 50,
      initialDelayInMs: 100,
      chunks: getResponseChunksByPrompt(prompt).map(chunk => ({
        ...chunk,
        id: '1',
      } as any)),
    }),
    rawCall: { rawPrompt: null, rawSettings: {} },
  } as LanguageModelV3StreamResult),
});
