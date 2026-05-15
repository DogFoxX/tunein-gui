import type { Component } from 'svelte';

interface ExtraItemsType {
	text: string;
	icon?: Component;
	action?: () => void;
}

interface ContextmenuType {
	visible: boolean;
	position?: { x: number; y: number } | null;
	node?: HTMLInputElement | HTMLDivElement | null;
	itemClicked?: boolean;
	extraItems?: ExtraItemsType[];
}

class Contextmenu {
	state = $state<ContextmenuType>({
		visible: false
	});

	closemenu() {
		this.state = {
			visible: false,
			node: null,
			extraItems: []
		};
	}

	openMenu(options: ContextmenuType) {
		this.state = options;
	}

	action(node: HTMLInputElement | HTMLDivElement, extraItems?: ExtraItemsType[]) {
		const self = this;

		function onContextmenu(e: Event) {
			if (
				node instanceof HTMLDivElement &&
				node.getAttribute('contenteditable') !== 'plaintext-only'
			)
				return;

			const mouseEvent = e as MouseEvent;
			e.preventDefault();

			self.state = {
				visible: true,
				position: { x: mouseEvent.clientX, y: mouseEvent.clientY },
				node,
				extraItems
			};
		}

		function closeMenu(e: Event) {
			self.closemenu();
		}

		function onkeydown(e: Event) {
			const keyEvent = e as KeyboardEvent;

			if (self.state.visible) {
				e.preventDefault();
				e.stopPropagation();

				if (keyEvent.key === 'Escape') self.closemenu();
				return;
			}
		}

		node.addEventListener('contextmenu', onContextmenu);

		node.addEventListener('keydown', onkeydown);
		window.addEventListener('mousedown', closeMenu);
		window.addEventListener('blur', closeMenu);

		return {
			destroy() {
				node.removeEventListener('contextmenu', onContextmenu);
				node.removeEventListener('keydown', onkeydown);
				window.removeEventListener('mousedown', closeMenu);
				window.removeEventListener('blur', closeMenu);
			}
		};
	}
}

const contextmenu = new Contextmenu();

export default contextmenu;
