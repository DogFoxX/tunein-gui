<script lang="ts">
	// Svelte Imports
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';

	// Tauri Imports
	import { convertFileSrc } from '@tauri-apps/api/core';
	import { listen } from '@tauri-apps/api/event';
	import { exists, lstat, readDir } from '@tauri-apps/plugin-fs';
	import type { DialogFilter } from '@tauri-apps/plugin-dialog';

	// Utils
	import { openFileDiag } from '$lib/utils/dialog';
	import { showDDSImage } from '$lib/utils/dds-parse';
	import parseTracks, { measureVolume, getFiles } from '$lib/utils/tracks';
	import columnResize from '$lib/utils/column-resize';

	// Stores
	import { unsaved, logoPath } from '$lib/stores/global';
	import {
		xmlData,
		tracks,
		updateTrack,
		updateTracks,
		resetForce
	} from '$lib/stores/xml-obj.store';

	// Icons
	import GenIdIcon from '~icons/solar/restart-square-bold';
	import OpenFolderIcon from '~icons/solar/folder-open-bold-duotone';
	import InfoIcon from '~icons/solar/question-circle-bold';
	import AddIcon from '~icons/solar/add-square-bold';
	import AnalyzeIcon from '~icons/solar/pulse-2-bold';
	import RemoveIcon from '~icons/solar/trash-bin-trash-bold';
	import CaretUp from '~icons/solar/alt-arrow-up-linear';
	import CaretDown from '~icons/solar/alt-arrow-down-linear';
	import { filename } from '@tauri-apps/plugin-window-state';
	import { join } from '@tauri-apps/api/path';

	// Dialog Filters
	const audioFilter: DialogFilter[] = [
		{
			extensions: ['flac', 'mp3', 'ogg', 'wav'],
			name: 'Audio Files'
		}
	];

	const imageFilter: DialogFilter[] = [
		{
			extensions: ['dds', 'bmp', 'jpg', 'jpeg', 'png'],
			name: 'Image Files'
		}
	];

	// File drop areas
	let logoDropArea = $state<HTMLElement>();
	let audioDropArea = $state<HTMLElement>();

	// Track List for Table
	let loadingTracks = $state<boolean>();
	let trackPaths = $state<string[]>([]);
	let trackList = $state<TrackTableInfo[]>([]);
	let filteredTracks = $derived<TrackTableInfo[]>(
		trackList.filter((track) =>
			Object.entries(track)
				.filter(([key]) => key !== 'length')
				.map(([, value]) => value)
				.join(' ')
				.toLowerCase()
				.includes(trackFilter.toLowerCase())
		)
	);
	let trackFilter = $state('');
	let selectedTrack = $state<number[]>([]);
	let lastSelectedIndex = $state<number | null>(null);
	let windowShiftDown = $state<boolean>();
	let windowCtrlDown = $state<boolean>();
	let shiftAnchorIndex = $state<number | null>(null);

	// Input States
	let logoSrc = $state<string>();
	let forceEnable = $state(false);
	let forceGlobVal = $state('80');
	let volumeEnable = $state(false);
	let volumeVal = $state<number>(95);
	let trackGain = $state<string>();
	let radioId = $derived($xmlData.project.radio.id);
	let radioName = $derived($xmlData.project.radio.name);

	onMount(() => {
		listen<DragDropEventPayload>('tauri://drag-drop', async (event) => {
			const { x, y } = event.payload.position;

			// get element under cursor
			const el = document.elementFromPoint(x, y);
			if (el && audioDropArea?.contains(el)) {
				let paths = event.payload.paths;

				trackPaths = await getFiles(paths);

				loadTracks();
			}

			if (el && logoDropArea?.contains(el)) {
				const allowedExt = ['dds', 'bmp', 'jpg', 'jpeg', 'png'];
				let files = event.payload.paths;

				$logoPath = files.filter((file) =>
					allowedExt.some((ext) => file.toLocaleLowerCase().endsWith(ext))
				)[0];
			}
		});
	});

	function generateId() {
		const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
		const array = new Uint32Array(4);
		crypto.getRandomValues(array);
		$xmlData.project.radio.id = Array.from(array, (x) => chars[x % chars.length]).join('');
	}

	function removeTrack() {
		trackList = trackList.filter((_, i) => !selectedTrack.some((n) => n === i));

		selectedTrack = [];
		lastSelectedIndex = null;
	}

	async function addTracks() {
		trackPaths = await openFileDiag({
			title: 'Choose audio file(s)',
			filters: audioFilter,
			multiple: true
		});

		if (trackPaths) loadTracks();
	}

	async function loadTracks() {
		await parseTracks(
			trackPaths,
			(isLoading) => (loadingTracks = isLoading),
			(track) => {
				// UI updates *immediately* when a new track is parsed
				trackList = [...trackList, track];
			}
		);
	}

	logoPath.subscribe(async (logoPath) => {
		if (logoPath) {
			let imageExts = ['bmp', 'jpeg', 'jpg', 'png'];

			const valid = await exists(logoPath);

			if (!valid) {
				logoSrc = '';
				return;
			}

			let ext = logoPath.split('.').pop()?.toLowerCase();

			if (imageExts.includes(ext ?? '')) {
				$xmlData.project.radio.logo = 'thumb.dds';
				return (logoSrc = convertFileSrc(logoPath));
			}
			return (logoSrc = await showDDSImage(logoPath));
		}
	});

	function focusRow(index: number, options: { checkStickyOverlap?: boolean } = {}) {
		if (!audioDropArea) return;

		const row = document.querySelector(`tr[data-index="${index}"]`);

		if (!row) return;

		// Only scroll if row not visible

		row.scrollIntoView({ block: 'nearest' });

		// Extra logic for sticky header overlap on ArrowUp
		if (options.checkStickyOverlap) {
			const rect = row.getBoundingClientRect();
			const thead = audioDropArea.querySelector('thead');

			if (!thead) return;

			const headerRect = thead.getBoundingClientRect();

			if (rect.top < headerRect.bottom) {
				if (!audioDropArea) return;

				const scrollTarget = audioDropArea.scrollTop - (headerRect.bottom - rect.top);

				audioDropArea.scrollTo({
					top: scrollTarget
				});
			}
		}
	}

	$effect(() => {
		if (trackList[selectedTrack[0]]) {
			if (trackList[selectedTrack[0]].measured_volume && volumeEnable)
				trackGain = (volumeVal - trackList[selectedTrack[0]].measured_volume!).toFixed(1);
		}
	});

	$effect(() => {
		if (trackList) {
			updateTracks(
				trackList.map((track) => {
					return {
						file: track.path,
						artist: track.artist,
						name: track.name,
						year: track.year,
						length: track.length,
						...(forceEnable ? { force: forceGlobVal } : {}),
						...(volumeEnable && track.measured_volume
							? { volume: (volumeVal - track.measured_volume).toFixed(1) }
							: {})
					};
				})
			);
		}
	});
