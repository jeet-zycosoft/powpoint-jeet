'use client';
import { useState } from 'react';
import { useIntl } from 'react-intl';
import './RateSlider.scss';

const MIN_RATE = 1;
const MAX_RATE = 250;
const DEFAULT_RATE = 50;

const toRate = (value) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return DEFAULT_RATE;
    return Math.min(MAX_RATE, Math.max(MIN_RATE, Math.round(parsed)));
};

const RateSlider = ({ value, onChange }) => {
    const intl = useIntl();
    const [localRate, setLocalRate] = useState(DEFAULT_RATE);

    const isControlled = value !== undefined && value !== null && value !== '';
    const currentRate = isControlled ? toRate(value) : localRate;
    const percentage = ((currentRate - MIN_RATE) / (MAX_RATE - MIN_RATE)) * 100;

    const handleRateChange = (e) => {
        const newRate = toRate(e.target.value);
        if (!isControlled) {
            setLocalRate(newRate);
        }
        if (onChange) onChange(newRate);
    };

    return (
        <div className="rate-slider-container">
            <label htmlFor="rate">{intl.formatMessage({ id: 'forms.ratePerNight' })}</label>
            <div className="slider-wrapper">
                <span>${MIN_RATE}</span>
                <input
                    type="range"
                    id="rate"
                    min={MIN_RATE}
                    max={MAX_RATE}
                    step="1"
                    value={currentRate}
                    onChange={handleRateChange}
                    aria-valuemin={MIN_RATE}
                    aria-valuemax={MAX_RATE}
                    aria-valuenow={currentRate}
                    aria-valuetext={`$${currentRate}`}
                    style={{ backgroundSize: `${percentage}% 100%` }}
                />
                <span>${currentRate}</span>
            </div>
        </div>
    );
};

export default RateSlider;
