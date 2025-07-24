import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';
import { google } from '@ai-sdk/google';
import {
  artifactModel,
  chatModel,
  reasoningModel,
  titleModel,
} from './models.test';
import { isTestEnvironment } from '../constants';

function toV2Model(model: any): any {
  return {
    ...model,
    specificationVersion: 'v2',
    supportedUrls: {},
  };
}

export const myProvider = isTestEnvironment
  ? customProvider({
      languageModels: {
        'chat-model': chatModel,
        'chat-model-reasoning': reasoningModel,
        'title-model': titleModel,
        'artifact-model': artifactModel,
      },
    })
  : customProvider({
      languageModels: {
        'chat-model': toV2Model(google('gemini-1.5-flash')),
        'chat-model-reasoning': wrapLanguageModel({
          model: toV2Model(google('gemini-1.5-flash')),
          middleware: extractReasoningMiddleware({ tagName: 'think' }),
        }),
        'title-model': toV2Model(google('gemini-1.5-flash')),
        'artifact-model': toV2Model(google('gemini-1.5-flash')),
      },
    });
