// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    // Entry point delegating to desktop_lib::run() where tauri::async_runtime::spawn is configured
    desktop_lib::run()
}
