import { writable } from 'svelte/store';

function getTime() {
	const now = new Date();
	return `[${now.toTimeString().slice(0, 8)}]`;
}

function format(level: string, msg: string) {
	return `${getTime()} ${level}: ${msg}`;
}

function createLogger() {
	const { subscribe, update, set } = writable<string[]>([]);
	let lastIndex: number | null = null;

	return {
		subscribe,

		clear() {
			set([]);
			lastIndex = null;
		},

		info(msg: string) {
			update((logs) => {
				logs = [...logs, format('INFO', msg)];
				lastIndex = logs.length - 1;
				return logs;
			});
		},

		warn(msg: string) {
			update((logs) => {
				logs = [...logs, format('WARN', msg)];
				lastIndex = logs.length - 1;
				return logs;
			});
		},

		err(msg: string) {
			update((logs) => {
				logs = [...logs, format('ERR', msg)];
				lastIndex = logs.length - 1;
				return logs;
			});
		},

		log(msg: string) {
			update((logs) => {
				logs = [...logs, msg];
				lastIndex = logs.length - 1;
				return logs;
			});
		},

		update(template: string, value: string | number) {
			// Replace the placeholder
			const msg = template.replace('{}', String(value));
			const formatted = format('INFO', msg);

			update((logs) => {
				if (lastIndex !== null && lastIndex >= 0) {
					// Update the last line instead of adding a new one
					const copy = [...logs];
					copy[lastIndex] = formatted;
					return copy;
				}
				// Fallback if no previous line exists
				return [...logs, formatted];
			});
		}
	};
}

const logger = createLogger();

export default logger;
