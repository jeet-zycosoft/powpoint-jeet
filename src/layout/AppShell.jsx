import LocalIntlProvider from '@/app/LocalIntlProvider';
import Footer from '@/layout/footer';
import Header from '@/layout/header';

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

export default function AppShell({ children }) {
    return (
        <LocalIntlProvider messages={messages}>
            <div className="site-shell">
                <Header />
                <main className="site-main">{children}</main>
                <Footer />
            </div>
        </LocalIntlProvider>
    );
}
