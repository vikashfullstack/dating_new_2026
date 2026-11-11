import { SingleProfile, UserCurrentProfile, SubscriptionPackage } from '../types';

export interface LocalityInfo {
  name: string;
  city: string;
  coordinates: { lat: number; lng: number };
  description: string;
}

export const JAMSHEDPUR_LOCALITIES: LocalityInfo[] = [
  { name: 'Adityapur', city: 'Jamshedpur', coordinates: { lat: 22.7845, lng: 86.1627 }, description: 'Industrial & technology corridor across Kharkai River' },
  { name: 'Sonari', city: 'Jamshedpur', coordinates: { lat: 22.8122, lng: 86.1685 }, description: 'Scenic greens, Domuhani River confluence & quiet cafes' },
  { name: 'Kadma', city: 'Jamshedpur', coordinates: { lat: 22.7952, lng: 86.1648 }, description: 'Tree-lined residential avenues, parks & local bakeries' },
  { name: 'Mango', city: 'Jamshedpur', coordinates: { lat: 22.8251, lng: 86.2045 }, description: 'Lively north district near Subarnarekha & Dimna foothill trails' },
  { name: 'Chandil', city: 'Jamshedpur', coordinates: { lat: 22.9642, lng: 86.0463 }, description: 'Scenic lake reservoir, weekend drives & peaceful hill vistas' },
  { name: 'Bistupur', city: 'Jamshedpur', coordinates: { lat: 22.8016, lng: 86.1854 }, description: 'Central commercial district, heritage eateries & cultural hub' },
  { name: 'Sakchi', city: 'Jamshedpur', coordinates: { lat: 22.8105, lng: 86.2052 }, description: 'Historic heart of the steel city, vibrant markets & Jubilee Park' },
  { name: 'Telco', city: 'Jamshedpur', coordinates: { lat: 22.7758, lng: 86.2482 }, description: 'Serene planned township with lush greenery & club grounds' },
];

// Calculate Haversine distance in kilometers
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// Find nearest locality based on Chrome browser GPS coordinates
export function findNearestLocality(lat: number, lng: number): LocalityInfo {
  let nearest = JAMSHEDPUR_LOCALITIES[0];
  let minDistance = Infinity;

  for (const loc of JAMSHEDPUR_LOCALITIES) {
    const dist = calculateDistanceKm(lat, lng, loc.coordinates.lat, loc.coordinates.lng);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = loc;
    }
  }

  return nearest;
}

export const DEFAULT_STARTING_TOKENS = 500;

export const initialCurrentUser: UserCurrentProfile = {
  id: 'usr_me_7718',
  email: 'alex.verma@cipherdate.in',
  tokens: DEFAULT_STARTING_TOKENS, // By default user gets 500 tokens
  name: 'Alex Verma',
  age: 28,
  city: 'Jamshedpur',
  locality: 'Kadma',
  neighborhood: 'Kadma',
  coordinates: { lat: 22.7952, lng: 86.1648 },
  bio: 'Product designer interested in photography, vinyl records, filter coffee runs near Jubilee Park, and architecture.',
  occupation: 'Lead Interface Designer',
  intent: 'Meaningful Dating',
  passions: ['#CoffeeLover', '#AnalogPhotography', '#Architecture', '#MidCenturyDesign', '#Bouldering'],
  photos: [
    '/src/assets/images/disney_3d_male_two_1794403842274.jpg',
  ],
  verification: {
    status: 'verified',
    hash: '0x9e8b241fc9d012a677e4cb992',
    verifiedAt: 'March 2026',
    method: 'Biometric Face Liveness + Cryptographic Gov-ID Scan',
    zkProofToken: 'zkp_ed25519_88192a_authenticated',
    trustScore: 99.8,
  },
  maxDistanceRadiusKm: 20,
  maxDistanceRadiusMiles: 12,
  ageRange: [24, 35],
  onlyVerifiedMatches: true,
  membershipTier: 'plus',
};

