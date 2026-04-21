<!-- Apdapted from svelte-easy-crop -->
<!-- Credit to ValentinH -->
<!-- Repo: https://github.com/ValentinH/svelte-easy-crop -->

<script lang="ts">
	import { onDestroy, onMount, tick } from 'svelte';
	import type { Action } from 'svelte/action';
	import * as helpers from './helpers';
	import type { CropperProps, ImageSize, Point, Size } from './types';

	// Icons
	import {
		RestartSquare,
		TrashBinTrash,
		MagnifierZoomIn,
		MagnifierZoomOut
	} from '@solar-icons/svelte/Bold';

	let {
		image,
		crop = { x: 0, y: 0 },
		zoom = 1,
		minZoom = 1,
		maxZoom = 3,
		aspect = 1,
		cropSize = { height: 140, width: 140 },
		cropShape = 0,
		zoomSpeed = 0.2,
		crossOrigin = null,
		restrictPosition = true,
		tabindex = undefined,
		oncropcomplete,
		onremove
	}: Partial<CropperProps> = $props();

	let cropperSize = $state<Size | null>(null);
	let imageSize = $state<ImageSize>({ width: 0, height: 0, naturalWidth: 0, naturalHeight: 0 });
	let containerEl = $state<HTMLDivElement | null>(null);
	let containerRect = $state<DOMRect | null>(null);
	let imgEl = $state<HTMLImageElement | null>(null);
	let dragStartPosition = $state<Point>({ x: 0, y: 0 });
	let dragStartCrop = $state<Point>({ x: 0, y: 0 });
	let lastPinchDistance = $state(0);
	let rafDragTimeout = $state<number | null>(null);
	let rafZoomTimeout = $state<number | null>(null);

	onMount(async () => {
		await tick();

		// when rendered via SSR, the image can already be loaded and its onLoad callback will never be called
		if (imgEl && imgEl.complete) {
			onImgLoad();
		}
		if (containerEl) {
			containerEl.addEventListener('gesturestart', preventZoomSafari);
			containerEl.addEventListener('gesturechange', preventZoomSafari);
		}
	});

	onDestroy(() => {
		if (containerEl) {
			containerEl.removeEventListener('gesturestart', preventZoomSafari);
			containerEl.removeEventListener('gesturechange', preventZoomSafari);
		}
		cleanEvents();
	});

	// this is to prevent Safari on iOS >= 10 to zoom the page
	const preventZoomSafari = (e: Event) => e.preventDefault();

	const cleanEvents = () => {
		if (typeof document !== 'undefined') {
			document.removeEventListener('mousemove', onMouseMove);
			document.removeEventListener('mouseup', onDragStopped);
			document.removeEventListener('touchmove', onTouchMove);
			document.removeEventListener('touchend', onDragStopped);
		}
	};

	const onImgLoad = () => {
		computeSizes();
		emitCropData();
	};

	const getAspect = () => {
		if (cropSize) {
			return cropSize.width / cropSize.height;
		}
		return aspect;
	};

	const computeSizes = () => {
		if (imgEl) {
			imageSize = {
				width: imgEl.width,
				height: imgEl.height,
				naturalWidth: imgEl.naturalWidth,
				naturalHeight: imgEl.naturalHeight
			};
			cropperSize = cropSize
				? cropSize
				: helpers.getCropSize(imgEl.width, imgEl.height, aspect);
		}
		if (containerEl) {
			containerRect = containerEl.getBoundingClientRect();
		}
	};

	const getMousePoint = (e: MouseEvent) => ({
		x: Number(e.clientX),
		y: Number(e.clientY)
	});

	const getTouchPoint = (touch: TouchEvent['touches'][0]) => ({
		x: Number(touch.clientX),
		y: Number(touch.clientY)
	});

	const onMouseDown = (e: MouseEvent) => {
		e.preventDefault();
		document.addEventListener('mousemove', onMouseMove);
		document.addEventListener('mouseup', onDragStopped);
		onDragStart(getMousePoint(e));
	};

	const onMouseMove = (e: MouseEvent) => onDrag(getMousePoint(e));

	const onTouchStart = (e: TouchEvent) => {
		e.preventDefault();
		document.addEventListener('touchmove', onTouchMove, { passive: false }); // iOS 11 now defaults to passive: true
		document.addEventListener('touchend', onDragStopped);

		if (e.touches.length === 2) {
			onPinchStart(e);
		} else if (e.touches.length === 1) {
			onDragStart(getTouchPoint(e.touches[0]));
		}
	};

	const onTouchMove = (e: TouchEvent) => {
		// Prevent whole page from scrolling on iOS.
		e.preventDefault();
		if (e.touches.length === 2) {
			onPinchMove(e);
		} else if (e.touches.length === 1) {
			onDrag(getTouchPoint(e.touches[0]));
		}
	};

	const onDragStart = ({ x, y }: Point) => {
		dragStartPosition = { x, y };
		dragStartCrop = { x: crop.x, y: crop.y };
	};

	const onDrag = ({ x, y }: Point) => {
		if (rafDragTimeout) window.cancelAnimationFrame(rafDragTimeout);

		rafDragTimeout = window.requestAnimationFrame(() => {
			if (x === undefined || y === undefined || !cropperSize) return;
			const offsetX = x - dragStartPosition.x;
			const offsetY = y - dragStartPosition.y;
			const requestedPosition = {
				x: dragStartCrop.x + offsetX,
				y: dragStartCrop.y + offsetY
			};

			crop = restrictPosition
				? helpers.restrictPosition(requestedPosition, imageSize, cropperSize, zoom)
				: requestedPosition;
		});
	};

	const onDragStopped = () => {
		cleanEvents();
		emitCropData();
	};

	const onPinchStart = (e: TouchEvent) => {
		const pointA = getTouchPoint(e.touches[0]);
		const pointB = getTouchPoint(e.touches[1]);
		lastPinchDistance = helpers.getDistanceBetweenPoints(pointA, pointB);
		onDragStart(helpers.getCenter(pointA, pointB));
	};

	const onPinchMove = (e: TouchEvent) => {
		const pointA = getTouchPoint(e.touches[0]);
		const pointB = getTouchPoint(e.touches[1]);
		const center = helpers.getCenter(pointA, pointB);
		onDrag(center);

		if (rafZoomTimeout) window.cancelAnimationFrame(rafZoomTimeout);
		rafZoomTimeout = window.requestAnimationFrame(() => {
			const distance = helpers.getDistanceBetweenPoints(pointA, pointB);
			const newZoom = zoom * (distance / lastPinchDistance);
			setNewZoom(newZoom, center);
			lastPinchDistance = distance;
		});
	};

	const onWheel = (e: WheelEvent) => {
		if (e.ctrlKey) {
			e.preventDefault();
			const point = getMousePoint(e);
			const newZoom = zoom - (e.deltaY * zoomSpeed) / 200;

			setNewZoom(newZoom, point);

			return;
		}

		if (e.shiftKey) {
			e.preventDefault();
			const newCropShape = cropShape - (e.deltaY * 2.5) / 100;
			cropShape = Math.min(50, Math.max(newCropShape, 0));
		}
	};

	const getPointOnContainer = ({ x, y }: Point) => {
		if (!containerRect) {
			throw new Error('The Cropper is not mounted');
		}
		return {
			x: containerRect.width / 2 - (x - containerRect.left),
			y: containerRect.height / 2 - (y - containerRect.top)
		};
	};

	const getPointOnImage = ({ x, y }: Point) => ({
		x: (x + crop.x) / zoom,
		y: (y + crop.y) / zoom
	});

	const setNewZoom = (newZoom: number, point: Point) => {
		if (!cropperSize) return;
		const zoomPoint = getPointOnContainer(point);
		const zoomTarget = getPointOnImage(zoomPoint);
		zoom = Math.min(maxZoom, Math.max(newZoom, minZoom));

		const requestedPosition = {
			x: zoomTarget.x * zoom - zoomPoint.x,
			y: zoomTarget.y * zoom - zoomPoint.y
		};
		crop = restrictPosition
			? helpers.restrictPosition(requestedPosition, imageSize, cropperSize, zoom)
			: requestedPosition;
	};

	const emitCropData = () => {
		if (!cropperSize || cropperSize.width === 0) return;
		// this is to ensure the crop is correctly restricted after a zoom back (https://github.com/ricardo-ch/svelte-easy-crop/issues/6)
		const position = restrictPosition
			? helpers.restrictPosition(crop, imageSize, cropperSize, zoom)
			: crop;
		const { croppedAreaPercentages, croppedAreaPixels } = helpers.computeCroppedArea(
			position,
			imageSize,
			cropperSize,
			getAspect(),
			zoom,
			restrictPosition
		);

		oncropcomplete?.({
			percent: { ...croppedAreaPercentages, roundness: cropShape },
			pixels: { ...croppedAreaPixels, roundness: cropShape }
		});
	};

	// ------ Reactive statement ------
	//when aspect changes, we reset the cropperSize
	$effect(() => {
		if (imgEl) {
			cropperSize = cropSize
				? cropSize
				: helpers.getCropSize(imgEl.width, imgEl.height, aspect);
		}
	});

	// when zoom changes, we recompute the cropped area
	$effect(() => {
		if (!cropperSize) return;

		const restrictedCrop = restrictPosition
			? helpers.restrictPosition(crop, imageSize, cropperSize, zoom)
			: crop;

		if (restrictedCrop.x !== crop.x || restrictedCrop.y !== crop.y) {
			crop = restrictedCrop;
		}

		emitCropData();
	});

	const containerAction: Action<HTMLDivElement> = (node) => {
		$effect(() => {
			node.addEventListener('touchstart', onTouchStart);
			node.addEventListener('mousedown', onMouseDown);
			node.addEventListener('wheel', onWheel, { passive: false });

			return () => {
				node.removeEventListener('touchstart', onTouchStart);
				node.removeEventListener('mousedown', onMouseDown);
				node.removeEventListener('wheel', onWheel);
			};
		});
	};

	const resetCrop = () => {
		zoom = 1;
		cropShape = 0;
		crop = {
			x: 0,
			y: 0
		};
	};
