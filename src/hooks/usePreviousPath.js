'use client';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export function usePreviousPath() {
    const pathname = usePathname();
    const [previousPath, setPreviousPath] = useState(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const currentPath = sessionStorage.getItem('currentPath');
            const prevPath = sessionStorage.getItem('previousPath');

            if (currentPath && currentPath !== pathname) {
                sessionStorage.setItem('previousPath', currentPath);
                setPreviousPath(currentPath);
            } else {
                setPreviousPath(prevPath);
            }
            sessionStorage.setItem('currentPath', pathname);
        }
    }, [pathname]);

    return previousPath;
}
