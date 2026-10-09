import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import multer from 'multer';
import { store, verifyPassword } from './dataStore.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const hasDatabase = Boolean(process.env.DATABASE_URL);
let prisma = null;

async function getPrisma() {
  if (!hasDatabase) return null;
  if (prisma) return prisma;
  try {
    const { PrismaClient } = await import('@prisma/client');
    const { PrismaNeon } = await import('@prisma/adapter-neon');
    const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
    prisma = new PrismaClient({ adapter });

    // Seed Admin user if missing
    try {
      const adminExists = await prisma.user.findUnique({ where: { email: 'admin@atlassi.ma' } });
      if (!adminExists) {
        const salt = crypto.randomBytes(16).toString('hex');
        const hash = crypto.scryptSync('atlassi2024', salt, 64).toString('hex');
        await prisma.user.create({
          data: {
            name: 'Atlassi Admin',
            email: 'admin@atlassi.ma',
            phone: '+212 600 000 000',
            password: `${salt}:${hash}`,
            role: 'ADMIN',
            phoneVerifiedAt: new Date()
          }
        });
      }
    } catch (seedErr) {
      console.warn('Admin seed check skipped:', seedErr.message);
    }

    return prisma;
  } catch (err) {
    console.warn('Prisma initialization skipped:', err.message);
    return null;
  }
}

// Security: Helmet headers
app.use(helmet({
  crossOriginResourcePolicy: false
}));

// CORS Configuration
const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  'http://localhost:5173',
  'http://localhost:3000'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production' || process.env.VERCEL) {
      return callback(null, true);
    }
    return callback(new Error('Blocked by CORS policy'));
  },
  credentials: true
}));

// Rate Limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again after 15 minutes.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts. Please try again after 15 minutes.' }
});

app.use('/api', generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Payload size limit — 50mb to accommodate base64 previews
app.use(express.json({ limit: '50mb' }));

// Helpers
const publicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  phoneVerified: Boolean(user.phoneVerifiedAt),
  role: user.role,
  createdAt: user.createdAt
});

const createSession = async (user) => {
  const db = await getPrisma();
  if (db) {
    try {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
      await db.session.create({
        data: { id: crypto.randomUUID(), tokenHash, userId: user.id, expiresAt }
      });
      return rawToken;
    } catch (err) {
      console.warn('Prisma session creation failed, falling back to dataStore:', err.message);
      return store.createSession(user.id);
    }
  }
  return store.createSession(user.id);
};

const authUser = async (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const rawToken = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!rawToken) return null;

  const db = await getPrisma();
  if (db) {
    try {
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      const session = await db.session.findUnique({
        where: { tokenHash },
        include: { user: true }
      });
      return session && session.expiresAt > new Date() ? session.user : null;
    } catch {
      return store.findUserByToken(rawToken);
    }
  }
  return store.findUserByToken(rawToken);
};

const requireAuth = async (req, res, next) => {
  try {
    const user = await authUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Please log in to continue.' });
    }
    req.user = user;
    return next();
  } catch (error) {
    return next(error);
  }
};

// Health Check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    environment: hasDatabase && prisma ? 'database' : 'persistent-store',
    timestamp: new Date().toISOString()
  });
});

// AUTHENTICATION
app.post('/api/auth/register', async (req, res, next) => {
  try {
    const { name, email, phone, password, passwordConfirmation } = req.body || {};
    if (!name?.trim()) return res.status(400).json({ error: 'Name is required.' });
    if (!email?.trim() || !email.includes('@')) return res.status(400).json({ error: 'Valid email is required.' });
    if (!password || password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    if (passwordConfirmation && password !== passwordConfirmation) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const db = await getPrisma();
    if (db) {
      const existing = await db.user.findUnique({ where: { email: normalizedEmail } });
      if (existing) return res.status(409).json({ error: 'An account with this email already exists.' });

      const salt = crypto.randomBytes(16).toString('hex');
      const hash = crypto.scryptSync(password, salt, 64).toString('hex');
      const user = await db.user.create({
        data: {
          name: name.trim(),
          email: normalizedEmail,
          phone: phone ? phone.trim() : null,
          password: `${salt}:${hash}`
        }
      });
      const token = await createSession(user);
      return res.status(201).json({
        data: {
          user: publicUser(user),
          token,
          verification: { status: 'verified', mode: 'instant' }
        }
      });
    }

    const existing = store.findUserByEmail(normalizedEmail);
    if (existing) return res.status(409).json({ error: 'An account with this email already exists.' });

    const user = store.createUser({ name, email, phone, password });
    // Auto-verify phone for frictionless flow
    store.verifyUserPhone(user.id);
    const updatedUser = store.findUserById(user.id);
    const token = await createSession(updatedUser);

    return res.status(201).json({
      data: {
        user: publicUser(updatedUser),
        token,
        verification: { status: 'verified', mode: 'instant' }
      }
    });
  } catch (error) {
    return next(error);
  }
});

app.post('/api/auth/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });
    const normalizedEmail = email.trim().toLowerCase();

    let user = null;
    let passwordValid = false;
    const db = await getPrisma();

    if (db) {
      try {
        user = await db.user.findUnique({ where: { email: normalizedEmail } });
        if (user) {
          const [salt, storedHash] = user.password.split(':');
          const computedHash = crypto.scryptSync(password, salt, 64).toString('hex');
          passwordValid = crypto.timingSafeEqual(Buffer.from(computedHash, 'hex'), Buffer.from(storedHash, 'hex'));
        }
      } catch (dbErr) {
        console.warn('Prisma query failed, falling back to dataStore:', dbErr.message);
      }
    }

    if (!user || !passwordValid) {
      const storeUser = store.findUserByEmail(normalizedEmail);
      if (storeUser && verifyPassword(password, storeUser.password)) {
        user = storeUser;
        passwordValid = true;
      }
    }

    if (!user || !passwordValid) {
      return res.status(401).json({ error: 'Email or password is incorrect.' });
    }

    const token = await createSession(user);
    return res.json({
      data: {
        user: publicUser(user),
        token
      }
    });
  } catch (error) {
    return next(error);
  }
});

