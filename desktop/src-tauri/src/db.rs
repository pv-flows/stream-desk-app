use rusqlite::{params, Connection, Result};
use serde::{Deserialize, Serialize};

const DB_PATH: &str = "streamdesk.db";

fn default_icon() -> String {
    "zap".to_string()
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Button {
    #[serde(default)]
    pub id: i32,
    pub label: String,
    pub action_name: String,
    pub color: String,
    #[serde(default = "default_icon")]
    pub icon: String,
    #[serde(default)]
    pub page_index: i32,
    #[serde(default)]
    pub position: i32,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Page {
    #[serde(default)]
    pub id: i32,
    pub name: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ButtonPositionUpdate {
    pub id: i32,
    pub position: i32,
    #[serde(alias = "pageIndex")]
    pub page_index: Option<i32>,
}

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub struct AppearanceSettings {
    pub theme: String,
    pub accent_color: String,
    pub grid_columns: i32,
    pub vibration_enabled: bool,
    pub icon_style: String,
}

fn default_enabled() -> bool {
    true
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct WindowRule {
    #[serde(default)]
    pub id: i32,
    pub process_name: String,
    pub page_index: i32,
    #[serde(default = "default_enabled")]
    pub enabled: bool,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct BackupData {
    pub version: Option<String>,
    #[serde(alias = "exportedAt")]
    pub exported_at: Option<String>,
    pub theme: Option<String>,
    pub appearance: Option<AppearanceSettings>,
    pub pages: Vec<Page>,
    pub buttons: Vec<Button>,
    #[serde(alias = "windowRules")]
    pub window_rules: Option<Vec<WindowRule>>,
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

    conn.execute(
        "CREATE TABLE IF NOT EXISTS window_rules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            process_name TEXT NOT NULL,
            page_index INTEGER NOT NULL
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS pages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL
        )",
        [],
    )?;

    // Migrações seguras caso a tabela já exista
    let _ = conn.execute("ALTER TABLE buttons ADD COLUMN icon TEXT DEFAULT 'zap'", []);
    let _ = conn.execute("ALTER TABLE buttons ADD COLUMN page_index INTEGER DEFAULT 0", []);
    let _ = conn.execute("ALTER TABLE buttons ADD COLUMN position INTEGER DEFAULT 0", []);
    let _ = conn.execute("ALTER TABLE window_rules ADD COLUMN enabled INTEGER DEFAULT 1", []);

    // Migração de páginas dinâmicas: garante pelo menos a página "Principal"
    let page_count: i64 = conn
        .query_row("SELECT COUNT(*) FROM pages", [], |row| row.get(0))
        .unwrap_or(0);
    if page_count == 0 {
        let _ = conn.execute("INSERT INTO pages (name) VALUES ('Principal')", []);
        let principal_id: i32 = conn.last_insert_rowid() as i32;

        let has_media_buttons: bool = conn
            .query_row(
                "SELECT 1 FROM buttons WHERE page_index = 1 LIMIT 1",
                [],
                |_| Ok(true),
            )
            .unwrap_or(false);
        if has_media_buttons {
            let _ = conn.execute("INSERT INTO pages (name) VALUES ('Mídia')", []);
            let media_id: i32 = conn.last_insert_rowid() as i32;
            let _ = conn.execute(
                "UPDATE buttons SET page_index = ?1 WHERE page_index = 1",
                params![media_id],
            );
        }

        let _ = conn.execute(
            "UPDATE buttons SET page_index = ?1 WHERE page_index = 0",
            params![principal_id],
        );
    }

    conn.execute(
        "CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT
        )",
        [],
    )?;

    conn.execute(
        "INSERT OR IGNORE INTO settings (key, value) VALUES ('active_theme', 'escuro')",
        [],
    )?;
    conn.execute(
        "INSERT OR IGNORE INTO settings (key, value) VALUES ('accent_color', 'purple')",
        [],
    )?;
    conn.execute(
        "INSERT OR IGNORE INTO settings (key, value) VALUES ('grid_columns', '3')",
        [],
    )?;
    conn.execute(
        "INSERT OR IGNORE INTO settings (key, value) VALUES ('vibration_enabled', '1')",
        [],
    )?;
    conn.execute(
        "INSERT OR IGNORE INTO settings (key, value) VALUES ('icon_style', 'linha')",
        [],
    )?;

    // Migração de seed para organizar Página 1: Apps, Página 2: Mídia
    let has_migrated_seed: bool = conn
        .query_row(
            "SELECT 1 FROM settings WHERE key = 'seed_v2_applied'",
            [],
            |_| Ok(true),
        )
        .unwrap_or(false);

    if !has_migrated_seed {
        println!("[DB] Aplicando migração do novo seed padrão organizado (Pág 0: Apps, Pág 1: Mídia)...");
        let _ = conn.execute("DELETE FROM buttons", []);
        let seed_buttons = [
            // Página 0: Apps / Atalhos de Sistema
            ("Calculadora", "open_app:calc", "#f59e0b", "calculator", 0),
            ("Navegador", "open_url:https://google.com", "#38bdf8", "globe", 0),
            ("Terminal", "open_app:cmd", "#64748b", "terminal", 0),
            ("Tarefas", "hotkey:Ctrl+Shift+Escape", "#10b981", "zap", 0),
            // Página 1: Mídia & Controles de Áudio
            ("Vol +", "vol_up", "#38bdf8", "volume-2", 1),
            ("Vol -", "vol_down", "#0ea5e9", "volume-x", 1),
            ("Mute", "mute", "#ef4444", "mic-off", 1),
            ("Play/Pause", "play_pause", "#22c55e", "play", 1),
            ("Próxima", "media_next", "#8b5cf6", "play", 1),
            ("Anterior", "media_prev", "#6366f1", "play", 1),
        ];

        for (label, action_name, color, icon, page_index) in seed_buttons {
            let _ = conn.execute(
                "INSERT INTO buttons (label, action_name, color, icon, page_index) VALUES (?1, ?2, ?3, ?4, ?5)",
                params![label, action_name, color, icon, page_index],
            );
        }

        let _ = conn.execute(
            "INSERT OR REPLACE INTO settings (key, value) VALUES ('seed_v2_applied', 'true')",
            [],
        );
    }

    let count: i64 = conn.query_row("SELECT COUNT(*) FROM buttons", [], |row| row.get(0))?;

    if count == 0 {
        println!("[DB] Tabela buttons vazia. Inserindo novo seed padrão (Página 1: Apps, Página 2: Mídia)...");
        let seed_buttons = [
            // Página 0: Apps / Atalhos de Sistema
            ("Calculadora", "open_app:calc", "#f59e0b", "calculator", 0),
            ("Navegador", "open_url:https://google.com", "#38bdf8", "globe", 0),
            ("Terminal", "open_app:cmd", "#64748b", "terminal", 0),
            ("Tarefas", "hotkey:Ctrl+Shift+Escape", "#10b981", "zap", 0),
            // Página 1: Mídia & Controles de Áudio
            ("Vol +", "vol_up", "#38bdf8", "volume-2", 1),
            ("Vol -", "vol_down", "#0ea5e9", "volume-x", 1),
            ("Mute", "mute", "#ef4444", "mic-off", 1),
            ("Play/Pause", "play_pause", "#22c55e", "play", 1),
            ("Próxima", "media_next", "#8b5cf6", "play", 1),
            ("Anterior", "media_prev", "#6366f1", "play", 1),
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
        "SELECT id, label, action_name, color, COALESCE(icon, 'zap'), COALESCE(page_index, 0), COALESCE(position, 0) FROM buttons ORDER BY position ASC, id ASC",
    )?;

    let button_iter = stmt.query_map([], |row| {
        Ok(Button {
            id: row.get(0)?,
            label: row.get(1)?,
            action_name: row.get(2)?,
            color: row.get(3)?,
            icon: row.get(4)?,
            page_index: row.get(5)?,
            position: row.get(6)?,
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
    position: i32,
) -> Result<usize> {
    let conn = Connection::open(DB_PATH)?;
    conn.execute(
        "INSERT INTO buttons (label, action_name, color, icon, page_index, position) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![label, action_name, color, icon, page_index, position],
    )
}

pub fn update_button(
    id: i32,
    label: &str,
    action_name: &str,
    color: &str,
    icon: &str,
    page_index: i32,
    position: i32,
) -> Result<usize> {
    let conn = Connection::open(DB_PATH)?;
    conn.execute(
        "UPDATE buttons SET label = ?1, action_name = ?2, color = ?3, icon = ?4, page_index = ?5, position = ?6 WHERE id = ?7",
        params![label, action_name, color, icon, page_index, position, id],
    )
}

pub fn delete_button(id: i32) -> Result<usize> {
    let conn = Connection::open(DB_PATH)?;
    conn.execute("DELETE FROM buttons WHERE id = ?1", params![id])
}

pub fn get_all_pages() -> Result<Vec<Page>> {
    let conn = Connection::open(DB_PATH)?;
    let mut stmt = conn.prepare("SELECT id, name FROM pages ORDER BY id ASC")?;
    let page_iter = stmt.query_map([], |row| {
        Ok(Page {
            id: row.get(0)?,
            name: row.get(1)?,
        })
    })?;

    let mut pages = Vec::new();
    for page in page_iter {
        pages.push(page?);
    }
    Ok(pages)
}

pub fn add_page(name: &str) -> Result<i32> {
    let conn = Connection::open(DB_PATH)?;
    conn.execute("INSERT INTO pages (name) VALUES (?1)", params![name])?;
    Ok(conn.last_insert_rowid() as i32)
}

pub fn update_page(id: i32, name: &str) -> Result<usize> {
    let conn = Connection::open(DB_PATH)?;
    conn.execute("UPDATE pages SET name = ?1 WHERE id = ?2", params![name, id])
}

pub fn delete_page(id: i32) -> Result<usize> {
    let conn = Connection::open(DB_PATH)?;
    let count: i64 = conn.query_row("SELECT COUNT(*) FROM pages", [], |r| r.get(0))?;
    if count <= 1 {
        return Err(rusqlite::Error::InvalidParameterName(
            "Cannot delete the last remaining page".into(),
        ));
    }
    let _ = conn.execute("DELETE FROM buttons WHERE page_index = ?1", params![id]);
    let _ = conn.execute("DELETE FROM window_rules WHERE page_index = ?1", params![id]);
    conn.execute("DELETE FROM pages WHERE id = ?1", params![id])
}

pub fn update_button_positions(updates: Vec<ButtonPositionUpdate>) -> Result<()> {
    let mut conn = Connection::open(DB_PATH)?;
    let tx = conn.transaction()?;
    {
        let mut stmt_with_page =
            tx.prepare("UPDATE buttons SET position = ?1, page_index = ?2 WHERE id = ?3")?;
        let mut stmt_pos_only = tx.prepare("UPDATE buttons SET position = ?1 WHERE id = ?2")?;

        for update in updates {
            if let Some(page_idx) = update.page_index {
                stmt_with_page.execute(params![update.position, page_idx, update.id])?;
            } else {
                stmt_pos_only.execute(params![update.position, update.id])?;
            }
        }
    }
    tx.commit()?;
    Ok(())
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

pub fn get_appearance_settings() -> Result<AppearanceSettings> {
    let conn = Connection::open(DB_PATH)?;
    let theme: String = conn
        .query_row(
            "SELECT value FROM settings WHERE key = 'active_theme'",
            [],
            |row| row.get(0),
        )
        .unwrap_or_else(|_| "escuro".to_string());
    let accent_color: String = conn
        .query_row(
            "SELECT value FROM settings WHERE key = 'accent_color'",
            [],
            |row| row.get(0),
        )
        .unwrap_or_else(|_| "purple".to_string());
    let grid_columns: i32 = conn
        .query_row(
            "SELECT value FROM settings WHERE key = 'grid_columns'",
            [],
            |row| row.get(0),
        )
        .map(|v: String| v.parse().unwrap_or(3))
        .unwrap_or(3);
    let vibration_enabled: bool = conn
        .query_row(
            "SELECT value FROM settings WHERE key = 'vibration_enabled'",
            [],
            |row| row.get(0),
        )
        .map(|v: String| v == "1" || v.eq_ignore_ascii_case("true"))
        .unwrap_or(true);
    let icon_style: String = conn
        .query_row(
            "SELECT value FROM settings WHERE key = 'icon_style'",
            [],
            |row| row.get(0),
        )
        .unwrap_or_else(|_| "linha".to_string());

    Ok(AppearanceSettings {
        theme,
        accent_color,
        grid_columns,
        vibration_enabled,
        icon_style,
    })
}

pub fn set_appearance_settings(settings: &AppearanceSettings) -> Result<()> {
    let conn = Connection::open(DB_PATH)?;
    conn.execute(
        "INSERT OR REPLACE INTO settings (key, value) VALUES ('active_theme', ?1)",
        params![settings.theme],
    )?;
    conn.execute(
        "INSERT OR REPLACE INTO settings (key, value) VALUES ('accent_color', ?1)",
        params![settings.accent_color],
    )?;
    conn.execute(
        "INSERT OR REPLACE INTO settings (key, value) VALUES ('grid_columns', ?1)",
        params![settings.grid_columns.to_string()],
    )?;
    conn.execute(
        "INSERT OR REPLACE INTO settings (key, value) VALUES ('vibration_enabled', ?1)",
        params![if settings.vibration_enabled { "1" } else { "0" }],
    )?;
    conn.execute(
        "INSERT OR REPLACE INTO settings (key, value) VALUES ('icon_style', ?1)",
        params![settings.icon_style],
    )?;
    Ok(())
}

pub fn get_window_rules() -> Result<Vec<WindowRule>> {
    let conn = Connection::open(DB_PATH)?;
    let mut stmt = conn.prepare(
        "SELECT id, process_name, page_index, COALESCE(enabled, 1) FROM window_rules ORDER BY id ASC",
    )?;

    let rule_iter = stmt.query_map([], |row| {
        let enabled_int: i32 = row.get(3)?;
        Ok(WindowRule {
            id: row.get(0)?,
            process_name: row.get(1)?,
            page_index: row.get(2)?,
            enabled: enabled_int != 0,
        })
    })?;

    let mut rules = Vec::new();
    for rule in rule_iter {
        rules.push(rule?);
    }

    Ok(rules)
}

pub fn add_window_rule(process_name: &str, page_index: i32) -> Result<usize> {
    let conn = Connection::open(DB_PATH)?;
    conn.execute(
        "INSERT INTO window_rules (process_name, page_index, enabled) VALUES (?1, ?2, 1)",
        params![process_name, page_index],
    )
}

pub fn toggle_window_rule(id: i32, enabled: bool) -> Result<usize> {
    let conn = Connection::open(DB_PATH)?;
    let enabled_val = if enabled { 1 } else { 0 };
    conn.execute(
        "UPDATE window_rules SET enabled = ?1 WHERE id = ?2",
        params![enabled_val, id],
    )
}

pub fn delete_window_rule(id: i32) -> Result<usize> {
    let conn = Connection::open(DB_PATH)?;
    conn.execute("DELETE FROM window_rules WHERE id = ?1", params![id])
}

pub fn restore_backup(data: BackupData) -> Result<()> {
    let mut conn = Connection::open(DB_PATH)?;
    let tx = conn.transaction()?;
    {
        tx.execute("DELETE FROM buttons", [])?;
        tx.execute("DELETE FROM window_rules", [])?;
        tx.execute("DELETE FROM pages", [])?;

        let mut page_stmt_with_id = tx.prepare("INSERT INTO pages (id, name) VALUES (?1, ?2)")?;
        let mut page_stmt_no_id = tx.prepare("INSERT INTO pages (name) VALUES (?1)")?;
        for page in &data.pages {
            if page.id > 0 {
                page_stmt_with_id.execute(params![page.id, page.name])?;
            } else {
                page_stmt_no_id.execute(params![page.name])?;
            }
        }

        let mut btn_stmt_with_id = tx.prepare(
            "INSERT INTO buttons (id, label, action_name, color, icon, page_index, position) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        )?;
        let mut btn_stmt_no_id = tx.prepare(
            "INSERT INTO buttons (label, action_name, color, icon, page_index, position) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        )?;
        for btn in &data.buttons {
            if btn.id > 0 {
                btn_stmt_with_id.execute(params![
                    btn.id,
                    btn.label,
                    btn.action_name,
                    btn.color,
                    btn.icon,
                    btn.page_index,
                    btn.position
                ])?;
            } else {
                btn_stmt_no_id.execute(params![
                    btn.label,
                    btn.action_name,
                    btn.color,
                    btn.icon,
                    btn.page_index,
                    btn.position
                ])?;
            }
        }

        if let Some(rules) = &data.window_rules {
            let mut rule_stmt_with_id = tx.prepare(
                "INSERT INTO window_rules (id, process_name, page_index, enabled) VALUES (?1, ?2, ?3, ?4)",
            )?;
            let mut rule_stmt_no_id = tx.prepare(
                "INSERT INTO window_rules (process_name, page_index, enabled) VALUES (?1, ?2, ?3)",
            )?;
            for rule in rules {
                let enabled_val = if rule.enabled { 1 } else { 0 };
                if rule.id > 0 {
                    rule_stmt_with_id.execute(params![
                        rule.id,
                        rule.process_name,
                        rule.page_index,
                        enabled_val
                    ])?;
                } else {
                    rule_stmt_no_id.execute(params![
                        rule.process_name,
                        rule.page_index,
                        enabled_val
                    ])?;
                }
            }
        }

        if let Some(app) = &data.appearance {
            tx.execute(
                "INSERT OR REPLACE INTO settings (key, value) VALUES ('active_theme', ?1)",
                params![app.theme],
            )?;
            tx.execute(
                "INSERT OR REPLACE INTO settings (key, value) VALUES ('accent_color', ?1)",
                params![app.accent_color],
            )?;
            tx.execute(
                "INSERT OR REPLACE INTO settings (key, value) VALUES ('grid_columns', ?1)",
                params![app.grid_columns.to_string()],
            )?;
            tx.execute(
                "INSERT OR REPLACE INTO settings (key, value) VALUES ('vibration_enabled', ?1)",
                params![if app.vibration_enabled { "1" } else { "0" }],
            )?;
            tx.execute(
                "INSERT OR REPLACE INTO settings (key, value) VALUES ('icon_style', ?1)",
                params![app.icon_style],
            )?;
        } else if let Some(th) = &data.theme {
            tx.execute(
                "INSERT OR REPLACE INTO settings (key, value) VALUES ('active_theme', ?1)",
                params![th],
            )?;
        }
    }
    tx.commit()?;
    Ok(())
}
