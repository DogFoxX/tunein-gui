<script lang="ts">
	import { fade } from 'svelte/transition';
	import hljs from 'highlight.js/lib/core';
	import xml from 'highlight.js/lib/languages/xml';
	import { obj2Xml } from '$lib/utils/xml-convert/index';
	import { xmlView, xmlValues, tracks } from '$lib/stores/global';

	// Icons
	import SolarCopyBoldDuotone from '~icons/solar/copy-bold-duotone';

	hljs.registerLanguage('xml', xml);

	let xmlString = $derived(obj2Xml($xmlValues).trim());
	let highlightedCode = $derived(hljs.highlight(xmlString, { language: 'xml' }).value);
</script>

{#if $xmlView}
	<div transition:fade={{ duration: 180 }} class="flex h-full w-full min-w-80 flex-col gap-2">
		<label for="" class="text-xs text-white">XML Preview</label>
		<div
			class="flex h-full min-w-full grow overflow-hidden rounded-md p-2 outline-2 outline-zinc-700"
		>
			{#if highlightedCode}
				<div class="relative h-full w-full overflow-auto">
					<button
						class="absolute top-0 right-2 rounded-md bg-zinc-700 p-2 text-white"
						title="Copy XML"
					>
						<SolarCopyBoldDuotone width="24" height="24" />
					</button>
					<pre><code class="language-xml text-sm">{@html highlightedCode}</code></pre>
				</div>
			{:else}
				<div class="flex w-full flex-col items-center justify-center gap-2">
					<span class="text-center font-semibold text-zinc-500">XML Preview Panel</span>
					<span class="text-center text-sm text-zinc-500">
						Load a profile, import an XML file, or start editing to see a live preview
					</span>
				</div>
			{/if}
		</div>
	</div>
{/if}
