'use client';

import { useLanguage } from '@/app/LocalIntlProvider';
import { useEffect, useRef, useState } from 'react';
import { IoCheckmark, IoChevronDown, IoLanguage } from 'react-icons/io5';
import { useIntl } from 'react-intl';
import './LanguageSwitcher.scss';

const LOCALES = [
    { code: 'en', labelId: 'language.english', short: 'EN' },
    { code: 'es', labelId: 'language.spanish', short: 'ES' },
    { code: 'fr', labelId: 'language.french', short: 'FR' },
];

export default function LanguageSwitcher() {
    const { locale, changeLanguage } = useLanguage();
    const intl = useIntl();
    const [open, setOpen] = useState(false);
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

    const handleSelect = (code) => {
        changeLanguage(code);
        setOpen(false);
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