app.get('/api/auth/me', requireAuth, async (req, res) => {
  const db = await getPrisma();
  const favorites = db
    ? await db.favorite.findMany({ where: { userId: req.user.id } })
    : store.getUserFavorites(req.user.id);

  return res.json({
    data: {
      user: publicUser(req.user),
      favoritesCount: favorites.length
    }
  });
});

app.post('/api/auth/logout', requireAuth, async (req, res, next) => {
  try {
    const rawToken = req.headers.authorization.replace(/^Bearer\s+/i, '').trim();
    const db = await getPrisma();
    if (db) {
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      await db.session.deleteMany({ where: { tokenHash } });
    } else {
      store.deleteSession(rawToken);
    }
    return res.json({ data: { success: true } });
  } catch (error) {
    return next(error);
  }
});

app.post('/api/auth/verify-phone', requireAuth, async (req, res, next) => {
  try {
    const { code } = req.body || {};
    const validTestCode = process.env.TEST_OTP_CODE || '123456';
    const cleanCode = String(code || '').trim();

    if (!cleanCode || !/^\d{4,8}$/.test(cleanCode)) {
      return res.status(400).json({ error: 'Please enter a valid verification code.' });
    }

    // In testing or staging without an SMS gateway, validTestCode (default 123456) is accepted
    if (cleanCode !== validTestCode) {
      return res.status(400).json({ error: 'Invalid verification code.' });
    }

    const verifiedAt = new Date();
    let updatedUser;
    const db = await getPrisma();
    if (db) {
      updatedUser = await db.user.update({
        where: { id: req.user.id },
        data: { phoneVerifiedAt: verifiedAt }
      });
    } else {
      updatedUser = store.verifyUserPhone(req.user.id);
    }
    return res.json({
      data: {
        user: publicUser(updatedUser),
        verification: { status: 'verified' }
      }
    });
  } catch (error) {
    return next(error);
  }
});

const ATLASSI_PUBLIC_SELLER = {
  id: 0,
  name: 'Équipe Atlassi',
  email: 'contact@atlassi.ma',
  phone: '+212 760 159 454',
  phoneVerified: true
};

// LISTINGS
app.get('/api/listings', async (req, res, next) => {
  try {
    const db = await getPrisma();
    if (db) {
      const { purpose, city, type, minPrice, maxPrice, titleStatus, search, sort } = req.query;
      const where = {
        status: 'PUBLISHED',
        ...(purpose && { purpose: purpose.toUpperCase() }),
        ...(city && { city: { contains: city, mode: 'insensitive' } }),
        ...(type && { type: type.toUpperCase() }),
        ...(titleStatus && titleStatus !== 'ALL' && { titleStatus: titleStatus.toLowerCase() }),
        ...((minPrice || maxPrice) && {
          price: {
            ...(minPrice && { gte: Number(minPrice) }),
            ...(maxPrice && { lte: Number(maxPrice) })
          }
        }),
        ...(search && {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { city: { contains: search, mode: 'insensitive' } },
            { neighborhood: { contains: search, mode: 'insensitive' } }
          ]
        })
      };

      const orderBy =
        sort === 'priceAsc' ? { price: 'asc' } :
        sort === 'priceDesc' ? { price: 'desc' } :
        sort === 'surfaceDesc' ? { surface: 'desc' } :
        { createdAt: 'desc' };

      const listings = await db.listing.findMany({
        where,
        include: {
          images: { orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }] }
        },
        orderBy
      });

      const publicListings = listings.map(l => ({
        ...l,
        seller: ATLASSI_PUBLIC_SELLER
      }));

      return res.json({ data: publicListings, meta: { total: publicListings.length, mode: 'database' } });
    }

    const listings = store.getListings(req.query);
    const publicListings = listings.map(l => ({
      ...l,
      seller: ATLASSI_PUBLIC_SELLER
    }));
    return res.json({ data: publicListings, meta: { total: publicListings.length, mode: 'persistent-store' } });
  } catch (error) {
    return next(error);
  }
});

