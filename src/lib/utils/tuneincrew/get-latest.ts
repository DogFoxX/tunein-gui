import { get } from 'svelte/store';
import { fetch as tauriFetch } from '@tauri-apps/plugin-http';
import axios from 'axios';
import { writeFile, remove, mkdir } from '@tauri-apps/plugin-fs';
import { tempDir, join, dirname } from '@tauri-apps/api/path';
import { unzipSync } from 'fflate';
import { settings } from '$lib/stores/settings.store';
import { stdOut } from '$lib/stores/global';
import formatCurrentTime from '../format-time';

const axiosInstance = axios.create({
	adapter: 'fetch',
	env: { fetch: tauriFetch }
});

async function getLatest() {
	stdOut.update((arr) => {
		const newarr = [
			...arr,
			`${formatCurrentTime()} INFO: Getting latest TuneinCrew release...`
		];
		return Array.from(new Set(newarr));
	});

	const metaRes = await axiosInstance.get(
		`https://api.github.com/repos/Telonof/TuneinCrew/releases/latest`,
		{ headers: { 'User-Agent': 'MyApp' } }
	);

	if (metaRes.status !== 200) {
		stdOut.update((arr) => {
			const newarr = [...arr, `${formatCurrentTime()} ERR: ${metaRes.statusText}`];
			return Array.from(new Set(newarr));
		});
	}
	const release = metaRes.data;

	const zipAsset = release.assets.find((asset: any) =>
		asset.name.toLowerCase().includes('windows')
	);
	if (!zipAsset) throw new Error('No zip asset found in latest release');

	stdOut.update((arr) => {
		const newarr = [
			...arr,
			`${formatCurrentTime()} INFO: Found: TuneinCrew ${release.tag_name}. Downloading...`
		];
		return Array.from(new Set(newarr));
	});

	const zipRes = await axiosInstance.get(zipAsset.browser_download_url, {
		responseType: 'arraybuffer'
	});

	const buffer = new Uint8Array(zipRes.data);
	const tmpDir = await tempDir();
	const zipPath = await join(tmpDir, zipAsset.name);

	await writeFile(zipPath, buffer);

	const files = unzipSync(buffer);

	const firstPath = Object.keys(files)[0];
	const rootFolder = firstPath.split('/')[0] + '/';

	for (const [path, data] of Object.entries(files)) {
		if (!path.startsWith(rootFolder)) continue;

		const relativePath = path.replace(rootFolder, '');
		if (!relativePath) continue;

		const targetDir = await dirname(get(settings).tuneinCrew.dir);
		const outPath = await join(targetDir, relativePath);
		const parentDir = await dirname(outPath);
		await mkdir(parentDir, { recursive: true });

		if (relativePath.endsWith('/')) continue;

		await writeFile(outPath, data);
	}

	await remove(zipPath);

	stdOut.update((arr) => {
		const newarr = [...arr, `${formatCurrentTime()} INFO: Successfully installed TuneinCrew.`];
		return Array.from(new Set(newarr));
	});

	return release;
}

export default getLatest;
