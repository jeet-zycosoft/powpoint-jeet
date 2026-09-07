'use client';

import './style.scss';

const ListingCardSkeleton = ({ count = 4 }) => {
    const items = Array.from({ length: count }, (_, index) => index);

    return (
        <div className="listing-card-skeleton-list" aria-hidden="true">
            {items.map((item) => (
                <div className="listing-card-skeleton" key={item}>
                    <div className="listing-card-skeleton__image skeleton-shimmer" />
                    <div className="listing-card-skeleton__info">
                        <div className="skeleton-shimmer listing-card-skeleton__title" />
                        <div className="skeleton-shimmer listing-card-skeleton__location" />
                        <div className="listing-card-skeleton__badges">
                            <div className="skeleton-shimmer listing-card-skeleton__badge" />
                            <div className="skeleton-shimmer listing-card-skeleton__badge" />
                        </div>
                    </div>
                    <div className="listing-card-skeleton__desc">
                        <div className="skeleton-shimmer listing-card-skeleton__desc-heading" />
                        <div className="skeleton-shimmer listing-card-skeleton__line" />
                        <div className="skeleton-shimmer listing-card-skeleton__line listing-card-skeleton__line--short" />
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ListingCardSkeleton;
