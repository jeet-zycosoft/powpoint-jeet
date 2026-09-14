import LocalIntlProvider from '@/app/LocalIntlProvider';
import BlogListingView from '@/views/blog/blogListingView';
import { publicService } from '@/services/publicService';
import { BLOG_LOCALES, blogListPath } from '@/utils/blogLocale';
import { getRequestLocale } from '@/utils/requestLocale';
import { absoluteUrl } from '@/utils/siteUrl';
import { publicPageMetadata } from '@/utils/pageSeo';
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
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

export async function generateMetadata() {
    const locale = await getRequestLocale();
    const path = blogListPath(locale);
    const languages = Object.fromEntries(
        BLOG_LOCALES.map((code) => [code, absoluteUrl(blogListPath(code))]),
    );
    languages['x-default'] = absoluteUrl(blogListPath('en'));

    return {
        ...publicPageMetadata({
            title: 'Pet Care Blog & Advice | PawPoint',
            description:
                'Discover expert pet care guides, dog training tips, feline wellness advice, and nutrition secrets from PawPoint veterinary specialists.',
            path,
        }),
        alternates: {
            canonical: absoluteUrl(path),
            languages,
        },
        openGraph: {
            title: 'Pet Care Blog & Advice | PawPoint',
            description:
                'Discover expert pet care guides, dog training tips, feline wellness advice, and nutrition secrets from PawPoint veterinary specialists.',
            url: absoluteUrl(path),
            locale,
            type: 'website',
            siteName: 'PawPoint',
        },
    };
}

async function prefetchBlogs(locale) {
    const queryClient = new QueryClient();
    try {
        await queryClient.prefetchQuery({
            queryKey: ['blogs', 'list', locale],
            queryFn: async () => {
                const res = await publicService.blogs({ locale, per_page: 50, page: 1 });
                if (Array.isArray(res?.data)) return res.data;
                if (Array.isArray(res?.data?.data)) return res.data.data;
                return res?.data || [];
            },
        });
    } catch (err) {
        console.error('Blog list SSR prefetch failed', err);
    }
    return dehydrate(queryClient);
}

/** Public blog index — SSR prefetch + ISR. */
export default async function BlogListingPage() {
    const locale = await getRequestLocale();
    const state = await prefetchBlogs(locale);

    return (
        <LocalIntlProvider messages={messages}>
            <HydrationBoundary state={state}>
                <main>
                    <BlogListingView locale={locale} />
                </main>
            </HydrationBoundary>
        </LocalIntlProvider>
    );
}