</script>

<svelte:window
	onkeydown={(e) => {
		if (document.activeElement !== audioDropArea || !filteredTracks.length) return;

		windowShiftDown = e.shiftKey;
		windowCtrlDown = e.ctrlKey;

		if (e.ctrlKey && e.key.toLowerCase() === 'a') {
			e.preventDefault();
			selectedTrack = trackList.map((_, i) => i);
		}

		if (e.key === 'Home' && selectedTrack.length) {
			e.preventDefault();

			if (windowShiftDown) {
				if (lastSelectedIndex !== null) {
					const start = 0;
					const end = lastSelectedIndex;

					selectedTrack = Array.from({ length: end - start + 1 }, (_, i) => start + i);
				}
			} else selectedTrack = [0];

			lastSelectedIndex = 0;
			focusRow(selectedTrack[selectedTrack.length - 1], { checkStickyOverlap: true });
		}

		if (e.key === 'End' && selectedTrack.length) {
			e.preventDefault();

			if (windowShiftDown) {
				if (lastSelectedIndex !== null) {
					const start = lastSelectedIndex;
					const end = filteredTracks.length - 1;

					selectedTrack = Array.from({ length: end - start + 1 }, (_, i) => start + i);
				}
			} else selectedTrack = [filteredTracks.length - 1];

			lastSelectedIndex = filteredTracks.length - 1;
			focusRow(selectedTrack[selectedTrack.length - 1]);
		}

		if (e.key === 'Delete' && selectedTrack.length) {
			e.preventDefault();
			removeTrack();
		}

		if (e.key === 'Escape' && selectedTrack.length) {
			e.preventDefault();
			selectedTrack = [];
		}

		if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
		e.preventDefault();

		// Nothing selected yet
		if (lastSelectedIndex === null) {
			if (e.key === 'ArrowDown') {
				lastSelectedIndex = 0;
				selectedTrack = [0];
				shiftAnchorIndex = 0;
				focusRow(0);
			}
			return;
		}

		// Calculate next index
		const next =
			e.key === 'ArrowUp'
				? Math.max(0, lastSelectedIndex - 1)
				: Math.min(filteredTracks.length - 1, lastSelectedIndex + 1);

		// SHIFT + ARROW = Range select
		if (windowShiftDown) {
			// First time pressing Shift: remember where range started
			if (shiftAnchorIndex === null) shiftAnchorIndex = lastSelectedIndex;

			const start = Math.min(shiftAnchorIndex, next);
			const end = Math.max(shiftAnchorIndex, next);

			selectedTrack = Array.from({ length: end - start + 1 }, (_, i) => start + i);
		} else {
			// Normal single selection
			selectedTrack = [next];
			shiftAnchorIndex = null; // reset range anchor
		}

		lastSelectedIndex = next;
		focusRow(next, { checkStickyOverlap: e.key === 'ArrowUp' });
	}}
	onkeyup={(e) => {
		windowShiftDown = e.shiftKey;
		windowCtrlDown = e.ctrlKey;
	}}
