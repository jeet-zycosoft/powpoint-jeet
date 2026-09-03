'use client';
import UserAvatar from '@/components/UserAvatar';
import Link from 'next/link';
import { useIntl } from 'react-intl';
import './PetSitterCard.scss';

const PetSitterCard = ({ sitter }) => {
    const intl = useIntl();

    const formatServices = (services, fallback) => {
        const serviceNameMap = {
            boarding: intl.formatMessage({ id: 'services.boarding' }),
            house_sitting: intl.formatMessage({ id: 'services.sitting' }),
            drop_in_visit: intl.formatMessage({ id: 'services.dropIn' }),
            doggy_day_care: intl.formatMessage({ id: 'services.daycare' }),
            dog_walking: intl.formatMessage({ id: 'services.walking' }),
        };

        if (typeof services === 'string' && services.trim()) return services;
        if (services && typeof services === 'object') {
            const active = Object.entries(services)
                .filter(
                    ([_, val]) => val?.enabled === true || val === true || val === 1 || val === '1',
                )
                .map(([key]) => serviceNameMap[key] || key.replace(/_/g, ' '));
            if (active.length > 0) return active.slice(0, 2).join(', ');
        }
        return fallback || intl.formatMessage({ id: 'common.petSitter' });
    };

    let imageSrc =
        sitter?.profile_image ||
        sitter?.profile_photo ||
        sitter?.profile_photo_url ||
        sitter?.avatar ||
        sitter?.image ||
        '';

    if (imageSrc && typeof imageSrc === 'object') {
        imageSrc = imageSrc.url || imageSrc.path || imageSrc.src || '';
    }

    let sitterName = sitter?.name || '';
    if (!sitterName && (sitter?.first_name || sitter?.last_name)) {
        sitterName = `${sitter.first_name || ''} ${sitter.last_name || ''}`.trim();
    }
    if (!sitterName) sitterName = intl.formatMessage({ id: 'common.petSitter' });

    const formattedServices = formatServices(
        sitter?.services || sitter?.sitter_services,
        sitter?.profile_title || sitter?.city,
    );

    const cardContent = (
        <div className="pet-sitter-card">
            <div className="pet-sitter-card__image-wrap">
                <UserAvatar src={imageSrc} alt={sitterName} />
            </div>
            <h3>{sitterName}</h3>
            <p>{formattedServices}</p>
        </div>
    );

    if (sitter?.id) {
        return (
            <Link href={`/worker-details/${sitter.id}`} className="pet-sitter-card-link">
                {cardContent}
            </Link>
        );
    }

    return cardContent;
};

export default PetSitterCard;
