<script lang="ts">
	// Svelte Imports
	import { onMount } from 'svelte';

	// Tauri Imports
	import { check } from '@tauri-apps/plugin-updater';
	import { exists } from '@tauri-apps/plugin-fs';
	import { extname, join } from '@tauri-apps/api/path';
	import { listen } from '@tauri-apps/api/event';

	// Utils
	import { settStore, tableStore } from '$lib/utils/settings';
	import { openProfile } from '$lib/utils/dialog';
	import { getTuneinCrewLatest, guiUpdate } from '$lib/utils/updates';

	// Stores
	import { settings, settingsOpen, tableState } from '$lib/stores/settings.store';
	import logger from '$lib/stores/logger';
	import { profileData } from '$lib/stores/global';

	// Components
	import Main from '$lib/components/main';
	import Settings from '$lib/components/settings.svelte';
	import Titlebar from '$lib/components/titlebar.svelte';
	import Modal from '$lib/components/modal.svelte';

	listen<string>('open-tuneingui', async (event) => {
		const filePath = event.payload;
		logger.info(`Loaded Profile: "${filePath.split(/[/\\]/).pop()}"`);
		$profileData = await openProfile(filePath);
	});

	onMount(async () => {
		settings.set(await settStore.init());
		tableState.set(await tableStore.init());

		if (window.openedFile) {
			logger.info(`Loaded Profile: "${window.openedFile.split(/[/\\]/).pop()}"`);
			$profileData = await openProfile(window.openedFile);
		}

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
</script>

<Titlebar />
<Main />
{#if $settingsOpen}
	<Modal>
		<Settings />
	</Modal>
{/if}
