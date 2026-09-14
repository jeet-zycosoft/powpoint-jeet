'use client';
import { useEffect, useState } from 'react';
import BlogCard from '@/components/blogCard';
import { publicService } from '@/services/publicService';
import { normalizeLocale } from '@/utils/blogLocale';
import { FormattedMessage, useIntl } from 'react-intl';
import 'swiper/css';
import 'swiper/css/navigation';
import { Navigation } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import './style.scss';

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

const BlogSection = () => {
    const intl = useIntl();
    const locale = normalizeLocale(intl.locale);
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        const fetchBlogs = async () => {
            try {
                setLoading(true);
                const res = await publicService.blogs({ locale, per_page: 10, page: 1 });
                if (cancelled) return;
                if (res?.data && Array.isArray(res.data)) {
                    setBlogs(res.data);
                } else if (res?.status && Array.isArray(res?.data?.data)) {
                    setBlogs(res.data.data);
                } else {
                    setBlogs([]);
                }
            } catch (err) {
                console.error('Error fetching home blogs:', err);
                if (!cancelled) setBlogs([]);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchBlogs();
        return () => {
            cancelled = true;
        };
    }, [locale]);

    if (!loading && blogs.length === 0) {
        return null;
    }

    return (
        <section className="blog-section">
            <div className="container">
                <h2 className="section-heading">
                    <FormattedMessage
                        id="home.blog.heading"
                        values={{ span: (chunks) => <span>{chunks}</span> }}
                    />
                </h2>
                <p className="section-desc">{intl.formatMessage({ id: 'home.blog.desc' })}</p>
                <div className="position-relative">
                    {loading ? (
                        <div className="text-center py-4 text-muted">Loading articles...</div>
                    ) : (
                        <>
                            <Swiper
                                modules={[Navigation]}
                                navigation={{
                                    prevEl: '.bb1',
                                    nextEl: '.bb2',
                                }}
                                spaceBetween={30}
                                slidesPerView={3}
                                loop={false}
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
                                        slidesPerView: 3,
                                        spaceBetween: 30,
                                    },
                                }}
                            >
                                {blogs.map((blog) => (
                                    <SwiperSlide key={blog.id}>
                                        <BlogCard blog={blog} />
                                    </SwiperSlide>
                                ))}
                            </Swiper>
                            <div className="swiper-button-prev bb1">{arrowBtn}</div>
                            <div className="swiper-button-next bb2">{arrowBtn}</div>
                        </>
                    )}
                </div>
            </div>
        </section>
    );
};

export default BlogSection;
