const invalidSymbols = [
	{
		symbol: '&',
		valid: '&amp;'
	},
	{
		symbol: '<',
		valid: '&lt;'
	},
	{
		symbol: '>',
		valid: '&gt;'
	},
	{
		symbol: '\"',
		valid: '&quot;'
	},
	{
		symbol: "'",
		valid: '&apos;'
	}
];

export function sanitizeXml(value: string): string {
	let result = value;
	for (const { symbol, valid } of invalidSymbols) {
		result = result.split(symbol).join(valid);
	}
	return result;
}

export function unicodeToXmlRefs(str: string): string {
	return Array.from(str)
		.map((char) => {
			const code = char.codePointAt(0)!;
			// Convert only if non-ASCII (code > 127)
			return code > 127 ? `&#x${code.toString(16).toUpperCase()};` : char;
		})
		.join('');
}
