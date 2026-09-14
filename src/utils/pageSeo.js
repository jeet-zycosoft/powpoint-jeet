import { absoluteUrl } from '@/utils/siteUrl';

/** Shared robots for private / auth / account pages — never index. */
export const NO_INDEX_ROBOTS = {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
        index: false,
        follow: false,
        noimageindex: true,
    },
};

/** Shared robots for public SEO pages. */
export const INDEX_ROBOTS = {
    index: true,
    follow: true,
};

/**
 * Metadata for private pages (profile, password, chat, payments, etc.).
 * CSR pages can still use this via a route `layout.jsx`.
 */
export function privatePageMetadata({
    title = 'PawPoint',
    description = 'PawPoint account area.',
} = {}) {
    return {
        title,
        description,
        robots: NO_INDEX_ROBOTS,
        alternates: {
            canonical: undefined,
        },
    };
}

/**
 * Metadata for public SEO pages (SSR / SSG / ISR compatible).
 */
export function publicPageMetadata({
    title,
    description,
    path = '/',
    keywords,
    openGraph,
    twitter,
    robots = INDEX_ROBOTS,
} = {}) {
    const url = absoluteUrl(path);

    return {
        title,
        description,
        keywords,
        robots,
        alternates: {
            canonical: url,
        },
        openGraph: {
            title,
            description,
            url,
            type: 'website',
            siteName: 'PawPoint',
            ...openGraph,
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            ...twitter,
        },
    };
}

/** ISR default for public marketing / content pages (1 hour). */
export const PUBLIC_REVALIDATE_SECONDS = 3600;
