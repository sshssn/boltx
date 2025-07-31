import { Artifact } from '@/components/create-artifact';
import { DocumentSkeleton } from '@/components/document-skeleton';
import {
  DownloadIcon,
  CopyIcon,
  RedoIcon,
  UndoIcon,
} from '@/components/icons';
import { toast } from 'sonner';

interface PDFArtifactMetadata {
  pdfUrl?: string;
  fileName?: string;
}

export const pdfArtifact = new Artifact<'pdf', PDFArtifactMetadata>({
  kind: 'pdf',
  description: 'Useful for creating and viewing PDF documents.',
  initialize: async ({ setMetadata }) => {
    setMetadata({
      pdfUrl: undefined,
      fileName: 'document.pdf',
    });
  },
  onStreamPart: ({ streamPart, setMetadata, setArtifact }) => {
    if (streamPart.type === 'data-pdfDelta') {
      setArtifact((draftArtifact) => {
        return {
          ...draftArtifact,
          content: draftArtifact.content + streamPart.data,
          isVisible: true,
          status: 'streaming',
        };
      });
    }

    if (streamPart.type === 'data-pdfUrl') {
      setMetadata((metadata) => ({
        ...metadata,
        pdfUrl: streamPart.data.url,
        fileName: streamPart.data.fileName || 'document.pdf',
      }));
    }
  },
  content: ({
    mode,
    status,
    content,
    isCurrentVersion,
    currentVersionIndex,
    onSaveContent,
    getDocumentContentById,
    isLoading,
    metadata,
  }) => {
    if (isLoading) {
      return <DocumentSkeleton artifactKind="pdf" />;
    }

    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
        <div className="text-center max-w-md">
          <div className="mb-6">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-600 dark:text-red-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              PDF Document
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              {metadata?.pdfUrl
                ? 'Your PDF document is ready for download.'
                : 'PDF content is being generated...'}
            </p>
          </div>

          {metadata?.pdfUrl && (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = metadata.pdfUrl || '';
                  link.download = metadata.fileName || 'document.pdf';
                  link.click();
                  toast.success('PDF download started!');
                }}
                className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
              >
                <DownloadIcon className="w-4 h-4 mr-2" />
                Download PDF
              </button>
              
              <div className="text-xs text-gray-500 dark:text-gray-400">
                File: {metadata.fileName || 'document.pdf'}
              </div>
            </div>
          )}

          {!metadata?.pdfUrl && status === 'streaming' && (
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600" />
              <span>Generating PDF...</span>
            </div>
          )}
        </div>
      </div>
    );
  },
  actions: [
    {
      icon: <UndoIcon size={18} />,
      description: 'View Previous version',
      onClick: ({ handleVersionChange }) => {
        handleVersionChange('prev');
      },
      isDisabled: ({ currentVersionIndex }) => {
        if (currentVersionIndex === 0) {
          return true;
        }
        return false;
      },
    },
    {
      icon: <RedoIcon size={18} />,
      description: 'View Next version',
      onClick: ({ handleVersionChange }) => {
        handleVersionChange('next');
      },
      isDisabled: ({ isCurrentVersion }) => {
        if (isCurrentVersion) {
          return true;
        }
        return false;
      },
    },
    {
      icon: <CopyIcon size={18} />,
      description: 'Copy content',
      onClick: ({ content }) => {
        navigator.clipboard.writeText(content);
        toast.success('Content copied to clipboard!');
      },
    },
  ],
  toolbar: [
    {
      icon: <DownloadIcon />,
      description: 'Download PDF',
      onClick: ({ metadata }) => {
        if (metadata?.pdfUrl) {
          const link = document.createElement('a');
          link.href = metadata.pdfUrl;
          link.download = metadata.fileName || 'document.pdf';
          link.click();
          toast.success('PDF download started!');
        } else {
          toast.error('PDF not ready yet');
        }
      },
    },
  ],
}); 