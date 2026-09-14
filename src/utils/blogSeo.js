import { normalizeLocale, pickLocale, getBlogLocaleSlugs, blogPostPath } from './blogLocale';
import { absoluteUrl } from './siteUrl';

function asObject(value) {
    if (!value) return {};
    if (typeof value === 'object') return value;
    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value);
            return parsed && typeof parsed === 'object' ? parsed : {};
        } catch {
            return {};
        }
    }
    return {};
}

function parseJsonMaybe(value) {
    if (value == null || value === '') return null;
    if (typeof value === 'object') return value;
    if (typeof value !== 'string') return null;
    try {
        return JSON.parse(value);
    } catch {
        return null;
    }
}

function parseFaqItems(raw, locale = 'en') {
    const parsed = parseJsonMaybe(raw);
    const list = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed?.items)
          ? parsed.items
          : Array.isArray(raw)
            ? raw
            : [];

    return list
        .map((item) => {
            if (!item || typeof item !== 'object') return null;
            const question = pickLocale(item.question ?? item.q ?? item.title, locale);
            const answer = pickLocale(item.answer ?? item.a ?? item.content, locale);
            if (!question && !answer) return null;
            return { question, answer };
        })
        .filter(Boolean);
}

/**
 * Build normalized SEO / OG / schema payload from a blog detail API response.
 * Backend already applies field-by-field locale fallback; pickLocale covers raw maps.
 */
export function buildBlogSeo(blog, locale = 'en') {
    if (!blog) return null;

    const lang = normalizeLocale(locale);
    const seo = asObject(blog.seo);
    const og = asObject(blog.open_graph);
    const schema = asObject(blog.schema);
    const ai = asObject(blog.ai_visibility);
    const slugMap = getBlogLocaleSlugs(blog, lang);

    const title = pickLocale(blog.title, lang);
    const excerpt = pickLocale(blog.excerpt, lang);
    const content = pickLocale(blog.content, lang);
    const imageUrl = pickLocale(blog.image_url, lang) || blog.image_url || '';
    const slug = slugMap[lang] || pickLocale(blog.slug, lang) || '';

    const seoTitle = pickLocale(seo.seo_title, lang) || title;
    const metaDescription = pickLocale(seo.meta_description, lang) || excerpt;
    const metaKeywords = pickLocale(seo.meta_keywords, lang);
    const focusKeyword = pickLocale(seo.focus_keyword, lang);
    const robots = pickLocale(seo.robots, lang) || 'index, follow';
    const headCode = typeof seo.head_code === 'string' ? seo.head_code.trim() : '';

    const path = blogPostPath(lang, slug);
    const canonicalFromApi = pickLocale(seo.canonical_url, lang);
    const canonicalUrl = canonicalFromApi || absoluteUrl(path);

    const ogTitle = pickLocale(og.og_title, lang) || seoTitle || title;
    const ogDescription = pickLocale(og.og_description, lang) || metaDescription || excerpt;
    const ogImage = pickLocale(og.og_image, lang) || imageUrl;
    const twitterTitle = pickLocale(og.twitter_title, lang) || ogTitle;
    const twitterDescription = pickLocale(og.twitter_description, lang) || ogDescription;
    const twitterImage = pickLocale(og.twitter_image, lang) || ogImage;

    const articleSchema = parseJsonMaybe(schema.article_schema);
    const faqItems = parseFaqItems(schema.faq_items, lang);

    return {
        locale: lang,
        title,
        excerpt,
        content,
        imageUrl,
        slug,
        slugMap,
        path,
        seoTitle,
        metaDescription,
        metaKeywords,
        focusKeyword,
        canonicalUrl,
        robots,
        headCode,
        ogTitle,
        ogDescription,
        ogImage,
        twitterTitle,
        twitterDescription,
        twitterImage,
        articleSchema,
        faqItems,
        aiVisibility: {
            aiSummary: pickLocale(ai.ai_summary, lang),
            primaryTopic: pickLocale(ai.primary_topic, lang),
            secondaryTopics: ai.secondary_topics,
            namedEntities: ai.named_entities,
            keyTakeaways: ai.key_takeaways,
        },
    };
}

/**
 * Next.js metadata object for blog detail (SSR / generateMetadata).
 * @param {object} options optional { path, languages }
 */
export function buildNextMetadata(blog, locale = 'en', options = {}) {
    const seo = buildBlogSeo(blog, locale);
    if (!seo) {
        return {
            title: 'Pet Care Article | PawPoint Blog',
            description: 'Read expert pet care guides, tips, and wellness advice on PawPoint.',
        };
    }

    const path = options.path || seo.path;
    const languages =
        options.languages ||
        Object.fromEntries(
            Object.entries(seo.slugMap || {}).map(([code, slug]) => [
                code,
                absoluteUrl(blogPostPath(code, slug)),
            ]),
        );

    if (languages && !languages['x-default']) {
        languages['x-default'] =
            languages.en || absoluteUrl(blogPostPath('en', seo.slugMap?.en || seo.slug));
    }

    return {
        title: seo.seoTitle || 'Pet Care Article | PawPoint Blog',
        description: seo.metaDescription || undefined,
        keywords: seo.metaKeywords || undefined,
        robots: seo.robots || undefined,
        alternates: {
            canonical: seo.canonicalUrl || absoluteUrl(path),
            languages,
        },
        openGraph: {
            title: seo.ogTitle || undefined,
            description: seo.ogDescription || undefined,
            images: seo.ogImage ? [{ url: seo.ogImage }] : undefined,
            url: absoluteUrl(path),
            locale: normalizeLocale(locale),
            type: 'article',
        },
        twitter: {
            card: 'summary_large_image',
            title: seo.twitterTitle || undefined,
            description: seo.twitterDescription || undefined,
            images: seo.twitterImage ? [seo.twitterImage] : undefined,
        },
    };
}
