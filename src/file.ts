import JSZip from 'jszip'
import { v4 as uuidv4 } from 'uuid'

import ePub, { Book } from '@flow/epubjs'

import { BookRecord, db } from './db'
import { mapExtToMimes } from './mime'
import { unpack } from './sync'

/**
 * Convert a plain text file to ePub format
 */
export async function txtToEpub(file: File): Promise<File> {
  const text = await file.text()
  const title = file.name.replace(/\.txt$/i, '')
  const bookId = uuidv4()

  // Split text into paragraphs
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0)

  // Create HTML content from paragraphs
  const htmlContent = paragraphs
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, '<br/>')}</p>`)
    .join('\n')

  const zip = new JSZip()

  // mimetype must be first and uncompressed
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' })

  // META-INF/container.xml
  zip.file(
    'META-INF/container.xml',
    `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`,
  )

  // OEBPS/content.opf
  zip.file(
    'OEBPS/content.opf',
    `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="bookid">${bookId}</dc:identifier>
    <dc:title>${escapeHtml(title)}</dc:title>
    <dc:language>en</dc:language>
    <meta property="dcterms:modified">${new Date().toISOString().replace(/\.\d+Z$/, 'Z')}</meta>
  </metadata>
  <manifest>
    <item id="content" href="content.xhtml" media-type="application/xhtml+xml"/>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
  </manifest>
  <spine>
    <itemref idref="content"/>
  </spine>
</package>`,
  )

  // OEBPS/content.xhtml
  zip.file(
    'OEBPS/content.xhtml',
    `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head>
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: serif; line-height: 1.6; margin: 1em; }
    p { text-indent: 1em; margin: 0.5em 0; }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  ${htmlContent}
</body>
</html>`,
  )

  // OEBPS/nav.xhtml (navigation document required for EPUB 3)
  zip.file(
    'OEBPS/nav.xhtml',
    `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head>
  <title>Navigation</title>
</head>
<body>
  <nav epub:type="toc">
    <ol>
      <li><a href="content.xhtml">${escapeHtml(title)}</a></li>
    </ol>
  </nav>
</body>
</html>`,
  )

  const blob = await zip.generateAsync({ type: 'blob', mimeType: 'application/epub+zip' })
  return new File([blob], `${title}.epub`, { type: 'application/epub+zip' })
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export async function fileToEpub(file: File) {
  const data = await file.arrayBuffer()
  return (ePub as any)(data)
}

export async function handleFiles(files: Iterable<File>) {
  const books = await db?.books.toArray()
  const newBooks = []

  for (let file of files) {
    console.log(file)

    if (mapExtToMimes['.zip'].includes(file.type)) {
      unpack(file)
      continue
    }

    // Convert txt files to ePub
    if (mapExtToMimes['.txt'].includes(file.type)) {
      file = await txtToEpub(file)
    }

    if (!mapExtToMimes['.epub'].includes(file.type)) {
      console.error(`Unsupported file type: ${file.type}`)
      continue
    }

    let book = books?.find((b) => b.name === file.name)

    if (!book) {
      book = await addBook(file)
    }

    newBooks.push(book)
  }

  return newBooks
}

export async function addBook(file: File) {
  const epub = await fileToEpub(file)
  const metadata = await epub.loaded.metadata

  const book: BookRecord = {
    id: uuidv4(),
    name: file.name || `${metadata.title}.epub`,
    size: file.size,
    metadata,
    createdAt: Date.now(),
    definitions: [],
    annotations: [],
  }
  db?.books.add(book)
  addFile(book.id, file, epub)
  return book
}

export async function addFile(id: string, file: File, epub?: Book) {
  db?.files.add({ id, file })

  if (!epub) {
    epub = await fileToEpub(file)
  }

  const url = await epub.coverUrl()
  const cover = url && (await toDataUrl(url))
  db?.covers.add({ id, cover })
}

export function readBlob(fn: (reader: FileReader) => void) {
  return new Promise<string>((resolve) => {
    const reader = new FileReader()
    reader.addEventListener('load', () => {
      resolve(reader.result as string)
    })
    fn(reader)
  })
}

async function toDataUrl(url: string) {
  const res = await fetch(url)
  const buffer = await res.blob()
  return readBlob((r) => r.readAsDataURL(buffer))
}

export async function fetchBook(url: string) {
  const filename = decodeURIComponent(/\/([^/]*\.epub)$/i.exec(url)?.[1] ?? '')
  const books = await db?.books.toArray()
  const book = books?.find((b) => b.name === filename)

  return (
    book ??
    fetch(url)
      .then((res) => res.blob())
      .then((blob) => addBook(new File([blob], filename)))
  )
}
