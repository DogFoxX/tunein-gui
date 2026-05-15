<script lang="ts">
	// Tauri Imports
	import { Menu } from '@tauri-apps/api/menu';
	import { Image } from '@tauri-apps/api/image';
	import { LogicalPosition } from '@tauri-apps/api/dpi';
	import { Command } from 'tauri-plugin-shellx-api';
	import { getCurrentWindow } from '@tauri-apps/api/window';
	import { listen } from '@tauri-apps/api/event';
	import { invoke } from '@tauri-apps/api/core';
	import { writeTextFile, remove, mkdir, exists, copyFile, watch } from '@tauri-apps/plugin-fs';
	import { tempDir, join } from '@tauri-apps/api/path';
	import { save } from '@tauri-apps/plugin-dialog';

	// Tables Components
	import { SongsTable } from './tables';

	// Utils
	import { obj2xml } from '$lib/utils/xml';
	import logger from '$lib/utils/logger';

	// Stores
	import { settings, tabs } from '$lib/stores';
	import { radioData } from '$lib/stores';

	// Icons
	import { Bolt } from '@solar-icons/svelte/BoldDuotone';
	import { Tuning2 } from '@solar-icons/svelte/Bold';
	import JinglesTable from './tables/jingles-table.svelte';
	import { onMount } from 'svelte';

	let radioStoreData = $derived(
		radioData.state.find(
			(tabData) => tabData.tabId === tabs.state.find((tab) => tab.active)?.id
		)
	);

	// Missing files states
	let missingSongs = $state<Map<string, boolean>>(new Map());
	let missingSongsCount = $state(0);
	let missingJingles = $state<Map<string, boolean>>(new Map());
	let missingJinglesCount = $state(0);

	let unlisten = $state<(() => void) | null>(null);

	onMount(async () => {
		await checkMissingJingles();
		await checkMissingSongs();
	});

	async function startLog(path: string) {
		unlisten = await listen<string>('log-line', (e) => {
			logger.update('Processing... {}', e.payload);
		});

		await invoke('start_log_watch', { path });
	}

	async function stopLog(path: string) {
		if (unlisten) {
			unlisten();
			unlisten = null;
		}

		await invoke('stop_log_watch', { path });
	}

	// Create Radio
	async function create() {
		if (!radioStoreData) return;

		await checkMissingJingles();
		await checkMissingSongs();

		if (missingJinglesCount > 0 || missingSongsCount > 0)
			return logger.err('Missing or moved files. Ensure the highlighted files exist.');

		const savePath = await save({
			title: 'Select a save loaction',
			canCreateDirectories: true,
			defaultPath: `${radioStoreData.configuration.radioName}_${radioStoreData.configuration.radioId}.zip`,
			filters: [
				{
					name: 'ZIP Archive',
					extensions: ['zip']
				}
			]
		});

		if (!savePath) return;

		const tuneinCrewExe = await join(settings.state.tuneinCrew.dir!, 'TuneinCrew.exe');
		const tuneinCrewExeExist = await exists(tuneinCrewExe);

		const fmodExe = await join(settings.state.fmodDir!, 'fmod_designercl.exe');
		const fmodExeExist = await exists(fmodExe);

		if (!radioStoreData.configuration.radioId) return logger.err('Missing "Radio ID".');
		if (!radioStoreData.tracks.songs?.length) return logger.err('Missing "Tracks".');

		const temp = await tempDir();
		const tempPath = await join(temp, radioStoreData.tabId);
		exists(tempPath).then(async (exist) => {
			if (!exist) await mkdir(tempPath, {});
		});

		const jingles = {
			file: radioStoreData.tracks.jingles.map((obj) => obj.path)
		};

		const songs = {
			song: radioStoreData.tracks.songs.map((song) => {
				return {
					file: song.path,
					artist: song.artist,
					name: song.name,
					year: song.year,
					length: song.length,
					volume: song.volume_offset,
					force: radioStoreData?.configuration.force.value
				};
			})
		};

		const logoPath = await join(tempPath, 'thumb.dds');
		await invoke('convert_to_dds', {
			base64Input: radioStoreData.configuration.logo.data,
			outputDir: tempPath
		});

		const xmlData: XMLData = {
			project: {
				radio: {
					id: radioStoreData!.configuration.radioId,
					name: radioStoreData!.configuration.radioName,
					logo: logoPath,
					...(radioStoreData?.tracks.jingles.length
						? {
								jingles
							}
						: {}),
					...(radioStoreData?.tracks.songs.length && { songs })
				}
			}
		};

		const xmlPath = await join(tempPath, 'data.xml');
		await writeTextFile(xmlPath, obj2xml(xmlData));

		logger.info('Running TuneinCrew. The process could take a few minutes...');

		if (!tuneinCrewExeExist)
			return logger.err('Could not find "TuneinCrew.exe". Check path in Settings.');

		if (!fmodExeExist)
			return logger.err('Could not find "fmod_designercl.exe". Check path in Settings.');

		const command = Command.create(tuneinCrewExe, [xmlPath, fmodExe]);

		const logPath = await join(settings.state.tuneinCrew.dir!, 'fmod_designer.log');
		let commandSucess = $state<boolean>(true);

		command.stdout.once('data', async () => {
			logger.info('Processing...');

			await startLog(logPath);
		});

		command.stderr.once('data', async () => {
			logger.update('Processing... Failed!');
			await stopLog(logPath);
			logger.err(`Build failed. See log for more details: ${logPath}`);

			commandSucess = false;
		});

		command.once('error', async (err) => {
			logger.update('Processing... Failed!');
			await stopLog(logPath);
			logger.err(err);
			commandSucess = false;
		});

		command.on('close', async (e) => {
			await stopLog(logPath);

			if (commandSucess) {
				const zipFileName = `TuneinCrew${radioStoreData?.configuration.radioId}.zip`;
				const zipDataPath = await join(tempPath, zipFileName);
				const zipfileExist = await exists(zipDataPath);

				if (zipfileExist) {
					await copyFile(zipDataPath, savePath);
				}

				logger.info(
					`Saved Radio: [ID: ${radioStoreData?.configuration.radioId} | Name: ${radioStoreData?.configuration.radioName}] in ${savePath}`
				);
			}

			await remove(tempPath, { recursive: true });
		});

		command.spawn().catch(async () => {
			await stopLog(logPath);
			commandSucess = false;
		});
	}

	// Check for missing files
	async function checkMissingSongs() {
		if (!radioStoreData) return;

		const { songs } = radioStoreData.tracks;

		const result = await Promise.all(
			songs.map(async (s) => [s.path, !(await exists(s.path))] as const)
		);

		((missingSongs = new Map(result)),
			(missingSongsCount = result.reduce(
				(acc, [, isMissing]) => acc + (isMissing ? 1 : 0),
				0
			)));
	}

	async function checkMissingJingles() {
		if (!radioStoreData) return;

		const { jingles } = radioStoreData.tracks;

		const result = await Promise.all(
			jingles.map(async (s) => [s.path, !(await exists(s.path))] as const)
		);

		((missingJingles = new Map(result)),
			(missingJinglesCount = result.reduce(
				(acc, [, isMissing]) => acc + (isMissing ? 1 : 0),
				0
			)));
	}

	$effect(() => {
		getCurrentWindow().setTitle(`${radioStoreData?.configuration.radioName} - Tunein GUI`);
	});
