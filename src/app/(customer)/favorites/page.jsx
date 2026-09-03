'use client';

import AuthGuard from '@/components/AuthGuard';
import Loader from '@/components/Loader';
import OwnerCard from '@/components/OwnerCard';
import SitterCard from '@/components/SitterCard';
import SitterModal from '@/components/SitterModal';
import { ownerService } from '@/services/ownerService';
import { resolveAvatarUrl } from '@/services/avatar';
import { publicService } from '@/services/publicService';
import { sitterService } from '@/services/sitterService';
import { selectUser } from '@/store/features/user/userSlice';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { useIntl } from 'react-intl';
import { useSelector } from 'react-redux';

import LocalIntlProvider from '@/app/LocalIntlProvider';
import baseMessages from './intl.yaml';
import en from './translations/en.yaml';
import es from './translations/es.yaml';
import fr from './translations/fr.yaml';
import './Favorites.scss';

const messages = {
    ...baseMessages,
    en: { ...baseMessages?.en, ...en },
    es: { ...baseMessages?.es, ...es },
    fr: { ...baseMessages?.fr, ...fr },
};

const getPetLabels = (intl) => ({
    dog: intl.formatMessage({ id: 'favorites.pets.dog' }),
    cat: intl.formatMessage({ id: 'favorites.pets.cat' }),
    bird: intl.formatMessage({ id: 'favorites.pets.bird' }),
    other: intl.formatMessage({ id: 'favorites.pets.other' }),
});

const formatPetTypes = (petTypes, petLabels) => {
    if (!petTypes) return '';
    if (typeof petTypes === 'string') return petTypes;
    if (Array.isArray(petTypes)) return petTypes.join(', ');
    if (typeof petTypes === 'object') {
        return Object.entries(petTypes)
            .filter(([, active]) => active)
            .map(([key]) => petLabels[key] || key)
            .join(', ');
    }
    return '';
};

const mapFavoriteItem = (item, favoriteRecord = null, intl, petLabels) => {
    if (!item) return null;

    const id = item.id || item.favorited_user_id || favoriteRecord?.favorited_user_id;
    const favorite_id = favoriteRecord?.id || item.favorite_id || item.id;
    const name =
        item.full_name ||
        item.name ||
        `${item.first_name || ''} ${item.last_name || ''}`.trim() ||
        intl.formatMessage({ id: 'favorites.petPartner' });

    const location =
        item.city || item.country
            ? [item.city, item.country].filter(Boolean).join(', ')
            : typeof item.location === 'string'
              ? item.location
              : item.address || '';

    const profileSnippet =
        item.profile_title || item.bio || item.profile_snippet || item.description || '';
    const image =
        item.profile_photo_url ||
        item.profile_photo ||
        item.profile_image ||
        item.image ||
        item.avatar ||
        '';

    const profileImg = resolveAvatarUrl(image);
    const typesOfPets = item.typesOfPets || item.types_of_pet || formatPetTypes(item.pet_types, petLabels);

    return {
        ...item,
        id,
        favorite_id,
        name,
        location,
        profileSnippet,
        profile_image: profileImg,
        profile_photo: profileImg,
        image: profileImg,
        typesOfPets,
        isInFev: true,
    };
};

const fetchFavoriteDetails = async (rawList, userType, intl, petLabels) => {
    if (!Array.isArray(rawList) || rawList.length === 0) return [];

    const results = await Promise.allSettled(
        rawList.map(async (item) => {
            const favoritedUserId = item?.favorited_user_id;
            if (!favoritedUserId) return mapFavoriteItem(item, item, intl, petLabels);

            const detailRes =
                userType === 'S'
                    ? await sitterService.ownerDetail({ sitter_id: favoritedUserId })
                    : await ownerService.sitterDetail(favoritedUserId);

            return mapFavoriteItem(detailRes?.data || detailRes, item, intl, petLabels);
        }),
    );

    return results
        .map((res, i) =>
            res.status === 'fulfilled'
                ? res.value
                : mapFavoriteItem(rawList[i], rawList[i], intl, petLabels),
        )
        .filter(Boolean);
};

export const favoriteKeys = {
    all: ['favorites'],
    list: (userId, userType) => [...favoriteKeys.all, 'list', { userId, userType }],
};

