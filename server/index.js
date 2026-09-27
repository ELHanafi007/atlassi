import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'node:crypto';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
const hasDatabase = Boolean(process.env.DATABASE_URL);
const prisma = hasDatabase ? new PrismaClient({ datasourceUrl: process.env.DATABASE_URL }) : null;
const demoUsers = new Map();
const demoSessions = new Map();

const hashPassword = (password, salt = crypto.randomBytes(16).toString('hex')) => ({ salt, hash: crypto.scryptSync(password, salt, 64).toString('hex') });
const passwordsMatch = (password, storedHash, salt) => crypto.timingSafeEqual(Buffer.from(hashPassword(password, salt).hash, 'hex'), Buffer.from(storedHash, 'hex'));
const publicUser = (user) => ({ id: user.id, name: user.name, email: user.email, phone: user.phone, phoneVerified: Boolean(user.phoneVerifiedAt), role: user.role });
const createSession = async (user) => {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
  if (hasDatabase) await prisma.session.create({ data: { id: crypto.randomUUID(), tokenHash, userId: user.id, expiresAt } });
  else demoSessions.set(tokenHash, { userId: user.id, expiresAt });
  return rawToken;
};
const authUser = async (req) => {
  const rawToken = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!rawToken) return null;
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  if (hasDatabase) {
    const session = await prisma.session.findUnique({ where: { tokenHash }, include: { user: true } });
    return session && session.expiresAt > new Date() ? session.user : null;
  }
  const session = demoSessions.get(tokenHash);
  if (!session || session.expiresAt <= new Date()) return null;
  return [...demoUsers.values()].find((user) => user.id === session.userId) || null;
};
const requireAuth = async (req, res, next) => { try { req.user = await authUser(req); return req.user ? next() : res.status(401).json({ error: 'Please log in to continue.' }); } catch (error) { return next(error); } };

app.use(cors());
app.use(express.json({ limit: '2mb' }));

