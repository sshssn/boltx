'use server';

import { put } from '@vercel/blob';
import { createDocumentHandler } from '@/lib/artifacts/server';
import type { UIMessageStreamWriter } from 'ai';
import type { ChatMessage } from '@/lib/types';
import type { Session } from 'next-auth';

export const pdfDocumentHandler = createDocumentHandler({
  kind: 'pdf',
  onCreateDocument: async ({
    id,
    title,
    dataStream,
    session,
  }: {
    id: string;
    title: string;
    dataStream: UIMessageStreamWriter<ChatMessage>;
    session: Session;
  }) => {
    // For PDF creation, we'll generate content that can be converted to PDF
    const pdfContent = `# ${title}\n\nPDF content will be generated here.`;

    // Write the initial content
    dataStream.write({
      type: 'data-pdfDelta',
      data: pdfContent,
    });

    // Generate PDF and upload to Vercel Blob Storage
    setTimeout(async () => {
      try {
        // Create a simple PDF content (in real implementation, use a proper PDF library)
        const pdfBlob = new Blob([pdfContent], { type: 'application/pdf' });

        // Upload to Vercel Blob Storage
        const { url } = await put(
          `${title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
          pdfBlob,
          {
            access: 'public',
          },
        );

        dataStream.write({
          type: 'data-pdfUrl',
          data: {
            url: url,
            fileName: `${title}.pdf`,
          },
        });
      } catch (error) {
        console.error('Failed to upload PDF to blob storage:', error);
        // Fallback to local API
        dataStream.write({
          type: 'data-pdfUrl',
          data: {
            url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/pdf/${id}`,
            fileName: `${title}.pdf`,
          },
        });
      }
    }, 2000);

    return pdfContent;
  },
  onUpdateDocument: async ({
    document,
    description,
    dataStream,
    session,
  }: {
    document: any;
    description: string;
    dataStream: UIMessageStreamWriter<ChatMessage>;
    session: Session;
  }) => {
    // Update PDF content based on description
    const updatedContent = `${document.content}\n\n${description}`;

    dataStream.write({
      type: 'data-pdfDelta',
      data: updatedContent,
    });

    // Update PDF and upload to Vercel Blob Storage
    try {
      // Create updated PDF content
      const pdfBlob = new Blob([updatedContent], { type: 'application/pdf' });

      // Upload to Vercel Blob Storage
      const { url } = await put(
        `${document.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
        pdfBlob,
        {
          access: 'public',
        },
      );

      dataStream.write({
        type: 'data-pdfUrl',
        data: {
          url: url,
          fileName: `${document.title}.pdf`,
        },
      });
    } catch (error) {
      console.error('Failed to upload PDF to blob storage:', error);
      // Fallback to local API
      dataStream.write({
        type: 'data-pdfUrl',
        data: {
          url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/pdf/${document.id}`,
          fileName: `${document.title}.pdf`,
        },
      });
    }

    return updatedContent;
  },
});
