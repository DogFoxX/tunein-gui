<script lang="ts">
	import { fade } from 'svelte/transition';
	import hljs from 'highlight.js/lib/core';
	import xml from 'highlight.js/lib/languages/xml';
	import { obj2xml } from '$lib/utils/xml-convert/index';
	import { xmlView } from '$lib/stores/global';
	import { xmlData } from '$lib/stores/xml-obj.store';

	// Icons
	import SolarCopyBoldDuotone from '~icons/solar/copy-bold-duotone';

	hljs.registerLanguage('xml', xml);

	let xmlString = $derived(obj2xml($xmlData));
	let highlightedCode = $derived(hljs.highlight(xmlString, { language: 'xml' }).value);

	let hasValues = $state(false);

	$effect(() => {
		const radio = $xmlData.project.radio;
		hasValues = false;

		if (radio) {
			if (radio.id.trim() || radio.name.trim() || radio.logo.trim()) {
				hasValues = true;
			} else if (Array.isArray(radio.songs) && radio.songs.length > 0) {
				radio.songs.forEach(({ song }) => {
					if (Object.values(song).some((v) => (v ?? '').toString().trim() !== '')) {
						hasValues = true;
					}
				});
			}
		}
	});
</script>

{#if $xmlView}
	<div transition:fade={{ duration: 180 }} class="flex h-full w-full min-w-80 flex-col gap-2">
		<label for="" class="text-xs text-white">XML Preview</label>
		<div
			class="relative flex h-full min-w-full grow overflow-hidden rounded-md outline-2 outline-zinc-700"
		>
			{#if hasValues}
				<div transition:fade={{ duration: 180 }} class="absolute inset-2 overflow-auto">
					<button
						class="absolute top-0 right-2 rounded-md bg-zinc-700 p-2 text-white"
						title="Copy XML"
					>
						<SolarCopyBoldDuotone width="24" height="24" />
					</button>
					<pre><code class="language-xml text-sm">{@html highlightedCode}</code></pre>
				</div>
			{:else}
				<div
					transition:fade={{ duration: 180 }}
					class="absolute inset-0 flex flex-col items-center justify-center gap-2"
				>
					<span class="text-center font-semibold text-zinc-500">XML Preview Panel</span>
					<span class="text-center text-sm text-zinc-500">
						Load a profile, import an XML file, or start editing to see a live preview
					</span>
				</div>
			{/if}
		</div>
	</div>
{/if}
