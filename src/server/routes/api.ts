import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getPool, setupDatabase } from '../db.js';
import { checkBeemBalance } from '../services/beem.js';
import multer from 'multer';
import { parse } from 'csv-parse/sync';
import xlsx from 'xlsx';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key';

// Middleware for auth
const authenticate = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

router.get('/check-setup', async (req, res) => {
  try {
    await setupDatabase();
    const db = getPool();
    const [rows] = await db.query('SELECT 1 FROM users LIMIT 1');
    res.json({ isSetup: (rows as any[]).length > 0 });
  } catch (err) {
    // If connection fails or table doesn't exist
    res.json({ isSetup: false });
  }
});

router.post('/setup', async (req, res) => {
  const { systemName, timezone, username, password, bongoKey, bongoSecret, senderId, logoBase64, sendUrl, balanceUrl } = req.body;
  try {
    await setupDatabase();
    const db = getPool();
    
    // Check if already setup
    const [existing] = await db.query('SELECT 1 FROM users LIMIT 1');
    if ((existing as any[]).length > 0) return res.status(400).json({ error: 'Already setup' });

    const hash = await bcrypt.hash(password, 10);
    await db.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hash]);

    const settings = [
      ['SYSTEM_NAME', systemName],
      ['TIMEZONE', timezone],
      ['BONGO_LIVE_KEY', bongoKey],
      ['BONGO_LIVE_SECRET', bongoSecret],
      ['BONGO_SENDER_ID', senderId],
      ['LOGO', logoBase64 || ''],
      ['BEEM_SMS_SEND_URL', sendUrl || 'https://apisms.beem.africa/v1/send'],
      ['BEEM_SMS_BALANCE_URL', balanceUrl || 'https://apisms.beem.africa/public/v1/vendors/balance'],
    ];

    for (const [key, value] of settings) {
      await db.query('INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?', [key, value, value]);
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const db = getPool();
    const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
    const users = rows as any[];
    if (users.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

    const user = users[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, username: user.username });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/dashboard', authenticate, async (req, res) => {
  try {
    const db = getPool();
    let balance = 0;
    try {
      balance = await checkBeemBalance();
    } catch (e) {}

    const [msgCount] = await db.query('SELECT status, COUNT(*) as count FROM messages GROUP BY status');
    const [campaignCount] = await db.query('SELECT COUNT(*) as count FROM campaigns');
    
    // Fallback to basic counts 
    const stats: any = { queued: 0, sent: 0, pending: 0, failed: 0, delivered: 0, undelivered: 0 };
    for (const row of msgCount as any[]) {
      stats[row.status.toLowerCase()] = row.count;
    }
    stats.campaigns = (campaignCount as any[])[0].count;
    stats.balance = balance;

    res.json(stats);
  } catch(err:any) {
    res.status(500).json({ error: err.message });
  }
});

const calculateCost = (msg: string) => Math.ceil(msg.length / 160);

router.post('/sms/single', authenticate, async (req, res) => {
   const { destAddr, message } = req.body;
   if (!destAddr || !message) return res.status(400).json({ error: 'Missing destAddr or message' });
   try {
     const db = getPool();
     const cost = calculateCost(message);
     await db.query('INSERT INTO messages (dest_addr, message, cost, status) VALUES (?, ?, ?, ?)', [destAddr, message, cost, 'QUEUED']);
     res.json({ success: true, message: 'Message queued successfully' });
   } catch(e:any) {
     res.status(500).json({ error: e.message });
   }
});

router.post('/sms/bulk', authenticate, upload.single('file'), async (req, res) => {
   const file = req.file;
   const { campaignName, messageTemplate } = req.body; // Either use template or file's message column
   if (!file) return res.status(400).json({ error: 'No file uploaded' });

   try {
      const db = getPool();
      let records: any[] = [];

      if (file.originalname.endsWith('.csv')) {
         records = parse(file.buffer, { columns: true, skip_empty_lines: true });
      } else if (file.originalname.endsWith('.xlsx')) {
         const workbook = xlsx.read(file.buffer, { type: 'buffer' });
         const sheetName = workbook.SheetNames[0];
         records = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
      } else {
         return res.status(400).json({ error: 'Unsupported file type. Use .csv or .xlsx' });
      }

      await db.query('INSERT INTO campaigns (name, total_messages) VALUES (?, ?)', [campaignName || 'Bulk Campaign', records.length]);
      const [campaignRes] = await db.query('SELECT LAST_INSERT_ID() as id');
      const campaignId = (campaignRes as any[])[0].id;

      for (const row of records) {
         // Try to find phone and message columns dynamically
         const phone = row.phone || row.Phone || row.dest_addr || row.contact;
         const msg = messageTemplate || row.message || row.Message || row.text;
         if (phone && msg) {
            const cost = calculateCost(msg);
            await db.query('INSERT INTO messages (campaign_id, dest_addr, message, cost, status) VALUES (?, ?, ?, ?, ?)', [campaignId, String(phone), String(msg), cost, 'QUEUED']);
         }
      }

      res.json({ success: true, message: `Campaign created and messages queued` });
   } catch(e:any) {
      res.status(500).json({ error: e.message });
   }
});

router.get('/messages', authenticate, async (req, res) => {
    try {
        const db = getPool();
        const [rows] = await db.query('SELECT * FROM messages ORDER BY id DESC LIMIT 100');
        res.json(rows);
    } catch(e:any) {
        res.status(500).json({error: e.message});
    }
});

router.get('/campaigns', authenticate, async (req, res) => {
    try {
        const db = getPool();
        const [rows] = await db.query('SELECT * FROM campaigns ORDER BY id DESC');
        res.json(rows);
    } catch(e:any) {
        res.status(500).json({error: e.message});
    }
});

export default router;
