'use client';

import { useEffect } from 'react';
import { BLOG_LOCALES, blogPostPath } from '@/utils/blogLocale';
import { buildBlogSeo } from '@/utils/blogSeo';
import { absoluteUrl } from '@/utils/siteUrl';

const META_ATTR = 'data-pawpoint-blog-seo';
const SCRIPT_ATTR = 'data-pawpoint-blog-schema';
const HEAD_CODE_ATTR = 'data-pawpoint-blog-head-code';

function upsertMeta(selectorAttr, attrs) {
    if (typeof document === 'undefined') return;
    let el = document.head.querySelector(`[${META_ATTR}="${selectorAttr}"]`);
    if (!el) {
        el = document.createElement('meta');
        el.setAttribute(META_ATTR, selectorAttr);
        document.head.appendChild(el);
    }
    Object.entries(attrs).forEach(([key, value]) => {
        if (value == null || value === '') {
            el.removeAttribute(key);
        } else {
            el.setAttribute(key, value);
        }
    });
}

function upsertLink(rel, href, extraAttrs = {}) {
    if (typeof document === 'undefined') return;
    const key = extraAttrs.hreflang ? `link-${rel}-${extraAttrs.hreflang}` : `link-${rel}`;
    let el = document.head.querySelector(`[${META_ATTR}="${key}"]`);
    if (!href) {
        el?.remove();
        return;
    }
    if (!el) {
        el = document.createElement('link');
        el.setAttribute(META_ATTR, key);
        document.head.appendChild(el);
    }
    el.setAttribute('rel', rel);
    el.setAttribute('href', href);
    Object.entries(extraAttrs).forEach(([attr, value]) => {
        if (value == null || value === '') el.removeAttribute(attr);
        else el.setAttribute(attr, value);
    });
}

function clearManagedNodes() {
    if (typeof document === 'undefined') return;
    document.head.querySelectorAll(`[${META_ATTR}]`).forEach((n) => n.remove());
    document.head.querySelectorAll(`[${SCRIPT_ATTR}]`).forEach((n) => n.remove());
    document.head.querySelectorAll(`[${HEAD_CODE_ATTR}]`).forEach((n) => n.remove());
}

function injectJsonLd(id, data) {
    if (!data || typeof document === 'undefined') return;
    const el = document.createElement('script');
    el.type = 'application/ld+json';
    el.setAttribute(SCRIPT_ATTR, id);
    el.textContent = JSON.stringify(data);
    document.head.appendChild(el);
}

function injectHeadCode(html) {
    if (!html || typeof document === 'undefined') return;
    const wrapper = document.createElement('div');
    wrapper.setAttribute(HEAD_CODE_ATTR, '1');
    wrapper.innerHTML = html;
    Array.from(wrapper.childNodes).forEach((node) => {
        if (node.nodeType !== 1) return;
        const clone = node.cloneNode(true);
        clone.setAttribute(HEAD_CODE_ATTR, '1');
        document.head.appendChild(clone);
    });
}

function buildFaqSchema(faqItems) {
    if (!faqItems?.length) return null;
    return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqItems.map((item) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: {
                '@type': 'Answer',
                text: item.answer,
            },
        })),
    };
}

/**
 * Applies blog SEO / OG / Twitter / schema / head_code into <head>.
 * Re-runs when blog or locale changes (language switch).
 */
export default function BlogSeoHead({ blog, locale = 'en' }) {
    useEffect(() => {
        if (!blog) return undefined;

        const seo = buildBlogSeo(blog, locale);
        if (!seo) return undefined;

        clearManagedNodes();

        if (seo.seoTitle) {
            document.title = seo.seoTitle;
        }

        if (seo.metaDescription) {
            upsertMeta('description', { name: 'description', content: seo.metaDescription });
        }
        if (seo.metaKeywords) {
            upsertMeta('keywords', { name: 'keywords', content: seo.metaKeywords });
        }
        if (seo.focusKeyword) {
            upsertMeta('focus-keyword', { name: 'news_keywords', content: seo.focusKeyword });
        }
        upsertMeta('robots', { name: 'robots', content: seo.robots || 'index, follow' });

        upsertLink('canonical', seo.canonicalUrl);

        BLOG_LOCALES.forEach((code) => {
            const href = absoluteUrl(blogPostPath(code, seo.slugMap?.[code] || seo.slug));
            upsertLink('alternate', href, { hreflang: code });
        });
        upsertLink('alternate', absoluteUrl(blogPostPath('en', seo.slugMap?.en || seo.slug)), {
            hreflang: 'x-default',
        });

        upsertMeta('og:title', { property: 'og:title', content: seo.ogTitle });
        upsertMeta('og:locale', { property: 'og:locale', content: locale });
        upsertMeta('og:url', { property: 'og:url', content: absoluteUrl(seo.path) });
        upsertMeta('og:description', { property: 'og:description', content: seo.ogDescription });
        if (seo.ogImage) {
            upsertMeta('og:image', { property: 'og:image', content: seo.ogImage });
        }
        upsertMeta('og:type', { property: 'og:type', content: 'article' });

        upsertMeta('twitter:card', { name: 'twitter:card', content: 'summary_large_image' });
        upsertMeta('twitter:title', { name: 'twitter:title', content: seo.twitterTitle });
        upsertMeta('twitter:description', {
            name: 'twitter:description',
            content: seo.twitterDescription,
        });
        if (seo.twitterImage) {
            upsertMeta('twitter:image', { name: 'twitter:image', content: seo.twitterImage });
        }

        if (seo.articleSchema) {
            injectJsonLd('article', seo.articleSchema);
        }
        const faqSchema = buildFaqSchema(seo.faqItems);
        if (faqSchema) {
            injectJsonLd('faq', faqSchema);
        }

        if (seo.headCode) {
            injectHeadCode(seo.headCode);
        }

        return () => {
            clearManagedNodes();
        };
    }, [blog, locale]);

    return null;
}
