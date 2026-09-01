import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  phone: text('phone').notNull(),
  password: text('password').notNull(),
  role: text('role', { enum: ['admin', 'operator'] }).notNull().default('operator'),
  status: text('status', { enum: ['active', 'inactive'] }).notNull().default('active'),
  allocated_places: text('allocated_places'), // JSON string array of assigned cities: ["Mumbai", "Bengaluru"]
  created_at: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const tournaments = sqliteTable('tournaments', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  sport: text('sport').notNull(),
  status: text('status', { enum: ['Upcoming', 'Registration Open', 'Registration Closed', 'Live', 'Completed'] }).notNull().default('Upcoming'),
  primary_place: text('primary_place').notNull(),
  tournament_date: text('tournament_date').notNull(),
  registration_open: text('registration_open').notNull(),
  registration_close: text('registration_close').notNull(),
  capacity: integer('capacity').notNull(),
  min_members: integer('min_members').notNull(),
  max_members: integer('max_members').notNull(),
  min_age: integer('min_age').notNull(),
  max_age: integer('max_age').notNull(),
  show_jersey_size: integer('show_jersey_size').default(0), // 1 = show size input, 0 = hide size input
  image: text('image'),
  poster: text('poster'),
  address: text('address').notNull(),
  description: text('description').notNull(),
  sport_description: text('sport_description').notNull(),
  created_by: text('created_by').notNull(), // admin id
  created_at: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const payment_lines = sqliteTable('payment_lines', {
  id: text('id').primaryKey(),
  tournament_id: text('tournament_id').notNull(),
  title: text('title').notNull(),
  amount: integer('amount').notNull(),
});

export const prize_pool = sqliteTable('prize_pool', {
  id: text('id').primaryKey(),
  tournament_id: text('tournament_id').notNull(),
  position: text('position').notNull(),
  amount: integer('amount').notNull(),
});

export const registrations = sqliteTable('registrations', {
  id: text('id').primaryKey(),
  tournament_id: text('tournament_id').notNull(),
  registration_id: text('registration_id').notNull().unique(), // unique pass like SS-1234
  team_name: text('team_name').notNull(),
  city: text('city').notNull(),
  state: text('state').notNull(),
  captain: text('captain').notNull(),
  sub_captain: text('sub_captain'),
  coach: text('coach'),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  status: text('status', { enum: ['Pending', 'Approved', 'Rejected'] }).notNull().default('Pending'),
  payment_status: text('payment_status', { enum: ['Pending Verification', 'Verified', 'Rejected'] }).notNull().default('Pending Verification'),
  payment_proof: text('payment_proof'),
  unique_pass: text('unique_pass'),
  created_by: text('created_by').notNull(), // operator id
  created_at: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const players = sqliteTable('players', {
  id: text('id').primaryKey(),
  registration_id: text('registration_id').notNull(),
  name: text('name').notNull(),
  age: integer('age').notNull(),
  jersey: text('jersey'),
  size: text('size', { enum: ['XS', 'S', 'M', 'L', 'XL'] }),
  gender: text('gender'),
});
