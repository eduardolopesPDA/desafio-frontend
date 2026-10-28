import Big from 'big.js'
import type { Money } from '@/contracts'

// O "servidor" calcula com big.js como a app, mas sem importar lib/ (ARCHITECTURE.md §2).
const DECIMALS = { tc: 2, eth: 4 } as const
const Decimal = Big()
Decimal.strict = true

function each(fn: (currency: keyof Money) => Big): Money {
  return { tc: fn('tc').toFixed(DECIMALS.tc), eth: fn('eth').toFixed(DECIMALS.eth) }
}

export const ZERO: Money = { tc: '0.00', eth: '0.0000' }

export function sum(values: Money[]): Money {
  return each((c) => values.reduce((total, value) => total.plus(value[c]), Decimal('0')))
}

export function times(value: Money, quantity: number): Money {
  return each((c) => Decimal(value[c]).times(String(quantity)))
}

export function percentOf(value: Money, percent: string): Money {
  return each((c) => Decimal(value[c]).times(percent).div('100').round(DECIMALS[c], Big.roundHalfUp))
}

// Desconto nunca maior que o valor.
export function capAt(value: Money, limit: Money): Money {
  return each((c) => (Decimal(value[c]).gt(limit[c]) ? Decimal(limit[c]) : Decimal(value[c])))
}

export function minus(a: Money, b: Money): Money {
  return each((c) => Decimal(a[c]).minus(b[c]))
}

export function scale(value: Money, factor: string): Money {
  return each((c) => Decimal(value[c]).times(factor).round(DECIMALS[c], Big.roundHalfUp))
}
