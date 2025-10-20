<script lang="ts">
	// Svelte Imports
	import { fade } from 'svelte/transition';
	import { onMount } from 'svelte';

	// Tauri Imports
	import { listen } from '@tauri-apps/api/event';
	import type { DialogFilter } from '@tauri-apps/plugin-dialog';

	// Utils
	import { openFileDiag } from '$lib/utils/dialog';
	import parseTracks, { measureVolume, getFiles } from '$lib/utils/tracks';
	import columnResize from '$lib/utils/column-resize';
	import { tableStore } from '$lib/utils/settings';

	// Stores
	import { updateTracks } from '$lib/stores/xml-obj.store';
	import { tableState } from '$lib/stores/settings.store';

	// Icons
	import InfoIcon from '~icons/solar/question-circle-bold';
	import AddIcon from '~icons/solar/add-square-bold';
	import AnalyzeIcon from '~icons/solar/pulse-2-bold';
	import RemoveIcon from '~icons/solar/trash-bin-trash-bold';
	import CaretUp from '~icons/solar/alt-arrow-up-linear';
	import CaretDown from '~icons/solar/alt-arrow-down-linear';
	import logger from '$lib/stores/logger';

	let {
		force,
		volume
	}: { force: { enable: boolean; value: string }; volume: { enable: boolean; value: number } } =
		$props();

	// Dialog Filters
	const audioFilter: DialogFilter[] = [
		{
			extensions: ['flac', 'mp3', 'ogg', 'wav'],
			name: 'Audio Files'
		}
	];

	// File drop areas
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

	// Table fields
	let tableFields = $state([
		'#',
		'Filename',
		'Measured Volume (dB)',
		'Artist',
		'Name',
		'Year',
		'Length',
		'Path'
	]);

	const fieldMap: (keyof TrackTableInfo)[] = [
		'number',
		'filename',
		'measured_volume',
		'artist',
		'name',
		'year',
		'length',
		'path'
	];

	// Input States
	let trackGain = $derived<string>(
		volume.enable && trackList[selectedTrack[0]].measured_volume
			? (volume.value - Number(trackList[selectedTrack[0]].measured_volume!)).toFixed(1)
			: ''
	);

	listen<DragDropEventPayload>('tauri://drag-drop', async (event) => {
		const { x, y } = event.payload.position;

		// get element under cursor
		const el = document.elementFromPoint(x, y);
		if (el && audioDropArea?.contains(el)) {
			let paths = event.payload.paths;

			getFiles(paths)
				.then((res) => {
					trackPaths = res;
					loadTracks();
				})
				.catch((err: Error) => {
					return logger.err(err.message);
				});
		}
	});

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
				trackList = [...trackList, track];
			}
		);
	}

	function compareTracks(
		a: TrackTableInfo,
		b: TrackTableInfo,
		key: keyof TrackTableInfo,
		ascending: boolean
	): number {
		const isEmpty = (v: string | undefined) => v === undefined;

		const aValue = a[key];
		const bValue = b[key];

		// All values empty in this column
		const allValues = trackList.map((t) => t[key]);
		if (allValues.every(isEmpty)) return 0;

		// Partial values present
		if (allValues.some(isEmpty)) {
			const aEmpty = isEmpty(aValue);
			const bEmpty = isEmpty(bValue);

			if (ascending) {
				// filename first, then value
				if (aEmpty && !bEmpty) return -1;
				if (!aEmpty && bEmpty) return 1;
				if (!isNaN(Number(aValue)) && !isNaN(Number(bValue))) {
					return Number(bValue) - Number(aValue);
				}
				return b.filename.localeCompare(a.filename, undefined, { numeric: true });
			} else {
				// descending: value first, then filename
				if (aEmpty && !bEmpty) return 1; // empty goes last
				if (!aEmpty && bEmpty) return -1;
				if (!isNaN(Number(aValue)) && !isNaN(Number(bValue))) {
					return Number(aValue) - Number(bValue);
				}
				return a.filename.localeCompare(b.filename, undefined, { numeric: true });
			}
		}

		return ascending
			? aValue!.localeCompare(bValue!, undefined, { numeric: true })
			: bValue!.localeCompare(aValue!, undefined, { numeric: true });
	}

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
		if (trackList) {
			updateTracks(
				trackList.map((track) => {
					return {
						file: track.path,
						artist: track.artist,
						name: track.name,
						year: track.year,
						length: track.length,
						...(force.enable ? { force: force.value } : {}),
						...(volume.enable && track.measured_volume
							? { volume: (volume.value - Number(track.measured_volume)).toFixed(1) }
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
								id="track-length"
								class="w-full text-sm text-white"
								type="text"
								spellcheck="false"
								autocomplete="off"
								readonly
								title="Readonly"
								disabled={!selectedTrack.length}
								tabindex="-1"
							/>
						</div>
					</div>
				</div>
				<div class="flex gap-4">
					<div class="flex-1 flex flex-col gap-2">
						<label for="track-force" class="text-xs text-white">Force</label>
						<div class="input-flex flex rounded-md bg-zinc-800 px-2 py-1">
							<input
								value={selectedTrack.length && force.enable ? force.value : ''}
								id="track-force"
								class="w-full text-sm text-white"
								type="text"
								spellcheck="false"
								autocomplete="off"
								readonly
								title="Readonly"
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
								value={selectedTrack.length && volume.enable ? trackGain : ''}
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
				<div bind:this={audioDropArea} tabindex="-1" class="inset-0 absolute overflow-auto">
					<table class="select-none table-fixed w-min border-separate border-spacing-0">
						<thead class="bg-secondary sticky top-0">
							<tr>
								{#if $tableState}
									{#each tableFields as field, i}
										<th
											class="border-r-[1px] border-r-zinc-600 relative"
											style="width: {$tableState.fields[i]
												.width}px; z-index: {tableFields.length - (i + 1)}"
										>
											<div
												class="font-normal truncate text-left text-xs text-white px-2 py-1.5"
											>
												{field}
											</div>
											<button
												onclick={async () => {
													if ($tableState.fields[i].sort) {
														$tableState.ascending =
															!$tableState.ascending;
													}

													tableState.update((state) => {
														return {
															...state,
															fields: state.fields.map(
																(field, index) => ({
																	...field,
																	sort: index === i
																})
															)
														};
													});

													if (trackList.length) {
														const key = fieldMap[i];

														trackList.sort((a, b) =>
															compareTracks(
																a,
																b,
																key,
																!$tableState.ascending
															)
														);
													}

													await tableStore.set($tableState);
												}}
												class="sort absolute inset-0 flex overflow-hidden items-start justify-center text-neutral-400 z-1"
												tabindex="-1"
											>
												{#if $tableState.fields[i].sort}
													{#if $tableState?.ascending}
														<CaretDown
															height="14"
															width="14"
															class="absolute -top-1"
														/>
													{:else}
														<CaretUp
															height="14"
															width="14"
															class="absolute -top-1"
														/>
													{/if}
												{/if}
											</button>
											<button
												use:columnResize={(width, done) => {
													if (done) {
														// Persist once, at the end
														tableStore.set($tableState);
														return;
													}

													// Update local reactive state live
													tableState.update((state) => {
														return {
															...state,
															fields: state.fields.map(
																(field, index) =>
																	index === i
																		? { ...field, width }
																		: field
															)
														};
													});
												}}
												class="absolute -right-1.5 top-0 bottom-0 cursor-col-resize w-3 z-2"
												aria-label="column_resizer"
												tabindex="-1"
											></button>
										</th>
									{/each}
								{/if}
							</tr>
						</thead>
						{#if filteredTracks.length}
							<tbody transition:fade={{ duration: 80 }}>
								{#each filteredTracks as track, i (track.id)}
									<tr
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
												return (selectedTrack = Array.from(new Set(range)));
											}
											selectedTrack = [i];
											lastSelectedIndex = i;
										}}
										class:selected={selectedTrack.includes(i)}
										data-index={i}
									>
										{#each fieldMap as key}
											<td class="truncate px-2 py-1 text-xs text-white">
												{track[key] ?? ''}
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
							<span class="text-xs font-bold text-white">{selectedTrack.length}</span>
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
