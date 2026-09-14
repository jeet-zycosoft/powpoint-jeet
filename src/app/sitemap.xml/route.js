import { NextResponse } from 'next/server';
import { buildSitemapEntries, renderSitemapXml } from '@/lib/sitemapData';

export const revalidate = 3600;

export async function GET() {
    const entries = await buildSitemapEntries();
    const xml = renderSitemapXml(entries);

    return new NextResponse(xml, {
        status: 200,
        headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
            'X-Content-Type-Options': 'nosniff',
        },
    });
}
