'use client';
import TestimonialCard from '@/components/TestimonialCard';
import { FormattedMessage, useIntl } from 'react-intl';
import 'swiper/css';
import 'swiper/css/navigation';
import { Navigation } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import './style.scss';

const testimonials = [
    {
        name: 'Emma',
        location: 'Brighton',
        rating: 5,
        feedback:
            'Our sitter was amazing – daily updates, photos, and a very happy dog when we got home!',
        image: '40?img=1',
    },
    {
        name: 'James',
        location: 'London',
        rating: 5,
        feedback:
            'Booking was simple and our cat was so well cared for. We already booked the same sitter again.',
        image: '40?img=5',
    },
    {
        name: 'Sofia',
        location: 'Manchester',
        rating: 5,
        feedback:
            'Clear communication, trusted sitters, and real peace of mind while we were away. Highly recommend PawPoint.',
        image: '40?img=9',
    },
];

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
        <section className="home-testimonials" aria-labelledby="home-testimonials-heading">
            <div className="container">
                <h2 id="home-testimonials-heading" className="section-heading">
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
                            prevEl: '.home-testimonials .ts1',
                            nextEl: '.home-testimonials .ts2',
                        }}
                        spaceBetween={30}
                        slidesPerView={2}
                        loop={testimonials.length > 2}
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
                            <SwiperSlide key={`${testimonial.name}-${index}`}>
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
