'use client';
import { selectUser } from '@/store/features/user/userSlice';
import { useEffect, useRef, useState } from 'react';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import { useIntl } from 'react-intl';
import { useSelector } from 'react-redux';
import './addToFevouriteBtn.scss';

const AddToFevouriteBtn = ({ active, onClick, className = '', label, stopPropagation = true }) => {
    const intl = useIntl();
    const { isAuthenticated } = useSelector(selectUser);
    const isControlled = typeof onClick === 'function';
    const [localActive, setLocalActive] = useState(Boolean(active));
    const [pop, setPop] = useState(false);
    const didMount = useRef(false);

    const isActive = isControlled ? Boolean(active) : localActive;

    useEffect(() => {
        if (!isControlled) return;
        setLocalActive(Boolean(active));
    }, [active, isControlled]);

    useEffect(() => {
        if (!didMount.current) {
            didMount.current = true;
            return;
        }
        if (!isActive) return;
        setPop(true);
        const timer = setTimeout(() => setPop(false), 520);
        return () => clearTimeout(timer);
    }, [isActive]);

    const handleClick = (e) => {
        if (stopPropagation) e.stopPropagation();
        if (isControlled) {
            onClick(e);
            return;
        }
        setLocalActive((prev) => !prev);
    };

    if (!isAuthenticated) return null;

    const classes = [
        'heart-fav-btn',
        isActive ? 'is-active' : '',
        pop ? 'is-pop' : '',
        label ? 'has-label' : '',
        className,
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <button
            type="button"
            className={classes}
            onClick={handleClick}
            aria-pressed={isActive}
            aria-label={
                label ||
                (isActive
                    ? intl.formatMessage({ id: 'common.removeFavorite' })
                    : intl.formatMessage({ id: 'common.addFavorite' }))
            }
        >
            <span className="heart-fav-btn__icon">{isActive ? <FaHeart /> : <FaRegHeart />}</span>
            {label ? <span className="heart-fav-btn__label">{label}</span> : null}
        </button>
    );
};

export default AddToFevouriteBtn;
