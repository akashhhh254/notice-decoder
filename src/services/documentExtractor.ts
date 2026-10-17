import JSZip from 'jszip';

export interface ExtractedDocument {
  text: string;
  pageOrSlideCount?: number;
  format: 'pptx' | 'pdf' | 'text' | 'image';
  fileName: string;
  warnings?: string[];
}

/**
 * Extracts plain text from a PowerPoint (.pptx) presentation file.
 * Traverses ppt/slides/slide*.xml and extracts all text content inside <a:t> nodes.
 */
export async function extractTextFromPptx(file: File | ArrayBuffer): Promise<ExtractedDocument> {
  const zip = new JSZip();
  let zipData: JSZip;

  try {
    zipData = await zip.loadAsync(file);
  } catch (err: any) {
    throw new Error('Could not parse the PowerPoint file. The file may be corrupted or password-protected.');
  }

  // Find slide XML files (e.g. ppt/slides/slide1.xml, slide2.xml, etc.)
  const slideFileRegex = /^ppt\/slides\/slide(\d+)\.xml$/i;
  const slideEntries: { index: number; name: string }[] = [];

  zipData.forEach((relativePath) => {
    const match = relativePath.match(slideFileRegex);
    if (match) {
      slideEntries.push({
        index: parseInt(match[1], 10),
        name: relativePath,
      });
    }
  });

  if (slideEntries.length === 0) {
    return {
      text: '',
      pageOrSlideCount: 0,
      format: 'pptx',
      fileName: file instanceof File ? file.name : 'presentation.pptx',
      warnings: ['No slides found in this PowerPoint file.'],
    };
  }

  // Sort slides in natural numerical order
  slideEntries.sort((a, b) => a.index - b.index);

  const slideTexts: string[] = [];
  const textNodeRegex = /<a:t(?:\s+[^>]*)?>([\s\S]*?)<\/a:t>/gi;

  for (const entry of slideEntries) {
    const slideXml = await zipData.file(entry.name)?.async('text');
    if (!slideXml) continue;

    const extractedChunks: string[] = [];
    let match: RegExpExecArray | null;

    while ((match = textNodeRegex.exec(slideXml)) !== null) {
      const rawChunk = match[1];
      // Decode standard XML entities
      const decoded = rawChunk
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .trim();
      if (decoded) {
        extractedChunks.push(decoded);
      }
    }

    if (extractedChunks.length > 0) {
      slideTexts.push(`--- Slide ${entry.index} ---\n${extractedChunks.join(' ')}`);
    } else {
      slideTexts.push(`--- Slide ${entry.index} ---\n[Slide contains no extractable text]`);
    }
  }

  const combinedText = slideTexts.join('\n\n').trim();

  // Check if presentation had almost no extractable text (e.g. only image slides)
  const nonHeaderWords = combinedText.replace(/--- Slide \d+ ---/g, '').trim();
  const warnings: string[] = [];

  if (nonHeaderWords.length < 20) {
    warnings.push(
      'This PowerPoint presentation contains little or no extractable text. If the slides contain embedded images or scanned notices, consider uploading them as images.'
    );
  }

  return {
    text: combinedText,
    pageOrSlideCount: slideEntries.length,
    format: 'pptx',
    fileName: file instanceof File ? file.name : 'presentation.pptx',
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Validates whether a file format is supported and returns guidance for unsupported types.
 */
export function validateUploadFile(file: File): { isValid: boolean; error?: string; format?: string } {
  const fileNameLower = file.name.toLowerCase();

  // Legacy .ppt binary check
  if (fileNameLower.endsWith('.ppt') && !fileNameLower.endsWith('.pptx')) {
    return {
      isValid: false,
      error: 'Legacy .ppt files are not supported. Please save or export your presentation as .pptx and upload again.',
    };
  }

  // 10MB size limit
  const maxBytes = 10 * 1024 * 1024;
  if (file.size > maxBytes) {
    return {
      isValid: false,
      error: `File size exceeds the 10MB limit (selected: ${(file.size / (1024 * 1024)).toFixed(1)}MB). Please upload a smaller file.`,
    };
  }

  if (fileNameLower.endsWith('.pptx') || file.type.includes('presentationml')) {
    return { isValid: true, format: 'pptx' };
  }

  if (fileNameLower.endsWith('.pdf') || file.type === 'application/pdf') {
    return { isValid: true, format: 'pdf' };
  }

  if (
    fileNameLower.endsWith('.png') ||
    fileNameLower.endsWith('.jpg') ||
    fileNameLower.endsWith('.jpeg') ||
    fileNameLower.endsWith('.webp') ||
    file.type.startsWith('image/')
  ) {
    return { isValid: true, format: 'image' };
  }

  if (fileNameLower.endsWith('.txt') || file.type.startsWith('text/')) {
    return { isValid: true, format: 'text' };
  }

  return {
    isValid: false,
    error: `Unsupported file format "${file.name}". Supported formats are PDF (.pdf), PowerPoint (.pptx), plain text (.txt), and images (.png, .jpg, .webp).`,
  };
}
