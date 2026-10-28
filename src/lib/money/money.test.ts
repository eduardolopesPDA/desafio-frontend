import { describe, expect, it } from 'vitest'
import { add, compare, formatMoney, multiply } from '.'

// Formato esperado com espaço comum, para o teste ficar legível.
const format = (...args: Parameters<typeof formatMoney>) => formatMoney(...args).replace(String.fromCharCode(0xa0), ' ')

describe('add', () => {
  it('soma sem o erro de ponto flutuante de number', () => {
    expect(add('0.1', '0.2')).toBe('0.3')
  })

  it('mantém a precisão de valores em ETH com muitas casas', () => {
    expect(add('0.000000000000000001', '1')).toBe('1.000000000000000001')
  })

  it('devolve zero sem valores', () => {
    expect(add()).toBe('0')
  })
})

describe('multiply', () => {
  it('multiplica o preço pela quantidade', () => {
    expect(multiply('1250.50', 3)).toBe('3751.5')
  })

  it('rejeita quantidade fracionada', () => {
    expect(() => multiply('10', 1.5)).toThrow(RangeError)
  })
})

describe('compare', () => {
  it('compara pelo valor decimal, não pelo texto', () => {
    expect(compare('10.0', '10')).toBe(0)
    expect(compare('9.99', '10')).toBe(-1)
    expect(compare('100', '99.999')).toBe(1)
  })
})

describe('formatMoney', () => {
  it('formata TC com 2 casas e separadores pt-BR', () => {
    expect(format('1250.5', 'tc')).toBe('1.250,50 TC')
  })

  it('formata ETH com 4 casas', () => {
    expect(format('0.42', 'eth')).toBe('0,4200 ETH')
  })

  it('arredonda meio para cima', () => {
    expect(format('0.005', 'tc')).toBe('0,01 TC')
    expect(format('1.23455', 'eth')).toBe('1,2346 ETH')
  })

  it('agrupa milhões e mantém o sinal negativo', () => {
    expect(format('1234567.891', 'tc')).toBe('1.234.567,89 TC')
    expect(format('-1000', 'tc')).toBe('-1.000,00 TC')
  })

  it('separa valor e moeda com espaço inseparável', () => {
    expect(formatMoney('1', 'tc')).toBe(`1,00${String.fromCharCode(0xa0)}TC`)
  })
})

describe('modo estrito', () => {
  it('não aceita number como valor', () => {
    expect(() => add(0.1 as unknown as string)).toThrow()
  })

  it('rejeita string que não é número', () => {
    expect(() => formatMoney('abc', 'tc')).toThrow()
  })
})
