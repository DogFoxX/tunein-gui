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
				lastIndex = logs.length;
				return logs;
			});
		},

		warn(msg: string) {
			update((logs) => {
				logs = [...logs, format('WARN', msg)];
				return logs;
			});
		},

		err(msg: string) {
			update((logs) => {
				logs = [...logs, format('ERR', msg)];
				return logs;
			});
		},

		log(msg: string) {
			update((logs) => {
				logs = [...logs, msg];
				return logs;
			});
		}
	};
}

const logger = createLogger();

export default logger;
