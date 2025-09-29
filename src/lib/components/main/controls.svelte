<script lang="ts">
	import { fly } from 'svelte/transition';
	import { Command } from '@tauri-apps/plugin-shell';
	import { exists, mkdir } from '@tauri-apps/plugin-fs';
	import { join } from '@tauri-apps/api/path';
	import { saveXML, openXML } from '$lib/utils/dialog';
	import { obj2xml } from '$lib/utils/xml-convert/index';
	import { xmlView, xmlData } from '$lib/stores/xml-obj.store';
	import { settingsOpen, settings } from '$lib/stores/settings.store';
	import { stdOut } from '$lib/stores/global';
	import formatCurrentTime from '$lib/utils/format-time';

	// Icons
	import CaretDown from '~icons/solar/alt-arrow-down-linear';
	import SaveIcon from '~icons/solar/file-bold-duotone';
	import ImportIcon from '~icons/solar/archive-down-minimlistic-line-duotone';
	import ExportIcon from '~icons/solar/archive-up-minimlistic-line-duotone';
	import CreateIcon from '~icons/solar/bolt-bold-duotone';
	import CodeIcon from '~icons/solar/code-bold-duotone';
	import SettingsIcon from '~icons/solar/settings-linear';

	let profileOpen = $state(false);

	async function create() {
		const stationPath = await join($settings.cwd, $xmlData.project.radio.name);

		const stationExist = await exists(stationPath);

		if (!stationExist) await mkdir(stationPath, { recursive: true });

		const xmlPath = await join(stationPath, 'data.xml');

		stdOut.update((arr) => {
			const newarr = [
				...arr,
				`${formatCurrentTime()} INFO: Exporting XML and saving logo file...`
			];
			return Array.from(new Set(newarr));
		});

		await saveXML(obj2xml($xmlData), xmlPath);

		stdOut.update((arr) => {
			const newarr = [...arr, `${formatCurrentTime()} INFO: Starting TuneinCrew.`];
			return Array.from(new Set(newarr));
		});

		const command = Command.create('exec', [$settings.tuneinCrew.dir, `"${xmlPath}"`]);

		command.stdout.on('data', (msg) =>
			stdOut.update((arr) => {
				const newarr = [...arr, msg];
				return Array.from(new Set(newarr));
			})
		);

		command.on('close', () => {
			stdOut.update((arr) => {
				const newarr = [
					...arr,
					`${formatCurrentTime()} INFO: Saved Radio: [ID: ${$xmlData.project.radio.id} | Name: ${$xmlData.project.radio.name}] in ${stationPath}`
				];
				return Array.from(new Set(newarr));
			});
		});

		command.spawn();
	}
</script>

<div class="relative flex w-full items-center gap-6">
	<div class="absolute inset-0 -z-10 flex justify-center gap-1">
		<span class="text-sm text-orange-300">Radio - Untitled</span>
		<span class="text-sm text-white">*</span>
	</div>
	<div class="flex gap-2">
		<div class="relative">
			<button
				onclick={() => (profileOpen = !profileOpen)}
				class="relative flex w-40 max-w-40 items-center rounded-md bg-slate-700 py-1 pr-8 pl-2 text-right text-sm text-white hover:bg-slate-500"
				class:!bg-slate-500={profileOpen == true}
			>
				<span>Select a Profile</span>
				<CaretDown width="16" height="16" class="absolute right-2" />
			</button>
			{#if profileOpen}
				<!-- <div
				transition:fly={{ y: 10, duration: 180 }}
				class="absolute top-8 right-0 left-0 overflow-hidden rounded-md bg-zinc-700 shadow-lg shadow-neutral-900"
			>
				<button class="w-full px-2 py-1 text-left text-sm text-white hover:bg-zinc-500">
					NFSU2
				</button>
			</div> -->
			{/if}
		</div>
		<button
			onclick={async () => {
				await openXML();
			}}
			class="rounded-md bg-slate-700 px-4 py-1 text-white hover:bg-slate-500"
			title="Import XML (Ctrl + I)"
		>
			<ImportIcon width="20" height="20" />
		</button>
	</div>
	<button
		onclick={create}
		class="rounded-md bg-orange-600 px-6 py-1 text-white hover:bg-orange-400"
		title="Create Radio Station"
	>
		<CreateIcon width="20" height="20" />
	</button>
	<div class="absolute right-2 flex gap-2">
		<button
			onclick={() => xmlView.set(!$xmlView)}
			class="rounded-md bg-slate-700 px-4 py-1 text-white hover:bg-slate-500"
			title="{!$xmlView ? 'Show' : 'Hide'} XML Preview"
		>
			<CodeIcon width="20" height="20" />
		</button>
		<button
			onclick={() => settingsOpen.set(true)}
			class="rounded-md bg-slate-700 px-4 py-1 text-white hover:bg-slate-500"
			title="Settings"
		>
			<SettingsIcon width="20" height="20" />
		</button>
	</div>
</div>
