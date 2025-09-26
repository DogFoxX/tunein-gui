<script lang="ts">
	import { listen } from '@tauri-apps/api/event';
	import { convertFileSrc } from '@tauri-apps/api/core';
	import { appDataDir } from '@tauri-apps/api/path';
	import { exists } from '@tauri-apps/plugin-fs';
	import { openFileDiag } from '$lib/utils/dialog';
	import type { DialogFilter } from '@tauri-apps/plugin-dialog';
	import { showDDSImage, convertToDds, convertImageToDds } from '$lib/utils/dds-parse';
	import { onMount } from 'svelte';
	import parseAudio from '$lib/utils/audio-parse';
	import {
		xmlData,
		tracks,
		updateTrack,
		updateTracks,
		resetForce
	} from '$lib/stores/xml-obj.store';

	// Icons
	import SolarRestartSquareBold from '~icons/solar/restart-square-bold';
	import SolarFolderOpenBoldDuotone from '~icons/solar/folder-open-bold-duotone';
	import SolarQuestionCircleBold from '~icons/solar/question-circle-bold';
	import SolarAddSquareBold from '~icons/solar/add-square-bold';
	import SolarTrashBinTrashBold from '~icons/solar/trash-bin-trash-bold';
	import { fade } from 'svelte/transition';

	// Dialog Filters
	const audioFilter: DialogFilter[] = [
		{
			extensions: ['flac', 'mp3', 'ogg', 'wav', 'wma'],
			name: 'Audio Files'
		}
	];

	const imageFilter: DialogFilter[] = [
		{
			extensions: ['dds', 'bmp', 'jpg', 'jpeg', 'png'],
			name: 'Image Files'
		}
	];

	let logoDropArea = $state<HTMLElement>();
	let audioDropArea = $state<HTMLElement>();

	// Track List SelectEl
	let trackList = $state<HTMLElement>();
	let selected = $state([]);

	let logoPath = $state('');
	let logoSrc = $state('');
	let force = $state('0');
	let forceGlobVal = $state('0');
	let trackPaths = $state<string[]>([]);

	let radioId = $derived($xmlData.project.radio.id);
	let radioName = $derived($xmlData.project.radio.name);

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
				const allowedExt = ['dds', 'bmp', 'jpg', 'jpeg', 'png'];
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
		$xmlData.project.radio.id = Array.from(array, (x) => chars[x % chars.length]).join('');
	}

	function removeTrack() {
		updateTracks($tracks.filter((_, i) => !selected.some((n) => i == n)));

		selected = [];
	}

	$effect(() => {
		if (trackPaths.length) {
			parseAudio(trackPaths).then((newTracks) => {
				let added = [...$tracks, ...newTracks];
				updateTracks(added);
			});
		}
	});

	$effect(() => {
		if (logoPath) {
			exists(logoPath)
				.then(async () => {
					let imageExts = ['bmp', 'jpeg', 'jpg', 'png'];

					let ext = logoPath.split('.').pop()?.toLowerCase();

					if (imageExts.includes(ext ?? '')) {
						convertImageToDds(logoPath);
						return (logoSrc = convertFileSrc(logoPath));
					}
					logoSrc = await showDDSImage(logoPath);
				})
				.catch(() => (logoSrc = ''));
		}
	});
</script>