</script>

<div class="flex flex-col size-full p-2">
	<div class="relative grow py-2">
		<div
			class="absolute inset-0 overflow-hidden select-none rounded-lg cursor-move"
			bind:this={containerEl}
			use:containerAction
			{tabindex}
			role="button"
			data-testid="container"
		>
			<img
				bind:this={imgEl}
				class="absolute inset-0 m-auto object-cover will-change-transform"
				src={image}
				onload={onImgLoad}
				alt=""
				class:w-35={imageSize.naturalWidth < imageSize.naturalHeight}
				class:h-35={imageSize.naturalWidth > imageSize.naturalHeight}
				class:size-35={imageSize.naturalWidth === imageSize.naturalHeight}
				style="transform: translate({crop.x}px, {crop.y}px) scale({zoom});"
				crossorigin={crossOrigin}
			/>
			{#if cropperSize}
				<div
					class="absolute top-1/2 left-1/2 -translate-1/2 text-primary-800 opacity-80 border border-sky-600 shadow-[0_0_0_9999em] overflow-hidden"
					style="width: {cropperSize.width}px; height: {cropperSize.height}px; border-radius: {cropShape}%"
					data-testid="cropper"
				></div>
			{/if}
		</div>
	</div>
	<div class="flex items-center justify-center gap-6 py-1 w-full">
		<div class="flex items-center justify-center gap-2">
			<MagnifierZoomOut color="white" />
			<input
				bind:value={zoom}
				class="h-2 bg-primary-750 border border-primary-600 rounded-full appearance-none"
				type="range"
				min="1"
				max="3"
				step="0.05"
				name=""
				id=""
			/>
			<MagnifierZoomIn color="white" />
		</div>
		<div class="flex items-center justify-center gap-2">
			<div class="size-3 bg-white"></div>
			<input
				bind:value={cropShape}
				class="h-2 bg-primary-750 border border-primary-600 rounded-full appearance-none"
				type="range"
				min="0"
				max="50"
				step="1"
				name=""
				id=""
			/>
			<div class="size-3 bg-white rounded-full"></div>
		</div>
		<div class="flex gap-1">
			<button
				onclick={resetCrop}
				class="p-1.5 text-primary-400 hover:text-white rounded-md transition-colors"
				title="Reset Crop"
			>
				<RestartSquare />
			</button>
			<button
				onclick={() => onremove?.()}
				class="p-1.5 text-red-600 hover:text-red-400 rounded-md transition-colors"
				title="Remove Image"
			>
				<TrashBinTrash />
			</button>
		</div>
	</div>
</div>

<style>
</style>
