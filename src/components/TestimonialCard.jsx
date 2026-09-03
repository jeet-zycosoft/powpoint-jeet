'use client';

import './TestimonialCard.scss';
import { useIntl } from 'react-intl';

const StarRating = ({ rating = 0 }) => {
    // SVG total width = 100, 5 stars → each star = 20px
    const offset = Math.max(0, Math.min(rating * 20, 100)); // clamp 0–100

    return (
        <svg width="100" height="20" viewBox="0 0 100 20" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient
                    id="starGradient"
                    x1="0"
                    y1="0"
                    x2="100%"
                    y2="100%"
                    gradientUnits="userSpaceOnUse"
                >
                    {/* <linearGradient id='starGradient'> */}
                    <stop offset={`${offset}%`} stopColor="#ffc107" />
                    <stop offset={`${offset}%`} stopColor="#fff" />
                </linearGradient>

                <symbol id="star" viewBox="0 0 20 20">
                    <polygon
                        points="8.94 0 11.05 6.49 17.88 6.49 12.35 10.51 14.46 17 8.94 12.99 3.41 17 5.52 10.51 0 6.49 6.83 6.49"
                        stroke="#ffc107"
                    />
                </symbol>
            </defs>
            <g fill="url(#starGradient)">
                <use href="#star" x={'-40'} />
                <use href="#star" x={'-20'} />
                <use href="#star" x={'0'} />
                <use href="#star" x={'20'} />
                <use href="#star" x={'40'} />
                {/* <use href='#star' x={'60'} /> */}
                {/* <use href='#star' x={'80'} /> */}
            </g>
        </svg>
    );
};

const TestimonialCard = ({ data, index }) => {
    const intl = useIntl();
    const altText =
        data.name && data.location
            ? `${data.name}, ${data.location}`
            : data.name || data.location || intl.formatMessage({ id: 'common.user' });

    return (
        <div className="testimonial-card" key={index}>
            <div className="testimonial-card-header">
                <span className="testimonial-card-quote">“</span>
                <div className="">
                    <span>{data.companyName}</span>
                </div>

                <div className="testimonial-card-rating">
                    <div>
                        <StarRating rating={1} />
                    </div>
                    <div> {data.rating}/5</div>
                </div>
            </div>
            <p className="testimonial-card-body">{data.feedback}</p>
            <div className="testimonial-card-author">
                <img src={`https://i.pravatar.cc/${data.image}`} alt={altText} />
                <span>
                    - {data.name}, {data.location}
                </span>
            </div>
        </div>
    );
};

export default TestimonialCard;
