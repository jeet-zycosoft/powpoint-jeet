'use client';
import logo from '@/../public/logo.webp';
import { selectSiteSettings } from '@/store/features/siteSettings/siteSettingsSlice';
import Image from 'next/image';
import Link from 'next/link';
import { useIntl } from 'react-intl';
import { useSelector } from 'react-redux';

const AuthLogo = () => {
    const intl = useIntl();
    const t = (id, values) => intl.formatMessage({ id }, values);
    const siteSettings = useSelector(selectSiteSettings);
    const logoUrl = siteSettings?.header_logo;

    return (
        <Link href="/" className="auth-logo" aria-label={t('authLogo.homeAria')}>
            {logoUrl ? (
                <Image
                    src={logoUrl}
                    alt={t('authLogo.logoAlt')}
                    width={170}
                    height={64}
                    priority
                />
            ) : (
                <Image src={logo} alt={t('authLogo.logoAlt')} width={170} height={64} priority />
            )}
        </Link>
    );
};

export default AuthLogo;
