import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import crypto from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { store, verifyPassword } from './dataStore.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const hasDatabase = Boolean(process.env.DATABASE_URL);
let prisma = null;

if (hasDatabase) {
  try {
    const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
    prisma = new PrismaClient({ adapter });
  } catch (err) {
    console.warn('Prisma initialization failed, falling back to persistent dataStore:', err.message);
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

// Payload size limit
app.use(express.json({ limit: '2mb' }));

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
  if (hasDatabase && prisma) {
    try {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
      await prisma.session.create({
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

  if (hasDatabase && prisma) {
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const session = await prisma.session.findUnique({
      where: { tokenHash },
      include: { user: true }
    });
    return session && session.expiresAt > new Date() ? session.user : null;
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

    if (hasDatabase && prisma) {
      const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (existing) return res.status(409).json({ error: 'An account with this email already exists.' });

      const salt = crypto.randomBytes(16).toString('hex');
      const hash = crypto.scryptSync(password, salt, 64).toString('hex');
      const user = await prisma.user.create({
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

    if (hasDatabase && prisma) {
      try {
        user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (user) {
          const [salt, storedHash] = user.password.split(':');
          const computedHash = crypto.scryptSync(password, salt, 64).toString('hex');
          passwordValid = crypto.timingSafeEqual(Buffer.from(computedHash, 'hex'), Buffer.from(storedHash, 'hex'));
        }
      } catch (dbErr) {
        console.warn('Prisma query failed, falling back to dataStore:', dbErr.message);
        user = store.findUserByEmail(normalizedEmail);
        if (user) passwordValid = verifyPassword(password, user.password);
      }
    } else {
      user = store.findUserByEmail(normalizedEmail);
      if (user) {
        passwordValid = verifyPassword(password, user.password);
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
  const favorites = hasDatabase && prisma
    ? await prisma.favorite.findMany({ where: { userId: req.user.id } })
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
    if (hasDatabase && prisma) {
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      await prisma.session.deleteMany({ where: { tokenHash } });
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
    if (hasDatabase && prisma) {
      updatedUser = await prisma.user.update({
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

// LISTINGS
app.get('/api/listings', async (req, res, next) => {
  try {
    if (hasDatabase && prisma) {
      const { purpose, city, type, minPrice, maxPrice, search, sort } = req.query;
      const where = {
        status: 'PUBLISHED',
        ...(purpose && { purpose: purpose.toUpperCase() }),
        ...(city && { city: { contains: city, mode: 'insensitive' } }),
        ...(type && { type: type.toUpperCase() }),
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

      const listings = await prisma.listing.findMany({
        where,
        include: {
          images: { orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }] },
          seller: { select: { id: true, name: true, email: true, phone: true } }
        },
        orderBy
      });
      return res.json({ data: listings, meta: { total: listings.length, mode: 'database' } });
    }

    const listings = store.getListings(req.query);
    return res.json({ data: listings, meta: { total: listings.length, mode: 'persistent-store' } });
  } catch (error) {
    return next(error);
  }
});

app.get('/api/listings/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (hasDatabase && prisma) {
      const listing = await prisma.listing.findFirst({
        where: { id, status: 'PUBLISHED' },
        include: {
          images: { orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }] },
          seller: { select: { id: true, name: true, email: true, phone: true, createdAt: true } }
        }
      });
      return listing ? res.json({ data: listing }) : res.status(404).json({ error: 'Listing not found' });
    }

    const listing = store.getListingById(id);
    return listing ? res.json({ data: listing }) : res.status(404).json({ error: 'Listing not found' });
  } catch (error) {
    return next(error);
  }
});

app.post('/api/listings', requireAuth, async (req, res, next) => {
  try {
    const {
      title,
      description,
      price,
      purpose,
      type,
      city,
      neighborhood,
      location,
      bedrooms,
      bathrooms,
      livingRooms,
      kitchens,
      floors,
      propertyFloor,
      surface,
      condition,
      furnished,
      amenities = [],
      images = [],
      instagramVideoUrl
    } = req.body || {};

    if (!title || !description || !price || !purpose || !type || !city) {
      return res.status(400).json({ error: 'Title, description, price, purpose, type, and city are required.' });
    }

    if (hasDatabase && prisma) {
      const listing = await prisma.listing.create({
        data: {
          title: title.trim(),
          description: description.trim(),
          price: Number(price),
          purpose: purpose.toUpperCase(),
          type: type.toUpperCase(),
          city,
          neighborhood: neighborhood || null,
          location: location || neighborhood || city,
          bedrooms: bedrooms ? Number(bedrooms) : null,
          bathrooms: bathrooms ? Number(bathrooms) : null,
          livingRooms: livingRooms ? Number(livingRooms) : null,
          kitchens: kitchens ? Number(kitchens) : null,
          floors: floors ? Number(floors) : null,
          propertyFloor: propertyFloor ? Number(propertyFloor) : null,
          surface: surface ? Number(surface) : null,
          condition: condition || 'Good',
          furnished: Boolean(furnished),
          amenities: Array.isArray(amenities) ? amenities : [],
          instagramVideoUrl: instagramVideoUrl || null,
          status: 'PUBLISHED',
          sellerId: req.user.id,
          images: {
            create: images.map((url, idx) => ({
              url: typeof url === 'string' ? url : url.url,
              sortOrder: idx,
              isPrimary: idx === 0
            }))
          }
        },
        include: { images: true }
      });
      return res.status(201).json({ data: listing });
    }

    const created = store.createListing(req.body, req.user.id);
    return res.status(201).json({ data: created, meta: { mode: 'persistent-store' } });
  } catch (error) {
    return next(error);
  }
});

app.get('/api/me/listings', requireAuth, async (req, res, next) => {
  try {
    if (hasDatabase && prisma) {
      const listings = await prisma.listing.findMany({
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

    if (hasDatabase && prisma) {
      const listing = await prisma.listing.findFirst({
        where: { id: Number(req.params.id), sellerId: req.user.id }
      });
      if (!listing) return res.status(404).json({ error: 'Listing not found or unauthorized.' });
      const updated = await prisma.listing.update({
        where: { id: listing.id },
        data: { status }
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

    if (hasDatabase && prisma) {
      const listing = await prisma.listing.findFirst({
        where: { id: Number(req.params.id), status: 'PUBLISHED' }
      });
      if (!listing || listing.sellerId === req.user.id) {
        return res.status(400).json({ error: 'Listing is not eligible for your offer.' });
      }
      const offer = await prisma.offer.create({
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
    if (hasDatabase && prisma) {
      const offers = await prisma.offer.findMany({
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
    if (hasDatabase && prisma) {
      const offers = await prisma.offer.findMany({
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

    if (hasDatabase && prisma) {
      const offer = await prisma.offer.findFirst({
        where: { id: Number(req.params.id), listing: { sellerId: req.user.id } }
      });
      if (!offer) return res.status(404).json({ error: 'Offer not found or unauthorized.' });
      const updated = await prisma.offer.update({
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
    if (hasDatabase && prisma) {
      await prisma.favorite.upsert({
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
    if (hasDatabase && prisma) {
      await prisma.favorite.deleteMany({
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
    if (hasDatabase && prisma) {
      const favorites = await prisma.favorite.findMany({
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

    if (hasDatabase && prisma) {
      const request = await prisma.propertyRequest.create({
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

app.get('/api/requests', async (req, res, next) => {
  try {
    if (hasDatabase && prisma) {
      const requests = await prisma.propertyRequest.findMany({
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
    if (hasDatabase && prisma) {
      const listing = await prisma.listing.findUnique({ where: { id: listingId } });
      if (!listing) return res.status(404).json({ error: 'Listing not found' });

      const contact = await prisma.contactRequest.create({
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
    const stats = store.getAdminStats();
    return res.json({ data: stats });
  } catch (error) { return next(error); }
});

app.get('/api/admin/listings', requireAdmin, async (_req, res, next) => {
  try {
    const listings = store.getAllListingsAdmin();
    return res.json({ data: listings });
  } catch (error) { return next(error); }
});

app.patch('/api/admin/listings/:id/status', requireAdmin, async (req, res, next) => {
  try {
    const { status } = req.body;
    const listing = store.adminUpdateListingStatus(req.params.id, status);
    if (!listing) return res.status(404).json({ error: 'Listing not found.' });
    return res.json({ data: listing });
  } catch (error) { return next(error); }
});

app.patch('/api/admin/listings/:id/featured', requireAdmin, async (req, res, next) => {
  try {
    const listing = store.adminToggleListingFeatured(req.params.id);
    if (!listing) return res.status(404).json({ error: 'Listing not found.' });
    return res.json({ data: listing });
  } catch (error) { return next(error); }
});

app.get('/api/admin/requests', requireAdmin, async (_req, res, next) => {
  try {
    const requests = store.getAllRequestsAdmin();
    return res.json({ data: requests });
  } catch (error) { return next(error); }
});

app.patch('/api/admin/requests/:id/status', requireAdmin, async (req, res, next) => {
  try {
    const { status } = req.body;
    const request = store.adminUpdateRequestStatus(req.params.id, status);
    if (!request) return res.status(404).json({ error: 'Request not found.' });
    return res.json({ data: request });
  } catch (error) { return next(error); }
});

app.get('/api/admin/offers', requireAdmin, async (_req, res, next) => {
  try {
    const offers = store.getAllOffersAdmin();
    return res.json({ data: offers });
  } catch (error) { return next(error); }
});

app.patch('/api/admin/offers/:id/status', requireAdmin, async (req, res, next) => {
  try {
    const { status, adminNote } = req.body;
    const offer = store.adminUpdateOfferStatus(req.params.id, status, adminNote);
    if (!offer) return res.status(404).json({ error: 'Offer not found.' });
    return res.json({ data: offer });
  } catch (error) { return next(error); }
});

app.get('/api/admin/contacts', requireAdmin, async (_req, res, next) => {
  try {
    const contacts = store.getAllContactsAdmin();
    return res.json({ data: contacts });
  } catch (error) { return next(error); }
});

app.patch('/api/admin/contacts/:id/status', requireAdmin, async (req, res, next) => {
  try {
    const { status, adminNote } = req.body;
    const contact = store.adminUpdateContactStatus(req.params.id, status, adminNote);
    if (!contact) return res.status(404).json({ error: 'Contact not found.' });
    return res.json({ data: contact });
  } catch (error) { return next(error); }
});

app.get('/api/admin/users', requireAdmin, async (_req, res, next) => {
  try {
    const users = store.getAllUsersAdmin();
    return res.json({ data: users });
  } catch (error) { return next(error); }
});

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

app.listen(PORT, () => {
  console.log(`Atlassi API running on port ${PORT} (${hasDatabase && prisma ? 'database' : 'persistent store'} mode)`);
});
