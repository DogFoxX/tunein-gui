<script lang="ts">
	interface RadioConfigProps {
		radioId?: string;
		radioName?: string;
		logo?: string | Promise<string | null> | null;
		logoPath?: string | null;
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
	import { extname } from '@tauri-apps/api/path';

	// Components
	import { Sonar } from '$assets/loaders';

	// Assets
	import { Toggle } from '$assets';
	import { Cropper, type CropArea } from '$assets/cropper';

	// Stores

	// Icons
	import { FolderOpen, RestartSquare } from '@solar-icons/svelte/Bold';

	let {
		radioId = $bindable(generateId()),
		radioName = $bindable('Untitled Radio'),
		logo = null,
		logoPath = $bindable(null),
		force = $bindable({ enabled: false, value: 80 }),
		volume = $bindable({ enabled: false, value: 95 })
	}: RadioConfigProps = $props();

	// Logo Cropper Vars
	let croppedPixels = $state<CropArea>();

	// Logo Image Vars
	const logoExtensions = ['bmp', 'jpg', 'jpeg', 'png', 'svg', 'webp', 'dds'];

	let logosrc = $state<string | null>(null);
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

	async function fetchImage(src: string | null) {
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

			bytes = await readFile(src);

			const lower = src.toLowerCase();
			if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) contentType = 'image/jpeg';
			else if (lower.endsWith('.webp')) contentType = 'image/webp';
			else if (lower.endsWith('.svg')) contentType = 'image/svg';
		}

		return `data:${contentType};base64,${uint8ToBase64(bytes)}`;
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

	// Get cropped image
	async function getCroppedImage(imageSrc: string, cropPixels: CropArea): Promise<string> {
		return new Promise((resolve, reject) => {
			const img = new Image();

			img.onload = () => {
				const size = 512;

				const canvas = document.createElement('canvas');
				canvas.width = size;
				canvas.height = size;

				const ctx = canvas.getContext('2d');
				if (!ctx) {
					reject('No canvas context');
					return;
				}

				// Convert roundness % to radius in px
				const radius = (cropPixels.roundness / 100) * size;

				// Rounded clipping path
				roundedRect(ctx, 0, 0, size, size, radius);
				ctx.clip();

				// Draw cropped image resized to 512x512
				ctx.drawImage(
					img,
					cropPixels.x,
					cropPixels.y,
					cropPixels.width,
					cropPixels.height,
					0,
					0,
					size,
					size
				);

				resolve(canvas.toDataURL('image/png'));
			};

			img.onerror = reject;
			img.src = imageSrc;
		});
	}

	function roundedRect(
		ctx: CanvasRenderingContext2D,
		x: number,
		y: number,
		width: number,
		height: number,
		radius: number
	) {
		radius = Math.min(radius, width / 2, height / 2);

		ctx.beginPath();
		ctx.moveTo(x + radius, y);
		ctx.lineTo(x + width - radius, y);
		ctx.arcTo(x + width, y, x + width, y + radius, radius);
		ctx.lineTo(x + width, y + height - radius);
		ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
		ctx.lineTo(x + radius, y + height);
		ctx.arcTo(x, y + height, x, y + height - radius, radius);
		ctx.lineTo(x, y + radius);
		ctx.arcTo(x, y, x + radius, y, radius);
		ctx.closePath();
	}

	$effect(() => {
		logo = fetchImage(logoPath).then((src) => (logosrc = src));
	});
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
									onclick={() => (radioId = generateId())}
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
									bind:value={radioName}
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
								placeholder="Local image or image url..."
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
				<div
					bind:this={logoDropArea}
					class="relative h-52 w-full border-2 border-primary-600 border-dashed rounded-xl transition-colors"
					class:border-sky-400={isDragging}
				>
					<div
						class="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center"
					>
						{#await logo}
							<Sonar />
						{:then image}
							{#if !image}
								<div class="flex flex-col">
									<span class="text-white font-bold">Logo Preview</span>
									<span class="text-xs text-primary-400"
										>Drag & drop here, paste image path/url above, or click
										browse...</span
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
							{:else}
								<Cropper
									{image}
									oncropcomplete={async (e) => {
										croppedPixels = e.pixels;
									}}
									onremove={() => {
										logosrc = null;
										logoPath = null;
										croppedPixels = undefined;
									}}
								/>
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
					</div>
				</div>
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
							oninput={(e) => {
								e.currentTarget.value = e.currentTarget.value.replace(/\D/g, '');
								e.currentTarget.value = e.currentTarget.value.replace(/^0+/, '');
								if (e.currentTarget.value === '') e.currentTarget.value = '0';
							}}
							onblur={(e) => {
								const num = parseInt(e.currentTarget.value, 10);

								if (num > 300) e.currentTarget.value = '300';
							}}
							onkeydown={(e) => {
								if (e.key === 'Enter') {
									const num = parseInt(e.currentTarget.value, 10);

									if (num > 300) e.currentTarget.value = '300';
								}
							}}
							class="h-full w-[20ch] px-2 py-1 text-sm text-white"
							type="text"
							maxlength="3"
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
							oninput={(e) => {
								e.currentTarget.value = e.currentTarget.value.replace(/\D/g, '');
								e.currentTarget.value = e.currentTarget.value.replace(/^0+/, '');
								if (e.currentTarget.value === '') e.currentTarget.value = '0';
							}}
							onblur={(e) => {
								const num = parseInt(e.currentTarget.value, 10);

								if (num < 60) e.currentTarget.value = '60';
								if (num > 120) e.currentTarget.value = '120';
							}}
							onkeydown={(e) => {
								if (e.key === 'Enter') {
									const num = parseInt(e.currentTarget.value, 10);

									if (num < 60) e.currentTarget.value = '60';
									if (num > 120) e.currentTarget.value = '120';
								}
							}}
							class="h-full w-[20ch] px-2 py-1 text-sm text-white"
							type="text"
							maxlength="3"
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
