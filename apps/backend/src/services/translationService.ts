import { v2 } from '@google-cloud/translate';
import { db, translations, eq, and } from 'database';
import crypto from 'crypto';
import { logger } from '../config/logger';

const { Translate } = v2;

// Initialize the translation client using the API key from .env
let translate: any;

try {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (apiKey) {
    logger.info(`Initializing Google Translation API client with API Key`);
    translate = new Translate({ key: apiKey });
  } else {
    logger.warn("GOOGLE_PLACES_API_KEY not found in environment variables.");
  }
} catch (error: any) {
  logger.error("Failed to initialize Google Translation API client", { error: error.message });
}

const generateHash = (text: string) => {
  return crypto.createHash('sha256').update(text).digest('hex');
};

export const translateText = async (text: string, targetLanguage: string): Promise<string> => {
  if (!text || text.trim() === '') return text;
  if (!targetLanguage || targetLanguage === 'en') return text; // Assuming base language is 'en'

  const sourceHash = generateHash(text);

  try {
    // 1. Check database cache
    const cached = await db.query.translations.findFirst({
      where: and(
        eq(translations.sourceHash, sourceHash),
        eq(translations.targetLang, targetLanguage)
      ),
    });

    if (cached) {
      logger.debug(`[Translate Cache Hit] ${targetLanguage}`);
      return cached.translatedText;
    }

    if (!translate) {
       logger.warn("Translation API not initialized. Returning original text.");
       return text;
    }

    // 2. Call Google Cloud Translation API
    logger.info(`[Translate API Call] Target: ${targetLanguage}, Hash: ${sourceHash}`);
    const [translation] = await translate.translate(text, targetLanguage);

    // 3. Save to database cache
    await db.insert(translations).values({
      sourceHash,
      sourceText: text,
      targetLang: targetLanguage,
      translatedText: translation
    }).onConflictDoNothing(); // Prevent race conditions where same text is translated twice concurrently

    return translation;
  } catch (error: any) {
    logger.error(`Translation error: ${error.message}`, { 
      stack: error.stack,
      text, 
      targetLanguage 
    });
    // Fallback to original text on error
    return text;
  }
};

export const translateTextsBatch = async (texts: string[], targetLanguage: string): Promise<string[]> => {
  if (!texts || texts.length === 0) return [];
  if (!targetLanguage || targetLanguage === 'en') return texts;

  // Optimize by checking cache inside a transaction or in parallel, 
  // but for simplicity we will resolve them concurrently.
  // The GCP translate API does support batch translating but we only want to translate missing ones.
  const results = await Promise.all(texts.map(t => translateText(t, targetLanguage)));
  return results;
};
