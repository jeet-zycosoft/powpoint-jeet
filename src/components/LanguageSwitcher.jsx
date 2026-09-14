'use client';

import { useLanguage } from '@/app/LocalIntlProvider';
import { useEffect, useRef, useState } from 'react';
import { IoCheckmark, IoChevronDown, IoLanguage } from 'react-icons/io5';
import { useIntl } from 'react-intl';
import { usePathname } from 'next/navigation';
import {
    blogListPath,
    blogPostPath,
    getBlogLocaleSlugs,
    normalizeLocale,
    parseBlogPathname,
} from '@/utils/blogLocale';
import { publicService } from '@/services/publicService';
import './LanguageSwitcher.scss';

const LOCALES = [
    { code: 'en', labelId: 'language.english', short: 'EN' },
    { code: 'es', labelId: 'language.spanish', short: 'ES' },
    { code: 'fr', labelId: 'language.french', short: 'FR' },
];

function persistLocale(code) {
    window.localStorage.setItem('language', code);
    document.cookie = `language=${code};path=/;max-age=31536000;SameSite=Lax`;
    document.documentElement.lang = code;
}

export default function LanguageSwitcher() {
    const { locale, changeLanguage } = useLanguage();
    const intl = useIntl();
    const pathname = usePathname();
    const [open, setOpen] = useState(false);
    const [switching, setSwitching] = useState(false);
    const rootRef = useRef(null);

    const current = LOCALES.find((item) => item.code === locale) || LOCALES[0];

    useEffect(() => {
        if (!open) return undefined;

        const onPointerDown = (event) => {
            if (rootRef.current && !rootRef.current.contains(event.target)) {
                setOpen(false);
            }
        };
        const onKeyDown = (event) => {
            if (event.key === 'Escape') setOpen(false);
        };

        document.addEventListener('pointerdown', onPointerDown);
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('pointerdown', onPointerDown);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [open]);

    // Keep UI language aligned with /{locale}/blog URL after navigation
    useEffect(() => {
        const parsed = parseBlogPathname(pathname);
        if (!parsed) return;
        if (parsed.locale !== normalizeLocale(locale)) {
            changeLanguage(parsed.locale);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname]);

    const resolveTargetUrl = async (newLocale) => {
        const parsed = parseBlogPathname(pathname);

        if (!parsed) {
            // Non-blog pages: stay on same path, hard refresh applies new locale everywhere
            return `${pathname}${window.location.search || ''}`;
        }

        if (!parsed.slug) {
            return blogListPath(newLocale);
        }

        try {
            const res = await publicService.blogDetail({
                slug: parsed.slug,
                locale: newLocale,
            });
            const blog = res?.data;
            const slugMap = getBlogLocaleSlugs(blog, newLocale);
            const nextSlug = slugMap[newLocale] || blog?.slug || parsed.slug;
            return blogPostPath(newLocale, nextSlug);
        } catch {
            return blogPostPath(newLocale, parsed.slug);
        }
    };

    const handleSelect = async (code) => {
        if (switching) return;
        if (code === locale) {
            setOpen(false);
            return;
        }

        setSwitching(true);
        setOpen(false);

        try {
            persistLocale(code);
            changeLanguage(code);
            const target = await resolveTargetUrl(code);
            // Full page refresh so SSR + APIs + dropdown all use the new language
            window.location.assign(target);
        } catch (err) {
            console.error('Language switch failed:', err);
            setSwitching(false);
        }
    };

    return (
        <div className={`lang-switcher${open ? ' is-open' : ''}`} ref={rootRef}>
            <button
                type="button"
                className="lang-switcher__trigger"
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-label={intl.formatMessage({ id: current.labelId })}
                onClick={() => setOpen((prev) => !prev)}
                disabled={switching}
            >
                <IoLanguage className="lang-switcher__icon" aria-hidden />
                <span className="lang-switcher__code">{current.short}</span>
                <IoChevronDown className="lang-switcher__chevron" aria-hidden />
            </button>

            {open && (
                <ul className="lang-switcher__menu" role="listbox" aria-label="Language">
                    {LOCALES.map((item) => {
                        const isActive = item.code === locale;
                        return (
                            <li key={item.code} role="option" aria-selected={isActive}>
                                <button
                                    type="button"
                                    className={`lang-switcher__option${isActive ? ' is-active' : ''}`}
                                    onClick={() => handleSelect(item.code)}
                                >
                                    <span className="lang-switcher__option-short">{item.short}</span>
                                    <span className="lang-switcher__option-label">
                                        {intl.formatMessage({ id: item.labelId })}
                                    </span>
                                    {isActive && (
                                        <IoCheckmark className="lang-switcher__check" aria-hidden />
                                    )}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
