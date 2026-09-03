'use client';
import Image from 'next/image';
import Link from 'next/link';
import './style.scss';

import { authService } from '@/services/authService';
import { isFooterCityPath } from '@/data/footerLocations';
import { evaluateProfileCompletion, getIncompleteProfileToast } from '@/services/profileCompletion';
import {
    clearPendingSearchLocation,
    updateFilters,
    updateSearchResults,
} from '@/store/features/filter/filterSlice';
import { selectSiteSettings } from '@/store/features/siteSettings/siteSettingsSlice';
import { logout, selectUser } from '@/store/features/user/userSlice';
import { useQueryClient } from '@tanstack/react-query';
import { jwtDecode } from 'jwt-decode';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';

import LocalIntlProvider from '@/app/LocalIntlProvider';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import OffcanvasProfile from '@/components/OffcanvasProfile';
import ProfileDropdown from '@/components/ProfileDropdown';
import { Button, Container, Nav, Navbar, Offcanvas } from 'react-bootstrap';
import logo from '@/../public/logo.webp';
import { useIntl } from 'react-intl';
import baseMessages from './intl.yaml';
import en from './translations/en.yaml';
import es from './translations/es.yaml';
import fr from './translations/fr.yaml';

const messages = {
    ...baseMessages,
    en: { ...baseMessages?.en, ...en },
    es: { ...baseMessages?.es, ...es },
    fr: { ...baseMessages?.fr, ...fr },
};

const FiMenu = () => (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="24" cy="24" r="24" fill="#4A766E" />
        <line
            x1="11.25"
            y1="15.75"
            x2="37.5"
            y2="15.75"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
        />
        <path d="M17.25 24.75H38.25" stroke="white" strokeWidth="3" strokeLinecap="round" />
        <line
            x1="11.25"
            y1="32.25"
            x2="37.5"
            y2="32.25"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
        />
    </svg>
);

const isNavActive = (pathname, href) => {
    if (href === '/' || href === '/sitter') return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
};

