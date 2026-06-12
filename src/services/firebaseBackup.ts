import { storage, auth } from '@/lib/firebase';
import { ref, uploadString, getDownloadURL, StringFormat } from 'firebase/storage';

const BACKUP_FILENAME = 'vukapay_backup.json';

/**
 * Cria ou atualiza o arquivo de backup no Firebase Storage associado ao usuário.
 */
export async function uploadBackupToCloud(jsonStr: string): Promise<boolean> {
  const user = auth.currentUser;
  if (!user) {
    console.error('Não autenticado com o Firebase para realizar o backup.');
    return false;
  }

  try {
    const backupRef = ref(storage, `backups/${user.uid}/${BACKUP_FILENAME}`);
    
    console.log(`Fazendo upload dos dados do backup para a Cloud...`);
    await uploadString(backupRef, jsonStr, StringFormat.RAW, {
      contentType: 'application/json'
    });

    console.log('Backup carregado com sucesso na Nuvem.');
    return true;
  } catch (error) {
    console.error('Erro ao fazer upload do backup na nuvem:', error);
    return false;
  }
}

/**
 * Carrega e retorna o conteúdo do backup salvo no Firebase Storage.
 * Retorna null se não houver backup.
 */
export async function downloadBackupFromCloud(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) {
    console.error('Não autenticado com o Firebase.');
    return null;
  }

  try {
    const backupRef = ref(storage, `backups/${user.uid}/${BACKUP_FILENAME}`);
    
    console.log(`Baixando conteúdo do backup da Cloud...`);
    const url = await getDownloadURL(backupRef);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Erro ao baixar arquivo da nuvem: ${response.statusText}`);
    }

    const jsonText = await response.text();
    return jsonText;
  } catch (error: any) {
    if (error.code === 'storage/object-not-found') {
      console.log('Nenhum arquivo de backup encontrado na Cloud.');
      return null;
    }
    console.error('Erro ao carregar o backup da Nuvem:', error);
    return null;
  }
}
