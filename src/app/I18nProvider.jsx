'use client';

import LocalIntlProvider, { GlobalLanguageProvider } from '@/app/LocalIntlProvider';

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

/**
 * IMPORTANT: Do not gate rendering behind a client-mount flag here.
 * This provider wraps the entire app (see root layout). Returning `null`
 * until mounted means the server sends an EMPTY <body> for every page —
 * no SSR/SSG content reaches users with JavaScript disabled or crawlers
 * that don't execute JS. GlobalLanguageProvider already SSR-safely
 * defaults to 'en' on the server and syncs to the real locale on the
 * client, so children can render immediately.
 */
export default function I18nProvider({ children }) {
    return (
        <GlobalLanguageProvider>
            <LocalIntlProvider messages={messages}>{children}</LocalIntlProvider>
        </GlobalLanguageProvider>
    );
}
