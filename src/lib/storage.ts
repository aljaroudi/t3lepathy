/**
 * Convert an image to a base64 string
 * @param image - The image to convert
 * @returns A promise that resolves to the base64 string
 */
export async function convertImageToBase64(image: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(image)
  })
}