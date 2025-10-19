<script lang="ts">
	// Svelte Imports
	import { fade } from 'svelte/transition';

	// Tauri Imports
	import { convertFileSrc } from '@tauri-apps/api/core';
	import { extname } from '@tauri-apps/api/path';
	import { listen } from '@tauri-apps/api/event';
	import { exists } from '@tauri-apps/plugin-fs';
	import type { DialogFilter } from '@tauri-apps/plugin-dialog';

	// Utils
	import { openFileDiag } from '$lib/utils/dialog';
	import { showDDSImage } from '$lib/utils/dds-parse';

	// Stores
	import { logoPath } from '$lib/stores/global';
	import { xmlData, resetForce } from '$lib/stores/xml-obj.store';

	// Icons
	import GenIdIcon from '~icons/solar/restart-square-bold';
	import OpenFolderIcon from '~icons/solar/folder-open-bold-duotone';
	import InfoIcon from '~icons/solar/question-circle-bold';
	import TrackTable from './track-table.svelte';

	// Dialog Filters

	const imageFilter: DialogFilter[] = [
		{
			extensions: ['dds', 'bmp', 'jpg', 'jpeg', 'png'],
			name: 'Image Files'
		}
	];

	// File drop areas
	let logoDropArea = $state<HTMLElement>();

	// Input States
	let logoSrc = $state<string>();
	let forceEnable = $state(false);
	let forceGlobVal = $state('80');
	let volumeEnable = $state(false);
	let volumeVal = $state<number>(95);
	let radioId = $state<string>();
	let radioName = $state<string>();

	listen<DragDropEventPayload>('tauri://drag-drop', async (event) => {
		const { x, y } = event.payload.position;

		// get element under cursor
		const el = document.elementFromPoint(x, y);

		if (el && logoDropArea?.contains(el)) {
			const allowedExt = ['dds', 'bmp', 'jpg', 'jpeg', 'png'];
			let files = event.payload.paths;

			$logoPath = files.filter((file) =>
				allowedExt.some((ext) => file.toLocaleLowerCase().endsWith(ext))
			)[0];
		}
	});

	function generateId() {
		const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
		const array = new Uint32Array(4);
		crypto.getRandomValues(array);
		radioId = Array.from(array, (x) => chars[x % chars.length]).join('');
	}

	logoPath.subscribe(async (logoPath) => {
		if (logoPath) {
			let imageExts = ['bmp', 'jpeg', 'jpg', 'png'];

			const logoExist = await exists(logoPath);

			if (!logoExist) {
				logoSrc = '';
				return;
			}

			let extension = await extname(logoPath);

			if (imageExts.some((ext) => extension === ext)) {
				return (logoSrc = convertFileSrc(logoPath));
			}

			return (logoSrc = await showDDSImage(logoPath));
		}
	});

	$effect(() => {
		xmlData.update((data) => ({
			...data,
			project: {
				fmod: data.project.fmod,
				radio: {
					...(radioId ? { id: radioId } : {}),
					...(radioName ? { name: radioName } : {}),
					...(logoSrc ? { logo: 'thumb.dds' } : {}),
					songs: data.project.radio.songs
				}
			}
		}));
	});

	$inspect($xmlData);
</script>

