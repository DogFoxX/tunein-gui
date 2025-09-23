<script lang="ts">
	import { listen } from '@tauri-apps/api/event';
	import { convertFileSrc } from '@tauri-apps/api/core';
	import { exists } from '@tauri-apps/plugin-fs';
	import { openFileDiag } from '$lib/utils/dialog';
	import type { DialogFilter } from '@tauri-apps/plugin-dialog';
	import ddsToDataUrl from '$lib/utils/dds-parse';
	import { onMount } from 'svelte';
	import parseAudio from '$lib/utils/audio-parse';
	import { xmlValues, tracks, forceValue } from '$lib/stores/global';

	// Icons
	import SolarRestartSquareBold from '~icons/solar/restart-square-bold';
	import SolarFolderOpenBoldDuotone from '~icons/solar/folder-open-bold-duotone';
	import SolarQuestionCircleBold from '~icons/solar/question-circle-bold';
	import SolarAddSquareBold from '~icons/solar/add-square-bold';
	import SolarTrashBinTrashBold from '~icons/solar/trash-bin-trash-bold';

	// Dialog Filters
	const audioFilter: DialogFilter[] = [
		{
			extensions: ['flac', 'mp3', 'ogg', 'wav', 'wma'],
			name: 'Audio Files'
		}
	];

	const imageFilter: DialogFilter[] = [
		{
			extensions: ['bmp', 'jpg', 'jpeg', 'png'],
			name: 'Image Files'
		}
	];

	let logoDropArea = $state<HTMLElement>();
	let audioDropArea = $state<HTMLElement>();

	let logoPath = $state('');
	let logoSrc = $state('');
	let force = $state('0');
	let trackPaths = $state<string[]>([]);
	let selected = $state<MetadataResult[]>([]);

	onMount(() => {
		listen<DragDropEventPayload>('tauri://drag-drop', (event) => {
			const { x, y } = event.payload.position;

			// get element under cursor
			const el = document.elementFromPoint(x, y);
			if (el && audioDropArea?.contains(el)) {
				const allowedExt = ['flac', 'mp3', 'ogg', 'wav', 'wma'];
				let files = event.payload.paths;

				trackPaths = files.filter((file) =>
					allowedExt.some((ext) => file.toLocaleLowerCase().endsWith(ext))
				);
			}

			if (el && logoDropArea?.contains(el)) {
				const allowedExt = ['bmp', 'jpg', 'jpeg', 'png'];
				let files = event.payload.paths;

				logoPath = files.filter((file) =>
					allowedExt.some((ext) => file.toLocaleLowerCase().endsWith(ext))
				)[0];
			}
		});
	});

	function generateId() {
		const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
		const array = new Uint32Array(4);
		crypto.getRandomValues(array);
		$xmlValues.project.radio.id = Array.from(array, (x) => chars[x % chars.length]).join('');
	}

	function removeTrack() {
		if (!selected.length) return;

		tracks.update((arr) => {
			// filter out selected ids
			const filtered = arr.filter(
				(track) => !selected.includes((track.id as MetadataResult) ?? -1)
			);

			// reassign ids so they match new index
			return filtered.map((t, i) => ({ ...t, id: i }));
		});

		// Clear selection
		selected = [];
	}

	function setForce() {
		xmlValues.update((obj) => ({
			...obj,
			project: {
				...obj.project,
				radio: {
					...obj.project.radio,
					songs: (obj.project.radio.songs ?? []).map((s) => ({
						song: { ...s.song, force: $forceValue }
					}))
				}
			}
		}));
	}

	function unsetForce() {
		xmlValues.update((obj) => ({
			...obj,
			project: {
				...obj.project,
				radio: {
					...obj.project.radio,
					songs: (obj.project.radio.songs ?? []).map((s) => ({
						song: (({ force, ...rest }) => rest)(s.song)
					}))
				}
			}
		}));
	}

	tracks.subscribe(() => {
		if (force == '1') setForce();
	});

	$effect(() => {
		if (trackPaths) {
			parseAudio(trackPaths).then((newTracks) => {
				tracks.update((arr) => {
					const startIndex = arr.length; // current length of tracks store
					// Assign IDs based on their final position in tracks
					const tracksWithIds = newTracks.map((t, i) => ({ ...t, id: startIndex + i }));
					return [...arr, ...tracksWithIds];
				});
			});
		}

		exists(logoPath)
			.then(() => (logoSrc = convertFileSrc(logoPath)))
			.catch(() => (logoSrc = ''));
	});

	$inspect(selected);
</script>

