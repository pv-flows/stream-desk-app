use rusqlite::{params, Connection, Result};
use serde::{Deserialize, Serialize};

const DB_PATH: &str = "streamdesk.db";

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Button {
    pub id: i32,
    pub label: String,
    pub action_name: String,
    pub color: String,
    pub icon: String,
}

pub fn init_db() -> Result<()> {
    let conn = Connection::open(DB_PATH)?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS buttons (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            label TEXT NOT NULL,
            action_name TEXT NOT NULL,
            color TEXT NOT NULL,
            icon TEXT DEFAULT 'zap'
        )",
        [],
    )?;

    // Migração segura caso a tabela já exista sem a coluna icon
    let _ = conn.execute("ALTER TABLE buttons ADD COLUMN icon TEXT DEFAULT 'zap'", []);

    conn.execute(
        "CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT
        )",
        [],
    )?;

    conn.execute(
        "INSERT OR IGNORE INTO settings (key, value) VALUES ('active_theme', 'default')",
        [],
    )?;

    let count: i64 = conn.query_row("SELECT COUNT(*) FROM buttons", [], |row| row.get(0))?;

    if count == 0 {
        println!("[DB] Tabela buttons vazia. Inserindo seed inicial de 4 botões...");
        let seed_buttons = [
            ("Vol +", "vol_up", "#38bdf8", "volume-2"),
            ("Vol -", "vol_down", "#0ea5e9", "volume-x"),
            ("Play/Pause", "play_pause", "#22c55e", "play"),
            ("Calculadora", "open_calc", "#f59e0b", "calculator"),
        ];

        for (label, action_name, color, icon) in seed_buttons {
            conn.execute(
                "INSERT INTO buttons (label, action_name, color, icon) VALUES (?1, ?2, ?3, ?4)",
                params![label, action_name, color, icon],
            )?;
        }
    }

    Ok(())
}

pub fn get_all_buttons() -> Result<Vec<Button>> {
    let conn = Connection::open(DB_PATH)?;
    let mut stmt = conn.prepare("SELECT id, label, action_name, color, COALESCE(icon, 'zap') FROM buttons ORDER BY id ASC")?;

    let button_iter = stmt.query_map([], |row| {
        Ok(Button {
            id: row.get(0)?,
            label: row.get(1)?,
            action_name: row.get(2)?,
            color: row.get(3)?,
            icon: row.get(4)?,
        })
    })?;

    let mut buttons = Vec::new();
    for button in button_iter {
        buttons.push(button?);
    }

    Ok(buttons)
}

pub fn add_button(label: &str, action_name: &str, color: &str, icon: &str) -> Result<usize> {
    let conn = Connection::open(DB_PATH)?;
    conn.execute(
        "INSERT INTO buttons (label, action_name, color, icon) VALUES (?1, ?2, ?3, ?4)",
        params![label, action_name, color, icon],
    )
}

pub fn delete_button(id: i32) -> Result<usize> {
    let conn = Connection::open(DB_PATH)?;
    conn.execute("DELETE FROM buttons WHERE id = ?1", params![id])
}

pub fn get_active_theme() -> Result<String> {
    let conn = Connection::open(DB_PATH)?;
    let theme: String = conn
        .query_row(
            "SELECT value FROM settings WHERE key = 'active_theme'",
            [],
            |row| row.get(0),
        )
        .unwrap_or_else(|_| "default".to_string());
    Ok(theme)
}

pub fn set_active_theme(theme: &str) -> Result<()> {
    let conn = Connection::open(DB_PATH)?;
    conn.execute(
        "INSERT OR REPLACE INTO settings (key, value) VALUES ('active_theme', ?1)",
        params![theme],
    )?;
    Ok(())
}
