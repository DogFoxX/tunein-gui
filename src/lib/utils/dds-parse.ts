import parse from 'parse-dds';
import decodeDXT from 'decode-dxt';
import { invoke } from '@tauri-apps/api/core';
import { get } from 'svelte/store';
import { settings } from '$lib/stores/global';
import { appDataDir } from '@tauri-apps/api/path';

export async function ddsToDataUrl(path: string): Promise<string> {
	// Fetch the DDS file (works for local/public assets or remote URLs)
	const res = await fetch(path);

	const buf = await res.arrayBuffer();

	// Parse DDS header + mipmaps
	const dds = parse(buf);
	console.log(buf);
	const image = dds.images[0];
	const { offset, length, shape } = image;

	// Decode DXT5 compressed data → raw RGBA
	const rgba = decodeDXT(new DataView(buf, offset, length), shape[0], shape[1]);

	// Paint to canvas
	const canvas = document.createElement('canvas');
	canvas.width = shape[0];
	canvas.height = shape[1];
	const ctx = canvas.getContext('2d')!;
	const imgData = ctx.createImageData(shape[0], shape[1]);
	imgData.data.set(new Uint8ClampedArray(rgba));
	ctx.putImageData(imgData, 0, 0);

	// Export to base64 PNG
	return canvas.toDataURL('image/png');
}

export async function convertToDds(inputFile: string, outputDir: string) {
	const saved = await invoke<string>('convert_to_dds', {
		inputPath: inputFile,
		outputDir
	});
	console.log('DDS saved at:', saved);
}

export async function showDDSImage(inputPath: string): Promise<string> {
	return await invoke('dds_to_png_base64', {
		inputPath
	});
}

export async function convertImageToDds(inputPath: string) {
	await invoke('convert_to_dds', {
		inputPath,
		outputDir: get(settings).workingDir ?? (await appDataDir())
	});
}
