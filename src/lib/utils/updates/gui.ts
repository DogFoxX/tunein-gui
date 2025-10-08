import type { Update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import logger from '$lib/stores/logger';
import { updateAvailable } from '$lib/stores/global';

let update: Update;

async function download(updateFromCheck: Update) {
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
				logger.update('Downmloading... {}%', percentage);
				break;
			case 'Finished':
				logger.info('An Update is ready to install.');
				updateAvailable.set(true);
				break;
		}
	});

	return (update = updateFromCheck);
}

async function install() {
	await update.install();
	await relaunch();
}

const guiUpdate = {
	download,
	install
};

export default guiUpdate;
