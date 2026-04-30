'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { apiClient } from '../services/apiClient';

type TranslationContextType = {
  language: string;
  setLanguage: (lang: any) => void;
  t: (text: string) => string;
};

const TranslationContext = createContext<TranslationContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (text: string) => text,
});

export const useTranslation = () => useContext(TranslationContext);

export const TranslationProvider = ({ children }: { children: React.ReactNode }) => {
  const { language, setLanguage } = useAppContext();
  const [dictionary, setDictionary] = useState<Record<string, string>>({});

  
  // A queue for batching translations
  const queueRef = useRef<Set<string>>(new Set());
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);


  const processQueue = useCallback(async () => {
    if (queueRef.current.size === 0 || language === 'en') return;

    const textsToTranslate = Array.from(queueRef.current);
    queueRef.current.clear(); // clear for next batch

    try {
      const response = await apiClient('/api/translate/batch', {
        method: 'POST',
        body: JSON.stringify({ texts: textsToTranslate, targetLanguage: language }),
      });

      if (response.ok) {
        const data = await response.json();
        const newTranslations = data.translations as string[];
        
        setDictionary(prev => {
          const next = { ...prev };
          textsToTranslate.forEach((text, i) => {
            next[`${text}_${language}`] = newTranslations[i];
          });
          return next;
        });
      }
    } catch (error) {
      console.error('Failed to translate batch:', error);
    }
  }, [language]);

  const t = useCallback((text: string) => {
    if (!text || language === 'en') return text;

    const key = `${text}_${language}`;
    if (dictionary[key]) {
      return dictionary[key];
    }

    // Add to queue if not already there and not already translated
    if (!queueRef.current.has(text)) {
      queueRef.current.add(text);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        processQueue();
      }, 100); // 100ms batching window
    }

    return text; // Return original text while loading
  }, [language, dictionary, processQueue]);

  return (
    <TranslationContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </TranslationContext.Provider>
  );
};
