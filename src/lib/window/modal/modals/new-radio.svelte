<script lang="ts">
	interface RadioConfigProps {
		radioId?: string;
		radioName?: string;
		logo?: string;
		logoPath?: string;
		force?: {
			enabled: boolean;
			value: number;
		};
		volume?: {
			enabled: boolean;
			value: number;
		};
	}

	interface DragDropEventPayload {
		paths: string[];
		position: { x: number; y: number };
	}

	// Svelte Imports
	import { fade, scale } from 'svelte/transition';

	// Tauri Imports
	import { fetch } from '@tauri-apps/plugin-http';
	import { listen } from '@tauri-apps/api/event';
	import { readFile, exists } from '@tauri-apps/plugin-fs';
	import { open } from '@tauri-apps/plugin-dialog';
	import { openUrl } from '@tauri-apps/plugin-opener';
	import { extname } from '@tauri-apps/api/path';

	// Components
	import { Sonar } from '$assets/loaders';

	// Toggle Component Asset
	import { Toggle } from '$assets';

	// Stores

	// Icons
	import { FolderOpen, RestartSquare } from '@solar-icons/svelte/Bold';
	import { onMount } from 'svelte';

	let {
		radioId = $bindable(generateId()),
		radioName = $bindable('Untitled Radio'),
		logo = $bindable(''),
		logoPath = $bindable(''),
		force = $bindable({ enabled: false, value: 80 }),
		volume = $bindable({ enabled: false, value: 95 })
	}: RadioConfigProps = $props();

	const logoExtensions = ['bmp', 'jpg', 'jpeg', 'png', 'svg', 'webp', 'dds'];

	let logoDropArea = $state<HTMLElement>();
	let isDragging = $state(false);

	let errors = $state({
		radioId: false
	});

	// Logo Drop Listener
	listen<DragDropEventPayload>('tauri://drag-drop', (e) => {
		const { x, y } = e.payload.position;

		// get element under cursor
		const el = document.elementFromPoint(x, y);

		if (el && logoDropArea?.contains(el)) {
			const files = e.payload.paths;

			logoPath = files[0];
		}

		isDragging = false;
	});

	listen<DragDropEventPayload>('tauri://drag-over', (e) => {
		const { x, y } = e.payload.position;

		// get element under cursor
		const el = document.elementFromPoint(x, y);

		if (el && logoDropArea?.contains(el)) {
			return (isDragging = true);
		}

		isDragging = false;
	});

	listen('tauri://drag-leave', () => {
		isDragging = false;
	});

	function generateId() {
		const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
		const bytes = crypto.getRandomValues(new Uint8Array(4));

		return Array.from(bytes, (b) => chars[b % chars.length]).join('');
	}

	async function imageToBase64(src: string) {
		if (!src) return null;

		let bytes: Uint8Array;
		let contentType = 'image/png';
		let isUrl = /^https?:\/\//i.test(src);

		let exist: boolean | null;
		let ext: string | null;

		if (isUrl) {
			// Is URL
			const res = await fetch(src);
			if (!res.ok) throw new Error(`${res.statusText} (${res.status})`);

			bytes = new Uint8Array(await res.arrayBuffer());
			contentType = res.headers.get('content-type') || contentType;
		} else {
			// Is Local File
			try {
				exist = await exists(src);
				ext = await extname(src);
			} catch {
				return null;
			}

			if (exist && ext && !logoExtensions.includes(ext)) {
				throw new Error(
					'Invalid image format. Expected formats: bmp, jpg, jpeg, png, svg, webp, dds'
				);
			}

			try {
				bytes = await readFile(src);

				const lower = src.toLowerCase();
				if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) contentType = 'image/jpeg';
				else if (lower.endsWith('.webp')) contentType = 'image/webp';
				else if (lower.endsWith('.bmp')) contentType = 'image/bmp';
			} catch {
				return null;
			}
		}

		return (logo = `data:${contentType};base64,${uint8ToBase64(bytes)}`);
	}

	function uint8ToBase64(bytes: Uint8Array) {
		let binary = '';
		const chunkSize = 0x8000;

		for (let i = 0; i < bytes.length; i += chunkSize) {
			binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
		}

		return btoa(binary);
	}

	async function openLogo() {
		const filePath = await open({
			filters: [
				{
					extensions: logoExtensions,
					name: 'Image File'
				}
			],
			multiple: false,
			title: 'Choose a Logo Image'
		});

		if (!filePath) {
			return;
		}

		logoPath = filePath;
	}

	function isValidImageType(path: string) {
		const ext = path.split('.').pop()?.toLowerCase();
		return ext ? logoExtensions.includes(ext) : false;
	}

	// $effect(() => {
	// 	imageToBase64(logoPath)
	// 		.then(async ({ data, isUrl }) => {
	// 			if (isUrl) return (logo = data);

	// 			if (isValidImageType(logoPath)) {
	// 				exists(logoPath)
	// 					.then(async (exist) => {
	// 						if (exist) return (logo = data);

	// 						logo = '';
	// 					})
	// 					.catch(() => (logo = ''));
	// 			} else logo = '';
	// 		})
	// 		.catch(() => (logo = ''));
	// });
