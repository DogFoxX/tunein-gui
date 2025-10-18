<script lang="ts">
	import { fade, scale } from 'svelte/transition';

	const { children } = $props();
</script>

<div
	transition:fade={{ duration: 280 }}
	class="absolute top-8 bottom-0 right-0 left-0 flex items-center justify-center backdrop-blur-xs"
>
	<div class="bg-primary absolute inset-0 opacity-70"></div>
	<div
		transition:scale={{ start: 0.9, duration: 100 }}
		class="bg-secondary relative z-10 flex h-[520px] w-[600px] flex-col gap-4 rounded-lg shadow-lg shadow-neutral-900"
	>
		{@render children()}
	</div>
</div>
