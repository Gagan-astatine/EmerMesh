
export function getSectorFromCoords(lat, lon) {
    if (lat === null || lat === undefined || lon === null || lon === undefined) {
        return 'global-mesh-room';
    }

    const sectorLat = parseFloat(lat).toFixed(2);
    const sectorLon = parseFloat(lon).toFixed(2);
    
    return `sector_${sectorLat}_${sectorLon}`;
}
