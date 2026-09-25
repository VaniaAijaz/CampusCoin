const admin = require('firebase-admin');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../../.env') });

try {
  // If no specific credentials are provided, firebase-admin will look for GOOGLE_APPLICATION_CREDENTIALS
  // Or it can verify tokens statelessly if initialized with just a projectId.
  const projectId = process.env.FIREBASE_PROJECT_ID || 'campuscoin-demo';
  
  admin.initializeApp({
    projectId: projectId,
  });
  console.log('[FIREBASE] Admin SDK initialized for project:', projectId);
} catch (error) {
  console.error('[FIREBASE] Admin initialization error:', error.message);
}

module.exports = admin;
