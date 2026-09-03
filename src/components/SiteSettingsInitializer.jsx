'use client';

import { publicService } from '@/services/publicService';
import {
    selectSiteSettingsState,
    setSiteSettings,
} from '@/store/features/siteSettings/siteSettingsSlice';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

export default function SiteSettingsInitializer({ children }) {
    const dispatch = useDispatch();
    const { fetched, settings } = useSelector(selectSiteSettingsState);

    useEffect(() => {
        if (!fetched) {
            publicService
                .siteSettings()
                .then((res) => {
                    if (res && res.status && res.data) {
                        dispatch(setSiteSettings(res.data));
                    }
                })
                .catch((err) => {
                    console.error('Failed to fetch site settings:', err);
                });
        }
    }, [dispatch, fetched]);

    useEffect(() => {
        if (settings?.favicon && typeof document !== 'undefined') {
            let link = document.querySelector("link[rel*='icon']");
            if (!link) {
                link = document.createElement('link');
                link.rel = 'shortcut icon';
                document.getElementsByTagName('head')[0].appendChild(link);
            }
            link.href = settings.favicon;
        }
    }, [settings?.favicon]);

    return children;
}
