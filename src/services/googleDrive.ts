/**
 * Servidor de integração cliente-serviço para API do Google Drive v3
 */

const BACKUP_FILENAME = 'vukapay_backup.json';

function getAccessToken(): string | null {
  return localStorage.getItem('google_access_token');
}

/**
 * Procura pelo arquivo de backup no Google Drive do usuário.
 * Retorna o ID do arquivo ou null se não for encontrado.
 */
export async function findBackupFile(token: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='${BACKUP_FILENAME}' and trashed=false&fields=files(id,name)`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        // Token expirado
        localStorage.removeItem('google_access_token');
      }
      throw new Error(`Erro na busca do Drive: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.files && data.files.length > 0) {
      return data.files[0].id;
    }
    return null;
  } catch (error) {
    console.error('Falha ao buscar arquivo de backup no Google Drive:', error);
    return null;
  }
}

/**
 * Cria ou atualiza o arquivo de backup no Google Drive com os dados fornecidos.
 */
export async function uploadBackupToDrive(jsonStr: string): Promise<boolean> {
  const token = getAccessToken();
  if (!token) {
    console.error('Não autenticado com o Google para realizar o backup.');
    return false;
  }

  try {
    let fileId = await findBackupFile(token);

    // Se o arquivo não existir, cria um novo arquivo vazio com os metadados corretos
    if (!fileId) {
      console.log('Criando novo arquivo de backup no Google Drive...');
      const createResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: BACKUP_FILENAME,
          mimeType: 'application/json',
        }),
      });

      if (!createResponse.ok) {
        throw new Error(`Erro ao criar arquivo no Drive: ${createResponse.statusText}`);
      }

      const fileData = await createResponse.json();
      fileId = fileData.id;
    }

    // Faz o upload dos dados (conteúdo do arquivo) para o ID correspondente
    console.log(`Fazendo upload dos dados do backup para o arquivo ID: ${fileId}...`);
    const uploadResponse = await fetch(
      `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: jsonStr,
      }
    );

    if (!uploadResponse.ok) {
      if (uploadResponse.status === 401) {
        localStorage.removeItem('google_access_token');
      }
      throw new Error(`Erro ao enviar dados para o Drive: ${uploadResponse.statusText}`);
    }

    console.log('Backup carregado com sucesso no Google Drive.');
    return true;
  } catch (error) {
    console.error('Erro ao fazer upload do backup:', error);
    return false;
  }
}

/**
 * Carrega e retorna o conteúdo do backup salvo no Google Drive.
 * Retorna null se não houver backup.
 */
export async function downloadBackupFromDrive(): Promise<string | null> {
  const token = getAccessToken();
  if (!token) {
    console.error('Não autenticado com o Google.');
    return null;
  }

  try {
    const fileId = await findBackupFile(token);
    if (!fileId) {
      console.log('Nenhum arquivo de backup encontrado no Google Drive.');
      return null;
    }

    console.log(`Baixando conteúdo do backup do arquivo ID: ${fileId}...`);
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('google_access_token');
      }
      throw new Error(`Erro ao baixar arquivo do Drive: ${response.statusText}`);
    }

    const jsonText = await response.text();
    return jsonText;
  } catch (error) {
    console.error('Erro ao carregar o backup do Google Drive:', error);
    return null;
  }
}
