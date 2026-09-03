'use client';

import Link from 'next/link';
import { FormattedMessage, useIntl } from 'react-intl';
import './style.scss';

const HowItWorks = () => {
    const intl = useIntl();

    return (
        <section className="how-it-works">
            <div className="container">
                <h2 className="section-heading">
                    <FormattedMessage
                        id="sitter.howItWorks.heading"
                        values={{ span: (chunks) => <span>{chunks}</span> }}
                    />
                </h2>
                <p className="section-desc">
                    {intl.formatMessage({ id: 'sitter.howItWorks.desc' })}
                </p>
                <div className="steps">
                    <div className="step">
                        <div className="step-number">1</div>
                        <h3>{intl.formatMessage({ id: 'sitter.howItWorks.step1Title' })}</h3>
                        <p>{intl.formatMessage({ id: 'sitter.howItWorks.step1Desc' })}</p>
                    </div>
                    <div className="step">
                        <div className="step-number">2</div>
                        <h3>{intl.formatMessage({ id: 'sitter.howItWorks.step2Title' })}</h3>
                        <p>{intl.formatMessage({ id: 'sitter.howItWorks.step2Desc' })}</p>
                    </div>
                    <div className="step">
                        <div className="step-number">3</div>
                        <h3>{intl.formatMessage({ id: 'sitter.howItWorks.step3Title' })}</h3>
                        <p>{intl.formatMessage({ id: 'sitter.howItWorks.step3Desc' })}</p>
                    </div>
                </div>
                <Link href={'/signup'} className="btn-primary">
                    {intl.formatMessage({ id: 'sitter.howItWorks.getStarted' })}
                </Link>
            </div>
        </section>
    );
};

export default HowItWorks;
