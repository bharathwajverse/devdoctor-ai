import Tesseract from 'tesseract.js';

export interface OcrProgress {
  status: string;
  progress: number;
}

export interface OcrResult {
  text: string;
  confidence: number;
  success: boolean;
  error?: string;
}

/**
 * Extracts visible text from an image data URI or image URL using client-side Tesseract.js.
 * Processing runs in a browser web worker with Zero cloud egress.
 */
export async function extractTextFromImage(
  imageUri: string,
  onProgress?: (progress: OcrProgress) => void
): Promise<OcrResult> {
  if (!imageUri) {
    return { text: '', confidence: 0, success: false, error: 'No image provided' };
  }

  try {
    const response = await Tesseract.recognize(imageUri, 'eng', {
      logger: (m: any) => {
        if (onProgress && m) {
          const progressPct = typeof m.progress === 'number' ? Math.round(m.progress * 100) : 0;
          onProgress({
            status: m.status || 'processing',
            progress: progressPct,
          });
        }
      },
    });

    const rawText = response?.data?.text || '';
    const confidence = response?.data?.confidence || 0;
    const cleanText = rawText
      .split('\n')
      .map((line) => line.trimEnd())
      .join('\n')
      .trim();

    return {
      text: cleanText,
      confidence,
      success: cleanText.length > 0,
    };
  } catch (err: any) {
    return {
      text: '',
      confidence: 0,
      success: false,
      error: err?.message || 'Failed to extract text from image with local OCR',
    };
  }
}
