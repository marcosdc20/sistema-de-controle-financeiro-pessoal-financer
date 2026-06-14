import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBWVPpUxhruYmuH4Vsi-22ppJ603x7iU48",
  authDomain: "controle-financeiro-pess-45a60.firebaseapp.com",
  projectId: "controle-financeiro-pess-45a60",
  storageBucket: "controle-financeiro-pess-45a60.firebasestorage.app",
  messagingSenderId: "633034170054",
  appId: "1:633034170054:web:30b321ed12f236b69801c7"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migrate() {
  console.log("A iniciar migração da coleção community_posts...");
  const postsCol = collection(db, 'community_posts');
  const snapshot = await getDocs(postsCol);
  
  console.log(`Encontrados ${snapshot.size} posts para processar.`);
  
  let migratedCount = 0;
  
  for (const postDoc of snapshot.docs) {
    const data = postDoc.data();
    const updates = {};
    
    // 1. Alinhar datas
    const finalDate = data.createdAt || data.created_at || Date.now();
    if (data.createdAt !== finalDate) updates.createdAt = finalDate;
    if (data.created_at !== finalDate) updates.created_at = finalDate;
    
    // 2. Alinhar autores
    const finalAuthor = data.authorName || data.author || 'VukaPay Suporte';
    if (data.authorName !== finalAuthor) updates.authorName = finalAuthor;
    if (data.author !== finalAuthor) updates.author = finalAuthor;
    if (!data.authorId) updates.authorId = 'vukapay-admin';
    if (!data.authorAvatar) {
      updates.authorAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(finalAuthor)}&background=059669&color=fff`;
    }
    
    // 3. Alinhar likes
    let finalLikesArray = [];
    if (Array.isArray(data.likes)) {
      finalLikesArray = data.likes;
    } else if (Array.isArray(data.likedBy)) {
      finalLikesArray = data.likedBy;
    }
    
    let finalLikesCount = finalLikesArray.length;
    if (typeof data.likes === 'number') {
      finalLikesCount = data.likes;
    } else if (typeof data.likesCount === 'number') {
      finalLikesCount = data.likesCount;
    }
    
    if (JSON.stringify(data.likes) !== JSON.stringify(finalLikesArray)) {
      updates.likes = finalLikesArray;
    }
    if (JSON.stringify(data.likedBy) !== JSON.stringify(finalLikesArray)) {
      updates.likedBy = finalLikesArray;
    }
    if (data.likesCount !== finalLikesCount) {
      updates.likesCount = finalLikesCount;
    }
    
    // 4. Comentários
    if (typeof data.commentsCount !== 'number') {
      updates.commentsCount = 0;
    }
    
    if (Object.keys(updates).length > 0) {
      console.log(`A atualizar post "${data.title || postDoc.id}":`, updates);
      await updateDoc(doc(db, 'community_posts', postDoc.id), updates);
      migratedCount++;
    }
  }
  
  console.log(`Migração concluída com sucesso! ${migratedCount} posts atualizados.`);
  process.exit(0);
}

migrate().catch(err => {
  console.error("Erro durante a migração:", err);
  process.exit(1);
});
