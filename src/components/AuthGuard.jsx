'use client';
import { selectUser } from '@/store/features/user/userSlice';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

export default function AuthGuard({ children }) {
    const router = useRouter();
    const { isAuthenticated } = useSelector(selectUser);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (isClient && !isAuthenticated) {
            router.push('/login');
        }
    }, [isClient, isAuthenticated, router]);

    if (!isClient) {
        return null; // or a loading spinner
    }

    if (!isAuthenticated) {
        return null; // Return null while redirecting
    }

    return <>{children}</>;
}
