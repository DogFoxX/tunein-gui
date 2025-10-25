<script lang="ts">
	// Svelte Imports
	import { fly } from 'svelte/transition';

	// Tauri Imports
	import { Command } from 'tauri-plugin-shellx-api';
	import { copyFile, exists, mkdir, readDir, remove } from '@tauri-apps/plugin-fs';
	import { join, extname } from '@tauri-apps/api/path';

	// Utils
	import { saveXML, openXML, openProfile, saveProfile } from '$lib/utils/dialog';
	import { obj2xml } from '$lib/utils/xml-convert/index';

	// Stores
	import { xmlData } from '$lib/stores/xml-obj.store';
	import { settings } from '$lib/stores/settings.store';
	import { profileData, trackList } from '$lib/stores/global';
	import logger from '$lib/stores/logger';

	// Icons
	import CaretDown from '~icons/solar/alt-arrow-down-linear';
	import SaveIcon from '~icons/solar/file-bold-duotone';
	import ImportIcon from '~icons/solar/archive-down-minimlistic-line-duotone';
	import CreateIcon from '~icons/solar/bolt-bold-duotone';

	let profileOpen = $state(false);
	let profiles = $state<{ name: string; path: string }[]>([]);
	let selectedProfile = $state<string>();

	async function findProfiles() {
		const cwd = $settings.cwd;

		let found: { name: string; path: string }[] = [];
		const dirExists = await exists(cwd);

		if (!dirExists) return (profiles = []);

		const stations = await readDir(cwd);

		if (!stations) return (profiles = []);

		for (const station of stations) {
			if (!station.name) continue;
			const dirname = await join(cwd, station.name);
			const entries = await readDir(dirname);

			for (const entry of entries) {
				if (entry.isFile) {
					const extension = await extname(entry.name);
					if (extension === 'tuneingui') {
						found.push({
							name: station.name,
							path: await join(dirname, entry.name)
						});
					}
				}
			}
		}

		profiles = found;
	}

	$effect(() => {
		if ($settings) findProfiles();
	});

	async function create() {
		const tuneinCrewExe = await join($settings.tuneinCrew.dir, 'TuneinCrew.exe');
		const exeExist = await exists(tuneinCrewExe);

		if (!$xmlData.project.radio.id) return logger.err('Missing "Radio ID".');

		if (!$xmlData.project.radio.songs?.length) return logger.err('Missing "Tracks".');

		const data = await saveData();

		if (!data) return;

		const { xmlPath, dataPath } = data;

		logger.info('Running TuneinCrew. The process could take a few minutes...');

		if (!exeExist) {
			logger.err('Could not find "TuneinCrew.exe". Check path in Settings.');
			return;
		}

		const command = Command.create(tuneinCrewExe, [xmlPath]);

		command.stdout.on('data', (msg) => logger.log(msg));

		command.on('close', async () => {
			const zipFileName = `TuneinCrew${$xmlData.project.radio.id}.zip`;
			const zipDataPath = await join(dataPath.tuneinCrewPath, zipFileName);
			const zipfileExist = await exists(zipDataPath);

			if (zipfileExist) {
				await copyFile(zipDataPath, await join(dataPath.root, zipFileName));
				await remove(zipDataPath);
			}
			logger.info(
				`Saved Radio: [ID: ${$xmlData.project.radio.id} | Name: ${$xmlData.project.radio.name}] in ${dataPath.root}`
			);
		});

		command.spawn().catch((err) => console.log(err));
	}

	async function saveData(): Promise<
		{ xmlPath: string; dataPath: { root: string; tuneinCrewPath: string } } | undefined
	> {
		if (!$xmlData.project.radio.name) {
			logger.err('Missing "Radio Station Name".');

			return;
		}

		const root = await join($settings.cwd, $xmlData.project.radio.name);
		const tuneinCrewPath = await join(root, '.tuneincrew_data');
		const stationExist = await exists(root);
		const dataPathExist = await exists(tuneinCrewPath);

		if (!stationExist) await mkdir(root, { recursive: true });
		if (!dataPathExist) await mkdir(tuneinCrewPath, { recursive: true });

		const profilePath = await join(
			root,
			`${$xmlData.project.radio.name.replaceAll(' ', '')}.tuneingui`
		);
		const xmlPath = await join(tuneinCrewPath, 'data.xml');

		logger.info('Saving data...');

		await saveProfile(
			obj2xml({
				comment: ['TUNEIN GUI GENERATED PROFILE DATA', 'DO NOT MODIFY'],
				profile: {
					'@_name': $xmlData.project.radio.name,
					'@_radioData': await join('.tuneincrew_data', 'data.xml'),
					glob_force: {
						'@_enable': $profileData.force.enable,
						'': $profileData.force.value
					},
					target_vol: {
						'@_enable': $profileData.targetVolume.enable,
						'': $profileData.targetVolume.value
					},
					tracks: {
						track: $trackList.map((track) => ({
							'@_number': track.number,
							'@_volume': track.measured_volume
						}))
					}
				}
			}),
			profilePath
		);

		await saveXML(obj2xml($xmlData), xmlPath);

		logger.update('Saving data... {}', 'Done');

		await loadProfile({ name: $xmlData.project.radio.name, path: profilePath });
		findProfiles();

		return {
			xmlPath,
			dataPath: {
				root,
				tuneinCrewPath
			}
		};
	}

	async function loadProfile(profile: { path: string; name: string }) {
		$profileData = await openProfile(profile.path);
		selectedProfile = profile.name;
	}
