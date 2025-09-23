import { open, save, type DialogFilter } from '@tauri-apps/plugin-dialog';
import { writeTextFile } from '@tauri-apps/plugin-fs';

export async function openFileDiag(args: {
	title: string;
	filters: DialogFilter[];
	multiple: boolean;
}): Promise<object[] | any> {
	const { title, filters, multiple } = args;

	return open({ title, filters, multiple });
}

export async function openDirDiag(args: { title: string }): Promise<string[] | any> {
	const { title } = args;

	return open({ title, directory: true, multiple: false, canCreateDirectories: true });
}

export async function saveXML(xml: string) {
	const path = await save({
		title: 'Export XML',
		defaultPath: 'station.xml',
		canCreateDirectories: true,
		filters: [{ extensions: ['xml'], name: 'XML Files' }]
	});

	if (!path) return;

	try {
		// Write the string to the chosen path
		await writeTextFile(path, xml);
		console.log('File saved to', path);
	} catch (err) {
		console.error('Error saving file:', err);
	}
}
