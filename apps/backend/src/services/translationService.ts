import { db, translations, eq, and } from 'database';
import crypto from 'crypto';
import { logger } from '../config/logger';

const SARVAM_API_KEY = 'sk_xgv8lo53_tCfbBGkgm14KLbYnDoGZucPi';
const SARVAM_API_URL = 'https://api.sarvam.ai/translate';

const MANUAL_DICTIONARY: Record<string, Record<string, string>> = {
  'hi': {
    'Open Now': 'अभी खुला है',
    'Closed': 'बंद है',
    'Open': 'खुला है',
    'Shop Closed': 'दुकान बंद है',
    'Shop Open': 'दुकान खुली है',
    'Add to Wishlist': 'विशलिस्ट में जोड़ें',
    'In Wishlist': 'विशलिस्ट में',
    'Call': 'कॉल करें',
    'Call Now': 'अभी कॉल करें',
    'WhatsApp': 'व्हाट्सएप',
    'Email': 'ईमेल',
    'Directions': 'दिशा-निर्देश',
    'Verified': 'सत्यापित',
    'Contact Details': 'संपर्क विवरण',
    'Address': 'पता',
    'Phone': 'फ़ोन',
    'Business Hours': 'व्यापार के घंटे',
    'Reviews': 'समीक्षाएं',
    'reviews': 'समीक्षाएं',
    'Write a Review': 'समीक्षा लिखें',
    'Visit Website': 'वेबसाइट पर जाएं',
    'Website': 'वेबसाइट',
    'Gallery': 'गैलरी',
    'Featured Products': 'विशेष उत्पाद',
    'Items': 'वस्तुएं',
    'Search stores...': 'दुकानें खोजें...',
    'Popular Places in Vadodara': 'वड़ोदरा में लोकप्रिय स्थान',
    'Consumer': 'उपभोक्ता',
    'Vendor': 'विक्रेता',
    'Admin': 'एडमिन',
    'Request Contact Card': 'संपर्क कार्ड के लिए अनुरोध करें',
    'Pricing': 'कीमत',
    'Settings': 'सेटिंग्स',
    'Vendor Dashboard': 'विक्रेता डैशबोर्ड',
    'Admin Dashboard': 'एडमिन डैशबोर्ड',
    'Sign Out': 'साइन आउट',
    'Sign In': 'साइन इन',
    'Hello': 'नमस्ते',
    'Welcome Guest': 'स्वागत है अतिथि',
    'Member': 'सदस्य',
    'Sign in to access more': 'अधिक एक्सेस करने के लिए साइन इन करें',
    'Sign In / Register': 'साइन इन / रजिस्टर',
    'Menu': 'मेन्यू',
    'Home': 'होम',
    'Favorites': 'पसंदीदा',
    'Preferences': 'प्राथमिकताएं',
    'Language': 'भाषा',
    'Switch View': 'व्यू बदलें',
    'Consumer Mode': 'उपभोक्ता मोड',
    'Log Out': 'लॉग आउट'
  },
  'gu': {
    'Open Now': 'અત્યારે ખુલ્લું છે',
    'Closed': 'બંધ છે',
    'Open': 'ખુલ્લું છે',
    'Shop Closed': 'દુકાન બંધ છે',
    'Shop Open': 'દુકાન ખુલ્લી છે',
    'Add to Wishlist': 'વિશલિસ્ટમાં ઉમેરો',
    'In Wishlist': 'વિશલિસ્ટમાં',
    'Call': 'કૉલ કરો',
    'Call Now': 'હમણાં કોલ કરો',
    'WhatsApp': 'વોટ્સએપ',
    'Email': 'ઈમેલ',
    'Directions': 'દિશાનિર્દેશો',
    'Verified': 'ચકાસાયેલ',
    'Contact Details': 'સંપર્ક વિગતો',
    'Address': 'સરનામું',
    'Phone': 'ફોન',
    'Business Hours': 'વ્યાપાર કલાકો',
    'Reviews': 'સમીક્ષાઓ',
    'reviews': 'સમીક્ષાઓ',
    'Write a Review': 'સમીક્ષા લખો',
    'Visit Website': 'વેબસાઇટની મુલાકાત લો',
    'Website': 'વેબસાઇટ',
    'Gallery': 'ગેલેરી',
    'Featured Products': 'વિશિષ્ટ ઉત્પાદનો',
    'Items': 'વસ્તુઓ',
    'Search stores...': 'દુકાનો શોધો...',
    'Popular Places in Vadodara': 'વડોદરામાં લોકપ્રિય સ્થળો',
    'Consumer': 'ગ્રાહક',
    'Vendor': 'વિક્રેતા',
    'Admin': 'એડમિન',
    'Request Contact Card': 'સંપર્ક કાર્ડ માટે વિનંતી કરો',
    'Pricing': 'કિંમત',
    'Settings': 'સેટિંગ્સ',
    'Vendor Dashboard': 'વિક્રેતા ડેશબોર્ડ',
    'Admin Dashboard': 'એડમિન ડેશબોર્ડ',
    'Sign Out': 'સાઇન આઉટ',
    'Sign In': 'સાઇન ઇન',
    'Hello': 'નમસ્તે',
    'Welcome Guest': 'સ્વાગત છે અતિથિ',
    'Member': 'સભ્ય',
    'Sign in to access more': 'વધુ ઍક્સેસ કરવા માટે સાઇન ઇન કરો',
    'Sign In / Register': 'સાઇન ઇન / રજીસ્ટર',
    'Menu': 'મેનુ',
    'Home': 'હોમ',
    'Favorites': 'મનપસંદ',
    'Preferences': 'પસંદગીઓ',
    'Language': 'ભાષા',
    'Switch View': 'વ્યુ બદલો',
    'Consumer Mode': 'ગ્રાહક મોડ',
    'Log Out': 'લોગ આઉટ'
  }
};

