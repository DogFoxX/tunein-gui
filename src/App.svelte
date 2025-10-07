<script lang="ts">
	import { onMount } from 'svelte';
	import { settings, settingsOpen, store } from '$lib/stores/settings.store';
	import initSettings from '$lib/utils/settings/init';
	import { getLatest } from '$lib/utils/tuneincrew';
	import { exists } from '@tauri-apps/plugin-fs';
	import { getCurrentWindow, type Theme } from '@tauri-apps/api/window';
	import Main from '$lib/components/main';
	import Settings from '$lib/components/settings.svelte';
	import Titlebar from '$lib/components/titlebar.svelte';

	let theme = $state<Theme | null>();

	onMount(async () => {
		await getCurrentWindow().setTheme(null);

		store.set(await initSettings());
		const storeSett = (await $store.get('settings')) as GuiSettings;
		settings.set(storeSett);

		const tuneinExist = await exists($settings.tuneinCrew.dir);

		if (!tuneinExist) {
			const release = await getLatest();
			$settings.tuneinCrew = {
				...$settings.tuneinCrew,
				version: release.tag_name
			};
			await $store.set('settings', $settings);
		}

		if (!$settings.fmodDir) {
			$settingsOpen = true;
		}
	});
</script>

<Titlebar />
<Main />
{#if $settingsOpen}
	<Settings />
{/if}
