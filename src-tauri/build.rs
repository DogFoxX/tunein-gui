fn main() {
   // Only link to stdc++ on non-Windows targets
    if !cfg!(target_env = "msvc") && !cfg!(target_env = "gnu") && !cfg!(target_os = "windows") {
        println!("cargo:rustc-link-lib=dylib=stdc++");
    }
    tauri_build::build()
}