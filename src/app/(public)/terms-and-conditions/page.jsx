import TermsAndConditionsSection from '@/views/common/TermsAndConditionsSection';
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
    title: 'Terms & Conditions | PawPoint',
    description: 'Read the terms and conditions for using PawPoint pet sitting platform.',
    path: '/terms-and-conditions',
});

export default function TermsAndConditionsPage() {
    return (
        <LocalIntlProvider messages={messages}>
            <main>
                <TermsAndConditionsSection />
            </main>
        </LocalIntlProvider>
    );
}