<div class="flex max-h-full min-w-max flex-col gap-4">
	<div class="flex gap-4">
		<div
			bind:this={logoDropArea}
			class="flex h-28 w-28 items-center justify-center rounded-md border-2 border-zinc-700 p-2"
		>
			{#if !logoSrc}
				<div class="flex h-full w-full flex-col items-center justify-center">
					<span class="text-sm font-semibold text-zinc-500">Logo Preview</span>
					<span class="text-center text-xs text-zinc-500"
						>Drop bmp, jpg, jpeg, png here</span
					>
				</div>
			{:else}
				<img src={logoSrc} alt="" width="512" height="512" />
			{/if}
		</div>
		<div class="flex flex-col gap-2">
			<div class="flex gap-2 overflow-hidden">
				<div class="flex flex-col gap-2">
					<label for="" class="text-xs text-white">ID (Unique)</label>
					<div class="flex items-center gap-2 rounded-md bg-zinc-700 px-2 py-1">
						<input
							bind:value={$xmlValues.project.radio.id}
							class="w-[8ch] text-sm text-white"
							type="text"
							maxlength="4"
							spellcheck="false"
						/>
						<button onclick={generateId} class="text-white" title="Generate Random ID">
							<SolarRestartSquareBold width="20" height="20" />
						</button>
					</div>
				</div>
				<div class="flex flex-col gap-2">
					<label for="" class="text-xs text-white">Radio Station Name</label>
					<div class="flex rounded-md bg-zinc-700 px-2 py-1">
						<input
							bind:value={$xmlValues.project.radio.name}
							class="w-[35ch] text-sm text-white"
							type="text"
							spellcheck="false"
							placeholder="eg. My Custom Radio"
						/>
					</div>
				</div>
			</div>
			<div class="flex flex-col gap-2">
				<label for="" class="text-xs text-white">Logo</label>
				<div class="flex items-center gap-2 rounded-md bg-zinc-700 px-2 py-1">
					<input
						bind:value={logoPath}
						class="w-full text-sm text-white"
						type="text"
						spellcheck="false"
						placeholder="Click browse to choose a logo file..."
					/>
					<button
						onclick={async () => {
							logoPath = await openFileDiag({
								title: 'Choose a logo',
								filters: imageFilter,
								multiple: false
							});
						}}
						class="text-white"
					>
						<SolarFolderOpenBoldDuotone width="20" height="20" />
					</button>
				</div>
			</div>
		</div>
		<div class="flex flex-col gap-3">
			<div class="flex items-center gap-2">
				<label for="" class="text-xs text-white">Force</label>
				<button
					class="text-white"
					title="This sets when the highpass cutoff filter disappears completely. Set to 0 to disable the effect, keep at global default, or enable per track force."
				>
					<SolarQuestionCircleBold width="16" height="16" />
				</button>
			</div>
			<div class="flex gap-4" role="radiogroup">
				<div class="flex gap-2">
					<input
						bind:group={force}
						onchange={unsetForce}
						type="radio"
						id="default"
						value="0"
					/>
					<label for="default" class="text-sm text-white">Global Default</label>
				</div>
				<div class="flex gap-2">
					<input
						bind:group={force}
						onchange={setForce}
						type="radio"
						id="global"
						value="1"
					/>
					<label for="global" class="text-sm text-white">Global Value</label>
				</div>
				<div class="flex gap-2">
					<input
						bind:group={force}
						onchange={unsetForce}
						type="radio"
						id="per-track"
						value="2"
					/>
					<label for="per-track" class="text-sm text-white">Per Track Force</label>
				</div>
			</div>
			<div class="flex flex-col gap-2">
				<label for="" class="text-xs text-white">Global Value</label>
				<div class="input-flex flex rounded-md bg-zinc-700 px-2 py-1">
					<input
						bind:value={$forceValue}
						oninput={(e) => {
							const target = e.target as HTMLInputElement;
							$forceValue = target.value
								.replace(/[^0-9]/g, '')
								.replace(/^0+(?=\d)/, '');
							if ($forceValue == '') $forceValue = '0';
						}}
						disabled={force !== '1'}
						class="w-full text-sm text-white"
						type="text"
						inputmode="numeric"
						maxlength="3"
						spellcheck="false"
						placeholder="eg. 200"
					/>
				</div>
			</div>
		</div>
	</div>
	<div class="flex grow gap-2">
		<div class="flex flex-col gap-2">
			<label for="" class="text-sm text-white">Tracks</label>
			<div
				class="relative flex h-full w-100 flex-col overflow-hidden rounded-md border-2 border-zinc-700 pb-11"
			>
				<div bind:this={audioDropArea} class="h-full w-full overflow-hidden" role="group">
					{#if $tracks.length > 0}
						<select
							multiple
							bind:value={selected}
							class="h-full w-full overflow-x-hidden overflow-y-auto text-sm text-white"
						>
							{#each $tracks as track}
								<option
									class="w-full truncate bg-gradient-to-r from-100% px-2 py-1 checked:from-zinc-700"
									value={track.id}
									title={track.text}
								>
									{track.text}
								</option>
							{/each}
						</select>
					{:else}
						<div class="flex h-full w-full flex-col items-center justify-center">
							<span class="font-semibold text-zinc-500">Drop audio file(s) here</span>
							<span class="text-sm text-zinc-500"
								>...or click "Add File(s)" to browse</span
							>
							<span class="text-sm text-zinc-500"
								>Accepts flac, mp3, ogg, wav, wma</span
							>
						</div>
					{/if}
				</div>
				<div class="absolute right-0 bottom-0 left-0 flex items-center gap-2 px-2 py-2">
					<button
						onclick={async () =>
							(trackPaths = await openFileDiag({
								title: 'Choose audio file(s)',
								filters: audioFilter,
								multiple: true
							}))}
						class="flex gap-2 rounded-md bg-zinc-700 px-2 py-1 text-sm text-white"
					>
						<SolarAddSquareBold width="20" height="20" />
						<span>Add File(s)</span>
					</button>
					<button
						onclick={removeTrack}
						class="flex gap-2 rounded-md bg-zinc-700 px-2 py-1 text-sm text-white"
						disabled={!selected.length}
					>
						<SolarTrashBinTrashBold width="20" height="20" />
						<span>Remove</span>
					</button>
					<div class="flex h-full grow items-center justify-end gap-2">
						<span class="text-sm text-zinc-400">Total Tracks:</span>
						<span class="text-sm font-bold text-white">{$tracks?.length}</span>
					</div>
				</div>
			</div>
		</div>
		<div class="flex grow flex-col gap-2">
			<label for="" class="text-sm text-white">Track Info</label>
			<div class="flex grow flex-col rounded-md border-2 border-zinc-700 p-4">
				{#if !selected.length || selected.length > 1}
					<div class="flex h-full w-full flex-col items-center justify-center">
						<span class="font-semibold text-zinc-500">No track selected</span>
					</div>
				{:else}
					<div class="flex flex-col gap-4">
						<div class="flex min-w-0 gap-4">
							<div class="flex flex-1 flex-col gap-2">
								<label for="" class="text-xs text-white">Artist</label>
								<div class="flex rounded-md bg-zinc-700 px-2 py-1">
									<input
										bind:value={$tracks[selected as any].artist}
										class="w-full text-sm text-white"
										type="text"
										spellcheck="false"
										placeholder="Artist"
									/>
								</div>
							</div>
							<div class="flex min-w-0 flex-1 flex-col gap-2">
								<label for="" class="text-xs text-white">Name</label>
								<div class="flex rounded-md bg-zinc-700 px-2 py-1">
									<input
										bind:value={$tracks[selected as any].name}
										class="w-full text-sm text-white"
										type="text"
										spellcheck="false"
										placeholder="Track Title"
									/>
								</div>
							</div>
						</div>
						<div class="flex min-w-0 gap-4">
							<div class="flex min-w-0 flex-1 flex-col gap-2">
								<label for="" class="text-xs text-white">Year</label>
								<div class="flex rounded-md bg-zinc-700 px-2 py-1">
									<input
										bind:value={$tracks[selected as any].year}
										class="w-full text-sm text-white"
										type="text"
										spellcheck="false"
										placeholder="eg. 1969"
									/>
								</div>
							</div>
							<div class="flex min-w-0 flex-1 flex-col gap-2">
								<label for="" class="text-xs text-white">Length</label>
								<div class="flex rounded-md bg-zinc-700 px-2 py-1">
									<input
										bind:value={$tracks[selected as any].length}
										class="w-full text-sm text-white"
										type="text"
										spellcheck="false"
										placeholder="eg. 4:20"
									/>
								</div>
							</div>
							<div class="flex-col gap-2">
								<label for="" class="text-xs text-white">Force</label>
								<div class="input-flex flex rounded-md bg-zinc-700 px-2 py-1">
									<input
										bind:value={
											$xmlValues.project.radio.songs[selected as any].song
												.force
										}
										oninput={(e) => {
											const target = e.target as HTMLInputElement;
											$xmlValues.project.radio.songs[
												selected as any
											].song.force = target.value
												.replace(/[^0-9]/g, '')
												.replace(/^0+(?=\d)/, '');
											if (
												$xmlValues.project.radio.songs[selected as any].song
													.force == ''
											)
												$xmlValues.project.radio.songs[
													selected as any
												].song.force = '0';
										}}
										disabled={force !== '2'}
										class="text-sm text-white"
										type="text"
										maxlength="3"
										spellcheck="false"
										placeholder="Default 80"
									/>
								</div>
							</div>
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>
