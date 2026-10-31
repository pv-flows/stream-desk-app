use axum::{
    extract::ws::{Message, WebSocket, WebSocketUpgrade},
    response::IntoResponse,
    routing::get,
    Router,
};
use enigo::{
    Direction::Click,
    Enigo, Key, Keyboard as KeyboardControllable, Settings,
};
use serde::Deserialize;
use std::net::SocketAddr;

#[derive(Deserialize, Debug)]
struct ClientCommand {
    action: String,
    #[allow(dead_code)]
    payload: Option<String>,
}

pub async fn start_server() {
    let app = Router::new().route("/ws", get(ws_handler));
    let addr = SocketAddr::from(([0, 0, 0, 0], 8080));

    println!("[Server] Servidor WebSocket iniciando em http://{}", addr);

    match tokio::net::TcpListener::bind(addr).await {
        Ok(listener) => {
            if let Err(err) = axum::serve(listener, app).await {
                eprintln!("[Server] Erro na execução do servidor: {:?}", err);
            }
        }
        Err(err) => {
            eprintln!("[Server] Falha ao vincular porta 8080: {:?}", err);
        }
    }
}

async fn ws_handler(ws: WebSocketUpgrade) -> impl IntoResponse {
    ws.on_upgrade(handle_socket)
}

async fn handle_socket(mut socket: WebSocket) {
    println!("[Server] Cliente conectado via WebSocket!");

    while let Some(msg_result) = socket.recv().await {
        match msg_result {
            Ok(Message::Text(text)) => {
                println!("Comando recebido: {}", text);

                let mut action_name = text.to_string();

                if let Ok(cmd) = serde_json::from_str::<ClientCommand>(&text) {
                    action_name = cmd.action.clone();
                    execute_macro(&cmd.action);
                } else {
                    execute_macro(text.trim());
                }

                let response = serde_json::json!({
                    "status": "ok",
                    "message": format!("Comando '{}' processado pelo PC", action_name)
                })
                .to_string();

                if let Err(err) = socket.send(Message::Text(response.into())).await {
                    eprintln!("[Server] Erro ao enviar resposta: {:?}", err);
                    break;
                }
            }
            Ok(Message::Close(_)) => {
                println!("[Server] Conexão encerrada pelo cliente.");
                break;
            }
            Ok(_) => {}
            Err(err) => {
                eprintln!("[Server] Erro no recebimento do socket: {:?}", err);
                break;
            }
        }
    }
}

fn execute_macro(action: &str) {
    match action {
        "vol_up" => {
            println!("[Macro] Executando Volume Up");
            if let Ok(mut enigo) = Enigo::new(&Settings::default()) {
                let _ = enigo.key(Key::VolumeUp, Click);
            }
        }
        "vol_down" => {
            println!("[Macro] Executando Volume Down");
            if let Ok(mut enigo) = Enigo::new(&Settings::default()) {
                let _ = enigo.key(Key::VolumeDown, Click);
            }
        }
        "play_pause" => {
            println!("[Macro] Executando Play/Pause");
            if let Ok(mut enigo) = Enigo::new(&Settings::default()) {
                let _ = enigo.key(Key::MediaPlayPause, Click);
            }
        }
        "open_calc" => {
            println!("[Macro] Abrindo Calculadora");
            open::that("calc").unwrap_or_default();
        }
        other => {
            println!("[Macro] Comando não mapeado: {}", other);
        }
    }
}
