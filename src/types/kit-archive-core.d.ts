// kit-archive-core（vendor/kit-archive-core。JavaScript）の、このアプリで使う部分の型
declare module 'kit-archive-core' {
  export type KitCategory = 'Home' | 'Away' | 'Third' | 'Cup' | 'GK'

  export type ArchiveKit = {
    id: string
    season: string | null
    seasonStartYear: number | null
    name: string
    type: KitCategory | null
    variant: string | null
    variantOrder: number
    modelUrl: string
    modelUrlWorn: string | null
    thumbnailUrl: string | null
    hanger: { visible: boolean }
    display: { collar: number | null; color: string | null; texture: string | null; scale: number }
    placeholder: boolean
    sortHint: number
    createdAt: string | null
    updatedAt: string | null
    seasonId: string | null
    legacyUniformId: string | null
  }

  export type StoreResult = { ok: boolean; kit?: ArchiveKit; errors?: string[]; cause?: unknown }

  export type KitSource = {
    name: string
    label: string
    writable: boolean
    load(): Promise<unknown[]>
  }

  export class KitStore {
    constructor(source: KitSource & { empty?: boolean })
    load(): Promise<ArchiveKit[]>
    attachUserSource(source: SupabaseKitSource): Promise<ArchiveKit[]>
    list(): ArchiveKit[]
    get(id: string): ArchiveKit | null
    readonly size: number
    subscribe(fn: (e: { type: string; kits: ArchiveKit[] }) => void): () => void
    add(raw: Partial<ArchiveKit>): Promise<StoreResult>
    update(id: string, patch: Partial<ArchiveKit>): Promise<StoreResult>
    remove(id: string): Promise<StoreResult>
  }

  export type SupabaseLike = unknown

  export class SupabaseKitSource implements KitSource {
    static open(client: SupabaseLike, options?: { clubId?: string }): Promise<SupabaseKitSource>
    readonly archive: { id: string; name: string; club_id: string | null }
    readonly archiveId: string
    readonly clubId: string | null
    rename(name: string): Promise<void>
    name: string
    label: string
    writable: boolean
    load(): Promise<unknown[]>
    newId(): string
    putFile(blob: Blob, kind: 'image'): Promise<string>
    deleteFile(ref: string): Promise<void>
    imageUrl(ref: string): Promise<string>
  }

  export const CATEGORIES: readonly KitCategory[]
  export const COLLAR_COUNT: number
  export const COLLAR_STYLES: Readonly<Record<number, string>>
  export const DEFAULT_COLLAR: number
  export const MODEL_KEYS: Record<string, { hanging: string; worn: string }>
  export function compareKits(a: ArchiveKit, b: ArchiveKit): number
  export function parseSeasonStartYear(season: string | null): number | null
  export function findSameSlot(kits: ArchiveKit[], seasonStartYear: number | null, type: KitCategory | null): ArchiveKit[]

  export type ArchiveEvent = 'hint' | 'panel' | 'info' | 'load' | 'shape' | 'orbit'

  export type KitArchive = {
    store: KitStore
    readonly selectedId: string | null
    on(type: ArchiveEvent, fn: (...args: unknown[]) => void): () => void
    select(id: string): boolean
    deselect(): void
    flip(): void
    setView(dir: 'front' | 'angle' | 'side' | 'back'): void
    setShape(shape: 'hanging' | 'worn'): void
    setCollar(collar: number): void
    setUserSource(source: SupabaseKitSource | null): void
    readonly items: { kit?: unknown; error?: boolean }[]
    destroy(): void
  }

  export function createKitArchive(
    container: HTMLElement,
    options: { store: KitStore; resolveModelUrls?: (path: string) => string[]; background?: () => string },
  ): KitArchive
}

// データ管理だけの入口（three.js を含まない。3D を使わない画面はこちらから読む）
declare module 'kit-archive-core/data' {
  export * from 'kit-archive-core'
}
