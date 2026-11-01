use std::collections::HashSet;
use std::env;
use std::fs;
use std::path::{Path, PathBuf};
use serde::{Deserialize, Serialize};
use windows_icons::IconSize;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct InstalledApp {
    pub name: String,
    pub process: String,
    pub path: String,
    pub icon_base64: String,
    pub nome_amigavel: String,
    pub icone_base64: String,
}

/// Executa a varredura das pastas do Menu Iniciar e Desktop no Windows
pub fn scan_installed_apps() -> Vec<InstalledApp> {
    let mut apps = Vec::new();
    let mut seen_keys = HashSet::new();

    let mut scan_dirs = Vec::new();

    // 1. Menu Iniciar do Usuário Atual (%APPDATA%\Microsoft\Windows\Start Menu\Programs)
    if let Ok(appdata) = env::var("APPDATA") {
        scan_dirs.push(PathBuf::from(appdata).join("Microsoft\\Windows\\Start Menu\\Programs"));
    }

    // 2. Menu Iniciar de Todos os Usuários (%ProgramData%\Microsoft\Windows\Start Menu\Programs)
    if let Ok(programdata) = env::var("ProgramData") {
        scan_dirs.push(PathBuf::from(programdata).join("Microsoft\\Windows\\Start Menu\\Programs"));
    }

    // 3. Desktop Público (%PUBLIC%\Desktop)
    if let Ok(public) = env::var("PUBLIC") {
        scan_dirs.push(PathBuf::from(public).join("Desktop"));
    }

    // 4. Desktop do Usuário (%USERPROFILE%\Desktop)
    if let Ok(userprofile) = env::var("USERPROFILE") {
        scan_dirs.push(PathBuf::from(userprofile).join("Desktop"));
    }

    for dir in scan_dirs {
        if dir.exists() {
            scan_directory(&dir, 0, 3, &mut apps, &mut seen_keys);
        }
    }

    // Ordena alfabeticamente pelo nome amigável
    apps.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    apps
}

fn scan_directory(
    dir: &Path,
    current_depth: usize,
    max_depth: usize,
    apps: &mut Vec<InstalledApp>,
    seen_keys: &mut HashSet<String>,
) {
    if current_depth > max_depth {
        return;
    }

    let entries = match fs::read_dir(dir) {
        Ok(e) => e,
        Err(_) => return,
    };

    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_dir() {
            scan_directory(&path, current_depth + 1, max_depth, apps, seen_keys);
            continue;
        }

        let ext = path
            .extension()
            .and_then(|s| s.to_str())
            .unwrap_or("")
            .to_lowercase();

        if ext == "lnk" || ext == "exe" {
            if let Some(app) = process_file(&path) {
                let key = format!("{}:{}", app.name.to_lowercase(), app.process.to_lowercase());
                if !seen_keys.contains(&key) {
                    seen_keys.insert(key);
                    apps.push(app);
                }
            }
        }
    }
}

fn process_file(path: &Path) -> Option<InstalledApp> {
    let file_stem = path.file_stem().and_then(|s| s.to_str())?.trim();
    if file_stem.is_empty() {
        return None;
    }

    let lower_stem = file_stem.to_lowercase();
    // Filtra desinstaladores, instaladores, manuais e utilitários de suporte
    if lower_stem.starts_with("uninstall")
        || lower_stem.starts_with("desinstalar")
        || lower_stem.contains("unins00")
        || lower_stem.starts_with("ajuda")
        || lower_stem.starts_with("help")
        || lower_stem.contains("readme")
        || lower_stem.contains("leia-me")
        || lower_stem.ends_with("helper")
        || lower_stem.ends_with("updater")
        || lower_stem.ends_with("crashpad")
    {
        return None;
    }

    let ext = path
        .extension()
        .and_then(|s| s.to_str())
        .unwrap_or("")
        .to_lowercase();

    let mut target_exe = String::new();
    let mut resolved_path = path.to_string_lossy().to_string();

    if ext == "lnk" {
        // Tenta resolver o link com a crate `lnk`
        if let Ok(link) = lnk::ShellLink::open(path, lnk::encoding::WINDOWS_1252) {
            let target_opt = std::panic::catch_unwind(|| link.link_target()).ok().flatten();
            if let Some(target) = target_opt {
                if !target.trim().is_empty() {
                    let target_p = Path::new(&target);
                    if let Some(fname) = target_p.file_name().and_then(|f| f.to_str()) {
                        if fname.to_lowercase().ends_with(".exe") {
                            target_exe = fname.to_string();
                            resolved_path = target;
                        }
                    }
                }
            }
        }

        // Ignora links que apontam para arquivos de texto, manuais ou URLs
        let lower_res = resolved_path.to_lowercase();
        if lower_res.ends_with(".txt")
            || lower_res.ends_with(".chm")
            || lower_res.ends_with(".pdf")
            || lower_res.ends_with(".url")
            || lower_res.ends_with(".htm")
            || lower_res.ends_with(".html")
        {
            return None;
        }

        // Se não conseguiu resolver o alvo do atalho, infere a partir do nome
        if target_exe.is_empty() {
            target_exe = format!("{}.exe", file_stem);
        }
    } else if ext == "exe" {
        target_exe = path
            .file_name()
            .and_then(|f| f.to_str())
            .unwrap_or(file_stem)
            .to_string();
    }

    // Extrai o ícone usando `windows-icons`
    let icon_b64 = extract_icon_base64(path, &resolved_path);

    Some(InstalledApp {
        name: file_stem.to_string(),
        process: target_exe,
        path: resolved_path,
        icon_base64: icon_b64.clone(),
        nome_amigavel: file_stem.to_string(),
        icone_base64: icon_b64,
    })
}

fn extract_icon_base64(original_path: &Path, resolved_path: &str) -> String {
    // 1. Tenta extrair diretamente do atalho .lnk original
    if let Ok(b64) = windows_icons::get_icon_base64_by_path_with_size(original_path, IconSize::Medium) {
        if !b64.is_empty() {
            return format!("data:image/png;base64,{}", b64);
        }
    }

    // 2. Tenta extrair do executável de destino resolvido
    let resolved_p = Path::new(resolved_path);
    if resolved_p != original_path && resolved_p.exists() {
        if let Ok(b64) = windows_icons::get_icon_base64_by_path_with_size(resolved_p, IconSize::Medium) {
            if !b64.is_empty() {
                return format!("data:image/png;base64,{}", b64);
            }
        }
    }

    String::new()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_scan_installed_apps() {
        let apps = scan_installed_apps();
        println!("Encontrados {} aplicativos instalados:", apps.len());
        for app in apps.iter().take(5) {
            println!("- {} (Processo: {}, Tem Ícone: {})", app.name, app.process, !app.icon_base64.is_empty());
        }
        assert!(!apps.is_empty(), "Deveria encontrar pelo menos um aplicativo no Windows");
    }
}
