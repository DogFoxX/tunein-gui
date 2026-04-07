<script lang="ts">
	let { toggled = $bindable() }: { toggled?: boolean } = $props();
</script>

<div class="h-6 w-12">
	<button
		onclick={() => (toggled = !toggled)}
		class="flex size-full px-1 py-0.75 border border-primary-700 rounded-full overflow-hidden transition-colors delay-200 cursor-pointer"
		class:border-transparent={toggled}
		class:bg-sky-700={toggled}
		class:bg-primary-750={!toggled}
		aria-label="toggle switch"
	>
		<span
			class="h-full w-4 bg-white rounded-full transition-transform duration-400 ease-in-out-expo"
			class:translate-x-5.75={toggled}
		></span>
	</button>
</div>

<style>
</style>
