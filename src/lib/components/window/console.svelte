<script lang="ts">
	// Svelte Imports
	import { slide } from 'svelte/transition';

	// Tauri Imports
	import { openPath } from '@tauri-apps/plugin-opener';

	// Stores
	import logger from '$lib/utils/logger';
	import { settings } from '$lib/stores';

	// Icons
	import { AltArrowUp } from '@solar-icons/svelte/Outline';
	import { Upload, TrashBinTrash } from '@solar-icons/svelte/Bold';

	let { consoleDefaultOpen }: { consoleDefaultOpen: boolean } = $props();

	let consoleComp = $state<HTMLElement>();
	let consoleOpen = $derived(settings.state.logsDefaultOpen ?? consoleDefaultOpen);

	let errorCount = $derived($logger.filter((l) => l.includes('ERR')).length);
	let warnCount = $derived($logger.filter((l) => l.includes('WARN')).length);

	const pathRegex = /(?:[A-Z]:\\(?:[^\\\r\n]+\\?)*[^\\\r\n]*|\/(?:[^\/\r\n]+\/?)*[^\/\r\n]*)/;

	const logLevels = [
		{ level: 'INFO', color: 'text-sky-300' },
		{ level: 'WARN', color: 'text-yellow-300' },
		{ level: 'ERR', color: 'text-red-400' }
	];

	function extractPath(line: string) {
		const match = pathRegex.exec(line);
		if (!match || match.index === undefined) return null;
		return {
			before: line.slice(0, match.index),
			path: match[0],
			after: line.slice(match.index + match[0].length)
		};
	}

	function splitLogLevels(text: string) {
		// find first level that appears in text
		const level = logLevels.find((l) => text.includes(l.level));
		if (!level) return { before: text, level: null, after: '' };

		const index = text.indexOf(level.level);
		return {
			before: text.slice(0, index),
			level,
			after: text.slice(index + level.level.length)
		};
	}

	$effect(() => {
		if (consoleComp && $logger) consoleComp.scrollTop = consoleComp.scrollHeight;
	});
</script>

<div class="flex relative flex-col border-t border-primary-700">
	<div class="flex items-center gap-4 p-2">
		<span class="text-xs text-white">Logs</span>
		<button
			onclick={() => (consoleOpen = !consoleOpen)}
			class="h-full px-2 py-1 text-primary-400 hover:text-white hover:bg-primary-600/50 rounded-md transition-colors"
			title={consoleOpen ? 'Collapse' : 'Expand'}
		>
			<AltArrowUp class="transition-all {consoleOpen && 'rotate-180'}" />
		</button>
		<div class="flex gap-2">
			<div
				class="flex items-center justify-center size-5 bg-red-600 rounded-full"
				class:opacity-50={errorCount === 0}
				title="{errorCount} error(s)"
			>
				<span class="text-xs text-white font-semibold">{errorCount}</span>
			</div>
			<div
				class="flex items-center justify-center size-5 bg-orange-400 rounded-full"
				class:opacity-50={warnCount === 0}
				title="{warnCount} warning(s)"
			>
				<span class="text-xs text-white font-semibold">{warnCount}</span>
			</div>
		</div>
		<button
			onclick={logger.export}
			class="flex items-center gap-1.5 h-full px-2 py-1 text-primary-400 hover:text-white hover:bg-primary-600/50 rounded-md transition-colors"
			disabled={!$logger.length}
		>
			<Upload />
			<span class="text-xs">Export Logs</span>
		</button>
		<button
			onclick={logger.clear}
			class="flex items-center gap-1.5 h-full px-2 py-1 text-primary-400 hover:text-white hover:bg-primary-600/50 rounded-md transition-colors"
			disabled={!$logger.length}
		>
			<TrashBinTrash />
			<span class="text-xs">Clear Logs</span>
		</button>
	</div>
	{#if consoleOpen}
		<div transition:slide class="relative flex flex-col h-42 w-full">
			<div
				bind:this={consoleComp}
				class="size-full p-2 overflow-y-scroll cursor-text select-text"
				tabindex="-1"
			>
				<code class="text-xs text-zinc-300">
					{#each $logger as line}
						{@const parts = extractPath(line)}
						{@const first = parts ? splitLogLevels(parts.before) : splitLogLevels(line)}

						<div class="whitespace-pre">
							{first.before}{#if first.level}<span
									class="{first.level.color} inline-block"
								>
									{first.level.level}
								</span>{/if}{#if parts}{#if first.after}{first.after}{/if}<button
									class="text-sky-200 underline cursor-pointer"
									onclick={() => openPath(parts.path)}>{parts.path}</button
								>{parts.after}{:else}{first.after}{/if}
						</div>
					{/each}
				</code>
			</div>
		</div>
	{/if}
</div>

<style>
	code * {
		user-select: text;
	}
</style>
