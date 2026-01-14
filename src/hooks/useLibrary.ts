import { useLiveQuery } from 'dexie-react-hooks'

import { db, type BookRecord } from '../db'

/**
 * Custom sorting that places translated books next to their originals
 * and sorts alphabetically by the original book's name
 */
function sortBooksWithTranslations(books: BookRecord[]): BookRecord[] {
  // Create a map of book IDs to books for quick lookup
  const bookMap = new Map(books.map((book) => [book.id, book]))

  // Separate books into originals and translations
  const originals = books.filter((book) => !book.translatedFrom)
  const translations = books.filter((book) => book.translatedFrom)

  // Sort originals alphabetically by name
  originals.sort((a, b) => a.name.localeCompare(b.name))

  // Build final sorted list
  const sorted: BookRecord[] = []
  for (const original of originals) {
    // Add the original book
    sorted.push(original)

    // Find and add all translations of this book
    const translationsOfThis = translations.filter(
      (t) => t.translatedFrom === original.id,
    )
    // Sort translations alphabetically as well
    translationsOfThis.sort((a, b) => a.name.localeCompare(b.name))
    sorted.push(...translationsOfThis)
  }

  // Handle orphaned translations (originals not found in library)
  // These are sorted alphabetically and added at the end
  const orphanedTranslations = translations.filter(
    (t) => !bookMap.has(t.translatedFrom!),
  )
  orphanedTranslations.sort((a, b) => a.name.localeCompare(b.name))
  sorted.push(...orphanedTranslations)

  return sorted
}

export function useLibrary() {
  return useLiveQuery(async () => {
    const books = (await db?.books.toArray()) ?? []
    return sortBooksWithTranslations(books)
  })
}