</script>

<div
	transition:scale={{ start: 0.9, duration: 100 }}
	class="absolute top-8 bottom-2 left-2 right-2 flex flex-col overflow-hidden"
>
	<div class="flex flex-col gap-8 px-28 pb-1 h-full overflow-y-scroll">
		<!-- Radio Info -->
		<div class="flex flex-col gap-3">
			<h1 class="text-white font-semibold">Basic Radio Info</h1>
			<div class="flex flex-col gap-4 p-3 border-t border-primary-750">
				<div class="flex flex-col gap-2 grow">
					<div class="flex gap-2">
						<div class="flex flex-col gap-1">
							<label class="text-sm text-primary-300" for="radio-id"
								>Radio ID (Unique)</label
							>
							<div
								class="flex gap-2 bg-primary-750 border border-primary-600 rounded-lg"
								class:border-red-400={errors.radioId}
							>
								<input
									bind:value={radioId}
									oninput={(e) => {
										errors.radioId = !/^[a-zA-Z0-9]*$/.test(
											e.currentTarget.value
										);
									}}
									class="h-full w-[12ch] px-2 py-1 text-sm text-white"
									type="text"
									id="radio-id"
									autocomplete="off"
									maxlength="4"
								/>
								<button
									onclick={async () => (radioId = generateId())}
									class="px-2 text-primary-400 hover:text-white transition-colors"
									title="Generate ID"
									tabIndex="-1"
								>
									<RestartSquare />
								</button>
							</div>
						</div>
						<div class="flex grow flex-col gap-1">
							<label class="text-sm text-primary-300" for="radio-name"
								>Radio Station Name</label
							>
							<div
								class="flex gap-2 bg-primary-750 border border-primary-600 rounded-lg"
							>
								<input
									class="size-full px-2 py-1 text-sm text-white"
									type="text"
									id="radio-name"
									autocomplete="off"
								/>
							</div>
						</div>
					</div>
					<div class="flex flex-col gap-1">
						<label class="text-sm text-primary-300" for="radio-logo"
							>Logo Path\URL</label
						>
						<div class="flex gap-2 bg-primary-750 border border-primary-600 rounded-lg">
							<input
								bind:value={logoPath}
								class="size-full px-2 py-1 text-sm text-white"
								type="text"
								id="radio-logo"
								autocomplete="off"
							/>
							<button
								onclick={openLogo}
								class="px-2 text-primary-400 hover:text-white transition-colors"
								tabindex="-1"
								title="Browse"><FolderOpen /></button
							>
						</div>
					</div>
				</div>
				<button
					bind:this={logoDropArea}
					ondblclick={openLogo}
					class="flex items-center justify-center h-34 w-full border-2 border-dashed border-primary-700 hover:border-primary-400 rounded-lg transition-colors cursor-pointer"
					class:border-sky-400={isDragging}
					title="Logo Preview. Double-click to browse..."
					tabindex="-1"
				>
					{#await imageToBase64(logoPath)}
						<Sonar />
					{:then src}
						{#if !src}
							<div class="flex flex-col justify-center gap-3 text-center size-full">
								<div class="flex flex-col">
									<span class="text-white font-bold">Logo Preview</span>
									<span class="text-xs text-primary-400"
										>Drag & drop here. Or double-click to browse...</span
									>
								</div>
								<div class="flex flex-col justify-center">
									<span class="text-xs text-primary-400"
										>Image Formats: <strong
											>bmp, jpg, png, svg, webp or dds (DXT5)</strong
										></span
									>
									<span class="text-xs text-primary-400"
										>Recommended size: <strong>512 x 512</strong></span
									>
								</div>
							</div>
						{:else}
							<img height="114" width="114" class="rounded-md" {src} alt="" />
						{/if}
					{:catch err}
						<div
							class="flex flex-col justify-center gap-3 px-2 text-center size-full overflow-hidden"
						>
							<span class="text-white font-bold">Failed to load preview</span>
							<span class="text-xs text-primary-400 truncate"
								>Path\URL: <strong>{logoPath}</strong></span
							>
							<span class="text-xs text-primary-400">{err}</span>
						</div>
					{/await}
				</button>
			</div>
		</div>
		<!-- Extra Configuration -->
		<div class="flex flex-col gap-3">
			<h1 class="text-white font-semibold">Extra Configuration</h1>
			<div class="flex flex-col">
				<div class="flex flex-col gap-2 p-3 border-t border-primary-750">
					<div class="flex flex-col gap-1">
						<div class="flex items-center justify-center gap-20">
							<button
								onclick={() => (force.enabled = !force.enabled)}
								class="grow h-full text-sm text-white text-left cursor-pointer"
								tabIndex="-1"
							>
								Use Force Value
							</button>

							<Toggle bind:toggled={force.enabled} />
						</div>
						<span class="text-xs text-primary-400">
							KM/H value when music fully fades in. Default 80, Max 300, 0 = Disabled.
						</span>
						<span class="text-xs text-primary-400 font-bold">
							Keeping this configuration toggled OFF will use the game default Force
							value.
						</span>
					</div>
					<div
						class="flex gap-2 w-max bg-primary-750 border border-primary-600 rounded-lg"
					>
						<input
							bind:value={force.value}
							class="h-full w-[20ch] px-2 py-1 text-sm text-white"
							type="text"
							autocomplete="off"
							disabled={!force.enabled}
						/>
					</div>
				</div>
				<div class="flex flex-col gap-2 p-3 border-t border-primary-750">
					<div class="flex flex-col gap-1">
						<div class="flex items-center justify-center gap-20">
							<button
								onclick={() => (volume.enabled = !volume.enabled)}
								class="grow h-full text-sm text-white text-left cursor-pointer"
								tabIndex="-1"
							>
								Use Target Volume
							</button>

							<Toggle bind:toggled={volume.enabled} />
						</div>
						<span class="text-xs text-primary-400"
							>A dB value used to calculate an offset value for each track.
							Recommended value: 95</span
						>
						<span class="text-xs text-primary-400 font-bold">
							Keeping this configuration toggeld OFF will keep track original volume,
							i.e. no changes.
						</span>
					</div>
					<div
						class="flex gap-2 w-max bg-primary-750 border border-primary-600 rounded-lg"
					>
						<input
							bind:value={volume.value}
							class="h-full w-[20ch] px-2 py-1 text-sm text-white"
							type="text"
							autocomplete="off"
							disabled={!volume.enabled}
						/>
					</div>
				</div>
			</div>
		</div>
	</div>
	<div class="flex items-center justify-end gap-4 min-h-10 px-4">
		{#if Object.values(errors).some(Boolean)}
			<span transition:fade={{ duration: 200 }} class="text-xs text-red-400 animate-pulse"
				>Check highlighted fields</span
			>
		{/if}
		<button
			onclick={async () => {}}
			class="w-24 py-1 text-sm text-white bg-primary-750 hover:bg-primary-700 border border-primary-600 transition-colors rounded-lg"
			>OK</button
		>
	</div>
</div>

<style>
</style>
