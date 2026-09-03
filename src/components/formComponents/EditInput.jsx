'use client';
import { useEffect, useRef, useState } from 'react';
import { useIntl } from 'react-intl';

import './EditInput.scss';

const Pencil = (props) => (
    <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M17 3a2.85 2.85 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
        <path d="m15 5 4 4" />
    </svg>
);
const Check = (props) => (
    <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M20 6 9 17l-5-5" />
    </svg>
);

const EditableInput = (props) => {
    const intl = useIntl();
    const { initialValue } = props;
    const [value, setValue] = useState(initialValue);
    const [isEditing, setIsEditing] = useState(false);
    const [tempValue, setTempValue] = useState(initialValue);

    const inputRef = useRef(null);

    useEffect(() => {
        setValue(initialValue);
        setTempValue(initialValue);
    }, [initialValue]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            const length = inputRef.current.value.length;
            inputRef.current.setSelectionRange(length, length);
        }
    }, [isEditing]);

    // Edit Handler
    const handleEdit = () => {
        setTempValue(value);
        setIsEditing(true);
    };

    // Handler to save the changes
    const handleSave = () => {
        // console.log('Saving new value:', tempValue)
        setValue(tempValue);
        if (props.onSave) {
            props.onSave(tempValue);
        }
        setIsEditing(false);
    };

    // Handler to cancel editing and revert to the original value
    const handleCancel = () => {
        setTempValue(value);
        setIsEditing(false);
    };

    // Handler for key presses (e.g., Enter to save, Escape to cancel)
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSave();
        } else if (e.key === 'Escape') {
            handleCancel();
        }
    };

    return (
        <div className="EditableInput-box">
            <input
                ref={inputRef}
                type="text"
                name="yyp"
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                onBlur={() => tempValue !== value && handleSave()} // Auto-save on blur if value changed
                onKeyDown={handleKeyDown}
                readOnly={!isEditing}
            />
            {/* Action Buttons in Edit Mode */}
            {isEditing ? (
                <button
                    onClick={handleSave}
                    title={intl.formatMessage({ id: 'common.save' })}
                    type="button"
                >
                    <Check className="h-5 w-5" />
                </button>
            ) : (
                <button
                    onClick={handleEdit}
                    title={intl.formatMessage({ id: 'common.edit' })}
                    type="button"
                >
                    <Pencil className="h-6 w-6" />
                </button>
            )}
        </div>
    );
};
export default EditableInput;
