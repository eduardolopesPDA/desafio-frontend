import { z } from 'zod'
import { dateTimeSchema, imageSchema, moneySchema, paginatedSchema } from './common'

export const showIdSchema = z.enum([
  'hora-de-aventura',
  'gumball',
  'apenas-um-show',
  'clarencio',
  'meninas-superpoderosas',
  'laboratorio-de-dexter',
  'coragem',
])
export type ShowId = z.infer<typeof showIdSchema>
export const SHOW_NAMES: Record<ShowId, string> = {
  'hora-de-aventura': 'Hora de Aventura',
  gumball: 'O Incrível Mundo de Gumball',
  'apenas-um-show': 'Apenas um Show',
  clarencio: 'Clarêncio, o Otimista',
  'meninas-superpoderosas': 'As Meninas Superpoderosas',
  'laboratorio-de-dexter': 'O Laboratório de Dexter',
  coragem: 'Coragem, o Cão Covarde',
}

// Da mais comum à mais rara: a ordem define a ordenação `rarity`.
export const raritySchema = z.enum(['comum', 'raro', 'epico', 'lendario', 'mitico'])
export type Rarity = z.infer<typeof raritySchema>
export const RARITY_NAMES: Record<Rarity, string> = {
  comum: 'Comum',
  raro: 'Raro',
  epico: 'Épico',
  lendario: 'Lendário',
  mitico: 'Mítico',
}

export const nftSortSchema = z.enum(['newest', 'price_asc', 'price_desc', 'rarity'])
export type NftSort = z.infer<typeof nftSortSchema>

export const editionSchema = z.object({
  id: z.string(),
  name: z.string(),
  media: z.string(),
  supply: z.int().min(0),
  available: z.int().min(0),
})
export type Edition = z.infer<typeof editionSchema>

export const nftSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  character: z.string(),
  show: showIdSchema,
  rarity: raritySchema,
  price: moneySchema,
  image: imageSchema,
  // Soma do disponível em todas as edições.
  available: z.int().min(0),
  maxPerOrder: z.int().min(1),
  featured: z.boolean(),
  createdAt: dateTimeSchema,
  version: z.int().min(1),
})
export type NftSummary = z.infer<typeof nftSummarySchema>

export const nftAttributesSchema = z.object({
  forca: z.int().min(0).max(100),
  caos: z.int().min(0).max(100),
  nostalgia: z.int().min(0).max(100),
})

export const nftDetailSchema = nftSummarySchema.extend({
  gallery: z.array(imageSchema).min(1),
  lore: z.string(),
  episode: z.string(),
  attributes: nftAttributesSchema,
  editions: z.array(editionSchema).min(1),
})
export type NftDetail = z.infer<typeof nftDetailSchema>

// `rarity` e `show` vão repetidos na query string: ?rarity=raro&rarity=epico.
export const nftListParamsSchema = z.object({
  q: z.string().trim().optional(),
  rarity: z.array(raritySchema).optional(),
  show: z.array(showIdSchema).optional(),
  sort: nftSortSchema.default('newest'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(48).default(12),
})
export type NftListParams = z.input<typeof nftListParamsSchema>

export const nftListResponseSchema = paginatedSchema(nftSummarySchema)
export type NftListResponse = z.infer<typeof nftListResponseSchema>

export const featuredNftsResponseSchema = z.object({ items: z.array(nftSummarySchema) })
