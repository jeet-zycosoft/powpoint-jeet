import { NextResponse } from 'next/server';
import { BLOG_LOCALES, normalizeLocale } from '@/utils/blogLocale';

const LOCALE_HEADER = 'x-pawpoint-locale';

function withLocale(response, locale) {
    response.cookies.set('language', locale, {
        path: '/',
        maxAge: 60 * 60 * 24 * 365,
        sameSite: 'lax',
    });
    response.headers.set(LOCALE_HEADER, locale);
    return response;
}

/**
 * Public URLs: /en/blog, /es/blog, /fr/blog (and /.../slug)
 * Internally rewrite to /blog to avoid conflicting with (common)/[slug].
 * English is the default public locale prefix.
 */
export function middleware(request) {
    const { pathname } = request.nextUrl;

    // Bare /blog → default English URL
    if (pathname === '/blog' || pathname.startsWith('/blog/')) {
        const rest = pathname.slice('/blog'.length);
        const url = request.nextUrl.clone();
        url.pathname = `/en/blog${rest}`;
        return withLocale(NextResponse.redirect(url, 308), 'en');
    }

    const localeMatch = pathname.match(/^\/(en|es|fr)\/blog(\/.*)?$/i);
    if (localeMatch) {
        const locale = normalizeLocale(localeMatch[1]);
        const rest = localeMatch[2] || '';
        const rewriteUrl = request.nextUrl.clone();
        rewriteUrl.pathname = `/blog${rest}`;

        const requestHeaders = new Headers(request.headers);
        requestHeaders.set(LOCALE_HEADER, locale);

        const response = NextResponse.rewrite(rewriteUrl, {
            request: { headers: requestHeaders },
        });
        return withLocale(response, locale);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/blog',
        '/blog/:path*',
        '/en/blog',
        '/en/blog/:path*',
        '/es/blog',
        '/es/blog/:path*',
        '/fr/blog',
        '/fr/blog/:path*',
    ],
};
