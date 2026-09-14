import { publicService } from '@/services/publicService';
import FOOTER_LOCATIONS, { toCitySlug } from '@/data/footerLocations';
import { BLOG_LOCALES, blogListPath, blogPostPath } from '@/utils/blogLocale';
import { absoluteUrl } from '@/utils/siteUrl';

const STATIC_PATHS = [
    { path: '/', changeFrequency: 'weekly', priority: 1 },
    { path: '/sitter', changeFrequency: 'weekly', priority: 0.8 },
    { path: '/sitter/listing', changeFrequency: 'daily', priority: 0.9 },
    { path: '/owner/listing', changeFrequency: 'daily', priority: 0.7 },
    { path: '/contact', changeFrequency: 'monthly', priority: 0.6 },
    { path: '/faq', changeFrequency: 'monthly', priority: 0.6 },
    { path: '/instructions', changeFrequency: 'monthly', priority: 0.5 },
    { path: '/privacy-policy', changeFrequency: 'yearly', priority: 0.3 },
    { path: '/terms-and-conditions', changeFrequency: 'yearly', priority: 0.3 },
];

const BLOG_FETCH_TIMEOUT_MS = 8000;

function withTimeout(promise, ms, label) {
    let timer;
    const timeout = new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    });
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

async function fetchBlogsForLocale(locale) {
    try {
        const res = await withTimeout(
            publicService.blogs({ locale, per_page: 100, page: 1 }),
            BLOG_FETCH_TIMEOUT_MS,
            `Sitemap blogs (${locale})`,
        );
        if (Array.isArray(res?.data)) return res.data;
        if (Array.isArray(res?.data?.data)) return res.data.data;
        return [];
    } catch (err) {
        console.error(`Sitemap: failed to load blogs for ${locale}`, err?.message || err);
        return [];
    }
}

function escapeXml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function toLastMod(value) {
    try {
        return new Date(value || Date.now()).toISOString();
    } catch {
        return new Date().toISOString();
    }
}

function renderUrlEntry(entry) {
    const lines = [
        '  <url>',
        `    <loc>${escapeXml(entry.url)}</loc>`,
        `    <lastmod>${escapeXml(toLastMod(entry.lastModified))}</lastmod>`,
    ];

    if (entry.changeFrequency) {
        lines.push(`    <changefreq>${escapeXml(entry.changeFrequency)}</changefreq>`);
    }
    if (entry.priority != null) {
        lines.push(`    <priority>${escapeXml(entry.priority)}</priority>`);
    }

    const languages = entry.alternates?.languages;
    if (languages && typeof languages === 'object') {
        Object.entries(languages).forEach(([code, href]) => {
            lines.push(
                `    <xhtml:link rel="alternate" hreflang="${escapeXml(code)}" href="${escapeXml(href)}" />`,
            );
        });
    }

    lines.push('  </url>');
    return lines.join('\n');
}

export async function buildSitemapEntries() {
    const now = new Date();

    const staticEntries = STATIC_PATHS.map((item) => ({
        url: absoluteUrl(item.path),
        lastModified: now,
        changeFrequency: item.changeFrequency,
        priority: item.priority,
    }));

    const cityEntries = FOOTER_LOCATIONS.map((location) => {
        const slug = toCitySlug(location.name);
        return {
            url: absoluteUrl(`/${slug}`),
            lastModified: now,
            changeFrequency: 'weekly',
            priority: 0.7,
        };
    });

    const blogIndexEntries = BLOG_LOCALES.map((locale) => ({
        url: absoluteUrl(blogListPath(locale)),
        lastModified: now,
        changeFrequency: 'daily',
        priority: 0.8,
        alternates: {
            languages: Object.fromEntries(
                BLOG_LOCALES.map((code) => [code, absoluteUrl(blogListPath(code))]),
            ),
        },
    }));

    const blogPostEntries = [];

    await Promise.all(
        BLOG_LOCALES.map(async (locale) => {
            const blogs = await fetchBlogsForLocale(locale);
            blogs.forEach((blog) => {
                if (!blog?.slug) return;
                const lastModified = blog.updated_at || blog.published_at || blog.created_at || now;
                blogPostEntries.push({
                    url: absoluteUrl(blogPostPath(locale, blog.slug)),
                    lastModified: new Date(lastModified),
                    changeFrequency: 'weekly',
                    priority: 0.7,
                });
            });
        }),
    );

    return [...staticEntries, ...cityEntries, ...blogIndexEntries, ...blogPostEntries];
}

export function renderSitemapXml(entries) {
    const body = entries.map(renderUrlEntry).join('\n');
    return `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${body}
</urlset>
`;
}
