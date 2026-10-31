pub mod db;
mod server;

#[tauri::command]
fn get_buttons() -> Result<Vec<db::Button>, String> {
    db::get_all_buttons().map_err(|e| e.to_string())
}

#[tauri::command]
fn add_button(label: String, action_name: String, color: String) -> Result<(), String> {
    db::add_button(&label, &action_name, &color)
        .map(|_| ())
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_button(id: i32) -> Result<(), String> {
    db::delete_button(id)
        .map(|_| ())
        .map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    if let Err(err) = db::init_db() {
        eprintln!("[DB] Erro ao inicializar SQLite: {:?}", err);
    }

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|_app| {
            // Inicia o servidor Axum WebSocket em background no runtime assíncrono do Tauri
            tauri::async_runtime::spawn(async move {
                server::start_server().await;
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_buttons,
            add_button,
            delete_button
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
