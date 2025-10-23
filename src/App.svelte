<script lang="ts">
	import { onMount } from 'svelte';
	import { settings, settingsOpen, tableState } from '$lib/stores/settings.store';
	import { register } from '@tauri-apps/plugin-global-shortcut';
	import { settStore, tableStore } from '$lib/utils/settings';
	import { getTuneinCrewLatest, guiUpdate } from '$lib/utils/updates';
	import { check } from '@tauri-apps/plugin-updater';
	import { openXML } from '$lib/utils/dialog';
	import logger from '$lib/stores/logger';
	import Main from '$lib/components/main';
	import Settings from '$lib/components/settings.svelte';
	import Titlebar from '$lib/components/titlebar.svelte';
	import Modal from '$lib/components/modal.svelte';
	import { exists } from '@tauri-apps/plugin-fs';
	import { extname, join } from '@tauri-apps/api/path';

	// import { listen } from '@tauri-apps/api/event';

	// listen<string>('open-tuneingui', (event) => {
	// 	const filePath = event.payload;
	// 	logger.info(`Received .tuneingui file: ${filePath}`);
	// 	// handle logic here
	// });

	// logger.info(`Received .tuneingui file: ${window.openedFile}`);

	onMount(async () => {
		settings.set(await settStore.init());
		tableState.set(await tableStore.init());

		if ($settings.autoUpdate.gui) {
			const update = await check();

			if (update) {
				logger.info(`Found a new version of Tunein GUI: ${update.version}.`);
				await guiUpdate.download(update);
			}
		}

		if (!$settings.fmodDir || !$settings.tuneinCrew.dir || !$settings.cwd) {
			$settingsOpen = true;
		}

		if ($settings.tuneinCrew.dir) {
			extname($settings.tuneinCrew.dir)
				.then((ext) => {
					return ($settingsOpen = ext !== '');
				})
				.catch(() => {
					return;
				});

			const tuneinCrewDir = await join($settings.tuneinCrew.dir, 'TuneinCrew.exe');
			const tuneinCrewExist = await exists(tuneinCrewDir);

			if (!tuneinCrewExist) return ($settingsOpen = true);

			if ($settings.autoUpdate.tuneinCrew) {
				const version = await getTuneinCrewLatest($settings.tuneinCrew.version);

				if (version) {
					$settings.tuneinCrew = {
						...$settings.tuneinCrew,
						version
					};
					await settStore.set($settings);
				}
			}
		}
	});

	register('CommandOrControl+I', async ({ state }) => {
		if (state === 'Released') await openXML();
		return;
	});
</script>

<Titlebar />
<Main />
{#if $settingsOpen}
	<Modal>
		<Settings />
	</Modal>
{/if}
