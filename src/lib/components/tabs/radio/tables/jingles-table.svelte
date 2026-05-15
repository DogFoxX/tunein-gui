<script lang="ts">
	// Svelte Imports
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';

	// Tauri Imports
	import { listen } from '@tauri-apps/api/event';
	import { open, type DialogFilter } from '@tauri-apps/plugin-dialog';
	import { exists } from '@tauri-apps/plugin-fs';

	// Utils
	import logger from '$lib/utils/logger';
	import { getFiles } from '$lib/utils/tracks';

	// Column Resizer
	import columnResize from './column-resize';

	// Stores
	import { tables } from '$lib/stores';

	// Icons
	import { Plus } from '$assets/tg-icons';
	import { AltArrowDown, AltArrowUp, Restart, Shuffle } from '@solar-icons/svelte/Outline';
	import { TrashBinTrash } from '@solar-icons/svelte/Bold';

	// Props
	let {
		checkMissing,
		missingFiles,
		radioStoreData = $bindable()
	}: {
		checkMissing: () => Promise<void>;
		missingFiles: { missingJingles: Map<string, boolean>; missingJinglesCount: number };
		radioStoreData: TgRadioData;
	} = $props();

	let audioDropArea = $state<HTMLElement>();

	// Table Vars
	let loadingSongs = $state<boolean>();
	let filteredJingles = $state<JinglesType[]>([]);
	let jingleFilter = $state('');
	let selectedSong = $state<number[]>([]);
	let lastSelectedIndex = $state<number | null>(null);
	let windowShiftDown = $state<boolean>();
	let windowCtrlDown = $state<boolean>();
	let shiftAnchorIndex = $state<number | null>(null);

	// Jingles
	let jinglesList = $derived<JinglesType[]>(radioStoreData.tracks.jingles ?? []);

	const audioFilter: DialogFilter[] = [
		{
			extensions: ['flac', 'mp3', 'ogg', 'wav'],
			name: 'Audio Files'
		}
	];

	const tableFields = ['File', 'Path'];

	const fieldMap: (keyof JinglesType)[] = ['filename', 'path'];

	onMount(() => {
		if (!tables.jingles_table.fields.length) {
			tables.jingles_table = {
				ascending: false,
				fields: tableFields.map((_, i) => {
					if (i === 0) return { sort: true, width: 160 };
					if (i === 1) return { sort: false, width: 400 };
					return {};
				})
			};
		}
	});

	// Listen to drag/drop events
	listen<DragDropEventPayload>('tauri://drag-drop', async (event) => {
		const { x, y } = event.payload.position;

		// get element under cursor
		const el = document.elementFromPoint(x, y);
		if (el && audioDropArea?.contains(el)) {
			let paths = event.payload.paths;

			getFiles(paths)
				.then((res) => {
					loadJingles(res);
				})
				.catch((err: Error) => {
					return logger.err(err.message);
				});
		}
	});

	function focusRow(index: number) {
		if (!audioDropArea) return;

		const row = audioDropArea.querySelector(`tr[data-index="${index}"]`);

		if (!row) return;

		// Only scroll if row not visible

		row.scrollIntoView({ block: 'nearest' });

		// Extra logic for sticky header overlap on ArrowUp
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

	async function loadJingles(songPaths: string[]) {
		for (const path of songPaths) {
			jinglesList = [
				...jinglesList,
				{ id: crypto.randomUUID(), filename: path.split(/[/\\]/).pop() ?? '', path }
			];
		}

		jinglesList.sort((a, b) =>
			compareSongs(
				a,
				b,
				fieldMap[tables.songs_table.fields.findIndex((f) => f.sort)],
				!tables.songs_table.ascending
			)
		);
	}

	function compareSongs(
		a: JinglesType,
		b: JinglesType,
		key: keyof JinglesType,
		ascending: boolean
	): number {
		const isEmpty = (v: string | undefined) => v === undefined;

		const aValue = a[key];
		const bValue = b[key];

		// All values empty in this column
		const allValues = jinglesList!.map((t) => t[key]);
		if (allValues.every(isEmpty)) return 0;

		// Partial values present
		if (allValues.some(isEmpty)) {
			const aEmpty = isEmpty(aValue);
			const bEmpty = isEmpty(bValue);

			if (ascending) {
				// filename first, then value
				if (aEmpty && !bEmpty) return -1;
				if (!aEmpty && bEmpty) return 1;
				if (!aEmpty && !bEmpty) {
					if (!isNaN(Number(aValue)) && !isNaN(Number(bValue))) {
						return Number(aValue) - Number(bValue);
					}
					return aValue!.localeCompare(bValue!, undefined, { numeric: true });
				}
				return a.filename.localeCompare(b.filename, undefined, { numeric: true });
			} else {
				// descending: value first, then filename
				if (aEmpty && !bEmpty) return 1; // empty goes last
				if (!aEmpty && bEmpty) return -1;
				if (!aEmpty && !bEmpty) {
					if (!isNaN(Number(aValue)) && !isNaN(Number(bValue))) {
						return Number(bValue) - Number(aValue);
					}
					return bValue!.localeCompare(aValue!, undefined, { numeric: true });
				}
				return b.filename.localeCompare(a.filename, undefined, { numeric: true });
			}
		}

		return ascending
			? aValue!.localeCompare(bValue!, undefined, { numeric: true })
			: bValue!.localeCompare(aValue!, undefined, { numeric: true });
	}

	async function addJingles() {
		const paths = await open({
			title: 'Choose audio file(s)',
			filters: audioFilter,
			multiple: true
		});

		if (!paths) return;

		loadJingles(paths);
	}

	function shuffleJingles(array: JinglesType[]) {
		const arr = [...array]; // copy so original is unchanged

		for (let i = arr.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));

			[arr[i], arr[j]] = [arr[j], arr[i]];
		}

		tables.jingles_table = {
			...tables.jingles_table,
			fields: tables.jingles_table.fields.map((field) => ({
				...field,
				sort: false
			}))
		};

		return arr;
	}

	function removeTrack() {
		jinglesList = jinglesList.filter((_, i) => !selectedSong.some((n) => n === i));

		selectedSong = [];
		lastSelectedIndex = null;
	}

	function tableKeyControls(e: KeyboardEvent) {
		if (e.ctrlKey && e.key.toLowerCase() === 'a') {
			e.preventDefault();
			selectedSong = jinglesList.map((_, i) => i);
		}

		if ((e.key === 'Home' || e.key === 'PageUp') && selectedSong.length) {
			e.preventDefault();

			if (windowShiftDown) {
				if (lastSelectedIndex !== null) {
					const start = 0;
					const end = lastSelectedIndex;

					selectedSong = Array.from({ length: end - start + 1 }, (_, i) => start + i);
				}
			} else selectedSong = [0];

			lastSelectedIndex = 0;
			focusRow(selectedSong[selectedSong.length - 1]);
		}

		if ((e.key === 'End' || e.key === 'PageDown') && selectedSong.length) {
			e.preventDefault();

			if (windowShiftDown) {
				if (lastSelectedIndex !== null) {
					const start = lastSelectedIndex;
					const end = filteredJingles.length - 1;

					selectedSong = Array.from({ length: end - start + 1 }, (_, i) => start + i);
				}
			} else selectedSong = [filteredJingles.length - 1];

			lastSelectedIndex = filteredJingles.length - 1;
			focusRow(selectedSong[selectedSong.length - 1]);
		}

		if (e.key === 'Delete' && selectedSong.length) {
			e.preventDefault();
			removeTrack();
		}

		if (e.key === 'Escape' && selectedSong.length) {
			e.preventDefault();
			selectedSong = [];
			lastSelectedIndex = null;
		}

		if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
		e.preventDefault();

		// Nothing selected yet
		if (lastSelectedIndex === null) {
			if (e.key === 'ArrowDown') {
				lastSelectedIndex = 0;
				selectedSong = [0];
				shiftAnchorIndex = 0;
				focusRow(0);
			}
			return;
		}

		// Calculate next index
		const next =
			e.key === 'ArrowUp'
				? Math.max(0, lastSelectedIndex - 1)
				: Math.min(filteredJingles.length - 1, lastSelectedIndex + 1);

		// SHIFT + ARROW = Range select
		if (windowShiftDown) {
			// First time pressing Shift: remember where range started
			if (shiftAnchorIndex === null) shiftAnchorIndex = lastSelectedIndex;

			const start = Math.min(shiftAnchorIndex, next);
			const end = Math.max(shiftAnchorIndex, next);

			selectedSong = Array.from({ length: end - start + 1 }, (_, i) => start + i);
		} else {
			// Normal single selection
			selectedSong = [next];
			shiftAnchorIndex = null; // reset range anchor
		}

		lastSelectedIndex = next;
		focusRow(next);
	}

	// Update 'filterSongs' for searching
	$effect(() => {
		if (jinglesList) {
			filteredJingles =
				jinglesList.length > 0
					? jinglesList.filter((song) =>
							Object.entries(song)
								.filter(([key]) => key !== 'length')
								.map(([, value]) => value)
								.join(' ')
								.toLowerCase()
								.includes(jingleFilter.toLowerCase())
						)
					: [];
		}
	});

	$effect(() => {
		radioStoreData.tracks.jingles = jinglesList;
	});
