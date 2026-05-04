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

#[derive(Serialize)]
pub struct TrackInfo {
    volume: f32,
}

#[command]
pub async fn get_volume(path_str: &str) -> Result<TrackInfo, String> {
    let path = Path::new(path_str);

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

    // let mut total_samples = 0usize;

    while let Ok(packet) = format.next_packet() {
        match decoder.decode(&packet) {
            Ok(decoded) => {
                let spec = *decoded.spec();
                let mut buf = SampleBuffer::<f32>::new(decoded.capacity() as u64, spec);
                buf.copy_interleaved_ref(decoded);
                rg.process_samples(buf.samples());
                // total_samples += buf.samples().len();
            }
            Err(symphonia::core::errors::Error::IoError(_)) => break,
            Err(_) => continue,
        }
    }

    // let channels: f64 = codec_params.channels.map(|c| c.count() as f64).unwrap_or(2.0);
    // let duration = total_samples as f64 / sample_rate as f64 / channels;
    // let length = format_duration(duration);

    let (gain_db, _peak) = rg.finish();
    let volume: f32 = ((89.0 - gain_db) * 10.0).round() / 10.0;

    Ok(TrackInfo {
        volume
    })
}
