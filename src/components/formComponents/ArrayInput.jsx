'use client';
import { useState } from 'react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import { useIntl } from 'react-intl';
import './ArrayInput.scss';

const ArrayInput = ({
    items = [],
    onChange,
    placeholder,
    maxItems = 20,
    maxLength = 255,
}) => {
    const intl = useIntl();
    const resolvedPlaceholder =
        placeholder ?? intl.formatMessage({ id: 'forms.enterItem' });
    const [inputValue, setInputValue] = useState('');

    const handleAdd = () => {
        const trimmed = inputValue.trim();
        if (!trimmed) return;
        if (items.length >= maxItems) {
            alert(intl.formatMessage({ id: 'forms.maxItems' }));
            return;
        }
        if (trimmed.length > maxLength) {
            alert(`Item cannot exceed ${maxLength} characters`);
            return;
        }
        onChange([...items, trimmed]);
        setInputValue('');
    };

    const handleRemove = (index) => {
        onChange(items.filter((_, i) => i !== index));
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAdd();
        }
    };

    return (
        <div className="array-input">
            {items.length > 0 && (
                <div className="array-input__items">
                    {items.map((item, index) => (
                        <div key={index} className="array-input__item">
                            <span className="array-input__item-text">{item}</span>
                            <button
                                type="button"
                                className="array-input__item-remove"
                                onClick={() => handleRemove(index)}
                                aria-label={intl.formatMessage({ id: 'forms.removeItem' })}
                            >
                                <FiTrash2 />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div className="array-input__add-section">
                <input
                    type="text"
                    className="array-input__input"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={resolvedPlaceholder}
                    maxLength={maxLength}
                />
                <button
                    type="button"
                    className="array-input__add-btn"
                    onClick={handleAdd}
                    disabled={!inputValue.trim() || items.length >= maxItems}
                >
                    <FiPlus /> {intl.formatMessage({ id: 'common.add' })}
                </button>
            </div>
            <div className="array-input__info">
                {intl.formatMessage(
                    { id: 'forms.itemsCount' },
                    { count: items.length, max: maxItems },
                )}
            </div>
        </div>
    );
};

export default ArrayInput;
