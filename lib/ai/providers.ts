import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';
import { openai } from '@ai-sdk/openai';
import {
  artifactModel,
  chatModel,
  reasoningModel,
  titleModel,
} from './models.test';
import { isTestEnvironment } from '../constants';

export const myProvider = isTestEnvironment
  ? customProvider({
      languageModels: {
        'gpt-5.1': chatModel,
        'gpt-5.2': chatModel,
        'title-model': titleModel,
        'artifact-model': artifactModel,
      },
    })
  : customProvider({
      languageModels: {
        'gpt-5.1': openai('gpt-5.1') as any,
        'gpt-5.2': openai('gpt-5.2') as any,
        'title-model': openai('gpt-5.1') as any,
        'artifact-model': openai('gpt-5.1') as any,
      },
    });
