import XMLBuilder from 'fast-xml-builder';

function normalizeArrays(obj: XMLData): any {
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

function obj2xml(obj: XMLData): string {
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

export default obj2xml;
