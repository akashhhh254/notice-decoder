import { NoticeDecoded, ExtractionResponse } from '../types/notice';
import { parseNoticeDeterministically } from './deterministicParser';

export interface ExtractionParams {
  text?: string;
  file?: File | null;
}

/**
 * Converts a browser File into a base64 string (without the data URL prefix)
 */
export async function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve({ base64, mimeType: file.type || 'application/octet-stream' });
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Reads a text file directly
 */
export async function fileToText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsText(file);
  });
}

/**
 * Primary Extraction Client
 * Calls the server /api/extract endpoint and falls back gracefully to client deterministic parser if needed.
 */
export async function decodeNotice(params: ExtractionParams): Promise<ExtractionResponse> {
  const { text, file } = params;

  let fileData: string | undefined;
  let mimeType: string | undefined;
  let fileName: string | undefined;
  let fileSize: number | undefined;
  let textContent = text || '';

  if (file) {
    fileName = file.name;
    fileSize = file.size;
    mimeType = file.type;

    // If it's a plain text or markdown file, read as text directly
    if (file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
      try {
        const fileStr = await fileToText(file);
        textContent = textContent ? `${textContent}\n\n${fileStr}` : fileStr;
      } catch (e) {
        console.warn('Could not read file as text directly, using binary:', e);
      }
    }

    try {
      const encoded = await fileToBase64(file);
      fileData = encoded.base64;
      mimeType = encoded.mimeType;
    } catch (e) {
      console.warn('Error encoding file to base64:', e);
    }
  }

  // Attempt server-side extraction
  try {
    const response = await fetch('/api/extract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: textContent,
        fileData,
        mimeType,
        fileName,
        fileSize,
      }),
    });

    if (response.ok) {
      const json = await response.json();
      if (json.success && json.data) {
        return {
          success: true,
          data: json.data as NoticeDecoded,
          source: json.source || 'gemini_multimodal',
          message: json.message,
          warningNotice: json.warningNotice,
        };
      }
    }
  } catch (err) {
    console.warn('Server API call to /api/extract was unreachable, falling back to local engine:', err);
  }

  // Graceful client-side fallback if server is unreachable
  const fallbackNotice = parseNoticeDeterministically(
    textContent || (fileName ? `Notice document: ${fileName}` : 'College Circular'),
    fileName,
    mimeType,
    fileSize
  );

  return {
    success: true,
    data: fallbackNotice,
    source: 'deterministic_parser',
    message: 'Decoded using client-side deterministic parser.',
    warningNotice: 'Decoded with offline deterministic parser. Check uncertainties before confirming.',
  };
}
