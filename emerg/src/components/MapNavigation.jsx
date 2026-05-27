import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { X, Navigation, AlertTriangle } from 'lucide-react';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const sosIcon = L.divIcon({
    className: 'sos-marker',
    html: `<div style="background-color: var(--danger); width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px var(--danger-glow); display: flex; align-items: center; justify-content: center;"><span style="color: white; font-weight: bold; font-size: 12px;">!</span></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
});

function Recenter({ lat, lng }) {
    const map = useMap();
    useEffect(() => {
        if (lat && lng) {
            map.setView([lat, lng]);
        }
    }, [lat, lng, map]);
    return null;
}

export default function MapNavigation({ targetLocation, onClose }) {
    const [myLocation, setMyLocation] = useState(null);
    const [distance, setDistance] = useState(null);

    useEffect(() => {
        if (!navigator.geolocation) return;

        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                const newLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setMyLocation(newLoc);

                if (targetLocation?.lat && targetLocation?.lng) {
                    const R = 6371e3; // metres
                    const φ1 = (newLoc.lat * Math.PI) / 180;
                    const φ2 = (targetLocation.lat * Math.PI) / 180;
                    const Δφ = ((targetLocation.lat - newLoc.lat) * Math.PI) / 180;
                    const Δλ = ((targetLocation.lng - newLoc.lng) * Math.PI) / 180;

                    const a =
                        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
                    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                    const d = R * c; // in metres

                    setDistance(Math.round(d));
                }
            },
            (err) => console.warn('Geolocation watch error:', err),
            { enableHighAccuracy: true, maximumAge: 10000 }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, [targetLocation]);

    const center = myLocation && targetLocation 
        ? [(myLocation.lat + targetLocation.lat) / 2, (myLocation.lng + targetLocation.lng) / 2]
        : targetLocation 
            ? [targetLocation.lat, targetLocation.lng] 
            : [0, 0];

    const zoom = myLocation && distance && distance < 2000 ? 15 : 13;

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <div style={styles.header}>
                    <div style={styles.headerTitle}>
                        <Navigation size={20} color="var(--info)" />
                        <h3>Rescue Navigation</h3>
                    </div>
                    <button onClick={onClose} style={styles.closeBtn}><X size={20} /></button>
                </div>

                <div style={styles.infoBar}>
                    {distance !== null ? (
                        <div style={styles.distance}>
                            <AlertTriangle size={16} color="var(--danger)" />
                            <strong>{distance} meters</strong> away (Straight Line)
                        </div>
                    ) : (
                        <div style={styles.distance}>Acquiring GPS...</div>
                    )}
                    <p style={styles.note}>Offline maps may not render streets, follow the vector line.</p>
                </div>

                <div style={styles.mapContainer}>
                    <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%', borderRadius: '12px' }}>
                        {}
                        <TileLayer
                            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                        />
                        
                        {myLocation && (
                            <Marker position={[myLocation.lat, myLocation.lng]}>
                                <Popup>Your Location</Popup>
                            </Marker>
                        )}

                        {targetLocation?.lat && (
                            <Marker position={[targetLocation.lat, targetLocation.lng]} icon={sosIcon}>
                                <Popup>SOS Signal Origin</Popup>
                            </Marker>
                        )}

                        {myLocation && targetLocation?.lat && (
                            <Polyline 
                                positions={[
                                    [myLocation.lat, myLocation.lng],
                                    [targetLocation.lat, targetLocation.lng]
                                ]} 
                                color="var(--danger)" 
                                dashArray="10, 10"
                                weight={3}
                            />
                        )}

                        <Recenter lat={center[0]} lng={center[1]} />
                    </MapContainer>
                </div>
            </div>
        </div>
    );
}

const styles = {
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        backdropFilter: 'blur(8px)',
    },
    modal: {
        background: 'var(--bg-card)',
        width: '100%',
        maxWidth: '800px',
        height: '80vh',
        borderRadius: '16px',
        border: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 24px',
        borderBottom: '1px solid var(--border-subtle)',
    },
    headerTitle: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        color: 'var(--text-primary)',
        margin: 0,
    },
    closeBtn: {
        background: 'transparent',
        border: 'none',
        color: 'var(--text-secondary)',
        cursor: 'pointer',
        padding: '4px',
        display: 'flex',
    },
    infoBar: {
        padding: '16px 24px',
        background: 'var(--bg-dark)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        borderBottom: '1px solid var(--border-subtle)',
    },
    distance: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '16px',
        color: 'var(--text-primary)',
    },
    note: {
        margin: 0,
        fontSize: '12px',
        color: 'var(--text-secondary)',
    },
    mapContainer: {
        flex: 1,
        padding: '12px',
        background: '#111',
    }
};
