import Big from 'big.js'

// Valores trafegam e são calculados como strings decimais, nunca `number` (ARCHITECTURE.md §6).
export type DecimalString = string
export type Currency = 'tc' | 'eth'

const DECIMAL_PLACES: Record<Currency, number> = { tc: 2, eth: 4 }
const SYMBOL: Record<Currency, string> = { tc: 'TC', eth: 'ETH' }
// Espaço inseparável, para valor e moeda não quebrarem de linha.
const NBSP = String.fromCharCode(0xa0)

// Construtor próprio em modo estrito: passar `number` lança erro em vez de perder precisão.
const Decimal = Big()
Decimal.strict = true

export function add(...values: DecimalString[]): DecimalString {
  return values.reduce((sum, value) => sum.plus(value), Decimal('0')).toFixed()
}

export function multiply(value: DecimalString, quantity: number): DecimalString {
  if (!Number.isSafeInteger(quantity)) throw new RangeError(`Quantidade deve ser inteira: ${quantity}`)
  return Decimal(value).times(String(quantity)).toFixed()
}

export function compare(a: DecimalString, b: DecimalString): -1 | 0 | 1 {
  return Decimal(a).cmp(b)
}

// "1250.5" → "1.250,50 TC", arredondando meio para cima.
export function formatMoney(value: DecimalString, currency: Currency): string {
  const fixed = Decimal(value).toFixed(DECIMAL_PLACES[currency], Big.roundHalfUp)
  const [integer = '0', fraction] = fixed.split('.')
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${grouped},${fraction}${NBSP}${SYMBOL[currency]}`
}
