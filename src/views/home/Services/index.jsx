'use client';
import Image from 'next/image';
import { FormattedMessage, useIntl } from 'react-intl';
import './style.scss';

const Services = () => {
    const intl = useIntl();

    const services = [
        {
            icon: 'pet-boarding.png',
            title: intl.formatMessage({ id: 'home.searchBar.options.boarding' }),
            description: intl.formatMessage({ id: 'home.services.boarding.desc' }),
        },
        {
            icon: 'sitting.png',
            title: intl.formatMessage({ id: 'home.searchBar.options.sitting' }),
            description: intl.formatMessage({ id: 'home.services.sitting.desc' }),
        },
        {
            icon: 'walking.png',
            title: intl.formatMessage({ id: 'home.searchBar.options.walking' }),
            description: intl.formatMessage({ id: 'home.services.walking.desc' }),
        },
        {
            icon: 'day-care.png',
            title: intl.formatMessage({ id: 'home.searchBar.options.daycare' }),
            description: intl.formatMessage({ id: 'home.services.daycare.desc' }),
        },
    ];

    return (
        <section className="pet-sitting-services">
            <div className="container">
                <h2 className="section-heading">
                    <FormattedMessage
                        id="home.services.heading"
                        values={{ span: (chunks) => <span>{chunks}</span> }}
                    />
                </h2>
                <p className="section-desc">{intl.formatMessage({ id: 'home.services.desc' })}</p>

                <div className="services-grid">
                    {services.map((service, index) => (
                        <div className="service-card" key={index}>
                            <Image
                                src={`/icons/${service.icon}`}
                                alt={service.title}
                                width={64}
                                height={64}
                            />
                            <h3>{service.title}</h3>
                            <p>{service.description}</p>
                        </div>
                    ))}
                </div>
                <div className="d-flex justify-content-center">
                    <button className="btn-primary">
                        {intl.formatMessage({ id: 'home.services.button' })}
                    </button>
                </div>
            </div>
        </section>
    );
};

export default Services;
