import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const DATA_DIR = isServerless ? path.join('/tmp', 'atlassi-data') : path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'store.json');

const hashPassword = (password, salt = crypto.randomBytes(16).toString('hex')) => {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
};

const verifyPassword = (password, storedCombined) => {
  if (!storedCombined || !storedCombined.includes(':')) return false;
  const [salt, storedHash] = storedCombined.split(':');
  const computedHash = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(computedHash, 'hex'), Buffer.from(storedHash, 'hex'));
};

const INITIAL_USERS = [
  {
    id: 999,
    name: 'Atlassi Admin',
    email: 'admin@atlassi.ma',
    phone: '+212 600 000 000',
    password: hashPassword('atlassi2024'),
    role: 'ADMIN',
    phoneVerifiedAt: new Date('2026-01-01T00:00:00Z').toISOString(),
    createdAt: new Date('2026-01-01T00:00:00Z').toISOString()
  },
  {
    id: 1,
    name: 'Karim Bennani',
    email: 'karim@atlassi.ma',
    phone: '+212 661 234 567',
    password: hashPassword('password123'),
    role: 'USER',
    phoneVerifiedAt: new Date('2026-01-15T10:00:00Z').toISOString(),
    createdAt: new Date('2026-01-10T09:00:00Z').toISOString()
  },
  {
    id: 2,
    name: 'Yasmine Lahlou',
    email: 'yasmine@atlassi.ma',
    phone: '+212 662 987 654',
    password: hashPassword('password123'),
    role: 'USER',
    phoneVerifiedAt: new Date('2026-01-20T14:30:00Z').toISOString(),
    createdAt: new Date('2026-01-12T11:00:00Z').toISOString()
  },
  {
    id: 3,
    name: 'Taha El Alami',
    email: 'taha@atlassi.ma',
    phone: '+212 663 555 123',
    password: hashPassword('password123'),
    role: 'USER',
    phoneVerifiedAt: new Date('2026-02-01T08:15:00Z').toISOString(),
    createdAt: new Date('2026-01-28T16:20:00Z').toISOString()
  }
];

