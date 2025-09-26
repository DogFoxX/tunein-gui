<script lang="ts">
	import { onMount } from 'svelte';
	import { settings } from '$lib/stores/global';
	import { getLatest } from '$lib/utils/tuneincrew';
	import { appDataDir } from '@tauri-apps/api/path';
	import { exists } from '@tauri-apps/plugin-fs';
	import Main from '$lib/components/main';
	import Settings from '$lib/components/settings.svelte';

	onMount(async () => {
		let tuneinCrewDir =
			$settings.tuneinCrewDir ?? `${await appDataDir()}\\TuneinCrew\\TuneinCrew.exe`;

		const found = await exists(tuneinCrewDir);

		if (!found) {
			return getLatest(`${await appDataDir()}\\TuneinCrew`);
		}

		return;
	});
</script>

<Main />
<!-- <Settings /> -->
