<script lang="ts">
	import { getVersion } from '@tauri-apps/api/app';
	import { openUrl } from '@tauri-apps/plugin-opener';
	import { fade, scale } from 'svelte/transition';
	import { settingsOpen, store, settings } from '$lib/stores/settings.store';
	import { openDirDiag, openFileDiag } from '$lib/utils/dialog';

	// Icons
	import SolarFolderOpenBoldDuotone from '~icons/solar/folder-open-bold-duotone';
	import SolarSquareTopDownOutline from '~icons/solar/square-top-down-outline';

	let unsaved = $state<boolean>();
	let aboutOpen = $state(false);

	let tempSettings = $state($settings);

	$effect(() => {
		unsaved = JSON.stringify($settings) === JSON.stringify(tempSettings);
	});
</script>

<svelte:window
	onkeydown={(e) => {
		if (e.key === 'Escape') $settingsOpen = false;
	}}
/>

<div
	transition:fade={{ duration: 280 }}
	class="absolute inset-0 flex items-center justify-center backdrop-blur-xs"
>
	<div class="bg-primary absolute inset-0 opacity-70"></div>
	<div
		transition:scale={{ start: 0.9, duration: 100 }}
		class="bg-secondary relative z-10 flex h-[400px] w-[500px] flex-col gap-4 rounded-lg shadow-lg shadow-neutral-900"
	>
		{#if !aboutOpen}
			<div
				transition:scale={{ start: 0.9, duration: 100 }}
				class="bg-secondary absolute inset-4 flex flex-col"
			>
				<header class="text-2xl text-white">Settings</header>
				<div class="flex w-full grow flex-col gap-4 px-2 py-4">
					<div class="flex gap-4">
						<div class="flex gap-2">
							<input
								type="checkbox"
								name=""
								id="gui-update"
								checked={tempSettings.autoUpdate.gui}
							/>
							<label for="gui-update" class="text-sm text-white"
								>Auto update GUI</label
							>
						</div>
						<div class="flex gap-2">
							<input
								type="checkbox"
								name=""
								id="tunein-update"
								checked={tempSettings.autoUpdate.tuneinCrew}
							/>
							<label for="tunein-update" class="text-sm text-white"
								>Auto update TuneinCrew</label
							>
						</div>
					</div>
					<div class="flex flex-col gap-2">
						<label for="cwd" class="text-xs text-white">Working Directory</label>
						<div class="flex items-center gap-2 rounded-md bg-zinc-700 px-2 py-1">
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
					</div>
					<div class="flex flex-col gap-2">
						<label for="fmod" class="text-xs text-white"
							>FMOD Designer Path (fmod_designercl)</label
						>
						<div class="flex items-center gap-2 rounded-md bg-zinc-700 px-2 py-1">
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
										defaultPath: $settings.fmodDir
									});

									if (dir) tempSettings.fmodDir = dir;
								}}
								class="rounded-md text-white"
							>
								<SolarFolderOpenBoldDuotone width="20" height="20" />
							</button>
						</div>
					</div>
					<div class="flex flex-col gap-2">
						<label for="tuneincrew" class="text-xs text-white"
							>TuneinCrew Directory</label
						>
						<div class="flex items-center gap-2 rounded-md bg-zinc-700 px-2 py-1">
							<input
								bind:value={tempSettings.tuneinCrew.dir}
								id="tuneincrew"
								class="w-full text-sm text-white"
								type="text"
								spellcheck="false"
								placeholder="Click browse to choose TuneinCrew.exe path..."
								autocomplete="off"
							/>
							<button
								onclick={async () => {
									let dir = await openFileDiag({
										title: 'Choose TuneinCrew.exe path',
										filters: [
											{
												extensions: ['exe'],
												name: 'TuneinCrew.exe'
											}
										],
										multiple: false,
										defaultPath: $settings.tuneinCrew.dir
									});

									if (dir) tempSettings.tuneinCrew.dir = dir;
								}}
								class="rounded-md text-white"
							>
								<SolarFolderOpenBoldDuotone width="20" height="20" />
							</button>
						</div>
					</div>
				</div>
				<div class="flex gap-2">
					<button
						onclick={() => (aboutOpen = true)}
						class="rounded-md bg-slate-700 px-4 py-1 text-sm text-white hover:bg-slate-500"
						>About</button
					>
					<div class="flex grow justify-end gap-2">
						<button
							class="rounded-md bg-slate-700 px-4 py-1 text-sm text-white hover:bg-slate-500"
							disabled={unsaved}
						>
							Save
						</button>
						<button
							onclick={() => settingsOpen.set(false)}
							class="rounded-md bg-slate-700 px-4 py-1 text-sm text-white hover:bg-slate-500"
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
				<div class="flex grow flex-col items-center justify-center gap-4 py-4">
					<h1 class="text text-center text-white">
						A complete GUI Suite for creating custom radio station mods for The Crew
						(2014)
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
								>{$settings.tuneinCrew.version}</span
							>
						</div>
					</div>
				</div>
				<div>
					<button
						onclick={() => (aboutOpen = false)}
						class="rounded-md bg-slate-700 px-4 py-1 text-sm text-white hover:bg-slate-500"
						>Back</button
					>
				</div>
			</div>
		{/if}
	</div>
</div>
