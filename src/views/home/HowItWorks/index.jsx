'use client';
import image2 from '@/../public/icons/booking-online.png';
import image1 from '@/../public/icons/browsing.png';
import image3 from '@/../public/icons/satisfaction.png';
import Image from 'next/image';
import { FormattedMessage, useIntl } from 'react-intl';
import './style.scss';

const HowItWorks = () => {
    const intl = useIntl();

    return (
        <section className="how-it-works">
            <div className="container">
                <h2 className="section-heading">
                    <FormattedMessage
                        id="home.howItWorks.heading"
                        values={{ span: (chunks) => <span>{chunks}</span> }}
                    />
                </h2>
                <p className="section-desc">{intl.formatMessage({ id: 'home.howItWorks.desc' })}</p>
                <div className="cards">
                    <div className="work-card">
                        <div className="img-box">
                            <Image src={image1} alt="Browse Local Sitters" />
                        </div>
                        <h3>{intl.formatMessage({ id: 'home.howItWorks.card1.title' })}</h3>
                        <p>{intl.formatMessage({ id: 'home.howItWorks.card1.desc' })}</p>
                    </div>
                    <div className="work-card">
                        <div className="img-box">
                            <Image src={image2} alt="Book With Confidence" />
                        </div>
                        <h3>{intl.formatMessage({ id: 'home.howItWorks.card2.title' })}</h3>
                        <p>{intl.formatMessage({ id: 'home.howItWorks.card2.desc' })}</p>
                    </div>
                    <div className="work-card">
                        <div className="img-box">
                            <Image src={image3} alt="Enjoy Peace of Mind" />
                        </div>
                        <h3>{intl.formatMessage({ id: 'home.howItWorks.card3.title' })}</h3>
                        <p>{intl.formatMessage({ id: 'home.howItWorks.card3.desc' })}</p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HowItWorks;
