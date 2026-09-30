import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '@/lib/i18n/LanguageContext'

const VIEWPORT_WIDTH = 300
const OUTPUT_WIDTH = 960

type Offset = { x: number; y: number }

export default function ImageCropModal({
  file,
  aspectRatio = 1,
  onCancel,
  onCropped,
}: {
  file: File
  /** width / height, e.g. 1 for square, 16/9 for a wide banner crop */
  aspectRatio?: number
  onCancel: () => void
  onCropped: (blob: Blob) => void
}) {
  const { t } = useLanguage()
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null)
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState<Offset>({ x: 0, y: 0 })
  const dragState = useRef<{ startX: number; startY: number; origin: Offset } | null>(null)

  const viewportHeight = Math.round(VIEWPORT_WIDTH / aspectRatio)
  const outputHeight = Math.round(OUTPUT_WIDTH / aspectRatio)

  useEffect(() => {
    const url = URL.createObjectURL(file)
    setImageUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const baseScale = naturalSize
    ? Math.max(VIEWPORT_WIDTH / naturalSize.width, viewportHeight / naturalSize.height)
    : 1
  const displayScale = baseScale * zoom
  const displayedWidth = naturalSize ? naturalSize.width * displayScale : 0
  const displayedHeight = naturalSize ? naturalSize.height * displayScale : 0

  function clampOffset(next: Offset): Offset {
    const minX = Math.min(0, VIEWPORT_WIDTH - displayedWidth)
    const minY = Math.min(0, viewportHeight - displayedHeight)
    return {
      x: Math.min(0, Math.max(minX, next.x)),
      y: Math.min(0, Math.max(minY, next.y)),
    }
  }

  function handleImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const img = e.currentTarget
    setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight })
    setOffset({ x: 0, y: 0 })
  }

  function handlePointerDown(e: React.PointerEvent) {
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      // Pointer capture isn't available for this pointer (e.g. some synthetic input sources);
      // dragging still works via normal event bubbling as long as the cursor stays over the element.
    }
    dragState.current = { startX: e.clientX, startY: e.clientY, origin: offset }
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!dragState.current) return
    const dx = e.clientX - dragState.current.startX
    const dy = e.clientY - dragState.current.startY
    setOffset(clampOffset({ x: dragState.current.origin.x + dx, y: dragState.current.origin.y + dy }))
  }

  function handlePointerUp() {
    dragState.current = null
  }

  function handleZoomChange(next: number) {
    setZoom(next)
    setOffset((prev) => clampOffset(prev))
  }

  function handleCrop() {
    if (!naturalSize || !imageUrl) return
    const canvas = document.createElement('canvas')
    canvas.width = OUTPUT_WIDTH
    canvas.height = outputHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new Image()
    img.onload = () => {
      const sourceX = -offset.x / displayScale
      const sourceY = -offset.y / displayScale
      const sourceWidth = VIEWPORT_WIDTH / displayScale
      const sourceHeight = viewportHeight / displayScale
      ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, OUTPUT_WIDTH, outputHeight)
      canvas.toBlob(
        (blob) => {
          if (blob) onCropped(blob)
        },
        'image/jpeg',
        0.92,
      )
    }
    img.src = imageUrl
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-5">
        <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-club-navy">
          {t('crop.title')}
        </h2>

        <div
          className="relative mx-auto touch-none select-none overflow-hidden rounded-md border border-club-line bg-club-bg"
          style={{ width: VIEWPORT_WIDTH, height: viewportHeight, cursor: 'grab' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          <img
            src={imageUrl ?? undefined}
            alt=""
            draggable={false}
            onLoad={handleImageLoad}
            style={{
              position: 'absolute',
              left: offset.x,
              top: offset.y,
              width: displayedWidth || undefined,
              height: displayedHeight || undefined,
              maxWidth: 'none',
            }}
          />
        </div>

        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs text-club-muted">{t('crop.zoom')}</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => handleZoomChange(Number(e.target.value))}
            className="flex-1"
          />
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-club-line px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-club-muted hover:bg-club-bg"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={handleCrop}
            disabled={!naturalSize}
            className="rounded-md bg-club-navy px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white hover:opacity-90 disabled:opacity-50"
          >
            {t('crop.apply')}
          </button>
        </div>
      </div>
    </div>
  )
}
