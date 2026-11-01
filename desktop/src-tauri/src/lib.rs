pub mod db;
mod server;

use tauri::Manager;
use tokio::sync::broadcast;

fn broadcast_current_layout(tx: &broadcast::Sender<String>) {
    if let Ok(buttons) = db::get_all_buttons() {
        let pages = db::get_all_pages().unwrap_or_default();
        let theme = db::get_active_theme().unwrap_or_else(|_| "default".to_string());
        let json_string = serde_json::json!({
            "status": "ok",
            "action": "sync_layout",
            "event": "sync_layout",
            "pages": pages,
            "buttons": buttons,
            "theme": theme,
            "payload": {
                "theme": theme,
                "pages": pages,
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
    page_index: Option<i32>,
    position: Option<i32>,
    tx: tauri::State<'_, broadcast::Sender<String>>,
) -> Result<(), String> {
    let icon_name = icon.unwrap_or_else(|| "zap".to_string());
    let page = page_index.unwrap_or(0);
    let pos = position.unwrap_or(0);
    db::add_button(&label, &action_name, &color, &icon_name, page, pos)
        .map_err(|e| e.to_string())?;
    broadcast_current_layout(&tx);
    Ok(())
}

#[tauri::command]
fn update_button(
    id: i32,
    label: String,
    action_name: String,
    color: String,
    icon: Option<String>,
    page_index: Option<i32>,
    position: Option<i32>,
    tx: tauri::State<'_, broadcast::Sender<String>>,
) -> Result<(), String> {
    let icon_name = icon.unwrap_or_else(|| "zap".to_string());
    let page = page_index.unwrap_or(0);
    let pos = position.unwrap_or(0);
    db::update_button(id, &label, &action_name, &color, &icon_name, page, pos)
        .map_err(|e| e.to_string())?;
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

#[tauri::command]
fn get_pages() -> Result<Vec<db::Page>, String> {
    db::get_all_pages().map_err(|e| e.to_string())
}

#[tauri::command]
fn add_page(
    name: String,
    tx: tauri::State<'_, broadcast::Sender<String>>,
) -> Result<i32, String> {
    let id = db::add_page(&name).map_err(|e| e.to_string())?;
    broadcast_current_layout(&tx);
    Ok(id)
}

#[tauri::command]
fn update_page(
    id: i32,
    name: String,
    tx: tauri::State<'_, broadcast::Sender<String>>,
) -> Result<(), String> {
    db::update_page(id, &name).map_err(|e| e.to_string())?;
    broadcast_current_layout(&tx);
    Ok(())
}

#[tauri::command]
fn delete_page(
    id: i32,
    tx: tauri::State<'_, broadcast::Sender<String>>,
) -> Result<(), String> {
    db::delete_page(id).map_err(|e| e.to_string())?;
    broadcast_current_layout(&tx);
    Ok(())
}

#[tauri::command]
fn update_button_positions(
    updates: Vec<db::ButtonPositionUpdate>,
    tx: tauri::State<'_, broadcast::Sender<String>>,
) -> Result<(), String> {
    db::update_button_positions(updates).map_err(|e| e.to_string())?;
    broadcast_current_layout(&tx);
    Ok(())
}

#[tauri::command]
fn get_window_rules() -> Result<Vec<db::WindowRule>, String> {
    db::get_window_rules().map_err(|e| e.to_string())
}

#[tauri::command]
fn add_window_rule(process_name: String, page_index: i32) -> Result<(), String> {
    db::add_window_rule(&process_name, page_index).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn delete_window_rule(id: i32) -> Result<(), String> {
    db::delete_window_rule(id).map_err(|e| e.to_string())?;
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
            update_button,
            delete_button,
            get_window_rules,
            add_window_rule,
            delete_window_rule,
            get_pages,
            add_page,
            update_page,
            delete_page,
            update_button_positions
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
