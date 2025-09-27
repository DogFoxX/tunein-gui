use chrono::{Local, Timelike};
use tauri::{AppHandle, Emitter};
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::Command;

/// Format timestamp as `[HH:MM:SS]`
fn timestamp() -> String {
    let now = Local::now();
    format!(
        "[{:02}:{:02}:{:02}]",
        now.hour(),
        now.minute(),
        now.second()
    )
}

#[tauri::command]
pub async fn run_tuneincrew(
    app: AppHandle,
    exe_path: String,
    arg: String,
) -> Result<String, String> {
    // Spawn the TuneinCrew process
    let mut child = Command::new(&exe_path)
        .arg(&arg)
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .spawn()
        .map_err(|e| format!("{} ERR: Failed to start TuneinCrew: {}", timestamp(), e))?;

    // --- 1️⃣ Capture stdout ---
    if let Some(stdout) = child.stdout.take() {
        let app_handle = app.clone();
        tokio::spawn(async move {
            let reader = BufReader::new(stdout);
            let mut lines = reader.lines();

            while let Ok(Some(line)) = lines.next_line().await {
                let _ = app_handle.emit("tuneincrew-std", line);
            }
        });
    }

    let app_handle = app.clone();
    tokio::spawn(async move {
        let _ = child.wait().await;
        let _ = app_handle.emit(
            "tuneincrew-finished",
            format!("{} INFO: TuneinCrew finished.", timestamp()),
        );
    });
    Ok(format!("{} INFO: Started TuneinCrew.", timestamp()).into())
}
