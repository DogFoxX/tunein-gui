<script lang="ts">
	// Svelte Imports
	import { onMount } from 'svelte';

	// Tauri Imports
	import { join } from '@tauri-apps/api/path';
	import { exists } from '@tauri-apps/plugin-fs';

	// Components
	import { Console, Titlebar } from '$lib/components/window';
	import { Modal, RadioConfigModal, SettingsModal } from '$lib/components/modal';
	import { HomeTab, RadioTab } from '$lib/components/tabs';

	// Stores
	import { radioData, settings, tabs } from '$lib/stores';
	import logger from '$lib/utils/logger';

	// Utils
	import { guiUpdater, tuneinCrewUpdater } from '$lib/utils/updates';
	let updater = $state<GuiUpdateDownload | null>(null);

	onMount(async () => {
		const tuneinCrewPath = settings.state.tuneinCrew.dir
			? await join(settings.state.tuneinCrew.dir, 'TuneinCrew.exe')
			: null;
		const fmodPath = settings.state.fmodDir
			? await join(settings.state.fmodDir, 'fmod_designercl.exe')
			: null;

		const tuneinCrewExist = tuneinCrewPath ? await exists(tuneinCrewPath) : null;
		const fmodExist = fmodPath ? await exists(fmodPath) : null;

		if (!tuneinCrewExist || !fmodExist) return settings.open();

		if (settings.state.autoUpdate || settings.state.tuneinCrew.autoUpdate) {
			logger.info('Looking for updates...');

			const guiUpdate = settings.state.autoUpdate ? await guiUpdater.check() : null;

			if (guiUpdate) {
				logger.info(`Found a new version of Tunein GUI: ${guiUpdate.version}.`);
				updater = await guiUpdater.download(guiUpdate);
			}

			const tuneinCrewUpdate = settings.state.tuneinCrew.autoUpdate
				? await tuneinCrewUpdater.check(settings.tuneinCrewVersion)
				: null;

			if (tuneinCrewUpdate) {
				logger.info(`Found a new version of Tunein Crew: ${tuneinCrewUpdate.tag_name}.`);

				const version = await tuneinCrewUpdater.downloadAndInstall({
					updateFromCheck: tuneinCrewUpdate
				});

				if (version) {
					settings.tuneinCrewVersion = version;
				}
			}

			if (!guiUpdate && !tuneinCrewUpdate) logger.info('No Updates Found');
		}
	});

	let ActiveTab = $derived(
		!tabs.state.length || !tabs.state.some(({ active }) => active) ? HomeTab : RadioTab
	);
</script>

{#if settings.state}
	<Titlebar {updater} />

	<main
		class="absolute top-10 bottom-0 left-0 right-0 flex flex-col rounded-t-lg overflow-hidden"
	>
		<div class="grow rounded-t-lg overflow-hidden">
			<ActiveTab />
		</div>
		<Console consoleDefaultOpen={settings.state.logsDefaultOpen} />
		<!-- Modals -->
		<Modal
			components={SettingsModal}
			active="Settings"
			bind:open={settings.isOpen}
			class="h-158 w-220"
		></Modal>
		<Modal
			components={{ RadioConfigModal }}
			header={radioData.configurer.header}
			bind:open={radioData.configurer.open}
			class="h-158 w-220"
		/>
	</main>
{/if}

<style>
</style>
