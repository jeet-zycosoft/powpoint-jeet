'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use, useEffect, useRef, useState } from 'react';
import Spinner from 'react-bootstrap/Spinner';
import { FaCog, FaRegStar, FaStar } from 'react-icons/fa';
import { IoCheckmarkDoneOutline } from 'react-icons/io5';
import { MdChevronLeft } from 'react-icons/md';
import { useIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';

import LocalIntlProvider from '@/app/LocalIntlProvider';
import baseMessages from './intl.yaml';
import en from './translations/en.yaml';
import es from './translations/es.yaml';
import fr from './translations/fr.yaml';

const messages = {
    ...baseMessages,
    en: { ...baseMessages?.en, ...en },
    es: { ...baseMessages?.es, ...es },
    fr: { ...baseMessages?.fr, ...fr },
};

import ChatModal from '@/components/ChatModal';
import Loader from '@/components/Loader';
import ReviewModal from '@/components/ReviewModal';
import UserAvatar from '@/components/UserAvatar';
import { useChatSocket } from '@/hooks/useChatSocket';
import { useOwnerDetail, useSitterDetail } from '@/hooks/useProfileQueries';
import { resolveAvatarUrl } from '@/services/avatar';
import {
    normalizeHistoryMessages,
    parseCanChat,
    pickUserLocation,
    unwrapChatStart,
    upsertLiveMessage,
} from '@/services/chatHelpers';
import { chatService } from '@/services/chatService';
import { handleReplaceLocationAction } from '@/services/replaceLocationFlow';
import { selectUser } from '@/store/features/user/userSlice';
import './chat.scss';

function ChatPageInner({ params }) {
    const resolvedParams = use(params);
    const slug = resolvedParams?.slug || '';
    const intl = useIntl();
    const t = (id, values) => intl.formatMessage({ id }, values);
    const joinErrorMessage = t('chat.joinError');
    const router = useRouter();
    const dispatch = useDispatch();
    const { isAuthenticated, userInfo } = useSelector(selectUser);
    const {
        connectionStatus,
        ensureConnected,
        joinRoom,
        setOpenRoom,
        sendMessage,
        emitTypingStart,
        emitTypingStop,
        subscribeToMessages,
        isRoomReady,
        typingByRoom,
        myChatPersonId,
    } = useChatSocket();

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [messages, setMessages] = useState([]);

    const [isCheckingAccess, setIsCheckingAccess] = useState(true);
    const [otherUser, setOtherUser] = useState(null);
    const ownerPeer = useOwnerDetail(slug, Boolean(slug && userInfo?.user_type === 'S'));
    const sitterPeer = useSitterDetail(
        slug,
        isAuthenticated,
        Boolean(slug && userInfo?.user_type !== 'S'),
    );
    const cachedPeer = (userInfo?.user_type === 'S' ? ownerPeer : sitterPeer).data;

    useEffect(() => {
        setOtherUser(cachedPeer || null);
    }, [slug, cachedPeer]);

    const [roomId, setRoomId] = useState(null);
    const [chatPersonId, setChatPersonId] = useState(null);
    const [otherChatPersonId, setOtherChatPersonId] = useState(null);
    const [joinError, setJoinError] = useState('');

    const [canSend, setCanSend] = useState(false);
    const [canAccept, setCanAccept] = useState(false);
    const [canDecline, setCanDecline] = useState(false);
    const [canRead, setCanRead] = useState(false);
    const [sitterQuota, setSitterQuota] = useState(null);
    const [isInitiator, setIsInitiator] = useState(false);

    const [isChatModalOpen, setIsChatModalOpen] = useState(false);
    const [chatUiAction, setChatUiAction] = useState('');
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [chatMessage, setChatMessage] = useState('');
    const [chatActionInProgress, setChatActionInProgress] = useState(false);

    const chatBodyRef = useRef(null);
    const isFetchingRef = useRef(false);
    const typingStopTimerRef = useRef(null);
    const roomIdRef = useRef(null);

    roomIdRef.current = roomId;

    const threadReady = Boolean(roomId && isRoomReady(roomId));
    const typingState = roomId ? typingByRoom[String(roomId)] : null;
    const isOtherUserTyping = Boolean(
        threadReady &&
            typingState?.typing &&
            typingState.userId &&
            String(typingState.userId) !== String(chatPersonId || myChatPersonId),
    );

    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    const fetchHistory = async ({
        rId,
        personId,
        otherPersonId,
    } = {}) => {
        const room = rId || roomId;
        if (!room || isFetchingRef.current) return;

        try {
            isFetchingRef.current = true;
            const response = await chatService.messages({
                other_user_id: slug,
                person_id: slug,
                room_id: room,
                my_chat_person_id: personId || chatPersonId,
                other_chat_person_id: otherPersonId || otherChatPersonId,
                limit: 50,
                offset: 0,
            });
            setMessages(normalizeHistoryMessages(response));
        } catch (err) {
            console.error('Error fetching messages:', err);
        } finally {
            isFetchingRef.current = false;
        }
    };

    const activateThread = ({ rId, personId }) => {
        if (!rId || !personId) {
            setJoinError(joinErrorMessage);
            toast.error(joinErrorMessage);
            return false;
        }

        setJoinError('');
        const connected = ensureConnected(personId);
        if (!connected) {
            setJoinError(joinErrorMessage);
            return false;
        }
        joinRoom(rId);
        setOpenRoom(rId);
        return true;
    };

    useEffect(() => {
        const verifyAndStartChat = async () => {
            if (!isAuthenticated) {
                router.push('/login');
                return;
            }

            try {
                setIsCheckingAccess(true);
                setJoinError('');
                setMessages([]);
                setRoomId(null);
                roomIdRef.current = null;
                setOpenRoom(null);

                const response = await chatService.canChat({ other_user_id: slug });
                const chatData = parseCanChat(response);
                const msg = chatData.message;
                const uiAction = chatData.uiAction;

                setCanSend(chatData.canSend);
                setCanAccept(chatData.canAccept);
                setCanDecline(chatData.canDecline);
                setCanRead(chatData.canRead);
                setSitterQuota(chatData.sitterQuota);
                setIsInitiator(chatData.isInitiator);

                if (chatData.canRead) {
                    const startRes = await chatService.start({
                        other_user_id: slug,
                        person_id: slug,
                    });
                    const started = unwrapChatStart(startRes);
                    const startFlags = parseCanChat(startRes);
                    const rId = started.roomId;
                    const personId = started.myChatPersonId;

                    setRoomId(rId);
                    roomIdRef.current = rId;
                    setChatPersonId(personId);
                    setOtherChatPersonId(started.otherChatPersonId);
                    setCanSend(chatData.canSend || startFlags.canSend);
                    setCanAccept(startFlags.canAccept || chatData.canAccept);
                    setCanDecline(startFlags.canDecline || chatData.canDecline);
                    setIsInitiator(startFlags.isInitiator || chatData.isInitiator);

                    if (started.otherUser) {
                        setOtherUser((prev) => prev || started.otherUser);
                    }

                    setIsCheckingAccess(false);

                    if (!rId || !personId) {
                        setJoinError(joinErrorMessage);
                        toast.error(joinErrorMessage);
                        return;
                    }

                    await fetchHistory({
                        rId,
                        personId,
                        otherPersonId: started.otherChatPersonId,
                    });
                    activateThread({ rId, personId });
                    return;
                }

                if (uiAction !== 'OPEN_CHAT') {
                    setChatUiAction(uiAction);
                    setChatMessage(msg);
                    setIsChatModalOpen(true);
                }
            } catch (err) {
                console.error('Error verifying chat access:', err);
                setJoinError(joinErrorMessage);
                toast.error(t('chat.toasts.verifyFailed'));
            } finally {
                setIsCheckingAccess(false);
            }
        };

        if (slug && isAuthenticated !== undefined) {
            verifyAndStartChat();
        }

        return () => {
            setOpenRoom(null);
            if (typingStopTimerRef.current) {
                clearTimeout(typingStopTimerRef.current);
                typingStopTimerRef.current = null;
            }
        };
        // Thread bootstrap is keyed by slug/auth. Socket helpers are stable enough for this mount.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [slug, isAuthenticated, router]);

    useEffect(() => {
        return subscribeToMessages((incoming) => {
            const openId = roomIdRef.current;
            if (!openId || String(incoming.roomId) !== String(openId)) return;
            setMessages((prev) => upsertLiveMessage(prev, incoming));
        });
    }, [subscribeToMessages]);

    useEffect(() => {
        if (chatBodyRef.current) {
            chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
        }
    }, [messages, isOtherUserTyping]);

    const handleInputChange = (e) => {
        const val = e.target.value;
        setInputValue(val);
        if (!threadReady || !roomId) return;

        emitTypingStart(roomId);
        if (typingStopTimerRef.current) {
            clearTimeout(typingStopTimerRef.current);
        }
        typingStopTimerRef.current = setTimeout(() => {
            emitTypingStop(roomId);
        }, 1500);
    };

    const handleSend = () => {
        if (!inputValue.trim() || !roomId || !chatPersonId || !threadReady) return;
        const text = inputValue.trim();
        setInputValue('');

        if (typingStopTimerRef.current) {
            clearTimeout(typingStopTimerRef.current);
            typingStopTimerRef.current = null;
        }

        const tempId = `tmp-${Date.now()}`;
        const optimisticMessage = {
            id: tempId,
            messageId: tempId,
            sender_id: chatPersonId,
            senderId: chatPersonId,
            personId: chatPersonId,
            message: text,
            body: text,
            created_at: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            sending: true,
        };
        setMessages((prev) => [...prev, optimisticMessage]);

        const sent = sendMessage(roomId, text);
        if (!sent) {
            setMessages((prev) => prev.filter((m) => m.id !== tempId));
            toast.error(t('chat.toasts.messageNotSent'));
        }
    };

    const handleAcceptConversation = async () => {
        try {
            setChatActionInProgress(true);
            await chatService.acceptConversation({ other_user_id: slug });
            toast.success(t('chat.toasts.accepted'));

            const response = await chatService.canChat({ other_user_id: slug });
            const chatData = parseCanChat(response);

            setCanSend(chatData.canSend);
            setCanAccept(chatData.canAccept);
            setCanDecline(chatData.canDecline);
            setCanRead(chatData.canRead);
            setSitterQuota(chatData.sitterQuota);
            setIsInitiator(chatData.isInitiator);

            const startRes = await chatService.start({
                other_user_id: slug,
                person_id: slug,
            });
            const started = unwrapChatStart(startRes);
            const startFlags = parseCanChat(startRes);
            const rId = started.roomId;
            const personId = started.myChatPersonId;

            setRoomId(rId);
            roomIdRef.current = rId;
            setChatPersonId(personId);
            setOtherChatPersonId(started.otherChatPersonId);
            setCanSend(chatData.canSend || startFlags.canSend);
            setCanAccept(startFlags.canAccept || chatData.canAccept);
            setCanDecline(startFlags.canDecline || chatData.canDecline);

            if (!rId || !personId) {
                setJoinError(joinErrorMessage);
                toast.error(joinErrorMessage);
                setIsChatModalOpen(false);
                return;
            }

            await fetchHistory({
                rId,
                personId,
                otherPersonId: started.otherChatPersonId,
            });
            activateThread({ rId, personId });
            setIsChatModalOpen(false);
        } catch (err) {
            console.error('Error accepting conversation:', err);
            toast.error(t('chat.toasts.acceptFailed'));
        } finally {
            setChatActionInProgress(false);
        }
    };

    const handleDeclineConversation = async () => {
        try {
            setChatActionInProgress(true);
            await chatService.declineConversation({ other_user_id: slug });
            toast.info(t('chat.toasts.declined'));
            setIsChatModalOpen(false);
            router.push(`/worker-details/${slug}`);
        } catch (err) {
            console.error('Error declining conversation:', err);
            toast.error(t('chat.toasts.declineFailed'));
        } finally {
            setChatActionInProgress(false);
        }
    };

    const handleModalAction = async (type, options = {}) => {
        if (type === 'replaceLocation') {
            const { sitterLocation, setReplacingLocation } = options;

            const result = await handleReplaceLocationAction({
                sitterLocation,
                setReplacingLocation,
                dispatch,
                router,
                onClose: () => setIsChatModalOpen(false),
            });

            if (result.ok) {
                toast.success(result.message);
            } else {
                toast.error(result.message);
            }
        } else if (type === 'purchase') {
            const reason = options.reason || 'location';
            setIsChatModalOpen(false);
            router.push(`/premium-activation?reason=${reason}`);
        } else if (type === 'profile') {
            setIsChatModalOpen(false);
            router.push(`/customer/base-form2?returnTo=/premium-activation&reason=location`);
        }
    };

    const handleCloseModal = () => {
        setIsChatModalOpen(false);
        if (!canRead) {
            router.push(`/worker-details/${slug}`);
        }
    };

    const getOtherUserName = () => {
        if (!otherUser) return t('chat.loadingUser');
        return (
            otherUser.full_name ||
            otherUser.name ||
            `${otherUser.first_name || ''} ${otherUser.last_name || ''}`.trim() ||
            t('chat.fallbackUser')
        );
    };

    const getOtherUserAvatar = () =>
        resolveAvatarUrl(
            otherUser?.profile_photo_url,
            otherUser?.profile_photo,
            otherUser?.profile_image,
        );

    const getOwnAvatar = () => resolveAvatarUrl(userInfo?.profile_photo);

    const getOtherUserRating = () => {
        const rating = otherUser?.rating;
        return rating !== undefined ? Number(rating) : 5;
    };

    const renderStars = () => {
        const rating = Math.round(getOtherUserRating());
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            if (i <= rating) {
                stars.push(<FaStar key={i} />);
            } else {
                stars.push(<FaRegStar key={i} />);
            }
        }
        return stars;
    };

    const handleReportChat = () => {
        toast.info(t('chat.toasts.reportSubmitted'));
        setIsDropdownOpen(false);
    };

    const handleBlockChat = () => {
        toast.info(t('chat.toasts.userBlocked'));
        setIsDropdownOpen(false);
        router.push('/conversations');
    };

    const handleDeleteChat = () => {
        toast.info(t('chat.toasts.chatCleared'));
        setIsDropdownOpen(false);
        setMessages([]);
    };

    if (isCheckingAccess) {
        return (
            <div
                style={{
                    height: '70dvh',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
            >
                <Loader text={t('chat.loading')} />
            </div>
        );
    }

    const firstMsgCreated =
        messages.length > 0 ? messages[0].created_at || messages[0].createdAt : null;
    const firstMsgDate = firstMsgCreated
        ? new Date(firstMsgCreated).toLocaleDateString([], {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
          })
        : new Date().toLocaleDateString([], {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
          });

    const connectionLabel =
        connectionStatus === 'connected'
            ? threadReady
                ? t('chat.connection.online')
                : t('chat.connection.joining')
            : connectionStatus === 'connecting'
              ? t('chat.connection.connecting')
              : t('chat.connection.disconnected');

    const inputEnabled = Boolean(canSend && threadReady);
    const inputPlaceholder = !roomId
        ? joinErrorMessage
        : !threadReady
          ? t('chat.placeholders.waitingJoin')
          : canSend
            ? t('chat.placeholders.typeMessage')
            : t('chat.placeholders.inputDisabled');

    return (
        <div className="chat-page-wrapper">
            <div className="chat-container">
                <div className="chat-header">
                    <div className="header-left">
                        <Link href={`/worker-details/${slug}`} className="back-btn">
                            <MdChevronLeft />
                        </Link>
                        <div className="user-info">
                            <div className="avatar">
                                <UserAvatar src={getOtherUserAvatar()} alt={getOtherUserName()} />
                            </div>
                            <div className="details">
                                <h2>{t('chat.header.title', { name: getOtherUserName() })}</h2>
                                <span
                                    className={`status ${connectionStatus === 'connected' && threadReady ? 'is-online' : 'is-offline'}`}
                                >
                                    <span className="dot"></span> {connectionLabel}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="header-right">
                        <div
                            className="rating"
                            onClick={() => setIsReviewModalOpen(true)}
                            style={{ cursor: 'pointer' }}
                            title={t('chat.header.writeReview')}
                        >
                            {renderStars()}
                        </div>
                        <div className="settings-container">
                            <button className="settings-btn" onClick={toggleDropdown}>
                                <FaCog />
                            </button>
                            {isDropdownOpen && (
                                <div className="settings-dropdown">
                                    <button onClick={handleReportChat}>{t('chat.settings.report')}</button>
                                    <button onClick={handleBlockChat}>{t('chat.settings.block')}</button>
                                    <button onClick={handleDeleteChat}>{t('chat.settings.delete')}</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <hr className="header-divider" />

                {roomId && connectionStatus !== 'connected' && (
                    <div className="chat-connection-status" role="status">
                        {connectionStatus === 'connecting'
                            ? t('chat.status.connectingLive')
                            : t('chat.status.disconnectedReconnecting')}
                    </div>
                )}

                <div className="chat-body" ref={chatBodyRef}>
                    {!canRead ? (
                        <div className="text-center py-5">
                            <p className="text-muted">{t('chat.body.messagesAfterAccept')}</p>
                        </div>
                    ) : !roomId || joinError ? (
                        <div className="chat-empty-state">
                            <p>{joinError || joinErrorMessage}</p>
                        </div>
                    ) : (
                        <>
                            <div className="chat-start-date">
                                {t('chat.body.chatStartedOn', { date: firstMsgDate })}
                            </div>
                            {messages.map((msg) => {
                                const isOutgoing =
                                    String(msg.personId || msg.senderId) ===
                                    String(chatPersonId);
                                const text = msg.body || msg.message;
                                const msgTime = msg.createdAt || msg.created_at;
                                const time = msgTime
                                    ? new Date(msgTime).toLocaleTimeString([], {
                                          hour: '2-digit',
                                          minute: '2-digit',
                                      })
                                    : '';

                                return (
                                    <div
                                        key={msg.messageId || msg.id}
                                        className={`message-row ${isOutgoing ? 'outgoing' : 'incoming'}`}
                                    >
                                        {!isOutgoing && (
                                            <div className="avatar-wrapper">
                                                <UserAvatar
                                                    src={getOtherUserAvatar()}
                                                    alt={getOtherUserName()}
                                                    className="msg-avatar"
                                                />
                                            </div>
                                        )}
                                        <div className="message-content">
                                            <div className="message-bubble">{text}</div>
                                            {isOutgoing ? (
                                                <div className="message-meta">
                                                    <span className="message-time">{time}</span>
                                                    <IoCheckmarkDoneOutline className="read-receipt" />
                                                </div>
                                            ) : (
                                                <div className="message-time">{time}</div>
                                            )}
                                        </div>
                                        {isOutgoing && (
                                            <div className="avatar-wrapper">
                                                <UserAvatar
                                                    src={getOwnAvatar()}
                                                    alt={t('chat.altMe')}
                                                    className="msg-avatar"
                                                />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {isOtherUserTyping && (
                                <div className="typing-line">
                                    {t('chat.body.typing', { name: getOtherUserName() })}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {!canSend && isInitiator && userInfo?.user_type === 'S' && (
                    <div className="accept-decline-banner d-flex align-items-center justify-content-center bg-warning bg-opacity-10 border-top p-3">
                        <div className="banner-text text-center">
                            <h5
                                className="text-dark mb-1"
                                style={{ fontSize: '0.95rem', fontWeight: 600 }}
                            >
                                {t('chat.banners.waitingOwnerTitle')}
                            </h5>
                            <p className="text-muted small mb-0" style={{ fontSize: '0.8rem' }}>
                                {t('chat.banners.waitingOwnerBody')}
                            </p>
                        </div>
                    </div>
                )}

                {(canAccept || canDecline) && (
                    <div className="accept-decline-banner d-flex align-items-center justify-content-between bg-light border-top p-3">
                        <div className="banner-text text-start">
                            <h5
                                className="text-dark mb-1"
                                style={{ fontSize: '0.95rem', fontWeight: 600 }}
                            >
                                {t('chat.banners.acceptTitle')}
                            </h5>
                            <p className="text-muted small mb-0" style={{ fontSize: '0.8rem' }}>
                                {userInfo?.user_type === 'O'
                                    ? t('chat.banners.acceptOwnerBody')
                                    : t('chat.banners.acceptSitterBody')}
                            </p>
                        </div>
                        <div className="banner-actions d-flex gap-2">
                            {canDecline && (
                                <button
                                    className="btn btn-sm btn-outline-secondary px-3 py-2"
                                    onClick={handleDeclineConversation}
                                    disabled={chatActionInProgress}
                                >
                                    {t('chat.buttons.decline')}
                                </button>
                            )}
                            {canAccept && (
                                <button
                                    className="btn btn-sm btn-primary btn-brand-primary d-flex align-items-center gap-2 px-3 py-2"
                                    onClick={handleAcceptConversation}
                                    disabled={chatActionInProgress}
                                >
                                    {chatActionInProgress && (
                                        <Spinner animation="border" size="sm" />
                                    )}
                                    {t('chat.buttons.acceptConnection')}
                                </button>
                            )}
                        </div>
                    </div>
                )}

                <hr className="footer-divider" />

                <div className="chat-footer">
                    <input
                        type="text"
                        placeholder={inputPlaceholder}
                        className="chat-input"
                        value={inputValue}
                        onChange={handleInputChange}
                        disabled={!inputEnabled}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handleSend();
                            }
                        }}
                    />
                    <button className="send-btn" onClick={handleSend} disabled={!inputEnabled}>
                        {t('chat.buttons.send')}
                    </button>
                </div>
            </div>

            <ChatModal
                isOpen={isChatModalOpen}
                onClose={handleCloseModal}
                uiAction={chatUiAction}
                message={chatMessage}
                onAccept={handleAcceptConversation}
                onDecline={handleDeclineConversation}
                onAction={handleModalAction}
                loadingAction={chatActionInProgress}
                sitterName={getOtherUserName()}
                sitterLocation={pickUserLocation(otherUser)}
                ownerLocation={pickUserLocation(userInfo)}
                sitterQuota={sitterQuota}
            />

            <ReviewModal
                isOpen={isReviewModalOpen}
                onClose={() => setIsReviewModalOpen(false)}
                revieweeId={slug}
                revieweeName={getOtherUserName()}
                userType={userInfo?.user_type}
            />
        </div>
    );
}

export default function ChatPage({ params }) {
    return (
        <LocalIntlProvider messages={messages}>
            <ChatPageInner params={params} />
        </LocalIntlProvider>
    );
}
