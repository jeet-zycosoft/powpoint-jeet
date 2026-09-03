'use client';

import LocalIntlProvider, { GlobalLanguageProvider } from '@/app/LocalIntlProvider';
import { useEffect, useState } from 'react';

import commonBase from '@/components/intl.yaml';
import commonEn from '@/components/translations/en.yaml';
import commonEs from '@/components/translations/es.yaml';
import commonFr from '@/components/translations/fr.yaml';

const messages = {
    ...commonBase,
    en: { ...commonBase, ...commonEn },
    es: { ...commonBase, ...commonEs },
    fr: { ...commonBase, ...commonFr },
};

export default function I18nProvider({ children }) {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    if (!isClient) {
        return null;
    }

    return (
        <GlobalLanguageProvider>
            <LocalIntlProvider messages={messages}>{children}</LocalIntlProvider>
        </GlobalLanguageProvider>
    );
}
