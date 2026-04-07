import { check as updaterCheck, type Update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import logger from '$lib/stores/logger';

let update: Update | null = null;

async function check() {
	update = await updaterCheck();
	return update;
}

async function download(updateFromCheck: Update): Promise<GuiUpdateDownload> {
	let contentLength = 0;
	let downloaded = 0;
	await updateFromCheck.download((event) => {
		switch (event.event) {
			case 'Started':
				contentLength = event.data.contentLength as number;
				logger.info('Downloading...');
				break;
			case 'Progress':
				downloaded += event.data.chunkLength;
				let percentage = Math.floor((downloaded / contentLength) * 100);
				logger.update('Downloading... {}%', percentage);
				break;
			case 'Finished':
				logger.info(`Update ${updateFromCheck.version} is ready to install.`);
				break;
		}
	});

	return { install };
}

async function install() {
	await update?.install();
	await relaunch();
}

export default { check, download };
