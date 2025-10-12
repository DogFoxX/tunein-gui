use lofty::prelude::*;
use lofty::probe::Probe;

use symphonia::core::io::MediaSourceStream;
use symphonia::core::audio::SampleBuffer;
use symphonia::default::get_probe;
use symphonia::core::formats::FormatOptions;
use symphonia::core::codecs::DecoderOptions;

use replaygain::ReplayGain;

use std::fs::File;
use std::path::Path;
use serde::Serialize;
use tauri::command;
use rayon::prelude::*;

#[derive(Serialize)]
pub struct TrackInfo {
    file: String,
    name: String,
    artist: Option<String>,
    year: Option<u32>,
    length: String,
    volume: f32
}

#[command]
pub fn get_audio_info(paths: Vec<String>, target_volume: f32) -> Result<Vec<TrackInfo>, String> {
    // Run in parallel for multiple files
    let results: Vec<Result<TrackInfo, String>> = paths
        .par_iter()
        .map(|path_str| analyze_track(path_str, target_volume))
        .collect();

    // 🔹 Collect only successful results; return first error if any
    let mut output = Vec::new();
    for res in results {
        match res {
            Ok(info) => output.push(info),
            Err(e) => return Err(e), // stop early on first error (optional)
        }
    }

    Ok(output)
}

/// Analyze a single track: tag, duration, volume
fn analyze_track(path_str: &str, target_volume: f32) -> Result<TrackInfo, String> {
    let path = Path::new(path_str);
    let mut name = path
        .file_stem()
        .unwrap_or_default()
        .to_string_lossy()
        .to_string();
    let mut artist = None;
    let mut year = None;

    // Read tags (Lofty)
    if let Ok(tagged) = Probe::open(&path).and_then(|p| p.read()) {
        if let Some(tag) = tagged.primary_tag() {
            if let Some(t) = tag.get_string(&lofty::tag::ItemKey::TrackTitle) {
                name = t.to_string();
            }
            artist = tag.get_string(&lofty::tag::ItemKey::TrackArtist).map(|a| a.to_string());
            year = tag.year();
        }
    }

    // Decode and analyze (Symphonia + ReplayGain)
    let file = File::open(&path).map_err(|e| e.to_string())?;
    let mss = MediaSourceStream::new(Box::new(file), Default::default());

    let probed = get_probe()
        .format(&Default::default(), mss, &FormatOptions::default(), &Default::default())
        .map_err(|e| e.to_string())?;

    let mut format = probed.format;
    let track = format.default_track().ok_or("no default track")?.clone();
    let codec_params = &track.codec_params;
    let sample_rate = codec_params.sample_rate.ok_or("missing sample rate")?;

    let mut rg = ReplayGain::new(sample_rate as usize)
        .ok_or("Failed to create ReplayGain analyzer")?;

    let mut decoder = symphonia::default::get_codecs()
        .make(&codec_params, &DecoderOptions::default())
        .map_err(|e| e.to_string())?;

    let mut total_samples = 0usize;

    while let Ok(packet) = format.next_packet() {
        match decoder.decode(&packet) {
            Ok(decoded) => {
                let spec = *decoded.spec();
                let mut buf = SampleBuffer::<f32>::new(decoded.capacity() as u64, spec);
                buf.copy_interleaved_ref(decoded);
                rg.process_samples(buf.samples());
                total_samples += buf.samples().len();
            }
            Err(symphonia::core::errors::Error::IoError(_)) => break,
            Err(_) => continue,
        }
    }

    let channels: f64 = codec_params.channels.map(|c| c.count() as f64).unwrap_or(2.0);
    let duration = total_samples as f64 / sample_rate as f64 / channels;
    let length = format_duration(duration);

    let (gain_db, _peak) = rg.finish();
    let measured_volume: f32 = ((89.0 - gain_db) * 10.0).round() / 10.0;
    let volume: f32 = ((target_volume - measured_volume) * 10.0).round() / 10.0;

    Ok(TrackInfo {
        file: path_str.to_string(),
        name,
        artist,
        year,
        length,
        volume
    })
}

// Format calculated duration to mm:ss
fn format_duration(seconds: f64) -> String {
    let total_seconds = seconds.round() as u64;
    let minutes = total_seconds / 60;
    let seconds = total_seconds % 60;
    format!("{:02}:{:02}", minutes, seconds)
}
