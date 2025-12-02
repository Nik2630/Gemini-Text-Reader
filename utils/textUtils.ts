import { Sentence } from '../types';

/**
 * Splits a text block into sentences while preserving paragraph structure.
 * It first splits by double newlines to find paragraphs, then splits sentences within.
 */
export const splitIntoSentences = (text: string): Sentence[] => {
  if (!text) return [];
  
  // Split by one or more newlines to identify paragraphs
  // We treat any newline break as a potential paragraph start for visual clarity
  const paragraphs = text.split(/\n+/);
  
  let globalIndex = 0;
  const result: Sentence[] = [];

  paragraphs.forEach((paragraph) => {
    // This regex matches periods, question marks, or exclamation marks 
    // followed by a space or end of line.
    const rawSentences = paragraph.match(/[^.!?]+[.!?]+["']?|[^.!?]+$/g);
    
    if (rawSentences) {
      rawSentences
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
        .forEach((sentenceText, localIndex) => {
          result.push({
            text: sentenceText,
            index: globalIndex,
            // Mark the first sentence of a paragraph (if it's not the very first sentence of the text)
            isParagraphStart: localIndex === 0 && globalIndex > 0
          });
          globalIndex++;
        });
    }
  });
  
  // Fallback if regex found nothing (e.g. single word without punctuation)
  if (result.length === 0 && text.trim().length > 0) {
    return [{ text: text.trim(), index: 0, isParagraphStart: false }];
  }

  return result;
};

export const getContextWindow = (sentences: Sentence[], currentIndex: number) => {
  const prev = currentIndex > 0 ? sentences[currentIndex - 1].text : '';
  const current = sentences[currentIndex].text;
  const next = currentIndex < sentences.length - 1 ? sentences[currentIndex + 1].text : '';
  
  return { prev, current, next };
};