import { fetch } from '@tauri-apps/plugin-http';
import { type } from '@tauri-apps/plugin-os';
import { writeFile, remove, mkdir } from '@tauri-apps/plugin-fs';
import { tempDir, join, dirname } from '@tauri-apps/api/path';
import { unzipSync } from 'fflate';
import { settings } from '$lib/stores';
import logger from '$lib/utils/logger';

import { Octokit } from 'octokit';
import type { Endpoints } from '@octokit/types';

type LatestReleaseResponse =
	Endpoints['GET /repos/{owner}/{repo}/releases/latest']['response']['data'];

const octokit = new Octokit();

async function check(currentVersion?: string) {
	const res = await octokit.rest.repos.getLatestRelease({ owner: 'Telonof', repo: 'TuneinCrew' });

	const { tag_name } = res.data;

	if (currentVersion !== undefined && currentVersion === tag_name) {
		return null;
	}

	return res.data;
}

async function checkAndInstall(installLoc?: string) {
	const updateFromCheck = await check();

	if (updateFromCheck) return await downloadAndInstall({ updateFromCheck, installLoc });

	return null;
}

async function downloadAndInstall({
	updateFromCheck,
	installLoc
}: {
	updateFromCheck: LatestReleaseResponse;
	installLoc?: string;
}) {
	const { assets, tag_name } = updateFromCheck;
	const osType = type();

	const zipAsset = assets.find((asset) => {
		const name = asset.name.toLowerCase();
		return osType === 'windows' ? name.includes('windows') : name.includes('linux');
	});

	if (!zipAsset) {
		logger.err('Error installing Tunein Crew', 'No zip asset found in latest release.');
		return null;
	}

	const url = zipAsset.browser_download_url;

	const res = await fetch(url);

	if (!res.ok || !res.body) {
		logger.err('Error installing Tunein Crew', 'Failed to download asset.');
		return null;
	}

	const contentLength = Number(res.headers.get('content-length') || 0);
	let received = 0;

	const reader = res.body.getReader();
	const chunks: Uint8Array[] = [];

	logger.info('Downloading Tunein Crew...');

	while (true) {
		const { done, value } = await reader.read();
		if (done) break;

		chunks.push(value);
		received += value.length;

		if (contentLength) {
			const percent = (received / contentLength) * 100;
			logger.update('Downloading Tunein Crew... {}%', percent.toFixed(0));
		}
	}

	const buffer = new Uint8Array(received);
	let offset = 0;
	for (const chunk of chunks) {
		buffer.set(chunk, offset);
		offset += chunk.length;
	}

	const tmpDir = await tempDir();
	const zipPath = await join(tmpDir, zipAsset.name);

	await writeFile(zipPath, buffer);

	const files = unzipSync(buffer);

	const entries = Object.keys(files);
	const rootFolder = entries.every((p) => p.includes('/')) ? entries[0].split('/')[0] + '/' : '';

	for (const [path, data] of Object.entries(files)) {
		if (!path.startsWith(rootFolder)) continue;

		const relativePath = path.replace(rootFolder, '');
		if (!relativePath) continue;

		const targetDir = installLoc ? installLoc : settings.state.tuneinCrew.dir;
		const outPath = await join(targetDir, relativePath);
		const parentDir = await dirname(outPath);

		await mkdir(parentDir, { recursive: true });

		if (relativePath.endsWith('/')) continue;

		await writeFile(outPath, data);
	}

	await remove(zipPath);

	logger.info('Successfully installed TuneinCrew');

	return tag_name;
}

export default { check, checkAndInstall, downloadAndInstall };