</script>

<svelte:window
	onkeydown={(e) => {
		windowShiftDown = e.shiftKey;
		windowCtrlDown = e.ctrlKey;
	}}
	onkeyup={(e) => {
		windowShiftDown = e.shiftKey;
		windowCtrlDown = e.ctrlKey;
	}}
/>

<div
	class="relative flex flex-col gap-2 w-110 border border-primary-700 rounded-lg overflow-hidden"
>
	<!-- Loading Songs -->
	{#if loadingSongs}
		<div
			in:fade={{ duration: 180 }}
			class="absolute inset-0 z-50 flex items-center justify-center bg-primary-800/70 backdrop-blur-xs rounded-lg"
		>
			<div class="flex w-full flex-col items-center gap-2">
				<span class="text-sm text-white">Loading Jingle(s)...</span>
				<div
					class="loading relative h-1 w-1/2 overflow-hidden rounded-full bg-primary-500"
				></div>
			</div>
		</div>
	{/if}

	<div class="flex flex-col gap-2 p-2">
		<header class="text-xl text-white font-semibold">Jingles</header>
		<div class="flex gap-2 px-2">
			<div class="flex gap-2">
				<button
					onclick={addJingles}
					class="px-4 py-1 text-sm text-white bg-primary-700/50 hover:bg-primary-700 border border-primary-600 rounded-lg transition-colors"
					title="Add File(s)"
				>
					<Plus />
				</button>
				<button
					onclick={() => {
						jinglesList = shuffleJingles(jinglesList);
					}}
					class="px-4 py-1 text-sm text-white bg-primary-700/50 hover:bg-primary-700 border border-primary-600 rounded-lg transition-colors"
					title="Shuffle"
					disabled={jinglesList.length < 1}
				>
					<Shuffle />
				</button>
				<button
					onclick={checkMissing}
					class="px-4 py-1 text-sm text-white bg-primary-700/50 hover:bg-primary-700 border border-primary-600 rounded-lg transition-colors"
					title="Refresh List"
					disabled={jinglesList.length < 1}
				>
					<Restart />
				</button>
				<button
					onclick={removeTrack}
					class="flex items-center justify-center gap-2 px-4 py-1 text-sm text-red-400 bg-primary-700/50 hover:bg-primary-700 border border-primary-600 rounded-lg transition-colors"
					disabled={selectedSong.length < 1}
				>
					<TrashBinTrash width="18" height="18" />
					<span>Remove</span>
				</button>
			</div>
		</div>
	</div>
	<div class="flex grow min-w-0 flex-col gap-2 border-t border-primary-700">
		<div class="flex size-full flex-col">
			<!-- Songs Table -->
			<div class="relative grow">
				<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
				<div
					bind:this={audioDropArea}
					onkeydown={tableKeyControls}
					tabindex="0"
					id="jingles-table"
					role="dialog"
					class="inset-0 absolute overflow-x-auto overflow-y-scroll"
				>
					<table class="relative table-fixed w-min border-separate border-spacing-0">
						<thead class="bg-primary-800 sticky top-0">
							<tr>
								{#if tables.jingles_table.fields.length}
									{#each tableFields as field, i}
										<th
											class="border-r border-r-primary-700 relative"
											style="width: {tables.jingles_table.fields[i]
												.width}px; z-index: {tableFields.length - (i + 1)}"
										>
											<div
												class="font-normal truncate text-left text-xs text-white px-2 py-1.5"
											>
												{field}
											</div>
											<button
												onclick={async () => {
													if (tables.jingles_table.fields[i].sort) {
														tables.jingles_table.ascending =
															!tables.jingles_table.ascending;
													}

													tables.jingles_table = {
														...tables.jingles_table,
														fields: tables.jingles_table.fields.map(
															(field, index) => ({
																...field,
																sort: index === i
															})
														)
													};

													if (jinglesList.length) {
														const key = fieldMap[i];

														jinglesList = jinglesList.sort((a, b) =>
															compareSongs(
																a,
																b,
																key,
																!tables.jingles_table.ascending
															)
														);
													}

													tables.jingles_table = tables.jingles_table;
												}}
												class="sort absolute inset-0 flex overflow-hidden items-start justify-center text-primary-400 z-1"
												tabindex="-1"
											>
												{#if tables.jingles_table.fields[i].sort}
													{#if tables.jingles_table.ascending}
														<AltArrowDown
															height="14"
															width="14"
															class="absolute -top-1"
														/>
													{:else}
														<AltArrowUp
															height="14"
															width="14"
															class="absolute -top-1"
														/>
													{/if}
												{/if}
											</button>
											<button
												use:columnResize={async (width, done) => {
													if (done) {
														// Persist once, at the end
														tables.jingles_table = tables.jingles_table;
														return;
													}

													// Update local reactive state live
													tables.jingles_table = {
														...tables.jingles_table,
														fields: tables.jingles_table.fields.map(
															(field, index) =>
																index === i
																	? { ...field, width }
																	: field
														)
													};
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
						{#if filteredJingles.length}
							<tbody transition:fade={{ duration: 80 }}>
								{#each filteredJingles as jingle, index (jingle.id)}
									<tr
										onmousedown={(e) => {
											document.querySelector<HTMLElement>(
												'tr[data-index="0"]'
											)!.style.boxShadow = '';

											shiftAnchorIndex = null;

											focusRow(index);

											if (windowCtrlDown) {
												if (selectedSong.includes(index)) {
													selectedSong = selectedSong.filter(
														(n) => n !== index
													);
												} else {
													selectedSong = [...selectedSong, index];
												}
												lastSelectedIndex = index;

												return;
											}

											if (windowShiftDown && lastSelectedIndex !== null) {
												const start = Math.min(lastSelectedIndex, index);
												const end = Math.max(lastSelectedIndex, index);
												const range = Array.from(
													{ length: end - start + 1 },
													(_, idx) => start + idx
												);
												return (selectedSong = Array.from(new Set(range)));
											}
											selectedSong = [index];
											lastSelectedIndex = index;
										}}
										class:selected={selectedSong.includes(index)}
										class:error={missingFiles.missingJingles.get(jingle.path)}
										data-index={index}
									>
										{#each fieldMap as key, i}
											<td>
												<div class="truncate px-2 py-1 text-xs text-white">
													{jingle[key] ?? ''}
												</div>
											</td>
										{/each}
									</tr>
								{/each}
							</tbody>
						{/if}
					</table>
					{#if !jinglesList.length}
						<div
							transition:fade={{ duration: 80 }}
							class="absolute inset-0 flex flex-col items-center justify-center -z-1"
						>
							<span class="font-semibold text-primary-400"
								>Drop folder(s) or audio file(s) here...</span
							>
							<span class="inline-flex items-center text-sm text-primary-500"
								>or click <Plus size={16} class="text-white mx-2" /> to browse</span
							>
							<span class="text-sm text-primary-500">(flac, mp3, ogg, wav)</span>
						</div>
					{/if}
				</div>
			</div>
			<div class="flex flex-col gap-3 px-4 py-2">
				<div class="flex items-center">
					<div class="flex items-center gap-2">
						<span class="text-xs text-primary-400">Total Jingles:</span>
						<span class="text-xs font-bold text-white">{jinglesList.length}</span>
					</div>
					<i class="text-xs text-primary-600 px-2">|</i>
					<div class="flex items-center gap-2">
						<span class="text-xs text-primary-400">Selected:</span>
						<span class="text-xs font-bold text-white">{selectedSong.length}</span>
					</div>
					{#if missingFiles.missingJinglesCount > 0}
						<i class="text-xs text-primary-600 px-2">|</i>
						<div class="flex items-center gap-2">
							<span class="text-xs text-red-400">Missing:</span>
							<span class="text-xs font-bold text-red-400"
								>{missingFiles.missingJinglesCount}</span
							>
						</div>
					{/if}
				</div>
				<div class="flex items-center grow gap-2">
					<label
						for="song-filter"
						class="text-xs text-white"
						class:opacity-50={!jinglesList!.length}>Filter:</label
					>
					<div class="flex w-full bg-primary-700/50 border border-primary-600 rounded-lg">
						<input
							bind:value={jingleFilter}
							id="song-filter"
							class="size-full px-2 py-1 text-sm text-white"
							type="text"
							spellcheck="false"
							autocomplete="off"
							disabled={!jinglesList.length}
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
			background-color: color-mix(in srgb, var(--color-primary-700) 50%, transparent);
		}
	}

	#jingles-table {
		&:focus-within {
			outline: none;

			tbody tr.selected {
				background-color: var(--color-slate-700);
			}
		}

		&:focus-visible tbody:not(:has(tr.selected)) {
			outline: none;

			tr:first-of-type {
				box-shadow: inset 0 0 0 1px var(--color-blue-300);
			}
		}

		tbody tr {
			&.selected {
				background-color: color-mix(in srgb, var(--color-slate-600) 40%, transparent);
			}

			&.error {
				& td div {
					color: var(--color-red-400);
				}
			}

			&:hover {
				box-shadow: inset 0 0 0 1px var(--color-blue-300);
			}

			&:not(.selected):hover {
				background-color: color-mix(in srgb, var(--color-slate-700) 50%, transparent);
			}
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
