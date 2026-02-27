// @ts-nocheck
import { myProvider } from '@/lib/ai/providers';
import { createDocumentHandler } from '@/lib/artifacts/server';
import { generateImage as experimental_generateImage } from 'ai';

// Create a V2-compatible wrapper for the image model
const createV2CompatibleImageModel = (v1Model: any) => ({
  ...v1Model,
  specificationVersion: 'v2' as const,
  supportedUrls: { '*': [/.*/] },
  maxImagesPerCall: 1,
});

export const imageDocumentHandler = createDocumentHandler<'image'>({
  kind: 'image',
  onCreateDocument: async ({ title, dataStream }) => {
    let draftContent = '';

    const { image } = await experimental_generateImage({
      model: createV2CompatibleImageModel(
        myProvider.imageModel('gemini-1.5-pro'),
      ),
      prompt: title,
      n: 1,
    });

    draftContent = image.base64;

    dataStream.write({
      type: 'data-imageDelta',
      data: image.base64,
      transient: true,
    });

    return draftContent;
  },
  onUpdateDocument: async ({ description, dataStream }) => {
    let draftContent = '';

    const { image } = await experimental_generateImage({
      model: createV2CompatibleImageModel(
        myProvider.imageModel('gemini-1.5-pro'),
      ),
      prompt: description,
      n: 1,
    });

    draftContent = image.base64;

    dataStream.write({
      type: 'data-imageDelta',
      data: image.base64,
      transient: true,
    });

    return draftContent;
  },
});
