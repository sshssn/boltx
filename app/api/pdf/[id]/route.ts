import { type NextRequest, NextResponse } from 'next/server';
import { getDocumentById } from '@/lib/db/queries';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const document = await getDocumentById({ id: params.id });
    
    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // For now, we'll return a simple text-based PDF
    // In a real implementation, you'd use a library like puppeteer or jsPDF
    const pdfContent = `
%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
72 720 Td
(${document.title}) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000204 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
297
%%EOF
    `;

    return new NextResponse(pdfContent, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${document.title}.pdf"`,
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
} 