'use client';

import './style.scss';

import Image from 'next/image';
import Link from 'next/link';
import { useIntl } from 'react-intl';
import 'swiper/css';
import 'swiper/css/navigation';

const Testimonials = () => {
    const intl = useIntl();

    return (
        <section className="testimonials">
            <div className="container-fluid p-0">
                <div className="row g-0">
                    <div className="col-md-6">
                        <div className="block">
                            <Image
                                src={'/images/worker-testimonial1.png'}
                                width={800}
                                height={600}
                                alt=""
                                className={''}
                            />
                            <div className="content">
                                <p className="message">
                                    {intl.formatMessage({ id: 'sitter.testimonials.message1' })}
                                </p>
                                <p className="location">
                                    {intl.formatMessage({ id: 'sitter.testimonials.location1' })}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className="block">
                            <Image
                                src={'/images/worker-testimonial2.png'}
                                width={800}
                                height={600}
                                alt=""
                                className={''}
                            />
                            <div className="content">
                                <p className="message">
                                    {intl.formatMessage({ id: 'sitter.testimonials.message2' })}
                                </p>
                                <p className="location">
                                    {intl.formatMessage({ id: 'sitter.testimonials.location2' })}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="container">
                <h2 className="section-heading">
                    {intl.formatMessage({ id: 'sitter.testimonials.heading' })}
                </h2>
                <p className="section-desc">
                    {intl.formatMessage({ id: 'sitter.testimonials.desc' })}
                </p>
                <Link href={'/signup'} className="btn-primary d-inline-block">
                    {intl.formatMessage({ id: 'sitter.testimonials.cta' })}
                </Link>
            </div>
        </section>
    );
};

export default Testimonials;
