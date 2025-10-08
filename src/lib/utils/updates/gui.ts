import type { Update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import logger from '$lib/stores/logger';
import { updateAvailable } from '$lib/stores/global';

let update: Update;

async function download(updateFromCheck: Update) {
	await updateFromCheck.download((event) => {
		switch (event.event) {
			case 'Started':
				logger.info(
					`Found a new version of Tunein GUI: ${updateFromCheck.version}. Downloading...`
				);
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
