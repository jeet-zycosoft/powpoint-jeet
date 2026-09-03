import ThankYouView from '@/views/common/ThankYouView';
import LocalIntlProvider from '@/app/LocalIntlProvider';

import baseMessages from './intl.yaml';
import en from './translations/en.yaml';
import es from './translations/es.yaml';
import fr from './translations/fr.yaml';

const messages = {
    ...baseMessages,
    en: { ...baseMessages?.en, ...en },
    es: { ...baseMessages?.es, ...es },
    fr: { ...baseMessages?.fr, ...fr },
};

export const metadata = {
    title: 'Thank You | PawPoint',
    description: 'Thank you for reaching out to PawPoint. We have received your message.',
};

export default function ThankYouPage() {
    return (
        <LocalIntlProvider messages={messages}>
            <main>
                <ThankYouView />
            </main>
        </LocalIntlProvider>
    );
}
