import { writable } from 'svelte/store';

import { save } from '@tauri-apps/plugin-dialog';
import { writeTextFile } from '@tauri-apps/plugin-fs';

import type { MessageInput } from './types';

function getTime() {
	const now = new Date();
	return `[${now.toTimeString().slice(0, 8)}]`;
}

function format(level: string | null, ...msgs: MessageInput[]) {
	const flattened: string[] = msgs.flat(Infinity).map(String);

	if (!level) {
		return flattened.join('\n');
	}

	const time = getTime();
	const prefix = `${time} ${level}: `;
	const pad = ' '.repeat(prefix.length);

	return flattened
		.map((msg, i) => {
			const lines = msg.split('\n');
			return lines
				.map((line, li) => (i === 0 && li === 0 ? prefix + line : pad + `➜\t ${line}`))
				.join('\n');
		})
		.join('\n');
}

function createLogger() {
	const { subscribe, update, set } = writable<string[]>([]);
	let lastIndex: number | null = null;

	function push(level: string | null, ...msgs: MessageInput[]) {
		const message = format(level, ...msgs);
		update((logs) => {
			const newLogs = [...logs, message];
			lastIndex = newLogs.length - 1;
			return newLogs;
		});
	}

	let currentLogs: string;

	subscribe((logs) => {
		currentLogs = logs.join('\n');
	});

	return {
		subscribe,
		clear() {
			set([]);
			lastIndex = null;
		},
		async export() {
			const saveLoc = await save({
				canCreateDirectories: true,
				defaultPath: 'tunein-gui.log',
				filters: [{ extensions: ['log'], name: 'Log File' }],
				title: 'Save Logs As'
			});

			if (!saveLoc) return;

			await writeTextFile(saveLoc, currentLogs);
		},
		info(...msgs: MessageInput[]) {
			push('INFO', ...msgs);
		},
		warn(...msgs: MessageInput[]) {
			push('WARN', ...msgs);
		},
		err(...msgs: MessageInput[]) {
			push('ERR', ...msgs);
		},
		log(...msgs: MessageInput[]) {
			push(null, ...msgs);
		},
		update(template: string, value: string | number) {
			const msg = template.replace('{}', String(value));
			const formatted = format('INFO', msg);
			update((logs) => {
				if (lastIndex !== null && lastIndex >= 0) {
					const copy = [...logs];
					copy[lastIndex] = formatted;
					return copy;
				}
				return [...logs, formatted];
			});
		}
	};
}

const logger = createLogger();
export default logger;
