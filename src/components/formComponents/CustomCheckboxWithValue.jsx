'use client';
import './CustomCheckboxWithValue.scss';
import { useIntl } from 'react-intl';

const CustomCheckboxWithValue = ({
    label,
    desc,
    icon,
    checked,
    onChange,
    isDisabled = false,
    value,
    onValueChange,
}) => {
    const intl = useIntl();
    const displayValue = value !== undefined && value !== null ? value : 25;

    const handlePriceChange = (newValue) => {
        const validValue = Math.max(0, newValue);
        if (onValueChange) {
            onValueChange(validValue);
        }
    };

    return (
        <div className="custom-value-checkbox">
            <div className="box-img-container">
                {icon ? <img src={icon} alt="" /> : <img src="/icons/pawprint.png" alt="" />}
            </div>

            <div className="w-100">
                <h4 className="heading">{label}</h4>
                <p className="desc">{desc}</p>
                <div className="value-box-container">
                    <p>{intl.formatMessage({ id: 'forms.avgNight' })}</p>
                    <div className="value-box">
                        <button
                            type="button"
                            className="control-btn"
                            onClick={(e) => {
                                e.preventDefault();
                                handlePriceChange(displayValue - 1);
                            }}
                        >
                            &minus;
                        </button>
                        <span className="value-text">€{displayValue.toFixed(2)}</span>
                        <button
                            type="button"
                            className="control-btn"
                            onClick={(e) => {
                                e.preventDefault();
                                handlePriceChange(displayValue + 1);
                            }}
                        >
                            &#43;
                        </button>
                    </div>
                </div>
            </div>

            <label className="checkbox">
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={onChange}
                    disabled={isDisabled}
                />
                <span className="checkmark"></span>
            </label>
        </div>
    );
};

export default CustomCheckboxWithValue;