app.get('/api/listings/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const db = await getPrisma();
    if (db) {
      const listing = await db.listing.findFirst({
        where: { id, status: 'PUBLISHED' },
        include: {
          images: { orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }] }
        }
      });
      return listing
        ? res.json({ data: { ...listing, seller: ATLASSI_PUBLIC_SELLER } })
        : res.status(404).json({ error: 'Listing not found' });
    }

    const listing = store.getListingById(id);
    return listing
      ? res.json({ data: { ...listing, seller: ATLASSI_PUBLIC_SELLER } })
      : res.status(404).json({ error: 'Listing not found' });
  } catch (error) {
    return next(error);
  }
});

app.post('/api/listings', requireAuth, async (req, res, next) => {
  try {
    const body = req.body || {};
    const title = body.title;
    const description = body.description || '';
    const price = body.price;
    const rawPurpose = body.purpose || body.status;
    const purpose = (rawPurpose === 'for_rent' || rawPurpose === 'RENT') ? 'RENT' : 'SALE';
    const type = (body.type || 'APARTMENT').toUpperCase();
    const city = body.city || body.location || 'Marrakech';
    const location = body.location || body.neighborhood || city;
    const neighborhood = body.neighborhood || null;
    const bedrooms = body.bedrooms ? Number(body.bedrooms) : null;
    const bathrooms = body.bathrooms ? Number(body.bathrooms) : null;
    const livingRooms = body.livingRooms ? Number(body.livingRooms) : null;
    const kitchens = body.kitchens ? Number(body.kitchens) : null;
    const floors = body.floors ? Number(body.floors) : null;
    const propertyFloor = body.propertyFloor ? Number(body.propertyFloor) : null;
    const surface = body.surface ? Number(body.surface) : null;
    const condition = body.condition || 'Good';
    const furnished = Boolean(body.furnished);
    const amenities = Array.isArray(body.amenities) ? body.amenities : (Array.isArray(body.features) ? body.features : []);
    const instagramVideoUrl = body.instagramVideoUrl || body.video || null;
    const titleStatus = (body.titleStatus === 'untitled') ? 'untitled' : 'titled';
    const images = Array.isArray(body.images) ? body.images : [];
    const isUserAdmin = req.user?.role === 'ADMIN';
    const listingStatus = (isUserAdmin || body.status === 'PUBLISHED') ? 'PUBLISHED' : 'DRAFT';

    if (!title || price == null || price === '') {
      return res.status(400).json({ error: 'Title and price are required.' });
    }

    const db = await getPrisma();
    if (db) {
      const listing = await db.listing.create({
        data: {
          title: title.trim(),
          description: description.trim(),
          price: Number(price),
          purpose: purpose,
          type: type,
          city,
          neighborhood: neighborhood || null,
          location: location,
          bedrooms,
          bathrooms,
          livingRooms,
          kitchens,
          floors,
          propertyFloor,
          surface,
          condition,
          furnished,
          amenities,
          instagramVideoUrl,
          titleStatus,
          status: listingStatus,
          sellerId: req.user.id,
          images: {
            create: images.map((url, idx) => ({
              url: typeof url === 'string' ? url : (url.url || ''),
              sortOrder: idx,
              isPrimary: idx === 0
            }))
          }
        },
        include: { images: true }
      });
      return res.status(201).json({
        data: { ...listing, seller: ATLASSI_PUBLIC_SELLER },
        message: isUserAdmin
          ? "Votre annonce a été publiée avec succès !"
          : "Votre annonce a été soumise avec succès ! Elle sera examinée et publiée par l'équipe Atlassi."
      });
    }

    const created = store.createListing({
      ...req.body,
      title,
      description,
      price,
      purpose,
      city,
      location,
      type,
      amenities,
      instagramVideoUrl,
      titleStatus,
      status: listingStatus
    }, req.user.id);

    return res.status(201).json({
      data: { ...created, seller: ATLASSI_PUBLIC_SELLER },
      meta: { mode: 'persistent-store' },
      message: isUserAdmin
        ? "Votre annonce a été publiée avec succès !"
        : "Votre annonce a été soumise avec succès ! Elle sera examinée et publiée par l'équipe Atlassi."
    });
  } catch (error) {
    return next(error);
  }
});

