<script lang="ts">
	import { fade } from 'svelte/transition';
	import hljs from 'highlight.js/lib/core';
	import xml from 'highlight.js/lib/languages/xml';
	import { obj2xml } from '$lib/utils/xml-convert/index';
	import { xmlView } from '$lib/stores/xml-obj.store';
	import { xmlData } from '$lib/stores/xml-obj.store';

	// Icons
	import SolarCopyBoldDuotone from '~icons/solar/copy-bold-duotone';

	hljs.registerLanguage('xml', xml);

	let xmlString = $derived(obj2xml($xmlData));
	let highlightedCode = $derived(hljs.highlight(xmlString, { language: 'xml' }).value);

	let codeEl = $state<HTMLElement>();
	let hasValues = $state(false);
	let showCopy = $state(false);

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
		<span class="text-xs text-white">XML Preview</span>
		<div
			onmouseenter={() => (showCopy = true)}
			onmouseleave={() => (showCopy = false)}
			role="none"
			class="relative flex grow overflow-hidden rounded-md border-2 border-zinc-700"
		>
			{#if hasValues}
				{#if showCopy}
					<button
						transition:fade={{ duration: 80 }}
						onclick={() => navigator.clipboard.writeText(codeEl?.textContent as string)}
						class="absolute right-6 bottom-6 z-10 rounded-md bg-zinc-700 p-2 text-white"
						title="Copy XML"
					>
						<SolarCopyBoldDuotone width="24" height="24" />
					</button>
				{/if}
				<div class="absolute inset-2 overflow-auto">
					<pre><code bind:this={codeEl} class="language-xml text-sm"
							>{@html highlightedCode}</code
						></pre>
				</div>
			{:else}
				<div
					transition:fade={{ duration: 180 }}
					class="absolute inset-2 flex flex-col items-center justify-center gap-2"
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
