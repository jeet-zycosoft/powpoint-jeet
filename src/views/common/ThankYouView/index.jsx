'use client';

import checkCircle from '@/../public/icons/verify.png';
import pawIcon from '@/../public/icons/pawprint.png';
import Image from 'next/image';
import Link from 'next/link';
import { useIntl } from 'react-intl';
import './style.scss';

const ThankYouView = () => {
    const intl = useIntl();

    return (
        <section className="thank-you-section">
            <div className="container">
                <div className="thank-you-card">
                    <div className="icon-wrapper">
                        <div className="icon-circle">
                            <Image
                                src={checkCircle}
                                alt={intl.formatMessage({ id: 'thankYou.successAlt' })}
                                width={48}
                                height={48}
                                priority
                            />
                        </div>
                        <div className="paw-badge">
                            <Image
                                src={pawIcon}
                                alt={intl.formatMessage({ id: 'thankYou.pawBadgeAlt' })}
                                width={18}
                                height={18}
                            />
                        </div>
                    </div>

                    <h1 className="thank-you-title">{intl.formatMessage({ id: 'thankYou.title' })}</h1>
                    <p className="thank-you-description">
                        {intl.formatMessage({ id: 'thankYou.description' })}
                    </p>

                    <div className="action-buttons">
                        <Link href="/" className="primary-btn">
                            {intl.formatMessage({ id: 'thankYou.backHome' })}
                        </Link>
                        <Link href="/sitter/listing" className="secondary-btn">
                            {intl.formatMessage({ id: 'thankYou.findSitter' })}
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ThankYouView;
