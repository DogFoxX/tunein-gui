<script lang="ts">
	// Svelte Imports
	import { onMount } from 'svelte';
	import { scale } from 'svelte/transition';

	import { getVersion } from '@tauri-apps/api/app';
	import { exists, lstat } from '@tauri-apps/plugin-fs';
	import { extname, join } from '@tauri-apps/api/path';
	import { openUrl } from '@tauri-apps/plugin-opener';
	import { settStore } from '$lib/utils/settings';
	import { settingsOpen, settings } from '$lib/stores/settings.store';
	import { openDirDiag, openFileDiag } from '$lib/utils/dialog';
	import { getTuneinCrewLatest } from '$lib/utils/updates';

	// Icons
	import SolarFolderOpenBoldDuotone from '~icons/solar/folder-open-bold-duotone';
	import SolarSquareTopDownOutline from '~icons/solar/square-top-down-outline';
	import InfoIcon from '~icons/solar/info-circle-bold';
	import InstallIcon from '~icons/solar/download-square-bold';
	import InstalledIcon from '~icons/solar/check-circle-bold';
	import NotInstalledIcon from '~icons/solar/close-circle-bold';

	let unsaved = $state<boolean>();
	let aboutOpen = $state(false);

	let tempSettings = $state($settings);

	let settingsErr = $derived({
		cwd: !tempSettings.cwd,
		fmodDir: !tempSettings.fmodDir,
		tuneinDir: !tempSettings.tuneinCrew.dir
	});

	let tuneinCrewExe = $state(false);
	let isFilePath = $state(false);

	async function saveSettings() {
		await settStore.set(tempSettings);
		settings.set(await settStore.get());
	}

	$effect(() => {
		unsaved =
			JSON.stringify($settings) === JSON.stringify(tempSettings) ||
			Object.values(settingsErr).some((err) => err != false);
	});

	$effect(() => {
		extname($settings.tuneinCrew.dir)
			.then((ext) => {
				return (isFilePath = ext !== '');
			})
			.catch(() => {
				return (isFilePath = false);
			});

		join($settings.tuneinCrew.dir, 'TuneinCrew.exe').then((exePath) => {
			exists(exePath).then((found) => {
				tuneinCrewExe = found;
			});
		});
	});
</script>

<svelte:window
	onkeydown={(e) => {
		if (e.key === 'Escape') $settingsOpen = false;
	}}
/>

