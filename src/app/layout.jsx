import { DM_Sans } from 'next/font/google';
import localFont from 'next/font/local';
import { cookies } from 'next/headers';

import I18nProvider from '@/app/I18nProvider';
import { ModalProvider } from '@/app/ModalProvider';
import QueryProvider from '@/app/QueryProvider';
import StoreProvider from '@/app/StoreProvider';
import ToastProvider from '@/app/ToastProvider';
import ChatSocketProvider from '@/context/ChatSocketProvider';
import 'bootstrap/dist/css/bootstrap.min.css'; // Import Bootstrap CSS
// import NextTopLoader from 'nextjs-toploader'
// import AOSProvider from './AOSProvider'
// import dynamic from 'next/dynamic'
// const DynamicTagManager = dynamic(() => import('@/app/TagManagers'), { ssr: false })
// import Script from 'next/script'
import '@/styles/style.scss';
import SiteSettingsInitializer from '@/components/SiteSettingsInitializer';
import GoogleAuthProvider from '@/app/GoogleAuthProvider';
import { normalizeLocale } from '@/utils/blogLocale';

const DMSans = DM_Sans({
    // ... (lines 16-53 remain unmodified, so let's match the exact text block)
    weight: ['200', '400', '500', '600', '700', '800'],
    display: 'swap',
    subsets: ['latin'],
    variable: '--secondary-font',
});

const AllianceNo2 = localFont({
    src: [
        {
            path: '../../public/fonts/AllianceNo2-Regular.woff2',
            weight: '400',
            style: 'normal',
        },
        {
            path: '../../public/fonts/AllianceNo2-Medium.woff2',
            weight: '500',
            style: 'normal',
        },
        {
            path: '../../public/fonts/AllianceNo2-SemiBold.woff2',
            weight: '600',
            style: 'normal',
        },
        {
            path: '../../public/fonts/AllianceNo2-Bold.woff2',
            weight: '700',
            style: 'normal',
        },
    ],
    variable: '--primary-font',
});

export const metadata = {
    title: {
        default: 'PawPoint | Trusted Pet Sitters Near You',
        template: '%s',
    },
    description:
        'Find vetted pet sitters and trusted pet care near you. Book dog walkers, sitters, and more with PawPoint.',
    metadataBase: new URL(
        process.env.NEXT_PUBLIC_SITE_URL ||
            (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'),
    ),
};

export default async function RootLayout({ children }) {
    const cookieStore = await cookies();
    const htmlLang = normalizeLocale(cookieStore.get('language')?.value);

    return (
        <StoreProvider>
            <QueryProvider>
                <SiteSettingsInitializer>
                    <html lang={htmlLang} data-scroll-behavior="smooth">
                        <body className={`${AllianceNo2.variable} ${DMSans.variable}`}>
                            <GoogleAuthProvider>
                                <I18nProvider>
                                    {/* <NextTopLoader color='#cf963f' showSpinner={false} /> */}
                                    <ToastProvider>
                                        <ChatSocketProvider>
                                            <ModalProvider>{children}</ModalProvider>
                                        </ChatSocketProvider>
                                    </ToastProvider>
                                </I18nProvider>
                            </GoogleAuthProvider>
                        </body>
                    </html>
                </SiteSettingsInitializer>
            </QueryProvider>
        </StoreProvider>
    );
}
