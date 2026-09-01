import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
import path from 'path';

// "make the db as 2 db, one for normal use and other ofr mirro db this only add but not allow to delete"
// We'll simulate this by having main db and mirror db.
const dbPath = path.join(process.cwd(), 'smartsportz.sqlite');
const sqlite = new Database(dbPath);
export const db = drizzle(sqlite, { schema });

const mirrorDbPath = path.join(process.cwd(), 'smartsportz_mirror.sqlite');
const mirrorSqlite = new Database(mirrorDbPath);
export const mirrorDb = drizzle(mirrorSqlite, { schema });

// Initialize database with some seed data if empty
export function initDb() {
  // Create tables using drizzle-orm manually or run migrations.
  // For MVP, we will use raw queries to create tables since we don't have drizzle-kit migrations setup here.
  
  const createTables = `
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'operator',
      status TEXT NOT NULL DEFAULT 'active',
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tournaments (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      sport TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Upcoming',
      primary_place TEXT NOT NULL,
      tournament_date TEXT NOT NULL,
      registration_open TEXT NOT NULL,
      registration_close TEXT NOT NULL,
      capacity INTEGER NOT NULL,
      min_members INTEGER NOT NULL,
      max_members INTEGER NOT NULL,
      min_age INTEGER NOT NULL,
      max_age INTEGER NOT NULL,
      image TEXT,
      poster TEXT,
      address TEXT NOT NULL,
      description TEXT NOT NULL,
      sport_description TEXT NOT NULL,
      created_by TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS payment_lines (
      id TEXT PRIMARY KEY,
      tournament_id TEXT NOT NULL,
      title TEXT NOT NULL,
      amount INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS prize_pool (
      id TEXT PRIMARY KEY,
      tournament_id TEXT NOT NULL,
      position TEXT NOT NULL,
      amount INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS registrations (
      id TEXT PRIMARY KEY,
      tournament_id TEXT NOT NULL,
      registration_id TEXT NOT NULL UNIQUE,
      team_name TEXT NOT NULL,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      captain TEXT NOT NULL,
      sub_captain TEXT,
      coach TEXT,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Pending',
      payment_status TEXT NOT NULL DEFAULT 'Pending Verification',
      payment_proof TEXT,
      unique_pass TEXT,
      created_by TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS players (
      id TEXT PRIMARY KEY,
      registration_id TEXT NOT NULL,
      name TEXT NOT NULL,
      age INTEGER NOT NULL,
      jersey TEXT,
      size TEXT,
      gender TEXT
    );
  `;

  sqlite.exec(createTables);
  mirrorSqlite.exec(createTables);

  // Safe migrations for added columns
  try { sqlite.exec("ALTER TABLE users ADD COLUMN allocated_places TEXT;"); } catch {}
  try { mirrorSqlite.exec("ALTER TABLE users ADD COLUMN allocated_places TEXT;"); } catch {}
  try { sqlite.exec("ALTER TABLE tournaments ADD COLUMN show_jersey_size INTEGER DEFAULT 0;"); } catch {}
  try { mirrorSqlite.exec("ALTER TABLE tournaments ADD COLUMN show_jersey_size INTEGER DEFAULT 0;"); } catch {}

  // Seed Admin user if not exists
  const adminExists = sqlite.prepare('SELECT id FROM users WHERE email = ?').get('admin@smartsportz.in');
  if (!adminExists) {
    sqlite.prepare(`
      INSERT INTO users (id, name, email, phone, password, role, status, allocated_places, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run('admin-1', 'Super Admin', 'admin@smartsportz.in', '9999999999', 'admin123', 'admin', 'active', JSON.stringify(['Mumbai', 'Bengaluru', 'Delhi NCR', 'Chennai', 'Hyderabad', 'Kolkata', 'Pune']), Date.now());
  }

  // Seed Operator user if not exists
  const operatorExists = sqlite.prepare('SELECT id FROM users WHERE email = ?').get('operator@smartsportz.in');
  if (!operatorExists) {
    sqlite.prepare(`
      INSERT INTO users (id, name, email, phone, password, role, status, allocated_places, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run('op-1', 'Demo Operator', 'operator@smartsportz.in', '8888888888', 'operator123', 'operator', 'active', JSON.stringify(['Mumbai', 'Bengaluru']), Date.now());
  }
}

