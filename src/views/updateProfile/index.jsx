'use client';

import palmImage from '@/../public/images/palm.png';
import FieldHint from '@/components/FieldHint';
import EditableInput from '@/components/formComponents/EditInput';
import FileUploader from '@/components/formComponents/fileUploader';
import ImageCropModal from '@/components/formComponents/ImageCropModal';
import { toLocationId } from '@/hooks/useGeolocation';
import { usePreviousPath } from '@/hooks/usePreviousPath';
import { ownerService } from '@/services/ownerService';
import {
    OWNER_REQUIREMENTS,
    SITTER_REQUIREMENTS,
} from '@/services/profileCompletion';
import { publicService } from '@/services/publicService';
import { sitterService } from '@/services/sitterService';
import { selectUser, updateUserInfo } from '@/store/features/user/userSlice';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useReducer, useRef, useState } from 'react';
import { FiChevronLeft, FiChevronRight, FiImage } from 'react-icons/fi';
import { useIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import 'swiper/css';
import 'swiper/css/navigation';
import { Navigation } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import './style.scss';

// helper function
const getImageUrl = (image) => {
    if (!image) return '';
    let imgUrl = image;
    if (image && typeof image === 'object') {
        if (image.preview) {
            return image.preview;
        }
        if (typeof window !== 'undefined' && (image instanceof File || image instanceof Blob)) {
            image.preview = URL.createObjectURL(image);
            return image.preview;
        }
        if (image.url) {
            imgUrl = image.url;
        }
    }
    if (typeof imgUrl === 'string') {
        if (
            imgUrl.startsWith('data:') ||
            imgUrl.startsWith('http://') ||
            imgUrl.startsWith('https://')
        ) {
            return imgUrl;
        }
        const cleanPath = imgUrl.startsWith('/') ? imgUrl.substring(1) : imgUrl;
        return `https://pawpoint.server.zycosoft.com/${cleanPath}`;
    }
    return imgUrl;
};

// Helper function to read file as Base64
const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
    });
};
// helper function end