app.get('/api/me/listings', requireAuth, async (req, res, next) => {
  try {
    const db = await getPrisma();
    if (db) {
      const listings = await db.listing.findMany({
        where: { sellerId: req.user.id },
        include: {
          images: { orderBy: { sortOrder: 'asc' } },
          _count: { select: { offers: true } }
        },
        orderBy: { updatedAt: 'desc' }
      });
      return res.json({ data: listings });
    }
    const listings = store.getUserListings(req.user.id);
    return res.json({ data: listings });
  } catch (error) {
    return next(error);
  }
});

app.patch('/api/listings/:id/status', requireAuth, async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'Status is required.' });

    // Only Admin can set status to PUBLISHED
    if ((status === 'PUBLISHED' || status === 'PAUSED') && req.user.role !== 'ADMIN' && status === 'PUBLISHED') {
      return res.status(403).json({ error: "Seule l'équipe d'administration Atlassi peut valider et publier une annonce." });
    }

    let dbStatus = status;
    if (status === 'UNPUBLISHED') dbStatus = 'PAUSED';
    if (status === 'PENDING') dbStatus = 'DRAFT';

    const db = await getPrisma();
    if (db) {
      const listing = await db.listing.findFirst({
        where: { id: Number(req.params.id), sellerId: req.user.id }
      });
      if (!listing) return res.status(404).json({ error: 'Listing not found or unauthorized.' });
      const updated = await db.listing.update({
        where: { id: listing.id },
        data: { status: dbStatus }
      });
      return res.json({ data: updated });
    }

    const updated = store.updateListingStatus(req.params.id, status, req.user.id);
    if (!updated) return res.status(404).json({ error: 'Listing not found or unauthorized.' });
    return res.json({ data: updated });
  } catch (error) {
    return next(error);
  }
});

