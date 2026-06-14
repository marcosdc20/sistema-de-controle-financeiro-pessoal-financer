import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';

// 1. Configura as tuas credenciais do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBWVPpUxhruYmuH4Vsi-22ppJ603x7iU48", // Substituir se necessário
  authDomain: "controle-financeiro-pess-45a60.firebaseapp.com",
  projectId: "controle-financeiro-pess-45a60",
  storageBucket: "controle-financeiro-pess-45a60.firebasestorage.app",
  messagingSenderId: "633034170054",
  appId: "1:633034170054:web:30b321ed12f236b69801c7"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Este script é um modelo para atualizar as chaves estrangeiras.
// O fluxo é: Ler a tua base antiga (Firestore ou SQLite), mapear com os novos UIDs do Firebase Auth e atualizar.
async function migrateUsers() {
  console.log("A iniciar migração de utilizadores (Mapeamento Auth -> DB)...");
  
  // Exemplo: se os teus dados antigos estavam numa coleção 'users' onde a chave era o email
  // E agora o Firebase Auth usa um UID único.
  
  const usersCol = collection(db, 'users');
  const snapshot = await getDocs(usersCol);
  console.log(`Encontrados ${snapshot.size} utilizadores para migrar na DB.`);
  
  let migratedCount = 0;

  for (const userDoc of snapshot.docs) {
    const data = userDoc.data();
    
    // Suponha que tu criaste um mapeamento manual ou usas a Firebase Admin SDK
    // para buscar o UID correspondente ao email do utilizador.
    // Como a Firebase Client SDK não permite listar todos os utilizadores do Auth por email diretamente,
    // este é o local onde farás a lógica de junção:
    
    const emailAntigo = data.email;
    const novoUidGeradoPeloFirebaseAuth = "COLOCAR_UID_AQUI"; // <-- Obter isto via Admin SDK ou mapeamento
    
    // Se o UID novo for diferente do ID do documento ou do campo armazenado:
    if (emailAntigo && novoUidGeradoPeloFirebaseAuth) {
      /*
      // Exemplo de atualização se os dados estiverem guardados num documento com o ID antigo:
      // Deves copiar os dados para o novo documento com o ID = UID do Auth
      const novoRef = doc(db, 'users', novoUidGeradoPeloFirebaseAuth);
      await setDoc(novoRef, { ...data, uid: novoUidGeradoPeloFirebaseAuth });
      
      // E atualizar referências noutras coleções (ex: transações)
      const txSnapshot = await getDocs(query(collection(db, 'transactions'), where('userId', '==', userDoc.id)));
      for (const tx of txSnapshot.docs) {
        await updateDoc(doc(db, 'transactions', tx.id), { userId: novoUidGeradoPeloFirebaseAuth });
      }
      */
      migratedCount++;
    }
  }
  
  console.log(`Migração simulada concluída! ${migratedCount} utilizadores processados.`);
  console.log(`NOTA: Para uma migração real que consulte os e-mails no Auth, deves usar a Firebase Admin SDK em Node.js (Servidor).`);
  process.exit(0);
}

migrateUsers().catch(err => {
  console.error("Erro durante a migração:", err);
  process.exit(1);
});
