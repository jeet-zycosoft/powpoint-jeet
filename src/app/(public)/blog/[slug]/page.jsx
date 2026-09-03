import LocalIntlProvider from '@/app/LocalIntlProvider';
import { publicService } from '@/services/publicService';
import BlogSingleView from '@/views/blog/blogSingleView';
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

export async function generateMetadata({ params }) {
    const resolvedParams = await params;
    try {
        const res = await publicService.blogDetail(resolvedParams.slug);
        const blog = res?.data;
        if (blog) {
            return {
                title: `${blog.title} | PawPoint Blog`,
                description:
                    blog.excerpt ||
                    'Read expert pet care guides, tips, and wellness advice on PawPoint.',
            };
        }
    } catch (err) {
        console.error('Error generating metadata for blog single:', err);
    }

    return {
        title: 'Pet Care Article | PawPoint Blog',
        description: 'Read expert pet care guides, tips, and wellness advice on PawPoint.',
    };
}

export default async function BlogSinglePage({ params }) {
    const resolvedParams = await params;
    const queryClient = new QueryClient();

    try {
        await queryClient.prefetchQuery({
            queryKey: ['blogs', 'detail', resolvedParams.slug],
            queryFn: async () => {
                const res = await publicService.blogDetail(resolvedParams.slug);
                return res?.data || null;
            },
        });
    } catch (err) {
        console.error('Error prefetching blog single for SSR:', err);
    }

    return (
        <LocalIntlProvider messages={messages}>
            <HydrationBoundary state={dehydrate(queryClient)}>
                <main>
                    <BlogSingleView slug={resolvedParams.slug} />
                </main>
            </HydrationBoundary>
        </LocalIntlProvider>
    );
}
