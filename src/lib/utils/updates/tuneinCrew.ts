import { get } from 'svelte/store';
import { fetch as tauriFetch } from '@tauri-apps/plugin-http';
import axios from 'axios';
import { type } from '@tauri-apps/plugin-os';
import { writeFile, remove, mkdir } from '@tauri-apps/plugin-fs';
import { tempDir, join, dirname } from '@tauri-apps/api/path';
import { unzipSync } from 'fflate';
import { settings } from '$lib/stores/settings.store';
import logger from '$lib/stores/logger';

const osType = type();

const axiosInstance = axios.create({
	adapter: 'fetch',
	env: { fetch: tauriFetch }
});

async function getLatest(currentVersion: string | null): Promise<string | null> {
	logger.info('Getting latest TuneinCrew release...');

	const metaRes = await axiosInstance.get(
		`https://api.github.com/repos/Telonof/TuneinCrew/releases/latest`,
		{ headers: { 'User-Agent': 'MyApp' } }
	);

	if (metaRes.status !== 200) {
		logger.err(metaRes.statusText);
	}
	const release = metaRes.data;

	if (currentVersion === release.tag_name) {
		logger.info(
			`Latest TuneinCrew already installed - Release: ${release.tag_name} | Installed: ${currentVersion}`
		);

		return null;
	}

	const zipAsset = release.assets.find((asset: any) => {
		if (osType === 'windows') {
			return asset.name.toLowerCase().includes('windows');
		} else if (osType === 'linux') {
			return asset.name.toLowerCase().includes('linux');
		}
	});

	if (!zipAsset) throw new Error('No zip asset found in latest release');

	logger.info(`Found: TuneinCrew ${release.tag_name}. Downloading...`);

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

	logger.info('Successfully installed TuneinCrew');

	return release.tag_name;
}

export default getLatest;
