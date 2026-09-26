const admin = require('firebase-admin');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../../.env') });

try {
  // If no specific credentials are provided, firebase-admin will look for GOOGLE_APPLICATION_CREDENTIALS
  // Or it can verify tokens statelessly if initialized with just a projectId.
  const projectId = process.env.FIREBASE_PROJECT_ID || 'campuscoin-demo';
  
  const apps = admin.getApps ? admin.getApps() : (admin.apps || []);
  if (!apps.length) {
    admin.initializeApp({
      projectId: projectId,
    });
  }
  
  // Attach lazy auth helper so admin.auth() works seamlessly across modular and legacy invocations
  // and prevents Jest CJS runner from failing on transitive ESM imports at module load time
  let cachedAuth = null;
  admin.auth = () => {
    if (!cachedAuth) {
      try {
        const { getAuth } = require('firebase-admin/auth');
        cachedAuth = getAuth();
      } catch (err) {
        console.warn('[FIREBASE ADMIN] Note: firebase-admin/auth runtime load:', err.message);
        return {
          verifyIdToken: async () => {
            throw new Error('firebase-admin/auth unavailable in this runtime environment');
          }
        };
      }
    }
    return cachedAuth;
  };

  console.log('[FIREBASE] Admin SDK initialized for project:', projectId);
} catch (error) {
  console.error('[FIREBASE] Admin initialization error:', error.message);
}

module.exports = admin;

