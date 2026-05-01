<script lang="ts">
	// Svelte Imports
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';

	// Utils
	import { customInput } from '$lib/utils';
	import columnResize from '$lib/utils/column-resize';

	// Stores
	import { radioData, tabs, tables } from '$lib/stores';

	// Icons
	import { Plus } from '$assets/tg-icons';
	import { AltArrowDown, AltArrowUp } from '@solar-icons/svelte/Outline';
	import { TrashBinTrash } from '@solar-icons/svelte/Bold';
	import { filename } from '@tauri-apps/plugin-window-state';

	let audioDropArea = $state<HTMLElement>();

	// Table Vars
	let loadingSongs = $state<boolean>();
	let songPaths = $state<string[]>([]);
	let filteredSongs = $state<JinglesType[]>([]);
	let jingleFilter = $state('');
	let selectedSong = $state<number[]>([]);
	let lastSelectedIndex = $state<number | null>(null);
	let windowShiftDown = $state<boolean>();
	let windowCtrlDown = $state<boolean>();
	let shiftAnchorIndex = $state<number | null>(null);

	const tableFields = ['File', 'Filename'];

	const fieldMap: (keyof JinglesType)[] = ['file', 'filename'];

	// Songs
	let jinglesList = $derived<JinglesType[]>(
		radioData.state.find(
			(tabData) => tabData.tabId === tabs.state.find((tab) => tab.active)?.id
		)?.tracks?.jingles ?? [
			{
				id: '1',
				file: 'Test Jingle.wav',
				filename: 'C:\\test songs\\Test Jingle.wav'
			}
		]
	);

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

	function focusRow(index: number) {
		if (!audioDropArea) return;

		const row = document.querySelector(`tr[data-index="${index}"]`);

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

	function removeTrack() {
		jinglesList = jinglesList.filter((_, i) => !selectedSong.some((n) => n === i));

		selectedSong = [];
		lastSelectedIndex = null;
	}

	// Update 'filterSongs' for searching
	$effect(() => {
		if (jinglesList) {
			filteredSongs =
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
</script>

<svelte:window
	onkeydown={(e) => {
		windowShiftDown = e.shiftKey;
		windowCtrlDown = e.ctrlKey;

		if (document.activeElement !== audioDropArea || !filteredSongs.length) return;

		if (e.ctrlKey && e.key.toLowerCase() === 'a') {
			e.preventDefault();
			selectedSong = jinglesList.map((_, i) => i);
		}

		if (e.key === 'Home' && selectedSong.length) {
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

		if (e.key === 'End' && selectedSong.length) {
			e.preventDefault();

			if (windowShiftDown) {
				if (lastSelectedIndex !== null) {
					const start = lastSelectedIndex;
					const end = filteredSongs.length - 1;

					selectedSong = Array.from({ length: end - start + 1 }, (_, i) => start + i);
				}
			} else selectedSong = [filteredSongs.length - 1];

			lastSelectedIndex = filteredSongs.length - 1;
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
				: Math.min(filteredSongs.length - 1, lastSelectedIndex + 1);

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
					class="px-4 py-1 text-sm text-white bg-primary-700/50 hover:bg-primary-700 border border-primary-600 rounded-lg transition-colors"
					title="Add File(s)"
				>
					<Plus />
				</button>
				<button
					onclick={removeTrack}
					class="flex items-center justify-center gap-2 px-4 py-1 text-sm text-red-400 hover:text-red-500 bg-primary-700/50 hover:bg-primary-700 border border-primary-600 rounded-lg transition-colors"
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
					tabindex="0"
					id="songs-table"
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
														fields: tables.jingles_table!.fields.map(
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
																!tables.jingles_table?.ascending
															)
														);
													}

													tables.jingles_table = tables.jingles_table;
												}}
												class="sort absolute inset-0 flex overflow-hidden items-start justify-center text-primary-400 z-1"
												tabindex="-1"
											>
												{#if tables.jingles_table.fields[i].sort}
													{#if tables.jingles_table?.ascending}
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
														fields: tables.jingles_table!.fields.map(
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
						{#if filteredSongs.length}
							<tbody transition:fade={{ duration: 80 }}>
								{#each filteredSongs as song, index (song.id)}
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
										data-index={index}
									>
										{#each fieldMap as key, i}
											<td>
												{#if i <= 3}
													<div
														use:customInput={{
															onCancel: (el) => {
																el.innerText = song[key] as string;
															},
															onApply: (value) => {
																jinglesList[index][key] = value;
															}
														}}
														role="textbox"
														aria-multiline="false"
														class="truncate mx-1 my-0.5 px-1 py-0.5 text-xs text-white"
														tabindex="-1"
													>
														{song[key] ?? ''}
													</div>
												{:else}
													<div
														class="truncate px-2 py-1 text-xs text-white"
													>
														{song[key] ?? ''}
													</div>
												{/if}
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
						<span class="text-xs font-bold text-white">{jinglesList!.length}</span>
					</div>
					<i class="text-xs text-primary-600 px-2">|</i>
					<div class="flex items-center gap-2">
						<span class="text-xs text-primary-400">Selected:</span>
						<span class="text-xs font-bold text-white">{selectedSong.length}</span>
					</div>
				</div>
				<div class="flex items-center grow gap-2">
					<label for="song-filter" class="text-xs text-white">Filter:</label>
					<div class="flex w-full bg-primary-700/50 border border-primary-600 rounded-lg">
						<input
							bind:value={jingleFilter}
							id="song-filter"
							class="size-full px-2 py-1 text-sm text-white"
							type="text"
							spellcheck="false"
							autocomplete="off"
							disabled={!jinglesList!.length}
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
			background-color: var(--color-secondary);
		}
	}

	#songs-table {
		&:focus-within {
			outline: none;

			tbody tr.selected {
				background-color: #51a2ff99;
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
				background-color: #51a2ff66;
			}

			&:hover {
				box-shadow: inset 0 0 0 1px var(--color-blue-300);
			}

			&:not(.selected):hover {
				background-color: #51a2ff33;
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
