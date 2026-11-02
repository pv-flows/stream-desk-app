use crate::db;
use active_win_pos_rs::get_active_window;
use axum::{
    extract::{
        connect_info::ConnectInfo,
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
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::net::SocketAddr;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::{broadcast, RwLock};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ConnectedDevice {
    pub id: String,
    pub name: String,
    pub ip: String,
    pub connected_at: String,
}

pub struct ClientSession {
    pub device: ConnectedDevice,
    pub disconnect_tx: tokio::sync::mpsc::Sender<()>,
}

#[derive(Clone)]
pub struct ServerState {
    pub tx: broadcast::Sender<String>,
    pub clients: Arc<RwLock<HashMap<String, ClientSession>>>,
    pub counter: Arc<AtomicU64>,
}

impl ServerState {
    pub fn new(tx: broadcast::Sender<String>) -> Self {
        Self {
            tx,
            clients: Arc::new(RwLock::new(HashMap::new())),
            counter: Arc::new(AtomicU64::new(1)),
        }
    }
}

pub async fn get_connected_clients(state: &ServerState) -> Vec<ConnectedDevice> {
    let map = state.clients.read().await;
    map.values().map(|s| s.device.clone()).collect()
}

pub async fn disconnect_client(state: &ServerState, id: &str) -> bool {
    let mut map = state.clients.write().await;
    if let Some(session) = map.remove(id) {
        let _ = session.disconnect_tx.send(()).await;
        true
    } else {
        false
    }
}

#[derive(Deserialize, Debug)]
struct ClientCommand {
    action: String,
    #[allow(dead_code)]
    payload: Option<String>,
}

async fn health_handler() -> impl IntoResponse {
    let local_ip = local_ip_address::local_ip()
        .map(|ip| ip.to_string())
        .unwrap_or_else(|_| "127.0.0.1".to_string());
    (
        [
            (axum::http::header::ACCESS_CONTROL_ALLOW_ORIGIN, "*"),
            (axum::http::header::CONTENT_TYPE, "application/json"),
        ],
        serde_json::json!({
            "status": "ok",
            "app": "streamdesk",
            "name": "Stream Desk Desktop",
            "version": "1.0.0",
            "ip": local_ip,
            "ws_url": format!("ws://{}:8080/ws", local_ip)
        })
        .to_string(),
    )
}

async fn discovery_handler() -> impl IntoResponse {
    health_handler().await
}

async fn start_udp_discovery_beacon() {
    let socket = match tokio::net::UdpSocket::bind("0.0.0.0:8081").await {
        Ok(s) => {
            let _ = s.set_broadcast(true);
            s
        }
        Err(err) => {
            eprintln!("[Discovery] Falha ao vincular porta UDP 8081: {:?}", err);
            return;
        }
    };
    println!("[Discovery] Serviço Zeroconf/UDP ativo na porta 8081");

    let mut buf = [0u8; 512];
    loop {
        match socket.recv_from(&mut buf).await {
            Ok((len, peer)) => {
                let msg = String::from_utf8_lossy(&buf[..len]);
                if msg.contains("STREAMDESK_DISCOVER") {
                    let local_ip = local_ip_address::local_ip()
                        .map(|ip| ip.to_string())
                        .unwrap_or_else(|_| "127.0.0.1".to_string());
                    let reply = serde_json::json!({
                        "app": "streamdesk",
                        "name": "Stream Desk Desktop",
                        "port": 8080,
                        "ip": local_ip,
                        "ws_url": format!("ws://{}:8080/ws", local_ip)
                    })
                    .to_string();
                    let _ = socket.send_to(reply.as_bytes(), peer).await;
                }
            }
            Err(e) => {
                eprintln!("[Discovery] Erro ao receber pacote UDP: {:?}", e);
                break;
            }
        }
    }
}

pub async fn start_server(state: ServerState) {
    let monitor_tx = state.tx.clone();
    tokio::spawn(async move {
        start_window_monitor(monitor_tx).await;
    });

    tokio::spawn(async move {
        start_udp_discovery_beacon().await;
    });

    let app = Router::new()
        .route("/ws", get(ws_handler))
        .route("/health", get(health_handler))
        .route("/discovery", get(discovery_handler))
        .with_state(state);
    let addr = SocketAddr::from(([0, 0, 0, 0], 8080));

    println!("[Server] Servidor WebSocket iniciando em http://{}", addr);

    match tokio::net::TcpListener::bind(addr).await {
        Ok(listener) => {
            if let Err(err) = axum::serve(
                listener,
                app.into_make_service_with_connect_info::<SocketAddr>(),
            )
            .await
            {
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
    ConnectInfo(addr): ConnectInfo<SocketAddr>,
    State(state): State<ServerState>,
) -> impl IntoResponse {
    let rx = state.tx.subscribe();
    ws.on_upgrade(move |socket| handle_socket(socket, rx, addr, state))
}

async fn handle_socket(
    mut socket: WebSocket,
    mut rx: broadcast::Receiver<String>,
    addr: SocketAddr,
    state: ServerState,
) {
    let id_num = state.counter.fetch_add(1, Ordering::SeqCst);
    let client_id = format!("device_{}", id_num);
    let ip_str = addr.ip().to_string();
    let client_name = format!("Cliente Mobile ({})", ip_str);

    let (disconnect_tx, mut disconnect_rx) = tokio::sync::mpsc::channel::<()>(1);
    let now_ts = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs().to_string())
        .unwrap_or_default();

    {
        let mut map = state.clients.write().await;
        map.insert(
            client_id.clone(),
            ClientSession {
                device: ConnectedDevice {
                    id: client_id.clone(),
                    name: client_name.clone(),
                    ip: ip_str,
                    connected_at: now_ts,
                },
                disconnect_tx,
            },
        );
    }

    println!("[Server] Cliente '{}' conectado via WebSocket de {}", client_id, addr);

    loop {
        tokio::select! {
            _ = disconnect_rx.recv() => {
                println!("[Server] Desconexão forçada pelo servidor para cliente '{}'", client_id);
                let _ = socket.send(Message::Close(None)).await;
                break;
            }
            msg_option = socket.recv() => {
                match msg_option {
                    Some(Ok(Message::Text(text))) => {
                        println!("Comando recebido: {}", text);

                        let action_name = if let Ok(cmd) = serde_json::from_str::<ClientCommand>(&text) {
                            cmd.action
                        } else {
                            text.trim().to_string()
                        };

                        if action_name == "ping" {
                            // Heartbeat recebido do cliente mobile para manter a conexão ativa
                            continue;
                        }

                        if action_name == "get_layout" {
                            match db::get_all_buttons() {
                                Ok(buttons) => {
                                    let pages = db::get_all_pages().unwrap_or_default();
                                    let theme = db::get_active_theme()
                                        .unwrap_or_else(|_| "escuro".to_string());
                                    let appearance = db::get_appearance_settings().unwrap_or(db::AppearanceSettings {
                                        theme: theme.clone(),
                                        accent_color: "purple".to_string(),
                                        grid_columns: 5,
                                        vibration_enabled: true,
                                        icon_style: "linha".to_string(),
                                        custom_accent_hex: None,
                                        custom_bg_hex: None,
                                        button_radius: "smooth".to_string(),
                                        show_labels: true,
                                        label_font_size: "normal".to_string(),
                                        haptic_strength: "medium".to_string(),
                                        glow_enabled: true,
                                    });
                                    let response = serde_json::json!({
                                        "status": "ok",
                                        "action": "sync_layout",
                                        "event": "sync_layout",
                                        "pages": pages,
                                        "buttons": buttons,
                                        "theme": theme,
                                        "appearance": appearance,
                                        "payload": {
                                            "theme": theme,
                                            "pages": pages,
                                            "buttons": buttons,
                                            "appearance": appearance
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

                        if action_name == "identify" {
                            if let Ok(cmd) = serde_json::from_str::<ClientCommand>(&text) {
                                if let Some(p) = cmd.payload {
                                    let mut map = state.clients.write().await;
                                    if let Some(session) = map.get_mut(&client_id) {
                                        session.device.name = p;
                                    }
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

    {
        let mut map = state.clients.write().await;
        map.remove(&client_id);
    }
    println!("[Server] Sessão encerrada e dispositivo removido: '{}'", client_id);
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
            } else if let Some(last_token) = tokens.last() {
                eprintln!("[Macro] Tecla final não reconhecida na hotkey: '{}'", last_token);
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

    if let Some(webhook_url) = action.strip_prefix("webhook:") {
        let url = webhook_url.trim().to_string();
        if url.is_empty() {
            eprintln!("[Webhook] URL de webhook inválida ou vazia.");
            return;
        }
        println!("[Macro] Disparando Webhook HTTP GET: {}", url);
        tokio::spawn(async move {
            let client = match reqwest::Client::builder()
                .timeout(Duration::from_secs(5))
                .build()
            {
                Ok(c) => c,
                Err(err) => {
                    eprintln!("[Webhook] Erro ao instanciar cliente HTTP: {:?}", err);
                    return;
                }
            };

            match client.get(&url).send().await {
                Ok(resp) => {
                    println!("[Webhook] Resposta recebida: {} para {}", resp.status(), url);
                }
                Err(err) => {
                    eprintln!("[Webhook] Falha na requisição HTTP GET para '{}': {:?}", url, err);
                }
            }
        });
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

    if action.starts_with("obs:") {
        let action_str = action.to_string();
        tokio::spawn(async move {
            match db::get_obs_settings() {
                Ok(settings) => {
                    if !settings.enabled {
                        println!("[OBS] Comando '{}' ignorado pois a integração OBS está desativada", action_str);
                        return;
                    }
                    println!("[OBS] Executando comando OBS: {}", action_str);
                    if let Err(e) = crate::obs::obs_dispatch(&settings, &action_str).await {
                        eprintln!("[OBS] Erro ao executar comando '{}': {}", action_str, e);
                    }
                }
                Err(err) => {
                    eprintln!("[OBS] Erro ao carregar configurações OBS: {:?}", err);
                }
            }
        });
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

async fn start_window_monitor(tx: broadcast::Sender<String>) {
    println!("[Auto-Profile] Monitor de Janela Ativa iniciado (intervalo: 1000ms)");
    let mut last_window_key: Option<String> = None;

    loop {
        tokio::time::sleep(Duration::from_millis(1000)).await;

        let active_win = match get_active_window() {
            Ok(w) => w,
            Err(_) => continue,
        };

        let exe_name = active_win
            .process_path
            .file_name()
            .and_then(|f| f.to_str())
            .unwrap_or(&active_win.app_name)
            .trim()
            .to_string();

        if exe_name.is_empty() {
            continue;
        }

        let current_key = format!("{}:{}", active_win.process_id, exe_name.to_lowercase());

        // Se a janela/processo ativo for igual à iteração anterior, ignora
        if last_window_key.as_ref() == Some(&current_key) {
            continue;
        }
        last_window_key = Some(current_key);

        let rules = match db::get_window_rules() {
            Ok(r) => r,
            Err(_) => continue,
        };

        let exe_lower = exe_name.to_lowercase();
        let app_lower = active_win.app_name.trim().to_lowercase();
        let title_lower = active_win.title.trim().to_lowercase();

        let matched_rule = rules.into_iter().find(|rule| {
            if !rule.enabled {
                return false;
            }
            let target = rule.process_name.trim().to_lowercase();
            if target.is_empty() || exe_lower.is_empty() {
                return false;
            }

            let target_base = target.trim_end_matches(".exe");
            let exe_base = exe_lower.trim_end_matches(".exe");
            let app_base = app_lower.trim_end_matches(".exe");

            exe_lower == target
                || exe_base == target_base
                || app_base == target_base
                || app_lower == target
                || exe_lower == format!("{}.exe", target)
                || target == format!("{}.exe", exe_lower)
                || (!target_base.is_empty() && (
                    exe_lower.starts_with(target_base)
                    || app_lower.starts_with(target_base)
                    || title_lower.contains(target_base)
                ))
        });

        if let Some(rule) = matched_rule {
            println!(
                "[Auto-Profile] Match de janela: '{}' ({}) -> Página {}",
                exe_name, active_win.app_name, rule.page_index
            );

            let event_payload = serde_json::json!({
                "event": "page_change",
                "page_index": rule.page_index
            })
            .to_string();

            let _ = tx.send(event_payload);
        }
    }
}
