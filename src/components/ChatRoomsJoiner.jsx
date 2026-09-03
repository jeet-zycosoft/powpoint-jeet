'use client';

import { useChatSocket } from '@/hooks/useChatSocket';
import { useConversations } from '@/hooks/useProfileQueries';
import { unwrapChatStart } from '@/services/chatHelpers';
import { readStoredPersonId } from '@/services/chatPersonStorage';
import { chatService } from '@/services/chatService';
import { selectUser } from '@/store/features/user/userSlice';
import { useEffect, useRef } from 'react';
import { useIntl } from 'react-intl';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';

export function ChatRoomsJoiner() {
    const intl = useIntl();
    const { isAuthenticated, userInfo } = useSelector(selectUser);
    const { data: conversations } = useConversations(Boolean(isAuthenticated));
    const { myChatPersonId, persistPersonId, ensureConnected, joinRooms } = useChatSocket();
    const bootstrappingRef = useRef(false);

    useEffect(() => {
        const list = conversations || [];
        const roomIds = list
            .map((convo) => convo.room_id || convo.conversation?.room_id)
            .filter(Boolean)
            .map(String);

        if (!isAuthenticated || !roomIds.length) return undefined;

        let cancelled = false;

        const joinInboxRooms = async () => {
            let personId = myChatPersonId || readStoredPersonId(userInfo?.id);

            if (!personId) {
                if (bootstrappingRef.current) return;
                bootstrappingRef.current = true;

                const first = list.find(
                    (convo) =>
                        convo.other_user_id && (convo.room_id || convo.conversation?.room_id),
                );
                if (!first) {
                    bootstrappingRef.current = false;
                    return;
                }

                try {
                    const startRes = await chatService.start({
                        other_user_id: first.other_user_id,
                        person_id: first.other_user_id,
                    });
                    const started = unwrapChatStart(startRes);
                    if (!started.roomId || !started.myChatPersonId) {
                        bootstrappingRef.current = false;
                        return;
                    }
                    personId = started.myChatPersonId;
                    persistPersonId(personId);
                } catch (err) {
                    console.error('[chat] inbox start failed', err);
                    toast.error(intl.formatMessage({ id: 'chatRooms.joinFailed' }));
                    bootstrappingRef.current = false;
                    return;
                }

                bootstrappingRef.current = false;
            }

            if (cancelled || !personId) return;
            if (!ensureConnected(personId)) return;
            joinRooms(roomIds);
        };

        joinInboxRooms();

        return () => {
            cancelled = true;
        };
    }, [
        isAuthenticated,
        conversations,
        myChatPersonId,
        persistPersonId,
        ensureConnected,
        joinRooms,
        userInfo?.id,
        intl,
    ]);

    return null;
}
