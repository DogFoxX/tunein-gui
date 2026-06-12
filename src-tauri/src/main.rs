// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// Tell the compiler wrapper to link libstdc++ whenever compiling on Linux
#[cfg(target_os = "linux")]
#[link(name = "stdc++")]
extern "C" {}

fn main() {
    // Fix WebKitGTK / Nvidia / Wayland crashes silently for production users
    #[cfg(target_os = "linux")]
    {
        std::env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1");
    }
    
    app_lib::run();
}
