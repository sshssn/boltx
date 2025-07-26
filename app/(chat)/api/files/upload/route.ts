import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/app/(auth)/auth';
import { getDocumentsByUserId } from '@/lib/db/queries';

// Use Blob instead of File since File is not available in Node.js environment
const FileSchema = z.object({
  file: z
    .instanceof(Blob)
    .refine((file) => file.size <= 50 * 1024 * 1024, {
      message: 'File size should be less than 50MB',
    })
    // Support all file types that Gemini can process
    .refine(
      (file) => {
        const allowedTypes = [
          // Images
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
          'image/bmp',
          'image/tiff',
          'image/svg+xml',
          'image/heic',
          'image/heif',
          // Documents
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-powerpoint',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'text/plain',
          'text/csv',
          'text/html',
          'text/markdown',
          'text/xml',
          'application/json',
          'application/xml',
          // Code files
          'text/javascript',
          'text/typescript',
          'text/css',
          'text/scss',
          'text/sass',
          'text/less',
          'text/python',
          'text/java',
          'text/c',
          'text/cpp',
          'text/csharp',
          'text/php',
          'text/ruby',
          'text/go',
          'text/rust',
          'text/swift',
          'text/kotlin',
          'text/scala',
          'text/r',
          'text/matlab',
          'text/sql',
          'text/yaml',
          'text/toml',
          'text/ini',
          'text/bash',
          'text/shell',
          'text/dockerfile',
          'text/makefile',
          // Archives
          'application/zip',
          'application/x-rar-compressed',
          'application/x-7z-compressed',
          'application/x-tar',
          'application/gzip',
          // Audio
          'audio/mpeg',
          'audio/wav',
          'audio/ogg',
          'audio/mp4',
          'audio/aac',
          'audio/flac',
          // Video
          'video/mp4',
          'video/avi',
          'video/mov',
          'video/wmv',
          'video/flv',
          'video/webm',
          'video/mkv',
        ];
        return allowedTypes.includes(file.type);
      },
      {
        message:
          'File type not supported. Please upload images, documents, code files, audio, or video files.',
      },
    ),
});

export async function POST(request: Request) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (request.body === null) {
    return new Response('Request body is empty', { status: 400 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as Blob;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const validatedFile = FileSchema.safeParse({ file });

    if (!validatedFile.success) {
      const errorMessage = validatedFile.error.errors
        .map((error) => error.message)
        .join(', ');

      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    // Get filename from formData since Blob doesn't have name property
    const filename = (formData.get('file') as File).name;
    const fileBuffer = await file.arrayBuffer();

    try {
      const data = await put(`${filename}`, fileBuffer, {
        access: 'public',
      });

      return NextResponse.json(data);
    } catch (error) {
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const documents = await getDocumentsByUserId({
      userId: session.user.id,
      limit: 50,
    });
    return NextResponse.json({ documents });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch attachments' },
      { status: 500 },
    );
  }
}
