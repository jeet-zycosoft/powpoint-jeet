'use client';

import { GoogleLogin } from '@react-oauth/google';

const GoogleLoginButton = ({ onSuccess, onError, disabled = false }) => {
    return (
        <div className={`google-login-wrap${disabled ? ' is-disabled' : ''}`}>
            <GoogleLogin
                onSuccess={disabled ? () => {} : onSuccess}
                onError={disabled ? () => {} : onError}
                useOneTap={false}
                text="continue_with"
                shape="pill"
                theme="outline"
                size="large"
                width="320"
            />
        </div>
    );
};

export default GoogleLoginButton;
