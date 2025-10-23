import { writable } from 'svelte/store';

function getTime() {
	const now = new Date();
	return `[${now.toTimeString().slice(0, 8)}]`;
}

// Accept strings and arrays of strings
type MessageInput = string | string[];

function format(level: string | null, ...msgs: MessageInput[]) {
	// Flatten and normalize
	const flattened: string[] = msgs.flat(Infinity).map(String);

	if (!level) {
		// plain log — no timestamp or prefix
		return flattened.join('\n');
	}

	const time = getTime();
	const prefix = `${time} ${level}: `;
	const pad = ' '.repeat(prefix.length);

	return flattened
		.map((msg, i) => {
			const lines = msg.split('\n');
			return lines
				.map((line, li) => (i === 0 && li === 0 ? prefix + line : pad + line))
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

	return {
		subscribe,
		clear() {
			set([]);
			lastIndex = null;
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
