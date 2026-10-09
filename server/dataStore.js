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
  }
];

const INITIAL_LISTINGS = [];

const INITIAL_REQUESTS = [];

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
    if (filters.titleStatus && filters.titleStatus !== 'ALL') {
      const ts = filters.titleStatus.toLowerCase();
      result = result.filter(l => (l.titleStatus || 'titled').toLowerCase() === ts);
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

    const seller = this.findUserById(sellerId);
    const rawPurpose = data.purpose || data.status;
    const purpose = (rawPurpose === 'for_rent' || rawPurpose === 'RENT') ? 'RENT' : 'SALE';
    const city = data.city || data.location || 'Marrakech';
    const location = data.location || data.neighborhood || city;
    const isApproved = (seller?.role === 'ADMIN' || data.status === 'PUBLISHED');

    const listing = {
      id: nextId,
      title: data.title ? data.title.trim() : 'Propriété Atlassi',
      description: data.description ? data.description.trim() : '',
      price: Number(data.price),
      priceLabel: purpose === 'RENT' ? 'MAD / month' : 'MAD',
      purpose: purpose,
      type: (data.type || 'APARTMENT').toUpperCase(),
      location: location,
      city: city,
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
      amenities: Array.isArray(data.amenities) ? data.amenities : (Array.isArray(data.features) ? data.features : []),
      instagramVideoUrl: data.instagramVideoUrl || data.video || null,
      video: data.video || data.instagramVideoUrl || null,
      titleStatus: (data.titleStatus === 'untitled') ? 'untitled' : 'titled',
      isFeatured: Boolean(data.isFeatured),
      status: isApproved ? 'PUBLISHED' : (data.status || 'PENDING'),
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

  adminDeleteListing(listingId) {
    const idx = this.data.listings.findIndex(l => l.id === Number(listingId));
    if (idx === -1) return false;
    this.data.listings.splice(idx, 1);
    this.save();
    return true;
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
