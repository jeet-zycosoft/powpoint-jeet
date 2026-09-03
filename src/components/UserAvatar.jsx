'use client';

import { DEFAULT_AVATAR, resolveAvatarUrl } from '@/services/avatar';
import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';

const UserAvatar = ({ src, alt, className, width, height, style }) => {
    const intl = useIntl();
    const altText = alt ?? intl.formatMessage({ id: 'common.user' });
    const resolved = resolveAvatarUrl(src);
    const [imgSrc, setImgSrc] = useState(resolved);
    const isDefault = imgSrc === DEFAULT_AVATAR;

    useEffect(() => {
        setImgSrc(resolved);
    }, [resolved]);

    return (
        <img
            src={imgSrc}
            alt={altText}
            className={[className, isDefault ? 'user-avatar--default' : '']
                .filter(Boolean)
                .join(' ')}
            width={width}
            height={height}
            style={{ objectFit: 'cover', ...style }}
            onError={() => {
                if (imgSrc !== DEFAULT_AVATAR) {
                    setImgSrc(DEFAULT_AVATAR);
                }
            }}
        />
    );
};

export default UserAvatar;
