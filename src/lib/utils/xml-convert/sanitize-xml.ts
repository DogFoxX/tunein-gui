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
