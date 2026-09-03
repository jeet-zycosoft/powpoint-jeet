'use client';

import { ChatSocketContext } from '@/context/chatSocketContext';
import { useContext } from 'react';

export function useChatSocket() {
    const ctx = useContext(ChatSocketContext);
    if (!ctx) {
        throw new Error('useChatSocket must be used within ChatSocketProvider');
    }
    return ctx;
}

export function useChatSocketOptional() {
    return useContext(ChatSocketContext);
}
