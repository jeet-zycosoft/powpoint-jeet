import AuthGuard from '@/components/AuthGuard';
import UpdateProfile from '@/views/updateProfile';

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

export async function generateStaticParams() {
    return [{ slug: 'customer' }, { slug: 'worker' }];
}

export const dynamicParams = false;

const UpdateProfilePage = async ({ params }) => {
    const { slug } = await params;

    return (
        <LocalIntlProvider messages={messages}>
            <AuthGuard>
                <UpdateProfile slug={slug} />
            </AuthGuard>
        </LocalIntlProvider>
    );
};

export default UpdateProfilePage;
