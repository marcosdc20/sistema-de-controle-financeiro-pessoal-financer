use std::io::{Read, Write};
use std::net::TcpListener;
use std::sync::atomic::{AtomicBool, Ordering};
use tauri::Emitter;

// Flag estática para cancelar instâncias anteriores do servidor de autenticação
static CANCEL_PREVIOUS: AtomicBool = AtomicBool::new(false);

// Função auxiliar para urlencode simples sem dependências externas
fn urlencode(s: &str) -> String {
    let mut encoded = String::new();
    for b in s.bytes() {
        match b {
            b'a'..=b'z' | b'A'..=b'Z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'~' => {
                encoded.push(b as char);
            }
            b' ' => {
                encoded.push('+');
            }
            _ => {
                encoded.push_str(&format!("%{:02X}", b));
            }
        }
    }
    encoded
}

// Função auxiliar para abrir URL no navegador padrão do sistema sem dependências externas
fn open_in_browser(url: &str) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("rundll32")
            .args(["url.dll,FileProtocolHandler", url])
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(url)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(url)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
async fn start_google_auth(
    app_handle: tauri::AppHandle,
    client_id: String,
    scope: String,
    state: String,
) -> Result<(), String> {
    let port = 1420;

    // 1. Sinaliza para qualquer servidor de login anterior encerrar imediatamente
    CANCEL_PREVIOUS.store(true, Ordering::SeqCst);

    // Pequena pausa para garantir que a thread anterior libere a porta TCP
    std::thread::sleep(std::time::Duration::from_millis(200));

    // Reseta o sinal de cancelamento para a nossa nova execução
    CANCEL_PREVIOUS.store(false, Ordering::SeqCst);

    // 2. Tenta iniciar o servidor local na porta 1420
    let listener = match TcpListener::bind(format!("127.0.0.1:{}", port)) {
        Ok(l) => l,
        Err(e) => {
            return Err(format!("Não foi possível iniciar o servidor local na porta {}: {}. Verifique se outra instância do app está aberta.", port, e));
        }
    };

    // 3. Constrói a URL do Google Auth
    let redirect_uri = format!("http://localhost:{}", port);
    let response_type = "token";
    let google_auth_url = format!(
        "https://accounts.google.com/o/oauth2/v2/auth?client_id={}&redirect_uri={}&response_type={}&scope={}&state={}&include_granted_scopes=true",
        client_id,
        urlencode(&redirect_uri),
        response_type,
        urlencode(&scope),
        state
    );

    // 4. Abre a URL no navegador padrão do sistema
    open_in_browser(&google_auth_url)?;

    // 5. Escuta o retorno em uma thread em segundo plano com timeout de 5 minutos
    let handle = app_handle.clone();
    std::thread::spawn(move || {
        // Configura o listener como não-bloqueante para podermos verificar o cancelamento e timeout periodicamente
        listener.set_nonblocking(true).ok();
        let mut got_token = false;
        let start_time = std::time::Instant::now();
        let timeout = std::time::Duration::from_secs(300); // 5 minutos

        while start_time.elapsed() < timeout
            && !got_token
            && !CANCEL_PREVIOUS.load(Ordering::SeqCst)
        {
            match listener.accept() {
                Ok((mut stream, _)) => {
                    // Timeout rápido de leitura na stream para não trancar a thread caso a requisição pare no meio
                    stream
                        .set_read_timeout(Some(std::time::Duration::from_secs(5)))
                        .ok();

                    let mut buffer = [0; 4096];
                    let n = match stream.read(&mut buffer) {
                        Ok(n) => n,
                        Err(_) => continue,
                    };

                    let request = String::from_utf8_lossy(&buffer[..n]);

                    if request.contains("GET / ") || request.contains("GET /?") {
                        // Retorna a página HTML com JS que extrai a hash e envia para /callback_data
                        let html = r#"<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Autenticação VukaPay</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #030712;
            color: #f3f4f6;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
        }
        .card {
            background: rgba(17, 24, 39, 0.7);
            border: 1px solid rgba(79, 70, 229, 0.3);
            padding: 2.5rem;
            border-radius: 1.5rem;
            text-align: center;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
            max-width: 400px;
        }
        h1 { color: #818cf8; margin-top: 0; font-size: 1.75rem; }
        p { color: #9ca3af; font-size: 1rem; line-height: 1.5; }
        .spinner {
            border: 3px solid rgba(255,255,255,0.1);
            width: 36px;
            height: 36px;
            border-radius: 50%;
            border-left-color: #818cf8;
            animation: spin 1s linear infinite;
            margin: 20px auto;
        }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    </style>
</head>
<body>
    <div class="card">
        <h1 id="title">Conectando ao VukaPay...</h1>
        <div id="status-icon" class="spinner"></div>
        <p id="msg">Processando credenciais. Esta janela será fechada automaticamente.</p>
    </div>
    <script>
        let hash = window.location.hash || window.location.search;
        if (hash) {
            // Se começar com #, transforma em ? para que os parâmetros sejam enviados ao servidor no GET
            if (hash.startsWith('#')) {
                hash = '?' + hash.substring(1);
            }
            // Repassa o token para o endpoint local /callback_data
            fetch('/callback_data' + hash)
                .then(r => r.text())
                .then(txt => {
                    document.getElementById('title').innerText = 'Autenticado!';
                    document.getElementById('status-icon').style.display = 'none';
                    document.getElementById('msg').innerText = 'Sucesso! Você já pode fechar esta aba e voltar para o aplicativo VukaPay.';
                    setTimeout(() => window.close(), 2000);
                })
                .catch(err => {
                    document.getElementById('title').innerText = 'Erro de Conexão';
                    document.getElementById('status-icon').style.display = 'none';
                    document.getElementById('msg').innerText = 'Falha ao transmitir credenciais para o app. Tente novamente.';
                });
        } else {
            document.getElementById('title').innerText = 'Erro';
            document.getElementById('status-icon').style.display = 'none';
            document.getElementById('msg').innerText = 'Nenhuma credencial recebida do Google.';
        }
    </script>
</body>
</html>"#;

                        let response = format!(
                            "HTTP/1.1 200 OK\r\nContent-Type: text/html; charset=utf-8\r\nContent-Length: {}\r\n\r\n{}",
                            html.len(),
                            html
                        );
                        let _ = stream.write_all(response.as_bytes());
                        let _ = stream.flush();
                    } else if request.contains("GET /callback_data") {
                        // Pega os parâmetros passados pelo fetch
                        let first_line = request.lines().next().unwrap_or("");
                        let parts: Vec<&str> = first_line.split_whitespace().collect();
                        if parts.len() >= 2 {
                            let path_and_query = parts[1];
                            // Emite o evento oauth-callback para o frontend
                            let _ = handle.emit("oauth-callback", path_and_query.to_string());
                        }

                        let response = "HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: 2\r\n\r\nOK";
                        let _ = stream.write_all(response.as_bytes());
                        let _ = stream.flush();

                        // Garante que o navegador receba o status 200 OK antes de fecharmos o socket
                        std::thread::sleep(std::time::Duration::from_millis(500));
                        got_token = true;
                    }
                }
                Err(ref e) if e.kind() == std::io::ErrorKind::WouldBlock => {
                    // Sem conexões pendentes, espera um pouco para evitar consumo de 100% de CPU
                    std::thread::sleep(std::time::Duration::from_millis(200));
                }
                Err(_) => {
                    // Erro de socket, espera um pouco antes de tentar novamente
                    std::thread::sleep(std::time::Duration::from_millis(200));
                }
            }
        }
    });

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .invoke_handler(tauri::generate_handler![start_google_auth])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
