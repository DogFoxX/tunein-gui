import parse from 'parse-dds';
import decodeDXT from 'decode-dxt';

async function ddsToDataUrl(path: string): Promise<string> {
	// Fetch the DDS file (works for local/public assets or remote URLs)
	const res = await fetch(path);

	const buf = await res.arrayBuffer();

	// Parse DDS header + mipmaps
	const dds = parse(buf);
	const image = dds.images[0];
	const { offset, length, shape } = image;

	// Decode DXT5 compressed data → raw RGBA
	const rgba = decodeDXT(new DataView(buf, offset, length), shape[0], shape[1], 'dxt5');

	// Paint to canvas
	const canvas = document.createElement('canvas');
	canvas.width = shape[0];
	canvas.height = shape[1];
	const ctx = canvas.getContext('2d')!;
	const imgData = ctx.createImageData(shape[0], shape[1]);
	imgData.data.set(new Uint8ClampedArray(rgba));
	ctx.putImageData(imgData, 0, 0);

	// Export to base64 PNG
	return canvas.toDataURL('image/png');
}

export default ddsToDataUrl;
