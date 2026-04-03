<script lang="ts">
	// Svelte Imports
	import { scale, fade } from 'svelte/transition';

	// Tauti Imports
	import { open } from '@tauri-apps/plugin-dialog';
	import { dirname, join } from '@tauri-apps/api/path';
	import { exists } from '@tauri-apps/plugin-fs';

	// Toggle Component Asset
	import { Toggle } from '$assets';

	// Stores
	import { settings } from '$lib/stores';

	// Icons
	import { CheckCircle, CloseCircle, FolderOpen } from '@solar-icons/svelte/Bold';

	let tempSettings = $state($settings);
	let saved = $derived(JSON.stringify(tempSettings) === JSON.stringify($settings));

	let tuneincrewInstalled = $state<boolean>();
	let fmodInstalled = $state<boolean>();

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
			<div class="flex flex-col gap-2 px-4">
				<div class="flex items-center gap-20">
					<div class="flex flex-col grow">
						<button
							onclick={() => (tempSettings.keepTabs = !tempSettings.keepTabs)}
							class="text-sm text-white text-left py-1 cursor-pointer"
							tabIndex="-1"
						>
							Restore Tabs
						</button>
						<span class="text-xs text-primary-400">
							Restore previously open tabs when the app launches.
						</span>
					</div>
					<Toggle bind:toggled={tempSettings.keepTabs} />
				</div>
				<div class="flex items-center gap-20">
					<div class="flex flex-col grow">
						<button
							onclick={() =>
								(tempSettings.logsDefaultOpen = !tempSettings.logsDefaultOpen)}
							class="text-sm text-white text-left py-1 cursor-pointer"
							tabIndex="-1"
						>
							Logs Default Open
						</button>
						<span class="text-xs text-primary-400">
							Launch with the Logs window open by default.
						</span>
					</div>
					<Toggle bind:toggled={tempSettings.logsDefaultOpen} />
				</div>
				<div class="flex items-center gap-20">
					<div class="flex flex-col grow">
						<button
							onclick={() =>
								(tempSettings.autoUpdate.gui = !tempSettings.autoUpdate.gui)}
							class="text-sm text-white text-left py-1 cursor-pointer"
							tabIndex="-1"
						>
							Auto Update GUI
						</button>
						<span class="text-xs text-primary-400">
							Check for updates upon launch.
						</span>
					</div>
					<Toggle bind:toggled={tempSettings.autoUpdate.gui} />
				</div>
			</div>
		</div>
		<!-- Tunein Crew Settings -->
		<div class="flex flex-col gap-3">
			<h1 class="text-white font-semibold">Tunein Crew</h1>
			<div class="flex flex-col gap-2 px-4">
				<div class="flex items-center gap-20">
					<div class="flex flex-col grow">
						<button
							onclick={() =>
								(tempSettings.autoUpdate.tuneinCrew =
									!tempSettings.autoUpdate.tuneinCrew)}
							class="text-sm text-white text-left py-1 cursor-pointer"
							tabIndex="-1"
						>
							Auto Update Tunein Crew
						</button>
						<span class="text-xs text-primary-400">
							Check for Tunein Crew updates upon launch.
						</span>
					</div>
					<Toggle bind:toggled={tempSettings.autoUpdate.tuneinCrew} />
				</div>
				<div class="flex flex-col gap-2">
					<div class="flex flex-col">
						<label class="text-sm text-white text-left py-1" for="tuneincrewPath">
							Directory
						</label>
						<span class="text-xs text-primary-400">
							Set Tunein Crew install directory. Recommended to keep at default.
						</span>
						<span class="text-xs text-primary-400 font-bold">
							If you have a Tunein Crew installation, point to 'TuneinCrew.exe' below.
						</span>
					</div>
					<div class="flex gap-2 bg-primary-750 border border-primary-500 rounded-lg">
						<input
							bind:value={tempSettings.tuneinCrew!.dir}
							class="size-full px-2 py-1 text-sm text-white"
							type="text"
							id="tuneincrewPath"
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
							class="px-4 py-1 text-sm text-white bg-primary-750 hover:bg-primary-700 border border-primary-700 rounded-lg transition-colors"
							disabled={tuneincrewInstalled}
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
					</div>
				</div>
				<div class="flex flex-col gap-2">
					<div class="flex flex-col">
						<label class="text-sm text-white text-left py-1" for="fmodPath">
							FMOD v4.44.64 Directory
						</label>
						<span class="text-xs text-primary-400">
							Set FMOD install directory. Recommended to keep at default.
						</span>
						<span class="text-xs text-primary-400 font-bold">
							If you have FMOD v4.44.64 installed, point to 'fmod_designercl.exe'
							below.
						</span>
					</div>
					<div class="flex gap-2 bg-primary-750 border border-primary-500 rounded-lg">
						<input
							bind:value={tempSettings.fmodDir}
							class="size-full px-2 py-1 text-sm text-white"
							type="text"
							id="fmodPath"
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
							class="px-4 py-1 text-sm text-white bg-primary-750 hover:bg-primary-700 border border-primary-700 rounded-lg transition-colors"
							disabled={fmodInstalled}
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
		<button
			onclick={async () => {
				await settings.save(tempSettings);
			}}
			class="px-4 py-1 text-sm text-white bg-primary-750 hover:bg-primary-700 border border-primary-700 transition-colors rounded-lg"
			disabled={saved}>Save</button
		>
	</div>
</div>

<style>
	.sett-head-btn {
		&:hover::after {
			opacity: 100;
		}

		&.active {
			color: white;

			&::after {
				opacity: 100;
			}
		}

		&::after {
			content: '';
			position: absolute;
			bottom: 0;
			left: 0;
			right: 0;
			height: 1px;
			background-color: white;
			opacity: 0;
			transition: 150ms ease-in-out;
		}
	}
</style>
