'use client';
import LocalIntlProvider from '@/app/LocalIntlProvider';
import FOOTER_LOCATIONS, { getFooterCityPath, toCitySlug } from '@/data/footerLocations';
import { selectUser } from '@/store/features/user/userSlice';
import { selectSiteSettings } from '@/store/features/siteSettings/siteSettingsSlice';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useIntl } from 'react-intl';
import { useSelector } from 'react-redux';
import {
    FaEnvelope,
    FaFacebookF,
    FaInstagram,
    FaMapMarkerAlt,
    FaPhoneAlt,
    FaYoutube,
} from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import logo from '@/../public/logo.webp';
import baseMessages from './intl.yaml';
import en from './translations/en.yaml';
import es from './translations/es.yaml';
import fr from './translations/fr.yaml';
import './style.scss';

const messages = {
    ...baseMessages,
    en: { ...baseMessages?.en, ...en },
    es: { ...baseMessages?.es, ...es },
    fr: { ...baseMessages?.fr, ...fr },
};

const DEFAULT_SOCIAL = {
    facebook_link: 'https://facebook.com',
    x_link: 'https://x.com',
    instagram_link: 'https://instagram.com',
    youtube_link: 'https://youtube.com',
};

const FooterInner = () => {
    const intl = useIntl();
    const pathname = usePathname();
    const { isAuthenticated, userInfo } = useSelector(selectUser);
    const siteSettings = useSelector(selectSiteSettings);
    const isSitter = isAuthenticated && userInfo?.user_type === 'S';
    const activeCitySlug = String(pathname || '')
        .replace(/^\//, '')
        .split('/')[0];
    const logoUrl = siteSettings?.footer_logo || siteSettings?.header_logo;

    const hasSocialLinks =
        Boolean(siteSettings?.facebook_link) ||
        Boolean(siteSettings?.x_link) ||
        Boolean(siteSettings?.instagram_link) ||
        Boolean(siteSettings?.youtube_link);

    const socialLinks = [
        {
            key: 'facebook',
            href: siteSettings?.facebook_link || (!hasSocialLinks && DEFAULT_SOCIAL.facebook_link),
            icon: FaFacebookF,
            labelId: 'footer.social.facebook',
        },
        {
            key: 'twitter',
            href: siteSettings?.x_link || (!hasSocialLinks && DEFAULT_SOCIAL.x_link),
            icon: FaXTwitter,
            labelId: 'footer.social.twitter',
        },
        {
            key: 'instagram',
            href:
                siteSettings?.instagram_link || (!hasSocialLinks && DEFAULT_SOCIAL.instagram_link),
            icon: FaInstagram,
            labelId: 'footer.social.instagram',
        },
        {
            key: 'youtube',
            href: siteSettings?.youtube_link || (!hasSocialLinks && DEFAULT_SOCIAL.youtube_link),
            icon: FaYoutube,
            labelId: 'footer.social.youtube',
        },
    ].filter((item) => Boolean(item.href));

    const contactItems = [
        siteSettings?.email
            ? {
                  key: 'email',
                  href: `mailto:${siteSettings.email}`,
                  icon: FaEnvelope,
                  label: siteSettings.email,
                  ariaId: 'footer.emailAria',
              }
            : null,
        siteSettings?.number
            ? {
                  key: 'phone',
                  href: `tel:${siteSettings.number}`,
                  icon: FaPhoneAlt,
                  label: siteSettings.number,
                  ariaId: 'footer.phoneAria',
              }
            : null,
        siteSettings?.location
            ? {
                  key: 'location',
                  href: siteSettings?.map_link || null,
                  icon: FaMapMarkerAlt,
                  label: siteSettings.location,
                  ariaId: 'footer.locationAria',
                  external: Boolean(siteSettings?.map_link),
              }
            : null,
    ].filter(Boolean);

    return (
        <footer className={`site-footer${isSitter ? ' is-sitter' : ''}`}>
            {!isSitter && (
                <section className="footer-cities">
                    <div className="container">
                        <h2 className="footer-cities__heading">
                            {intl.formatMessage({ id: 'footer.citiesHeading' })}
                        </h2>
                        <div className="footer-cities__grid">
                            {FOOTER_LOCATIONS.map((location) => {
                                const cityPath = getFooterCityPath(location);
                                const isActive = activeCitySlug === toCitySlug(location.name);
                                return (
                                    <Link
                                        key={location.query}
                                        href={cityPath}
                                        className={`footer-cities__link${isActive ? ' is-active' : ''}`}
                                        aria-current={isActive ? 'page' : undefined}
                                    >
                                        {intl.formatMessage(
                                            { id: 'footer.cityLink' },
                                            { city: location.name },
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </section>
            )}

            <section className="footer-main">
                <div className="container">
                    <div className="footer-main__row">
                        <div className="footer-brand">
                            <Link
                                href="/"
                                className="footer-brand__logo-link"
                                aria-label={intl.formatMessage({ id: 'footer.brandAria' })}
                            >
                                {logoUrl ? (
                                    <Image
                                        src={logoUrl}
                                        alt={intl.formatMessage({ id: 'footer.logoAlt' })}
                                        className="footer-brand__logo"
                                        width={170}
                                        height={64}
                                    />
                                ) : (
                                    <Image
                                        src={logo}
                                        alt={intl.formatMessage({ id: 'footer.logoAlt' })}
                                        className="footer-brand__logo"
                                        width={170}
                                        height={64}
                                    />
                                )}
                            </Link>
                        </div>

                        {contactItems.length > 0 && (
                            <ul className="footer-contact">
                                {contactItems.map((item) => {
                                    const Icon = item.icon;
                                    const inner = (
                                        <>
                                            <span className="footer-contact__icon" aria-hidden>
                                                <Icon />
                                            </span>
                                            <span className="footer-contact__text">
                                                {item.label}
                                            </span>
                                        </>
                                    );

                                    return (
                                        <li key={item.key} className="footer-contact__item">
                                            {item.href ? (
                                                <Link
                                                    href={item.href}
                                                    className="footer-contact__link"
                                                    target={item.external ? '_blank' : undefined}
                                                    rel={
                                                        item.external
                                                            ? 'noopener noreferrer'
                                                            : undefined
                                                    }
                                                    aria-label={intl.formatMessage({
                                                        id: item.ariaId,
                                                    })}
                                                >
                                                    {inner}
                                                </Link>
                                            ) : (
                                                <span className="footer-contact__link footer-contact__link--static">
                                                    {inner}
                                                </span>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        )}

                        {socialLinks.length > 0 && (
                            <div className="footer-social">
                                {socialLinks.map((social) => {
                                    const Icon = social.icon;
                                    return (
                                        <Link
                                            key={social.key}
                                            href={social.href}
                                            className="footer-social__item"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            aria-label={intl.formatMessage({
                                                id: social.labelId,
                                            })}
                                        >
                                            <Icon />
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </section>

            <div className="footer-copy">
                <div className="container">
                    <div className="footer-copy__row">
                        <p>
                            {intl.formatMessage(
                                { id: 'footer.copyright' },
                                { year: new Date().getFullYear() },
                            )}
                        </p>
                        <nav
                            className="footer-legal"
                            aria-label={intl.formatMessage({ id: 'footer.legalNavAria' })}
                        >
                            <Link href="/terms-and-conditions">
                                {intl.formatMessage({ id: 'footer.terms' })}
                            </Link>
                            <Link href="/privacy-policy">
                                {intl.formatMessage({ id: 'footer.privacy' })}
                            </Link>
                        </nav>
                    </div>
                </div>
            </div>
        </footer>
    );
};

const Footer = () => {
    return (
        <LocalIntlProvider messages={messages}>
            <FooterInner />
        </LocalIntlProvider>
    );
};

export default Footer;