/>

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
							value={radioId}
							oninput={(e) => ($xmlData.project.radio.id = e.currentTarget.value)}
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
							value={radioName}
							oninput={(e) => ($xmlData.project.radio.name = e.currentTarget.value)}
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
	<div class="flex grow gap-4">
		<div class="flex flex-col gap-2">
			<span class="text-sm text-white">Track XML Info</span>
			<div class="relative flex grow w-100 flex-col rounded-md border-2 border-zinc-700">
				<div class="absolute inset-0 p-2 overflow-auto flex flex-col gap-4">
					<div class="flex flex-col gap-4">
						<div class="flex flex-col gap-2">
							<label for="track-artist" class="text-xs text-white">Artist</label>
							<div class="input-flex flex rounded-md bg-zinc-800 px-2 py-1">
								<input
									value={trackList[selectedTrack[0]]?.artist}
									oninput={(e) => {
										trackList[selectedTrack[0]].artist = e.currentTarget.value;
									}}
									id="track-artist"
									class="w-full text-sm text-white"
									type="text"
									spellcheck="false"
									autocomplete="off"
									disabled={!selectedTrack.length}
								/>
							</div>
						</div>
						<div class="flex flex-col gap-2">
							<label for="track-name" class="text-xs text-white">Name</label>
							<div class="input-flex flex rounded-md bg-zinc-800 px-2 py-1">
								<input
									value={trackList[selectedTrack[0]]?.name}
									oninput={(e) => {
										trackList[selectedTrack[0]].name = e.currentTarget.value;
									}}
									id="track-name"
									class="w-full text-sm text-white"
									type="text"
									spellcheck="false"
									autocomplete="off"
									disabled={!selectedTrack.length}
								/>
							</div>
						</div>
					</div>
					<div class="flex gap-4">
						<div class="flex flex-1 flex-col gap-2">
							<label for="track-year" class="text-xs text-white">Year</label>
							<div class="input-flex flex rounded-md bg-zinc-800 px-2 py-1">
								<input
									value={trackList[selectedTrack[0]]?.year}
									oninput={(e) => {
										e.currentTarget.value = e.currentTarget.value.replace(
											/\D/g,
											''
										);
										e.currentTarget.value = e.currentTarget.value.replace(
											/^0+/,
											''
										);

										trackList[selectedTrack[0]].year = e.currentTarget.value;
									}}
									id="track-year"
									class="w-full text-sm text-white"
									type="text"
									maxlength="4"
									spellcheck="false"
									autocomplete="off"
									disabled={!selectedTrack.length}
								/>
							</div>
						</div>
						<div class="flex flex-1 flex-col gap-2">
							<label for="track-length" class="text-xs text-white">Length</label>
							<div class="input-flex flex rounded-md bg-zinc-800 px-2 py-1">
								<input
									value={trackList[selectedTrack[0]]?.length}
									oninput={(e) =>
										updateTrack(
											selectedTrack[0],
											'length',
											e.currentTarget.value
										)}
									id="track-length"
									class="w-full text-sm text-white"
									type="text"
									spellcheck="false"
									autocomplete="off"
									readonly
									disabled={!selectedTrack.length}
								/>
							</div>
						</div>
					</div>
					<div class="flex gap-4">
						<div class="flex-1 flex flex-col gap-2">
							<label for="track-force" class="text-xs text-white">Force</label>
							<div
								class="input-flex flex rounded-md bg-zinc-800 px-2 py-1"
								title="Readonly"
							>
								<input
									value={selectedTrack.length && forceEnable ? forceGlobVal : ''}
									oninput={(e) => {
										e.currentTarget.value = e.currentTarget.value.replace(
											/\D/g,
											''
										);
										e.currentTarget.value = e.currentTarget.value.replace(
											/^0+/,
											''
										);
										if (e.currentTarget.value === '')
											e.currentTarget.value = '0';

										updateTrack(
											selectedTrack[0],
											'force',
											e.currentTarget.value
										);
									}}
									id="track-force"
									class="w-full text-sm text-white"
									type="text"
									maxlength="3"
									spellcheck="false"
									autocomplete="off"
									readonly
									disabled={!selectedTrack.length}
									tabindex="-1"
								/>
							</div>
						</div>
						<div class="flex-1 flex flex-col gap-2">
							<div class="flex items-center gap-2">
								<span class="text-xs text-white">Volume</span>
								<div
									class="text-white"
									tabindex="-1"
									title="(Optional) Gain offset in dB relative to Target Volume (float value, e.g. -5.5)"
								>
									<InfoIcon width="16" height="16" />
								</div>
							</div>
							<div
								class="input-flex flex rounded-md bg-zinc-800 px-2 py-1"
								title="Readonly"
							>
								<input
									value={trackGain}
									id="track-force"
									class="w-full text-sm text-white"
									type="text"
									spellcheck="false"
									autocomplete="off"
									readonly
									disabled={selectedTrack.length < 1}
									tabindex="-1"
								/>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
		<div class="flex grow min-w-120 flex-col gap-2">
			<span class="text-sm text-white">Tracks</span>
			<div class="relative flex h-full flex-col rounded-md gap-2">
				{#if loadingTracks}
					<div
						in:fade={{ duration: 180 }}
						class="absolute inset-0 z-10 flex items-center justify-center"
					>
						<div class="bg-primary absolute inset-0 -z-10 opacity-90"></div>
						<div class="flex w-full flex-col items-center gap-2">
							<span class="text-sm text-white">Loading Track(s)...</span>
							<div
								class="loading relative h-1 w-1/2 overflow-hidden rounded-full bg-zinc-500"
							></div>
						</div>
					</div>
				{/if}
				<div class="relative grow">
					<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
					<div
						bind:this={audioDropArea}
						tabindex="-1"
						class="inset-0 absolute overflow-auto"
					>
						<table
							class="select-none table-fixed w-min border-separate border-spacing-0"
						>
							<thead class="bg-secondary sticky top-0">
								<tr>
									<th class="border-r-[1px] border-r-zinc-600 relative w-12 z-8">
										<div
											class="font-normal truncate text-left text-xs text-white px-2 py-1.5"
										>
											#
										</div>
										<button
											class="sort absolute inset-0 flex overflow-hidden items-start justify-center text-neutral-400"
											tabindex="-1"
										>
											<CaretDown
												height="14"
												width="14"
												class="absolute -top-1"
											/>
										</button>
										<button
											use:columnResize
											class="absolute -right-1.5 top-0 bottom-0 cursor-col-resize w-3"
											aria-label="column_resizer"
											tabindex="-1"
										></button>
									</th>
									<th class="border-r-[1px] border-r-zinc-600 relative w-40 z-7">
										<div
											class="font-normal truncate text-left text-xs text-white px-2 py-1.5"
										>
											Filename
										</div>
										<button
											class="sort absolute inset-0 flex overflow-hidden items-start justify-center text-neutral-400"
											tabindex="-1"
										>
											<CaretDown
												height="14"
												width="14"
												class="absolute -top-1"
											/>
										</button>
										<button
											use:columnResize
											class="absolute -right-1.5 top-0 bottom-0 cursor-col-resize w-3"
											aria-label="column_resizer"
											tabindex="-1"
										></button>
									</th>
									<th class="border-r-[1px] border-zinc-600 relative z-6 w-40">
										<div
											class="font-normal truncate text-left text-xs text-white px-2 py-1.5"
										>
											Measured Volume (dB)
										</div>
										<button
											class="sort absolute inset-0 flex items-start overflow-hidden justify-center text-neutral-400"
											tabindex="-1"
										>
											<CaretDown
												height="14"
												width="14"
												class="absolute -top-1"
											/>
										</button>
										<button
											use:columnResize
											class="absolute -right-1.5 top-0 bottom-0 cursor-col-resize w-3"
											aria-label="column_resizer"
											tabindex="-1"
										></button>
									</th>
									<th class="border-r-[1px] border-zinc-600 relative w-40 z-5">
										<div
											class="font-normal truncate text-left text-xs text-white px-2 py-1.5"
										>
											Artist
										</div>
										<button
											class="sort absolute inset-0 flex overflow-hidden items-start justify-center text-neutral-400"
											tabindex="-1"
										>
											<CaretDown
												height="14"
												width="14"
												class="absolute -top-1"
											/>
										</button>
										<button
											use:columnResize
											class="absolute -right-1.5 top-0 bottom-0 cursor-col-resize w-3"
											aria-label="column_resizer"
											tabindex="-1"
										></button>
									</th>
									<th class="border-r-[1px] border-zinc-600 relative w-40 z-4">
										<div
											class="font-normal truncate text-left text-xs text-white px-2 py-1.5"
										>
											Name
										</div>
										<button
											class="sort absolute inset-0 flex overflow-hidden items-start justify-center text-neutral-400"
											tabindex="-1"
										>
											<CaretDown
												height="14"
												width="14"
												class="absolute -top-1"
											/>
										</button>
										<button
											use:columnResize
											class="absolute -right-1.5 top-0 bottom-0 cursor-col-resize w-3"
											aria-label="column_resizer"
											tabindex="-1"
										></button>
									</th>
									<th class="border-r-[1px] border-zinc-600 relative w-16 z-3">
										<div
											class="font-normal truncate text-left text-xs text-white px-2 py-1.5"
										>
											Year
										</div>
										<button
											class="sort absolute inset-0 flex overflow-hidden items-start justify-center text-neutral-400"
											tabindex="-1"
										>
											<CaretDown
												height="14"
												width="14"
												class="absolute -top-1"
											/>
										</button>
										<button
											use:columnResize
											class="absolute -right-1.5 top-0 bottom-0 cursor-col-resize w-3"
											aria-label="column_resizer"
											tabindex="-1"
										></button>
									</th>
									<th class="border-r-[1px] border-zinc-600 relative w-16 z-2">
										<div
											class="font-normal truncate text-left text-xs text-white px-2 py-1.5"
										>
											Length
										</div>
										<button
											class="sort absolute inset-0 flex overflow-hidden items-start justify-center text-neutral-400"
											tabindex="-1"
										>
											<CaretDown
												height="14"
												width="14"
												class="absolute -top-1"
											/>
										</button>
										<button
											use:columnResize
											class="absolute -right-1.5 top-0 bottom-0 cursor-col-resize w-3"
											aria-label="column_resizer"
											tabindex="-1"
										></button>
									</th>
									<th
										class="border-r-[1px] border-zinc-600 relative z-1 overflow-hidden w-44"
									>
										<div
											class="font-normal truncate text-left text-xs text-white px-2 py-1.5"
										>
											Path
										</div>
										<button
											class="sort absolute inset-0 flex overflow-hidden items-start justify-center text-neutral-400"
											tabindex="-1"
										>
											<CaretDown
												height="14"
												width="14"
												class="absolute -top-1"
											/>
										</button>
										<button
											use:columnResize
											class="absolute -right-1.5 top-0 bottom-0 cursor-col-resize w-3"
											aria-label="column_resizer"
											tabindex="-1"
										></button>
									</th>
								</tr>
							</thead>
							{#if filteredTracks.length}
								<tbody transition:fade={{ duration: 80 }}>
									{#each filteredTracks as track, i}
										<tr
											data-index={i}
											onclick={() => {
												if (windowCtrlDown) {
													if (selectedTrack.includes(i)) {
														selectedTrack = selectedTrack.filter(
															(n) => n !== i
														);
													} else {
														selectedTrack = [...selectedTrack, i];
													}
													lastSelectedIndex = i;

													return;
												}

												if (windowShiftDown && lastSelectedIndex !== null) {
													const start = Math.min(lastSelectedIndex, i);
													const end = Math.max(lastSelectedIndex, i);
													const range = Array.from(
														{ length: end - start + 1 },
														(_, idx) => start + idx
													);
													return (selectedTrack = Array.from(
														new Set(range)
													));
												}
												selectedTrack = [i];
												lastSelectedIndex = i;
											}}
											class:selected={selectedTrack.includes(i)}
										>
											{#each Object.values(track) as data}
												<td class="truncate px-2 py-1 text-xs text-white">
													{data}
												</td>
											{/each}
										</tr>
									{/each}
								</tbody>
							{/if}
						</table>
						{#if !trackList.length}
							<div
								transition:fade={{ duration: 80 }}
								class="absolute inset-0 flex flex-col items-center justify-center -z-1"
							>
								<span class="font-semibold text-zinc-500"
									>Drop folder(s) or audio file(s) here</span
								>
								<span class="text-sm text-zinc-500"
									>...or click "Add File(s)" to browse</span
								>
								<span class="text-sm text-zinc-500">(flac, mp3, ogg, wav)</span>
							</div>
						{/if}
					</div>
				</div>
				<div class="flex flex-col gap-4">
					<div class="flex items-center gap-4">
						<div class="flex gap-2">
							<button
								onclick={addTracks}
								class="flex items-center gap-2 rounded-md bg-zinc-800 hover:bg-zinc-600 !border-[1px] !border-zinc-600 px-2 py-1 text-xs text-white"
							>
								<AddIcon width="18" height="18" />
								<span>Add File(s)</span>
							</button>
							<button
								onclick={async () => {
									await measureVolume(
										trackList,
										(isLoading) => (loadingTracks = isLoading),
										(measuredTrack) => {
											trackList = trackList.map((t) =>
												t.path === measuredTrack.path ? measuredTrack : t
											);
										}
									);
								}}
								class="flex items-center gap-2 rounded-md bg-zinc-800 hover:bg-zinc-600 !border-[1px] !border-zinc-600 px-2 py-1 text-xs text-white"
								disabled={trackList.length < 1}
							>
								<AnalyzeIcon width="18" height="18" />
								<span>Analyze Tracks</span>
							</button>
							<button
								onclick={removeTrack}
								class="flex items-center gap-2 rounded-md bg-zinc-800 hover:bg-zinc-600 !border-[1px] !border-zinc-600 px-2 py-1 text-xs text-white"
								disabled={selectedTrack.length < 1}
							>
								<RemoveIcon width="18" height="18" />
								<span>Remove</span>
							</button>
						</div>
						<div class="flex items-center grow justify-end">
							<div class="flex items-center gap-2">
								<span class="text-xs text-zinc-400">Total Tracks:</span>
								<span class="text-xs font-bold text-white">{trackList.length}</span>
							</div>
							<i class="text-xs text-zinc-600 px-2">|</i>
							<div class="flex items-center gap-2">
								<span class="text-xs text-zinc-400">Selected:</span>
								<span class="text-xs font-bold text-white"
									>{selectedTrack.length}</span
								>
							</div>
						</div>
					</div>
					<div class="flex flex-1 items-center grow gap-2">
						<label for="track-filter" class="text-xs text-white">Filter:</label>
						<div class="input-flex w-full flex rounded-md bg-zinc-800 px-2 py-1">
							<input
								bind:value={trackFilter}
								id="track-filter"
								class="w-full text-sm text-white"
								type="text"
								spellcheck="false"
								autocomplete="off"
								disabled={!trackList.length}
							/>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	thead th {
		&:hover {
			background-color: var(--color-slate-700);
		}
	}
	tbody tr {
		&.selected {
			background-color: #51a2ff99;
		}

		&:hover {
			box-shadow: inset 0 0 0 1px var(--color-blue-300);
		}

		&:not(.selected):hover {
			background-color: #51a2ff33;
		}
	}

	.loading::after {
		position: absolute;
		content: '';
		height: 100%;
		width: 33.3333%;
		background-color: white;
		border-radius: calc(infinity * 1px);
		-webkit-animation: slide-right 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite both;
		animation: slide-right 1s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite both;
	}

	@keyframes slide-right {
		0% {
			-webkit-transform: translateX(-100%);
			transform: translateX(-100%);
		}
		100% {
			-webkit-transform: translateX(calc(3 * 100%));
			transform: translateX(calc(3 * 100%));
		}
	}
</style>
