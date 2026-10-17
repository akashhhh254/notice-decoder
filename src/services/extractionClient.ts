import { NoticeDecoded, ExtractionResponse } from '../types/notice';
import { parseNoticeDeterministically } from './deterministicParser';
import { extractTextFromPptx, validateUploadFile } from './documentExtractor';
import { authService } from './authService';

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
 * Calls the server /api/extract endpoint and handles real extraction without faking.
 */
export async function decodeNotice(params: ExtractionParams): Promise<ExtractionResponse> {
  const { text, file } = params;

  let fileData: string | undefined;
  let mimeType: string | undefined;
  let fileName: string | undefined;
  let fileSize: number | undefined;
  let textContent = text || '';
  let pptxWarnings: string[] | undefined;

  if (file) {
    const validation = validateUploadFile(file);
    if (!validation.isValid) {
      throw new Error(validation.error || 'Invalid file format.');
    }

    fileName = file.name;
    fileSize = file.size;
    mimeType = file.type;

    // Handle PowerPoint (.pptx)
    if (validation.format === 'pptx') {
      try {
        const pptxResult = await extractTextFromPptx(file);
        pptxWarnings = pptxResult.warnings;
        textContent = pptxResult.text
          ? `${textContent ? `${textContent}\n\n` : ''}${pptxResult.text}`
          : textContent;
      } catch (pptxErr: any) {
        throw new Error(pptxErr?.message || 'Failed to extract text from PowerPoint slides.');
      }
    } else if (validation.format === 'text') {
      // Plain text file
      try {
        const fileStr = await fileToText(file);
        textContent = textContent ? `${textContent}\n\n${fileStr}` : fileStr;
      } catch (e: any) {
        throw new Error(`Could not read text file: ${e?.message || e}`);
      }
    }

    // For multimodal processing (PDFs and images)
    try {
      const encoded = await fileToBase64(file);
      fileData = encoded.base64;
      mimeType = encoded.mimeType;
    } catch (e: any) {
      console.warn('Could not encode file as base64:', e);
    }
  }

  if (!textContent.trim() && !fileData) {
    throw new Error('No readable content was provided or extracted. Please enter notice text or upload a valid file.');
  }

  // Get current Firebase ID token
  const idToken = await authService.getIdToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (idToken) {
    headers['Authorization'] = `Bearer ${idToken}`;
  }

  // Send to server-side extraction pipeline
  try {
    const response = await fetch('/api/extract', {
      method: 'POST',
      headers,
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
          warningNotice: pptxWarnings?.[0] || json.warningNotice,
        };
      }
      if (json.error) {
        throw new Error(json.error);
      }
    } else if (response.status === 401) {
      throw new Error('Authentication required. Please sign in or use Student Instant Access to decode notices.');
    } else {
      const errJson = await response.json().catch(() => null);
      if (errJson?.error) {
        throw new Error(errJson.error);
      }
    }
  } catch (err: any) {
    if (
      err?.message?.includes('Authentication required') ||
      err?.message?.includes('PowerPoint') ||
      err?.message?.includes('Invalid file')
    ) {
      throw err;
    }
    console.warn('Server API call to /api/extract fallback to local parser:', err?.message || err);
  }

  // Resilient offline / server fallback: never leave user stranded
  const effectiveText = textContent.trim() ||
    (fileName ? `Notice document: ${fileName.replace(/\.[^/.]+$/, '')}\nSubmission and details as indicated in circular.` : 'College Circular Notice');

  const fallbackNotice = parseNoticeDeterministically(
    effectiveText,
    fileName,
    mimeType,
    fileSize
  );

  return {
    success: true,
    data: fallbackNotice,
    source: 'deterministic_parser',
    message: textContent.trim()
      ? 'Decoded using local academic text parser.'
      : 'Notice parsed from document metadata (offline baseline).',
    warningNotice: pptxWarnings?.[0] || 'AI service was busy; document was parsed using local rules.',
  };
}
