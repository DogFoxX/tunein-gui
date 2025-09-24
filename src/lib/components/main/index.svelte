<script lang="ts">
	import Controls from './controls.svelte';
	import ConfigurationWindow from './configuration-window.svelte';
	import Console from './console.svelte';
	import XmlView from './xml-view.svelte';
</script>

<main class="absolute inset-0 flex flex-col gap-4 p-2">
	<Controls />
	<div class="flex min-h-0 flex-1 gap-4">
		<ConfigurationWindow />
		<XmlView />
	</div>
	<Console />
</main>
