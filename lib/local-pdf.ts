'use client'

import { createWorker } from 'tesseract.js'
import * as pdfjs from 'pdfjs-dist'

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

export async function readContractPdf(file: File, onProgress: (progress: number, step: number) => void) {
  const loadingTask = pdfjs.getDocument({ data: await file.arrayBuffer() })
  const pdf = await loadingTask.promise
  const pageCount = Math.min(pdf.numPages, 30)
  const pages: string[] = []
  let needsOcr = false

  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber)
    const content = await page.getTextContent()
    const text = content.items.map((item) => ('str' in item ? item.str : '')).join(' ')
    pages.push(text)
    if (text.trim().length < 40) needsOcr = true
    onProgress(Math.min(20, Math.round((pageNumber / pageCount) * 20)), 0)
  }

  if (needsOcr) {
    onProgress(22, 1)
    const worker = await createWorker('fra+eng', undefined, {
      logger: (message) => {
        if (message.status === 'recognizing text') {
          onProgress(22 + Math.round(message.progress * 63), 1)
        }
      },
    })
    try {
      for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
        if (pages[pageNumber - 1].trim().length >= 40) continue
        const page = await pdf.getPage(pageNumber)
        const viewport = page.getViewport({ scale: 1.6 })
        const canvas = document.createElement('canvas')
        canvas.width = Math.ceil(viewport.width)
        canvas.height = Math.ceil(viewport.height)
        const context = canvas.getContext('2d')
        if (!context) continue
        await page.render({ canvas, canvasContext: context, viewport }).promise
        const { data } = await worker.recognize(canvas)
        pages[pageNumber - 1] = data.text
        canvas.width = 0
        canvas.height = 0
      }
    } finally {
      await worker.terminate()
    }
  }

  await loadingTask.destroy()
  const text = pages.join('\n\n').slice(0, 60_000).trim()
  if (text.length < 80) throw new Error('Aucun texte lisible trouvé. Vérifiez la qualité ou l’orientation du PDF.')
  return text
}