</script>

<div class="flex flex-col size-full">
	<div class="flex flex-col overflow-hidden">
		<div class="flex w-full px-2 py-1 bg-primary-700">
			<button
				class="px-3 py-0.5 text-sm text-primary-300 hover:text-white hover:bg-primary-800/50 rounded-md transition-colors"
				>File</button
			>
			<button
				class="px-3 text-sm text-primary-300 hover:text-white hover:bg-primary-800/50 rounded-md transition-colors"
				>Edit</button
			>
			<button
				class="px-3 text-sm text-primary-300 hover:text-white hover:bg-primary-800/50 rounded-md transition-colors"
				>Window</button
			>
		</div>
		<div class="flex gap-10 p-4 bg-primary-700/50">
			<div class="flex flex-col gap-2">
				<button
					onclick={create}
					class="flex items-center justify-center px-10 py-3 text-xl text-white bg-orange-600/50 hover:bg-orange-600 border border-orange-600 rounded-lg transition-colors"
					title="Create Radio"
				>
					<Bolt />
				</button>
				<button
					onclick={() =>
						radioData.openConfig({
							header: `Configure ${radioStoreData?.configuration.radioName}`,
							tabId: radioStoreData?.tabId
						})}
					class="flex items-center justify-center gap-2 px-3 py-1.5 text-sm text-white bg-primary-800/50 hover:bg-primary-700/50 border border-primary-600 rounded-lg transition-colors"
				>
					<Tuning2 size={16} />
					<span>Configure</span>
				</button>
			</div>

			<div class="flex flex-col gap-2">
				<div class="flex grow items-center gap-4">
					<div class="relative size-22 overflow-hidden">
						{#if radioData}
							{@const src = radioStoreData?.configuration.logo.data}
							{#if !src}
								<div
									class="absolute inset-0 flex items-center justify-center bg-primary-600 rounded-lg"
								>
									<span class="text-sm text-primary-400 font-bold">No Logo</span>
								</div>
							{:else}
								<img
									height="512"
									width="512"
									class="absolute inset-0"
									{src}
									alt=""
								/>
							{/if}
						{/if}
					</div>
					<div class="flex flex-col gap-4">
						<div class="flex flex-col gap-2 px-2">
							<div class="flex gap-2">
								<div class="flex gap-2 px-3 py-1.5 bg-primary-900/50 rounded-lg">
									<span class="text-sm text-emerald-400 font-medium">ID:</span>
									<span class="w-[4ch] text-primary-300 text-sm"
										>{radioStoreData?.configuration.radioId}</span
									>
								</div>
								<div
									class="flex gap-2 w-50 rounded-md bg-primary-900/50 px-3 py-1.5"
								>
									<span class="text-sm text-emerald-400 font-medium">Force:</span>
									<span class="text-primary-300 text-sm"
										>{radioStoreData?.configuration.force.enabled
											? radioStoreData?.configuration.force.value === '0'
												? 'Disabled (0)'
												: radioStoreData?.configuration.force.value
											: 'Default (80)'}</span
									>
								</div>
								<div
									class="flex gap-2 w-50 px-3 py-1.5 bg-primary-900/50 rounded-lg"
								>
									<span class="text-sm text-emerald-400 font-medium"
										>Target Volume:</span
									>
									<span class="text-primary-300 text-sm"
										>{radioStoreData?.configuration.volume.enabled
											? `${radioStoreData?.configuration.volume.value} dB`
											: 'Disabled'}</span
									>
								</div>
							</div>
							<div class="flex gap-2 w-full">
								<div
									class="flex flex-1/2 gap-2 px-3 py-1.5 bg-primary-900/50 rounded-lg"
								>
									<span class="text-sm text-emerald-400 font-medium"
										>Songs #:</span
									>
									<span class="text-primary-300 text-sm"
										>{radioStoreData?.tracks?.songs.length
											? radioStoreData?.tracks?.songs.length
											: '- -'}</span
									>
								</div>
								<div
									class="flex flex-1/2 gap-2 px-3 py-1.5 bg-primary-900/50 rounded-lg"
								>
									<span class="text-sm text-emerald-400 font-medium"
										>Jingles #:</span
									>
									<span class="text-primary-300 text-sm"
										>{radioStoreData?.tracks?.jingles.length
											? radioStoreData?.tracks?.jingles.length
											: '- -'}</span
									>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
	<div class="flex grow p-4 gap-4">
		<JinglesTable
			bind:radioStoreData={radioStoreData!}
			missingFiles={{ missingJingles, missingJinglesCount }}
			checkMissing={checkMissingJingles}
		/>
		<SongsTable
			bind:radioStoreData={radioStoreData!}
			missingFiles={{ missingSongs, missingSongsCount }}
			checkMissing={checkMissingSongs}
		/>
	</div>
</div>

<style>
</style>
