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
    pub page_index: i32,
}

pub fn init_db() -> Result<()> {
    let conn = Connection::open(DB_PATH)?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS buttons (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            label TEXT NOT NULL,
            action_name TEXT NOT NULL,
            color TEXT NOT NULL,
            icon TEXT DEFAULT 'zap',
            page_index INTEGER DEFAULT 0
        )",
        [],
    )?;

    // Migrações seguras caso a tabela já exista
    let _ = conn.execute("ALTER TABLE buttons ADD COLUMN icon TEXT DEFAULT 'zap'", []);
    let _ = conn.execute("ALTER TABLE buttons ADD COLUMN page_index INTEGER DEFAULT 0", []);

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
            ("Vol +", "vol_up", "#38bdf8", "volume-2", 0),
            ("Vol -", "vol_down", "#0ea5e9", "volume-x", 0),
            ("Play/Pause", "play_pause", "#22c55e", "play", 0),
            ("Calculadora", "open_calc", "#f59e0b", "calculator", 0),
        ];

        for (label, action_name, color, icon, page_index) in seed_buttons {
            conn.execute(
                "INSERT INTO buttons (label, action_name, color, icon, page_index) VALUES (?1, ?2, ?3, ?4, ?5)",
                params![label, action_name, color, icon, page_index],
            )?;
        }
    }

    Ok(())
}

pub fn get_all_buttons() -> Result<Vec<Button>> {
    let conn = Connection::open(DB_PATH)?;
    let mut stmt = conn.prepare(
        "SELECT id, label, action_name, color, COALESCE(icon, 'zap'), COALESCE(page_index, 0) FROM buttons ORDER BY id ASC",
    )?;

    let button_iter = stmt.query_map([], |row| {
        Ok(Button {
            id: row.get(0)?,
            label: row.get(1)?,
            action_name: row.get(2)?,
            color: row.get(3)?,
            icon: row.get(4)?,
            page_index: row.get(5)?,
        })
    })?;

    let mut buttons = Vec::new();
    for button in button_iter {
        buttons.push(button?);
    }

    Ok(buttons)
}

pub fn add_button(
    label: &str,
    action_name: &str,
    color: &str,
    icon: &str,
    page_index: i32,
) -> Result<usize> {
    let conn = Connection::open(DB_PATH)?;
    conn.execute(
        "INSERT INTO buttons (label, action_name, color, icon, page_index) VALUES (?1, ?2, ?3, ?4, ?5)",
        params![label, action_name, color, icon, page_index],
    )
}

pub fn update_button(
    id: i32,
    label: &str,
    action_name: &str,
    color: &str,
    icon: &str,
    page_index: i32,
) -> Result<usize> {
    let conn = Connection::open(DB_PATH)?;
    conn.execute(
        "UPDATE buttons SET label = ?1, action_name = ?2, color = ?3, icon = ?4, page_index = ?5 WHERE id = ?6",
        params![label, action_name, color, icon, page_index, id],
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
