/**
 * AI-powered ePub translation utilities
 * Translates ePub files using Anthropic or OpenAI APIs and creates a new translated copy
 */

import JSZip from 'jszip'

import { fileToEpub } from './file'
import { decrypt } from './crypto'
import { AIConfiguration, type AIProvider } from './state'

interface TranslationProgress {
  total: number
  current: number
  currentSection: string
}

export interface TranslationResult {
  file: File
  translatedTitle: string
}

export type ProgressCallback = (progress: TranslationProgress) => void

class TranslationError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode?: number,
  ) {
    super(message)
    this.name = 'TranslationError'
  }
}

/**
 * Translates text using Anthropic API
 */
async function translateWithAnthropic(
  text: string,
  apiToken: string,
  model: string,
  instructions?: string,
): Promise<string> {
  const systemPrompt = instructions
    ? `You are a professional translator. ${instructions}`
    : 'You are a professional translator. Translate the following text while preserving formatting, HTML tags, and the overall meaning. Only return the translated text, nothing else.'

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiToken,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: model,
        max_tokens: 16384,
        messages: [
          {
            role: 'user',
            content: text,
          },
        ],
        system: systemPrompt,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorMessage = 'Unknown error'

      try {
        const errorData = JSON.parse(errorText)
        errorMessage = errorData.error?.message || errorData.message || errorText
      } catch {
        errorMessage = errorText
      }

      if (response.status === 401) {
        throw new TranslationError(
          'Invalid API token. Please check your Anthropic API key in Settings.',
          'INVALID_API_KEY',
          401,
        )
      } else if (response.status === 429) {
        throw new TranslationError(
          'Rate limit exceeded. Please try again in a few moments.',
          'RATE_LIMIT',
          429,
        )
      } else if (response.status === 400) {
        throw new TranslationError(
          `Invalid request: ${errorMessage}. Please check your model selection.`,
          'INVALID_REQUEST',
          400,
        )
      } else {
        throw new TranslationError(
          `API error (${response.status}): ${errorMessage}`,
          'API_ERROR',
          response.status,
        )
      }
    }

    const data = await response.json()
    return data.content[0].text
  } catch (error) {
    if (error instanceof TranslationError) {
      throw error
    }
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new TranslationError(
        'Network error. Please check your internet connection.',
        'NETWORK_ERROR',
      )
    }
    throw new TranslationError(
      `Unexpected error: ${error instanceof Error ? error.message : 'Unknown'}`,
      'UNKNOWN_ERROR',
    )
  }
}

/**
 * Translates text using OpenAI API
 */
async function translateWithOpenAI(
  text: string,
  apiToken: string,
  model: string,
  instructions?: string,
): Promise<string> {
  const systemPrompt = instructions
    ? `You are a professional translator. ${instructions} Translate the following text while preserving formatting, HTML tags, and the overall meaning. Only return the translated text, nothing else.`
    : 'You are a professional translator. Translate the following text while preserving formatting, HTML tags, and the overall meaning. Only return the translated text, nothing else.'

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiToken}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: text,
          },
        ],
        max_tokens: 16384,
        temperature: 0.3,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorMessage = 'Unknown error'

      try {
        const errorData = JSON.parse(errorText)
        errorMessage = errorData.error?.message || errorData.message || errorText
      } catch {
        errorMessage = errorText
      }

      if (response.status === 401) {
        throw new TranslationError(
          'Invalid API token. Please check your OpenAI API key in Settings.',
          'INVALID_API_KEY',
          401,
        )
      } else if (response.status === 429) {
        throw new TranslationError(
          'Rate limit exceeded. Please try again in a few moments.',
          'RATE_LIMIT',
          429,
        )
      } else if (response.status === 400) {
        throw new TranslationError(
          `Invalid request: ${errorMessage}. Please check your model selection.`,
          'INVALID_REQUEST',
          400,
        )
      } else {
        throw new TranslationError(
          `API error (${response.status}): ${errorMessage}`,
          'API_ERROR',
          response.status,
        )
      }
    }

    const data = await response.json()
    return data.choices[0].message.content
  } catch (error) {
    if (error instanceof TranslationError) {
      throw error
    }
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new TranslationError(
        'Network error. Please check your internet connection.',
        'NETWORK_ERROR',
      )
    }
    throw new TranslationError(
      `Unexpected error: ${error instanceof Error ? error.message : 'Unknown'}`,
      'UNKNOWN_ERROR',
    )
  }
}

