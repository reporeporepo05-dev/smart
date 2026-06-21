import axios from 'axios';
import cron from 'node-cron';
import https from 'https';
import { getPool } from '../db.js';

export const getSetting = async (key: string): Promise<string | null> => {
  const db = getPool();
  try {
    const [rows] = await db.query('SELECT setting_value FROM settings WHERE setting_key = ?', [key]);
    const settings = rows as any[];
    if (settings.length > 0) return settings[0].setting_value;
    return null;
  } catch (err) {
    return null; // DB might not be setup yet
  }
};

export const checkBeemBalance = async (): Promise<number> => {
  const apiKey = await getSetting('BONGO_LIVE_KEY');
  const secretKey = await getSetting('BONGO_LIVE_SECRET');
  const balanceUrl = await getSetting('BEEM_SMS_BALANCE_URL') || 'https://apisms.beem.africa/public/v1/vendors/balance';

  if (!apiKey || !secretKey) throw new Error('API Keys not configured');

  const auth = Buffer.from(`${apiKey}:${secretKey}`).toString('base64');

  const response = await axios.get(balanceUrl, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${auth}`,
    },
    httpsAgent: new https.Agent({ rejectUnauthorized: false }),
  });

  if (response.data?.data?.credit_balance !== undefined) {
    return response.data.data.credit_balance;
  }
  
  throw new Error('Could not fetch balance');
};

const sendSmsBatch = async (messages: any[]) => {
  if (messages.length === 0) return;
  const apiKey = await getSetting('BONGO_LIVE_KEY');
  const secretKey = await getSetting('BONGO_LIVE_SECRET');
  const sendUrl = await getSetting('BEEM_SMS_SEND_URL') || 'https://apisms.beem.africa/v1/send';
  const sourceAddr = await getSetting('BONGO_SENDER_ID') || 'INFO';

  if (!apiKey || !secretKey) return;

  const auth = Buffer.from(`${apiKey}:${secretKey}`).toString('base64');
  const db = getPool();

  // Group messages by their text content primarily to batch correctly for Beem API
  // Simplification for this app: send one by one to properly track request_id and cost per message
  for (const msg of messages) {
    try {
      const response = await axios.post(
        sendUrl,
        {
          source_addr: sourceAddr,
          schedule_time: "",
          encoding: 0,
          message: msg.message,
          recipients: [
            {
              recipient_id: msg.id,
              dest_addr: msg.dest_addr.replace('+', ''),
            }
          ]
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${auth}`,
          },
          httpsAgent: new https.Agent({ rejectUnauthorized: false }),
        }
      );

      const request_id = response.data?.request_id;
      if (response.data?.successful || response.data?.code === 100) {
        await db.query('UPDATE messages SET status = ?, request_id = ? WHERE id = ?', ['PENDING', request_id, msg.id]);
      } else {
        await db.query('UPDATE messages SET status = ? WHERE id = ?', ['FAILED', msg.id]);
      }
    } catch (err) {
      console.error('Failed to send message:', msg.id);
      await db.query('UPDATE messages SET status = ? WHERE id = ?', ['FAILED', msg.id]);
    }
  }
};

// Queue cron: every minute
cron.schedule('* * * * *', async () => {
    try {
      const db = getPool();
      // Check if DB is set up (catch error if not)
      await db.query('SELECT 1 FROM settings LIMIT 1');
    } catch {
      return; // Stop execution if DB is not setup
    }

    try {
      const balance = await checkBeemBalance();
      if (balance > 0) {
        const db = getPool();
        // Fetch queued messages up to balance
        const [rows] = await db.query(`SELECT * FROM messages WHERE status = 'QUEUED' ORDER BY id ASC LIMIT ?`, [Math.floor(balance)]);
        const queuedMessages = rows as any[];
        
        if (queuedMessages.length > 0) {
          await sendSmsBatch(queuedMessages);
        }
      }
    } catch (err) {
       console.log('Cron queue error (maybe not setup yet or 0 balance)');
    }
});

// Delivery Reports cron: every 5 minutes
cron.schedule('*/5 * * * *', async () => {
   try {
      const db = getPool();
      await db.query('SELECT 1 FROM settings LIMIT 1');
    } catch {
      return; 
    }

    try {
      const db = getPool();
      const [rows] = await db.query(`SELECT id, dest_addr, request_id FROM messages WHERE status = 'PENDING' AND request_id IS NOT NULL`);
      const pendingMessages = rows as any[];
      
      if (pendingMessages.length === 0) return;

      const apiKey = await getSetting('BONGO_LIVE_KEY');
      const secretKey = await getSetting('BONGO_LIVE_SECRET');
      if (!apiKey || !secretKey) return;
      
      const auth = Buffer.from(`${apiKey}:${secretKey}`).toString('base64');
      
      for (const msg of pendingMessages) {
         try {
            const url = `https://dlrapi.beem.africa/public/v1/delivery-reports?dest_addr=${msg.dest_addr}&request_id=${msg.request_id}`;
            const response = await axios.get(url, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Basic ${auth}`,
                },
                httpsAgent: new https.Agent({ rejectUnauthorized: false }),
            });
            const dlrs = response.data;
            if (Array.isArray(dlrs) && dlrs.length > 0) {
               const status = dlrs[0].status; // PENDING, DELIVERED, UNDELIVERED
               if (status === 'DELIVERED' || status === 'UNDELIVERED') {
                   await db.query('UPDATE messages SET status = ? WHERE id = ?', [status, msg.id]);
               }
            }
         } catch(e) {
            console.log('Error fetching DLR for msg', msg.id);
         }
      }
    } catch(err) {
       console.log('Cron DLR error');
    }
});
