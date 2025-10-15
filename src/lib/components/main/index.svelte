<script lang="ts">
	import Controls from './controls.svelte';
	import Configuration from './configuration.svelte';
	import Console from './console.svelte';
	import XmlView from './xml-view.svelte';
</script>

<main class="absolute top-8 bottom-0 left-0 right-0 flex flex-col gap-4 p-2">
	<Controls />
	<Configuration />
	<!-- <XmlView /> -->
	<Console />
</main>