/**
 * Translates text using the configured provider
 */
async function translateText(
  text: string,
  provider: AIProvider,
  apiToken: string,
  model: string,
  instructions?: string,
): Promise<string> {
  if (!text.trim()) return text

  if (provider === 'anthropic') {
    return translateWithAnthropic(text, apiToken, model, instructions)
  } else {
    return translateWithOpenAI(text, apiToken, model, instructions)
  }
}

/**
 * Walks through all text nodes in a document and translates them
 * Uses efficient batching with a unique delimiter
 */
async function translateDocument(
  doc: Document,
  provider: AIProvider,
  apiToken: string,
  model: string,
  instructions?: string,
): Promise<void> {
  // Collect all text nodes
  const textNodes: Text[] = []
  const walker = doc.createTreeWalker(
    doc.body || doc.documentElement,
    NodeFilter.SHOW_TEXT,
  )

  let node: Node | null
  while ((node = walker.nextNode())) {
    const textNode = node as Text
    const text = textNode.textContent
    // Only translate nodes with meaningful text (not just whitespace)
    if (text && text.trim().length > 0) {
      textNodes.push(textNode)
    }
  }

  console.log(`Found ${textNodes.length} text nodes to translate`)

  // Use a unique delimiter that's very unlikely to appear in normal text
  const DELIMITER = '<<<TEXTNODE_SEPARATOR>>>'

  // Calculate total text length to determine batching strategy
  const totalText = textNodes.map((node) => node.textContent).join('')
  const totalLength = totalText.length

  // Improved batching strategy based on character count for better efficiency
  // Target 60-80k chars per batch (≈15-20k tokens) for optimal API usage
  // Modern AI models handle large context well, and bigger batches = better context + fewer API calls
  const MAX_CHARS_PER_BATCH = 80000
  const MIN_CHARS_PER_BATCH = 60000

  if (totalLength <= MAX_CHARS_PER_BATCH) {
    // Send entire chapter in one batch for maximum context
    console.log(
      `Chapter is ${totalLength} chars - sending as single batch for full context`,
    )
  } else {
    console.log(
      `Chapter is ${totalLength} chars - batching by ${MIN_CHARS_PER_BATCH}-${MAX_CHARS_PER_BATCH} chars per request`,
    )
  }

  // Create batches based on character count, not node count
  const batches: Text[][] = []
  let currentBatch: Text[] = []
  let currentBatchSize = 0

  for (const node of textNodes) {
    const nodeText = node.textContent || ''
    const nodeLength = nodeText.length

    // If adding this node would exceed MAX or we have enough chars, start new batch
    if (
      currentBatch.length > 0 &&
      (currentBatchSize + nodeLength > MAX_CHARS_PER_BATCH ||
        (currentBatchSize >= MIN_CHARS_PER_BATCH &&
          currentBatchSize + nodeLength > MAX_CHARS_PER_BATCH * 0.9))
    ) {
      batches.push(currentBatch)
      currentBatch = []
      currentBatchSize = 0
    }

    currentBatch.push(node)
    currentBatchSize += nodeLength
  }

  // Add the last batch if it has content
  if (currentBatch.length > 0) {
    batches.push(currentBatch)
  }

  console.log(
    `Created ${batches.length} batches, avg ${Math.round(totalLength / batches.length)} chars per batch`,
  )

  for (const batch of batches) {
    // Combine texts with delimiter
    const combinedText = batch
      .map((node) => node.textContent)
      .join(DELIMITER)

    try {
      // Add instruction to preserve the delimiter
      const batchInstructions = instructions
        ? `${instructions}\n\nIMPORTANT: Keep the exact delimiter "${DELIMITER}" between text segments. Do not translate or modify this delimiter.`
        : `Translate the following text segments. Keep the exact delimiter "${DELIMITER}" between segments. Do not translate or modify this delimiter.`

      const translatedCombined = await translateText(
        combinedText,
        provider,
        apiToken,
        model,
        batchInstructions,
      )

      // Split back using the delimiter
      const translatedParts = translatedCombined.split(DELIMITER)

      // Assign translated text back to nodes
      batch.forEach((textNode, idx) => {
        if (translatedParts[idx] !== undefined) {
          textNode.textContent = translatedParts[idx]
        }
      })
    } catch (error) {
      console.error('Translation batch failed:', error)

      // Re-throw if it's an auth or critical error
      if (
        error instanceof TranslationError &&
        (error.code === 'INVALID_API_KEY' ||
          error.code === 'NETWORK_ERROR' ||
          error.code === 'INVALID_REQUEST')
      ) {
        throw error
      }
      // Otherwise keep original text and continue
    }
  }
}

