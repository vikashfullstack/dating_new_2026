import { JAMSHEDPUR_LOCALITIES, calculateDistanceKm } from '../src/data/mockProfiles';

export function validCoordinates(value: any): value is { lat: number; lng: number } {
  return value && typeof value.lat === 'number' && typeof value.lng === 'number'
    && Number.isFinite(value.lat) && Number.isFinite(value.lng)
    && Math.abs(value.lat) <= 90 && Math.abs(value.lng) <= 180;
}

export function discoveryProfiles(users: any[], viewer: any) {
  return users.filter(user => user.id !== viewer.id).map(user => {
    const locality = JAMSHEDPUR_LOCALITIES.find(place => place.name === user.locality);
    const coordinates = locality?.coordinates || { lat: 22.7952, lng: 86.1648 };
    const distanceKm = calculateDistanceKm(
      viewer.coordinates.lat, viewer.coordinates.lng,
      (validCoordinates(user.coordinates) ? user.coordinates : coordinates).lat,
      (validCoordinates(user.coordinates) ? user.coordinates : coordinates).lng,
    );
    // Explicit public fields: never expose email, credentials or precise GPS coordinates.
    return {
      id: user.id, name: user.name, age: user.age, city: user.city || 'Jamshedpur',
      locality: user.locality || '', neighborhood: user.locality || '', coordinates,
      distanceKm, distanceMiles: Math.round(distanceKm * 0.621371 * 10) / 10,
      bio: user.bio || '', tagline: user.tagline || '', occupation: user.occupation || '',
      education: user.education || '', height: user.height || '',
      intent: user.intent || 'Meaningful Dating', passions: user.passions || [],
      lifestyle: user.lifestyle || [], photos: user.photos || [], videos: user.videos || [],
      verification: {
        status: user.verification?.status || 'unverified',
        trustScore: user.verification?.trustScore || 0,
        verifiedAt: user.verification?.verifiedAt || '',
        hash: '', zkProofToken: '',
        method: 'Biometric Face Liveness + Cryptographic Gov-ID Scan',
      },
      matchCompatibility: 0, initialGreeting: '', isOnline: false,
    };
  }).sort((a, b) => a.distanceKm - b.distanceKm);
}
