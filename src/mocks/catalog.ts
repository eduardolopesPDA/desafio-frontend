import type { NftDetail, NftSummary } from '@/contracts'
import { db, persist, type NftRecord } from './db'
import { MockError } from './http'
import { emitNftUpdated } from './realtime'

export function availableOf(nft: NftRecord) {
  return nft.status === 'burned' ? 0 : nft.editions.reduce((total, edition) => total + edition.available, 0)
}

export function toSummary(nft: NftRecord): NftSummary {
  const { id, name, character, show, rarity, price, maxPerOrder, featured, createdAt, version, gallery } = nft
  return { id, name, character, show, rarity, price, maxPerOrder, featured, createdAt, version, image: gallery[0]!, available: availableOf(nft) }
}

export function toDetail(nft: NftRecord): NftDetail {
  const { gallery, lore, episode, attributes, editions } = nft
  return { ...toSummary(nft), gallery, lore, episode, attributes, editions }
}

// NFT comprável: existe e não foi queimado.
export function findActiveNft(id: string): NftRecord {
  const nft = db.nfts.find((n) => n.id === id)
  if (!nft) throw new MockError(404, 'NFT_NOT_FOUND', 'Esse NFT não existe nesta dimensão.')
  if (nft.status === 'burned') throw new MockError(410, 'NFT_BURNED', `${nft.name} foi queimado e não está mais disponível.`)
  return nft
}

export function findEdition(nft: NftRecord, editionId: string) {
  const edition = nft.editions.find((e) => e.id === editionId)
  if (!edition) throw new MockError(404, 'NOT_FOUND', `Edição não encontrada para ${nft.name}.`)
  return edition
}

// Toda mudança de preço ou tiragem passa por aqui: nova versão, persistência e nft.updated.
export function changeNft(nft: NftRecord, change: (nft: NftRecord) => void) {
  change(nft)
  nft.version += 1
  persist()
  emitNftUpdated(nft)
}