/**
 * Validates AI configuration
 */
function validateConfig(aiConfig: AIConfiguration): void {
  if (!aiConfig.provider) {
    throw new TranslationError(
      'AI provider is not configured. Please select a provider in Settings.',
      'MISSING_PROVIDER',
    )
  }

  if (!aiConfig.apiToken) {
    throw new TranslationError(
      'API token is required for translation. Please configure it in Settings.',
      'MISSING_API_KEY',
    )
  }

  if (!aiConfig.model) {
    throw new TranslationError(
      'Model is required for translation. Please select a model in Settings.',
      'MISSING_MODEL',
    )
  }
}

/**
 * Finds the correct path for a section in the ZIP file
 */
function findSectionPath(
  section: any,
  zipFiles: { [key: string]: JSZip.JSZipObject },
): string | null {
  // Try the href directly first
  if (section.href && zipFiles[section.href]) {
    return section.href
  }

  // Try with OEBPS prefix (common in ePub files)
  const withOEBPS = `OEBPS/${section.href}`
  if (zipFiles[withOEBPS]) {
    return withOEBPS
  }

  // Try with OPS prefix
  const withOPS = `OPS/${section.href}`
  if (zipFiles[withOPS]) {
    return withOPS
  }

  // Try to extract path from URL
  if (section.url) {
    const urlPath = section.url.replace(/^.*?:\/\//, '')
    if (zipFiles[urlPath]) {
      return urlPath
    }

    // Try finding by filename only
    const filename = urlPath.split('/').pop()
    if (filename) {
      for (const path in zipFiles) {
        if (
          path.endsWith(filename) &&
          (path.endsWith('.xhtml') || path.endsWith('.html'))
        ) {
          return path
        }
      }
    }
  }

  // Last resort: search for matching filename in the ZIP
  const href = section.href || ''
  const filename = href.split('/').pop()
  if (filename) {
    for (const path in zipFiles) {
      if (path.endsWith(filename)) {
        return path
      }
    }
  }

  return null
}

/**
 * Translates an entire ePub file and creates a new file
 */
export async function translateEpub(
  file: File,
  aiConfig: AIConfiguration,
  onProgress?: ProgressCallback,
): Promise<TranslationResult> {
  try {
    // Validate configuration
    validateConfig(aiConfig)

    // Decrypt API token
    const apiToken = aiConfig.apiToken ? await decrypt(aiConfig.apiToken) : ''

    if (!apiToken) {
      throw new TranslationError(
        'Failed to decrypt API token. Please re-enter your API key in Settings.',
        'DECRYPTION_ERROR',
      )
    }

    const provider = aiConfig.provider!
    const model = aiConfig.model!

    // Load the original ePub
    onProgress?.({ total: 1, current: 0, currentSection: 'Loading ePub file...' })

    let epub
    try {
      epub = await fileToEpub(file)
      await epub.opened
    } catch (error) {
      throw new TranslationError(
        `Failed to load ePub file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'EPUB_LOAD_ERROR',
      )
    }

    // Get and translate the title
    const metadata = await epub.loaded.metadata
    const originalTitle = metadata.title || file.name.replace(/\.epub$/i, '')

    onProgress?.({
      total: 1,
      current: 0,
      currentSection: 'Translating title...',
    })

    let translatedTitle = originalTitle
    try {
      translatedTitle = await translateText(
        originalTitle,
        provider,
        apiToken,
        model,
        aiConfig.instructions,
      )
    } catch (error) {
      console.error('Failed to translate title, using original:', error)
      // Non-critical, continue with original title
    }

    // Get all sections from the spine
    const spine = await epub.loaded.spine
    const sections = (spine as any).spineItems || []

    if (sections.length === 0) {
      throw new TranslationError(
        'No content found in ePub file. The file may be corrupted.',
        'EMPTY_EPUB',
      )
    }

    const totalSections = sections.length
    onProgress?.({
      total: totalSections,
      current: 0,
      currentSection: 'Preparing translation...',
    })

    // Load the original ZIP file
    const originalZip = new JSZip()
    const zipData = await file.arrayBuffer()
    await originalZip.loadAsync(zipData)

    // Create new ZIP for translated ePub
    const translatedZip = new JSZip()

    // Copy all files first
    const filePromises: Promise<void>[] = []
    originalZip.forEach((relativePath, zipEntry) => {
      filePromises.push(
        (async () => {
          if (!zipEntry.dir) {
            const content = await zipEntry.async('uint8array')
            translatedZip.file(relativePath, content)
          }
        })(),
      )
    })
    await Promise.all(filePromises)

    // Translate each section
    let successfulSections = 0
    let failedSections = 0

    for (let i = 0; i < sections.length; i++) {
      const section = sections[i]
      const sectionName = section.href || `section-${i}`

      onProgress?.({
        total: totalSections,
        current: i + 1,
        currentSection: sectionName,
      })

      try {
        // Load the section document
        await section.load(epub.load.bind(epub))

        if (section.document) {
          console.log(`Translating section: ${sectionName}`)

          // Translate the document
          await translateDocument(
            section.document,
            provider,
            apiToken,
            model,
            aiConfig.instructions,
          )

          // Serialize back to XML
          const serializer = new XMLSerializer()
          const translatedXml = serializer.serializeToString(section.document)

          // Find the correct path in the ZIP
          const sectionPath = findSectionPath(section, translatedZip.files)

          if (sectionPath) {
            console.log(`Updating ZIP file at path: ${sectionPath}`)
            translatedZip.file(sectionPath, translatedXml)
            successfulSections++
          } else {
            console.error(`Could not find path for section: ${sectionName}`)
            failedSections++
          }
        }
      } catch (error) {
        failedSections++
        console.error(`Failed to translate section ${sectionName}:`, error)

        // If it's a critical error, stop the whole process
        if (error instanceof TranslationError) {
          if (
            error.code === 'INVALID_API_KEY' ||
            error.code === 'NETWORK_ERROR' ||
            error.code === 'RATE_LIMIT'
          ) {
            throw error
          }
        }

        // For non-critical errors, continue with next section
        // but warn if too many failures
        if (failedSections > sections.length * 0.5) {
          throw new TranslationError(
            `Translation failed for more than 50% of sections (${failedSections}/${sections.length}). Aborting.`,
            'TOO_MANY_FAILURES',
          )
        }
      }
    }

    if (successfulSections === 0) {
      throw new TranslationError(
        'No sections were successfully translated. Please check your settings and try again.',
        'NO_SECTIONS_TRANSLATED',
      )
    }

    console.log(
      `Translation complete: ${successfulSections} successful, ${failedSections} failed`,
    )

    // Update metadata in content.opf with translated title
    try {
      const opfPath = Object.keys(translatedZip.files).find(
        (path) => path.endsWith('.opf') || path.includes('content.opf'),
      )

      if (opfPath) {
        const opfContent = await translatedZip.file(opfPath)?.async('string')
        if (opfContent) {
          // Replace title with translated version
          const updatedOpf = opfContent.replace(
            /(<dc:title[^>]*>)(.*?)(<\/dc:title>)/,
            `$1${translatedTitle}$3`,
          )
          translatedZip.file(opfPath, updatedOpf)
        }
      }
    } catch (error) {
      console.error('Failed to update OPF metadata:', error)
      // Non-critical error, continue
    }

    // Generate the translated ePub file
    onProgress?.({
      total: totalSections,
      current: totalSections,
      currentSection: 'Generating ePub file...',
    })

    const blob = await translatedZip.generateAsync({
      type: 'blob',
      mimeType: 'application/epub+zip',
      compression: 'DEFLATE',
    })

    const translatedFileName = `${translatedTitle}.epub`

    const translatedFile = new File([blob], translatedFileName, {
      type: 'application/epub+zip',
    })

    return {
      file: translatedFile,
      translatedTitle,
    }
  } catch (error) {
    // Make sure all errors are TranslationErrors with user-friendly messages
    if (error instanceof TranslationError) {
      throw error
    }

    // Wrap unknown errors
    throw new TranslationError(
      `Translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'UNKNOWN_ERROR',
    )
  }
}
