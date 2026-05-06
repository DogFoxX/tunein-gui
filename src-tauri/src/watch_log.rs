use std::{
    collections::HashMap,
    fs::File,
    io::{BufRead, BufReader, Seek, SeekFrom},
    sync::Mutex,
    sync::Arc,
    thread,
    time::Duration,
};

use tauri::{AppHandle, Emitter, State};

pub struct WatchState {
    pub running: Arc<Mutex<HashMap<String, bool>>>,
}

#[tauri::command]
pub fn start_log_watch(
    app: AppHandle,
    path: String,
    state: State<WatchState>,
) -> Result<(), String> {
    let mut running = state.running.lock().unwrap();

    // Prevent duplicate watchers
    if running.get(&path).copied().unwrap_or(false) {
        return Ok(());
    }

    running.insert(path.clone(), true);

    let app_handle = app.clone();
    let state_map = state.running.clone();

    thread::spawn(move || {
        let file = match File::open(&path) {
            Ok(f) => f,
            Err(e) => {
                let _ = app_handle.emit("log-error", e.to_string());
                return;
            }
        };

        let mut reader = BufReader::new(file);

        // Start at end (like tail -f)
        let mut position = reader.seek(SeekFrom::End(0)).unwrap_or(0);

        loop {
            // Check stop flag
            {
                let running = state_map.lock().unwrap();
                if !running.get(&path).copied().unwrap_or(false) {
                    break;
                }
            }

            let mut line = String::new();

            match reader.read_line(&mut line) {
                Ok(bytes) if bytes > 0 => {
                    position += bytes as u64;

                    let clean = line.trim();

                    // Skip empty lines
                    if clean.is_empty() {
                        continue;
                    }

                    // Only process "Debug: " lines
                    if let Some(stripped) = clean.strip_prefix("Debug: ") {
                        let message = stripped.trim().to_string();

                        if !message.is_empty() {
                            let _ = app_handle.emit("log-line", message);
                        }
                    }
                }

                Ok(_) => {
                    // Handle log rotation (file reset/truncate)
                    if let Ok(meta) = std::fs::metadata(&path) {
                        if meta.len() < position {
                            position = 0;
                            let _ = reader.seek(SeekFrom::Start(0));
                        }
                    }

                    thread::sleep(Duration::from_millis(200));
                }

                Err(_) => {
                    thread::sleep(Duration::from_millis(200));
                }
            }
        }
    });

    Ok(())
}

#[tauri::command]
pub fn stop_log_watch(path: String, state: State<WatchState>) {
    let mut running = state.running.lock().unwrap();
    running.insert(path, false);
}