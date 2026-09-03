'use client';

import { useIntl } from 'react-intl';
import './style.scss';

const TermsAndConditionsSection = () => {
    const intl = useIntl();

    // Generate section array for easy rendering
    const sectionKeys = [
        { titleId: 'terms.sections.sec1_title', contentId: 'terms.sections.sec1_content' },
        { titleId: 'terms.sections.sec2_title', contentId: 'terms.sections.sec2_content' },
        { titleId: 'terms.sections.sec3_title', contentId: 'terms.sections.sec3_content' },
        { titleId: 'terms.sections.sec4_title', contentId: 'terms.sections.sec4_content' },
        { titleId: 'terms.sections.sec5_title', contentId: 'terms.sections.sec5_content' },
        { titleId: 'terms.sections.sec6_title', contentId: 'terms.sections.sec6_content' },
        { titleId: 'terms.sections.sec7_title', contentId: 'terms.sections.sec7_content' },
        { titleId: 'terms.sections.sec8_title', contentId: 'terms.sections.sec8_content' },
    ];

    return (
        <section className="terms-conditions-section">
            <div className="container">
                <h1 className="terms-title">{intl.formatMessage({ id: 'terms.title' })}</h1>
                <div className="terms-meta">{intl.formatMessage({ id: 'terms.lastUpdated' })}</div>

                <div className="terms-content">
                    <p className="terms-intro">{intl.formatMessage({ id: 'terms.subtitle' })}</p>

                    {sectionKeys.map((section, index) => (
                        <div key={index} className="terms-section-block">
                            <h2>{intl.formatMessage({ id: section.titleId })}</h2>
                            <p>{intl.formatMessage({ id: section.contentId })}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default TermsAndConditionsSection;
