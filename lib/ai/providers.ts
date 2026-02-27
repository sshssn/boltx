import {
  customProvider,
} from 'ai';
import { openai } from '@ai-sdk/openai';
import { deepseek } from '@ai-sdk/deepseek';
import {
  artifactModel,
  chatModel,
  titleModel,
} from './models.test';
import { isTestEnvironment } from '../constants';

export const myProvider = isTestEnvironment
  ? customProvider({
      languageModels: {
        'gpt-5.1': chatModel,
        'gpt-5.2': chatModel,
        'deepseek/deepseek-r1-0528:free': chatModel,
        'title-model': titleModel,
        'artifact-model': artifactModel,
      },
    })
  : customProvider({
      languageModels: {
        'gpt-5.1': openai('gpt-5.1') as any,
        'gpt-5.2': openai('gpt-5.2') as any,
        'deepseek/deepseek-r1-0528:free': deepseek('deepseek-r1') as any, // Mapping to available deepseek model
        'title-model': openai('gpt-5.1') as any,
        'artifact-model': openai('gpt-5.1') as any,
      },
    });
