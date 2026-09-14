'use client';

import './TestimonialCard.scss';
import { useId } from 'react';
import { useIntl } from 'react-intl';

const StarRating = ({ rating = 0 }) => {
    const gradientId = useId().replace(/:/g, '');
    const starId = `star-${gradientId}`;
    const offset = Math.max(0, Math.min(Number(rating) * 20, 100));

    return (
        <svg
            width="100"
            height="20"
            viewBox="0 0 100 20"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden
        >
            <defs>
                <linearGradient
                    id={gradientId}
                    x1="0"
                    y1="0"
                    x2="100%"
                    y2="0"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop offset={`${offset}%`} stopColor="#ffc107" />
                    <stop offset={`${offset}%`} stopColor="#e5e5e5" />
                </linearGradient>

                <symbol id={starId} viewBox="0 0 20 20">
                    <polygon
                        points="8.94 0 11.05 6.49 17.88 6.49 12.35 10.51 14.46 17 8.94 12.99 3.41 17 5.52 10.51 0 6.49 6.83 6.49"
                        stroke="#ffc107"
                    />
                </symbol>
            </defs>
            <g fill={`url(#${gradientId})`}>
                <use href={`#${starId}`} x={'-40'} />
                <use href={`#${starId}`} x={'-20'} />
                <use href={`#${starId}`} x={'0'} />
                <use href={`#${starId}`} x={'20'} />
                <use href={`#${starId}`} x={'40'} />
            </g>
        </svg>
    );
};

const TestimonialCard = ({ data }) => {
    const intl = useIntl();
    if (!data) return null;

    const altText =
        data.name && data.location
            ? `${data.name}, ${data.location}`
            : data.name || data.location || intl.formatMessage({ id: 'common.user' });
    const rating = Number(data.rating) || 0;

    return (
        <article className="testimonial-card">
            <div className="testimonial-card-header">
                <span className="testimonial-card-quote" aria-hidden>
                    “
                </span>
                <div className="testimonial-card-rating">
                    <StarRating rating={rating} />
                    <span className="testimonial-card-rating-value">{rating}/5</span>
                </div>
            </div>
            <p className="testimonial-card-body">{data.feedback}</p>
            <div className="testimonial-card-author">
                <img src={`https://i.pravatar.cc/${data.image}`} alt={altText} />
                <span>
                    - {data.name}, {data.location}
                </span>
            </div>
        </article>
    );
};

export default TestimonialCard;
