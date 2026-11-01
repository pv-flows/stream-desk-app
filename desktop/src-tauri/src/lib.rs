pub mod db;
mod server;

use tauri::Manager;
use tokio::sync::broadcast;

fn broadcast_current_layout(tx: &broadcast::Sender<String>) {
    if let Ok(buttons) = db::get_all_buttons() {
        let theme = db::get_active_theme().unwrap_or_else(|_| "default".to_string());
        let json_string = serde_json::json!({
            "status": "ok",
            "action": "sync_layout",
            "payload": {
                "theme": theme,
                "buttons": buttons
            },
            "message": "Layout atualizado em tempo real pelo PC"
        })
        .to_string();

        let _ = tx.send(json_string);
    }
}

#[tauri::command]
fn get_buttons() -> Result<Vec<db::Button>, String> {
    db::get_all_buttons().map_err(|e| e.to_string())
}

#[tauri::command]
fn get_local_ip() -> Result<String, String> {
    local_ip_address::local_ip()
        .map(|ip| ip.to_string())
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn get_theme() -> Result<String, String> {
    db::get_active_theme().map_err(|e| e.to_string())
}

#[tauri::command]
fn set_theme(
    theme: String,
    tx: tauri::State<'_, broadcast::Sender<String>>,
) -> Result<(), String> {
    db::set_active_theme(&theme).map_err(|e| e.to_string())?;
    broadcast_current_layout(&tx);
    Ok(())
}

#[tauri::command]
fn add_button(
    label: String,
    action_name: String,
    color: String,
    icon: Option<String>,
    tx: tauri::State<'_, broadcast::Sender<String>>,
) -> Result<(), String> {
    let icon_name = icon.unwrap_or_else(|| "zap".to_string());
    db::add_button(&label, &action_name, &color, &icon_name).map_err(|e| e.to_string())?;
    broadcast_current_layout(&tx);
    Ok(())
}

#[tauri::command]
fn delete_button(
    id: i32,
    tx: tauri::State<'_, broadcast::Sender<String>>,
) -> Result<(), String> {
    db::delete_button(id).map_err(|e| e.to_string())?;
    broadcast_current_layout(&tx);
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    if let Err(err) = db::init_db() {
        eprintln!("[DB] Erro ao inicializar SQLite: {:?}", err);
    }

    let (tx, _rx) = broadcast::channel::<String>(100);

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(move |app| {
            app.manage(tx.clone());

            let server_tx = tx.clone();
            tauri::async_runtime::spawn(async move {
                server::start_server(server_tx).await;
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_buttons,
            get_local_ip,
            get_theme,
            set_theme,
            add_button,
            delete_button
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