{#if !aboutOpen}
	<div
		transition:scale={{ start: 0.9, duration: 100 }}
		class="bg-secondary absolute inset-4 flex flex-col gap-2"
	>
		<header class="text-2xl text-white">Settings</header>
		<div class="relative w-full grow">
			<div class="absolute inset-0 p-2 flex flex-col gap-4 overflow-y-auto">
				<div class="flex flex-col gap-4">
					<span class="text-white text-lg">GUI</span>
					<div class="flex flex-col gap-4 px-2">
						<div class="flex gap-2">
							<input
								type="checkbox"
								name=""
								id="gui-update"
								bind:checked={tempSettings.autoUpdate.gui}
							/>
							<label for="gui-update" class="text-xs text-white"
								>Auto update GUI</label
							>
						</div>
						<div class="flex flex-col gap-2">
							<label for="cwd" class="text-xs text-white">Working Directory</label>
							<div
								class="flex items-center gap-2 rounded-md bg-zinc-700 px-2 py-1 outline-1 outline-transparent"
								class:!outline-red-400={settingsErr.cwd}
							>
								<input
									bind:value={tempSettings.cwd}
									id="cwd"
									class="w-full text-sm text-white"
									type="text"
									spellcheck="false"
									placeholder="Click browse to choose a folder..."
									autocomplete="off"
								/>
								<button
									onclick={async () => {
										let dir = await openDirDiag({
											title: 'Choose a working directory'
										});

										if (dir) tempSettings.cwd = dir;
									}}
									class="rounded-md text-white"
								>
									<SolarFolderOpenBoldDuotone width="20" height="20" />
								</button>
							</div>
							{#if settingsErr.cwd}
								<div class="flex items-center gap-2 text-red-400">
									<InfoIcon width="16" height="16" />
									<span class="text-xs">Working Directory cannot be empty</span>
								</div>
							{/if}
						</div>
					</div>
				</div>
				<div class="flex flex-col gap-4">
					<span class="text-white text-lg">TuneinCrew</span>
					<div class="flex flex-col gap-4 px-2">
						<div class="flex gap-2">
							<input
								type="checkbox"
								name=""
								id="tunein-update"
								bind:checked={tempSettings.autoUpdate.tuneinCrew}
							/>
							<label for="tunein-update" class="text-xs text-white"
								>Auto update TuneinCrew</label
							>
						</div>
						<div class="flex flex-col gap-2">
							<div class="flex flex-col gap-2">
								<label for="tuneincrew" class="text-xs text-white"
									>TuneinCrew Directory</label
								>
								<div
									class="flex items-center gap-2 rounded-md bg-zinc-700 px-2 py-1 outline-1 outline-transparent"
									class:!outline-red-400={settingsErr.tuneinDir}
								>
									<input
										bind:value={tempSettings.tuneinCrew.dir}
										id="tuneincrew"
										class="w-full text-sm text-white"
										type="text"
										spellcheck="false"
										placeholder="Click browse to set TuneinCrew path..."
										autocomplete="off"
									/>
									<button
										onclick={async () => {
											const dir = await openDirDiag({
												title: 'Set TuneinCrew path'
											});

											if (dir) tempSettings.tuneinCrew.dir = dir;
										}}
										class="rounded-md text-white"
									>
										<SolarFolderOpenBoldDuotone width="20" height="20" />
									</button>
								</div>
							</div>
							{#if settingsErr.tuneinDir}
								<div class="flex items-center gap-2 text-red-400">
									<InfoIcon width="16" height="16" />
									<span class="text-xs">Set TuneinCrew path</span>
								</div>
							{/if}
							{#if isFilePath}
								<div class="flex items-center gap-2 text-red-400">
									<InfoIcon width="16" height="16" />
									<span class="text-xs"
										>Set TuneinCrew path without extension</span
									>
								</div>
							{/if}
							<div class="flex items-center gap-2">
								<button
									onclick={async () => {
										const version = await getTuneinCrewLatest(
											$settings.tuneinCrew.version
										);

										if (version) {
											$settings.tuneinCrew = {
												...$settings.tuneinCrew,
												version
											};
											await settStore.set($settings);
										}
									}}
									class="flex items-center gap-2 rounded-md bg-zinc-700 hover:bg-zinc-500 !border-[1px] !border-zinc-500 px-2 py-1 text-xs text-white"
									disabled={isFilePath ||
										!unsaved ||
										(!settingsErr.tuneinDir && tuneinCrewExe)}
								>
									<InstallIcon width="18" height="18" />
									<span>Install</span>
								</button>
								{#if tuneinCrewExe}
									<InstalledIcon width="16" height="16" class="text-green-400" />
								{:else}
									<NotInstalledIcon width="16" height="16" class="text-red-400" />
								{/if}
							</div>
						</div>
						<div class="flex flex-col gap-2">
							<label for="fmod" class="text-xs text-white"
								>FMOD Designer Path (fmod_designercl.exe)</label
							>
							<div
								class="flex items-center gap-2 rounded-md bg-zinc-700 px-2 py-1 outline-1 outline-transparent"
								class:!outline-orange-700={settingsErr.fmodDir}
							>
								<input
									bind:value={tempSettings.fmodDir}
									id="fmod"
									class="w-full text-sm text-white"
									type="text"
									spellcheck="false"
									placeholder="Click browse to choose 'fmod_designercl.exe' path..."
									autocomplete="off"
								/>
								<button
									onclick={async () => {
										let dir = await openFileDiag({
											title: 'Choose fmod_designercl.exe path',
											filters: [
												{
													extensions: ['exe'],
													name: 'fmod_designercl.exe'
												}
											],
											multiple: false,
											defaultPath: $settings?.fmodDir
										});

										if (dir) tempSettings.fmodDir = dir;
									}}
									class="rounded-md text-white"
								>
									<SolarFolderOpenBoldDuotone width="20" height="20" />
								</button>
							</div>
							{#if settingsErr.fmodDir}
								<div class="flex items-center gap-2 text-red-400">
									<InfoIcon width="16" height="16" />
									<span class="text-xs">Set path to 'fmod_designercl.exe'</span>
								</div>
							{/if}
						</div>
					</div>
				</div>
			</div>
		</div>
		<div class="flex gap-2">
			<button
				onclick={() => (aboutOpen = true)}
				class="rounded-md bg-slate-700 px-4 py-1 text-sm text-white !border-[1px] !border-slate-500 hover:bg-slate-500"
				>About</button
			>
			<div class="flex grow justify-end gap-2">
				<button
					onclick={saveSettings}
					class="rounded-md bg-slate-700 px-4 py-1 text-sm text-white !border-[1px] !border-slate-500 hover:bg-slate-500"
					disabled={unsaved}
				>
					Save
				</button>
				<button
					onclick={() => settingsOpen.set(false)}
					class="rounded-md bg-slate-700 px-4 py-1 text-sm text-white !border-[1px] !border-slate-500 hover:bg-slate-500"
				>
					Close
				</button>
			</div>
		</div>
	</div>
{:else}
	<div
		transition:scale={{ start: 0.9, duration: 100 }}
		class="bg-secondary absolute inset-4 flex flex-col"
	>
		<header class="text-2xl text-white">About</header>
		<div class="flex grow flex-col items-center justify-center gap-4 px-16">
			<h1 class="text text-center text-white">
				An unofficial GUI Suite for creating custom radio station mods for The Crew (2014)
			</h1>
			<div class="flex flex-col items-center gap-2">
				<h1 class="text-lg font-bold text-white">GUI by DogFoxX</h1>
				<button
					onclick={() => openUrl('https://github.com/DogFoxX/tunein-gui')}
					class="flex gap-2 text-sm text-blue-200 underline"
				>
					<span>github.com/DogFoxX/tunein-gui</span>
					<SolarSquareTopDownOutline></SolarSquareTopDownOutline>
				</button>
			</div>
			<div class="flex flex-col items-center gap-2">
				<h1 class="text-lg font-bold text-white">TuneinCrew by FTIW</h1>
				<button
					onclick={() => openUrl('https://github.com/Telonof/TuneinCrew')}
					class="flex gap-2 text-sm text-blue-200 underline"
				>
					<span>github.com/Telonof/TuneinCrew</span>
					<SolarSquareTopDownOutline></SolarSquareTopDownOutline>
				</button>
			</div>
			<div class="flex gap-4 py-4">
				<div class="flex gap-2">
					<span class="text-sm text-zinc-400">GUI Version:</span>
					{#await getVersion() then version}
						<span class="text-sm font-bold text-white">v{version}</span>
					{/await}
				</div>
				<div class="flex gap-2">
					<span class="text-sm text-zinc-400">TuneinCrew Version:</span>
					<span class="text-sm font-bold text-white"
						>{$settings.tuneinCrew.version ?? 'N/A'}</span
					>
				</div>
			</div>
		</div>
		<div>
			<button
				onclick={() => (aboutOpen = false)}
				class="rounded-md bg-slate-700 px-4 py-1 text-sm text-white !border-[1px] !border-slate-500 hover:bg-slate-500"
				>Back</button
			>
		</div>
	</div>
{/if}
