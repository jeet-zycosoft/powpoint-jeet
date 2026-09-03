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
    // Read immediately on client mount (I18nProvider only renders after hydration),
    // so navigating between pages keeps the saved language without flashing to English.
    const [locale, setLocale] = useState(() => {
        if (typeof window === 'undefined') return 'en';
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
        document.documentElement.lang = newLocale;
    };

    return (
        <LanguageContext.Provider value={{ locale, changeLanguage }}>
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
