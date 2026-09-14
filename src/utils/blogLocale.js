export const BLOG_LOCALES = ['en', 'es', 'fr'];

export function normalizeLocale(locale) {
    const code = String(locale || 'en')
        .slice(0, 2)
        .toLowerCase();
    return BLOG_LOCALES.includes(code) ? code : 'en';
}

export function isBlogLocale(locale) {
    return BLOG_LOCALES.includes(String(locale || '').toLowerCase().slice(0, 2));
}

/**
 * Optional safety helper when raw locale maps are received.
 * Prefer selected locale, then en, then es/fr.
 */
export function pickLocale(value, locale = 'en') {
    if (value == null) return '';
    if (typeof value === 'string') return value.trim();
    const preferred = normalizeLocale(locale);
    for (const code of [preferred, 'en', 'es', 'fr']) {
        const v = value?.[code];
        if (typeof v === 'string' && v.trim() !== '') return v.trim();
    }
    return '';
}

/** Resolve a blog field that may be a string or locale map. */
export function resolveBlogField(value, locale = 'en') {
    return pickLocale(value, locale);
}

/** /{locale}/blog or /{locale}/blog/{slug} */
export function blogListPath(locale = 'en') {
    return `/${normalizeLocale(locale)}/blog`;
}

export function blogPostPath(locale = 'en', slug = '') {
    const lang = normalizeLocale(locale);
    const clean = String(slug || '')
        .replace(/^\/+|\/+$/g, '')
        .trim();
    return clean ? `/${lang}/blog/${clean}` : blogListPath(lang);
}

/**
 * Extract per-locale slugs from a blog detail payload when available.
 * Falls back to the current slug for every locale.
 */
export function getBlogLocaleSlugs(blog, fallbackLocale = 'en') {
    const currentSlug = typeof blog?.slug === 'string' ? blog.slug : '';
    const map = { en: '', es: '', fr: '' };

    const candidates = [
        blog?.slugs,
        blog?.slug_translations,
        blog?.localized_slugs,
        blog?.seo?.slugs,
        blog?.translations,
    ];

    for (const candidate of candidates) {
        if (!candidate) continue;

        if (Array.isArray(candidate)) {
            candidate.forEach((item) => {
                if (!item || typeof item !== 'object') return;
                const code = normalizeLocale(item.locale || item.lang || item.language);
                const slug = item.slug || item.path;
                if (typeof slug === 'string' && slug.trim()) map[code] = slug.trim();
            });
            continue;
        }

        if (typeof candidate === 'object') {
            BLOG_LOCALES.forEach((code) => {
                const slug = candidate[code];
                if (typeof slug === 'string' && slug.trim()) map[code] = slug.trim();
            });
        }
    }

    // If slug itself is a locale map
    if (blog?.slug && typeof blog.slug === 'object') {
        BLOG_LOCALES.forEach((code) => {
            const slug = blog.slug[code];
            if (typeof slug === 'string' && slug.trim()) map[code] = slug.trim();
        });
    }

    const fallback = currentSlug || map[normalizeLocale(fallbackLocale)] || map.en || '';
    BLOG_LOCALES.forEach((code) => {
        if (!map[code]) map[code] = fallback;
    });

    return map;
}

/** Match /{locale}/blog(/{slug})? */
export function parseBlogPathname(pathname = '') {
    const match = String(pathname).match(/^\/(en|es|fr)\/blog(?:\/([^/]+))?\/?$/i);
    if (!match) return null;
    return {
        locale: normalizeLocale(match[1]),
        slug: match[2] ? decodeURIComponent(match[2]) : null,
    };
}
