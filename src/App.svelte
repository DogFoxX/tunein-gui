<script lang="ts">
	import { onMount } from 'svelte';
	import { settings, settingsOpen, store } from '$lib/stores/settings.store';
	import { register } from '@tauri-apps/plugin-global-shortcut';
	import initSettings from '$lib/utils/settings';
	import { getLatest, guiUpdate } from '$lib/utils/updates';
	import { getCurrentWindow, type Theme } from '@tauri-apps/api/window';
	import { check } from '@tauri-apps/plugin-updater';
	import { saveXML, openXML } from '$lib/utils/dialog';
	import logger from '$lib/stores/logger';
	import Main from '$lib/components/main';
	import Settings from '$lib/components/settings.svelte';
	import Titlebar from '$lib/components/titlebar.svelte';
	import Modal from '$lib/components/modal.svelte';

	let theme = $state<Theme | null>();

	onMount(async () => {
		store.set(await initSettings());
		const storeSett = (await $store.get('settings')) as GuiSettings;
		settings.set(storeSett);

		const update = await check();

		if (update) {
			logger.info(`Found a new version of Tunein GUI: ${update.version}.`);
			await guiUpdate.download(update);
		}

		await getCurrentWindow().setTheme(null);

		// TuneinCrew release check - uncomment for produnction
		// const version = await getLatest($settings.tuneinCrew.version);

		// if (version) {
		// 	$settings.tuneinCrew = {
		// 		...$settings.tuneinCrew,
		// 		version
		// 	};
		// 	await $store.set('settings', $settings);
		// }

		if (!$settings.fmodDir) {
			$settingsOpen = true;
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
