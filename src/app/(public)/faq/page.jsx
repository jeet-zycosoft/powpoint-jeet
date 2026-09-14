import FaqPageView from '@/views/common/FaqPageView';
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
    title: 'Frequently Asked Questions | PawPoint',
    description:
        'Find answers to common questions about PawPoint pet sitting, vetting, booking, insurance, and cancellations.',
    path: '/faq',
});

export default function FaqPage() {
    return (
        <LocalIntlProvider messages={messages}>
            <main>
                <FaqPageView />
            </main>
        </LocalIntlProvider>
    );
}
