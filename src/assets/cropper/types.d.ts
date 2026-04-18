//  Apdapted from svelte-easy-crop
//  Credit to ValentinH
//  Repo: https://github.com/ValentinH/svelte-easy-crop

import type { HTMLImgAttributes } from 'svelte/elements';

export type OnCropCompleteEvent = { percent: CropArea; pixels: CropArea };
export type OnCropComplete = (event: OnCropCompleteEvent) => void;

export type CropperProps = {
	image: string | null;
	crop: Point;
	zoom: number;
	aspect: number;
	minZoom: number;
	maxZoom: number;
	cropSize: Size | null;
	cropShape: number;
	showGrid: boolean;
	zoomSpeed: number;
	crossOrigin: HTMLImgAttributes['crossorigin'];
	restrictPosition: boolean;
	tabindex: number | undefined;
	oncropcomplete: OnCropComplete;
	onremove: () => void;
};

export interface Size {
	width: number;
	height: number;
}

export interface ImageSize {
	width: number;
	height: number;
	naturalWidth: number;
	naturalHeight: number;
}

export interface Point {
	x: number;
	y: number;
}

export interface CropArea {
	x: number;
	y: number;
	width: number;
	height: number;
	roundness: number;
}

export interface DispatchEvents {
	cropcomplete: {
		percent: CropArea;
		pixels: CropArea;
	};
}