const UpdateProfile = ({ slug }) => {
    const intl = useIntl();
    const t = (id, values) => intl.formatMessage({ id }, values);
    const router = useRouter();
    const dispatchRedux = useDispatch();
    const { userInfo } = useSelector(selectUser);
    const previousPath = usePreviousPath();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [profileTitleError, setProfileTitleError] = useState('');
    const [cropState, setCropState] = useState({ files: [], index: 0, target: null });
    // const [isLoading, setIsLoading] = useState(true);

    const isSitter = userInfo.user_type === 'S';
    const isOwner = userInfo.user_type === 'O';

    // console.log('previousPath', previousPath);
    console.log('userInfo', userInfo);
    // console.log('locationData', locationData);

    const initialState = {
        first_name: userInfo?.first_name || '',
        last_name: userInfo?.last_name || '',
        profile_title: (userInfo?.profile_title || '').slice(0, 100),
        phone: userInfo?.phone || '9996665553',
        gender: userInfo?.gender || '',
        profile_photo: userInfo?.profile_photo?.url || null,
        gallery_photos: (() => {
            let gallery = userInfo?.gallery_photos || [];
            if (typeof gallery === 'string') {
                try {
                    gallery = JSON.parse(gallery);
                } catch (e) {
                    gallery = gallery
                        .split(',')
                        .map((item) => item.trim())
                        .filter(Boolean);
                }
            }
            return Array.isArray(gallery) ? gallery : [];
        })(),
        about: userInfo?.about || '',
        petCareExperience: userInfo?.pet_care_experience || '',
        safetyTrustEnvironment: userInfo?.safety_trust_environment || '',
    };

    function reducer(state, action) {
        switch (action.type) {
            case 'SET_FIELD':
                return { ...state, [action.field]: action.value };
            case 'SET_PROFILE_PHOTO':
                return { ...state, profile_photo: action.value };
            case 'REMOVE_PROFILE_PHOTO':
                return { ...state, profile_photo: null };
            case 'ADD_GALLERY_PHOTOS':
                return { ...state, gallery_photos: [...state.gallery_photos, ...action.value] };
            case 'REMOVE_GALLERY_PHOTO':
                return {
                    ...state,
                    gallery_photos: state.gallery_photos.filter((item) => {
                        const itemId = item?.id || item;
                        const actionFileId = action.file?.id || action.file;
                        return itemId !== actionFileId;
                    }),
                };
            case 'RESET_STATE':
                return {
                    ...state,
                    ...action.payload,
                };
            default:
                return state;
        }
    }
    const [state, dispatch] = useReducer(reducer, initialState);

    const profileInputRef = useRef(null);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const headline = (state.profile_title || '').trim();
        if (!headline) {
            setProfileTitleError(t('updateProfile.headline.required'));
            return;
        }
        if (headline.length > 100) {
            setProfileTitleError(t('updateProfile.headline.maxLength'));
            return;
        }

        if (isSubmitting) return;
        setIsSubmitting(true);

        try {
            // Construct the JSON payload structure specified by the API
            const payload = {
                first_name: state.first_name || '',
                last_name: state.last_name || '',
                profile_title: headline,
                phone: state.phone || '',
                gender: state.gender || 'M',
                // Include role-specific fields
                ...(slug === 'customer' ? { about: state.about || '' } : {}),
            };

            // Helper to extract URL/filename string from string or photo object
            const getPhotoUrl = (photo) => {
                if (!photo) return '';
                if (photo instanceof File) return '';
                if (typeof photo === 'object' && photo.url) return photo.url;
                return photo;
            };

            // Only add profile_photo to payload if it has changed
            const initialProfilePhoto = userInfo?.profile_photo || null;

            const isProfilePhotoChanged = (() => {
                const urlA = getPhotoUrl(state.profile_photo);
                const urlB = getPhotoUrl(initialProfilePhoto);
                const isFile = state.profile_photo instanceof File;
                if (isFile) return true;
                if (!state.profile_photo && !initialProfilePhoto) return false;
                if (!state.profile_photo || !initialProfilePhoto) return true;
                return urlA !== urlB;
            })();

            if (isProfilePhotoChanged) {
                let profilePhotoBase64 = '';
                if (state.profile_photo) {
                    if (state.profile_photo instanceof File) {
                        try {
                            profilePhotoBase64 = await fileToBase64(state.profile_photo);
                        } catch (err) {
                            console.error('Error converting profile photo to base64:', err);
                        }
                    } else {
                        profilePhotoBase64 = getPhotoUrl(state.profile_photo);
                    }
                }
                payload.profile_photo = profilePhotoBase64;
            }

            // Only add gallery_photos to payload if it has changed
            let initialGallery = userInfo?.gallery_photos || [];
            if (typeof initialGallery === 'string') {
                try {
                    initialGallery = JSON.parse(initialGallery);
                } catch (e) {
                    initialGallery = initialGallery
                        .split(',')
                        .map((item) => item.trim())
                        .filter(Boolean);
                }
            }
            if (!Array.isArray(initialGallery)) {
                initialGallery = [];
            }

            const isGalleryChanged =
                state.gallery_photos.length !== initialGallery.length ||
                state.gallery_photos.some((img, idx) => {
                    const initialImg = initialGallery[idx];
                    if (img instanceof File || initialImg instanceof File) return true;
                    return getPhotoUrl(img) !== getPhotoUrl(initialImg);
                });
            console.log('isGalleryChanged', isGalleryChanged);

            if (isGalleryChanged) {
                const galleryPhotosBase64s = [];
                if (Array.isArray(state.gallery_photos)) {
                    for (const file of state.gallery_photos) {
                        if (file instanceof File) {
                            try {
                                const base64 = await fileToBase64(file);
                                galleryPhotosBase64s.push(base64);
                            } catch (err) {
                                console.error('Error converting gallery photo to base64:', err);
                            }
                        }
                        // Skip existing S3 URLs — backend already has them
                    }
                }
                payload.gallery_photos = galleryPhotosBase64s;
            }
            const locationFields = {
                address: state.address || userInfo?.address || '',
                city: state.city || userInfo?.city || '',
                country: state.country || userInfo?.country || '',
                latitude: state.latitude || userInfo?.latitude || '',
                longitude: state.longitude || userInfo?.longitude || '',
            };
            Object.entries(locationFields).forEach(([key, value]) => {
                if (value !== '' && value !== null && value !== undefined) {
                    payload[key] = value;
                }
            });

            const locationId =
                toLocationId(state.location_id) ?? toLocationId(userInfo?.location_id);
            if (locationId) {
                payload.location_id = locationId;
            }

            console.log('Base Form Payload', payload);

            let response = '';
            if (slug === 'customer' && isOwner) {
                response = await ownerService.updateProfile(payload);
            } else {
                response = await sitterService.updateProfile(payload);
            }
            console.log('Base Form response', response.data);

            if (response.status) {
                const updatedUser = response.data;

                const mergedUserInfo = {
                    ...userInfo,
                    first_name: payload.first_name,
                    last_name: payload.last_name,
                    profile_title: payload.profile_title,
                    about: payload.about,
                    pet_care_experience: payload.pet_care_experience,
                    safety_trust_environment: payload.safety_trust_environment,
                    profile_photo: updatedUser.profile_photo || userInfo?.profile_photo,
                    gallery_photos:
                        updatedUser.gallery_photos ||
                        payload.gallery_photos ||
                        userInfo?.gallery_photos,
                    ...updatedUser,
                };

                dispatchRedux(updateUserInfo(mergedUserInfo));

                toast.success(t('updateProfile.toasts.updateSuccess'));

                if (previousPath && previousPath.includes('profile')) {
                    router.push(previousPath);
                } else {
                    router.push(`/${slug}/base-form2`);
                }
            } else {
                toast.error(t('updateProfile.toasts.updateFailed'));
                console.error('Failed to submit data');
            }
        } catch (error) {
            toast.error(t('updateProfile.toasts.saveError'));
            console.error('Error submitting data:', error.response?.data || error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleProfilePhotoClick = () => {
        profileInputRef.current.click();
    };

    const handleProfilePhotoChange = (e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (file) {
            setCropState({ files: [file], index: 0, target: 'profile' });
        }
    };

    const handleGalleryFilesSelected = (files) => {
        const nextFiles = Array.from(files || []).filter(Boolean);
        if (!nextFiles.length) return;
        setCropState({ files: nextFiles, index: 0, target: 'gallery' });
    };

    const closeCropModal = () => {
        setCropState({ files: [], index: 0, target: null });
    };

    const handleCropConfirm = (croppedFile) => {
        if (cropState.target === 'profile') {
            dispatch({ type: 'SET_PROFILE_PHOTO', value: croppedFile });
            closeCropModal();
            return;
        }

        dispatch({ type: 'ADD_GALLERY_PHOTOS', value: [croppedFile] });
        const nextIndex = cropState.index + 1;
        if (nextIndex < cropState.files.length) {
            setCropState((prev) => ({ ...prev, index: nextIndex }));
            return;
        }
        closeCropModal();
    };

    const handleRemoveProfilePhoto = async () => {
        const photo = state.profile_photo;
        if (photo) {
            if (photo.preview) {
                URL.revokeObjectURL(photo.preview);
            }
            const isFile = photo instanceof File;
            if (!isFile) {
                const photoId = photo?.id || photo?.user_id || userInfo?.id;
                if (photoId) {
                    try {
                        const response = await publicService.profilePhotoDel();
                        if (response.status) {
                            toast.success(t('updateProfile.toasts.profilePhotoDeleted'));
                            dispatchRedux(updateUserInfo({ profile_photo: null }));
                        } else {
                            toast.error(t('updateProfile.toasts.profilePhotoDeleteFailed'));
                            return;
                        }
                    } catch (err) {
                        console.error(err);
                        toast.error(t('updateProfile.toasts.profilePhotoDeleteError'));
                        return;
                    }
                }
            }
        }
        dispatch({ type: 'REMOVE_PROFILE_PHOTO' });
    };

    const handleRemoveGalleryPhoto = async (file) => {
        if (file && file.preview) {
            URL.revokeObjectURL(file.preview);
        }
        if (file && file.id) {
            try {
                const response = await publicService.galleryPhotoDel(file.id);
                if (response.status) {
                    toast.success(t('updateProfile.toasts.galleryPhotoDeleted'));
                    let currentReduxGallery = userInfo?.gallery_photos || [];
                    if (typeof currentReduxGallery === 'string') {
                        try {
                            currentReduxGallery = JSON.parse(currentReduxGallery);
                        } catch (e) {
                            currentReduxGallery = currentReduxGallery
                                .split(',')
                                .map((item) => item.trim())
                                .filter(Boolean);
                        }
                    }
                    if (Array.isArray(currentReduxGallery)) {
                        const updatedReduxGallery = currentReduxGallery.filter((item) => {
                            const itemId = item?.id || item;
                            const actionFileId = file?.id || file;
                            return itemId !== actionFileId;
                        });
                        dispatchRedux(updateUserInfo({ gallery_photos: updatedReduxGallery }));
                    }
                } else {
                    toast.error(t('updateProfile.toasts.galleryPhotoDeleteFailed'));
                    return;
                }
            } catch (err) {
                console.error(err);
                toast.error(t('updateProfile.toasts.galleryPhotoDeleteError'));
                return;
            }
        }
        dispatch({ type: 'REMOVE_GALLERY_PHOTO', file });
    };

    return (
        <>
        <form className="form-container container" onSubmit={handleSubmit}>
            <h1>{t('updateProfile.enterName')}</h1>
            <div className="name-inputs mt-4">
                <EditableInput
                    initialValue={state.first_name}
                    onSave={(value) => dispatch({ type: 'SET_FIELD', field: 'first_name', value })}
                />
                <EditableInput
                    initialValue={state.last_name}
                    onSave={(value) => dispatch({ type: 'SET_FIELD', field: 'last_name', value })}
                />
            </div>

            <div className="profile-photo">
                <div className="profile-photo-info">
                    <h2>{t('updateProfile.profilePhoto.title')}</h2>
                    <p>{t('updateProfile.profilePhoto.desc')}</p>
                    <button className="btn-primary" type="button" onClick={handleProfilePhotoClick}>
                        {t('updateProfile.profilePhoto.upload')}
                    </button>
                </div>
                <div className="profile-photo-preview">
                    <input
                        type="file"
                        ref={profileInputRef}
                        style={{ display: 'none' }}
                        accept="image/*"
                        onChange={handleProfilePhotoChange}
                    />
                    <div className="paw-icon">
                        {state?.profile_photo != null ? (
                            <>
                                <Image
                                    src={getImageUrl(state.profile_photo)}
                                    alt={t('updateProfile.profilePhoto.alt')}
                                    width={150}
                                    height={150}
                                    style={{ objectFit: 'cover', borderRadius: '50%' }}
                                    unoptimized
                                />
                                <button
                                    type="button"
                                    className="remove-photo-btn"
                                    onClick={handleRemoveProfilePhoto}
                                    title={t('updateProfile.profilePhoto.removeTitle')}
                                >
                                    ✕
                                </button>
                            </>
                        ) : (
                            <Image src={palmImage} alt={t('updateProfile.profilePhoto.alt')} loading="eager" />
                        )}
                    </div>
                </div>
            </div>

            {slug === 'customer' && (
                <>
                    <div className="about-needs">
                        <FieldHint
                            title={t('updateProfile.headline.title')}
                            required
                            infoTitle={t('updateProfile.headline.infoOwner')}
                            infoItems={OWNER_REQUIREMENTS}
                        />
                        <p>{t('updateProfile.headline.hint')}</p>
                        <textarea
                            placeholder={t('updateProfile.headline.placeholderOwner')}
                            value={state.profile_title}
                            className={profileTitleError ? 'is-invalid' : ''}
                            onChange={(e) => {
                                dispatch({
                                    type: 'SET_FIELD',
                                    field: 'profile_title',
                                    value: e.target.value,
                                });
                                if (e.target.value.trim()) {
                                    setProfileTitleError('');
                                }
                            }}
                            maxLength={65}
                        ></textarea>
                        <span>
                            {t('updateProfile.headline.charCount', {
                                count: state.profile_title?.length || 0,
                                max: 65,
                            })}
                        </span>
                        {profileTitleError && (
                            <span className="error-message">{profileTitleError}</span>
                        )}
                    </div>
                </>
            )}

            {slug === 'worker' && (
                <>
                    <div className="about-needs">
                        <FieldHint
                            title={t('updateProfile.headline.title')}
                            required
                            infoTitle={t('updateProfile.headline.infoSitter')}
                            infoItems={SITTER_REQUIREMENTS}
                        />
                        <p>{t('updateProfile.headline.hint')}</p>
                        <textarea
                            placeholder={t('updateProfile.headline.placeholderSitter')}
                            value={state.profile_title}
                            className={profileTitleError ? 'is-invalid' : ''}
                            onChange={(e) => {
                                dispatch({
                                    type: 'SET_FIELD',
                                    field: 'profile_title',
                                    value: e.target.value,
                                });
                                if (e.target.value.trim()) {
                                    setProfileTitleError('');
                                }
                            }}
                            maxLength={100}
                        ></textarea>
                        <span>
                            {t('updateProfile.headline.charCount', {
                                count: state.profile_title?.length || 0,
                                max: 100,
                            })}
                        </span>
                        {profileTitleError && (
                            <span className="error-message">{profileTitleError}</span>
                        )}
                    </div>
                </>
            )}

            <div className="gallery-photos">
                <h2>{t('updateProfile.gallery.title')}</h2>
                <p>{t('updateProfile.gallery.desc')}</p>
                {state.gallery_photos.length > 4 ? (
                    <div className="gallery-carousel-wrapper">
                        <button type="button" className="carousel-arrow prev">
                            <FiChevronLeft size={24} />
                        </button>
                        <Swiper
                            modules={[Navigation]}
                            spaceBetween={15}
                            slidesPerView={1}
                            navigation={{
                                nextEl: '.carousel-arrow.next',
                                prevEl: '.carousel-arrow.prev',
                            }}
                            breakpoints={{
                                480: {
                                    slidesPerView: 2,
                                },
                                768: {
                                    slidesPerView: 3,
                                },
                                1024: {
                                    slidesPerView: 4,
                                },
                            }}
                            className="gallery-carousel"
                        >
                            {state.gallery_photos.map((file, index) => (
                                <SwiperSlide key={index}>
                                    <div className="gallery-item">
                                        <Image
                                            src={getImageUrl(file)}
                                            alt={`gallery-${index}`}
                                            width={100}
                                            height={100}
                                            style={{
                                                objectFit: 'cover',
                                                width: '100%',
                                                height: '100%',
                                            }}
                                            unoptimized
                                        />
                                        <button
                                            type="button"
                                            className="remove-photo-btn"
                                            onClick={() => handleRemoveGalleryPhoto(file)}
                                            title={t('updateProfile.gallery.removeTitle')}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </SwiperSlide>
                            ))}
                        </Swiper>
                        <button type="button" className="carousel-arrow next">
                            <FiChevronRight size={24} />
                        </button>
                    </div>
                ) : (
                    <div className="gallery-grid">
                        {state.gallery_photos.map((file, index) => (
                            <div key={index} className="gallery-item">
                                <Image
                                    src={getImageUrl(file)}
                                    alt={`gallery-${index}`}
                                    width={100}
                                    height={100}
                                    style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                                    unoptimized
                                />
                                <button
                                    type="button"
                                    className="remove-photo-btn"
                                    onClick={() => handleRemoveGalleryPhoto(file)}
                                    title={t('updateProfile.gallery.removeTitle')}
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                        {[...Array(Math.max(0, 4 - state.gallery_photos.length))].map((_, i) => (
                            <div key={`empty-${i}`} className="gallery-item gallery-item--empty">
                                <FiImage size={36} />
                            </div>
                        ))}
                    </div>
                )}
                <FileUploader onFilesSelected={handleGalleryFilesSelected} />
            </div>

            <div className="d-flex justify-content-center">
                <button className="btn-primary" type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                        <>
                            <span className="spinner"></span>
                            {t('updateProfile.submit.saving')}
                        </>
                    ) : (
                        t('updateProfile.submit.saveContinue')
                    )}
                </button>
            </div>
        </form>
        <ImageCropModal
            isOpen={Boolean(cropState.target && cropState.files[cropState.index])}
            file={cropState.files[cropState.index] || null}
            shape={cropState.target === 'profile' ? 'circle' : 'square'}
            title={
                cropState.target === 'profile'
                    ? t('updateProfile.crop.profileTitle')
                    : t('updateProfile.crop.galleryTitle')
            }
            queueLabel={
                cropState.target === 'gallery' && cropState.files.length > 1
                    ? t('updateProfile.crop.queueLabel', {
                          current: cropState.index + 1,
                          total: cropState.files.length,
                      })
                    : ''
            }
            onCancel={closeCropModal}
            onConfirm={handleCropConfirm}
        />
        </>
    );
};

export default UpdateProfile;
