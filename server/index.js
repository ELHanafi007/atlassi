import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Basic health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Atlassi API is running (مرحبا بكم)' });
});

// Listings routes (mock for now until prisma is migrated)
app.get('/api/listings', async (req, res) => {
  try {
    // Return some mock data in Darija for now
    const mockListings = [
      {
        id: 1,
        title: 'فيلا فاخرة بمراكش',
        description: 'فيلا واعرة في قلب كليز، 4 بيوت، لابيسين، وجردة كبيرة.',
        price: '4,500,000 DH',
        type: 'SALE',
        category: 'VILLA',
        location: 'Marrakech',
        image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=80&w=800'
      },
      {
        id: 2,
        title: 'شقة عصرية في كازا',
        description: 'برطمة نقية بزاف في عين الذياب، إطلالة على البحر.',
        price: '12,000 DH / Month',
        type: 'RENT',
        category: 'APARTMENT',
        location: 'Casablanca',
        image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=800'
      }
    ];
    res.json(mockListings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
