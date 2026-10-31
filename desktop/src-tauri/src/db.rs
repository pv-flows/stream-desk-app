use rusqlite::{params, Connection, Result};
use serde::{Deserialize, Serialize};

const DB_PATH: &str = "streamdesk.db";

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Button {
    pub id: i64,
    pub label: String,
    pub action_name: String,
    pub color: String,
}

pub fn init_db() -> Result<()> {
    let conn = Connection::open(DB_PATH)?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS buttons (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            label TEXT NOT NULL,
            action_name TEXT NOT NULL,
            color TEXT NOT NULL
        )",
        [],
    )?;

    let count: i64 = conn.query_row("SELECT COUNT(*) FROM buttons", [], |row| row.get(0))?;

    if count == 0 {
        println!("[DB] Tabela buttons vazia. Inserindo seed inicial de 4 botões...");
        let seed_buttons = [
            ("Vol +", "vol_up", "#38bdf8"),
            ("Vol -", "vol_down", "#0ea5e9"),
            ("Play/Pause", "play_pause", "#22c55e"),
            ("Calculadora", "open_calc", "#f59e0b"),
        ];

        for (label, action_name, color) in seed_buttons {
            conn.execute(
                "INSERT INTO buttons (label, action_name, color) VALUES (?1, ?2, ?3)",
                params![label, action_name, color],
            )?;
        }
    }

    Ok(())
}

pub fn get_all_buttons() -> Result<Vec<Button>> {
    let conn = Connection::open(DB_PATH)?;
    let mut stmt = conn.prepare("SELECT id, label, action_name, color FROM buttons ORDER BY id ASC")?;

    let button_iter = stmt.query_map([], |row| {
        Ok(Button {
            id: row.get(0)?,
            label: row.get(1)?,
            action_name: row.get(2)?,
            color: row.get(3)?,
        })
    })?;

    let mut buttons = Vec::new();
    for button in button_iter {
        buttons.push(button?);
    }

    Ok(buttons)
}

