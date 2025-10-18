<script lang="ts">
	import { onMount } from 'svelte';
	import { settings, settingsOpen } from '$lib/stores/settings.store';
	import { register } from '@tauri-apps/plugin-global-shortcut';
	import { store, tableOpts } from '$lib/utils/settings';
	import { getLatest, guiUpdate } from '$lib/utils/updates';
	import { check } from '@tauri-apps/plugin-updater';
	import { openXML } from '$lib/utils/dialog';
	import logger from '$lib/stores/logger';
	import Main from '$lib/components/main';
	import Settings from '$lib/components/settings.svelte';
	import Titlebar from '$lib/components/titlebar.svelte';
	import Modal from '$lib/components/modal.svelte';

	async function handleUpdates() {
		if ($settings.autoUpdate.tuneinCrew) {
			const version = await getLatest($settings.tuneinCrew.version);

			if (version) {
				$settings.tuneinCrew = {
					...$settings.tuneinCrew,
					version
				};
				await store.set($settings);
			}
		}

		if ($settings.autoUpdate.gui) {
			const update = await check();

			if (update) {
				logger.info(`Found a new version of Tunein GUI: ${update.version}.`);
				await guiUpdate.download(update);
			}
		}
	}

	onMount(async () => {
		await store.init();
		settings.set(await store.get());

		if (!$settings.fmodDir || !$settings.tuneinCrew.dir || !$settings.cwd) {
			$settingsOpen = true;
		}
	});

	$effect(() => {
		handleUpdates();
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
