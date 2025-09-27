<script lang="ts">
	import { fly } from 'svelte/transition';
	import { readTextFile, watchImmediate } from '@tauri-apps/plugin-fs';
	import { invoke } from '@tauri-apps/api/core';
	import { listen } from '@tauri-apps/api/event';
	import { Command } from '@tauri-apps/plugin-shell';
	import { dirname, join } from '@tauri-apps/api/path';
	import { saveXML, openXML } from '$lib/utils/dialog';
	import { obj2xml } from '$lib/utils/xml-convert/index';
	import { xmlView, xmlData } from '$lib/stores/xml-obj.store';
	import { settingsOpen, settings } from '$lib/stores/settings.store';
	import { stdOut } from '$lib/stores/global';

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
		const now = new Date();
		const hours = String(now.getHours()).padStart(2, '0');
		const minutes = String(now.getMinutes()).padStart(2, '0');
		const seconds = String(now.getSeconds()).padStart(2, '0');

		const logFile = await join(await dirname($settings.tuneinCrew.dir));

		const unwatch = await watchImmediate(logFile, ({ paths }) => {
			paths.forEach(async (path) => {
				if (path.includes('fmod_designer.log')) {
					try {
						const contents = await readTextFile(paths[0]);
						const lines = contents.split(/\r?\n/).filter((line) => line.trim() !== '');
						const currentLastLine = lines[lines.length - 1];

						stdOut.update((arr) => {
							const newarr = [
								...arr,
								`[${hours}:${minutes}:${seconds}] ${currentLastLine}`
							];
							return Array.from(new Set(newarr));
						});
					} catch (e) {
						console.error('Failed to read log file:', e);
					}
				}
			});
		});

		const command = Command.create('exec', [
			$settings.tuneinCrew.dir,
			`"D:\\Games\\The Crew Unlimited\\TuneinCrew\\Stations\\NFSU2\\station.xml"`
		]);

		command.stdout.on('data', (msg) =>
			stdOut.update((arr) => {
				const newarr = [...arr, msg];
				return Array.from(new Set(newarr));
			})
		);
		command.on('close', () => {
			unwatch();
			stdOut.update((arr) => {
				const newarr = [...arr, `[${hours}:${minutes}:${seconds}] TuneinCrew finished`];
				return Array.from(new Set(newarr));
			});
		});

		command.spawn();
	}
</script>

<div class="flex items-center gap-2">
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
		class="rounded-md bg-slate-700 px-4 py-1 text-white hover:bg-slate-500"
		title="Save (Ctrl + S)"
	>
		<SaveIcon width="20" height="20" />
	</button>
	<button
		onclick={create}
		class="rounded-md bg-slate-700 px-4 py-1 text-white hover:bg-slate-500"
		title="Create Radio Station"
	>
		<CreateIcon width="20" height="20" />
	</button>
	<button
		onclick={async () => {
			await openXML();
		}}
		class="rounded-md bg-slate-700 px-4 py-1 text-white hover:bg-slate-500"
		title="Import XML (Ctrl + I)"
	>
		<ImportIcon width="20" height="20" />
	</button>
	<button
		onclick={async () => {
			await saveXML(obj2xml($xmlData));
		}}
		class="rounded-md bg-slate-700 px-4 py-1 text-white hover:bg-slate-500"
		title="Export XML (Ctrl + E)"
	>
		<ExportIcon width="20" height="20" />
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
