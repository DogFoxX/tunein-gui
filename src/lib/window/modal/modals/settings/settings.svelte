<script lang="ts">
	// Svelte Imports
	import { scale, fade } from 'svelte/transition';

	// Tauri Imports
	import { open } from '@tauri-apps/plugin-dialog';
	import { dirname, join, resolveResource } from '@tauri-apps/api/path';
	import { exists, mkdir, readFile, writeFile } from '@tauri-apps/plugin-fs';

	// Utils
	import { unzipSync } from 'fflate';
	import { tuneinCrewUpdater } from '$lib/utils/updates';

	// Toggle Component Asset
	import { Toggle } from '$assets';

	// Stores
	import { settings } from '$lib/stores';

	// Icons
	import { CheckCircle, CloseCircle, FolderOpen } from '@solar-icons/svelte/Bold';

	// Loaders
	import { Spinner } from '$assets/loaders';

	let tempSettings = $state($settings);
	let saved = $derived(JSON.stringify(tempSettings) === JSON.stringify($settings));

	let tuneincrewInstalled = $state<boolean>();
	let tuneinCrewInstalling = $state<Promise<string | null>>();
	let fmodInstalled = $state<boolean>();
	let fmodInstalling = $state<Promise<boolean>>();

	async function installTuneinCrew() {
		tuneinCrewInstalling = tuneinCrewUpdater.checkAndInstall(tempSettings.tuneinCrew.dir);

		const version = await tuneinCrewInstalling;

		if (version) {
			$settings.tuneinCrew.version = version;
			await settings.save($settings);
		}

		const tuneinCrewPath = await join(tempSettings.tuneinCrew.dir!, 'TuneinCrew.exe');

		tuneincrewInstalled = await exists(tuneinCrewPath);
	}

	async function installFMOD() {
		const fmodZipPath = await resolveResource('resources/FMOD_Designer_4.44.64_Minimal.zip');

		const zipData = await readFile(fmodZipPath);

		const files = unzipSync(zipData);

		const entries = Object.keys(files);
		const rootFolder = entries.every((p) => p.includes('/'))
			? entries[0].split('/')[0] + '/'
			: '';

		for (const [path, data] of Object.entries(files)) {
			if (!path.startsWith(rootFolder)) continue;

			const relativePath = path.replace(rootFolder, '');
			if (!relativePath) continue;

			const outPath = await join(tempSettings.fmodDir!, relativePath);
			const parentDir = await dirname(outPath);

			await mkdir(parentDir, { recursive: true });

			if (relativePath.endsWith('/')) continue;

			await writeFile(outPath, data);
		}

		const fmodFilePath = await join(tempSettings.fmodDir!, 'fmod_designercl.exe');

		return (fmodInstalled = await exists(fmodFilePath));
	}

	$effect(() => {
		join(tempSettings.tuneinCrew!.dir, 'TuneinCrew.exe').then((exePath) => {
			exists(exePath).then((found) => {
				tuneincrewInstalled = found;
			});
		});
	});

	$effect(() => {
		join(tempSettings.fmodDir!, 'fmod_designercl.exe').then((exePath) => {
			exists(exePath).then((found) => {
				fmodInstalled = found;
			});
		});
	});
</script>

<div
	transition:scale={{ start: 0.9, duration: 100 }}
	class="absolute top-8 bottom-2 left-2 right-2 flex flex-col overflow-hidden"
