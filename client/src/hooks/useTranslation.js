import { useState, useEffect, useCallback } from 'react';
import translationService from '../services/translationService';
import useChatStore from '../store/chatStore';
import toast from 'react-hot-toast';

export const useTranslation = () => {
  const { currentLanguage, setLanguage } = useChatStore();
  const [isTranslating, setIsTranslating] = useState(false);

  // Translate text
  const translateText = useCallback(async (text, targetLang = null, sourceLang = 'auto') => {
    if (!text || !text.trim()) return text;

    const target = targetLang || currentLanguage;

    // If target is English and source is auto, don't translate
    if (target === 'en' && sourceLang === 'auto') {
      return text;
    }

    try {
      setIsTranslating(true);
      const translatedText = await translationService.translateText(text, target, sourceLang);
      return translatedText;
    } catch (error) {
      console.error('Translation error:', error);
      toast.error(error.message || 'Translation failed');
      return text; // Return original text on error
    } finally {
      setIsTranslating(false);
    }
  }, [currentLanguage]);

  // Translate multiple texts
  const translateBatch = useCallback(async (texts, targetLang = null, sourceLang = 'auto') => {
    const target = targetLang || currentLanguage;

    try {
      setIsTranslating(true);
      const results = await translationService.translateBatch(texts, target, sourceLang);
      return results;
    } catch (error) {
      console.error('Batch translation error:', error);
      toast.error('Batch translation failed');
      return texts.map(text => ({ original: text, translated: text, success: false }));
    } finally {
      setIsTranslating(false);
    }
  }, [currentLanguage]);

  // Toggle between English and Turkish
  const toggleLanguage = useCallback(() => {
    const newLanguage = currentLanguage === 'en' ? 'tr' : 'en';
    setLanguage(newLanguage);
    toast.success(`Language switched to ${newLanguage === 'en' ? 'English' : 'Türkçe'}`);
  }, [currentLanguage, setLanguage]);

  // Get language info
  const getLanguageInfo = useCallback((langCode) => {
    const languages = translationService.getSupportedLanguages();
    return languages.find(lang => lang.code === langCode) || languages[0];
  }, []);

  // Get current language info
  const currentLanguageInfo = getLanguageInfo(currentLanguage);

  return {
    currentLanguage,
    currentLanguageInfo,
    isTranslating,
    translateText,
    translateBatch,
    toggleLanguage,
    setLanguage,
    getLanguageInfo,
    supportedLanguages: translationService.getSupportedLanguages()
  };
};

// Hook for translating static content
export const useStaticTranslation = (texts) => {
  const { currentLanguage, translateText } = useTranslation();
  const [translatedTexts, setTranslatedTexts] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const translateStaticContent = async () => {
      if (currentLanguage === 'en') {
        // If English, use original texts
        setTranslatedTexts(texts);
        return;
      }

      setIsLoading(true);
      const translated = {};

      try {
        // Translate each text
        for (const [key, text] of Object.entries(texts)) {
          if (typeof text === 'string' && text.trim()) {
            translated[key] = await translateText(text, currentLanguage, 'en');
          } else {
            translated[key] = text;
          }
        }
        setTranslatedTexts(translated);
      } catch (error) {
        console.error('Static translation error:', error);
        setTranslatedTexts(texts); // Fallback to original
      } finally {
        setIsLoading(false);
      }
    };

    translateStaticContent();
  }, [currentLanguage, translateText, texts]);

  return {
    texts: translatedTexts,
    isLoading
  };
};

export default useTranslation;