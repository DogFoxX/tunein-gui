use tauri::{AppHandle, Manager, WebviewWindowBuilder, Url, Emitter};

mod dds_convert;
mod measure_volume;
use std::path::PathBuf;

fn normalize_arg_to_path(arg: &str) -> Option<PathBuf> {
    // Trim quotes (Windows can pass them)
    let cleaned = arg.trim_matches('"');

    // Try parsing as file:// URL
    if let Ok(url) = Url::parse(cleaned) {
        if let Ok(path) = url.to_file_path() {
            return Some(path);
        }
    }

    // Otherwise treat as direct path
    let path = PathBuf::from(cleaned);
    if path.exists() {
        Some(path)
    } else {
        None
    }
}

fn emit_opened_file(app: &AppHandle, file: Option<PathBuf>) {
    if let Some(file) = file {
        let file_js = file.to_string_lossy().replace('\\', "\\\\");
        let script = format!("window.openedFile = \"{file_js}\";");
        if let Some(window) = app.get_webview_window("main") {
            let _ = window.eval(&script);
        } else {
            tauri::WebviewWindowBuilder::new(app, "main", Default::default())
                .initialization_script(&script)
                .build()
                .expect("failed to create window");
        }
    }
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_shellx::init(true))
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_single_instance::init(|app, args, _cwd| {
            let _ = app
                .get_webview_window("main")
                .expect("no main window")
                .set_focus();
            
        }))
        .plugin(tauri_plugin_window_state::Builder::new().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            {
                let mut file: Option<PathBuf> = None;

            for arg in std::env::args().skip(1) {
                if let Some(path) = normalize_arg_to_path(&arg) {
                    file = Some(path);
                    break;
                }
            }

            emit_opened_file(&app.handle(), file);
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            dds_convert::convert_to_dds,
            dds_convert::dds_to_png_base64,
            measure_volume::get_volume
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
