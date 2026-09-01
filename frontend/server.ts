import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { db, mirrorDb, initDb } from './src/db';
import { users, tournaments, payment_lines, prize_pool, registrations, players } from './src/db/schema';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { sendApprovalEmailWithPass, sendPasswordResetEmail } from './src/lib/emailService';

const JWT_SECRET = 'smartsportz-secret-2026';

// Setup multer for uploads
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

function generateCode(prefix: string, len: number = 7): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < len; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${result}`;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  
  // Serve uploads
  app.use('/uploads', express.static(uploadDir));

  // Initialize DB
  initDb();

  // Auth Middleware
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);
    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  };

  const isAdmin = (req: any, res: any, next: any) => {
    if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Requires admin role' });
    next();
  };

  // --- AUTH ROUTES ---
  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
      const user = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (user.length === 0 || user[0].password !== password) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      let places: string[] = [];
      try {
        places = user[0].allocated_places ? JSON.parse(user[0].allocated_places) : [];
      } catch {
        places = user[0].allocated_places ? [user[0].allocated_places] : [];
      }

      const token = jwt.sign({ 
        id: user[0].id, 
        email: user[0].email, 
        role: user[0].role, 
        name: user[0].name,
        phone: user[0].phone,
        allocated_places: places
      }, JWT_SECRET, { expiresIn: '24h' });

      res.json({ 
        token, 
        user: { 
          id: user[0].id, 
          name: user[0].name, 
          email: user[0].email, 
          phone: user[0].phone,
          role: user[0].role,
          allocated_places: places
        } 
      });
    } catch (error) {
      res.status(500).json({ error: 'Server error during login' });
    }
  });

  app.get('/api/auth/me', authenticateToken, async (req: any, res) => {
    try {
      const user = await db.select().from(users).where(eq(users.id, req.user.id)).limit(1);
      if (user.length === 0) return res.status(404).json({ error: 'User not found' });

      let places: string[] = [];
      try {
        places = user[0].allocated_places ? JSON.parse(user[0].allocated_places) : [];
      } catch {
        places = user[0].allocated_places ? [user[0].allocated_places] : [];
      }

      res.json({ 
        user: { 
          id: user[0].id, 
          name: user[0].name, 
          email: user[0].email, 
          phone: user[0].phone,
          role: user[0].role,
          allocated_places: places
        } 
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch user session' });
    }
  });

  // Edit My Profile (Name & Phone)
  app.put('/api/auth/profile', authenticateToken, async (req: any, res) => {
    try {
      const { name, phone } = req.body;
      if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });

      await db.update(users).set({ name: name.trim(), phone: String(phone || '').trim() }).where(eq(users.id, req.user.id));
      await mirrorDb.update(users).set({ name: name.trim(), phone: String(phone || '').trim() }).where(eq(users.id, req.user.id));

      const updated = await db.select().from(users).where(eq(users.id, req.user.id)).limit(1);
      let places: string[] = [];
      try { places = updated[0].allocated_places ? JSON.parse(updated[0].allocated_places) : []; } catch { places = []; }

      res.json({
        message: 'Profile updated successfully',
        user: {
          id: updated[0].id,
          name: updated[0].name,
          email: updated[0].email,
          phone: updated[0].phone,
          role: updated[0].role,
          allocated_places: places
        }
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to update profile' });
    }
  });

  // Verify Current Password (Step 1 of password change)
  app.post('/api/auth/verify-current-password', authenticateToken, async (req: any, res) => {
    try {
      const { currentPassword } = req.body;
      if (!currentPassword || !currentPassword.trim()) {
        return res.status(400).json({ error: 'Please enter your current password' });
      }

      const user = await db.select().from(users).where(eq(users.id, req.user.id)).limit(1);
      if (user.length === 0 || user[0].password !== currentPassword) {
        return res.status(400).json({ error: 'Current password is wrong' });
      }

      res.json({ success: true, message: 'Current password is correct' });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to verify password' });
    }
  });

  // Change Password (Step 2 of password change)
  app.post('/api/auth/change-password', authenticateToken, async (req: any, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Both current password and new password are required' });
      }

      const user = await db.select().from(users).where(eq(users.id, req.user.id)).limit(1);
      if (user.length === 0 || user[0].password !== currentPassword) {
        return res.status(400).json({ error: 'Current password is wrong' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters' });
      }

      await db.update(users).set({ password: newPassword }).where(eq(users.id, req.user.id));
      await mirrorDb.update(users).set({ password: newPassword }).where(eq(users.id, req.user.id));

      res.json({ message: 'Password changed successfully' });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to change password' });
    }
  });

  // Forgot Password
  app.post('/api/auth/forgot-password', async (req, res) => {
    try {
      const { email } = req.body;
      if (!email || !email.trim()) return res.status(400).json({ error: 'Email address is required' });

      const user = await db.select().from(users).where(eq(users.email, email.trim())).limit(1);
      if (user.length === 0) {
        return res.status(404).json({ error: 'No account found with this email address' });
      }

      const tempPassword = 'Sportz' + Math.floor(1000 + Math.random() * 9000);
      await db.update(users).set({ password: tempPassword }).where(eq(users.id, user[0].id));
      await mirrorDb.update(users).set({ password: tempPassword }).where(eq(users.id, user[0].id));

      await sendPasswordResetEmail(user[0].email, tempPassword, user[0].name);

      res.json({ 
        success: true, 
        message: `Password reset instructions and temporary password have been sent to ${email}.` 
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to process forgot password request' });
    }
  });

  // --- OPERATOR MANAGEMENT ROUTES (Admin Only) ---
  app.get('/api/operators', authenticateToken, isAdmin, async (req, res) => {
    try {
      const ops = await db.select().from(users).where(eq(users.role, 'operator'));
      const parsed = ops.map(op => {
        let places: string[] = [];
        if (op.allocated_places) {
          try {
            const parsedJson = JSON.parse(op.allocated_places);
            places = Array.isArray(parsedJson) ? parsedJson : [String(parsedJson)];
          } catch {
            places = String(op.allocated_places).split(',').map(s => s.trim()).filter(Boolean);
          }
        }
        return {
          id: op.id,
          name: op.name,
          email: op.email,
          phone: op.phone || '',
          role: op.role,
          status: op.status || 'active',
          allocated_places: places,
          created_at: op.created_at
        };
      });
      res.json(parsed);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch operators' });
    }
  });

  app.post('/api/operators', authenticateToken, isAdmin, async (req, res) => {
    try {
      const { name, email, phone, password, allocated_places } = req.body;
      if (!name || !email) return res.status(400).json({ error: 'Name and email are required' });

      const existing = await db.select().from(users).where(eq(users.email, email.trim())).limit(1);
      if (existing.length > 0) {
        return res.status(400).json({ error: 'An operator or user with this email already exists' });
      }

      const opId = 'op-' + Math.random().toString(36).substring(2, 9);
      const placesJson = JSON.stringify(Array.isArray(allocated_places) ? allocated_places : ['Mumbai']);

      const opData = {
        id: opId,
        name: name.trim(),
        email: email.trim(),
        phone: String(phone || '9999999999').trim(),
        password: password || 'operator123',
        role: 'operator' as const,
        status: 'active' as const,
        allocated_places: placesJson,
        created_at: new Date()
      };

      await db.insert(users).values(opData);
      await mirrorDb.insert(users).values(opData);

      res.status(201).json({ message: 'Operator created successfully', id: opId });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to create operator' });
    }
  });

  app.put('/api/operators/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
      const opId = req.params.id;
      const { name, email, phone, password, allocated_places, status } = req.body;

      const updatePayload: any = {
        name: name.trim(),
        email: email.trim(),
        phone: String(phone || '').trim(),
        allocated_places: JSON.stringify(Array.isArray(allocated_places) ? allocated_places : []),
        status: status || 'active'
      };

      if (password && password.trim()) {
        updatePayload.password = password.trim();
      }

      await db.update(users).set(updatePayload).where(eq(users.id, opId));
      await mirrorDb.update(users).set(updatePayload).where(eq(users.id, opId));

      res.json({ message: 'Operator updated successfully' });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to update operator' });
    }
  });

  app.delete('/api/operators/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
      const opId = req.params.id;
      await db.delete(users).where(eq(users.id, opId));
      await mirrorDb.update(users).set({ status: 'inactive' }).where(eq(users.id, opId));
      res.json({ message: 'Operator deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to delete operator' });
    }
  });

  // --- TOURNAMENT ROUTES ---
  app.get('/api/tournaments', authenticateToken, async (req: any, res) => {
    try {
      let allTournaments = await db.select().from(tournaments);
      const allRegs = await db.select().from(registrations);

      // If user is an operator, filter tournaments by their allocated places
      if (req.user?.role === 'operator') {
        const userRows = await db.select().from(users).where(eq(users.id, req.user.id)).limit(1);
        if (userRows.length > 0 && userRows[0].allocated_places) {
          try {
            const places: string[] = JSON.parse(userRows[0].allocated_places);
            if (Array.isArray(places) && places.length > 0) {
              allTournaments = allTournaments.filter(t => places.includes(t.primary_place));
            }
          } catch {}
        }
      }

      const tournamentsWithCounts = allTournaments.map(t => {
        const tRegs = allRegs.filter(r => r.tournament_id === t.id);
        const verifiedCount = tRegs.filter(r => r.payment_status === 'Verified').length;
        return {
          ...t,
          registered_count: tRegs.length,
          verified_count: verifiedCount
        };
      });

      res.json(tournamentsWithCounts);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch tournaments' });
    }
  });

  app.get('/api/tournaments/:id', authenticateToken, async (req, res) => {
    try {
      const t = await db.select().from(tournaments).where(eq(tournaments.id, req.params.id)).limit(1);
      if (t.length === 0) return res.status(404).json({ error: 'Tournament not found' });
      
      const pLines = await db.select().from(payment_lines).where(eq(payment_lines.tournament_id, req.params.id));
      const pPools = await db.select().from(prize_pool).where(eq(prize_pool.tournament_id, req.params.id));
      const tRegs = await db.select().from(registrations).where(eq(registrations.tournament_id, req.params.id));
      
      res.json({ 
        ...t[0], 
        payment_lines: pLines, 
        prize_pool: pPools,
        registered_count: tRegs.length
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch tournament' });
    }
  });

  // Check if team name already exists for a tournament
  app.get('/api/tournaments/:id/check-team', authenticateToken, async (req, res) => {
    try {
      const teamName = String(req.query.name || '').trim().toLowerCase();
      if (!teamName) return res.json({ exists: false });

      const allRegs = await db.select().from(registrations).where(eq(registrations.tournament_id, req.params.id));
      const exists = allRegs.some(r => r.team_name.trim().toLowerCase() === teamName);
      
      res.json({ exists, message: exists ? 'This team name is already taken' : 'Team name is available' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to check team name' });
    }
  });

  app.post('/api/tournaments', authenticateToken, isAdmin, async (req: any, res) => {
    try {
      const data = req.body;
      const tId = 'T-' + Math.random().toString(36).substring(2, 9).toUpperCase();
      
      const tournamentData = {
        id: tId,
        name: data.name,
        sport: data.sport,
        status: data.status || 'Upcoming',
        primary_place: data.primary_place,
        tournament_date: data.tournament_date,
        registration_open: data.registration_open,
        registration_close: data.registration_close,
        capacity: Number(data.capacity || 16),
        min_members: Number(data.min_members || 1),
        max_members: Number(data.max_members || 15),
        min_age: Number(data.min_age || 10),
        max_age: Number(data.max_age || 50),
        show_jersey_size: data.show_jersey_size ? 1 : 0,
        image: data.image || '/assets/cricket-stadium.png',
        poster: data.poster || '/assets/poster.jpeg',
        address: data.address || '',
        description: data.description || '',
        sport_description: data.sport_description || '',
        created_by: req.user.id,
        created_at: new Date()
      };

      await db.insert(tournaments).values(tournamentData);
      await mirrorDb.insert(tournaments).values(tournamentData); // Mirror write

      if (data.payment_lines && data.payment_lines.length > 0) {
        for (const pl of data.payment_lines) {
          const plData = { id: uuidv4(), tournament_id: tId, title: pl.title, amount: Number(pl.amount || 0) };
          await db.insert(payment_lines).values(plData);
          await mirrorDb.insert(payment_lines).values(plData);
        }
      }

      if (data.prize_pool && data.prize_pool.length > 0) {
        for (const pp of data.prize_pool) {
          const ppData = { id: uuidv4(), tournament_id: tId, position: pp.position, amount: Number(pp.amount || 0) };
          await db.insert(prize_pool).values(ppData);
          await mirrorDb.insert(prize_pool).values(ppData);
        }
      }

      res.status(201).json({ message: 'Tournament created', id: tId });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  });

  app.put('/api/tournaments/:id', authenticateToken, isAdmin, async (req: any, res) => {
    try {
      const tId = req.params.id;
      const data = req.body;

      const updateData = {
        name: data.name,
        sport: data.sport,
        status: data.status,
        primary_place: data.primary_place,
        tournament_date: data.tournament_date,
        registration_open: data.registration_open,
        registration_close: data.registration_close,
        capacity: Number(data.capacity),
        min_members: Number(data.min_members),
        max_members: Number(data.max_members),
        min_age: Number(data.min_age),
        max_age: Number(data.max_age),
        show_jersey_size: data.show_jersey_size ? 1 : 0,
        image: data.image,
        poster: data.poster,
        address: data.address,
        description: data.description,
        sport_description: data.sport_description,
      };

      await db.update(tournaments).set(updateData).where(eq(tournaments.id, tId));
      await mirrorDb.update(tournaments).set(updateData).where(eq(tournaments.id, tId));

      // Update payment lines if passed
      if (data.payment_lines && Array.isArray(data.payment_lines)) {
        await db.delete(payment_lines).where(eq(payment_lines.tournament_id, tId));
        await mirrorDb.delete(payment_lines).where(eq(payment_lines.tournament_id, tId));
        for (const pl of data.payment_lines) {
          const plData = { id: uuidv4(), tournament_id: tId, title: pl.title, amount: Number(pl.amount || 0) };
          await db.insert(payment_lines).values(plData);
          await mirrorDb.insert(payment_lines).values(plData);
        }
      }

      // Update prize pool if passed
      if (data.prize_pool && Array.isArray(data.prize_pool)) {
        await db.delete(prize_pool).where(eq(prize_pool.tournament_id, tId));
        await mirrorDb.delete(prize_pool).where(eq(prize_pool.tournament_id, tId));
        for (const pp of data.prize_pool) {
          const ppData = { id: uuidv4(), tournament_id: tId, position: pp.position, amount: Number(pp.amount || 0) };
          await db.insert(prize_pool).values(ppData);
          await mirrorDb.insert(prize_pool).values(ppData);
        }
      }

      res.json({ message: 'Tournament updated successfully', id: tId });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/tournaments/:id', authenticateToken, isAdmin, async (req: any, res) => {
    try {
      const tId = req.params.id;
      
      // Delete associated registrations and players
      const regs = await db.select().from(registrations).where(eq(registrations.tournament_id, tId));
      for (const r of regs) {
        await db.delete(players).where(eq(players.registration_id, r.registration_id));
        await mirrorDb.delete(players).where(eq(players.registration_id, r.registration_id));
      }

      await db.delete(registrations).where(eq(registrations.tournament_id, tId));
      await mirrorDb.delete(registrations).where(eq(registrations.tournament_id, tId));

      await db.delete(payment_lines).where(eq(payment_lines.tournament_id, tId));
      await mirrorDb.delete(payment_lines).where(eq(payment_lines.tournament_id, tId));

      await db.delete(prize_pool).where(eq(prize_pool.tournament_id, tId));
      await mirrorDb.delete(prize_pool).where(eq(prize_pool.tournament_id, tId));

      await db.delete(tournaments).where(eq(tournaments.id, tId));
      await mirrorDb.delete(tournaments).where(eq(tournaments.id, tId));

      res.json({ message: 'Tournament deleted successfully' });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  });

  // --- UPLOAD ROUTE ---
  app.post('/api/upload', authenticateToken, upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    res.json({ url: '/uploads/' + req.file.filename });
  });

  // --- REGISTRATION ROUTES ---
  app.post('/api/registrations', authenticateToken, async (req: any, res) => {
    try {
      const data = req.body;
      const teamNameTrimmed = String(data.team_name || '').trim();

      // Enforce duplicate check
      const existing = await db.select().from(registrations).where(
        eq(registrations.tournament_id, data.tournament_id)
      );
      if (existing.some(r => r.team_name.trim().toLowerCase() === teamNameTrimmed.toLowerCase())) {
        return res.status(400).json({ error: 'This team name is already taken for this tournament' });
      }

      const regId = generateCode('REG', 7); // e.g. REG-8T9A5YH
      
      const registrationData = {
        id: uuidv4(),
        tournament_id: data.tournament_id,
        registration_id: regId,
        team_name: teamNameTrimmed,
        city: data.city,
        state: data.state,
        captain: data.captain,
        sub_captain: data.sub_captain || null,
        coach: data.coach || null,
        email: data.email,
        phone: data.phone,
        status: 'Pending' as const,
        payment_status: 'Pending Verification' as const,
        payment_proof: data.payment_proof || null,
        created_by: req.user.id,
        created_at: new Date()
      };

      await db.insert(registrations).values(registrationData);
      await mirrorDb.insert(registrations).values(registrationData);

      if (data.players && Array.isArray(data.players) && data.players.length > 0) {
        for (const player of data.players) {
          if (!player.name || !player.name.trim()) continue;
          const pData = {
            id: uuidv4(),
            registration_id: regId,
            name: player.name.trim(),
            age: Number(player.age || 0),
            jersey: player.jersey || null,
            size: player.size || null,
            gender: player.gender || null
          };
          await db.insert(players).values(pData);
          await mirrorDb.insert(players).values(pData);
        }
      }

      res.status(201).json({ message: 'Registration submitted', registration_id: regId });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/registrations', authenticateToken, async (req: any, res) => {
    try {
      let result;
      if (req.user.role === 'admin') {
        result = await db.select().from(registrations);
      } else {
        result = await db.select().from(registrations).where(eq(registrations.created_by, req.user.id));
      }
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch registrations' });
    }
  });

  // --- TEAMS ROUTE ---
  app.get('/api/teams', authenticateToken, async (req: any, res) => {
    try {
      const allRegs = await db.select().from(registrations);
      let allTournaments = await db.select().from(tournaments);
      const allPlayers = await db.select().from(players);

      if (req.user?.role === 'operator') {
        const userRows = await db.select().from(users).where(eq(users.id, req.user.id)).limit(1);
        if (userRows.length > 0 && userRows[0].allocated_places) {
          try {
            const places: string[] = JSON.parse(userRows[0].allocated_places);
            if (Array.isArray(places) && places.length > 0) {
              allTournaments = allTournaments.filter(t => places.includes(t.primary_place));
            }
          } catch {}
        }
      }

      const tournamentMap = new Map(allTournaments.map(t => [t.id, t]));

      const teamList = allRegs
        .filter(reg => tournamentMap.has(reg.tournament_id))
        .map(reg => {
          const tourney = tournamentMap.get(reg.tournament_id);
          const teamPlayers = allPlayers.filter(p => p.registration_id === reg.registration_id);
          return {
            id: reg.id,
            registration_id: reg.registration_id,
            team_name: reg.team_name,
            captain: reg.captain,
            email: reg.email,
            phone: reg.phone,
            city: reg.city,
            state: reg.state,
            status: reg.status,
            payment_status: reg.payment_status,
            unique_pass: reg.unique_pass,
            tournament_id: reg.tournament_id,
            tournament_name: tourney?.name || 'Tournament',
            tournament_sport: tourney?.sport || 'Sport',
            player_count: teamPlayers.length,
            players: teamPlayers,
            created_at: reg.created_at
          };
        });

      res.json(teamList);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch teams' });
    }
  });

  app.post('/api/registrations/:id/approve', authenticateToken, isAdmin, async (req: any, res) => {
    try {
      const regId = req.params.id; // registration_id (e.g. REG-8T9A5YH)
      const uniquePass = generateCode('SS-PASS', 8);
      
      await db.update(registrations).set({ status: 'Approved', payment_status: 'Verified', unique_pass: uniquePass }).where(eq(registrations.registration_id, regId));
      await mirrorDb.update(registrations).set({ status: 'Approved', payment_status: 'Verified', unique_pass: uniquePass }).where(eq(registrations.registration_id, regId));
      
      // Fetch details for email dispatch
      const regRows = await db.select().from(registrations).where(eq(registrations.registration_id, regId)).limit(1);
      if (regRows.length > 0) {
        const reg = regRows[0];
        const tourneyRows = await db.select().from(tournaments).where(eq(tournaments.id, reg.tournament_id)).limit(1);
        const teamPlayers = await db.select().from(players).where(eq(players.registration_id, regId));
        const tourney = tourneyRows[0] || {} as any;

        // Send confirmation email with PDF pass attached
        await sendApprovalEmailWithPass({
          teamName: reg.team_name,
          captainName: reg.captain,
          email: reg.email,
          phone: reg.phone,
          city: reg.city,
          state: reg.state,
          tournamentName: tourney.name || 'Tournament Championship',
          tournamentSport: tourney.sport || 'Sports',
          tournamentDate: tourney.tournament_date || 'Upcoming',
          tournamentPlace: tourney.primary_place || tourney.address || 'Host Stadium',
          registrationId: regId,
          uniquePass: uniquePass,
          players: teamPlayers.map(p => ({ name: p.name, age: p.age }))
        });
      }

      res.json({ message: 'Registration approved and pass sent', unique_pass: uniquePass });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to approve registration' });
    }
  });

  app.post('/api/registrations/:id/reject', authenticateToken, isAdmin, async (req: any, res) => {
    try {
      const regId = req.params.id;
      await db.update(registrations).set({ status: 'Rejected', payment_status: 'Rejected' }).where(eq(registrations.registration_id, regId));
      await mirrorDb.update(registrations).set({ status: 'Rejected', payment_status: 'Rejected' }).where(eq(registrations.registration_id, regId));
      res.json({ message: 'Registration rejected' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to reject registration' });
    }
  });

  app.get('/api/dashboard', authenticateToken, isAdmin, async (req, res) => {
    try {
      const allTournaments = await db.select().from(tournaments);
      const allRegs = await db.select().from(registrations);
      const pendingRegs = allRegs.filter(r => r.payment_status === 'Pending Verification').length;
      const approvedRegs = allRegs.filter(r => r.payment_status === 'Verified').length;
      const totalOperators = (await db.select().from(users).where(eq(users.role, 'operator'))).length;

      res.json({
        totalTournaments: allTournaments.length,
        pendingRegs,
        approvedRegs,
        totalOperators,
        totalRegistrations: allRegs.length,
        tournaments: allTournaments
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
  });

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();


