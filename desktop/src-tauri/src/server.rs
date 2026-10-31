use crate::db;
use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        State,
    },
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
use tokio::sync::broadcast;

#[derive(Deserialize, Debug)]
struct ClientCommand {
    action: String,
    #[allow(dead_code)]
    payload: Option<String>,
}

pub async fn start_server(tx: broadcast::Sender<String>) {
    let app = Router::new()
        .route("/ws", get(ws_handler))
        .with_state(tx);
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

async fn ws_handler(
    ws: WebSocketUpgrade,
    State(tx): State<broadcast::Sender<String>>,
) -> impl IntoResponse {
    let rx = tx.subscribe();
    ws.on_upgrade(move |socket| handle_socket(socket, rx))
}

async fn handle_socket(mut socket: WebSocket, mut rx: broadcast::Receiver<String>) {
    println!("[Server] Cliente conectado via WebSocket!");

    loop {
        tokio::select! {
            msg_option = socket.recv() => {
                match msg_option {
                    Some(Ok(Message::Text(text))) => {
                        println!("Comando recebido: {}", text);

                        let action_name = if let Ok(cmd) = serde_json::from_str::<ClientCommand>(&text) {
                            cmd.action
                        } else {
                            text.trim().to_string()
                        };

                        if action_name == "get_layout" {
                            match db::get_all_buttons() {
                                Ok(buttons) => {
                                    let response = serde_json::json!({
                                        "status": "ok",
                                        "action": "sync_layout",
                                        "payload": buttons,
                                        "message": "Layout sincronizado com sucesso"
                                    })
                                    .to_string();

                                    if let Err(err) = socket.send(Message::Text(response.into())).await {
                                        eprintln!("[Server] Erro ao enviar sync_layout: {:?}", err);
                                        break;
                                    }
                                }
                                Err(err) => {
                                    eprintln!("[DB] Erro ao buscar botões: {:?}", err);
                                }
                            }
                            continue;
                        }

                        execute_macro(&action_name);

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
                    Some(Ok(Message::Close(_))) | None => {
                        println!("[Server] Conexão encerrada pelo cliente.");
                        break;
                    }
                    Some(Ok(_)) => {}
                    Some(Err(err)) => {
                        eprintln!("[Server] Erro no recebimento do socket: {:?}", err);
                        break;
                    }
                }
            }
            broadcast_res = rx.recv() => {
                match broadcast_res {
                    Ok(msg) => {
                        if let Err(err) = socket.send(Message::Text(msg.into())).await {
                            eprintln!("[Server] Erro ao enviar broadcast para o cliente: {:?}", err);
                            break;
                        }
                    }
                    Err(broadcast::error::RecvError::Lagged(skipped)) => {
                        eprintln!("[Server] Receptor de broadcast atrasado (pulou {} mensagens)", skipped);
                    }
                    Err(broadcast::error::RecvError::Closed) => {
                        break;
                    }
                }
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