export const SUBSCRIPTION_PACKAGES: SubscriptionPackage[] = [
  {
    id: 'essential',
    name: 'Essential Pass',
    tagline: 'Ideal for singles seeking local verified connections with end-to-end encryption.',
    monthlyPriceRupees: 500,
    annualPriceRupeesPerMonth: 400,
    connectionLimit: '25 Connections / Day',
    badgeTitle: 'Verified Member',
    features: [
      'Up to 25 verified profile connections per day',
      'Client-side AES-256-GCM hardware encrypted chats',
      'Standard match radius up to 15 km in Jamshedpur',
      '3D Biometric facial liveness verification badge',
      'Hobby & interest tag matching filter (#CoffeeLover, etc.)',
      'Zero-knowledge profile security audit',
    ],
  },
  {
    id: 'plus',
    name: 'Matchmaker Plus',
    tagline: 'Most popular for active singles who want unlimited encrypted dating and priority matchmaking.',
    monthlyPriceRupees: 1200,
    annualPriceRupeesPerMonth: 950,
    popular: true,
    connectionLimit: 'Unlimited Connections',
    badgeTitle: 'Plus Member',
    features: [
      'Unlimited verified local connections & likes',
      'Unlimited end-to-end encrypted messaging & audio voice notes',
      'Expanded match radius up to 50 km + Indian metro city roaming',
      'See Who Liked You unmasked gallery',
      '5 Super Matches per week with priority feed placement',
      'Disappearing messages timer (1h, 24h, 7 days)',
      'Verified Public Meetup Date Proposer with partner venue perks',
    ],
  },
  {
    id: 'elite',
    name: 'Cryptographic Elite',
    tagline: 'The ultimate discreet dating experience with full incognito roaming and VIP concierge.',
    monthlyPriceRupees: 2500,
    annualPriceRupeesPerMonth: 1950,
    connectionLimit: 'Unlimited + Incognito',
    badgeTitle: 'Elite VIP',
    features: [
      'All features included in Matchmaker Plus',
      'Incognito Browsing (Differential Privacy 2.0 with invisible profile browsing)',
      'Direct Encrypted Messaging before mutual match',
      'Signal-grade peer safety code export & personal audit certificate',
      'Unlimited Super Matches & profile boost spotlight',
      'Dedicated 24/7 Priority Concierge & Safety Escort line',
      'Global roaming to international tech and cultural hubs',
    ],
  },
];

export interface TokenPackage {
  id: string;
  tokens: number;
  priceRupees: number;
  bonusTokens?: number;
  popular?: boolean;
}

export const TOKEN_PACKAGES: TokenPackage[] = [
  { id: 'pack_starter', tokens: 250, priceRupees: 199, bonusTokens: 0 },
  { id: 'pack_popular', tokens: 600, priceRupees: 399, bonusTokens: 100, popular: true },
  { id: 'pack_mega', tokens: 1500, priceRupees: 799, bonusTokens: 300 },
];

export const DEMO_ACCOUNTS = [
  {
    email: 'alex.verma@cipherdate.in',
    name: 'Alex Verma',
    age: 28,
    locality: 'Kadma',
    city: 'Jamshedpur',
    tokens: 500,
    photo: '/src/assets/images/disney_3d_male_two_1794403842274.jpg',
    bio: 'Product designer interested in photography, vinyl records, filter coffee runs near Jubilee Park, and architecture.',
    passions: ['#CoffeeLover', '#AnalogPhotography', '#Architecture', '#MidCenturyDesign'],
    intent: 'Meaningful Dating' as const,
    occupation: 'Lead Interface Designer',
  },
  {
    email: 'priyanka@cipherdate.in',
    name: 'Priyanka',
    age: 26,
    locality: 'Sonari',
    city: 'Jamshedpur',
    tokens: 500,
    photo: '/src/assets/images/disney_3d_female_three_1794403892838.jpg',
    bio: 'Architectural ceramicist & cyclist. Lover of Domuhani river sunsets, clay firing, and slow espresso mornings.',
    passions: ['#Ceramics', '#TrailRunning', '#Architecture', '#CoffeeLover'],
    intent: 'Meaningful Dating' as const,
    occupation: 'Ceramic Artist & Studio Owner',
  },
  {
    email: 'rohan.singh@cipherdate.in',
    name: 'Rohan Singh',
    age: 29,
    locality: 'Adityapur',
    city: 'Jamshedpur',
    tokens: 500,
    photo: '/src/assets/images/disney_3d_male_one_1794403842622.jpg',
    bio: 'Automotive systems engineer & acoustic guitar player. Enjoy weekend drives to Chandil Dam and trying local dhabas.',
    passions: ['#AnalogPhotography', '#AcousticGuitar', '#TrailRunning', '#Minimalism'],
    intent: 'Long-term Partnership' as const,
    occupation: 'Automotive Systems Lead',
  },
];

