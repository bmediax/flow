'use client'

import { useBoolean } from '@literal-ui/hooks'
import clsx from 'clsx'
import { useLiveQuery } from 'dexie-react-hooks'
import { useRouter, useSearchParams } from 'next/navigation'
import type React from 'react'
import { useEffect, useState } from 'react'
import {
  MdCheckBox,
  MdCheckBoxOutlineBlank,
  MdCheckCircle,
  MdOutlineFileDownload,
  MdOutlineShare,
  MdTranslate,
} from 'react-icons/md'
import { useSet } from 'react-use'
import { usePrevious } from 'react-use'

import { Button, DropZone, ReaderGridView, TextField } from '../components'
import { type BookRecord, type CoverRecord, db } from '../db'
import { addBook, addFile, fetchBook, handleFiles } from '../file'
import { translateEpub, type TranslationResult } from '../translate'
import { useSettings, useActiveTranslation } from '../state'
import {
  useDisablePinchZooming,
  useLibrary,
  useMobile,
  useRemoteBooks,
  useRemoteFiles,
  useTranslation,
} from '../hooks'
import { reader, useReaderSnapshot } from '../models'
import { lock } from '../styles'
import { dbx, pack, uploadData } from '../sync'
import { copy } from '../utils'

const placeholder = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><rect fill="gray" fill-opacity="0" width="1" height="1"/></svg>`

const SOURCE = 'src'

export function HomePage() {
  const { focusedTab } = useReaderSnapshot()
  // const router = useRouter()
  const searchParams = useSearchParams()
  const src = searchParams.get(SOURCE)
  const [loading, setLoading] = useState(!!src)

  useDisablePinchZooming()

  // Dynamic title
  useEffect(() => {
    document.title = focusedTab?.title ?? 'Flow'
  }, [focusedTab?.title])

  // Handle URL source parameter
  useEffect(() => {
    if (!src) return

    Promise.all(
      [src].map((s) =>
        fetchBook(s).then((b) => {
          reader.addTab(b)
        }),
      ),
    ).finally(() => setLoading(false))
  }, [src])

  // Handle PWA file launch
  useEffect(() => {
    if ('launchQueue' in window && 'LaunchParams' in window) {
      ;(window as any).launchQueue.setConsumer((params: any) => {
        console.log('launchQueue', params)
        if (params.files.length) {
          Promise.all(params.files.map((f: any) => f.getFile()))
            .then((files) => handleFiles(files))
            .then((books) => books.forEach((b) => reader.addTab(b)))
        }
      })
    }
  }, [])

  // Handle popstate (replaces router.beforePopState)
  useEffect(() => {
    const handlePopState = () => {
      if (window.location.pathname === '/') {
        reader.clear()
      }
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  return (
    <>
      <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no"
      />
      <ReaderGridView />
      {loading || <Library />}
    </>
  )
}

const Library: React.FC = () => {
  const books = useLibrary()
  const covers = useLiveQuery(() => db?.covers.toArray() ?? [])
  const t = useTranslation('home')

  const { data: remoteBooks, mutate: mutateRemoteBooks } = useRemoteBooks()
  const { data: remoteFiles, mutate: mutateRemoteFiles } = useRemoteFiles()
  const previousRemoteBooks = usePrevious(remoteBooks)
  const previousRemoteFiles = usePrevious(remoteFiles)

  const [select, toggleSelect] = useBoolean(false)
  const [selectedBookIds, { add, has, toggle, reset }] = useSet<string>()

  const [loading, setLoading] = useState<string | undefined>()
  const [readyToSync, setReadyToSync] = useState(false)

  const { groups } = useReaderSnapshot()

  useEffect(() => {
    if (previousRemoteFiles && remoteFiles) {
      // to remove effect dependency `books`
      db?.books.toArray().then((books) => {
        if (books.length === 0) return

        const newRemoteBooks = remoteFiles.map((f) =>
          books.find((b) => b.name === f.name),
        ) as BookRecord[]

        uploadData(newRemoteBooks)
        mutateRemoteBooks(newRemoteBooks, { revalidate: false })
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mutateRemoteBooks, remoteFiles])

  useEffect(() => {
    if (!previousRemoteBooks && remoteBooks) {
      db?.books.bulkPut(remoteBooks).then(() => setReadyToSync(true))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remoteBooks])

  useEffect(() => {
    if (!remoteFiles || !readyToSync) return

    db?.books.toArray().then(async (books) => {
      for (const remoteFile of remoteFiles) {
        const book = books.find((b) => b.name === remoteFile.name)
        if (!book) continue

        const file = await db?.files.get(book.id)
        if (file) continue

        setLoading(book.id)
        await dbx
          .filesDownload({ path: `/files/${remoteFile.name}` })
          .then((d) => {
            const blob: Blob = (d.result as any).fileBlob
            return addFile(book.id, new File([blob], book.name))
          })
        setLoading(undefined)
      }
    })
  }, [readyToSync, remoteFiles])

  useEffect(() => {
    if (!select) reset()
  }, [reset, select])

  if (groups.length) return null
  if (!books) return null

  const selectedBooks = [...selectedBookIds].map(
    (id) => books.find((b) => b.id === id)!,
  )
  const allSelected = selectedBookIds.size === books.length

  return (
    <DropZone
      className="scroll-parent h-full p-4"
      onDrop={(e) => {
        const bookId = e.dataTransfer.getData('text/plain')
        const book = books.find((b) => b.id === bookId)
        if (book) reader.addTab(book)

        handleFiles(e.dataTransfer.files)
      }}
    >
      <div className="mb-4 space-y-2.5">
        <div>
          <TextField
            name={SOURCE}
            placeholder="https://link.to/remote.epub"
            type="url"
            hideLabel
            actions={[
              {
                title: t('share'),
                Icon: MdOutlineShare,
                onClick(el) {
                  if (el?.reportValidity()) {
                    copy(`${window.location.origin}/?${SOURCE}=${el.value}`)
                  }
                },
              },
              {
                title: t('download'),
                Icon: MdOutlineFileDownload,
                onClick(el) {
                  if (el?.reportValidity()) fetchBook(el.value)
                },
              },
            ]}
          />
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="space-x-2">
            {books.length ? (
              <Button variant="secondary" onClick={toggleSelect}>
                {t(select ? 'cancel' : 'select')}
              </Button>
            ) : (
              <Button
                variant="secondary"
                disabled={!books}
                onClick={() => {
                  fetchBook(
                    'https://epubtest.org/books/Fundamental-Accessibility-Tests-Basic-Functionality-v1.0.0.epub',
                  )
                }}
              >
                {t('download_sample_book')}
              </Button>
            )}
            {select &&
              (allSelected ? (
                <Button variant="secondary" onClick={reset}>
                  {t('deselect_all')}
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  onClick={() => books.forEach((b) => add(b.id))}
                >
                  {t('select_all')}
                </Button>
              ))}
          </div>

          <div className="space-x-2">
            {select ? (
              <>
                <Button
                  onClick={async () => {
                    toggleSelect()

                    for (const book of selectedBooks) {
                      const remoteFile = remoteFiles?.find(
                        (f) => f.name === book.name,
                      )
                      if (remoteFile) continue

                      const file = await db?.files.get(book.id)
                      if (!file) continue

                      setLoading(book.id)
                      await dbx.filesUpload({
                        path: `/files/${book.name}`,
                        contents: file.file,
                      })
                      setLoading(undefined)

                      mutateRemoteFiles()
                    }
                  }}
                >
                  {t('upload')}
                </Button>
                <Button
                  onClick={async () => {
                    toggleSelect()
                    const bookIds = [...selectedBookIds]

                    db?.books.bulkDelete(bookIds)
                    db?.covers.bulkDelete(bookIds)
                    db?.files.bulkDelete(bookIds)

                    // folder data is not updated after `filesDeleteBatch`
                    mutateRemoteFiles(
                      async (data) => {
                        await dbx.filesDeleteBatch({
                          entries: selectedBooks.map((b) => ({
                            path: `/files/${b.name}`,
                          })),
                        })
                        return data?.filter(
                          (f) => !selectedBooks.find((b) => b.name === f.name),
                        )
                      },
                      { revalidate: false },
                    )
                  }}
                >
                  {t('delete')}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="secondary"
                  disabled={!books.length}
                  onClick={pack}
                >
                  {t('export')}
                </Button>
                <Button className="relative">
                  <input
                    type="file"
                    accept="application/epub+zip,application/epub,application/zip,text/plain,.txt"
                    className="absolute inset-0 cursor-pointer opacity-0"
                    onChange={(e) => {
                      const files = e.target.files
                      if (files) handleFiles(files)
                    }}
                    multiple
                  />
                  {t('import')}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="scroll h-full">
        <ul
          className="grid"
          style={{
            gridTemplateColumns: `repeat(auto-fill, minmax(calc(80px + 3vw), 1fr))`,
            columnGap: lock(16, 32),
            rowGap: lock(24, 40),
          }}
        >
          {books.map((book) => (
            <Book
              key={book.id}
              book={book}
              covers={covers}
              select={select}
              selected={has(book.id)}
              loading={loading === book.id}
              toggle={toggle}
            />
          ))}
        </ul>
      </div>
    </DropZone>
  )
}

interface BookProps {
  book: BookRecord
  covers?: CoverRecord[]
  select?: boolean
  selected?: boolean
  loading?: boolean
  toggle: (id: string) => void
}
const Book: React.FC<BookProps> = ({
  book,
  covers,
  select,
  selected,
  loading,
  toggle,
}) => {
  const remoteFiles = useRemoteFiles()
  const [settings] = useSettings()
  const [activeTranslation, setActiveTranslation] = useActiveTranslation()
  const [isEditingName, setIsEditingName] = useState(false)
  const [editedName, setEditedName] = useState(book.name)

  // Check if this book is currently being translated
  const translating = activeTranslation?.bookId === book.id
  const translationProgress = translating ? activeTranslation.progress : null

  const router = useRouter()
  const mobile = useMobile()

  const cover = covers?.find((c) => c.id === book.id)?.cover
  const remoteFile = remoteFiles.data?.find((f) => f.name === book.name)

  const Icon = selected ? MdCheckBox : MdCheckBoxOutlineBlank

  const handleNameClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!select && !translating) {
      setIsEditingName(true)
      setEditedName(book.name)
    }
  }

  const handleNameSave = async () => {
    if (editedName.trim() && editedName !== book.name) {
      try {
        await db?.books.update(book.id, { name: editedName.trim() })
      } catch (error) {
        console.error('Failed to update book name:', error)
        alert('Failed to update book name')
      }
    }
    setIsEditingName(false)
  }

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleNameSave()
    } else if (e.key === 'Escape') {
      setIsEditingName(false)
      setEditedName(book.name)
    }
  }

  const handleTranslate = async (e: React.MouseEvent) => {
    e.stopPropagation()

    // Check if there's already an active translation
    if (activeTranslation) {
      alert('A translation is already in progress. Please wait for it to complete.')
      return
    }

    // Validate AI settings
    if (!settings.ai?.provider || !settings.ai?.apiToken || !settings.ai?.model) {
      alert(
        'Please configure AI settings in Settings first:\n\n' +
          '1. Select an AI provider (Anthropic or OpenAI)\n' +
          '2. Enter your API token\n' +
          '3. Select a model',
      )
      return
    }

    const providerName = settings.ai.provider === 'anthropic' ? 'Anthropic' : 'OpenAI'
    const confirmed = confirm(
      `This will create a translated copy of "${book.name}" using ${providerName}.\n\n` +
        'This may take several minutes depending on book length.\n\n' +
        'You can navigate away and the translation will continue in the background.\n\n' +
        'Continue?',
    )
    if (!confirmed) return

    // Initialize global translation state
    const startTime = Date.now()
    setActiveTranslation({
      bookId: book.id,
      bookTitle: book.name,
      progress: { current: 0, total: 1, currentSection: 'Starting...' },
      startTime,
    })

    // Run translation in background (don't await here)
    ;(async () => {
      try {
        // Get the original file
        const fileRecord = await db?.files.get(book.id)
        if (!fileRecord) {
          alert('Book file not found. Please re-import the book.')
          setActiveTranslation(null)
          return
        }

        // Translate the ePub
        const result = await translateEpub(
          fileRecord.file,
          settings.ai,
          (progress) => {
            setActiveTranslation({
              bookId: book.id,
              bookTitle: book.name,
              progress,
              startTime,
            })
          },
        )

        // Add the translated book to the library
        await addBook(result.file)

        alert(
          `Translation completed!\n\n` +
            `"${result.translatedTitle}" has been added to your library.`,
        )
      } catch (error) {
        console.error('Translation failed:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        alert(`Translation failed:\n\n${errorMessage}`)
      } finally {
        setActiveTranslation(null)
      }
    })()
  }

  return (
    <div className="relative flex flex-col">
      <div
        role="button"
        className="border-inverse-on-surface relative border"
        onClick={async () => {
          if (select) {
            toggle(book.id)
          } else {
            if (mobile) router.push('/read')
            reader.addTab(book)
          }
        }}
      >
        <div
          className={clsx(
            'absolute bottom-0 h-1',
            translating ? 'bg-green-500' : 'bg-blue-500',
            loading && !translating && 'progress-bit w-[5%]',
          )}
          style={
            translating && translationProgress
              ? {
                  width: `${(translationProgress.current / translationProgress.total) * 100}%`,
                  transition: 'width 0.3s ease-in-out',
                }
              : undefined
          }
        />
        {book.percentage !== undefined && !translating && (
          <div className="typescale-body-large absolute right-0 bg-gray-500/60 px-2 text-gray-100">
            {(book.percentage * 100).toFixed()}%
          </div>
        )}
        {translating && translationProgress && (
          <div className="typescale-body-small absolute right-0 top-0 bg-green-500/80 px-2 text-white">
            Translating {Math.round((translationProgress.current / translationProgress.total) * 100)}%
          </div>
        )}
        <img
          src={cover ?? placeholder}
          alt="Cover"
          className="mx-auto aspect-[9/12] object-cover"
          draggable={false}
        />
        {select && (
          <div className="absolute bottom-1 right-1">
            <Icon
              size={24}
              className={clsx(
                '-m-1',
                selected ? 'text-tertiary' : 'text-outline',
              )}
            />
          </div>
        )}
        {!select && !translating && (
          <button
            className="absolute bottom-1 left-1 rounded bg-surface/80 p-1 hover:bg-surface"
            onClick={handleTranslate}
            title="Translate book with AI"
          >
            <MdTranslate size={20} className="text-on-surface-variant" />
          </button>
        )}
      </div>

      {isEditingName ? (
        <input
          type="text"
          value={editedName}
          onChange={(e) => setEditedName(e.target.value)}
          onBlur={handleNameSave}
          onKeyDown={handleNameKeyDown}
          className="text-on-surface-variant typescale-body-small lg:typescale-body-medium mt-2 w-full rounded border border-outline bg-surface px-2 py-1"
          autoFocus
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <div
          className="line-clamp-2 text-on-surface-variant typescale-body-small lg:typescale-body-medium mt-2 w-full cursor-pointer hover:text-on-surface"
          title={book.name}
          onClick={handleNameClick}
        >
          <MdCheckCircle
            className={clsx(
              'mr-1 mb-0.5 inline',
              remoteFile ? 'text-tertiary' : 'text-surface-variant',
            )}
            size={16}
          />
          {book.name}
        </div>
      )}
    </div>
  )
}