<div class="flex max-h-full min-w-max flex-col gap-4">
	<div class="flex gap-4">
		<div
			bind:this={logoDropArea}
			class="relative flex h-28 w-28 items-center justify-center rounded-md border-2 border-zinc-700 p-2"
		>
			{#if !logoSrc}
				<div
					transition:fade={{ duration: 120 }}
					ondblclick={async () => {
						logoPath = await openFileDiag({
							title: 'Choose a logo',
							filters: imageFilter,
							multiple: false
						});
					}}
					class="absolute inset-2 flex flex-col items-center justify-center gap-2"
					role="img"
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
					<div class="flex items-center gap-2 rounded-md bg-zinc-700 px-2 py-1">
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
							<SolarRestartSquareBold width="20" height="20" />
						</button>
					</div>
				</div>
				<div class="flex flex-col gap-2">
					<label for="radio-name" class="text-xs text-white">Radio Station Name</label>
					<div class="flex rounded-md bg-zinc-700 px-2 py-1">
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
				<div class="flex items-center gap-2 rounded-md bg-zinc-700 px-2 py-1">
					<input
						bind:value={logoPath}
						id="logo-src"
						class="w-full text-sm text-white"
						type="text"
						spellcheck="false"
						placeholder="Click browse to choose a logo file..."
						autocomplete="off"
					/>
					<button
						onclick={async () => {
							logoPath = await openFileDiag({
								title: 'Choose a logo',
								filters: imageFilter,
								multiple: false
							});
						}}
						class="rounded-md text-white"
					>
						<SolarFolderOpenBoldDuotone width="20" height="20" />
					</button>
				</div>
			</div>
		</div>
		<div class="flex flex-col gap-3">
			<div class="flex items-center gap-2">
				<sapn class="text-xs text-white">Force</sapn>
				<button
					class="text-white"
					tabindex="-1"
					title="This sets when the highpass cutoff filter disappears completely. Set to 0 to disable the effect, keep at global default, or enable per track force."
				>
					<SolarQuestionCircleBold width="16" height="16" />
				</button>
			</div>
			<div class="flex gap-4" role="radiogroup">
				<div class="flex gap-2">
					<input
						bind:group={force}
						onchange={resetForce}
						type="radio"
						id="default"
						value="0"
					/>
					<label for="default" class="text-sm text-white">Global Default</label>
				</div>
				<div class="flex gap-2">
					<input
						bind:group={force}
						onchange={() => {
							$tracks.forEach((_, i) => {
								updateTrack(i, 'force', forceGlobVal);
							});
						}}
						type="radio"
						id="global"
						value="1"
					/>
					<label for="global" class="text-sm text-white">Global Value</label>
				</div>
				<div class="flex gap-2">
					<input bind:group={force} type="radio" id="per-track" value="2" />
					<label for="per-track" class="text-sm text-white">Per Track Value</label>
				</div>
			</div>
			<div class="flex flex-col gap-2">
				<label for="force-val" class="text-xs text-white">Global Value</label>
				<div class="input-flex flex rounded-md bg-zinc-700 px-2 py-1">
					<input
						bind:value={forceGlobVal}
						oninput={(e) => {
							forceGlobVal = forceGlobVal.replace(/\D/g, '');
							forceGlobVal = forceGlobVal.replace(/^0+/, '');
							if (forceGlobVal === '') forceGlobVal = '0';

							$tracks.forEach((_, i) => {
								updateTrack(i, 'force', forceGlobVal);
							});
						}}
						id="force-val"
						class="w-full text-sm text-white"
						type="text"
						maxlength="3"
						spellcheck="false"
						placeholder="eg. 200"
						disabled={force !== '1'}
						autocomplete="off"
					/>
				</div>
			</div>
		</div>
	</div>
	<div class="flex grow gap-2">
		<div class="flex flex-col gap-2">
			<span class="text-sm text-white">Tracks</span>
			<div
				class="relative flex h-full w-100 flex-col overflow-hidden rounded-md border-2 border-zinc-700 pb-11"
			>
				<div
					bind:this={audioDropArea}
					class="relative h-full w-full overflow-hidden"
					role="group"
				>
					{#if $tracks.length > 0}
						<div transition:fade={{ duration: 180 }} class="absolute inset-0">
							<select
								bind:this={trackList}
								bind:value={selected}
								onkeydown={(e) => {
									if (e.key === 'Escape') selected = [];
									if (
										(e.key === 'Delete' || e.key === 'Backspace') &&
										selected.length
									)
										removeTrack();
								}}
								class="h-full w-full overflow-x-hidden overflow-y-auto text-sm text-white"
								multiple
							>
								{#each $tracks as track, i}
									<option
										class="w-full truncate bg-gradient-to-r from-100% px-2 py-1 checked:from-zinc-700"
										value={i}
										title={track.name}
									>
										{i + 1}. {track.artist} - {track.name}
									</option>
								{/each}
							</select>
						</div>
					{:else}
						<div
							transition:fade={{ duration: 80 }}
							class="absolute inset-0 flex flex-col items-center justify-center"
						>
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
			<span class="text-sm text-white">Track Info</span>
			<div class="relative flex grow flex-col rounded-md border-2 border-zinc-700">
				{#if !selected.length || selected.length > 1}
					<div
						transition:fade={{ duration: 80 }}
						class="absolute inset-0 flex flex-col items-center justify-center"
					>
						<span class="font-semibold text-zinc-500">No track selected</span>
					</div>
				{:else}
					<div
						transition:fade={{ duration: 80 }}
						class="absolute inset-2 flex flex-col gap-4"
					>
						<div class="flex flex-col gap-4">
							<div class="flex flex-col gap-2">
								<label for="track-artist" class="text-xs text-white">Artist</label>
								<div class="flex rounded-md bg-zinc-700 px-2 py-1">
									<input
										value={$tracks[selected as any].artist}
										oninput={(e) =>
											updateTrack(
												selected as any,
												'artist',
												e.currentTarget.value
											)}
										id="track-artist"
										class="w-full text-sm text-white"
										type="text"
										spellcheck="false"
										placeholder="Artist"
										autocomplete="off"
									/>
								</div>
							</div>
							<div class="flex flex-col gap-2">
								<label for="track-name" class="text-xs text-white">Name</label>
								<div class="flex rounded-md bg-zinc-700 px-2 py-1">
									<input
										bind:value={$tracks[selected as any].name}
										oninput={(e) =>
											updateTrack(
												selected as any,
												'name',
												e.currentTarget.value
											)}
										id="track-name"
										class="w-full text-sm text-white"
										type="text"
										spellcheck="false"
										placeholder="Track Title"
										autocomplete="off"
									/>
								</div>
							</div>
						</div>
						<div class="flex gap-4">
							<div class="flex flex-1 flex-col gap-2">
								<label for="track-year" class="text-xs text-white">Year</label>
								<div class="flex rounded-md bg-zinc-700 px-2 py-1">
									<input
										bind:value={$tracks[selected as any].year}
										oninput={(e) => {
											let year = e.currentTarget.value;
											year = year.replace(/\D/g, '');
											year = year.replace(/^0+/, '');
											if (year === '') year = '0';

											updateTrack(selected[0], 'year', year);
										}}
										id="track-year"
										class="w-full text-sm text-white"
										type="text"
										maxlength="4"
										spellcheck="false"
										placeholder="eg. 1969"
										autocomplete="off"
									/>
								</div>
							</div>
							<div class="flex flex-1 flex-col gap-2">
								<label for="track-length" class="text-xs text-white">Length</label>
								<div class="flex rounded-md bg-zinc-700 px-2 py-1">
									<input
										bind:value={$tracks[selected as any].length}
										oninput={(e) =>
											updateTrack(
												selected as any,
												'length',
												e.currentTarget.value
											)}
										id="track-length"
										class="w-full text-sm text-white"
										type="text"
										spellcheck="false"
										placeholder="eg. 4:20"
										autocomplete="off"
									/>
								</div>
							</div>
							<div class="flex-1 flex-col gap-2">
								<label for="track-force" class="text-xs text-white">Force</label>
								<div class="input-flex flex rounded-md bg-zinc-700 px-2 py-1">
									<input
										bind:value={$tracks[selected[0]].force}
										oninput={(e) => {
											let forceVal = e.currentTarget.value;
											forceVal = forceVal.replace(/\D/g, '');
											forceVal = forceVal.replace(/^0+/, '');
											if (forceVal === '') forceVal = '0';

											updateTrack(selected[0], 'force', forceVal);
										}}
										id="track-force"
										class="w-full text-sm text-white"
										type="text"
										maxlength="3"
										spellcheck="false"
										placeholder="Default 80"
										autocomplete="off"
										disabled={force !== '2'}
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
