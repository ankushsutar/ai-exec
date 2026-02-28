const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function seed() {
  console.log("Connecting to database...");
  try {
    const client = await pool.connect();

    console.log("Creating tables...");
    await client.query(`
      DROP TABLE IF EXISTS transactions;
      DROP TABLE IF EXISTS merchants;
      DROP TABLE IF EXISTS device_health;
      DROP TABLE IF EXISTS employees;
      DROP TABLE IF EXISTS products;

      CREATE TABLE merchants (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        country VARCHAR(100) DEFAULT 'US',
        industry VARCHAR(100) DEFAULT 'Retail',
        contact_email VARCHAR(255),
        rating DECIMAL(3, 1) DEFAULT 5.0,
        established_year INTEGER
      );

      CREATE TABLE products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        stock_quantity INTEGER DEFAULT 0
      );

      CREATE TABLE employees (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        department VARCHAR(100) NOT NULL,
        salary DECIMAL(10, 2) NOT NULL,
        hire_date DATE DEFAULT CURRENT_DATE
      );

      CREATE TABLE transactions (
        id SERIAL PRIMARY KEY,
        merchant_id INTEGER REFERENCES merchants(id),
        product_id INTEGER REFERENCES products(id),
        amount DECIMAL(10, 2) NOT NULL,
        tax DECIMAL(10, 2) DEFAULT 0.00,
        discount DECIMAL(10, 2) DEFAULT 0.00,
        region VARCHAR(100) NOT NULL,
        status VARCHAR(50) NOT NULL,
        payment_method VARCHAR(50) DEFAULT 'CREDIT_CARD',
        currency VARCHAR(10) DEFAULT 'USD',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE device_health (
        id SERIAL PRIMARY KEY,
        firmware_version VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL,
        battery_level INTEGER DEFAULT 100,
        temperature DECIMAL(5, 2) DEFAULT 35.0,
        location VARCHAR(100) DEFAULT 'Warehouse A',
        last_maintenance_date TIMESTAMP,
        reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("Inserting merchants...");
    await client.query(`
      INSERT INTO merchants (name, country, industry, contact_email, rating, established_year) VALUES
      ('TechNova Retail', 'US', 'Electronics', 'contact@technova.com', 4.8, 2010),
      ('Global Supplies Inc', 'UK', 'Wholesale', 'info@globalsupplies.co.uk', 4.5, 2005),
      ('Apex Electronics', 'CA', 'Electronics', 'sales@apexelectronics.ca', 4.9, 2015),
      ('Nexus Market', 'AU', 'Grocery', 'hello@nexusmarket.com.au', 4.2, 2018),
      ('Quantum Commerce', 'US', 'Software', 'partners@quantumcommerce.com', 4.7, 2020);
    `);

    console.log("Inserting products...");
    await client.query(`
      INSERT INTO products (name, category, price, stock_quantity) VALUES
      ('Quantum Server X1', 'Hardware', 4500.00, 50),
      ('Nexus Edge Router', 'Networking', 1200.00, 200),
      ('CloudSync License', 'Software', 300.00, 10000),
      ('AI Processor Gen3', 'Hardware', 8900.00, 25),
      ('Security Appliance', 'Networking', 2500.00, 75);
    `);

    console.log("Inserting employees...");
    await client.query(`
      INSERT INTO employees (name, department, salary, hire_date) VALUES
      ('Alice Smith', 'Engineering', 125000.00, '2020-05-15'),
      ('Bob Jones', 'Engineering', 115000.00, '2021-03-22'),
      ('Charlie Brown', 'Sales', 95000.00, '2019-11-10'),
      ('Diana Prince', 'Sales', 105000.00, '2022-01-05'),
      ('Evan Wright', 'Marketing', 85000.00, '2021-08-30'),
      ('Fiona Gallagher', 'Marketing', 90000.00, '2023-02-14'),
      ('George Harris', 'Executive', 250000.00, '2018-01-01');
    `);

    console.log("Inserting transactions...");
    await client.query(`
      INSERT INTO transactions (merchant_id, product_id, amount, tax, discount, region, status, payment_method, currency) VALUES
      (1, 1, 13500.00, 1350.00, 500.00, 'North America', 'COMPLETED', 'CREDIT_CARD', 'USD'),
      (1, 2, 2400.00, 240.00, 0.00, 'North America', 'COMPLETED', 'BANK_TRANSFER', 'USD'),
      (2, 4, 44500.00, 8900.00, 2000.00, 'Europe', 'COMPLETED', 'WIRE', 'EUR'),
      (2, 3, 1200.00, 240.00, 50.00, 'Europe', 'FAILED', 'CREDIT_CARD', 'EUR'),
      (3, 1, 9000.00, 450.00, 100.00, 'Asia Pacific', 'COMPLETED', 'BANK_TRANSFER', 'AUD'),
      (3, 4, 35600.00, 1780.00, 1500.00, 'Asia Pacific', 'COMPLETED', 'WIRE', 'AUD'),
      (4, 5, 5000.00, 500.00, 0.00, 'North America', 'COMPLETED', 'CREDIT_CARD', 'USD'),
      (4, 2, 7200.00, 720.00, 250.00, 'Latin America', 'COMPLETED', 'BANK_TRANSFER', 'USD'),
      (5, 4, 17800.00, 1780.00, 500.00, 'Europe', 'COMPLETED', 'WIRE', 'EUR'),
      (5, 3, 600.00, 60.00, 0.00, 'Asia Pacific', 'FAILED', 'CREDIT_CARD', 'AUD');
    `);

    console.log("Inserting device health logs...");
    await client.query(`
      INSERT INTO device_health (firmware_version, status, battery_level, temperature, location, last_maintenance_date) VALUES
      ('v1.0.4', 'OK', 95, 36.5, 'Warehouse A', '2023-01-15 10:00:00'),
      ('v1.0.4', 'OK', 88, 38.0, 'Warehouse B', '2023-02-20 14:30:00'),
      ('v1.0.4', 'FAILED', 15, 55.2, 'Store Front', '2022-11-05 09:15:00'),
      ('v1.0.5', 'OK', 99, 34.1, 'HQ Data Center', '2023-05-10 11:00:00'),
      ('v1.0.5', 'FAILED', 10, 60.5, 'Warehouse A', '2022-12-01 08:45:00'),
      ('v1.0.5', 'FAILED', 5, 62.0, 'Warehouse C', '2022-10-15 13:20:00'),
      ('v1.0.5', 'FAILED', 20, 58.4, 'Store Front', '2023-04-02 16:10:00'),
      ('v1.1.0-beta', 'FAILED', 45, 45.0, 'R&D Lab', '2023-06-01 10:00:00'),
      ('v1.1.0-beta', 'FAILED', 50, 46.5, 'R&D Lab', '2023-06-01 10:15:00'),
      ('v1.1.0-beta', 'FAILED', 30, 48.0, 'R&D Lab', '2023-06-01 10:30:00'),
      ('v1.1.0-beta', 'FAILED', 25, 49.5, 'Beta Site', '2023-05-20 09:00:00'),
      ('v1.1.0-beta', 'FAILED', 10, 65.0, 'Beta Site', '2023-05-20 09:30:00');
    `);

    console.log("Database seeded successfully!");
    client.release();
  } catch (err) {
    console.error("Error seeding database:", err);
  } finally {
    await pool.end();
  }
}

seed();
