<script lang="ts">
	import logger from '$lib/stores/logger';
	import { openPath } from '@tauri-apps/plugin-opener';
	import { open } from 'tauri-plugin-shellx-api';

	let console = $state<HTMLElement>();

	// ✅ Matches Windows and Unix paths, including files and folders
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
		if (console && $logger) console.scrollTop = console.scrollHeight;
	});
</script>

<div class="relative h-44 w-full bg-[#181818]">
	<div
		bind:this={console}
		class="absolute top-2 bottom-2 left-2 right-0 overflow-auto"
		tabindex="-1"
	>
		<code class="text-xs text-zinc-300">
			{#each $logger as line}
				{@const parts = extractPath(line)}
				{@const first = parts ? splitLogLevels(parts.before) : splitLogLevels(line)}

				<div class="whitespace-pre">
					{first.before}{#if first.level}<span class="{first.level.color} inline-block">
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

<style>
	code * {
		user-select: text;
	}
</style>
