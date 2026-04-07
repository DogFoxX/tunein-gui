<script lang="ts">
	// Icons
	import { Bolt } from '@solar-icons/svelte/BoldDuotone';
	import { Diskette } from '@solar-icons/svelte/Bold';
</script>

<div class="flex flex-col">
	<div class="flex gap-2 p-4 bg-primary-700">
		<div class="flex flex-col gap-2">
			<button
				class="flex items-center justify-center px-10 py-3 text-xl text-white bg-orange-900 hover:bg-orange-600 border border-orange-600 rounded-lg transition-colors"
				title="Create Radio"
			>
				<Bolt />
			</button>
			<button
				class="flex items-center justify-center gap-2 px-3 py-1.5 text-sm text-primary-300 hover:text-white bg-primary-750 border border-primary-600 hover:border-white rounded-lg transition-colors"
			>
				<Diskette size={16} />
				<span>Save</span>
			</button>
		</div>
	</div>
</div>

<style>
</style>