export function useFavorites(userInfo, isAuthenticated, intl) {
    const petLabels = getPetLabels(intl);

    return useQuery({
        queryKey: favoriteKeys.list(userInfo?.id, userInfo?.user_type),
        queryFn: async () => {
            const response = await publicService.favoriteList();
            const rawList = Array.isArray(response?.data) ? response.data : [];
            return fetchFavoriteDetails(rawList, userInfo?.user_type, intl, petLabels);
        },
        enabled: Boolean(isAuthenticated),
        staleTime: 1000 * 60 * 5,
    });
}

const FavoritesPageInner = () => {
    const intl = useIntl();
    const router = useRouter();
    const queryClient = useQueryClient();
    const { isAuthenticated, userInfo } = useSelector(selectUser);
    const [selectedUser, setSelectedUser] = useState(null);

    const isSitterLoggedIn = userInfo?.user_type === 'S';
    const {
        data: favorites = [],
        isLoading: loading,
        error,
    } = useFavorites(userInfo, isAuthenticated, intl);

    const handleFavoriteToggle = useCallback(
        (targetUser, isFav) => {
            if (!isFav && targetUser?.id) {
                queryClient.setQueryData(
                    favoriteKeys.list(userInfo?.id, userInfo?.user_type),
                    (oldData) =>
                        Array.isArray(oldData)
                            ? oldData.filter((item) => String(item.id) !== String(targetUser.id))
                            : [],
                );
                setSelectedUser((current) =>
                    current && String(current.id) === String(targetUser.id) ? null : current,
                );
            }
        },
        [queryClient, userInfo?.id, userInfo?.user_type],
    );

    const handleCardClick = useCallback(
        (favorite) => {
            if (isSitterLoggedIn) {
                setSelectedUser(favorite);
            } else {
                router.push(`/worker-details/${favorite.id}`);
            }
        },
        [isSitterLoggedIn, router],
    );

    const handleCloseModal = useCallback(() => {
        setSelectedUser(null);
    }, []);

    return (
        <AuthGuard>
            <section className="favorites-section">
                <div className="container">
                    <h2 className="section-heading">
                        {intl.formatMessage({ id: 'favorites.title' })}
                    </h2>
                    {loading ? (
                        <Loader text={intl.formatMessage({ id: 'favorites.loading' })} />
                    ) : error ? (
                        <div className="alert alert-danger text-center" role="alert">
                            {error.message ||
                                intl.formatMessage({ id: 'favorites.error' })}
                        </div>
                    ) : favorites.length === 0 ? (
                        <div className="no-results-box py-5 text-center">
                            <h3 className="fw-semibold">
                                {intl.formatMessage({ id: 'favorites.empty.title' })}
                            </h3>
                            <p className="text-muted">
                                {intl.formatMessage(
                                    { id: 'favorites.empty.desc' },
                                    {
                                        role: intl.formatMessage({
                                            id: isSitterLoggedIn
                                                ? 'favorites.empty.roleOwners'
                                                : 'favorites.empty.roleSitters',
                                        }),
                                    },
                                )}
                            </p>
                        </div>
                    ) : (
                        <div className="favorites-list">
                            {favorites.map((favorite, index) =>
                                isSitterLoggedIn ? (
                                    <OwnerCard
                                        key={favorite.id || index}
                                        owner={favorite}
                                        index={index}
                                        isAuthenticated={isAuthenticated}
                                        onClick={() => handleCardClick(favorite)}
                                        onFavoriteToggle={handleFavoriteToggle}
                                    />
                                ) : (
                                    <SitterCard
                                        key={favorite.id || index}
                                        sitter={favorite}
                                        index={index}
                                        isAuthenticated={isAuthenticated}
                                        onClick={() => handleCardClick(favorite)}
                                        onFavoriteToggle={handleFavoriteToggle}
                                    />
                                ),
                            )}
                        </div>
                    )}
                </div>
            </section>
            {selectedUser && (
                <SitterModal
                    sitter={selectedUser}
                    onClose={handleCloseModal}
                    onFavoriteToggle={handleFavoriteToggle}
                />
            )}
        </AuthGuard>
    );
};

export default function FavoritesPage() {
    return (
        <LocalIntlProvider messages={messages}>
            <FavoritesPageInner />
        </LocalIntlProvider>
    );
}
