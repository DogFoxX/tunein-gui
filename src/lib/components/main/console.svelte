<script lang="ts">
	import { stdOut } from '$lib/stores/global';

	let console = $state<HTMLElement>();

	$effect(() => {
		if (console && $stdOut) console.scrollTop = console.scrollHeight;
	});
</script>

<div class="flex h-40 min-w-full flex-col gap-2">
	<label for="" class="text-xs text-white">Console</label>
	<div class="relative w-full grow rounded-md border-2 border-zinc-700">
		<div bind:this={console} class="absolute inset-2 overflow-auto">
			<code class="text-xs text-zinc-300">
				{#each $stdOut as line}
					<div>{line}</div>
				{/each}
			</code>
		</div>
	</div>
</div>
