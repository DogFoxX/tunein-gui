import { get } from 'svelte/store';
import { fetch as tauriFetch } from '@tauri-apps/plugin-http';
import axios from 'axios';
import { writeFile, remove, mkdir } from '@tauri-apps/plugin-fs';
import { tempDir, join, dirname } from '@tauri-apps/api/path';
import { unzipSync } from 'fflate';
import { settings } from '$lib/stores/settings.store';

const axiosInstance = axios.create({
	adapter: 'fetch',
	env: { fetch: tauriFetch },
	onDownloadProgress(e) {
		console.log('Download progress:', e.loaded, e.total);
	}
});

async function getLatest() {
	const metaRes = await axiosInstance.get(
		`https://api.github.com/repos/Telonof/TuneinCrew/releases/latest`,
		{ headers: { 'User-Agent': 'MyApp' } }
	);
	const release = metaRes.data;

	const zipAsset = release.assets.find((asset: any) =>
		asset.name.toLowerCase().includes('windows')
	);
	if (!zipAsset) throw new Error('No zip asset found in latest release');

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

		const targetDir = get(settings).tuneinCrew.dir;
		const outPath = await join(targetDir, relativePath);
		const parentDir = await dirname(outPath);
		await mkdir(parentDir, { recursive: true });

		if (relativePath.endsWith('/')) continue;

		await writeFile(outPath, data);
	}

	await remove(zipPath);

	return release;
}

export default getLatest;
