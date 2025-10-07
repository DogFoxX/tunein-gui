fn main() {
    println!("cargo:rustc-link-lib=dylib=stdc++");
    tauri_build::build()
}