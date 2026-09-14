/**
 * Absolute site origin for canonical URLs, sitemap, and robots.
 * Set NEXT_PUBLIC_SITE_URL in production (e.g. https://pawpoint.com).
 */
export function getSiteUrl() {
    const fromEnv = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL;
    if (fromEnv) {
        return String(fromEnv).replace(/\/+$/, '');
    }
    if (process.env.VERCEL_URL) {
        return `https://${String(process.env.VERCEL_URL).replace(/\/+$/, '')}`;
    }
    return 'http://localhost:3000';
}

export function absoluteUrl(path = '/') {
    const base = getSiteUrl();
    if (!path) return base;
    if (/^https?:\/\//i.test(path)) return path;
    return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}