</script>

<svelte:window
	onkeydown={async (e) => {
		if (e.ctrlKey) {
			if (e.key === 'i') {
				e.preventDefault();
				return await openXML();
			}

			if (e.key === 's') {
				e.preventDefault();
				return await saveData();
			}
		}
	}}
/>

<div id="controls" class="flex w-full items-center gap-6 p-2">
	<div class="flex items-center gap-2">
		<div class="relative">
			<button
				onclick={() => (profileOpen = !profileOpen)}
				class="flex w-40 max-w-40 items-center rounded-md h-7 pr-8 pl-2 text-right text-xs !border-[1px] !border-slate-500 bg-slate-700 hover:bg-slate-500 text-white"
			>
				<span>
					{#if selectedProfile}
						{selectedProfile}
					{:else}
						Select a Profile
					{/if}
				</span>
				<CaretDown width="18" height="18" class="absolute right-2" />
			</button>
			{#if profileOpen}
				<div
					transition:fly={{ y: 10, duration: 180 }}
					class="absolute top-8 right-0 left-0 overflow-hidden rounded-md bg-zinc-700 shadow-lg shadow-neutral-900 z-10"
				>
					{#each profiles as profile}
						<button
							onclick={() => {
								loadProfile(profile);
								profileOpen = false;
							}}
							class="w-full px-2 py-1 text-left text-xs text-white hover:bg-zinc-500"
						>
							{profile.name}
						</button>
					{/each}
				</div>
			{/if}
		</div>
		<button
			onclick={saveData}
			class="rounded-md px-4 py-1 bg-slate-700 !border-[1px] !border-slate-500 hover:bg-slate-500 text-white"
			title="Save As (Ctrl + S)"
		>
			<SaveIcon width="18" height="18" />
		</button>
		<button
			onclick={async () => {
				await openXML();
			}}
			class="rounded-md px-4 py-1 bg-slate-700 !border-[1px] !border-slate-500 hover:bg-slate-500 text-white"
			title="Import XML (Ctrl + I)"
		>
			<ImportIcon width="18" height="18" />
		</button>
	</div>
	<button
		onclick={create}
		class="rounded-md px-6 py-1 hover:bg-orange-700 !border-[1px] !border-orange-700 bg-orange-900 max-h-full text-white"
		title="Create Radio Station"
		disabled={!profiles.length}
	>
		<CreateIcon width="18" height="18" />
	</button>
</div>
