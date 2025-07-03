import type { FilePart, ImagePart } from 'ai'

/**
 * Convert an image to a base64 string
 * @param file - The image to convert
 * @returns A promise that resolves to the base64 string
 */
export async function convertFileToBase64(
	file: File
): Promise<ImagePart | FilePart> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader()
		reader.onload = () =>
			file.type.startsWith('image/')
				? resolve({ type: 'image', image: reader.result as string })
				: resolve({
						type: 'file',
						data: reader.result as string,
						mimeType: file.type,
						filename: file.name,
					})
		reader.onerror = reject
		reader.readAsDataURL(file)
	})
}
