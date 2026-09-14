'use client';

import { usePathname } from 'next/navigation';
import { useIntl } from 'react-intl';
import { normalizeLocale, parseBlogPathname } from '@/utils/blogLocale';

/**
 * Blog locale source of truth:
 * 1) URL /{en|es|fr}/blog...
 * 2) explicit prop (SSR)
 * 3) intl / language switcher
 */
export function useBlogLocale(localeProp) {
    const intl = useIntl();
    const pathname = usePathname();
    const fromUrl = parseBlogPathname(pathname)?.locale;
    return normalizeLocale(fromUrl || localeProp || intl.locale);
}
