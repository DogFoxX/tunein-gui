import type { ProfileParseData, XMLParseData } from './types';
import { XMLParser, XMLBuilder } from 'fast-xml-parser';

function normalizeArrays(obj: any): any {
	if (Array.isArray(obj)) {
		// Handle empty arrays
		if (obj.length === 0) return obj;

		// If all array elements are single-key objects (e.g. [{song:{}},{song:{}}])
		const allSameKey = obj.every(
			(i) => typeof i === 'object' && i !== null && Object.keys(i).length === 1
		);

		if (allSameKey) {
			const key = Object.keys(obj[0])[0];
			return {
				[key]: obj.map((i) => normalizeArrays(i[key]))
			};
		}

		// Otherwise, just normalize each element
		return obj.map(normalizeArrays);
	}

	// Recurse through objects
	if (typeof obj === 'object' && obj !== null) {
		const result: Record<string, any> = {};
		for (const [key, val] of Object.entries(obj)) {
			result[key] = normalizeArrays(val);
		}
		return result;
	}

	// Return primitives unchanged
	return obj;
}

export function obj2xml(obj: Record<string, any>): string {
	const normalized = normalizeArrays(obj);

	const builder = new XMLBuilder({
		ignoreAttributes: false,
		textNodeName: '',
		format: true,
		suppressBooleanAttributes: false,
		commentPropName: 'comment'
	});

	const xml = builder.build(normalized);

	return xml;
}

export async function profile2obj(xml: string): Promise<ProfileData> {
	const parser = new XMLParser({
		ignoreAttributes: false,
		textNodeName: 'text',
		attributeNamePrefix: '',
		allowBooleanAttributes: true,
		isArray: (name, jpath) => {
			return jpath === 'profile.tracks.track';
		}
	});

	const json = parser.parse(xml);

	const profile = json.profile as ProfileParseData;

	return {
		name: profile.name,
		radioData: profile.radioData,
		force: {
			enable: profile.glob_force.enable === 'true',
			value: String(profile.glob_force?.text ?? '')
		},
		targetVolume: {
			enable: profile.target_vol?.enable === 'true',
			value: String(profile.target_vol?.text ?? '')
		},
		...(profile.tracks
			? {
					trackData: profile.tracks.track.map((track: any) => ({
						track
					}))
				}
			: {})
	};
}

export function xmldata2obj(xml: string): XmlData {
	const parser = new XMLParser({
		ignoreAttributes: false,
		attributeNamePrefix: '',
		allowBooleanAttributes: true,
		isArray: (_, jpath) => {
			return jpath === 'project.radio.songs.song';
		}
	});

	const json = parser.parse(xml);

	const project = json.project as XMLParseData;

	return {
		project: {
			fmod: project.fmod,
			radio: {
				id: project.radio.id,
				...(project.radio.logo ? { logo: project.radio.logo } : {}),
				name: project.radio.name,
				...(project.radio.songs
					? {
							songs: project.radio.songs.song.map((song: any) => ({
								song
							}))
						}
					: {})
			}
		}
	};
}
