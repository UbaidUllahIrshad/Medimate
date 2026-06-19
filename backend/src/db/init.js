const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '0011',
  database: process.env.DB_NAME || 'medimate',
});

async function main() {
  console.log('Connecting to PostgreSQL database...');
  const client = await pool.connect();
  try {
    console.log('Resetting public schema for a clean install...');
    await client.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
    console.log('Schema dropped and recreated.');

    console.log('Reading schema.sql...');
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log('Executing schema...');
    await client.query(schemaSql);
    console.log('Schema executed successfully.');

    console.log('Seeding initial data...');

    // 1. Seed Users
    const passwordHash = await bcrypt.hash('password123', 10);
    
    // Seed Admin
    await client.query(
      `INSERT INTO users (name, email, password_hash, role, phone_number, address) 
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (email) DO NOTHING`,
      ['Pharmacist Admin', 'pharmacist@medimate.com', passwordHash, 'admin', '+92 51 9876543', 'Pharmacy Headquarters, G-9, Islamabad']
    );

    // Seed Customer
    await client.query(
      `INSERT INTO users (name, email, password_hash, role, phone_number, address) 
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (email) DO NOTHING`,
      ['Patient Jane', 'patient@medimate.com', passwordHash, 'customer', '+92 333 1234567', 'House 42, Street 5, F-10, Islamabad']
    );

    console.log('Users seeded.');

    // 2. Seed Medicines (in PKR)
    const medicines = [
      {
        name: 'Paracetamol 500mg',
        manufacturer: 'GSK',
        description: 'Pain reliever and fever reducer.',
        price: 15.00,
        stock_quantity: 120,
        requires_prescription: false,
        image_url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=600&auto=format&fit=crop'
      },
      {
        name: 'Vitamin C 1000mg',
        manufacturer: 'Nature Made',
        description: 'Immune support dietary supplement.',
        price: 120.00,
        stock_quantity: 200,
        requires_prescription: false,
        image_url: 'https://images.unsplash.com/photo-1616679911721-eff6eec18fcd?q=80&w=600&auto=format&fit=crop'
      },
      {
        name: 'Ibuprofen 400mg',
        manufacturer: 'Advil',
        description: 'Nonsteroidal anti-inflammatory drug (NSAID) to treat pain and fever.',
        price: 80.00,
        stock_quantity: 150,
        requires_prescription: false,
        image_url: 'https://images.unsplash.com/photo-1550572017-edd951b55104?q=80&w=600&auto=format&fit=crop'
      },
      {
        name: 'Metformin 850mg',
        manufacturer: 'Sandoz',
        description: 'Oral diabetes medicine that helps control blood sugar levels for Type 2 diabetes.',
        price: 350.00,
        stock_quantity: 80,
        requires_prescription: true,
        image_url: 'https://images.unsplash.com/photo-1628771065518-0d82f1938462?q=80&w=600&auto=format&fit=crop'
      },
      {
        name: 'Lisinopril 10mg',
        manufacturer: 'Lupin',
        description: 'ACE inhibitor used to treat high blood pressure and heart failure.',
        price: 450.00,
        stock_quantity: 90,
        requires_prescription: true,
        image_url: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?q=80&w=600&auto=format&fit=crop'
      },
      {
        name: 'Lipitor 20mg',
        manufacturer: 'Pfizer',
        description: 'Statin medication used to prevent cardiovascular disease and lower lipids.',
        price: 1800.00,
        stock_quantity: 45,
        requires_prescription: true,
        image_url: 'https://images.unsplash.com/photo-1512438248247-f0f2a5a8b7f0?q=80&w=600&auto=format&fit=crop'
      }
    ];

    for (const med of medicines) {
      await client.query(
        `INSERT INTO medicines (name, manufacturer, description, price, stock_quantity, requires_prescription, image_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT DO NOTHING`,
        [med.name, med.manufacturer, med.description, med.price, med.stock_quantity, med.requires_prescription, med.image_url]
      );
    }

    console.log('Medicines seeded in PKR.');
    console.log('Database initialization completed successfully.');

  } catch (error) {
    console.error('Error during database initialization:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
