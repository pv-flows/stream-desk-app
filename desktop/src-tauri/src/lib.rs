pub mod db;
pub mod app_scanner;
mod server;

use tauri::menu::{Menu, MenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::Manager;
use tokio::sync::broadcast;
#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

fn broadcast_current_layout(tx: &broadcast::Sender<String>) {
    if let Ok(buttons) = db::get_all_buttons() {
        let pages = db::get_all_pages().unwrap_or_default();
        let theme = db::get_active_theme().unwrap_or_else(|_| "escuro".to_string());
        let appearance = db::get_appearance_settings().unwrap_or(db::AppearanceSettings {
            theme: theme.clone(),
            accent_color: "purple".to_string(),
            grid_columns: 3,
            vibration_enabled: true,
            icon_style: "linha".to_string(),
        });
        let json_string = serde_json::json!({
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
            "message": "Layout atualizado em tempo real pelo PC"
        })
        .to_string();

        let _ = tx.send(json_string);
    }
}

#[tauri::command]
fn get_appearance_settings() -> Result<db::AppearanceSettings, String> {
    db::get_appearance_settings().map_err(|e| e.to_string())
}

#[tauri::command]
fn set_appearance_settings(
    settings: db::AppearanceSettings,
    tx: tauri::State<'_, broadcast::Sender<String>>,
) -> Result<(), String> {
    db::set_appearance_settings(&settings).map_err(|e| e.to_string())?;
    broadcast_current_layout(&tx);
    Ok(())
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
fn toggle_window_rule(id: i32, enabled: bool) -> Result<(), String> {
    db::toggle_window_rule(id, enabled).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn delete_window_rule(id: i32) -> Result<(), String> {
    db::delete_window_rule(id).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
async fn get_installed_apps() -> Result<Vec<app_scanner::InstalledApp>, String> {
    tokio::task::spawn_blocking(app_scanner::scan_installed_apps)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn import_backup(
    backup: db::BackupData,
    tx: tauri::State<'_, broadcast::Sender<String>>,
) -> Result<(), String> {
    db::restore_backup(backup).map_err(|e| e.to_string())?;
    broadcast_current_layout(&tx);
    Ok(())
}

#[tauri::command]
fn get_system_settings() -> Result<db::SystemSettings, String> {
    db::get_system_settings().map_err(|e| e.to_string())
}

#[tauri::command]
fn set_system_settings(settings: db::SystemSettings) -> Result<(), String> {
    db::set_system_settings(&settings).map_err(|e| e.to_string())?;

    #[cfg(target_os = "windows")]
    {
        if settings.start_with_windows {
            if let Ok(current_exe) = std::env::current_exe() {
                let exe_str = current_exe.to_string_lossy().to_string();
                let _ = std::process::Command::new("reg")
                    .args([
                        "add",
                        r"HKCU\Software\Microsoft\Windows\CurrentVersion\Run",
                        "/v",
                        "StreamDesk",
                        "/t",
                        "REG_SZ",
                        "/d",
                        &format!("\"{}\"", exe_str),
                        "/f",
                    ])
                    .creation_flags(0x08000000)
                    .status();
            }
        } else {
            let _ = std::process::Command::new("reg")
                .args([
                    "delete",
                    r"HKCU\Software\Microsoft\Windows\CurrentVersion\Run",
                    "/v",
                    "StreamDesk",
                    "/f",
                ])
                .creation_flags(0x08000000)
                .status();
        }
    }

    Ok(())
}

#[tauri::command]
async fn get_connected_devices(
    state: tauri::State<'_, server::ServerState>,
) -> Result<Vec<server::ConnectedDevice>, String> {
    Ok(server::get_connected_clients(&state).await)
}

#[tauri::command]
async fn disconnect_device(
    id: String,
    state: tauri::State<'_, server::ServerState>,
) -> Result<(), String> {
    if server::disconnect_client(&state, &id).await {
        Ok(())
    } else {
        Err("Dispositivo não encontrado ou já desconectado".to_string())
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    if let Err(err) = db::init_db() {
        eprintln!("[DB] Erro ao inicializar SQLite: {:?}", err);
    }

    let (tx, _rx) = broadcast::channel::<String>(100);
    let server_state = server::ServerState::new(tx.clone());

    let state_for_setup = server_state.clone();

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(move |app| {
            app.manage(tx.clone());
            app.manage(state_for_setup.clone());

            let server_state_clone = state_for_setup.clone();
            tauri::async_runtime::spawn(async move {
                server::start_server(server_state_clone).await;
            });

            // Configuração do Tray Icon (Bandeja do Sistema)
            let show_item = MenuItem::with_id(app, "show", "Abrir Stream Desk", true, None::<&str>)?;
            let quit_item = MenuItem::with_id(app, "quit", "Sair", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_item, &quit_item])?;

            let mut tray_builder = TrayIconBuilder::new()
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.unminimize();
                            let _ = window.set_focus();
                        }
                    }
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.unminimize();
                            let _ = window.set_focus();
                        }
                    }
                });

            if let Some(icon) = app.default_window_icon() {
                tray_builder = tray_builder.icon(icon.clone());
            }

            let _ = tray_builder.build(app);

            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                if let Ok(sys) = db::get_system_settings() {
                    if sys.minimize_to_tray {
                        api.prevent_close();
                        let _ = window.hide();
                    }
                }
            }
        })
        .invoke_handler(tauri::generate_handler![
            get_buttons,
            get_local_ip,
            get_theme,
            set_theme,
            get_appearance_settings,
            set_appearance_settings,
            add_button,
            update_button,
            delete_button,
            get_window_rules,
            add_window_rule,
            toggle_window_rule,
            delete_window_rule,
            get_pages,
            add_page,
            update_page,
            delete_page,
            update_button_positions,
            get_installed_apps,
            import_backup,
            get_system_settings,
            set_system_settings,
            get_connected_devices,
            disconnect_device
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
