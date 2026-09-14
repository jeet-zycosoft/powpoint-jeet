'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { IntlProvider } from 'react-intl';

import commonBase from '@/components/intl.yaml';
import commonEn from '@/components/translations/en.yaml';
import commonEs from '@/components/translations/es.yaml';
import commonFr from '@/components/translations/fr.yaml';

export const LanguageContext = createContext();

export const useLanguage = () => useContext(LanguageContext);

export const GlobalLanguageProvider = ({ children }) => {
    // Prefer cookie (set by middleware / language switch), then localStorage.
    const [locale, setLocale] = useState(() => {
        if (typeof window === 'undefined') return 'en';
        const cookieMatch = document.cookie.match(/(?:^|;\s*)language=(en|es|fr)(?:;|$)/);
        if (cookieMatch?.[1]) return cookieMatch[1];
        const saved = window.localStorage.getItem('language');
        return saved === 'en' || saved === 'es' || saved === 'fr' ? saved : 'en';
    });

    useEffect(() => {
        document.documentElement.lang = locale;
    }, [locale]);

    const changeLanguage = (newLocale) => {
        if (newLocale !== 'en' && newLocale !== 'es' && newLocale !== 'fr') return;
        setLocale(newLocale);
        window.localStorage.setItem('language', newLocale);
        document.cookie = `language=${newLocale};path=/;max-age=31536000;SameSite=Lax`;
        document.documentElement.lang = newLocale;
    };

    // Keep cookie in sync
    useEffect(() => {
        document.cookie = `language=${locale};path=/;max-age=31536000;SameSite=Lax`;
        window.localStorage.setItem('language', locale);
    }, [locale]);

    return (
        <LanguageContext.Provider value={{ locale, changeLanguage, setLocale }}>
            {children}
        </LanguageContext.Provider>
    );
};

function flattenMessages(nestedMessages, prefix = '') {
    if (!nestedMessages || typeof nestedMessages !== 'object') return {};
    return Object.keys(nestedMessages).reduce((messages, key) => {
        let value = nestedMessages[key];
        let prefixedKey = prefix ? `${prefix}.${key}` : key;

        if (typeof value === 'object' && value !== null) {
            Object.assign(messages, flattenMessages(value, prefixedKey));
        } else if (value != null) {
            messages[prefixedKey] = value;
        }

        return messages;
    }, {});
}

const commonMessages = {
    en: { ...commonBase, ...commonEn },
    es: { ...commonBase, ...commonEs },
    fr: { ...commonBase, ...commonFr },
};

export default function LocalIntlProvider({ messages = {}, children }) {
    const { locale } = useLanguage();

    const common = flattenMessages(commonMessages[locale] || commonMessages.en);
    const routeMessages = flattenMessages(messages[locale] || messages['en'] || messages || {});

    // Route-specific keys override shared component defaults
    const currentMessages = { ...common, ...routeMessages };

    return (
        <IntlProvider key={locale} locale={locale} messages={currentMessages}>
            {children}
        </IntlProvider>
    );
}