>
	<div class="flex flex-col gap-8 px-28 pb-1 h-full overflow-y-scroll">
		<!-- GUI Settings -->
		<div class="flex flex-col gap-3">
			<h1 class="text-white font-semibold">GUI Behaviour</h1>
			<div class="flex flex-col">
				<div class="flex flex-col gap-2 p-3 border-t border-primary-750">
					<div class="flex flex-col gap-1">
						<div class="flex items-center justify-center gap-20">
							<button
								onclick={() => (tempSettings.autoUpdate = !tempSettings.autoUpdate)}
								class="grow h-full text-sm text-white text-left cursor-pointer"
								tabIndex="-1"
							>
								Auto Update GUI
							</button>

							<Toggle bind:toggled={tempSettings.autoUpdate} />
						</div>
						<span class="text-xs text-primary-400">
							Automatically check for updates when the app launches.
						</span>
					</div>
					<button
						class="w-max px-4 py-1 text-sm text-white bg-primary-750 hover:bg-primary-700 border border-primary-600 rounded-lg transition-colors"
						>Check For Updates</button
					>
				</div>
				<div class="flex flex-col gap-2 p-3 border-t border-primary-750">
					<div class="flex flex-col gap-1">
						<div class="flex items-center justify-center gap-20">
							<button
								onclick={() => (tempSettings.keepTabs = !tempSettings.keepTabs)}
								class="grow h-full text-sm text-white text-left cursor-pointer"
								tabIndex="-1"
							>
								Restore Tabs
							</button>
							<Toggle bind:toggled={tempSettings.keepTabs} />
						</div>
						<span class="text-xs text-primary-400">
							Restore previous opened tabs when the app launches.
						</span>
					</div>
					<button
						class="w-max px-4 py-1 text-sm text-white bg-primary-750 hover:bg-primary-700 border border-primary-600 rounded-lg transition-colors"
						disabled={!tempSettings.keepTabs}>Clear Tabs</button
					>
				</div>
				<div class="flex flex-col gap-2 p-3 border-t border-primary-750">
					<div class="flex flex-col gap-1">
						<div class="flex items-center justify-center gap-20">
							<button
								onclick={() =>
									(tempSettings.logsDefaultOpen = !tempSettings.logsDefaultOpen)}
								class="grow h-full text-sm text-white text-left cursor-pointer"
								tabIndex="-1"
							>
								Logs Default Open
							</button>
							<Toggle bind:toggled={tempSettings.logsDefaultOpen} />
						</div>
						<span class="text-xs text-primary-400">
							Launch with the Logs window open by default.
						</span>
					</div>
				</div>
			</div>
		</div>
		<!-- Tunein Crew Settings -->
		<div class="flex flex-col gap-3">
			<h1 class="text-white font-semibold">Tunein Crew</h1>
			<div class="flex flex-col">
				<div class="flex flex-col gap-2 p-3 border-t border-primary-750">
					<div class="flex flex-col gap-1">
						<div class="flex items-center justify-center gap-20">
							<button
								onclick={() =>
									(tempSettings.tuneinCrew.autoUpdate =
										!tempSettings.tuneinCrew.autoUpdate)}
								class="grow h-full text-sm text-white text-left cursor-pointer"
								tabIndex="-1"
							>
								Auto Update Tunein Crew
							</button>
							<Toggle bind:toggled={tempSettings.tuneinCrew.autoUpdate} />
						</div>
						<span class="text-xs text-primary-400">
							Automatically check for Tunein Crew updates when the app launches.
						</span>
					</div>
					<button
						class="w-max px-4 py-1 text-sm text-white bg-primary-750 hover:bg-primary-700 border border-primary-600 rounded-lg transition-colors"
						>Check For Updates</button
					>
				</div>
				<div class="flex flex-col gap-2 p-3 border-t border-primary-750">
					<div class="flex flex-col gap-1.5">
						<label class="text-sm text-white text-left" for="tuneincrew-path">
							Directory
						</label>
						<div class="flex flex-col">
							<span class="text-xs text-primary-400">
								Set Tunein Crew install directory. Recommended to keep at default.
							</span>
							<span class="text-xs text-primary-400 font-bold">
								If you have a Tunein Crew installation, point to 'TuneinCrew.exe'
								below.
							</span>
						</div>
					</div>
					<div class="flex gap-2 bg-primary-750 border border-primary-600 rounded-lg">
						<input
							bind:value={tempSettings.tuneinCrew!.dir}
							class="size-full px-2 py-1 text-sm text-white"
							type="text"
							id="tuneincrew-path"
							autocomplete="off"
						/>
						<button
							onclick={async () => {
								const path = await open({
									canCreateDirectories: true,
									defaultPath: 'TuneinCrew.exe',
									filters: [
										{
											extensions: ['exe'],
											name: 'TuneinCrew.exe'
										}
									],
									multiple: false,
									title: 'Browse TuneinCrew.exe'
								});

								if (!path) return;

								const dir = await dirname(path);

								tempSettings.tuneinCrew!.dir = dir;
							}}
							class="px-2 text-primary-400 hover:text-white transition-colors"
							title="Browse"
							tabIndex="-1"
						>
							<FolderOpen />
						</button>
					</div>
					<div class="flex items-center gap-4">
						<button
							onclick={installTuneinCrew}
							class="px-4 py-1 text-sm text-white bg-primary-750 hover:bg-primary-700 border border-primary-600 rounded-lg transition-colors"
							disabled={tuneincrewInstalled || tuneinCrewInstalling !== undefined}
						>
							Install
						</button>
						{#if tuneincrewInstalled}
							<div class="flex gap-2">
								<CheckCircle color="var(--color-green-400)" />
								<span class="text-xs text-white">Installed</span>
							</div>
						{:else}
							<div class="flex gap-2">
								<CloseCircle color="var(--color-red-400)" />
								<span class="text-xs text-white">Not Installed</span>
							</div>
						{/if}
						{#await tuneinCrewInstalling}
							<Spinner width={16} height={16} />
						{/await}
					</div>
				</div>
				<div class="flex flex-col gap-2 p-3 border-t border-primary-750">
					<div class="flex flex-col gap-1.5">
						<label class="text-sm text-white text-left" for="fmod-path">
							FMOD v4.44.64 Directory
						</label>
						<div class="flex flex-col">
							<span class="text-xs text-primary-400">
								Set FMOD install directory. Recommended to keep at default.
							</span>
							<span class="text-xs text-primary-400 font-bold">
								If you have FMOD v4.44.64 installed, point to 'fmod_designercl.exe'
								below.
							</span>
						</div>
					</div>
					<div class="flex gap-2 bg-primary-750 border border-primary-600 rounded-lg">
						<input
							bind:value={tempSettings.fmodDir}
							class="size-full px-2 py-1 text-sm text-white"
							type="text"
							id="fmod-path"
							autocomplete="off"
						/>
						<button
							onclick={async () => {
								const path = await open({
									canCreateDirectories: true,
									defaultPath: 'fmod_designercl.exe',
									filters: [
										{
											extensions: ['exe'],
											name: 'fmod_designercl.exe'
										}
									],
									multiple: false,
									title: 'Browse fmod_designercl.exe'
								});

								if (!path) return;

								const dir = await dirname(path);

								tempSettings.fmodDir = dir;
							}}
							class="px-2 text-primary-400 hover:text-white transition-colors"
							title="Browse"
							tabIndex="-1"
						>
							<FolderOpen />
						</button>
					</div>
					<div class="flex items-center gap-4">
						<button
							onclick={() => (fmodInstalling = installFMOD())}
							class="px-4 py-1 text-sm text-white bg-primary-750 hover:bg-primary-700 border border-primary-600 rounded-lg transition-colors"
							disabled={fmodInstalled || fmodInstalling !== undefined}
						>
							Install
						</button>
						{#if fmodInstalled}
							<div class="flex gap-2">
								<CheckCircle color="var(--color-green-400)" />
								<span class="text-xs text-white">Installed</span>
							</div>
						{:else}
							<div class="flex gap-2">
								<CloseCircle color="var(--color-red-400)" />
								<span class="text-xs text-white">Not Installed</span>
							</div>
						{/if}
						{#await fmodInstalling}
							<Spinner width={16} height={16} />
						{/await}
					</div>
				</div>
			</div>
		</div>
	</div>
	<div class="flex items-center justify-end gap-4 min-h-10 px-4">
		{#if !saved}
			<span transition:fade={{ duration: 200 }} class="text-xs text-red-400 animate-pulse"
				>You have unsaved changes!</span
			>
		{/if}
		<div class="flex gap-2">
			<button
				onclick={settings.close}
				class="w-24 py-1 text-sm text-white bg-primary-750 hover:bg-primary-700 border border-primary-600 transition-colors rounded-lg"
				>Cancel</button
			>
			<button
				onclick={async () => {
					await settings.save(tempSettings);
				}}
				class="w-24 py-1 text-sm text-white bg-primary-750 hover:bg-primary-700 border border-primary-600 transition-colors rounded-lg"
				disabled={saved}>Save</button
			>
		</div>
	</div>
</div>

<style>
</style>
