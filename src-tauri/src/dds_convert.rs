use std::fs::File;
use std::io::Cursor;
use std::path::Path;

use base64::{Engine as _, engine::general_purpose};
use ddsfile::Dds;
use image::{DynamicImage, ImageFormat, imageops::FilterType};
use image_dds::{dds_from_image, image_from_dds};
use tauri::command;

/// Convert PNG/JPG/BMP → DXT5 DDS
#[command]
pub fn convert_to_dds(input_path: String, output_dir: String) -> Result<(), String> {
    // Load input image
    let img: DynamicImage = image::open(&input_path)
        .map_err(|e: image::ImageError| format!("Failed to open image: {}", e))?;

    // Resize to 512x512
    let resized: DynamicImage = img.resize_exact(512, 512, FilterType::Lanczos3);

    // Convert DynamicImage → RGBA8 buffer
    let rgba: image::ImageBuffer<image::Rgba<u8>, Vec<u8>> = resized.to_rgba8();

    // Encode to DDS (BC3 = DXT5)
    let dds: Dds = dds_from_image(
        &rgba,
        image_dds::ImageFormat::BC3RgbaUnorm,
        image_dds::Quality::Normal,
        image_dds::Mipmaps::FromSurface,
    )
    .map_err(|e: image_dds::CreateDdsError| format!("Failed to encode as DXT5: {:?}", e))?;

    // Always save as "<directory>/thumb.dds"
    let output_path: std::path::PathBuf = Path::new(&output_dir).join("thumb.dds");

    let mut file: File = File::create(&output_path)
        .map_err(|e: std::io::Error| format!("Failed to create DDS file: {}", e))?;
    dds.write(&mut file)
        .map_err(|e: ddsfile::Error| format!("Failed to write DDS file: {}", e))?;

    Ok(())
}

/// Convert DDS → Base64 PNG string (usable in <img src="...">)
#[command]
pub fn dds_to_png_base64(input_path: String) -> Result<String, String> {
    // Read DDS from disk
    let mut file: File = File::open(&input_path)
        .map_err(|e: std::io::Error| format!("Failed to open DDS file: {}", e))?;
    let dds: Dds = Dds::read(&mut file)
        .map_err(|e: ddsfile::Error| format!("Failed to parse DDS: {:?}", e))?;

    // Decode DDS (take mipmap level 0, full resolution)
    let rgba: image::ImageBuffer<image::Rgba<u8>, Vec<u8>> =
        image_from_dds(&dds, 0).map_err(|e: image_dds::error::CreateImageError| {
            format!("Failed to decode DDS: {:?}", e)
        })?;

    // Wrap into DynamicImage so we can re-encode as PNG
    let img: DynamicImage = DynamicImage::ImageRgba8(rgba);

    // Encode PNG into memory
    let mut buf: Vec<u8> = Vec::new();
    let mut cursor: Cursor<&mut Vec<u8>> = Cursor::new(&mut buf);
    img.write_to(&mut cursor, ImageFormat::Png)
        .map_err(|e: image::ImageError| format!("Failed to encode PNG: {}", e))?;

    // Convert to Base64 data URL
    let base64_str: String = general_purpose::STANDARD.encode(&buf);
    Ok(format!("data:image/png;base64,{}", base64_str))
}
