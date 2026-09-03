'use client';

import { ChatSocketContext } from '@/context/chatSocketContext';
import { ChatRoomsJoiner } from '@/components/ChatRoomsJoiner';
import { normalizeChatMessage } from '@/services/chatHelpers';
import { readStoredPersonId, writeStoredPersonId } from '@/services/chatPersonStorage';
import { selectUser } from '@/store/features/user/userSlice';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { io } from 'socket.io-client';
import { toast } from 'react-toastify';

const isDev = process.env.NODE_ENV !== 'production';

const getChatWsUrl = () =>
    process.env.NEXT_PUBLIC_CHAT_WS_URL || 'https://pawpoint-chat.server.zycosoft.com';

const logDev = (event, payload) => {
    if (!isDev) return;
    if (payload !== undefined) {
        console.log(`[chat] ${event}`, payload);
        return;
    }
    console.log(`[chat] ${event}`);
};

export default function ChatSocketProvider({ children }) {
    const { isAuthenticated, userInfo } = useSelector(selectUser);
    const appUserId = userInfo?.id;

    const socketRef = useRef(null);
    const personIdRef = useRef('');
    const openRoomIdRef = useRef(null);
    const joinedRoomsRef = useRef(new Set());
    const unreadRef = useRef({});
    const messageListenersRef = useRef(new Set());
    const typingTimersRef = useRef({});

    const [connectionStatus, setConnectionStatus] = useState('idle');
    const [myChatPersonId, setMyChatPersonIdState] = useState('');
    const [openRoomId, setOpenRoomIdState] = useState(null);
    const [unreadByRoom, setUnreadByRoom] = useState({});
    const [roomReadyById, setRoomReadyById] = useState({});
    const [typingByRoom, setTypingByRoom] = useState({});
    const [lastError, setLastError] = useState(null);
    const roomReadyRef = useRef({});

    unreadRef.current = unreadByRoom;
    personIdRef.current = myChatPersonId;
    openRoomIdRef.current = openRoomId;
    roomReadyRef.current = roomReadyById;

    const setUnreadMap = useCallback((updater) => {
        setUnreadByRoom((prev) => {
            const next = typeof updater === 'function' ? updater(prev) : updater;
            unreadRef.current = next;
            return next;
        });
    }, []);

    const persistPersonId = useCallback(
        (personId) => {
            const id = personId ? String(personId) : '';
            if (!id) return;
            personIdRef.current = id;
            setMyChatPersonIdState(id);
            writeStoredPersonId(appUserId, id);
        },
        [appUserId],
    );

    const clearUnread = useCallback((roomId) => {
        if (!roomId) return;
        const key = String(roomId);
        setUnreadMap((prev) => {
            if (!prev[key]) return prev;
            return { ...prev, [key]: 0 };
        });
    }, [setUnreadMap]);

    const setOpenRoom = useCallback(
        (roomId) => {
            const next = roomId ? String(roomId) : null;
            openRoomIdRef.current = next;
            setOpenRoomIdState(next);
            if (next) clearUnread(next);
        },
        [clearUnread],
    );

    const handleIncomingMessage = useCallback(
        (raw) => {
            const nested =
                raw?.data &&
                typeof raw.data === 'object' &&
                (raw.data.roomId ||
                    raw.data.room_id ||
                    raw.data.senderId ||
                    raw.data.sender_id ||
                    raw.data.message)
                    ? raw.data
                    : raw;
            const msg = normalizeChatMessage(nested);
            if (!msg) return;
            logDev('new_message', msg);

            messageListenersRef.current.forEach((listener) => {
                try {
                    listener(msg);
                } catch (err) {
                    console.error('[chat] message listener failed', err);
                }
            });

            const roomId = msg.roomId;
            if (!roomId) return;

            const me = personIdRef.current;
            const senderIsMe = me && String(msg.senderId) === String(me);
            if (senderIsMe) return;

            if (String(openRoomIdRef.current) === String(roomId)) {
                clearUnread(roomId);
                return;
            }

            setUnreadMap((prev) => ({
                ...prev,
                [roomId]: (Number(prev[roomId]) || 0) + 1,
            }));
        },
        [clearUnread, setUnreadMap],
    );

    const detachSocket = useCallback(() => {
        const socket = socketRef.current;
        if (!socket) return;
        socket.removeAllListeners();
        socket.disconnect();
        socketRef.current = null;
    }, []);

    const emitJoin = useCallback((roomId, userId) => {
        const socket = socketRef.current;
        if (!socket || !roomId || !userId) return;
        socket.emit('join_room', { roomId: String(roomId), userId: String(userId) });
    }, []);

    const joinTrackedRooms = useCallback(() => {
        const socket = socketRef.current;
        const userId = personIdRef.current;
        if (!socket?.connected || !userId) return;
        joinedRoomsRef.current.forEach((roomId) => {
            emitJoin(roomId, userId);
        });
    }, [emitJoin]);

    const bindSocket = useCallback(
        (socket) => {
            socket.on('connect', () => {
                logDev('connect', socket.id);
                setConnectionStatus('connected');
                joinTrackedRooms();
            });

            socket.on('disconnect', (reason) => {
                setConnectionStatus('disconnected');
                setRoomReadyById({});
                if (isDev) console.log('[chat] disconnect', reason);
            });

            socket.on('room_joined', (payload) => {
                logDev('room_joined', payload);
                const roomId = payload?.roomId || payload?.room_id;
                if (!roomId) return;
                const key = String(roomId);
                setRoomReadyById((prev) => {
                    const next = { ...prev, [key]: true };
                    roomReadyRef.current = next;
                    return next;
                });
            });

            socket.on('new_message', (payload) => {
                handleIncomingMessage(payload);
            });

            socket.on('user_typing', (payload) => {
                const roomId = payload?.roomId || payload?.room_id;
                const userId = payload?.userId || payload?.user_id;
                if (!roomId) return;
                const typing = Boolean(payload?.typing);
                const key = String(roomId);

                if (typingTimersRef.current[key]) {
                    clearTimeout(typingTimersRef.current[key]);
                    delete typingTimersRef.current[key];
                }

                setTypingByRoom((prev) => ({
                    ...prev,
                    [key]: { userId: userId != null ? String(userId) : '', typing },
                }));

                if (typing) {
                    typingTimersRef.current[key] = setTimeout(() => {
                        setTypingByRoom((prev) => ({
                            ...prev,
                            [key]: { ...prev[key], typing: false },
                        }));
                    }, 3000);
                }
            });

            socket.on('error', (payload) => {
                const message =
                    (typeof payload === 'string' && payload) ||
                    payload?.message ||
                    payload?.error ||
                    'Chat socket error';
                logDev('error', payload);
                setLastError(message);
                console.error('[chat] error', payload);
                toast.error(message);
            });

            socket.on('connect_error', (err) => {
                setConnectionStatus('disconnected');
                const message = err?.message || 'Failed to connect to chat';
                setLastError(message);
                console.error('[chat] connect_error', err);
                toast.error(message);
            });
        },
        [handleIncomingMessage, joinTrackedRooms],
    );

    const ensureConnected = useCallback(
        (personId) => {
            const userId = personId ? String(personId) : personIdRef.current;
            if (!userId) return false;

            persistPersonId(userId);

            const url = getChatWsUrl();
            if (!url) {
                const message = 'Chat websocket URL is not configured (NEXT_PUBLIC_CHAT_WS_URL).';
                setLastError(message);
                console.error('[chat]', message);
                toast.error(message);
                return false;
            }

            const existing = socketRef.current;
            if (existing) {
                const currentAuth = existing.auth?.userId;
                if (String(currentAuth) === String(userId)) {
                    if (!existing.connected && connectionStatus !== 'connecting') {
                        setConnectionStatus('connecting');
                        existing.connect();
                    }
                    return true;
                }
                detachSocket();
            }

            setConnectionStatus('connecting');
            const socket = io(url, {
                auth: { userId },
                transports: ['websocket'],
                path: '/socket.io',
            });
            socketRef.current = socket;
            bindSocket(socket);
            return true;
        },
        [bindSocket, connectionStatus, detachSocket, persistPersonId],
    );

    const joinRoom = useCallback(
        (roomId) => {
            if (!roomId) return false;
            const userId = personIdRef.current;
            if (!userId) return false;
            const key = String(roomId);
            joinedRoomsRef.current.add(key);
            const socket = socketRef.current;
            if (!socket) {
                ensureConnected(userId);
            }
            if (socketRef.current?.connected) {
                emitJoin(key, userId);
            }
            return true;
        },
        [emitJoin, ensureConnected],
    );

    const joinRooms = useCallback(
        (roomIds = []) => {
            roomIds.filter(Boolean).forEach((id) => joinRoom(id));
        },
        [joinRoom],
    );

    const sendMessage = useCallback((roomId, text) => {
        const socket = socketRef.current;
        const userId = personIdRef.current;
        const message = typeof text === 'string' ? text.trim() : '';
        if (!socket?.connected || !roomId || !userId || !message) return false;
        if (!roomReadyRef.current[String(roomId)]) return false;

        socket.emit('send_message', {
            roomId: String(roomId),
            senderId: String(userId),
            message,
        });
        socket.emit('typing:stop', { roomId: String(roomId) });
        return true;
    }, []);

    const emitTypingStart = useCallback((roomId) => {
        const socket = socketRef.current;
        if (!socket?.connected || !roomId) return;
        socket.emit('typing:start', { roomId: String(roomId) });
    }, []);

    const emitTypingStop = useCallback((roomId) => {
        const socket = socketRef.current;
        if (!socket?.connected || !roomId) return;
        socket.emit('typing:stop', { roomId: String(roomId) });
    }, []);

    const subscribeToMessages = useCallback((listener) => {
        if (typeof listener !== 'function') return () => {};
        messageListenersRef.current.add(listener);
        return () => {
            messageListenersRef.current.delete(listener);
        };
    }, []);

    const isRoomReady = useCallback(
        (roomId) => Boolean(roomId && roomReadyById[String(roomId)]),
        [roomReadyById],
    );

    const resetSession = useCallback(() => {
        Object.values(typingTimersRef.current).forEach((timer) => clearTimeout(timer));
        typingTimersRef.current = {};
        joinedRoomsRef.current = new Set();
        openRoomIdRef.current = null;
        personIdRef.current = '';
        detachSocket();
        setConnectionStatus('idle');
        setMyChatPersonIdState('');
        setOpenRoomIdState(null);
        setUnreadMap({});
        setRoomReadyById({});
        setTypingByRoom({});
        setLastError(null);
    }, [detachSocket, setUnreadMap]);

    useEffect(() => {
        if (!isAuthenticated || !appUserId) {
            resetSession();
            return;
        }
        const stored = readStoredPersonId(appUserId);
        if (stored) persistPersonId(stored);
    }, [isAuthenticated, appUserId, persistPersonId, resetSession]);

    useEffect(() => () => detachSocket(), [detachSocket]);

    const unreadTotal = useMemo(
        () => Object.values(unreadByRoom).reduce((sum, count) => sum + (Number(count) || 0), 0),
        [unreadByRoom],
    );

    const value = useMemo(
        () => ({
            connectionStatus,
            isConnected: connectionStatus === 'connected',
            myChatPersonId,
            openRoomId,
            unreadByRoom,
            unreadTotal,
            roomReadyById,
            typingByRoom,
            lastError,
            persistPersonId,
            ensureConnected,
            joinRoom,
            joinRooms,
            setOpenRoom,
            clearUnread,
            sendMessage,
            emitTypingStart,
            emitTypingStop,
            subscribeToMessages,
            isRoomReady,
        }),
        [
            connectionStatus,
            myChatPersonId,
            openRoomId,
            unreadByRoom,
            unreadTotal,
            roomReadyById,
            typingByRoom,
            lastError,
            persistPersonId,
            ensureConnected,
            joinRoom,
            joinRooms,
            setOpenRoom,
            clearUnread,
            sendMessage,
            emitTypingStart,
            emitTypingStop,
            subscribeToMessages,
            isRoomReady,
        ],
    );

    return (
        <ChatSocketContext.Provider value={value}>
            <ChatRoomsJoiner />
            {children}
        </ChatSocketContext.Provider>
    );
}
