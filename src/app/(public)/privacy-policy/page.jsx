import PrivacyPolicySection from '@/views/common/PrivacyPolicySection';
import LocalIntlProvider from '@/app/LocalIntlProvider';
import { publicPageMetadata } from '@/utils/pageSeo';
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

export const revalidate = 3600;

export const metadata = publicPageMetadata({
    title: 'Privacy Policy | PawPoint',
    description: 'Learn how PawPoint collects, uses, and protects your personal data.',
    path: '/privacy-policy',
});

export default function PrivacyPolicyPage() {
    return (
        <LocalIntlProvider messages={messages}>
            <main>
                <PrivacyPolicySection />
            </main>
        </LocalIntlProvider>
    );
}
