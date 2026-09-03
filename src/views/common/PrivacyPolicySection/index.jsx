'use client';

import { useIntl } from 'react-intl';
import './style.scss';

const PrivacyPolicySection = () => {
    const intl = useIntl();

    return (
        <section className="privacy-policy-section">
            <div className="container">
                <h1 className="policy-title">{intl.formatMessage({ id: 'privacy.title' })}</h1>
                <div className="policy-meta">{intl.formatMessage({ id: 'privacy.lastUpdated' })}</div>

                <div className="policy-content">
                    <p>{intl.formatMessage({ id: 'privacy.intro' })}</p>

                    <h2>{intl.formatMessage({ id: 'privacy.sections.sec1_title' })}</h2>
                    <p>{intl.formatMessage({ id: 'privacy.sections.sec1_desc' })}</p>
                    <ul>
                        <li>
                            <strong>{intl.formatMessage({ id: 'privacy.sections.sec1_account_label' })} </strong>
                            {intl.formatMessage({ id: 'privacy.sections.sec1_account_text' })}
                        </li>
                        <li>
                            <strong>{intl.formatMessage({ id: 'privacy.sections.sec1_profile_label' })} </strong>
                            {intl.formatMessage({ id: 'privacy.sections.sec1_profile_text' })}
                        </li>
                        <li>
                            <strong>{intl.formatMessage({ id: 'privacy.sections.sec1_comm_label' })} </strong>
                            {intl.formatMessage({ id: 'privacy.sections.sec1_comm_text' })}
                        </li>
                    </ul>

                    <h2>{intl.formatMessage({ id: 'privacy.sections.sec2_title' })}</h2>
                    <p>{intl.formatMessage({ id: 'privacy.sections.sec2_desc' })}</p>
                    <ul>
                        <li>{intl.formatMessage({ id: 'privacy.sections.sec2_item1' })}</li>
                        <li>{intl.formatMessage({ id: 'privacy.sections.sec2_item2' })}</li>
                        <li>{intl.formatMessage({ id: 'privacy.sections.sec2_item3' })}</li>
                        <li>{intl.formatMessage({ id: 'privacy.sections.sec2_item4' })}</li>
                    </ul>

                    <h2>{intl.formatMessage({ id: 'privacy.sections.sec3_title' })}</h2>
                    <p>{intl.formatMessage({ id: 'privacy.sections.sec3_desc' })}</p>
                    <ul>
                        <li>
                            <strong>{intl.formatMessage({ id: 'privacy.sections.sec3_sharing_label' })} </strong>
                            {intl.formatMessage({ id: 'privacy.sections.sec3_sharing_text' })}
                        </li>
                        <li>
                            <strong>{intl.formatMessage({ id: 'privacy.sections.sec3_providers_label' })} </strong>
                            {intl.formatMessage({ id: 'privacy.sections.sec3_providers_text' })}
                        </li>
                        <li>
                            <strong>{intl.formatMessage({ id: 'privacy.sections.sec3_legal_label' })} </strong>
                            {intl.formatMessage({ id: 'privacy.sections.sec3_legal_text' })}
                        </li>
                    </ul>

                    <h2>{intl.formatMessage({ id: 'privacy.sections.sec4_title' })}</h2>
                    <p>{intl.formatMessage({ id: 'privacy.sections.sec4_content' })}</p>

                    <h2>{intl.formatMessage({ id: 'privacy.sections.sec5_title' })}</h2>
                    <p>{intl.formatMessage({ id: 'privacy.sections.sec5_content' })}</p>

                    <h2>{intl.formatMessage({ id: 'privacy.sections.sec6_title' })}</h2>
                    <p>{intl.formatMessage({ id: 'privacy.sections.sec6_content' })}</p>
                </div>
            </div>
        </section>
    );
};

export default PrivacyPolicySection;
