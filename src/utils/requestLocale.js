import { cookies, headers } from 'next/headers';
import { normalizeLocale } from '@/utils/blogLocale';

const LOCALE_HEADER = 'x-pawpoint-locale';

/** Resolve locale from middleware rewrite header, then cookie (default en). */
export async function getRequestLocale() {
    const headerStore = await headers();
    const fromHeader = headerStore.get(LOCALE_HEADER);
    if (fromHeader) return normalizeLocale(fromHeader);

    const cookieStore = await cookies();
    return normalizeLocale(cookieStore.get('language')?.value);
}
