<script lang="ts">
	import { fade } from 'svelte/transition';

	// Icons
</script>

<div
	transition:fade={{ duration: 280 }}
	class="absolute top-9 right-0 bottom-0 left-0 flex items-center justify-center backdrop-blur-xs"
>
	<div class="bg-primary absolute inset-0 opacity-50"></div>
	<div class="bg-secondary relative z-10 flex flex-col gap-4 rounded-lg p-4">
		<button
			class="absolute top-0 right-0 flex h-[29px] w-[45px] items-center justify-center"
			aria-label="Close Settings"
		>
			<svg
				class="stroke-neutral-300"
				width="29"
				height="29"
				viewBox="0 0 29 29"
				xmlns="http://www.w3.org/2000/svg"
				style="shape-rendering: crispEdges;"
			>
				<line x1="9" y1="9" x2="19" y2="19" stroke-width="1" />
				<line x1="19" y1="9" x2="9" y2="19" stroke-width="1" />
			</svg>
		</button>
		<header class="text-2xl text-white">Settings</header>
		<div>div</div>
	</div>
</div>
