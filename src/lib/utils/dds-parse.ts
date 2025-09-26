import { invoke } from '@tauri-apps/api/core';
import { get } from 'svelte/store';
import { settings } from '$lib/stores/global';
import { appDataDir } from '@tauri-apps/api/path';

export async function showDDSImage(inputPath: string): Promise<string> {
	return await invoke('dds_to_png_base64', {
		inputPath
	});
}

export async function convertImageToDds(inputPath: string) {
	const appDir = await appDataDir();
	await invoke('convert_to_dds', {
		inputPath,
		outputDir: get(settings).cwd ?? `${appDir}\\logo`
	});
}
