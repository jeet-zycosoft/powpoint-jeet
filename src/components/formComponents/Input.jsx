'use client';
import './Input.scss';

const Input = ({ type, label, name, placeholder, id }) => {
    return (
        <div className="form-group">
            <label htmlFor={id}>{label}</label>
            <input type={type} name={name} id={id} placeholder={placeholder} autoComplete="off" />
        </div>
    );
};

export default Input;
