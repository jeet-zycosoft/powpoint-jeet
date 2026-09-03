'use client';
import { FormattedMessage, useIntl } from 'react-intl';
import './style.scss';

const About = () => {
    const intl = useIntl();

    return (
        <section className="about">
            <div className="container">
                <div className="image-container">
                    <img src="/images/about.png" alt="Woman with a dog" />
                </div>
                <div className="text-container">
                    <h2 className="section-heading">
                        <FormattedMessage
                            id="home.about.heading"
                            values={{
                                br: <br />,
                                span: (chunks) => <span>{chunks}</span>,
                            }}
                        />
                    </h2>
                    <p>
                        <FormattedMessage
                            id="home.about.p1"
                            values={{
                                br: <br />,
                                span: (chunks) => <span>{chunks}</span>,
                            }}
                        />
                    </p>
                    <button className="btn-primary">
                        {intl.formatMessage({ id: 'home.about.button' })}
                    </button>
                </div>
            </div>
        </section>
    );
};

export default About;
