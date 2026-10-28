import type { Money, NetworkId, User, Wallet } from '@/contracts'

export { nftFixtures, type NftFixture } from './nfts'

// Senhas só como hash: SHA-256 de `${salt}:${senha}` (ver README › Credenciais fictícias).
export type UserFixture = User & { salt: string; passwordHash: string }

export const userFixtures: UserFixture[] = [
  {
    id: 'user-finn',
    name: 'Finn Mertens',
    email: 'finchin@ooo.com',
    avatar: 'finn',
    createdAt: '2026-01-10T12:00:00.000Z',
    salt: 'sal-ooo-finn',
    passwordHash: '9dea2ffc1cf20c33a2c4ffab3b8d28a26098b98711f5e8ba0aa591516d9cac04',
  },
  {
    id: 'user-gumball',
    name: 'Gumball Watterson',
    email: 'gumball@elmore.com',
    avatar: 'gumball',
    createdAt: '2026-02-03T12:00:00.000Z',
    salt: 'sal-elmore-gumball',
    passwordHash: 'f08bf111ed5e0cb622908569840266e8e2b7b04640fb21169ffe5f2a82738b92',
  },
]

export const favoriteFixtures: Record<string, string[]> = {
  'user-finn': ['enchiridion'],
  'user-gumball': ['aquario-do-darwin'],
}

export type WalletFixture = Wallet & { userId: string }

export const walletFixtures: WalletFixture[] = [
  {
    id: 'wallet-finn-1',
    userId: 'user-finn',
    label: 'Mochila do Jake',
    address: '0xf1a2000000000000000000000000000000000a01',
    network: 'ooo',
    role: 'primary',
    createdAt: '2026-01-10T12:05:00.000Z',
    updatedAt: '2026-01-10T12:05:00.000Z',
  },
  {
    id: 'wallet-finn-2',
    userId: 'user-finn',
    label: 'Cofre do Reino Doce',
    address: '0xb0b0000000000000000000000000000000000b02',
    network: 'elmore',
    role: 'secondary',
    createdAt: '2026-01-12T12:05:00.000Z',
    updatedAt: '2026-01-12T12:05:00.000Z',
  },
  // Gumball só tem a principal, para o fluxo de cadastrar a secundária.
  {
    id: 'wallet-gumball-1',
    userId: 'user-gumball',
    label: 'Carteira da Penny',
    address: '0xe1a0000000000000000000000000000000000c03',
    network: 'elmore',
    role: 'primary',
    createdAt: '2026-02-03T12:10:00.000Z',
    updatedAt: '2026-02-03T12:10:00.000Z',
  },
]

export type CouponFixture = {
  code: string
  description: string
  expiresAt: string
} & ({ kind: 'percent'; percent: string } | { kind: 'fixed'; amount: Money })

export const couponFixtures: CouponFixture[] = [
  {
    code: 'BUBBLEGUM10',
    description: '10% de desconto da Princesa Jujuba',
    kind: 'percent',
    percent: '10',
    expiresAt: '2099-12-31T23:59:59.000Z',
  },
  {
    code: 'RIGBYFAIL',
    description: '100 TC de desconto (o Rigby falhou de novo)',
    kind: 'fixed',
    amount: { tc: '100.00', eth: '0.0333' },
    expiresAt: '2099-12-31T23:59:59.000Z',
  },
  {
    code: 'CUPOM_REINO_DOCE_EXPIRADO',
    description: '25% de desconto do Reino Doce',
    kind: 'percent',
    percent: '25',
    expiresAt: '2026-01-01T00:00:00.000Z',
  },
]

export const gasFeeFixtures: Record<NetworkId, Money> = {
  ooo: { tc: '12.50', eth: '0.0042' },
  elmore: { tc: '8.00', eth: '0.0027' },
  park: { tc: '5.25', eth: '0.0018' },
}