const demoListings = [
  { id: 1, title: 'Light-filled apartment by the bay', description: 'A calm, generously proportioned home with a sea-facing balcony, bright interiors and everything you need for effortless city living.', price: 12000, priceLabel: 'MAD / month', purpose: 'RENT', type: 'APARTMENT', location: 'Malabata', city: 'Tangier', neighborhood: 'Malabata', images: [{ url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=85&w=1200', isPrimary: true }], bedrooms: 3, bathrooms: 2, surface: 145, amenities: ['Balcony', 'Parking', 'Furnished'], isFeatured: true },
  { id: 2, title: 'Contemporary villa in the Palmeraie', description: 'A modern interpretation of a Moroccan retreat, with generous outdoor space, a private pool and views toward the Atlas.', price: 4850000, priceLabel: 'MAD', purpose: 'SALE', type: 'VILLA', location: 'Palmeraie', city: 'Marrakech', neighborhood: 'Palmeraie', images: [{ url: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=85&w=1200', isPrimary: true }], bedrooms: 4, bathrooms: 3, surface: 390, amenities: ['Pool', 'Garden', 'Parking'], isFeatured: true },
  { id: 3, title: 'Architect-designed home in Anfa', description: 'A composed family residence shaped around light, privacy and indoor-outdoor living.', price: 6200000, priceLabel: 'MAD', purpose: 'SALE', type: 'HOUSE', location: 'Anfa', city: 'Casablanca', neighborhood: 'Anfa', images: [{ url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=85&w=1200', isPrimary: true }], bedrooms: 4, bathrooms: 3, surface: 310, amenities: ['Garden', 'Terrace', 'Fireplace'], isFeatured: false },
];

const numberParam = (value) => value === undefined ? undefined : Number(value);
const buildListingWhere = (query) => ({ status: 'PUBLISHED', ...(query.purpose && { purpose: query.purpose.toUpperCase() }), ...(query.city && { city: { contains: query.city, mode: 'insensitive' } }), ...(query.type && { type: query.type.toUpperCase() }), ...(query.minPrice && { price: { gte: numberParam(query.minPrice), ...(query.maxPrice && { lte: numberParam(query.maxPrice) }) } }), ...(query.minBedrooms && { bedrooms: { gte: numberParam(query.minBedrooms) } }), ...(query.minBathrooms && { bathrooms: { gte: numberParam(query.minBathrooms) } }), ...(query.minSurface && { surface: { gte: numberParam(query.minSurface) } }), ...(query.search && { OR: [{ title: { contains: query.search, mode: 'insensitive' } }, { description: { contains: query.search, mode: 'insensitive' } }, { city: { contains: query.search, mode: 'insensitive' } }, { neighborhood: { contains: query.search, mode: 'insensitive' } }] }) });

app.get('/api/health', async (_req, res) => res.json({ status: 'ok', database: hasDatabase ? 'configured' : 'demo-mode' }));

app.post('/api/auth/register', async (req, res, next) => {
  try {
    const { name, email, phone, password, passwordConfirmation } = req.body || {};
    if (!name?.trim() || !email?.trim() || !phone?.trim() || !password || password.length < 8 || password !== passwordConfirmation) return res.status(400).json({ error: 'Enter a name, phone, valid email, and matching password of at least 8 characters.' });
    const normalizedEmail = email.trim().toLowerCase();
    if (hasDatabase) {
      if (await prisma.user.findUnique({ where: { email: normalizedEmail } })) return res.status(409).json({ error: 'An account with this email already exists.' });
      const credentials = hashPassword(password);
      const user = await prisma.user.create({ data: { name: name.trim(), email: normalizedEmail, phone: phone.trim(), password: `${credentials.salt}:${credentials.hash}` } });
      return res.status(201).json({ data: { user: publicUser(user), token: await createSession(user), verification: { status: 'pending', mode: 'provider-required' } } });
    }
    if ([...demoUsers.values()].some((user) => user.email === normalizedEmail)) return res.status(409).json({ error: 'An account with this email already exists.' });
    const credentials = hashPassword(password); const user = { id: demoUsers.size + 1, name: name.trim(), email: normalizedEmail, phone: phone.trim(), password: `${credentials.salt}:${credentials.hash}`, role: 'USER', phoneVerifiedAt: null }; demoUsers.set(user.id, user);
    return res.status(201).json({ data: { user: publicUser(user), token: await createSession(user), verification: { status: 'pending', mode: 'demo-code-available' } } });
  } catch (error) { return next(error); }
});

app.post('/api/auth/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {}; const normalizedEmail = email?.trim().toLowerCase(); let user;
    if (hasDatabase) user = await prisma.user.findUnique({ where: { email: normalizedEmail } }); else user = [...demoUsers.values()].find((item) => item.email === normalizedEmail);
    if (!user || !password) return res.status(401).json({ error: 'Email or password is incorrect.' });
    const [salt, storedHash] = user.password.split(':'); if (!passwordsMatch(password, storedHash, salt)) return res.status(401).json({ error: 'Email or password is incorrect.' });
    return res.json({ data: { user: publicUser(user), token: await createSession(user) } });
  } catch (error) { return next(error); }
});

app.get('/api/auth/me', requireAuth, async (req, res) => res.json({ data: { user: publicUser(req.user) } }));
app.post('/api/auth/logout', requireAuth, async (req, res, next) => { try { const rawToken = req.headers.authorization.replace(/^Bearer\s+/i, ''); const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex'); if (hasDatabase) await prisma.session.deleteMany({ where: { tokenHash } }); else demoSessions.delete(tokenHash); return res.json({ data: { success: true } }); } catch (error) { return next(error); } });

app.post('/api/auth/verify-phone', requireAuth, async (req, res, next) => {
  try {
    const { code } = req.body || {};
    if (!code || String(code) !== '123456') return res.status(400).json({ error: 'The verification code is invalid. In demo mode, use 123456.' });
    const verifiedAt = new Date();
    const user = hasDatabase ? await prisma.user.update({ where: { id: req.user.id }, data: { phoneVerifiedAt: verifiedAt } }) : Object.assign(req.user, { phoneVerifiedAt: verifiedAt });
    return res.json({ data: { user: publicUser(user), verification: { status: 'verified', mode: hasDatabase ? 'provider-required' : 'demo' } } });
  } catch (error) { return next(error); }
});

app.get('/api/listings', async (req, res, next) => {
  try {
    if (!hasDatabase) {
      const where = buildListingWhere(req.query);
      const result = demoListings.filter((listing) => (!where.purpose || listing.purpose === where.purpose) && (!where.city || listing.city.toLowerCase().includes(String(where.city.contains).toLowerCase())) && (!where.type || listing.type === where.type) && (!where.search || `${listing.title} ${listing.description} ${listing.city} ${listing.neighborhood}`.toLowerCase().includes(String(where.search.contains).toLowerCase())) && (!where.price || listing.price >= where.price.gte) && (!where.minBedrooms || listing.bedrooms >= where.minBedrooms.gte) && (!where.minBathrooms || listing.bathrooms >= where.minBathrooms.gte));
      return res.json({ data: result, meta: { total: result.length, mode: 'demo' } });
    }
    const sort = req.query.sort === 'priceAsc' ? { price: 'asc' } : req.query.sort === 'priceDesc' ? { price: 'desc' } : req.query.sort === 'surfaceDesc' ? { surface: 'desc' } : { createdAt: 'desc' };
    const listings = await prisma.listing.findMany({ where: buildListingWhere(req.query), include: { images: { orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }] } }, orderBy: sort });
    return res.json({ data: listings, meta: { total: listings.length, mode: 'database' } });
  } catch (error) { return next(error); }
});

app.get('/api/listings/:id', async (req, res, next) => {
  try {
    if (!hasDatabase) { const listing = demoListings.find((item) => item.id === Number(req.params.id)); return listing ? res.json({ data: listing }) : res.status(404).json({ error: 'Listing not found' }); }
    const listing = await prisma.listing.findFirst({ where: { id: Number(req.params.id), status: 'PUBLISHED' }, include: { images: { orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }] }, seller: { select: { id: true, name: true, createdAt: true } } } });
    return listing ? res.json({ data: listing }) : res.status(404).json({ error: 'Listing not found' });
  } catch (error) { return next(error); }
});

app.post('/api/listings', requireAuth, async (req, res, next) => {
  try {
    if (!hasDatabase) return res.status(201).json({ data: { ...req.body, id: Date.now(), sellerId: req.user.id, status: 'PUBLISHED' }, meta: { mode: 'demo' } });
    if (!req.user.phoneVerifiedAt) return res.status(403).json({ error: 'Verify your phone number before publishing a property.' });
    const { title, description, price, purpose, type, city, neighborhood, location, bedrooms, bathrooms, livingRooms, kitchens, floors, propertyFloor, surface, condition, furnished, amenities = [], images = [] } = req.body;
    if (!title || !description || !price || !purpose || !type || !city) return res.status(400).json({ error: 'Title, description, price, purpose, type, and city are required.' });
    const listing = await prisma.listing.create({ data: { title, description, price: Number(price), purpose, type, city, neighborhood, location: location || neighborhood || city, bedrooms: bedrooms ? Number(bedrooms) : null, bathrooms: bathrooms ? Number(bathrooms) : null, livingRooms: livingRooms ? Number(livingRooms) : null, kitchens: kitchens ? Number(kitchens) : null, floors: floors ? Number(floors) : null, propertyFloor: propertyFloor ? Number(propertyFloor) : null, surface: surface ? Number(surface) : null, condition, furnished: Boolean(furnished), amenities, status: 'PUBLISHED', sellerId: req.user.id, images: { create: images.map((url, sortOrder) => ({ url, sortOrder, isPrimary: sortOrder === 0 })) } }, include: { images: true } });
    return res.status(201).json({ data: listing });
  } catch (error) { return next(error); }
});

app.get('/api/me/listings', requireAuth, async (req, res, next) => { try { if (!hasDatabase) return res.json({ data: [] }); const listings = await prisma.listing.findMany({ where: { sellerId: req.user.id }, include: { images: { orderBy: { sortOrder: 'asc' } }, _count: { select: { offers: true } } }, orderBy: { updatedAt: 'desc' } }); return res.json({ data: listings }); } catch (error) { return next(error); } });
app.patch('/api/listings/:id/status', requireAuth, async (req, res, next) => { try { if (!hasDatabase) return res.json({ data: { id: Number(req.params.id), status: req.body.status }, meta: { mode: 'demo' } }); const listing = await prisma.listing.findFirst({ where: { id: Number(req.params.id), sellerId: req.user.id } }); if (!listing) return res.status(404).json({ error: 'Listing not found.' }); const updated = await prisma.listing.update({ where: { id: listing.id }, data: { status: req.body.status } }); return res.json({ data: updated }); } catch (error) { return next(error); } });

app.post('/api/listings/:id/offers', requireAuth, async (req, res, next) => { try { const { amount, message, conditions, contactPreference } = req.body || {}; if (!amount || Number(amount) <= 0) return res.status(400).json({ error: 'Enter a valid offer amount.' }); if (!hasDatabase) return res.status(201).json({ data: { id: Date.now(), listingId: Number(req.params.id), buyerId: req.user.id, amount: Number(amount), status: 'PENDING' }, meta: { mode: 'demo' } }); const listing = await prisma.listing.findFirst({ where: { id: Number(req.params.id), status: 'PUBLISHED' } }); if (!listing || listing.sellerId === req.user.id) return res.status(404).json({ error: 'Listing is not available for this offer.' }); const offer = await prisma.offer.create({ data: { listingId: listing.id, buyerId: req.user.id, amount: Number(amount), message, conditions, contactPreference } }); return res.status(201).json({ data: offer }); } catch (error) { return next(error); } });
app.get('/api/me/offers', requireAuth, async (req, res, next) => { try { if (!hasDatabase) return res.json({ data: [] }); const offers = await prisma.offer.findMany({ where: { buyerId: req.user.id }, include: { listing: { include: { images: { where: { isPrimary: true } } } } }, orderBy: { createdAt: 'desc' } }); return res.json({ data: offers }); } catch (error) { return next(error); } });
app.get('/api/me/received-offers', requireAuth, async (req, res, next) => { try { if (!hasDatabase) return res.json({ data: [] }); const offers = await prisma.offer.findMany({ where: { listing: { sellerId: req.user.id } }, include: { buyer: { select: { id: true, name: true, email: true, phone: true } }, listing: true }, orderBy: { createdAt: 'desc' } }); return res.json({ data: offers }); } catch (error) { return next(error); } });
app.patch('/api/offers/:id/status', requireAuth, async (req, res, next) => { try { if (!hasDatabase) return res.json({ data: { id: Number(req.params.id), status: req.body.status }, meta: { mode: 'demo' } }); const offer = await prisma.offer.findFirst({ where: { id: Number(req.params.id), listing: { sellerId: req.user.id } } }); if (!offer) return res.status(404).json({ error: 'Offer not found.' }); return res.json({ data: await prisma.offer.update({ where: { id: offer.id }, data: { status: req.body.status, ownerResponse: req.body.ownerResponse } }) }); } catch (error) { return next(error); } });

app.post('/api/favorites/:listingId', requireAuth, async (req, res, next) => { try { if (!hasDatabase) return res.status(201).json({ data: { listingId: Number(req.params.listingId), saved: true }, meta: { mode: 'demo' } }); const favorite = await prisma.favorite.upsert({ where: { userId_listingId: { userId: req.user.id, listingId: Number(req.params.listingId) } }, create: { userId: req.user.id, listingId: Number(req.params.listingId) }, update: {} }); return res.status(201).json({ data: { ...favorite, saved: true } }); } catch (error) { return next(error); } });
app.delete('/api/favorites/:listingId', requireAuth, async (req, res, next) => { try { if (hasDatabase) await prisma.favorite.deleteMany({ where: { userId: req.user.id, listingId: Number(req.params.listingId) } }); return res.json({ data: { listingId: Number(req.params.listingId), saved: false } }); } catch (error) { return next(error); } });
app.get('/api/me/favorites', requireAuth, async (req, res, next) => { try { if (!hasDatabase) return res.json({ data: [] }); const favorites = await prisma.favorite.findMany({ where: { userId: req.user.id }, include: { listing: { include: { images: { where: { isPrimary: true } } } } }, orderBy: { createdAt: 'desc' } }); return res.json({ data: favorites }); } catch (error) { return next(error); } });

app.post('/api/requests', requireAuth, async (req, res, next) => { try { const { purpose, type, city, neighborhood, maxBudget, minBedrooms, minBathrooms, minSurface, amenities = [], description } = req.body || {}; if (!purpose || !city || !description) return res.status(400).json({ error: 'Purpose, city, and description are required.' }); if (!hasDatabase) return res.status(201).json({ data: { ...req.body, id: Date.now(), requesterId: req.user.id, status: 'ACTIVE' }, meta: { mode: 'demo' } }); const request = await prisma.propertyRequest.create({ data: { purpose, type, city, neighborhood, maxBudget: maxBudget ? Number(maxBudget) : null, minBedrooms: minBedrooms ? Number(minBedrooms) : null, minBathrooms: minBathrooms ? Number(minBathrooms) : null, minSurface: minSurface ? Number(minSurface) : null, amenities, description, requesterId: req.user.id } }); return res.status(201).json({ data: request }); } catch (error) { return next(error); } });

app.get('/api/requests', async (req, res, next) => { try { if (!hasDatabase) return res.json({ data: [], meta: { total: 0, mode: 'demo' } }); const requests = await prisma.propertyRequest.findMany({ where: { status: 'ACTIVE', ...(req.query.city && { city: { contains: req.query.city, mode: 'insensitive' } }), ...(req.query.purpose && { purpose: req.query.purpose.toUpperCase() }) }, orderBy: { createdAt: 'desc' }, include: { requester: { select: { id: true, name: true } } } }); return res.json({ data: requests, meta: { total: requests.length, mode: 'database' } }); } catch (error) { return next(error); } });

app.use((error, _req, res, _next) => { console.error(error); res.status(500).json({ error: 'Something went wrong while processing your request.' }); });
app.listen(PORT, () => console.log(`Atlassi API running on port ${PORT} (${hasDatabase ? 'database' : 'demo'} mode)`));
