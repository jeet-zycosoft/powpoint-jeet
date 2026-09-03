import AuthGuard from '@/components/AuthGuard';
import ProfileViewPage from '@/views/ProfileViewPage';

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

const Profile = async ({ searchParams }) => {
    const resolvedSearchParams = await searchParams;
    const id = resolvedSearchParams.id;

    return (
        <AuthGuard>
            <LocalIntlProvider messages={messages}>
                <ProfileViewPage id={id} />
            </LocalIntlProvider>
        </AuthGuard>
    );
};
export default Profile;
