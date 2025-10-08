<script lang="ts">
	import logger from '$lib/stores/logger';
	import { openPath } from '@tauri-apps/plugin-opener';

	let console = $state<HTMLElement>();
	const dirRegex = /(?:[A-Z]:\\(?:[^\\:\n]+\\)*[^\\:\n]+|\/(?:[^\/:\n]+\/)*[^\/:\n]+)(?<!\.\w+)$/;

	function extractDir(line: string): { before: string; dir: string; after: string } | null {
		const match = dirRegex.exec(line);
		if (!match || match.index === undefined) return null;

		return {
			before: line.slice(0, match.index),
			dir: match[0],
			after: line.slice(match.index + match[0].length)
		};
	}

	$effect(() => {
		if (console && $logger) console.scrollTop = console.scrollHeight;
	});
</script>

<div class="flex h-40 min-w-full flex-col gap-2">
	<span class="text-xs text-white">Console</span>
	<div class="relative w-full grow rounded-md border-2 border-zinc-700">
		<div bind:this={console} class="absolute inset-2 overflow-auto">
			<code class="text-xs text-zinc-300">
				{#each $logger as line}
					{@const parts = extractDir(line)}
					<div>
						{#if parts}
							{parts.before}
							<button
								class="text-orange-300 underline"
								onclick={async () => await openPath(parts.dir)}>{parts.dir}</button
							>
							{parts.after}
						{:else}
							{line}
						{/if}
					</div>
				{/each}
			</code>
		</div>
	</div>
</div>
