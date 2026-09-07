'use client';

import './style.scss';

const SitterDetailsSkeleton = () => {
    return (
        <div className="sitter-details-skeleton container" aria-hidden="true">
            <div className="sitter-details-skeleton__left">
                <div className="sitter-details-skeleton__card sitter-details-skeleton__profile">
                    <div className="skeleton-shimmer sitter-details-skeleton__avatar" />
                    <div className="skeleton-shimmer sitter-details-skeleton__name" />
                    <div className="skeleton-shimmer sitter-details-skeleton__rating" />
                    <div className="skeleton-shimmer sitter-details-skeleton__location" />
                    <div className="skeleton-shimmer sitter-details-skeleton__btn" />
                </div>

                <div className="sitter-details-skeleton__card">
                    <div className="skeleton-shimmer sitter-details-skeleton__heading" />
                    {[1, 2, 3].map((item) => (
                        <div className="sitter-details-skeleton__service" key={item}>
                            <div className="sitter-details-skeleton__service-copy">
                                <div className="skeleton-shimmer sitter-details-skeleton__service-title" />
                                <div className="skeleton-shimmer sitter-details-skeleton__service-desc" />
                            </div>
                            <div className="skeleton-shimmer sitter-details-skeleton__price" />
                        </div>
                    ))}
                    <div className="skeleton-shimmer sitter-details-skeleton__btn" />
                </div>

                <div className="sitter-details-skeleton__card">
                    <div className="skeleton-shimmer sitter-details-skeleton__heading" />
                    <div className="skeleton-shimmer sitter-details-skeleton__check" />
                    <div className="skeleton-shimmer sitter-details-skeleton__check" />
                    <div className="skeleton-shimmer sitter-details-skeleton__check" />
                </div>

                <div className="sitter-details-skeleton__card">
                    <div className="skeleton-shimmer sitter-details-skeleton__heading" />
                    <div className="skeleton-shimmer sitter-details-skeleton__map" />
                </div>
            </div>

            <div className="sitter-details-skeleton__right">
                <div className="skeleton-shimmer sitter-details-skeleton__heading sitter-details-skeleton__heading--wide" />
                <div className="skeleton-shimmer sitter-details-skeleton__line" />
                <div className="skeleton-shimmer sitter-details-skeleton__line" />
                <div className="skeleton-shimmer sitter-details-skeleton__line sitter-details-skeleton__line--short" />
                <div className="skeleton-shimmer sitter-details-skeleton__gallery" />
                <div className="skeleton-shimmer sitter-details-skeleton__btn sitter-details-skeleton__btn--wide" />
                <div className="skeleton-shimmer sitter-details-skeleton__heading sitter-details-skeleton__heading--wide" />
                <div className="skeleton-shimmer sitter-details-skeleton__block" />
                <div className="sitter-details-skeleton__reviews">
                    <div className="skeleton-shimmer sitter-details-skeleton__review" />
                    <div className="skeleton-shimmer sitter-details-skeleton__review" />
                </div>
            </div>
        </div>
    );
};

export default SitterDetailsSkeleton;
