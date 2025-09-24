import type { XmlValue, XmlObject } from './types';
import { sanitizeXml, unicodeToXmlRefs } from './sanitize-xml';

export function obj2Xml(obj: any, indent = ''): string {
	let xml = '';

	// Sanitize Symbols &, <, >, ", '
	obj = Object.fromEntries(
		Object.entries(obj).map(([key, value]) => [
			key,
			typeof value === 'string' ? sanitizeXml(value) : value
		])
	);

	// Sanitize unicide chars

	obj = Object.fromEntries(
		Object.entries(obj).map(([key, value]) => [
			key,
			typeof value === 'string' ? unicodeToXmlRefs(value) : value
		])
	);

	for (const key in obj) {
		const value = obj[key];

		if (Array.isArray(value)) {
			// wrap the array in a single tag
			xml += `${indent}<${key}>\n`;
			for (const item of value) {
				// each item goes inside the array tag
				xml += obj2Xml(item, indent + '  ');
			}
			xml += `${indent}</${key}>\n`;
		} else if (typeof value === 'object' && value !== null) {
			xml += `${indent}<${key}>\n${obj2Xml(value, indent + '  ')}${indent}</${key}>\n`;
		} else {
			xml += `${indent}<${key}>${value}</${key}>\n`;
		}
	}
	return xml;
}

export function xml2obj(xml: string): XmlObject {
	// Parse with DOMParser (browser API)
	const parser = new DOMParser();
	const doc = parser.parseFromString(xml, 'application/xml');

	// If parsing failed
	const parseError = doc.querySelector('parsererror');
	if (parseError) {
		throw new Error('Invalid XML: ' + parseError.textContent);
	}

	// Recursive walker
	function walk(node: Element): XmlValue {
		const children = Array.from(node.children);

		if (children.length === 0) {
			// no children → return text
			return node.textContent?.trim() ?? '';
		}

		// Build object of children
		const obj: XmlObject = {};
		for (const child of children) {
			const value = walk(child);

			if (obj[child.tagName]) {
				// already exists → turn into array
				if (!Array.isArray(obj[child.tagName])) {
					obj[child.tagName] = [obj[child.tagName] as XmlValue];
				}
				(obj[child.tagName] as XmlValue[]).push(value);
			} else {
				obj[child.tagName] = value;
			}
		}

		return obj;
	}

	// Handle root(s)
	const root = doc.documentElement;
	return { [root.tagName]: walk(root) };
}
