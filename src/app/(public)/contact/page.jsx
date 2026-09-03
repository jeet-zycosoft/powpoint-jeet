import ContactSection from '@/views/common/ContactSection';
import LocalIntlProvider from '@/app/LocalIntlProvider';

// Language translations
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
    title: 'Contact Us | PawPoint',
    description: 'Get in touch with PawPoint for any questions, support, or account changes.',
};

export default function ContactPage() {
    return (
        <LocalIntlProvider messages={messages}>
            <main>
                <ContactSection />
            </main>
        </LocalIntlProvider>
    );
}
