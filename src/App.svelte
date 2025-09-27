<script lang="ts">
	import { onMount } from 'svelte';
	import { settings, settingsOpen, store } from '$lib/stores/settings.store';
	import initSettings from '$lib/utils/settings/init';
	import { getLatest } from '$lib/utils/tuneincrew';
	import { exists } from '@tauri-apps/plugin-fs';
	import Main from '$lib/components/main';
	import Settings from '$lib/components/settings.svelte';

	onMount(async () => {
		$store = await initSettings();
		settings.set((await $store.get('settings')) as GuiSettings);

		let tuneinCrewDir = $settings.tuneinCrew.dir;

		const found = await exists(tuneinCrewDir);

		if (!found) {
			const release = await getLatest();
			$settings.tuneinCrew = {
				...$settings.tuneinCrew,
				version: release.tag_name
			};
			await $store.set('settings', $settings);
		}
	});
</script>

<Main />
{#if $settingsOpen}
	<Settings />
{/if}
