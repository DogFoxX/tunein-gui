import type { Component, Snippet } from 'svelte';

export interface ModalProps<T extends Record<string, Component>> {
	components: T;
	active?: keyof T;
	class?: string;
	close: () => void;
	header?: string;
}
