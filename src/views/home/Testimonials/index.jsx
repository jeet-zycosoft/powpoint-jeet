'use client';
import TestimonialCard from '@/components/TestimonialCard';
import './style.scss';

import 'swiper/css';
import 'swiper/css/navigation';
import { Navigation } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';

const testimonials = [
    {
        name: 'Emma',
        location: 'Brighton',
        companyName: 'feedback company',
        rating: 3.8,
        feedback:
            'D Our sitter was amazing - daily updates, photos, and a very happy dog when we got home!',
        image: '40?img=1',
    },
    {
        name: 'Emma',
        location: 'Brighton',
        companyName: 'feedback company',
        rating: 3.8,
        feedback:
            'D Our sitter was amazing - daily updates, photos, and a very happy dog when we got home!',
        image: '40?img=1',
    },
    {
        name: 'Emma',
        location: 'Brighton',
        companyName: 'feedback company',
        rating: 3.8,
        feedback:
            'D Our sitter was amazing - daily updates, photos, and a very happy dog when we got home!',
        image: '40?img=1',
    },
];

import { FormattedMessage, useIntl } from 'react-intl';

const arrowBtn = (
    <svg
        className="swiper-navigation-icon"
        width="11"
        height="20"
        viewBox="0 0 11 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            d="M0.38296 20.0762C0.111788 19.805 0.111788 19.3654 0.38296 19.0942L9.19758 10.2796L0.38296 1.46497C0.111788 1.19379 0.111788 0.754138 0.38296 0.482966C0.654131 0.211794 1.09379 0.211794 1.36496 0.482966L10.4341 9.55214C10.8359 9.9539 10.8359 10.6053 10.4341 11.007L1.36496 20.0762C1.09379 20.3474 0.654131 20.3474 0.38296 20.0762Z"
            fill="currentColor"
        ></path>
    </svg>
);

const Testimonials = () => {
    const intl = useIntl();

    return (
        <section className="testimonials">
            <div className="container">
                <h2 className="section-heading">
                    <FormattedMessage
                        id="home.testimonials.heading"
                        values={{ span: (chunks) => <span>{chunks}</span> }}
                    />
                </h2>
                <p className="section-desc">
                    {intl.formatMessage({ id: 'home.testimonials.desc' })}
                </p>
                <div className="position-relative">
                    <Swiper
                        modules={[Navigation]}
                        navigation={{
                            prevEl: '.ts1',
                            nextEl: '.ts2',
                        }}
                        spaceBetween={30}
                        slidesPerView={2}
                        loop={true}
                        breakpoints={{
                            320: {
                                slidesPerView: 1,
                                spaceBetween: 10,
                            },
                            768: {
                                slidesPerView: 2,
                                spaceBetween: 20,
                            },
                            1024: {
                                slidesPerView: 2,
                                spaceBetween: 30,
                            },
                        }}
                    >
                        {testimonials.map((testimonial, index) => (
                            <SwiperSlide key={index}>
                                <TestimonialCard data={testimonial} />
                            </SwiperSlide>
                        ))}
                    </Swiper>
                    <div className="swiper-button-prev ts1">{arrowBtn}</div>
                    <div className="swiper-button-next ts2">{arrowBtn}</div>
                </div>
            </div>
        </section>
    );
};

export default Testimonials;
