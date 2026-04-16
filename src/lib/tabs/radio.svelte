<script lang="ts">
	// Toggle Component Asset
	import { Toggle } from '$assets';

	// Icons
	import { Bolt } from '@solar-icons/svelte/BoldDuotone';
	import { Diskette, Tuning2 } from '@solar-icons/svelte/Bold';
</script>

<div class="flex flex-col">
	<div class="flex gap-10 p-4 bg-primary-700 overflow-hidden">
		<div class="flex flex-col gap-2">
			<button
				class="flex items-center justify-center px-10 py-3 text-xl text-white bg-orange-900 hover:bg-orange-600 border border-orange-600 rounded-lg transition-colors"
				title="Create Radio"
			>
				<Bolt />
			</button>
			<button
				class="flex items-center justify-center gap-2 px-3 py-1.5 text-sm text-white bg-primary-750 hover:bg-primary-600 border border-primary-600 rounded-lg transition-colors"
			>
				<Diskette size={16} />
				<span>Save</span>
			</button>
			<button
				class="flex items-center justify-center gap-2 px-3 py-1.5 text-sm text-white bg-primary-750 hover:bg-primary-600 border border-primary-600 rounded-lg transition-colors"
			>
				<Tuning2 size={16} />
				<span>Configure</span>
			</button>
		</div>
		<div class="flex flex-col gap-3">
			<h1 class="text-lg text-white font-semibold">Radio Configuration</h1>
			<div class="flex gap-4">
				<div class="relative size-22 rounded-lg overflow-hidden">
					<div class="absolute inset-0 flex items-center justify-center bg-primary-600">
						<span class="text-sm text-primary-400 font-bold">No Logo</span>
					</div>
					<div
						class="absolute inset-0 bg-center bg-cover bg-no-repeat bg-[url(https://www.calliaweb.co.uk/wp-content/uploads/2015/10/apple-100.jpeg)]"
					></div>
				</div>
				<table class="select-none table-fixed border-separate border-spacing-0">
					<thead>
						<tr>
							<th
								class="px-2 py-1 text-xs text-white text-left font-semibold border-r border-primary-600"
								>Radio ID</th
							>
							<th
								class="px-2 py-1 text-xs text-white text-left font-semibold border-r border-primary-600"
								>Radio Station Name</th
							>
							<th
								class="px-2 py-1 text-xs text-white text-left font-semibold border-r border-primary-600"
								>Froce Value</th
							>
							<th
								class="px-2 py-1 text-xs text-white text-left font-semibold border-r border-primary-600"
								>Target Volume</th
							>
							<th
								class="px-2 py-1 text-xs text-white text-left font-semibold border-r border-primary-600"
								>Jingles #</th
							>
							<th class="px-2 py-1 text-xs text-white text-left font-semibold"
								>Tracks #</th
							>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td class="min-w-26 truncate px-2 py-1 text-xs text-primary-300"
								>hJr3</td
							>
							<td
								class="min-w-26 max-w-50 truncate px-2 py-1 text-xs text-primary-300"
								title="Test Radio Number 1 sdkljfdslkfsdfkglklfgjkdflgj"
								>Test Radio Number 1 sdkljfdslkfsdfkglklfgjkdflgj</td
							>
							<td class="min-w-26 truncate px-2 py-1 text-xs text-primary-300"
								>Default (80)</td
							>
							<td class="min-w-26 truncate px-2 py-1 text-xs text-primary-300"
								>95 dB</td
							>
							<td class="min-w-26 truncate px-2 py-1 text-xs text-primary-300">-</td>
							<td class="min-w-26 truncate px-2 py-1 text-xs text-primary-300">-</td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>
	</div>
</div>

<style>
</style>
