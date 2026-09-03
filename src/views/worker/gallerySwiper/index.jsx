'use client';

import { useId, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { FiChevronLeft, FiChevronRight, FiX } from 'react-icons/fi';
import { useIntl } from 'react-intl';
import 'swiper/css';
import 'swiper/css/navigation';
import { Navigation } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';

import './style.scss';

const getGalleryImageSrc = (img) => {
    if (!img) return '';
    let imgUrl = img;
    if (typeof img === 'object' && img.url) {
        imgUrl = img.url;
    }
    if (typeof imgUrl !== 'string' || !imgUrl.trim()) return '';
    return imgUrl;
};

function GallerySwiper({ galleryImages }) {
    const intl = useIntl();
    const uid = useId().replace(/:/g, '');
    const [lightboxIndex, setLightboxIndex] = useState(null);
    const [navState, setNavState] = useState({ isBeginning: true, isEnd: true });

    const images = useMemo(
        () => (galleryImages || []).map(getGalleryImageSrc).filter(Boolean),
        [galleryImages],
    );

    if (!images.length) return null;

    const prevClass = `gallery-arrow left gallery-arrow-${uid}-prev`;
    const nextClass = `gallery-arrow right gallery-arrow-${uid}-next`;
    const needsCarousel = images.length > 4;
    const showPrev = needsCarousel && !navState.isBeginning;
    const showNext = needsCarousel && !navState.isEnd;

    const openLightbox = (index) => setLightboxIndex(index);
    const closeLightbox = () => setLightboxIndex(null);
    const showPrevImage = (event) => {
        event.stopPropagation();
        setLightboxIndex((index) => (index > 0 ? index - 1 : images.length - 1));
    };
    const showNextImage = (event) => {
        event.stopPropagation();
        setLightboxIndex((index) => (index < images.length - 1 ? index + 1 : 0));
    };

    return (
        <div className="gallery-section">
            {needsCarousel ? (
                <button
                    type="button"
                    className={prevClass}
                    aria-label={intl.formatMessage({ id: 'sitter.gallery.prevPhotos' })}
                    style={{ visibility: showPrev ? 'visible' : 'hidden' }}
                >
                    <FiChevronLeft size={22} />
                </button>
            ) : null}
            <Swiper
                className="gallery-swiper"
                modules={[Navigation]}
                spaceBetween={16}
                slidesPerView={Math.min(4, images.length)}
                loop={false}
                watchOverflow
                navigation={
                    needsCarousel
                        ? {
                              nextEl: `.gallery-arrow-${uid}-next`,
                              prevEl: `.gallery-arrow-${uid}-prev`,
                          }
                        : false
                }
                onSwiper={(swiper) =>
                    setNavState({ isBeginning: swiper.isBeginning, isEnd: swiper.isEnd })
                }
                onSlideChange={(swiper) =>
                    setNavState({ isBeginning: swiper.isBeginning, isEnd: swiper.isEnd })
                }
                breakpoints={{
                    0: {
                        slidesPerView: 1,
                        spaceBetween: 10,
                    },
                    576: {
                        slidesPerView: 2,
                        spaceBetween: 12,
                    },
                    992: {
                        slidesPerView: Math.min(3, images.length),
                        spaceBetween: 14,
                    },
                    1200: {
                        slidesPerView: Math.min(4, images.length),
                        spaceBetween: 16,
                    },
                }}
            >
                {images.map((image, index) => (
                    <SwiperSlide key={`${image}-${index}`}>
                        <button
                            type="button"
                            className="gallery-slide-btn"
                            onClick={() => openLightbox(index)}
                        >
                            <img
                                src={image}
                                alt={intl.formatMessage(
                                    { id: 'sitter.gallery.imageAlt' },
                                    { number: index + 1 },
                                )}
                            />
                        </button>
                    </SwiperSlide>
                ))}
            </Swiper>
            {needsCarousel ? (
                <button
                    type="button"
                    className={nextClass}
                    aria-label={intl.formatMessage({ id: 'sitter.gallery.nextPhotos' })}
                    style={{ visibility: showNext ? 'visible' : 'hidden' }}
                >
                    <FiChevronRight size={22} />
                </button>
            ) : null}

            {lightboxIndex !== null &&
                createPortal(
                    <div className="gallery-lightbox" onClick={closeLightbox}>
                        <button
                            type="button"
                            className="gallery-lightbox__close"
                            onClick={closeLightbox}
                            aria-label={intl.formatMessage({ id: 'sitter.gallery.closeImage' })}
                        >
                            <FiX size={24} />
                        </button>
                        {images.length > 1 && (
                            <button
                                type="button"
                                className="gallery-lightbox__nav gallery-lightbox__nav--prev"
                                onClick={showPrevImage}
                                aria-label={intl.formatMessage({ id: 'sitter.gallery.prevImage' })}
                            >
                                <FiChevronLeft size={32} />
                            </button>
                        )}
                        <img
                            src={images[lightboxIndex]}
                            alt={intl.formatMessage(
                                { id: 'sitter.gallery.imageAlt' },
                                { number: lightboxIndex + 1 },
                            )}
                            onClick={(event) => event.stopPropagation()}
                        />
                        {images.length > 1 && (
                            <button
                                type="button"
                                className="gallery-lightbox__nav gallery-lightbox__nav--next"
                                onClick={showNextImage}
                                aria-label={intl.formatMessage({ id: 'sitter.gallery.nextImage' })}
                            >
                                <FiChevronRight size={32} />
                            </button>
                        )}
                    </div>,
                    document.body,
                )}
        </div>
    );
}

export default GallerySwiper;
