import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  Firestore,
  connectFirestoreEmulator,
} from 'firebase/firestore';

// ─── Configuração lida das variáveis de ambiente Vite ────────────────────────
// Todas devem estar definidas em .env.local antes de usar o sistema de licenças
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY as string,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID as string,
};

// ─── Inicialização singleton — evita re-inicialização em hot-reload ──────────
let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// ─── Instância do Firestore com Suporte Offline ─────────────────────────────────
const db: Firestore = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
});

// ─── Emulador local (apenas em desenvolvimento) ──────────────────────────────
// Para usar o emulador local do Firestore durante desenvolvimento:
// 1. Instale Firebase CLI: npm install -g firebase-tools
// 2. Execute: firebase emulators:start --only firestore
// 3. Defina VITE_USE_FIREBASE_EMULATOR=true no .env.local
if (
  import.meta.env.DEV &&
  import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true'
) {
  try {
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
    console.info('[VukaPay Firebase] Conectado ao emulador Firestore local (porta 8080)');
  } catch {
    // Ignora se já foi conectado (hot-reload em desenvolvimento)
  }
}

export { app, db };
