'use client';

import { ownerService } from '@/services/ownerService';
import { sitterService } from '@/services/sitterService';
import { useState } from 'react';
import { Button, Modal, Spinner } from 'react-bootstrap';
import { FaRegStar, FaStar } from 'react-icons/fa';
import { TbX } from 'react-icons/tb';
import { useIntl } from 'react-intl';
import { toast } from 'react-toastify';
import './ReviewModal.scss';

const ReviewModal = ({ isOpen, onClose, revieweeId, revieweeName, userType }) => {
    const intl = useIntl();
    const t = (id, values) => intl.formatMessage({ id }, values);
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleStarClick = (selectedRating) => {
        setRating(selectedRating);
    };

    const handleStarMouseEnter = (selectedRating) => {
        setHoverRating(selectedRating);
    };

    const handleStarMouseLeave = () => {
        setHoverRating(0);
    };

    const handleClose = () => {
        // Reset form state on close
        setRating(0);
        setHoverRating(0);
        setComment('');
        onClose();
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        if (rating === 0) {
            toast.warning(t('reviewModal.validationRating'));
            return;
        }

        try {
            setIsSubmitting(true);
            const payload = {
                reviewee_id: Number(revieweeId),
                rating: rating,
                comment: comment.trim(),
            };

            let response;
            if (userType === 'O') {
                // Logged in as Owner, review Sitter
                response = await ownerService.submitReview(payload);
            } else {
                // Logged in as Sitter, review Owner
                response = await sitterService.submitReview(payload);
            }

            const message = response?.message || t('reviewModal.success');
            toast.success(message);
            handleClose();
        } catch (err) {
            console.error('Error submitting review:', err);
            const errMsg =
                err?.response?.data?.message || err?.message || t('reviewModal.error');
            toast.error(errMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            show={isOpen}
            onHide={handleClose}
            centered
            className="pawpoint-review-modal"
            backdrop="static"
            keyboard={false}
        >
            <div className="modal-content-wrapper">
                <button
                    className="modal-close-btn"
                    onClick={handleClose}
                    aria-label={t('reviewModal.closeAria')}
                    disabled={isSubmitting}
                >
                    <TbX size={20} />
                </button>
                <Modal.Body className="p-sm-5 p-4 text-center">
                    <h3 className="modal-title mb-4">{t('reviewModal.title')}</h3>

                    {/* Stars Selector */}
                    <div className="stars-container d-flex justify-content-center mb-4">
                        <span className="visually-hidden">{t('reviewModal.ratingLabel')}</span>
                        {[1, 2, 3, 4, 5].map((starValue) => {
                            const isHighlighted = hoverRating
                                ? starValue <= hoverRating
                                : starValue <= rating;
                            return (
                                <button
                                    key={starValue}
                                    type="button"
                                    className={`star-btn ${isHighlighted ? 'active' : ''}`}
                                    onClick={() => handleStarClick(starValue)}
                                    onMouseEnter={() => handleStarMouseEnter(starValue)}
                                    onMouseLeave={handleStarMouseLeave}
                                    disabled={isSubmitting}
                                    aria-label={`${t('reviewModal.ratingLabel')} ${starValue}`}
                                >
                                    {isHighlighted ? <FaStar /> : <FaRegStar />}
                                </button>
                            );
                        })}
                    </div>

                    {/* Comment Area */}
                    <div className="comment-container mb-4">
                        <label htmlFor="review-comment" className="visually-hidden">
                            {t('reviewModal.commentLabel')}
                        </label>
                        <textarea
                            id="review-comment"
                            className="review-comment-input form-control"
                            rows={4}
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder={t('reviewModal.commentPlaceholder')}
                            disabled={isSubmitting}
                        />
                    </div>

                    {/* Submit Button (Left-aligned as in the user screenshot) */}
                    <div className="actions-container text-start">
                        <Button
                            type="button"
                            variant="primary"
                            onClick={handleSubmit}
                            disabled={rating === 0 || isSubmitting}
                            className="btn-submit btn-brand-primary px-4 py-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <Spinner animation="border" size="sm" className="me-2" />
                                    {t('reviewModal.submitting')}
                                </>
                            ) : (
                                t('reviewModal.submit')
                            )}
                        </Button>
                    </div>
                </Modal.Body>
            </div>
        </Modal>
    );
};

export default ReviewModal;