const INITIAL_LISTINGS = [
  {
    id: 1,
    title: 'Light-filled apartment on Boulevard Makkah',
    description: 'A calm, generously proportioned residence with an expansive terrace, sun-drenched living areas, and modern high-end finishes. Located along Boulevard Makkah in Laayoune.',
    price: 6500,
    priceLabel: 'MAD / month',
    purpose: 'RENT',
    type: 'APARTMENT',
    location: 'Boulevard Makkah',
    city: 'Laayoune',
    neighborhood: 'Boulevard Makkah',
    images: [
      { id: 101, url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=85&w=1400', isPrimary: true, sortOrder: 0 },
      { id: 102, url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&q=85&w=1400', isPrimary: false, sortOrder: 1 },
      { id: 103, url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&q=85&w=1400', isPrimary: false, sortOrder: 2 },
      { id: 104, url: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&q=85&w=1400', isPrimary: false, sortOrder: 3 }
    ],
    bedrooms: 3,
    bathrooms: 2,
    livingRooms: 1,
    kitchens: 1,
    floors: 1,
    propertyFloor: 2,
    surface: 145,
    condition: 'Excellent',
    furnished: true,
    amenities: ['Balcony', 'Private parking', 'Elevator', 'Air conditioning', 'High-speed fiber'],
    isFeatured: true,
    status: 'PUBLISHED',
    sellerId: 1,
    createdAt: new Date('2026-03-01T12:00:00Z').toISOString(),
    updatedAt: new Date('2026-03-01T12:00:00Z').toISOString()
  },
  {
    id: 2,
    title: 'Contemporary luxury villa in Hay El Qods',
    description: 'A spacious modern villa featuring elegant Moroccan architecture, landscaped private courtyard, and roof terrace in the peaceful Hay El Qods district of Laayoune.',
    price: 3200000,
    priceLabel: 'MAD',
    purpose: 'SALE',
    type: 'VILLA',
    location: 'Hay El Qods',
    city: 'Laayoune',
    neighborhood: 'Hay El Qods',
    images: [
      { id: 201, url: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=85&w=1400', isPrimary: true, sortOrder: 0 },
      { id: 202, url: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&q=85&w=1400', isPrimary: false, sortOrder: 1 },
      { id: 203, url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=85&w=1400', isPrimary: false, sortOrder: 2 },
      { id: 204, url: 'https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?auto=format&fit=crop&q=85&w=1400', isPrimary: false, sortOrder: 3 }
    ],
    bedrooms: 5,
    bathrooms: 4,
    livingRooms: 2,
    kitchens: 1,
    floors: 2,
    propertyFloor: null,
    surface: 360,
    condition: 'New build',
    furnished: false,
    amenities: ['Private courtyard', 'Landscaped garden', 'Covered garage', 'Fireplace', 'Solar heating'],
    isFeatured: true,
    status: 'PUBLISHED',
    sellerId: 2,
    createdAt: new Date('2026-03-05T09:30:00Z').toISOString(),
    updatedAt: new Date('2026-03-05T09:30:00Z').toISOString()
  },
  {
    id: 3,
    title: 'Architect-designed house in Al Wifaq',
    description: 'A modern family home in the growing Al Wifaq district. Features multiple living salons, private courtyard, and refined interior ironwork.',
    price: 2450000,
    priceLabel: 'MAD',
    purpose: 'SALE',
    type: 'HOUSE',
    location: 'Quartier Al Wifaq',
    city: 'Laayoune',
    neighborhood: 'Al Wifaq',
    images: [
      { id: 301, url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=85&w=1400', isPrimary: true, sortOrder: 0 },
      { id: 302, url: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&q=85&w=1400', isPrimary: false, sortOrder: 1 },
      { id: 303, url: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&q=85&w=1400', isPrimary: false, sortOrder: 2 }
    ],
    bedrooms: 4,
    bathrooms: 3,
    livingRooms: 2,
    kitchens: 1,
    floors: 2,
    propertyFloor: null,
    surface: 280,
    condition: 'Renovated',
    furnished: false,
    amenities: ['Private courtyard', 'Terrace', 'Fireplace', 'Covered garage', 'Gated security'],
    isFeatured: true,
    status: 'PUBLISHED',
    sellerId: 3,
    createdAt: new Date('2026-03-08T15:45:00Z').toISOString(),
    updatedAt: new Date('2026-03-08T15:45:00Z').toISOString()
  },
  {
    id: 4,
    title: 'Traditional house with spacious patio in Hay Dcheira',
    description: 'A authentic Moroccan multi-level house in Hay Dcheira featuring central open patio, traditional zellige tiles, and rooftop solarium.',
    price: 1850000,
    priceLabel: 'MAD',
    purpose: 'SALE',
    type: 'HOUSE',
    location: 'Hay Dcheira',
    city: 'Laayoune',
    neighborhood: 'Hay Dcheira',
    images: [
      { id: 401, url: 'https://images.unsplash.com/photo-1548013146-72479768bbaa?auto=format&fit=crop&q=85&w=1400', isPrimary: true, sortOrder: 0 },
      { id: 402, url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=85&w=1400', isPrimary: false, sortOrder: 1 },
      { id: 403, url: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&q=85&w=1400', isPrimary: false, sortOrder: 2 }
    ],
    bedrooms: 4,
    bathrooms: 3,
    livingRooms: 2,
    kitchens: 1,
    floors: 2,
    propertyFloor: null,
    surface: 240,
    condition: 'Restored heritage',
    furnished: true,
    amenities: ['Central patio', 'Rooftop terrace', 'Historic zellige', 'Traditional fountain'],
    isFeatured: false,
    status: 'PUBLISHED',
    sellerId: 1,
    createdAt: new Date('2026-03-11T11:20:00Z').toISOString(),
    updatedAt: new Date('2026-03-11T11:20:00Z').toISOString()
  },
  {
    id: 5,
    title: 'Sunlit studio on Boulevard Mohammed V',
    description: 'An architectural studio space flooded with natural light along Boulevard Mohammed V. Fully furnished with custom woodwork and modern bathroom.',
    price: 3500,
    priceLabel: 'MAD / month',
    purpose: 'RENT',
    type: 'STUDIO',
    location: 'Boulevard Mohammed V',
    city: 'Laayoune',
    neighborhood: 'Boulevard Mohammed V',
    images: [
      { id: 501, url: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&q=85&w=1400', isPrimary: true, sortOrder: 0 },
      { id: 502, url: 'https://images.unsplash.com/photo-1502005229762-ee1b2b8ab00f?auto=format&fit=crop&q=85&w=1400', isPrimary: false, sortOrder: 1 }
    ],
    bedrooms: 1,
    bathrooms: 1,
    livingRooms: 1,
    kitchens: 1,
    floors: 1,
    propertyFloor: 2,
    surface: 55,
    condition: 'Brand new',
    furnished: true,
    amenities: ['Custom cabinetry', 'Elevator', 'Quiet street', 'Fiber internet ready'],
    isFeatured: false,
    status: 'PUBLISHED',
    sellerId: 2,
    createdAt: new Date('2026-03-14T08:40:00Z').toISOString(),
    updatedAt: new Date('2026-03-14T08:40:00Z').toISOString()
  },
  {
    id: 6,
    title: 'Spacious 3-bedroom apartment in Hay El Fouarat',
    description: 'A luminous apartment on a high floor with double salon and master suite in Hay El Fouarat.',
    price: 4500,
    priceLabel: 'MAD / month',
    purpose: 'RENT',
    type: 'APARTMENT',
    location: 'Hay El Fouarat',
    city: 'Laayoune',
    neighborhood: 'Hay El Fouarat',
    images: [
      { id: 601, url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=85&w=1400', isPrimary: true, sortOrder: 0 },
      { id: 602, url: 'https://images.unsplash.com/photo-1600585152220-90363fe7e115?auto=format&fit=crop&q=85&w=1400', isPrimary: false, sortOrder: 1 }
    ],
    bedrooms: 3,
    bathrooms: 2,
    livingRooms: 1,
    kitchens: 1,
    floors: 1,
    propertyFloor: 3,
    surface: 130,
    condition: 'Excellent',
    furnished: true,
    amenities: ['Terrace', 'Private parking', 'Air conditioning', 'Fiber internet ready'],
    isFeatured: true,
    status: 'PUBLISHED',
    sellerId: 3,
    createdAt: new Date('2026-03-16T17:10:00Z').toISOString(),
    updatedAt: new Date('2026-03-16T17:10:00Z').toISOString()
  }
];

const INITIAL_REQUESTS = [
  {
    id: 1,
    purpose: 'RENT',
    type: 'APARTMENT',
    city: 'Laayoune',
    neighborhood: 'Boulevard Makkah',
    maxBudget: 6000,
    minBedrooms: 2,
    minBathrooms: 1,
    minSurface: 90,
    amenities: ['Balcony', 'Parking'],
    description: 'Professional seeking quiet apartment with good natural light near Boulevard Makkah.',
    status: 'ACTIVE',
    requesterId: 1,
    createdAt: new Date('2026-03-18T10:00:00Z').toISOString()
  },
  {
    id: 2,
    purpose: 'SALE',
    type: 'VILLA',
    city: 'Laayoune',
    neighborhood: 'Hay El Qods',
    maxBudget: 3500000,
    minBedrooms: 4,
    minBathrooms: 3,
    minSurface: 300,
    amenities: ['Courtyard', 'Garage'],
    description: 'Looking for a titled villa with garage and courtyard in Hay El Qods.',
    status: 'ACTIVE',
    requesterId: 2,
    createdAt: new Date('2026-03-20T14:15:00Z').toISOString()
  }
];

class DataStore {
  constructor() {
    this.ensureDataFile();
    this.load();
  }

  ensureDataFile() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (!fs.existsSync(DB_FILE)) {
        const initialData = {
          users: INITIAL_USERS,
          sessions: [],
          listings: INITIAL_LISTINGS,
          offers: [],
          requests: INITIAL_REQUESTS,
          favorites: [],
          contacts: []
        };
        fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
      }
    } catch (err) {
      console.warn('Filesystem persistence initialization warning (in-memory mode active):', err.message);
    }
  }

  load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const content = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(content);
        return;
      }
    } catch (err) {
      console.warn('Could not read existing store file, initializing defaults:', err.message);
    }
    this.data = {
      users: INITIAL_USERS,
      sessions: [],
      listings: INITIAL_LISTINGS,
      offers: [],
      requests: INITIAL_REQUESTS,
      favorites: [],
      contacts: []
    };
    this.save();
  }

  save() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.warn('Filesystem write skipped (in-memory state preserved):', err.message);
    }
  }

  // Users & Sessions
  findUserByEmail(email) {
    if (!email) return null;
    const normalized = email.trim().toLowerCase();
    return this.data.users.find(u => u.email.toLowerCase() === normalized) || null;
  }

  findUserById(id) {
    return this.data.users.find(u => u.id === Number(id)) || null;
  }

  createUser({ name, email, phone, password }) {
    const nextId = this.data.users.reduce((max, u) => Math.max(max, u.id), 0) + 1;
    const user = {
      id: nextId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone ? phone.trim() : null,
      password: hashPassword(password),
      role: 'USER',
      phoneVerifiedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.users.push(user);
    this.save();
    return user;
  }

  verifyUserPhone(userId) {
    const user = this.findUserById(userId);
    if (!user) return null;
    user.phoneVerifiedAt = new Date().toISOString();
    user.updatedAt = new Date().toISOString();
    this.save();
    return user;
  }

  createSession(userId) {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString();
    this.data.sessions.push({
      id: crypto.randomUUID(),
      tokenHash,
      userId,
      expiresAt,
      createdAt: new Date().toISOString()
    });
    this.save();
    return rawToken;
  }

  findUserByToken(rawToken) {
    if (!rawToken) return null;
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const session = this.data.sessions.find(s => s.tokenHash === tokenHash);
    if (!session) return null;
    if (new Date(session.expiresAt) <= new Date()) {
      this.data.sessions = this.data.sessions.filter(s => s.tokenHash !== tokenHash);
      this.save();
      return null;
    }
    return this.findUserById(session.userId);
  }

  deleteSession(rawToken) {
    if (!rawToken) return;
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    this.data.sessions = this.data.sessions.filter(s => s.tokenHash !== tokenHash);
    this.save();
  }

  // Listings
  getListings(filters = {}) {
    let result = [...this.data.listings].filter(l => l.status === 'PUBLISHED');

    if (filters.purpose) {
      const p = filters.purpose.toUpperCase();
      result = result.filter(l => l.purpose === p);
    }
    if (filters.city) {
      const c = filters.city.trim().toLowerCase();
      result = result.filter(l => l.city.toLowerCase() === c || l.city.toLowerCase().includes(c));
    }
    if (filters.type) {
      const t = filters.type.toUpperCase();
      result = result.filter(l => l.type === t);
    }
    if (filters.minPrice) {
      result = result.filter(l => l.price >= Number(filters.minPrice));
    }
    if (filters.maxPrice) {
      result = result.filter(l => l.price <= Number(filters.maxPrice));
    }
    if (filters.minBedrooms) {
      result = result.filter(l => (l.bedrooms || 0) >= Number(filters.minBedrooms));
    }
    if (filters.minBathrooms) {
      result = result.filter(l => (l.bathrooms || 0) >= Number(filters.minBathrooms));
    }
    if (filters.minSurface) {
      result = result.filter(l => (l.surface || 0) >= Number(filters.minSurface));
    }
    if (filters.search) {
      const q = filters.search.trim().toLowerCase();
      result = result.filter(l =>
        l.title.toLowerCase().includes(q) ||
        l.description.toLowerCase().includes(q) ||
        l.city.toLowerCase().includes(q) ||
        (l.neighborhood && l.neighborhood.toLowerCase().includes(q))
      );
    }

    if (filters.sort === 'priceAsc') {
      result.sort((a, b) => a.price - b.price);
    } else if (filters.sort === 'priceDesc') {
      result.sort((a, b) => b.price - a.price);
    } else if (filters.sort === 'surfaceDesc') {
      result.sort((a, b) => (b.surface || 0) - (a.surface || 0));
    } else {
      result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return result.map(l => this.attachSeller(l));
  }

  getListingById(id) {
    const listing = this.data.listings.find(l => l.id === Number(id));
    if (!listing) return null;
    return this.attachSeller(listing);
  }

  attachSeller(listing) {
    const seller = this.findUserById(listing.sellerId);
    return {
      ...listing,
      seller: seller ? {
        id: seller.id,
        name: seller.name,
        email: seller.email,
        phone: seller.phone,
        phoneVerified: Boolean(seller.phoneVerifiedAt)
      } : { id: 0, name: 'Atlassi Verified Owner', phoneVerified: true }
    };
  }

  createListing(data, sellerId) {
    const nextId = this.data.listings.reduce((max, l) => Math.max(max, l.id), 0) + 1;
    const formattedImages = (data.images && data.images.length > 0)
      ? data.images.map((img, idx) => typeof img === 'string' ? { id: Date.now() + idx, url: img, isPrimary: idx === 0, sortOrder: idx } : img)
      : [{ id: Date.now(), url: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=85&w=1400', isPrimary: true, sortOrder: 0 }];

    const listing = {
      id: nextId,
      title: data.title.trim(),
      description: data.description.trim(),
      price: Number(data.price),
      priceLabel: data.purpose === 'RENT' ? 'MAD / month' : 'MAD',
      purpose: data.purpose.toUpperCase(),
      type: data.type.toUpperCase(),
      location: data.location || data.neighborhood || data.city,
      city: data.city,
      neighborhood: data.neighborhood || null,
      images: formattedImages,
      bedrooms: data.bedrooms ? Number(data.bedrooms) : null,
      bathrooms: data.bathrooms ? Number(data.bathrooms) : null,
      livingRooms: data.livingRooms ? Number(data.livingRooms) : null,
      kitchens: data.kitchens ? Number(data.kitchens) : null,
      floors: data.floors ? Number(data.floors) : null,
      propertyFloor: data.propertyFloor ? Number(data.propertyFloor) : null,
      surface: data.surface ? Number(data.surface) : null,
      condition: data.condition || 'Good',
      furnished: Boolean(data.furnished),
      amenities: Array.isArray(data.amenities) ? data.amenities : [],
      isFeatured: false,
      status: 'PENDING',
      sellerId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.listings.unshift(listing);
    this.save();
    return this.attachSeller(listing);
  }

  getUserListings(userId) {
    return this.data.listings
      .filter(l => l.sellerId === Number(userId))
      .map(l => {
        const offersCount = this.data.offers.filter(o => o.listingId === l.id).length;
        return {
          ...this.attachSeller(l),
          _count: { offers: offersCount }
        };
      });
  }

  updateListingStatus(listingId, status, userId) {
    const listing = this.data.listings.find(l => l.id === Number(listingId) && l.sellerId === Number(userId));
    if (!listing) return null;
    listing.status = status;
    listing.updatedAt = new Date().toISOString();
    this.save();
    return listing;
  }

  // Offers
  createOffer({ listingId, buyerId, amount, message, conditions, contactPreference }) {
    const nextId = this.data.offers.reduce((max, o) => Math.max(max, o.id), 0) + 1;
    const offer = {
      id: nextId,
      listingId: Number(listingId),
      buyerId: Number(buyerId),
      amount: Number(amount),
      message: message || '',
      conditions: conditions || '',
      contactPreference: contactPreference || 'phone',
      status: 'PENDING',
      ownerResponse: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.offers.push(offer);
    this.save();
    return offer;
  }

  getUserOffers(buyerId) {
    return this.data.offers
      .filter(o => o.buyerId === Number(buyerId))
      .map(o => ({
        ...o,
        listing: this.getListingById(o.listingId)
      }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  getReceivedOffers(sellerId) {
    const sellerListingIds = this.data.listings
      .filter(l => l.sellerId === Number(sellerId))
      .map(l => l.id);

    return this.data.offers
      .filter(o => sellerListingIds.includes(o.listingId))
      .map(o => ({
        ...o,
        buyer: this.findUserById(o.buyerId),
        listing: this.getListingById(o.listingId)
      }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  updateOfferStatus(offerId, status, ownerResponse, sellerId) {
    const offer = this.data.offers.find(o => o.id === Number(offerId));
    if (!offer) return null;
    const listing = this.data.listings.find(l => l.id === offer.listingId && l.sellerId === Number(sellerId));
    if (!listing) return null;

    offer.status = status;
    if (ownerResponse !== undefined) offer.ownerResponse = ownerResponse;
    offer.updatedAt = new Date().toISOString();
    this.save();
    return offer;
  }

  // Favorites
  toggleFavorite(userId, listingId) {
    const uId = Number(userId);
    const lId = Number(listingId);
    const existingIndex = this.data.favorites.findIndex(f => f.userId === uId && f.listingId === lId);
    if (existingIndex >= 0) {
      this.data.favorites.splice(existingIndex, 1);
      this.save();
      return { listingId: lId, saved: false };
    } else {
      this.data.favorites.push({
        id: Date.now(),
        userId: uId,
        listingId: lId,
        createdAt: new Date().toISOString()
      });
      this.save();
      return { listingId: lId, saved: true };
    }
  }

  getUserFavorites(userId) {
    const uId = Number(userId);
    const userFavs = this.data.favorites.filter(f => f.userId === uId);
    return userFavs
      .map(f => ({
        ...f,
        listing: this.getListingById(f.listingId)
      }))
      .filter(f => Boolean(f.listing))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  // Property Requests
  createRequest(data, requesterId) {
    const nextId = this.data.requests.reduce((max, r) => Math.max(max, r.id), 0) + 1;
    const request = {
      id: nextId,
      purpose: data.purpose.toUpperCase(),
      type: data.type ? data.type.toUpperCase() : null,
      city: data.city,
      neighborhood: data.neighborhood || null,
      maxBudget: data.maxBudget ? Number(data.maxBudget) : null,
      minBedrooms: data.minBedrooms ? Number(data.minBedrooms) : null,
      minBathrooms: data.minBathrooms ? Number(data.minBathrooms) : null,
      minSurface: data.minSurface ? Number(data.minSurface) : null,
      amenities: Array.isArray(data.amenities) ? data.amenities : [],
      description: data.description.trim(),
      status: 'ACTIVE',
      requesterId: Number(requesterId),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.requests.unshift(request);
    this.save();
    return {
      ...request,
      requester: this.findUserById(requesterId)
    };
  }

  getRequests(filters = {}) {
    let result = [...this.data.requests].filter(r => r.status === 'ACTIVE');
    if (filters.city) {
      result = result.filter(r => r.city.toLowerCase().includes(filters.city.toLowerCase()));
    }
    if (filters.purpose) {
      result = result.filter(r => r.purpose === filters.purpose.toUpperCase());
    }
    return result.map(r => ({
      ...r,
      requester: this.findUserById(r.requesterId)
    }));
  }

  // Contacts / Inquiries
  createContact({ senderId, listingId, message }) {
    const listing = this.getListingById(listingId);
    if (!listing) throw new Error('Listing not found');
    const recipientId = listing.sellerId;
    const nextId = this.data.contacts.reduce((max, c) => Math.max(max, c.id), 0) + 1;
    const contact = {
      id: nextId,
      senderId: Number(senderId),
      recipientId: Number(recipientId),
      listingId: Number(listingId),
      message: message.trim(),
      status: 'UNREAD',
      adminNote: null,
      createdAt: new Date().toISOString()
    };
    this.data.contacts.push(contact);
    this.save();
    return contact;
  }

  // ─── ADMIN METHODS ─────────────────────────────────────────────────────────
  // These methods expose full contact details and are ONLY called from
  // admin-protected API routes — never from public endpoints.

  getAllListingsAdmin() {
    return this.data.listings
      .map(l => {
        const seller = this.findUserById(l.sellerId);
        const offersCount = this.data.offers.filter(o => o.listingId === l.id).length;
        const inquiriesCount = this.data.contacts.filter(c => c.listingId === l.id).length;
        return {
          ...l,
          owner: seller ? {
            id: seller.id,
            name: seller.name,
            email: seller.email,
            phone: seller.phone,
            phoneVerified: Boolean(seller.phoneVerifiedAt)
          } : null,
          _count: { offers: offersCount, inquiries: inquiriesCount }
        };
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  getAllRequestsAdmin() {
    return this.data.requests
      .map(r => {
        const requester = this.findUserById(r.requesterId);
        return {
          ...r,
          requester: requester ? {
            id: requester.id,
            name: requester.name,
            email: requester.email,
            phone: requester.phone,
            phoneVerified: Boolean(requester.phoneVerifiedAt)
          } : null
        };
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  getAllOffersAdmin() {
    return this.data.offers
      .map(o => {
        const buyer = this.findUserById(o.buyerId);
        const listing = this.data.listings.find(l => l.id === o.listingId);
        const owner = listing ? this.findUserById(listing.sellerId) : null;
        return {
          ...o,
          buyer: buyer ? { id: buyer.id, name: buyer.name, email: buyer.email, phone: buyer.phone } : null,
          listing: listing ? {
            id: listing.id,
            title: listing.title,
            city: listing.city,
            price: listing.price,
            purpose: listing.purpose,
            images: listing.images?.slice(0, 1)
          } : null,
          owner: owner ? { id: owner.id, name: owner.name, email: owner.email, phone: owner.phone } : null
        };
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  getAllContactsAdmin() {
    return this.data.contacts
      .map(c => {
        const sender = this.findUserById(c.senderId);
        const recipient = this.findUserById(c.recipientId);
        const listing = this.data.listings.find(l => l.id === c.listingId);
        return {
          ...c,
          sender: sender ? { id: sender.id, name: sender.name, email: sender.email, phone: sender.phone } : null,
          recipient: recipient ? { id: recipient.id, name: recipient.name, email: recipient.email, phone: recipient.phone } : null,
          listing: listing ? { id: listing.id, title: listing.title, city: listing.city, images: listing.images?.slice(0, 1) } : null
        };
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  getAllUsersAdmin() {
    return this.data.users
      .filter(u => u.role !== 'ADMIN')
      .map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        phoneVerified: Boolean(u.phoneVerifiedAt),
        listingsCount: this.data.listings.filter(l => l.sellerId === u.id).length,
        offersCount: this.data.offers.filter(o => o.buyerId === u.id).length,
        requestsCount: this.data.requests.filter(r => r.requesterId === u.id).length,
        createdAt: u.createdAt
      }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  adminUpdateListingStatus(listingId, status) {
    const listing = this.data.listings.find(l => l.id === Number(listingId));
    if (!listing) return null;
    listing.status = status;
    listing.updatedAt = new Date().toISOString();
    this.save();
    return listing;
  }

  adminToggleListingFeatured(listingId) {
    const listing = this.data.listings.find(l => l.id === Number(listingId));
    if (!listing) return null;
    listing.isFeatured = !listing.isFeatured;
    listing.updatedAt = new Date().toISOString();
    this.save();
    return listing;
  }

  adminUpdateOfferStatus(offerId, status, adminNote) {
    const offer = this.data.offers.find(o => o.id === Number(offerId));
    if (!offer) return null;
    offer.status = status;
    if (adminNote !== undefined) offer.ownerResponse = adminNote;
    offer.updatedAt = new Date().toISOString();
    this.save();
    return offer;
  }

  adminUpdateContactStatus(contactId, status, adminNote) {
    const contact = this.data.contacts.find(c => c.id === Number(contactId));
    if (!contact) return null;
    contact.status = status;
    if (adminNote !== undefined) contact.adminNote = adminNote;
    this.save();
    return contact;
  }

  adminUpdateRequestStatus(requestId, status) {
    const request = this.data.requests.find(r => r.id === Number(requestId));
    if (!request) return null;
    request.status = status;
    request.updatedAt = new Date().toISOString();
    this.save();
    return request;
  }

  getAdminStats() {
    return {
      totalListings: this.data.listings.length,
      publishedListings: this.data.listings.filter(l => l.status === 'PUBLISHED').length,
      pendingListings: this.data.listings.filter(l => l.status === 'PENDING').length,
      totalRequests: this.data.requests.length,
      activeRequests: this.data.requests.filter(r => r.status === 'ACTIVE').length,
      totalOffers: this.data.offers.length,
      pendingOffers: this.data.offers.filter(o => o.status === 'PENDING').length,
      totalContacts: this.data.contacts.length,
      unreadContacts: this.data.contacts.filter(c => c.status === 'UNREAD').length,
      totalUsers: this.data.users.filter(u => u.role !== 'ADMIN').length,
    };
  }
}

export const store = new DataStore();
export { hashPassword, verifyPassword };
