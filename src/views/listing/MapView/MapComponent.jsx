'use client';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Link from 'next/link';
import { useEffect } from 'react';
import { TbMapPinOff } from 'react-icons/tb';
import { Circle, MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import { resolveAvatarUrl } from '@/services/avatar';
import './style.scss';

// Recenter component to dynamically update center and pan the map when props change
function MapRecenter({ lat, lng }) {
    const map = useMap();
    useEffect(() => {
        if (lat && lng) {
            map.setView([lat, lng], map.getZoom());
        }
    }, [lat, lng, map]);
    return null;
}

// Helper to safely extract coordinates from various property formats
const getCoordinates = (item) => {
    if (!item) return null;

    const latVal =
        item.lat !== undefined ? item.lat : item.latitude !== undefined ? item.latitude : null;
    const lngVal =
        item.long !== undefined
            ? item.long
            : item.longitude !== undefined
              ? item.longitude
              : item.lng !== undefined
                ? item.lng
                : null;

    const lat = parseFloat(latVal);
    const lng = parseFloat(lngVal);

    if (isNaN(lat) || isNaN(lng)) {
        return null;
    }

    return [lat, lng];
};

// HTML Marker Generators
const createSitterIcon = (sitter) => {
    const initial = sitter.name ? sitter.name.trim().charAt(0) : 'P';
    return L.divIcon({
        className: 'custom-map-marker sitter-marker',
        html: `
            <div class="pin-wrapper">
                <div class="pin-body sitter-color">
                    <!-- <span class="pin-initial">${initial}</span> -->
                    <img src="${resolveAvatarUrl(sitter.profile_image, sitter.profile_photo)}" alt="" class="pin-initial pin-image" />
                </div>
                <div class="pin-arrow sitter-arrow"></div>
            </div>
        `,
        iconSize: [36, 46],
        iconAnchor: [18, 46],
        popupAnchor: [0, -42],
    });
};

const createUserIcon = (user) => {
    console.log('pp', user);
    return L.divIcon({
        className: 'custom-map-marker user-marker',
        html: `
            <div class="pin-wrapper pulsating">
                <div class="pin-body user-color">
                    <span class="pin-initial">YOU</span>
                    <!-- <img src="${user.profile_photo?.url}" alt="" class="pin-initial pin-image" /> -->
                </div>
                <div class="pin-arrow user-arrow"></div>
            </div>
        `,
        iconSize: [40, 50],
        iconAnchor: [20, 50],
        popupAnchor: [0, -46],
    });
};

export default function MapComponent({
    lat,
    lng,
    radiusInMeters,
    sitters = null,
    user = null,
    isAuthenticated = false,
    showEmptyAlert = false,
    mapStyle = { height: '500px', width: '100%' },
}) {
    const defaultPosition = [lat || 22.6074291242716, lng || 88.42161538365986];

    // Determine logged-in user position
    const userCoords = user ? getCoordinates(user) : null;
    const activeUserPosition = isAuthenticated ? userCoords || defaultPosition : null;

    // Filter valid sitters that have coordinates
    const validSitters = Array.isArray(sitters)
        ? sitters.filter((sitter) => getCoordinates(sitter) !== null)
        : [];

    const hasNoSitters = Array.isArray(sitters) && sitters.length === 0;

    const userImg = resolveAvatarUrl(user?.profile_photo);

    const userFullName =
        user?.first_name || user?.last_name
            ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
            : 'Logged In User';

    const userLocation = user?.city || 'Your Location';
    const userEmail = user?.email || '';

    return (
        <div className="map-view-wrapper" style={mapStyle}>
            <MapContainer
                center={defaultPosition}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Recenter handler when lat/lng props change */}
                <MapRecenter lat={defaultPosition[0]} lng={defaultPosition[1]} />

                {/* Draw User location pin if logged in */}
                {activeUserPosition && (
                    <Marker position={activeUserPosition} icon={createUserIcon(user)}>
                        <Popup closeButton={true}>
                            <div className="popup-card">
                                <div className="popup-header">
                                    <img
                                        src={userImg}
                                        alt={userFullName}
                                        className="popup-img"
                                        style={{
                                            borderColor: '#f7b267',
                                        }}
                                    />
                                    <div className="popup-meta">
                                        <h4>{userFullName}</h4>
                                        <span className="popup-sub">{userLocation}</span>
                                    </div>
                                </div>

                                {userEmail && (
                                    <div
                                        style={{
                                            fontSize: '12px',
                                            color: '#19453d',
                                            margin: '4px 0',
                                            fontStyle: 'italic',
                                            opacity: 0.9,
                                        }}
                                    >
                                        {userEmail}
                                    </div>
                                )}

                                <Link
                                    href={user?.id ? `/profile?id=${user.id}` : '/profile'}
                                    className="popup-action-btn primary-btn"
                                >
                                    View Profile
                                </Link>
                            </div>
                        </Popup>
                    </Marker>
                )}

                {/* Draw Sitter Location Pins */}
                {validSitters.map((sitter, index) => {
                    const coords = getCoordinates(sitter);
                    const sitterImg = resolveAvatarUrl(sitter.profile_image, sitter.profile_photo);

                    const price =
                        sitter.hourly_rate || sitter.price || sitter.rate || 30 + (index % 5) * 10;
                    const ratingValue = sitter.rating || `4.${8 + (index % 2)}`;

                    return (
                        <Marker
                            key={sitter.id || index}
                            position={coords}
                            icon={createSitterIcon(sitter)}
                        >
                            <Popup closeButton={true}>
                                <div className="popup-card">
                                    <div className="popup-header">
                                        <img
                                            src={sitterImg}
                                            alt={sitter.name}
                                            className="popup-img"
                                        />
                                        <div className="popup-meta">
                                            <h4>{sitter.name}</h4>
                                            <span className="popup-sub">
                                                {sitter.location || 'Local Partner'}
                                            </span>
                                        </div>
                                    </div>

                                    <div
                                        style={{
                                            fontSize: '12px',
                                            color: '#19453d',
                                            margin: '4px 0',
                                            fontStyle: 'italic',
                                            opacity: 0.9,
                                        }}
                                    >
                                        "
                                        {sitter.profileSnippet
                                            ? sitter.profileSnippet.length > 70
                                                ? sitter.profileSnippet.substring(0, 67) + '...'
                                                : sitter.profileSnippet
                                            : 'Verified PawPoint provider'}
                                        "
                                    </div>

                                    <div className="popup-details">
                                        <div className="popup-price">${price}</div>
                                        <div className="popup-rating">★ {ratingValue}</div>
                                    </div>

                                    <Link
                                        href={sitter.id ? `/worker-details/${sitter.id}` : '#'}
                                        className="popup-action-btn"
                                    >
                                        View Profile
                                    </Link>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}

                {/* Draw the radius circle around user location if logged in */}
                {isAuthenticated && radiusInMeters && activeUserPosition && (
                    <Circle
                        center={activeUserPosition}
                        pathOptions={{ color: '#4a766e', fillColor: '#4a766e', fillOpacity: 0.1 }}
                        radius={radiusInMeters}
                    />
                )}

                {/* Draw the coverage radius circle around sitter/worker location on details page */}
                {!sitters && radiusInMeters && (
                    <Circle
                        center={defaultPosition}
                        pathOptions={{
                            color: '#f7b267',
                            fillColor: '#f7b267',
                            fillOpacity: 0.2,
                            weight: 1.5,
                        }}
                        radius={radiusInMeters}
                    />
                )}
            </MapContainer>

            {/* Float alert if no sitters are available */}
            {showEmptyAlert && hasNoSitters && (
                <div className="map-no-sitters-alert">
                    <div className="alert-content">
                        <TbMapPinOff className="alert-icon" />
                        <div className="alert-text">
                            <h5>No Partners Found in this Area</h5>
                            <p>
                                We couldn't find any sitters matching your search filters in this
                                location. Try widening your radius, adjusting filters, or searching
                                for a different city.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
