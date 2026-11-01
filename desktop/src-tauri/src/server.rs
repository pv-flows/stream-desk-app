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
    Direction::{Click, Press, Release},
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
                                    let theme = db::get_active_theme()
                                        .unwrap_or_else(|_| "default".to_string());
                                    let response = serde_json::json!({
                                        "status": "ok",
                                        "action": "sync_layout",
                                        "payload": {
                                            "theme": theme,
                                            "buttons": buttons
                                        },
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

fn parse_key(key_str: &str) -> Option<Key> {
    let lower = key_str.trim().to_lowercase();
    match lower.as_str() {
        "ctrl" | "control" => Some(Key::Control),
        "alt" => Some(Key::Alt),
        "shift" => Some(Key::Shift),
        "win" | "cmd" | "meta" | "super" => Some(Key::Meta),
        "enter" | "return" => Some(Key::Return),
        "esc" | "escape" => Some(Key::Escape),
        "tab" => Some(Key::Tab),
        "space" => Some(Key::Space),
        "backspace" => Some(Key::Backspace),
        "up" => Some(Key::UpArrow),
        "down" => Some(Key::DownArrow),
        "left" => Some(Key::LeftArrow),
        "right" => Some(Key::RightArrow),
        "f1" => Some(Key::F1),
        "f2" => Some(Key::F2),
        "f3" => Some(Key::F3),
        "f4" => Some(Key::F4),
        "f5" => Some(Key::F5),
        "f6" => Some(Key::F6),
        "f7" => Some(Key::F7),
        "f8" => Some(Key::F8),
        "f9" => Some(Key::F9),
        "f10" => Some(Key::F10),
        "f11" => Some(Key::F11),
        "f12" => Some(Key::F12),
        _ => {
            let mut chars = key_str.trim().chars();
            if let (Some(c), None) = (chars.next(), chars.next()) {
                Some(Key::Unicode(c))
            } else {
                None
            }
        }
    }
}

fn execute_macro(action: &str) {
    if let Some(hotkey_str) = action.strip_prefix("hotkey:") {
        println!("[Macro] Executando Hotkey: {}", hotkey_str);
        let tokens: Vec<&str> = hotkey_str.split('+').map(|s| s.trim()).filter(|s| !s.is_empty()).collect();
        if tokens.is_empty() {
            return;
        }

        if let Ok(mut enigo) = Enigo::new(&Settings::default()) {
            let mut modifiers = Vec::new();
            let mut final_key = None;

            for (i, token) in tokens.iter().enumerate() {
                if i < tokens.len() - 1 {
                    if let Some(k) = parse_key(token) {
                        modifiers.push(k);
                    }
                } else {
                    final_key = parse_key(token);
                }
            }

            // Pressiona modificadores
            for m in &modifiers {
                let _ = enigo.key(*m, Press);
            }

            // Clica na tecla final
            if let Some(k) = final_key {
                let _ = enigo.key(k, Click);
            }

            // Solta os modificadores na ordem inversa
            for m in modifiers.iter().rev() {
                let _ = enigo.key(*m, Release);
            }
        }
        return;
    }

    if let Some(url) = action.strip_prefix("open_url:") {
        println!("[Macro] Abrindo URL: {}", url);
        if let Err(e) = open::that(url.trim()) {
            eprintln!("[Macro] Erro ao abrir URL '{}': {:?}", url, e);
        }
        return;
    }

    if let Some(app) = action.strip_prefix("open_app:") {
        let app_target = app.trim();
        println!("[Macro] Abrindo aplicativo/script: {}", app_target);
        if let Err(e) = open::that(app_target) {
            eprintln!("[Macro] open::that falhou, tentando Command: {:?}", e);
            let _ = std::process::Command::new(app_target).spawn();
        }
        return;
    }

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
        "mute" => {
            println!("[Macro] Executando Volume Mute");
            if let Ok(mut enigo) = Enigo::new(&Settings::default()) {
                let _ = enigo.key(Key::VolumeMute, Click);
            }
        }
        "play_pause" | "media_play" => {
            println!("[Macro] Executando Media Play/Pause");
            if let Ok(mut enigo) = Enigo::new(&Settings::default()) {
                let _ = enigo.key(Key::MediaPlayPause, Click);
            }
        }
        "media_next" => {
            println!("[Macro] Executando Media Next Track");
            if let Ok(mut enigo) = Enigo::new(&Settings::default()) {
                let _ = enigo.key(Key::MediaNextTrack, Click);
            }
        }
        "media_prev" => {
            println!("[Macro] Executando Media Previous Track");
            if let Ok(mut enigo) = Enigo::new(&Settings::default()) {
                let _ = enigo.key(Key::MediaPrevTrack, Click);
            }
        }
        "open_calc" => {
            println!("[Macro] Abrindo Calculadora");
            let _ = open::that("calc");
        }
        other => {
            println!("[Macro] Comando não mapeado: {}", other);
        }
    }
}