export const localSinglesData: SingleProfile[] = [
  {
    id: 'usr_maya_992',
    name: 'Maya Sharma',
    age: 28,
    city: 'Jamshedpur',
    locality: 'Sonari',
    neighborhood: 'Sonari',
    coordinates: { lat: 22.8122, lng: 86.1685 },
    distanceKm: 2.1,
    distanceMiles: 1.3,
    tagline: 'Ceramics maker, urban cyclist & filter coffee lover',
    bio: 'Designing sustainable urban timber architecture. On quiet evenings, you will find me at Domuhani riverbank enjoying coffee or working clay in my studio. Looking for someone who enjoys peaceful river walks, bookstores, and honest conversations.',
    occupation: 'Sustainable Architect',
    companyOrStudio: 'Studio Kroma Jamshedpur',
    education: 'IIT Kharagpur Architecture',
    height: "5'7\"",
    intent: 'Meaningful Dating',
    passions: ['#CoffeeLover', '#Ceramics', '#SustainableArchitecture', '#FilmNoir', '#UrbanCycling'],
    lifestyle: ['Non-smoker', 'Early Riser', 'Active Cyclist', 'Domuhani River Walks'],
    photos: [
      '/src/assets/images/single_female_coffee_1794323554399.jpg',
      '/src/assets/images/single_female_garden_1794323555988.jpg',
    ],
    verification: {
      status: 'verified',
      hash: '0x7c91a45e9903b1298d02fa7431',
      verifiedAt: 'Feb 2026',
      method: 'Biometric Face Liveness + Cryptographic Gov-ID Scan',
      zkProofToken: 'zkp_secp256k1_90412e_verified',
      trustScore: 100,
    },
    matchCompatibility: 96,
    initialGreeting: 'Hey! Loved seeing your interest in design and typography. Have you been to the quiet cafes near Domuhani or Cafe Regal lately?',
    isOnline: true,
  },
  {
    id: 'usr_julian_410',
    name: 'Julian Das',
    age: 30,
    city: 'Jamshedpur',
    locality: 'Bistupur',
    neighborhood: 'Bistupur',
    coordinates: { lat: 22.8016, lng: 86.1854 },
    distanceKm: 2.8,
    distanceMiles: 1.7,
    tagline: 'Industrial designer & rare vinyl monograph collector',
    bio: 'Crafting analog sound equipment and minimalist wooden furniture in Bistupur. Love spending weekend mornings browsing heritage bookshops and hunting vintage Hi-Fi gear. Looking for genuine chemistry and thoughtful conversations.',
    occupation: 'Principal Industrial Designer',
    companyOrStudio: 'Vance Audio Works',
    education: 'National Institute of Design (NID)',
    height: "6'1\"",
    intent: 'Long-term Partnership',
    passions: ['#AnalogAudio', '#IndustrialDesign', '#VintageBooks', '#JazzVinyl', '#ItalianCooking'],
    lifestyle: ['Social Drinker', 'Design Enthusiast', 'Night Owl', 'Cooks Daily'],
    photos: [
      '/src/assets/images/single_male_studio_1794323555092.jpg',
      '/src/assets/images/single_male_urban_1794323556495.jpg',
    ],
    verification: {
      status: 'verified',
      hash: '0x3f18cb22e09477aa1909cd349a',
      verifiedAt: 'Jan 2026',
      method: 'Biometric Face Liveness + Cryptographic Gov-ID Scan',
      zkProofToken: 'zkp_p256_778103_verified',
      trustScore: 99.4,
    },
    matchCompatibility: 94,
    initialGreeting: 'Hey Alex! Great to connect with another design enthusiast in town. Loved your profile ethos!',
    isOnline: true,
  },
  {
    id: 'usr_elena_831',
    name: 'Elena Hembrom',
    age: 26,
    city: 'Jamshedpur',
    locality: 'Kadma',
    neighborhood: 'Kadma',
    coordinates: { lat: 22.7952, lng: 86.1648 },
    distanceKm: 0.9,
    distanceMiles: 0.5,
    tagline: 'Botanical landscape planner & weekend bread baker',
    bio: 'Living in green Kadma avenues. Restoring native tree canopies and micro-pollinator gardens. Big believer in sourdough starters, outdoor reading sessions, and deep conversations over spiced chai or dark roast coffee.',
    occupation: 'Botanical Landscape Specialist',
    companyOrStudio: 'Green Canopy Initiative',
    education: 'BHU Landscape Architecture',
    height: "5'6\"",
    intent: 'Meaningful Dating',
    passions: ['#UrbanEcology', '#BotanicalGardens', '#SourdoughBaking', '#TrailRunning', '#CoffeeLover'],
    lifestyle: ['Plant-forward', 'Early Bird', 'Marathon Runner', 'Dog Lover'],
    photos: [
      '/src/assets/images/single_female_garden_1794323555988.jpg',
      '/src/assets/images/single_female_coffee_1794323554399.jpg',
    ],
    verification: {
      status: 'verified',
      hash: '0xaa19e3488cf41109923891bbec',
      verifiedAt: 'March 2026',
      method: 'Biometric Face Liveness + Cryptographic Gov-ID Scan',
      zkProofToken: 'zkp_ed25519_23910c_verified',
      trustScore: 99.9,
    },
    matchCompatibility: 91,
    initialGreeting: 'Hi Alex! Nice to see someone so close in Kadma. Have you enjoyed the morning park trails here recently?',
    isOnline: false,
  },
  {
    id: 'usr_marcus_209',
    name: 'Marcus Topno',
    age: 32,
    city: 'Jamshedpur',
    locality: 'Adityapur',
    neighborhood: 'Adityapur',
    coordinates: { lat: 22.7845, lng: 86.1627 },
    distanceKm: 3.4,
    distanceMiles: 2.1,
    tagline: 'Documentary cinematographer & distance runner',
    bio: 'Directing indie documentary films on river water preservation and local indigenous craft. When in Adityapur, you will catch me on 10k morning runs across the bridge or testing vintage Leica cameras.',
    occupation: 'Documentary Director of Photography',
    companyOrStudio: 'Subarnarekha Media',
    education: 'SRFTI Kolkata',
    height: "6'0\"",
    intent: 'Coffee & Conversation',
    passions: ['#DocumentaryCinema', '#AnalogPhotography', '#NaturalWines', '#VinylCollecting', '#HalfMarathon'],
    lifestyle: ['Active Traveler', 'Runner', 'Film Buff', 'Weekend Cook'],
    photos: [
      '/src/assets/images/single_male_urban_1794323556495.jpg',
      '/src/assets/images/single_male_studio_1794323555092.jpg',
    ],
    verification: {
      status: 'verified',
      hash: '0x55bc1099a80e437fa88200d41e',
      verifiedAt: 'Dec 2025',
      method: 'Biometric Face Liveness + Cryptographic Gov-ID Scan',
      zkProofToken: 'zkp_secp256k1_66190a_verified',
      trustScore: 99.7,
    },
    matchCompatibility: 88,
    initialGreeting: 'Hey! Loved your photography passions. Always great to find analog film lovers right across the river in town!',
    isOnline: true,
  },
  {
    id: 'usr_sophia_622',
    name: 'Sophia Sen',
    age: 29,
    city: 'Jamshedpur',
    locality: 'Mango',
    neighborhood: 'Mango',
    coordinates: { lat: 22.8251, lng: 86.2045 },
    distanceKm: 5.6,
    distanceMiles: 3.5,
    tagline: 'Computational biologist, cellist & matcha enthusiast',
    bio: 'Analyzing bioinformatics and protein sequences remotely. On weekends, I love morning trail runs toward Dimna Lake foothills or playing cello chamber pieces. Looking for thoughtful, genuine connection.',
    occupation: 'Senior Computational Biologist',
    companyOrStudio: 'Genomics Research Lab',
    education: 'IISc Bangalore & PhD',
    height: "5'5\"",
    intent: 'Long-term Partnership',
    passions: ['#Genomics', '#ClassicalCello', '#MatchaCeremony', '#Bouldering', '#HistoricalFiction'],
    lifestyle: ['Classical Musician', 'Avid Reader', 'Morning Meditation', 'Trail Hiker'],
    photos: [
      '/src/assets/images/single_female_warm_1794323556626.jpg',
      '/src/assets/images/single_female_garden_1794323555988.jpg',
    ],
    verification: {
      status: 'verified',
      hash: '0x88f912ca6e0018bca492020e10',
      verifiedAt: 'March 2026',
      method: 'Biometric Face Liveness + Cryptographic Gov-ID Scan',
      zkProofToken: 'zkp_p256_33991b_verified',
      trustScore: 100,
    },
    matchCompatibility: 97,
    initialGreeting: 'Hello Alex! I was intrigued by your bouldering and design background. Have you done any Dimna foothill hikes lately?',
    isOnline: true,
  },
  {
    id: 'usr_daniel_541',
    name: 'Daniel Soren',
    age: 31,
    city: 'Jamshedpur',
    locality: 'Chandil',
    neighborhood: 'Chandil',
    coordinates: { lat: 22.9642, lng: 86.0463 },
    distanceKm: 16.8,
    distanceMiles: 10.4,
    tagline: 'Fintech security engineer & lake drive enthusiast',
    bio: 'Working on zero-knowledge encryption protocols. Based in scenic Chandil near the dam waters, but frequently visiting Bistupur cafes on weekends for filter coffee, chess, and art exhibitions.',
    occupation: 'Cryptographic Security Engineer',
    companyOrStudio: 'ZeroProof Labs',
    education: 'IIT Kharagpur Computer Science',
    height: "5'11\"",
    intent: 'Long-term Partnership',
    passions: ['#Cryptography', '#CoffeeLover', '#ChessClub', '#HudsonGreenway', '#ModernArt'],
    lifestyle: ['Crypto Researcher', 'Non-smoker', 'Early Riser', 'Quiet Lake Drives'],
    photos: [
      '/src/assets/images/single_male_studio_1794323555092.jpg',
    ],
    verification: {
      status: 'verified',
      hash: '0x12c49980ab77f601bce239d109',
      verifiedAt: 'Feb 2026',
      method: 'Biometric Face Liveness + Cryptographic Gov-ID Scan',
      zkProofToken: 'zkp_ed25519_55018a_verified',
      trustScore: 99.6,
    },
    matchCompatibility: 93,
    initialGreeting: 'Hey Alex! Great to meet another privacy advocate on CipherDate. E2EE matchmaking is truly the future.',
    isOnline: false,
  },
  {
    id: 'usr_clara_109',
    name: 'Clara Murmu',
    age: 27,
    city: 'Jamshedpur',
    locality: 'Sakchi',
    neighborhood: 'Sakchi',
    coordinates: { lat: 22.8105, lng: 86.2052 },
    distanceKm: 4.2,
    distanceMiles: 2.6,
    tagline: 'Art curator, French pastry aficionado & swimmer',
    bio: 'Curating tribal contemporary art and sculpture exhibitions. Weekend routine: swimming laps, exploring local heritage markets, and taking 35mm film photos near Jubilee Park.',
    occupation: 'Contemporary Art Curator',
    companyOrStudio: 'Tribal Cultural Heritage Centre',
    education: 'Visva-Bharati Shantiniketan',
    height: "5'8\"",
    intent: 'Meaningful Dating',
    passions: ['#ContemporaryArt', '#AnalogPhotography', '#Boulangerie', '#35mmFilm', '#FrenchCinema'],
    lifestyle: ['Curator', 'Swimmer', 'Coffee Lover', 'Flea Market Regular'],
    photos: [
      '/src/assets/images/single_female_warm_1794323556626.jpg',
    ],
    verification: {
      status: 'verified',
      hash: '0x2289c1044ba90ef981044ce919',
      verifiedAt: 'March 2026',
      method: 'Biometric Face Liveness + Cryptographic Gov-ID Scan',
      zkProofToken: 'zkp_secp256k1_77189d_verified',
      trustScore: 99.1,
    },
    matchCompatibility: 89,
    initialGreeting: 'Hello Alex! Always love meeting creative designers in town. Have you visited the new art gallery exhibit in Sakchi?',
    isOnline: true,
  },
  {
    id: 'usr_liam_772',
    name: 'Liam Roy',
    age: 33,
    city: 'Jamshedpur',
    locality: 'Telco',
    neighborhood: 'Telco',
    coordinates: { lat: 22.7758, lng: 86.2482 },
    distanceKm: 7.9,
    distanceMiles: 4.9,
    tagline: 'Renewable energy advisor & acoustic guitarist',
    bio: 'Working on clean energy and solar grid integration. Love living in the peaceful, tree-lined Telco colony. Enjoy playing fingerstyle guitar, exploring local food stalls, and weekend drives.',
    occupation: 'Clean Energy Strategist',
    companyOrStudio: 'TerraGrid Dynamics',
    education: 'ISM Dhanbad',
    height: "6'2\"",
    intent: 'Long-term Partnership',
    passions: ['#CleanTech', '#CatskillHikes', '#AcousticGuitar', '#JapaneseRamen', '#CoffeeLover'],
    lifestyle: ['Outdoor Adventurer', 'Dog Foster', 'Early Riser', 'Active Volunteer'],
    photos: [
      '/src/assets/images/single_male_urban_1794323556495.jpg',
    ],
    verification: {
      status: 'verified',
      hash: '0x66184920bb334eac89100fa567',
      verifiedAt: 'Jan 2026',
      method: 'Biometric Face Liveness + Cryptographic Gov-ID Scan',
      zkProofToken: 'zkp_p256_994101_verified',
      trustScore: 99.8,
    },
    matchCompatibility: 92,
    initialGreeting: 'Hey! Nice to see your focus on sustainability and craft. Any favorite coffee spots near the city?',
    isOnline: false,
  }
];

export const safetyCertifications = [
  {
    title: 'Zero-Knowledge Identity Verification',
    badge: 'ZK-SNARK Authenticated',
    description: 'Each member undergoes multi-angle 3D facial liveness and government biometric checks. No unhashed personal identification is stored on centralized servers.',
  },
  {
    title: 'Client-Side AES-256-GCM Cryptography',
    badge: 'Hardware Key Protection',
    description: 'Chat sessions derive unique ephemeral cryptographic keys via Web Crypto SubtleCrypto. Messages are encrypted and decrypted strictly on your device.',
  },
  {
    title: 'Locality Privacy & Radius Fuzzing',
    badge: 'Differential Privacy 2.0',
    description: 'Exact coordinates and home addresses are NEVER shared. Only your general locality (e.g. Kadma, Sonari, Adityapur) is shown to potential matches.',
  },
  {
    title: 'Safety Number Fingerprint Audit',
    badge: 'Peer-to-Peer Verified',
    description: 'Compare 6-block Signal-grade safety codes or scan QR verification hashes directly with any match to rule out man-in-the-middle tampering.',
  }
];
