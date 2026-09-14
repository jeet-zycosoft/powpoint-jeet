import LocalIntlProvider from '@/app/LocalIntlProvider';
import BlogSingleView from '@/views/blog/blogSingleView';
import { publicService } from '@/services/publicService';
import { BLOG_LOCALES, blogPostPath } from '@/utils/blogLocale';
import { buildNextMetadata } from '@/utils/blogSeo';
import { getRequestLocale } from '@/utils/requestLocale';
import { absoluteUrl } from '@/utils/siteUrl';
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

async function fetchBlog(slug, locale) {
    try {
        const res = await publicService.blogDetail({ slug, locale });
        return res?.data || null;
    } catch (err) {
        console.error('Blog detail SSR fetch failed', err);
        return null;
    }
}

export async function generateMetadata({ params }) {
    const { slug } = await params;
    const locale = await getRequestLocale();
    const blog = await fetchBlog(slug, locale);
    const path = blogPostPath(locale, slug);
    const languages = Object.fromEntries(
        BLOG_LOCALES.map((code) => [code, absoluteUrl(blogPostPath(code, slug))]),
    );
    languages['x-default'] = absoluteUrl(blogPostPath('en', slug));

    if (!blog) {
        return {
            title: 'Pet Care Article | PawPoint Blog',
            description: 'Read expert pet care guides, tips, and wellness advice on PawPoint.',
            alternates: { canonical: absoluteUrl(path), languages },
        };
    }

    return buildNextMetadata(blog, locale, { path, languages });
}

async function prefetchBlogDetail(slug, locale) {
    const queryClient = new QueryClient();
    const blog = await fetchBlog(slug, locale);

    if (blog) {
        queryClient.setQueryData(['blogs', 'detail', slug, locale], blog);
        if (blog.id) {
            try {
                await queryClient.prefetchQuery({
                    queryKey: ['blogs', 'related', blog.id, locale],
                    queryFn: async () => {
                        const res = await publicService.recentBlog({ id: blog.id, locale });
                        const list = res?.data;
                        if (Array.isArray(list)) {
                            return list.filter((item) => item.id !== blog.id).slice(0, 3);
                        }
                        if (res?.status && Array.isArray(res?.data?.data)) {
                            return res.data.data.filter((item) => item.id !== blog.id).slice(0, 3);
                        }
                        return [];
                    },
                });
            } catch (err) {
                console.error('Blog related SSR prefetch failed', err);
            }
        }
    }

    return { state: dehydrate(queryClient), blog };
}

/** Public blog article — SSR data + ISR. */
export default async function BlogSinglePage({ params }) {
    const { slug } = await params;
    const locale = await getRequestLocale();
    const { state, blog } = await prefetchBlogDetail(slug, locale);

    return (
        <LocalIntlProvider messages={messages}>
            <HydrationBoundary state={state}>
                <main>
                    <BlogSingleView slug={slug} locale={locale} blog={blog} />
                </main>
            </HydrationBoundary>
        </LocalIntlProvider>
    );
}
