<script lang="ts">
	// Svelte Imports
	import { onMount } from 'svelte';

	// Components
	import { Console, Titlebar } from '$lib/window';
	import { Home } from '$lib/tabs';

	// Stores
	import { tabStore } from '$lib/stores/tabs';
</script>

<Titlebar />

<main class="absolute top-10 bottom-0 left-0 right-0 flex flex-col rounded-t-lg overflow-hidden">
	<div class="grow rounded-t-lg overflow-hidden">
		{#if !$tabStore.length || !$tabStore.some(({ active }) => active)}
			<Home />
		{/if}
	</div>
	<Console />
</main>

<style>
</style>
