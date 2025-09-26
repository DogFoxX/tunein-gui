import { sanitizeXml } from './sanitize-xml';

export function obj2xml<T extends XmlData>(obj: T, indent = ''): string {
	let xml = '';

	for (const key in obj) {
		const value = obj[key as keyof T];

		if (Array.isArray(value)) {
			xml += `${indent}<${key}>\n`;
			for (const item of value) {
				xml += obj2xml(item, indent + '  ');
			}
			xml += `${indent}</${key}>\n`;
		} else if (typeof value === 'object' && value !== null) {
			xml += `${indent}<${key}>\n${obj2xml(value, indent + '  ')}${indent}</${key}>\n`;
		} else if (typeof value === 'string') {
			xml += `${indent}<${key}>${sanitizeXml(value)}</${key}>\n`;
		} else {
			xml += `${indent}<${key}>${String(value ?? '')}</${key}>\n`;
		}
	}

	return xml;
}

export function xml2obj(xml: string): XmlData {
	const parser = new DOMParser();
	const doc = parser.parseFromString(xml, 'application/xml');

	const parseError = doc.querySelector('parsererror');
	if (parseError) throw new Error('Invalid XML: ' + parseError.textContent);

	const projectEl = doc.querySelector('project');
	if (!projectEl) throw new Error('Missing <project> root');

	const radioEl = projectEl.querySelector('radio');

	const getText = (parent: Element | null, tag: string): string => {
		return parent?.querySelector(tag)?.textContent?.trim() ?? '';
	};

	const getSongs = (songsNode: Element | null): { song: TrackData }[] => {
		if (!songsNode) return [];
		const songEls = Array.from(songsNode.querySelectorAll('song'));
		return songEls.map((songEl) => {
			const track: TrackData = {
				file: getText(songEl, 'file'),
				name: getText(songEl, 'name'),
				artist: getText(songEl, 'artist'),
				year: getText(songEl, 'year'),
				length: getText(songEl, 'length')
			};
			const force = getText(songEl, 'force');
			if (force) track.force = force;
			return { song: track };
		});
	};

	return {
		project: {
			fmod: getText(projectEl, 'fmod'),
			radio: {
				id: getText(radioEl, 'id'),
				name: getText(radioEl, 'name'),
				logo: getText(radioEl, 'logo'),
				songs: getSongs(radioEl?.querySelector('songs') ?? null)
			}
		}
	};
}
