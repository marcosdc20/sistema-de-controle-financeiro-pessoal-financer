import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize the Firebase Admin SDK
admin.initializeApp();
const db = admin.firestore();

// 1. Auth Trigger: Automatically create a community profile when a new user signs up
export const onUserCreated = functions.auth.user().onCreate(async (user) => {
  const userId = user.uid;
  const email = user.email || '';
  const displayName = user.displayName || email.split('@')[0] || 'Utilizador VukaPay';
  
  try {
    // Create the community profile
    await db.collection('community_users').doc(userId).set({
      name: displayName,
      xp: 100, // Starting XP
      badge: '🎯 Guardião',
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`[Success] Community profile created for user: ${userId}`);
  } catch (error) {
    console.error(`[Error] Failed to create community profile for user: ${userId}`, error);
  }
});

// 2. HTTP Webhook: Activate VukaPay License (To be called by your payment provider)
// Example request: POST /activateLicense { "email": "user@example.com", "licenseType": "Lifetime", "secret": "YOUR_SECRET_KEY" }
export const activateLicense = functions.https.onRequest(async (req, res) => {
  // Enforce POST method
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  const { email, secret, licenseType } = req.body;

  // Simple security check (Replace 'YOUR_SECRET_KEY' with a strong random string in production)
  if (secret !== 'VUKAPAY_WEBHOOK_SECRET_2026') {
    res.status(401).send('Unauthorized');
    return;
  }

  if (!email) {
    res.status(400).send('Missing email parameter');
    return;
  }

  try {
    // Find the user by email using Firebase Admin SDK
    const userRecord = await admin.auth().getUserByEmail(email);
    const userId = userRecord.uid;

    // Update their license status in Firestore
    await db.collection('users').doc(userId).set({
      has_license: true,
      licenseType: licenseType || 'Standard',
      licenseActivatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    console.log(`[Success] License activated for ${email}`);
    res.status(200).json({ success: true, message: 'License activated successfully.' });
  } catch (error: any) {
    console.error(`[Error] Failed to activate license for ${email}`, error);
    if (error.code === 'auth/user-not-found') {
      res.status(404).json({ success: false, message: 'User not found in Firebase Auth.' });
    } else {
      res.status(500).json({ success: false, message: 'Internal Server Error.' });
    }
  }
});

// 3. Cron Job: Daily Investment / Kixiquila Processor
// Runs every day at midnight (Luanda timezone)
export const processDailyInvestments = functions.pubsub
  .schedule('0 0 * * *')
  .timeZone('Africa/Luanda')
  .onRun(async (context) => {
    console.log('Starting daily investment processing...');
    
    // NOTE: This is a placeholder for your future financial calculations.
    // Example logic:
    // 1. Fetch all active 'investments' or 'kixiquila' documents from Firestore
    // 2. Calculate daily interest based on their rates
    // 3. Use db.batch() to update all balances in one go to save writes
    // 4. Send notifications to users about their earnings
    
    console.log('Daily investment processing completed.');
    return null;
  });