// OFFERS
app.post('/api/listings/:id/offers', requireAuth, async (req, res, next) => {
  try {
    const { amount, message, conditions, contactPreference } = req.body || {};
    const parsedAmount = Number(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      return res.status(400).json({ error: 'Please enter a valid offer amount.' });
    }

    const db = await getPrisma();
    if (db) {
      const listing = await db.listing.findFirst({
        where: { id: Number(req.params.id), status: 'PUBLISHED' }
      });
      if (!listing || listing.sellerId === req.user.id) {
        return res.status(400).json({ error: 'Listing is not eligible for your offer.' });
      }
      const offer = await db.offer.create({
        data: {
          listingId: listing.id,
          buyerId: req.user.id,
          amount: parsedAmount,
          message: message || '',
          conditions: conditions || '',
          contactPreference: contactPreference || 'phone'
        }
      });
      return res.status(201).json({ data: offer });
    }

    const listing = store.getListingById(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Listing not found.' });
    if (listing.sellerId === req.user.id) {
      return res.status(400).json({ error: 'You cannot submit an offer on your own listing.' });
    }

    const offer = store.createOffer({
      listingId: req.params.id,
      buyerId: req.user.id,
      amount: parsedAmount,
      message,
      conditions,
      contactPreference
    });
    return res.status(201).json({ data: offer });
  } catch (error) {
    return next(error);
  }
});

app.get('/api/me/offers', requireAuth, async (req, res, next) => {
  try {
    const db = await getPrisma();
    if (db) {
      const offers = await db.offer.findMany({
        where: { buyerId: req.user.id },
        include: {
          listing: {
            include: { images: { where: { isPrimary: true } } }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
      return res.json({ data: offers });
    }
    const offers = store.getUserOffers(req.user.id);
    return res.json({ data: offers });
  } catch (error) {
    return next(error);
  }
});

app.get('/api/me/received-offers', requireAuth, async (req, res, next) => {
  try {
    const db = await getPrisma();
    if (db) {
      const offers = await db.offer.findMany({
        where: { listing: { sellerId: req.user.id } },
        include: {
          buyer: { select: { id: true, name: true, email: true, phone: true } },
          listing: true
        },
        orderBy: { createdAt: 'desc' }
      });
      return res.json({ data: offers });
    }
    const offers = store.getReceivedOffers(req.user.id);
    return res.json({ data: offers });
  } catch (error) {
    return next(error);
  }
});

app.patch('/api/offers/:id/status', requireAuth, async (req, res, next) => {
  try {
    const { status, ownerResponse } = req.body || {};
    if (!status) return res.status(400).json({ error: 'Status is required.' });

    const db = await getPrisma();
    if (db) {
      const offer = await db.offer.findFirst({
        where: { id: Number(req.params.id), listing: { sellerId: req.user.id } }
      });
      if (!offer) return res.status(404).json({ error: 'Offer not found or unauthorized.' });
      const updated = await db.offer.update({
        where: { id: offer.id },
        data: { status, ownerResponse }
      });
      return res.json({ data: updated });
    }

    const updated = store.updateOfferStatus(req.params.id, status, ownerResponse, req.user.id);
    if (!updated) return res.status(404).json({ error: 'Offer not found or unauthorized.' });
    return res.json({ data: updated });
  } catch (error) {
    return next(error);
  }
});

// FAVORITES
app.post('/api/favorites/:listingId', requireAuth, async (req, res, next) => {
  try {
    const listingId = Number(req.params.listingId);
    const db = await getPrisma();
    if (db) {
      await db.favorite.upsert({
        where: { userId_listingId: { userId: req.user.id, listingId } },
        create: { userId: req.user.id, listingId },
        update: {}
      });
      return res.status(201).json({ data: { listingId, saved: true } });
    }
    const result = store.toggleFavorite(req.user.id, listingId);
    return res.status(201).json({ data: result });
  } catch (error) {
    return next(error);
  }
});

app.delete('/api/favorites/:listingId', requireAuth, async (req, res, next) => {
  try {
    const listingId = Number(req.params.listingId);
    const db = await getPrisma();
    if (db) {
      await db.favorite.deleteMany({
        where: { userId: req.user.id, listingId }
      });
      return res.json({ data: { listingId, saved: false } });
    }
    const result = store.toggleFavorite(req.user.id, listingId);
    return res.json({ data: { listingId, saved: false } });
  } catch (error) {
    return next(error);
  }
});

app.get('/api/me/favorites', requireAuth, async (req, res, next) => {
  try {
    const db = await getPrisma();
    if (db) {
      const favorites = await db.favorite.findMany({
        where: { userId: req.user.id },
        include: {
          listing: {
            include: { images: { where: { isPrimary: true } } }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
      return res.json({ data: favorites });
    }
    const favorites = store.getUserFavorites(req.user.id);
    return res.json({ data: favorites });
  } catch (error) {
    return next(error);
  }
});

// REQUESTS
app.post('/api/requests', requireAuth, async (req, res, next) => {
  try {
    const { purpose, city, description } = req.body || {};
    if (!purpose || !city || !description) {
      return res.status(400).json({ error: 'Purpose, city, and description are required.' });
    }

    const db = await getPrisma();
    if (db) {
      const request = await db.propertyRequest.create({
        data: {
          purpose: purpose.toUpperCase(),
          type: req.body.type ? req.body.type.toUpperCase() : null,
          city: req.body.city,
          neighborhood: req.body.neighborhood || null,
          maxBudget: req.body.maxBudget ? Number(req.body.maxBudget) : null,
          minBedrooms: req.body.minBedrooms ? Number(req.body.minBedrooms) : null,
          minBathrooms: req.body.minBathrooms ? Number(req.body.minBathrooms) : null,
          minSurface: req.body.minSurface ? Number(req.body.minSurface) : null,
          amenities: Array.isArray(req.body.amenities) ? req.body.amenities : [],
          description: req.body.description.trim(),
          requesterId: req.user.id
        }
      });
      return res.status(201).json({ data: request });
    }

    const created = store.createRequest(req.body, req.user.id);
    return res.status(201).json({ data: created });
  } catch (error) {
    return next(error);
  }
});

app.get('/api/requests', requireAuth, async (req, res, next) => {
  try {
    // Only admins can read the requests feed
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required.' });
    }
    const db = await getPrisma();
    if (db) {
      const requests = await db.propertyRequest.findMany({
        where: {
          status: 'ACTIVE',
          ...(req.query.city && { city: { contains: req.query.city, mode: 'insensitive' } }),
          ...(req.query.purpose && { purpose: req.query.purpose.toUpperCase() })
        },
        orderBy: { createdAt: 'desc' },
        include: {
          requester: { select: { id: true, name: true } }
        }
      });
      return res.json({ data: requests, meta: { total: requests.length, mode: 'database' } });
    }

    const requests = store.getRequests(req.query);
    return res.json({ data: requests, meta: { total: requests.length, mode: 'persistent-store' } });
  } catch (error) {
    return next(error);
  }
});

// DIRECT INQUIRIES / CONTACT
app.post('/api/listings/:id/inquire', requireAuth, async (req, res, next) => {
  try {
    const { message } = req.body || {};
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Please enter a message for the property owner.' });
    }

    const listingId = Number(req.params.id);
    const db = await getPrisma();
    if (db) {
      const listing = await db.listing.findUnique({ where: { id: listingId } });
      if (!listing) return res.status(404).json({ error: 'Listing not found' });

      const contact = await db.contactRequest.create({
        data: {
          senderId: req.user.id,
          recipientId: listing.sellerId,
          listingId,
          message: message.trim()
        }
      });
      return res.status(201).json({ data: contact });
    }

    const contact = store.createContact({
      senderId: req.user.id,
      listingId,
      message
    });
    return res.status(201).json({ data: contact });
  } catch (error) {
    return next(error);
  }
});

// ─── ADMIN MIDDLEWARE ────────────────────────────────────────────────────────
const requireAdmin = async (req, res, next) => {
  try {
    const user = await authUser(req);
    if (!user) return res.status(401).json({ error: 'Authentication required.' });
    if (user.role !== 'ADMIN') return res.status(403).json({ error: 'Admin access required.' });
    req.user = user;
    return next();
  } catch (error) {
    return next(error);
  }
};

// ─── ADMIN ROUTES ─────────────────────────────────────────────────────────────
// All routes under /api/admin require ADMIN role.
// These are the ONLY routes that expose owner/buyer contact details.

app.get('/api/admin/stats', requireAdmin, async (_req, res, next) => {
  try {
    const db = await getPrisma();
    if (db) {
      try {
        const [totalListings, publishedListings, pendingListings,
               totalRequests, activeRequests,
               totalOffers, pendingOffers,
               totalContacts, unreadContacts,
               totalUsers] = await Promise.all([
          db.listing.count(),
          db.listing.count({ where: { status: 'PUBLISHED' } }),
          db.listing.count({ where: { status: 'DRAFT' } }),
          db.propertyRequest.count(),
          db.propertyRequest.count({ where: { status: 'ACTIVE' } }),
          db.offer.count(),
          db.offer.count({ where: { status: 'PENDING' } }),
          db.contactRequest.count(),
          db.contactRequest.count({ where: { status: 'UNREAD' } }),
          db.user.count({ where: { role: { not: 'ADMIN' } } })
        ]);
        return res.json({ data: { totalListings, publishedListings, pendingListings, totalRequests, activeRequests, totalOffers, pendingOffers, totalContacts, unreadContacts, totalUsers } });
      } catch (dbErr) {
        console.warn('Admin stats Prisma error, falling back to store:', dbErr.message);
      }
    }
    const stats = store.getAdminStats();
    return res.json({ data: stats });
  } catch (error) { return next(error); }
});

app.get('/api/admin/listings', requireAdmin, async (_req, res, next) => {
  try {
    const db = await getPrisma();
    if (db) {
      try {
        const listings = await db.listing.findMany({
          include: {
            images: { orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }] },
            seller: { select: { id: true, name: true, email: true, phone: true, phoneVerifiedAt: true } },
            _count: { select: { offers: true, contacts: true } }
          },
          orderBy: { createdAt: 'desc' }
        });
        const data = listings.map(l => {
          let displayStatus = l.status;
          if (l.status === 'PAUSED') displayStatus = 'UNPUBLISHED';
          if (l.status === 'DRAFT') displayStatus = 'PENDING';
          return {
            ...l,
            status: displayStatus,
            owner: l.seller ? { id: l.seller.id, name: l.seller.name, email: l.seller.email, phone: l.seller.phone, phoneVerified: Boolean(l.seller.phoneVerifiedAt) } : null,
            _count: { offers: l._count.offers, inquiries: l._count.contacts }
          };
        });
        return res.json({ data });
      } catch (dbErr) {
        console.warn('Admin listings Prisma error, falling back to store:', dbErr.message);
      }
    }
    const listings = store.getAllListingsAdmin();
    return res.json({ data: listings });
  } catch (error) { return next(error); }
});

app.patch('/api/admin/listings/:id/status', requireAdmin, async (req, res, next) => {
  try {
    const { status } = req.body;
    let dbStatus = status;
    if (status === 'UNPUBLISHED') dbStatus = 'PAUSED';
    if (status === 'PENDING') dbStatus = 'DRAFT';

    const db = await getPrisma();
    if (db) {
      try {
        const listing = await db.listing.update({
          where: { id: Number(req.params.id) },
          data: { status: dbStatus }
        });
        let displayStatus = listing.status;
        if (listing.status === 'PAUSED') displayStatus = 'UNPUBLISHED';
        if (listing.status === 'DRAFT') displayStatus = 'PENDING';
        return res.json({ data: { ...listing, status: displayStatus } });
      } catch (dbErr) {
        console.warn('Admin listing status Prisma error, falling back to store:', dbErr.message);
      }
    }
    const listing = store.adminUpdateListingStatus(req.params.id, status);
    if (!listing) return res.status(404).json({ error: 'Listing not found.' });
    return res.json({ data: listing });
  } catch (error) { return next(error); }
});

app.patch('/api/admin/listings/:id/featured', requireAdmin, async (req, res, next) => {
  try {
    const db = await getPrisma();
    if (db) {
      try {
        const existing = await db.listing.findUnique({ where: { id: Number(req.params.id) } });
        if (!existing) return res.status(404).json({ error: 'Listing not found.' });
        const listing = await db.listing.update({
          where: { id: existing.id },
          data: { isFeatured: !existing.isFeatured }
        });
        return res.json({ data: listing });
      } catch (dbErr) {
        console.warn('Admin listing featured Prisma error, falling back to store:', dbErr.message);
      }
    }
    const listing = store.adminToggleListingFeatured(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Listing not found.' });
    return res.json({ data: listing });
  } catch (error) { return next(error); }
});

app.delete('/api/admin/listings/:id', requireAdmin, async (req, res, next) => {
  try {
    const db = await getPrisma();
    if (db) {
      try {
        await db.listing.delete({ where: { id: Number(req.params.id) } });
        return res.json({ data: { success: true } });
      } catch (dbErr) {
        console.warn('Admin listing delete Prisma error, falling back to store:', dbErr.message);
      }
    }
    const success = store.adminDeleteListing(req.params.id);
    if (!success) return res.status(404).json({ error: 'Listing not found.' });
    return res.json({ data: { success: true } });
  } catch (error) { return next(error); }
});

app.get('/api/admin/requests', requireAdmin, async (_req, res, next) => {
  try {
    const db = await getPrisma();
    if (db) {
      try {
        const requests = await db.propertyRequest.findMany({
          include: {
            requester: { select: { id: true, name: true, email: true, phone: true, phoneVerifiedAt: true } }
          },
          orderBy: { createdAt: 'desc' }
        });
        const data = requests.map(r => ({
          ...r,
          requester: r.requester ? { id: r.requester.id, name: r.requester.name, email: r.requester.email, phone: r.requester.phone, phoneVerified: Boolean(r.requester.phoneVerifiedAt) } : null
        }));
        return res.json({ data });
      } catch (dbErr) {
        console.warn('Admin requests Prisma error, falling back to store:', dbErr.message);
      }
    }
    const requests = store.getAllRequestsAdmin();
    return res.json({ data: requests });
  } catch (error) { return next(error); }
});

app.patch('/api/admin/requests/:id/status', requireAdmin, async (req, res, next) => {
  try {
    const { status } = req.body;
    const db = await getPrisma();
    if (db) {
      try {
        const request = await db.propertyRequest.update({
          where: { id: Number(req.params.id) },
          data: { status }
        });
        return res.json({ data: request });
      } catch (dbErr) {
        console.warn('Admin request status Prisma error, falling back to store:', dbErr.message);
      }
    }
    const request = store.adminUpdateRequestStatus(req.params.id, status);
    if (!request) return res.status(404).json({ error: 'Request not found.' });
    return res.json({ data: request });
  } catch (error) { return next(error); }
});

app.get('/api/admin/offers', requireAdmin, async (_req, res, next) => {
  try {
    const db = await getPrisma();
    if (db) {
      try {
        const offers = await db.offer.findMany({
          include: {
            buyer: { select: { id: true, name: true, email: true, phone: true } },
            listing: {
              include: {
                images: { where: { isPrimary: true }, take: 1 },
                seller: { select: { id: true, name: true, email: true, phone: true } }
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        });
        const data = offers.map(o => ({
          ...o,
          buyer: o.buyer,
          listing: o.listing ? {
            id: o.listing.id,
            title: o.listing.title,
            city: o.listing.city,
            price: o.listing.price,
            purpose: o.listing.purpose,
            images: o.listing.images
          } : null,
          owner: o.listing?.seller || null
        }));
        return res.json({ data });
      } catch (dbErr) {
        console.warn('Admin offers Prisma error, falling back to store:', dbErr.message);
      }
    }
    const offers = store.getAllOffersAdmin();
    return res.json({ data: offers });
  } catch (error) { return next(error); }
});

app.patch('/api/admin/offers/:id/status', requireAdmin, async (req, res, next) => {
  try {
    const { status, adminNote } = req.body;
    const db = await getPrisma();
    if (db) {
      try {
        const offer = await db.offer.update({
          where: { id: Number(req.params.id) },
          data: { status, ...(adminNote !== undefined && { ownerResponse: adminNote }) }
        });
        return res.json({ data: offer });
      } catch (dbErr) {
        console.warn('Admin offer status Prisma error, falling back to store:', dbErr.message);
      }
    }
    const offer = store.adminUpdateOfferStatus(req.params.id, status, adminNote);
    if (!offer) return res.status(404).json({ error: 'Offer not found.' });
    return res.json({ data: offer });
  } catch (error) { return next(error); }
});

app.get('/api/admin/contacts', requireAdmin, async (_req, res, next) => {
  try {
    const db = await getPrisma();
    if (db) {
      try {
        const contacts = await db.contactRequest.findMany({
          include: {
            sender: { select: { id: true, name: true, email: true, phone: true } },
            recipient: { select: { id: true, name: true, email: true, phone: true } },
            listing: { include: { images: { where: { isPrimary: true }, take: 1 } } }
          },
          orderBy: { createdAt: 'desc' }
        });
        const data = contacts.map(c => ({
          ...c,
          sender: c.sender,
          recipient: c.recipient,
          listing: c.listing ? { id: c.listing.id, title: c.listing.title, city: c.listing.city, images: c.listing.images } : null
        }));
        return res.json({ data });
      } catch (dbErr) {
        console.warn('Admin contacts Prisma error, falling back to store:', dbErr.message);
      }
    }
    const contacts = store.getAllContactsAdmin();
    return res.json({ data: contacts });
  } catch (error) { return next(error); }
});

app.patch('/api/admin/contacts/:id/status', requireAdmin, async (req, res, next) => {
  try {
    const { status, adminNote } = req.body;
    const db = await getPrisma();
    if (db) {
      try {
        const contact = await db.contactRequest.update({
          where: { id: Number(req.params.id) },
          data: { status }
        });
        return res.json({ data: contact });
      } catch (dbErr) {
        console.warn('Admin contact status Prisma error, falling back to store:', dbErr.message);
      }
    }
    const contact = store.adminUpdateContactStatus(req.params.id, status, adminNote);
    if (!contact) return res.status(404).json({ error: 'Contact not found.' });
    return res.json({ data: contact });
  } catch (error) { return next(error); }
});

app.get('/api/admin/users', requireAdmin, async (_req, res, next) => {
  try {
    const db = await getPrisma();
    if (db) {
      try {
        const users = await db.user.findMany({
          where: { role: { not: 'ADMIN' } },
          include: {
            _count: { select: { listings: true, offers: true, requests: true } }
          },
          orderBy: { createdAt: 'desc' }
        });
        const data = users.map(u => ({
          id: u.id, name: u.name, email: u.email, phone: u.phone, role: u.role,
          phoneVerified: Boolean(u.phoneVerifiedAt),
          listingsCount: u._count.listings,
          offersCount: u._count.offers,
          requestsCount: u._count.requests,
          createdAt: u.createdAt
        }));
        return res.json({ data });
      } catch (dbErr) {
        console.warn('Admin users Prisma error, falling back to store:', dbErr.message);
      }
    }
    const users = store.getAllUsersAdmin();
    return res.json({ data: users });
  } catch (error) { return next(error); }
});

/* ─── File Upload Route ──────────────────────────────────── */
(function setupUpload() {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
  const uploadsDir = isServerless ? path.join('/tmp', 'atlassi-uploads') : path.join(__dirname, 'uploads');
  try {
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  } catch (err) {
    console.warn('Could not create uploads directory:', err.message);
  }

  // Serve uploaded files statically
  app.use('/uploads', express.static(uploadsDir));

  const diskStorage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`);
    }
  });

  const upload = multer({
    storage: diskStorage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB per file
    fileFilter: (_req, file, cb) => {
      const allowed = /^(image|video)\//;
      if (allowed.test(file.mimetype)) return cb(null, true);
      cb(new Error('Only images and videos are allowed'));
    }
  });

  app.post('/api/upload', requireAuth, (req, res, next) => {
    upload.any()(req, res, (err) => {
      if (err) {
        console.error('Upload Error:', err);
        return res.status(400).json({ error: err.message || 'Error uploading file' });
      }
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
      }
      const relativeUrls = req.files.map(f => {
        if (f.filename) {
          return `/uploads/${f.filename}`;
        }
        if (f.buffer) {
          return `data:${f.mimetype};base64,${f.buffer.toString('base64')}`;
        }
        return '';
      }).filter(Boolean);

      return res.json({
        url: relativeUrls[0],
        urls: relativeUrls,
        data: relativeUrls.map(u => ({ url: u }))
      });
    });
  });
})();

// Error handling middleware
app.use((error, _req, res, _next) => {
  console.error('API Error:', error);
  const isProd = process.env.NODE_ENV === 'production';
  const status = error.status || error.statusCode || 500;
  res.status(status).json({
    error: isProd && status === 500
      ? 'An unexpected server error occurred. Please try again.'
      : (error.message || 'Something went wrong while processing your request.')
  });
});

export default app;

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Atlassi API running on port ${PORT} (${hasDatabase ? 'database' : 'persistent store'} mode)`);
  });
}
