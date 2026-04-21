<script lang="ts">
	// Svelte Imports
	import { onMount, type Component } from 'svelte';

	// Tauri Imports
	import { join } from '@tauri-apps/api/path';
	import { exists } from '@tauri-apps/plugin-fs';

	// Components
	import { Console, Titlebar } from '$lib/window';
	import { Modal, Settings, About, RadioConfig } from '$lib/window/modal';
	import { Home, Radio } from '$lib/tabs';

	// Stores
	import { settings, tabStore } from '$lib/stores';
	import radioDataTabs from '$lib/stores/radio-data.store';
	import logger from '$lib/stores/logger';

	// Utils
	import { guiUpdater, tuneinCrewUpdater } from '$lib/utils/updates';

	const { settingsOpen } = settings;
	const { radioConfigurer } = radioDataTabs;
	let updater = $state<GuiUpdateDownload | null>(null);

	onMount(async () => {
		settings.set(await settings.init());

		const tuneinCrewPath = $settings.tuneinCrew.dir
			? await join($settings.tuneinCrew.dir, 'TuneinCrew.exe')
			: null;
		const fmodPath = $settings.fmodDir
			? await join($settings.fmodDir, 'fmod_designercl.exe')
			: null;

		const tuneinCrewExist = tuneinCrewPath ? await exists(tuneinCrewPath) : null;
		const fmodExist = fmodPath ? await exists(fmodPath) : null;

		if (!tuneinCrewExist || !fmodExist) return settingsOpen.set(true);

		if ($settings.autoUpdate || $settings.tuneinCrew.autoUpdate) {
			logger.info('Looking for updates...');

			const guiUpdate = $settings.autoUpdate ? await guiUpdater.check() : null;

			if (guiUpdate) {
				logger.info(`Found a new version of Tunein GUI: ${guiUpdate.version}.`);
				updater = await guiUpdater.download(guiUpdate);
			}

			const tuneinCrewUpdate = $settings.tuneinCrew.autoUpdate
				? await tuneinCrewUpdater.check($settings.tuneinCrew.version)
				: null;

			if (tuneinCrewUpdate) {
				logger.info(`Found a new version of Tunein Crew: ${tuneinCrewUpdate.tag_name}.`);

				const version = await tuneinCrewUpdater.downloadAndInstall({
					updateFromCheck: tuneinCrewUpdate
				});

				if (version) {
					$settings.tuneinCrew = {
						...$settings.tuneinCrew,
						version
					};
					await settings.save($settings);
				}
			}

			if (!guiUpdate && !tuneinCrewUpdate) logger.info('No Updates Found');
		}
	});
</script>

{#if $settings}
	<Titlebar {updater} />

	<main
		class="absolute top-10 bottom-0 left-0 right-0 flex flex-col rounded-t-lg overflow-hidden"
	>
		<div class="grow rounded-t-lg overflow-hidden">
			{#if !$tabStore.length || !$tabStore.some(({ active }) => active)}
				<Home />
			{:else}
				<Radio />
			{/if}
		</div>
		<Console consoleDefaultOpen={$settings.logsDefaultOpen} />
		<!-- Modals -->
		<Modal
			components={{ Settings, About }}
			active="Settings"
			bind:open={$settingsOpen}
			class="h-150 w-220"
		></Modal>
		<Modal
			components={{ RadioConfig }}
			header={$radioConfigurer.header}
			bind:open={$radioConfigurer.open}
			class="h-150 w-220"
		/>
	</main>
{/if}

<style>
</style>
