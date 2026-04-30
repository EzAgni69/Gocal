import express from 'express';
import { translateText, translateTextsBatch } from '../services/translationService';

const router = express.Router();

router.post('/batch', async (req, res) => {
  try {
    const { texts, targetLanguage } = req.body;
    
    if (!texts || !Array.isArray(texts)) {
      return res.status(400).json({ error: 'texts array is required' });
    }
    
    if (!targetLanguage) {
      return res.status(400).json({ error: 'targetLanguage is required' });
    }

    const translatedTexts = await translateTextsBatch(texts, targetLanguage);
    res.json({ translations: translatedTexts });
  } catch (error) {
    console.error('Batch translation error:', error);
    res.status(500).json({ error: 'Failed to translate texts' });
  }
});

router.post('/single', async (req, res) => {
  try {
    const { text, targetLanguage } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'text is required' });
    }
    
    if (!targetLanguage) {
      return res.status(400).json({ error: 'targetLanguage is required' });
    }

    const translatedText = await translateText(text, targetLanguage);
    res.json({ translatedText });
  } catch (error) {
    console.error('Single translation error:', error);
    res.status(500).json({ error: 'Failed to translate text' });
  }
});

export default router;
