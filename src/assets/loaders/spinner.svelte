<script lang="ts">
	let { height = 48, width = 48 }: { height?: number; width?: number } = $props();
</script>

<span class="loader" style="height: {height}px; width: {width}px;"></span>

<style>
	.loader {
		border: 2px dotted #fff;
		border-radius: 50%;
		display: inline-block;
		position: relative;
		box-sizing: border-box;
		animation: rotation 2s linear infinite;
	}

	@keyframes rotation {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}
</style>
