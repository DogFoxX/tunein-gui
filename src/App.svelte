<script lang="ts">
	// Svelte Imports
	import { onMount } from 'svelte';

	// Components
	import { Console, Titlebar } from '$lib/window';
	import { Modal, Settings, About } from '$lib/window/modal';
	import { Home } from '$lib/tabs';

	// Stores
	import { settings, tabStore } from '$lib/stores';

	let { isOpen } = settings;

	let aboutOpen = $state(false);
</script>

<Titlebar />

{#await settings.init() then data}
	<main
		class="absolute top-10 bottom-0 left-0 right-0 flex flex-col rounded-t-lg overflow-hidden"
	>
		<div class="grow rounded-t-lg overflow-hidden">
			{#if !$tabStore.length || !$tabStore.some(({ active }) => active)}
				<Home />
			{/if}
		</div>
		<Console consoleDefaultOpen={data.logsDefaultOpen} />
		{#if $isOpen}
			<Modal
				components={{ Settings, About }}
				active="Settings"
				close={() => isOpen.set(false)}
				class="h-140 w-200"
			></Modal>
		{/if}
	</main>
{/await}

<style>
</style>
