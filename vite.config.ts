import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

// https://vite.dev/config/
export default defineConfig({
	plugins: [svelte(), tailwindcss()],
	resolve: {
		alias: {
			$lib: resolve(__dirname, 'src/lib'),
			$assets: resolve(__dirname, 'src/assets')
		}
	},
	// prevent vite from obscuring rust errors
	clearScreen: false,
	// Tauri expects a fixed port, fail if that port is not available
	server: {
		strictPort: true
	},
	// to access the Tauri environment variables set by the CLI with information about the current target
	envPrefix: [
		'VITE_',
		'TAURI_PLATFORM',
		'TAURI_ARCH',
		'TAURI_FAMILY',
		'TAURI_PLATFORM_VERSION',
		'TAURI_PLATFORM_TYPE',
		'TAURI_DEBUG'
	],
	build: {
		// Tauri uses Chromium on Windows and WebKit on macOS and Linux
		target: process.env.TAURI_PLATFORM == 'windows' ? 'chrome105' : 'safari13',
		// produce sourcemaps for debug builds
		sourcemap: !!process.env.TAURI_DEBUG
	}
});