const generateHash = (text: string) => {
  return crypto.createHash('sha256').update(text).digest('hex');
};

const mapLanguageCode = (code: string) => {
  if (code === 'hi') return 'hi-IN';
  if (code === 'gu') return 'gu-IN';
  if (code === 'en') return 'en-IN';
  // Add other mappings if needed, default to appending -IN
  if (code.length === 2) return `${code}-IN`;
  return code;
};

export const translateText = async (text: string, targetLanguage: string): Promise<string> => {
  if (!text || text.trim() === '') return text;
  if (!targetLanguage || targetLanguage === 'en') return text; // Assuming base language is 'en'

  // 0. Check manual dictionary for fixed texts
  const manualTranslation = MANUAL_DICTIONARY[targetLanguage]?.[text];
  if (manualTranslation) {
    logger.debug(`[Translate Manual Hit] ${text} -> ${manualTranslation}`);
    return manualTranslation;
  }

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

    // 2. Call Sarvam Translation API
    logger.info(`[Translate API Call] Target: ${targetLanguage}, Hash: ${sourceHash}`);
    
    const sarvamTargetCode = mapLanguageCode(targetLanguage);
    const sarvamSourceCode = 'en-IN'; // Assuming base language is English
    
    const response = await fetch(SARVAM_API_URL, {
      method: 'POST',
      headers: {
        'api-subscription-key': SARVAM_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input: text,
        source_language_code: sarvamSourceCode,
        target_language_code: sarvamTargetCode
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Sarvam API error! status: ${response.status}, message: ${errorText}`);
    }
    
    const data = await response.json();
    const translation = data.translated_text;
    
    if (!translation) {
       throw new Error(`No translation returned from Sarvam API. Payload: ${JSON.stringify(data)}`);
    }

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

  // The Sarvam translate API might not natively support batch arrays in the same way,
  // so we resolve them concurrently for simplicity.
  const results = await Promise.all(texts.map(t => translateText(t, targetLanguage)));
  return results;
};
