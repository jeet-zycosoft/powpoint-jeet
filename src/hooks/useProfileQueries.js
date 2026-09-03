'use client';

import { useChatSocketOptional } from '@/hooks/useChatSocket';
import { unwrapProfileDetail } from '@/services/chatHelpers';
import {
    decorateConversation,
    getConversationAlertTotals,
} from '@/services/conversationBadges';
import { ownerService } from '@/services/ownerService';
import { publicService } from '@/services/publicService';
import { sitterService } from '@/services/sitterService';
import { useQuery } from '@tanstack/react-query';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

export const profileKeys = {
    sitter: (id) => ['sitter-detail', String(id || '')],
    owner: (id) => ['owner-detail', String(id || '')],
    alternatives: (id) => ['sitter-alternatives', String(id || '')],
    conversations: () => ['conversations'],
};

export const extractList = (response) => {
    if (!response) return [];
    if (Array.isArray(response)) return response;
    if (Array.isArray(response.data)) return response.data;
    if (Array.isArray(response.data?.data)) return response.data.data;
    if (Array.isArray(response.list)) return response.list;
    if (Array.isArray(response.results)) return response.results;
    return [];
};

export async function fetchSitterDetail(id, isAuthenticated) {
    const res = isAuthenticated
        ? await ownerService.sitterDetail(id)
        : await publicService.sitterDetail({ sitter_id: id });
    let detail = unwrapProfileDetail(res) || res?.data || res;
    if (detail?.sitter && typeof detail.sitter === 'object') {
        detail = { ...detail, ...detail.sitter };
    }
    return detail;
}

export function useSitterDetail(id, isAuthenticated, enabled = true) {
    return useQuery({
        queryKey: profileKeys.sitter(id),
        queryFn: () => fetchSitterDetail(id, isAuthenticated),
        enabled: Boolean(id) && enabled,
        staleTime: 1000 * 60 * 5,
    });
}

export function useOwnerDetail(id, enabled = true) {
    return useQuery({
        queryKey: profileKeys.owner(id),
        queryFn: async () => {
            const res = await sitterService.ownerDetail({ sitter_id: id });
            return unwrapProfileDetail(res) || res?.data || res;
        },
        enabled: Boolean(id) && enabled,
        staleTime: 1000 * 60 * 5,
    });
}

export function useConversations(enabled = true) {
    return useQuery({
        queryKey: profileKeys.conversations(),
        queryFn: async () => {
            const { chatService } = await import('@/services/chatService');
            const response = await chatService.conversations();
            const list = extractList(response);
            const mapped = list.map((convo) => ({
                ...convo,
                other_user_id:
                    convo.other_user_id ||
                    convo.sitter_id ||
                    convo.user_id ||
                    convo.other_user?.id,
                room_id: convo.room_id || convo.conversation?.room_id || null,
                full_name:
                    convo.full_name ||
                    convo.other_user?.full_name ||
                    convo.other_user?.name ||
                    'User',
                profile_photo:
                    convo.profile_photo ||
                    convo.profile_photo_url ||
                    convo.other_user?.profile_photo,
            }));
            return mapped;
        },
        enabled,
        staleTime: 1000 * 60,
    });
}

export function useConversationAlerts(enabled = true) {
    const query = useConversations(enabled);
    const pathname = usePathname();
    const chatSocket = useChatSocketOptional();
    const unreadByRoom = chatSocket?.unreadByRoom || {};

    const activeChatId = pathname?.startsWith('/chat/') ? pathname.split('/')[2] : '';

    const conversations = useMemo(
        () =>
            (query.data || []).map((convo) =>
                decorateConversation(convo, { activeChatId, unreadByRoom }),
            ),
        [query.data, activeChatId, unreadByRoom],
    );

    const totals = useMemo(
        () => getConversationAlertTotals(conversations, { activeChatId, unreadByRoom }),
        [conversations, activeChatId, unreadByRoom],
    );

    return {
        ...query,
        conversations,
        unreadTotal: totals.unreadTotal,
        pendingAcceptCount: totals.pendingAcceptCount,
        alertCount: totals.unreadTotal || totals.pendingAcceptCount,
    };
}
