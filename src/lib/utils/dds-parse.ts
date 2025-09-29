import { invoke } from '@tauri-apps/api/core';

export async function showDDSImage(inputPath: string): Promise<string> {
	return await invoke('dds_to_png_base64', {
		inputPath
	});
}

export async function convertImageToDds(inputPath: string, outputDir?: string) {
	await invoke('convert_to_dds', {
		inputPath,
		outputDir
	});
}
