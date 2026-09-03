'use client';

import './CustomCheckbox.scss';
const CustomCheckbox = ({ label, checked, onChange, isDisabled = false }) => {
    return (
        <label className="custom-checkbox">
            <input type="checkbox" checked={checked} onChange={onChange} disabled={isDisabled} />
            <span className="checkmark"></span>
            {label}
        </label>
    );
};

export default CustomCheckbox;
