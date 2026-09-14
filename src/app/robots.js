import { getSiteUrl } from '@/utils/siteUrl';

const siteUrl = getSiteUrl();

/**
 * Crawl rules:
 * - Public SEO pages: allow (home, sitter, listing, blog, FAQ, legal, worker-details)
 * - Private / account / auth pages: disallow (+ page-level noindex)
 */
export default function robots() {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: [
                    '/api/',
                    '/login',
                    '/signup',
                    '/forgot-password',
                    '/change-password',
                    '/verify-email',
                    '/conversations',
                    '/chat/',
                    '/profile',
                    '/favorites',
                    '/premium-activation',
                    '/payment-success',
                    '/payment-error',
                    '/feedback',
                    '/thank-you',
                    '/*/base-form',
                    '/*/base-form2',
                    '/customer/base-form',
                    '/customer/base-form2',
                    '/worker/base-form',
                    '/worker/base-form2',
                ],
            },
        ],
        sitemap: `${siteUrl}/sitemap.xml`,
        host: siteUrl,
    };
}
