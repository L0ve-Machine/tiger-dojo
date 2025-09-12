export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    // Replace Japanese and special characters
    .replace(/[^\w\s-]/g, '')
    // Replace spaces and multiple hyphens with single hyphen
    .replace(/[\s_-]+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '')
    // Fallback for empty slugs
    || 'room'
}