const HeaderInner = () => {
    const [show, setShow] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const { isAuthenticated, userInfo, token, serviceDetails } = useSelector(selectUser);
    const siteSettings = useSelector(selectSiteSettings);
    const intl = useIntl();
    const dispatch = useDispatch();
    const router = useRouter();
    const pathname = usePathname();
    const queryClient = useQueryClient();

    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    const handleLogout = async () => {
        try {
            // Call while the current token is still available
            await authService.logout();
        } catch {
            // Still clear local session even if the API call fails
        }

        dispatch(logout());
        dispatch(updateFilters({}));
        dispatch(updateSearchResults([]));
        dispatch(clearPendingSearchLocation());
        queryClient.clear();

        router.push('/login');
    };

    const isLoggedIn = isMounted && isAuthenticated;
    const isSitter = isLoggedIn && userInfo?.user_type === 'S';
    const listingLink = isSitter
        ? { href: '/owner/listing', labelId: 'header.findOwner', gated: true }
        : { href: '/sitter/listing', labelId: 'header.findSitter', gated: true };
    const sharedNavLinks = [
        { href: '/blog', labelId: 'header.blog' },
        { href: '/contact', labelId: 'header.support' },
    ];
    const navLinks = isLoggedIn
        ? [
              listingLink,
              { href: '/conversations', labelId: 'header.conversations' },
              { href: '/favorites', labelId: 'header.favorites' },
              ...sharedNavLinks,
          ]
        : [
              { href: '/', labelId: 'header.home' },
              listingLink,
              { href: '/sitter', labelId: 'header.becomeSitter' },
              ...sharedNavLinks,
          ];

    const handleGatedListingNav = (e, href) => {
        if (!isAuthenticated || !userInfo) return;
        const completion = evaluateProfileCompletion({
            userType: userInfo.user_type,
            userInfo,
            serviceDetails,
        });
        if (completion.isComplete) return;

        e.preventDefault();
        toast.info(intl.formatMessage(getIncompleteProfileToast(completion)));
        router.push(completion.setupPath);
        handleClose();
    };

    const isPublicRoute =
        pathname === '/' ||
        pathname.startsWith('/sitter/listing') ||
        pathname.startsWith('/customer/listing') ||
        isFooterCityPath(pathname) ||
        pathname.startsWith('/blog') ||
        pathname.startsWith('/contact') ||
        pathname === '/sitter' ||
        pathname.startsWith('/worker-details') ||
        pathname.startsWith('/faq') ||
        pathname.startsWith('/privacy') ||
        pathname.startsWith('/terms');

    useEffect(() => {
        if (!isAuthenticated) return;

        const clearSession = () => {
            dispatch(logout());
            dispatch(updateFilters({}));
            dispatch(updateSearchResults([]));
            dispatch(clearPendingSearchLocation());
            queryClient.clear();
            if (!isPublicRoute) {
                router.push('/login');
            }
        };

        if (!token) {
            clearSession();
            return;
        }
        try {
            const decoded = jwtDecode(token);
            const currentTime = Date.now() / 1000;
            if (decoded.exp && decoded.exp < currentTime) {
                clearSession();
            }
        } catch (error) {
            console.error('Error decoding token:', error);
            clearSession();
        }
    }, [isAuthenticated, token, dispatch, router, isPublicRoute, queryClient]);

    useEffect(() => {
        setIsMounted(true);
        const topHeader = document.querySelector('#header');

        window.onscroll = () => {
            if (window.scrollY > 0) {
                topHeader.classList.add('isSticky');
                topHeader.classList.remove('notSticky');
            } else {
                topHeader.classList.add('notSticky');
                topHeader.classList.remove('isSticky');
            }
        };
    }, []);

    return (
        <header id={`header`} className={`header`}>
            <Navbar expand="lg">
                <Container className="d-flex justify-content-between">
                    <Navbar.Brand href="/">
                        {siteSettings?.header_logo ? (
                            <Image
                                src={siteSettings.header_logo}
                                alt={intl.formatMessage({ id: 'header.logoAlt' })}
                                className="header-logo-img"
                                width={170}
                                height={150}
                                fetchPriority="high"
                                priority={true}
                            />
                        ) : (
                            <Image
                                src={logo}
                                alt={intl.formatMessage({ id: 'header.logoAlt' })}
                                className="header-logo-img"
                                width={170}
                                height={150}
                                fetchPriority="high"
                                priority={true}
                            />
                        )}
                    </Navbar.Brand>

                    <div className="d-flex align-items-center column-gap-3">
                        <Nav className="header-links d-flex justify-content-between align-items-center gap-4">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`nav-list__item${isNavActive(pathname, link.href) ? ' active' : ''}`}
                                    onClick={(e) => {
                                        if (link.gated) handleGatedListingNav(e, link.href);
                                    }}
                                >
                                    {intl.formatMessage({ id: link.labelId })}
                                </Link>
                            ))}
                        </Nav>
                        {/* ============================================================================================= */}
                        {isMounted && isAuthenticated && (
                            <div className="d-none d-lg-block">
                                <ProfileDropdown userInfo={userInfo} onLogout={handleLogout} />
                            </div>
                        )}
                        {(!isMounted || !isAuthenticated) && (
                            <Link
                                href={'/login'}
                                className="header__login_signup d-none d-lg-block"
                            >
                                {intl.formatMessage({ id: 'header.login' })}
                            </Link>
                        )}
                        {/* ============================================================================================= */}

                        {/* Offcanvas --btn*/}
                        <div className="d-lg-none">
                            <LanguageSwitcher />
                        </div>
                        <Button
                            variant=""
                            className="header-hamburger d-lg-none p-0"
                            onClick={handleShow}
                        >
                            <FiMenu />
                        </Button>
                        {/* Offcanvas --btn*/}
                        <div className="d-none d-lg-block">
                            <LanguageSwitcher />
                        </div>
                    </div>

                    {/* Offcanvas -mobile*/}
                    <Offcanvas
                        show={show}
                        onHide={handleClose}
                        placement={'end'}
                        className="mobile-header-offcanvas"
                    >
                        <Offcanvas.Header closeButton>
                            <Offcanvas.Title>
                                {siteSettings?.header_logo ? (
                                    <Image
                                        src={siteSettings.header_logo}
                                        alt={intl.formatMessage({ id: 'header.logoAlt' })}
                                        className="offcanvas-logo"
                                        width={170}
                                        height={150}
                                        fetchPriority="high"
                                        priority={true}
                                    />
                                ) : (
                                    <Image
                                        src={logo}
                                        alt={intl.formatMessage({ id: 'header.logoAlt' })}
                                        className="offcanvas-logo"
                                        width={170}
                                        height={150}
                                        fetchPriority="high"
                                        priority={true}
                                    />
                                )}
                            </Offcanvas.Title>
                        </Offcanvas.Header>
                        <Offcanvas.Body>
                            <Nav className="d-flex flex-column offcanvas-list w-100 p-0">
                                {isMounted && isAuthenticated && (
                                    <OffcanvasProfile
                                        userInfo={userInfo}
                                        handleClose={handleClose}
                                        handleLogout={handleLogout}
                                    />
                                )}
                                {navLinks.map((link) => (
                                    <Link
                                        key={`mobile-${link.href}`}
                                        href={link.href}
                                        className={`offcanvas-list__item${isNavActive(pathname, link.href) ? ' active' : ''}`}
                                        onClick={(e) => {
                                            if (link.gated) handleGatedListingNav(e, link.href);
                                            else handleClose();
                                        }}
                                    >
                                        <span>{intl.formatMessage({ id: link.labelId })}</span>
                                    </Link>
                                ))}
                                {(!isMounted || !isAuthenticated) && (
                                    <Link
                                        href={'/login'}
                                        className="header__login_signup ms-0 mt-4"
                                        style={{ borderRadius: '6px', padding: '12px 24px' }}
                                        onClick={handleClose}
                                    >
                                        {intl.formatMessage({ id: 'header.login' })}
                                    </Link>
                                )}
                            </Nav>
                        </Offcanvas.Body>
                    </Offcanvas>
                    {/* Offcanvas -mobile*/}
                </Container>
            </Navbar>
        </header>
    );
};

const Header = () => {
    return (
        <LocalIntlProvider messages={messages}>
            <HeaderInner />
        </LocalIntlProvider>
    );
};

export default Header;