<div class="relative flex flex-1 max-h-full min-w-max flex-col gap-4">
	<div class="flex gap-4">
		<div
			bind:this={logoDropArea}
			ondblclick={async () => {
				$logoPath = await openFileDiag({
					title: 'Choose a logo',
					filters: imageFilter,
					multiple: false
				});
			}}
			class="relative flex h-28 w-28 items-center justify-center rounded-md border-2 border-dotted border-zinc-700 p-2"
			role="img"
		>
			{#if !logoSrc}
				<div
					transition:fade={{ duration: 120 }}
					class="absolute inset-2 flex flex-col items-center justify-center gap-2"
				>
					<span class="text-sm font-semibold text-zinc-500">Logo Preview</span>
					<span class="text-center text-xs text-zinc-500"
						>Drop dds, bmp, jpg, jpeg, png here</span
					>
				</div>
			{:else}
				<img
					transition:fade={{ duration: 120 }}
					src={logoSrc}
					alt=""
					width="512"
					height="512"
				/>
			{/if}
		</div>
		<div class="flex flex-col gap-2">
			<div class="flex gap-2 overflow-hidden">
				<div class="flex flex-col gap-2">
					<label for="radio-id" class="text-xs text-white">ID (Unique)</label>
					<div
						class="flex input-flex items-center gap-2 rounded-md bg-zinc-800 px-2 py-1"
					>
						<input
							bind:value={radioId}
							id="radio-id"
							class="w-[8ch] text-sm text-white"
							type="text"
							maxlength="4"
							spellcheck="false"
							autocomplete="off"
						/>
						<button
							onclick={generateId}
							class="rounded-md text-white"
							title="Generate Random ID"
						>
							<GenIdIcon width="20" height="20" />
						</button>
					</div>
				</div>
				<div class="flex flex-col gap-2">
					<label for="radio-name" class="text-xs text-white">Radio Station Name</label>
					<div class="flex input-flex rounded-md bg-zinc-800 px-2 py-1">
						<input
							bind:value={radioName}
							id="radio-name"
							class="w-[35ch] text-sm text-white"
							type="text"
							spellcheck="false"
							placeholder="eg. My Custom Radio"
							autocomplete="off"
						/>
					</div>
				</div>
			</div>
			<div class="flex flex-col gap-2">
				<label for="logo-src" class="text-xs text-white">Logo</label>
				<div class="flex input-flex items-center gap-2 rounded-md bg-zinc-800 px-2 py-1">
					<input
						value={$logoPath}
						oninput={(e) => {
							logoPath.set(e.currentTarget.value);
						}}
						id="logo-src"
						class="w-full text-sm text-white"
						type="text"
						spellcheck="false"
						placeholder="Click browse to choose a logo file..."
						autocomplete="off"
					/>
					<button
						onclick={async () => {
							const dir = await openFileDiag({
								title: 'Choose a logo',
								filters: imageFilter,
								multiple: false
							});

							if (dir) logoPath.set(dir);
						}}
						class="rounded-md text-white"
					>
						<OpenFolderIcon width="20" height="20" />
					</button>
				</div>
			</div>
		</div>
		<div class="flex flex-col gap-2">
			<div class="flex flex-col gap-2">
				<div class="flex items-center gap-2">
					<div class="flex gap-4">
						<div class="flex gap-2">
							<input
								bind:checked={forceEnable}
								onchange={resetForce}
								type="checkbox"
								id="force"
								value="0"
							/>
							<label for="force" class="text-xs text-white">Global Force</label>
						</div>
					</div>
					<i
						class="text-white"
						title="km/h value when music is faded in. Disable: Keep the game's default value (80). Enable: Set a custom value (max 300) - 0 disables the effect, i.e no fade-in."
					>
						<InfoIcon width="16" height="16" />
					</i>
				</div>
				<div class="input-flex flex rounded-md bg-zinc-800 px-2 py-1">
					<input
						bind:value={forceGlobVal}
						oninput={(e) => {
							forceGlobVal = forceGlobVal.replace(/\D/g, '');
							forceGlobVal = forceGlobVal.replace(/^0+/, '');
							if (forceGlobVal === '') forceGlobVal = '0';
						}}
						id="force-val"
						class="w-full text-sm text-white"
						type="text"
						maxlength="3"
						spellcheck="false"
						placeholder="eg. 200"
						disabled={!forceEnable}
						autocomplete="off"
					/>
				</div>
			</div>
			<div class="flex flex-col gap-2">
				<div class="flex items-center gap-2">
					<div class="flex gap-4">
						<div class="flex gap-2">
							<input
								bind:checked={volumeEnable}
								onchange={resetForce}
								type="checkbox"
								id="volume"
								value="0"
							/>
							<label for="volume" class="text-xs text-white">Target Volume</label>
						</div>
					</div>
					<i
						class="text-white"
						title="Value in dB to normalize each track. Enable: Set a volume value for each track (best 95). Disable: No volume change."
					>
						<InfoIcon width="16" height="16" />
					</i>
				</div>
				<div class="input-flex flex rounded-md bg-zinc-800 px-2 py-1">
					<input
						bind:value={volumeVal}
						oninput={(e) => {
							forceGlobVal = forceGlobVal.replace(/\D/g, '');
							forceGlobVal = forceGlobVal.replace(/^0+/, '');
							if (forceGlobVal === '') forceGlobVal = '0';
						}}
						id="force-val"
						class="w-full text-sm text-white"
						type="text"
						maxlength="3"
						spellcheck="false"
						placeholder="eg. 200"
						disabled={!volumeEnable}
						autocomplete="off"
					/>
				</div>
			</div>
		</div>
	</div>
	<TrackTable
		force={{ enable: forceEnable, value: forceGlobVal }}
		volume={{ enable: volumeEnable, value: volumeVal }}
	/>
</div>
