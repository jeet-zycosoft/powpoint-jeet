import LocalIntlProvider from '@/app/LocalIntlProvider';
import { publicService } from '@/services/publicService';
import BlogListingView from '@/views/blog/blogListingView';
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

export const metadata = {
    title: 'Pet Care Blog & Advice | PawPoint',
    description:
        'Discover expert pet care guides, dog training tips, feline wellness advice, and nutrition secrets from PawPoint veterinary specialists.',
};

export default async function BlogListingPage() {
    const queryClient = new QueryClient();

    try {
        await queryClient.prefetchQuery({
            queryKey: ['blogs', 'list'],
            queryFn: async () => {
                const res = await publicService.blogs();
                return res?.data || [];
            },
        });
    } catch (err) {
        console.error('Error prefetching blogs for SSR:', err);
    }

    return (
        <LocalIntlProvider messages={messages}>
            <HydrationBoundary state={dehydrate(queryClient)}>
                <main>
                    <BlogListingView />
                </main>
            </HydrationBoundary>
        </LocalIntlProvider>
    );
}
