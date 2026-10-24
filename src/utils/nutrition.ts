/**
 * Formata um valor numérico bruto de horário para o formato HH:mm
 * Ex: 6 -> "06:00", 630 -> "06:30", 23 -> "23:00", 2230 -> "22:30"
 */
export function formatTimeInput(val: string): string {
  // Mantém apenas dígitos
  const digits = val.replace(/\D/g, '')
  if (!digits) return ''

  if (digits.length === 1) {
    return `0${digits}:00`
  }
  if (digits.length === 2) {
    const num = parseInt(digits, 10)
    if (num >= 0 && num <= 23) {
      return `${digits.padStart(2, '0')}:00`
    }
    // Se for maior que 23, ex: 85 -> 08:05
    return `0${digits[0]}:0${digits[1]}`
  }
  if (digits.length === 3) {
    // Ex: 630 -> 06:30
    const h = digits[0].padStart(2, '0')
    const m = digits.slice(1)
    return `${h}:${m}`
  }
  if (digits.length >= 4) {
    // Ex: 2230 -> 22:30
    const h = digits.slice(0, 2)
    const m = digits.slice(2, 4)
    return `${h}:${m}`
  }

  return val
}

/**
 * Formata telefone/whatsapp para o padrão (99) 99999-9999 ou (99) 9999-9999
 */
export function formatPhone(val: string): string {
  const digits = val.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) return digits ? `(${digits}` : ''
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`
}

/**
 * Converte qualquer valor de data (Date, ISO string, ou string JS Date) para o formato YYYY-MM-DD
 */
export function toISODateString(val: any): string {
  if (!val) return ''
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return ''
    const year = val.getFullYear()
    const month = String(val.getMonth() + 1).padStart(2, '0')
    const day = String(val.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  const str = String(val).trim()
  if (!str) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str
  if (str.includes('T')) return str.split('T')[0]
  const d = new Date(str)
  if (!isNaN(d.getTime())) {
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  return ''
}

/**
 * Calcula idade a partir da data de nascimento no formato YYYY-MM-DD, ISO ou objeto Date
 */
export function calculateAge(birthDateVal: Date | string | null | undefined): number | null {
  if (!birthDateVal) return null
  try {
    let birthDate: Date

    if (birthDateVal instanceof Date) {
      birthDate = birthDateVal
    } else {
      const cleanStr = String(birthDateVal).split('T')[0]
      const parts = cleanStr.split('-')
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10)
        const month = parseInt(parts[1], 10) - 1
        const day = parseInt(parts[2], 10)
        birthDate = new Date(year, month, day)
      } else {
        birthDate = new Date(birthDateVal)
      }
    }

    if (isNaN(birthDate.getTime())) return null

    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const m = today.getMonth() - birthDate.getMonth()

    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age >= 0 ? age : null
  } catch {
    return null
  }
}

/**
 * Calcula o IMC e classificação
 * peso em kg, altura em cm
 */
export function calculateIMC(pesoKg: number | string, alturaCm: number | string): {
  imc: number | null
  classificacao: string
  cor: string
} {
  const peso = typeof pesoKg === 'string' ? parseFloat(pesoKg.replace(',', '.')) : pesoKg
  const altura = typeof alturaCm === 'string' ? parseFloat(alturaCm.replace(',', '.')) : alturaCm

  if (!peso || !altura || peso <= 0 || altura <= 0) {
    return { imc: null, classificacao: '', cor: 'text-slate-500' }
  }

  // Altura em metros
  const alturaM = altura > 3 ? altura / 100 : altura
  const imcVal = Number((peso / (alturaM * alturaM)).toFixed(2))

  if (isNaN(imcVal) || imcVal <= 0 || !isFinite(imcVal)) {
    return { imc: null, classificacao: '', cor: 'text-slate-500' }
  }

  let classificacao = ''
  let cor = 'text-emerald-700 bg-emerald-50 border-emerald-200'

  if (imcVal < 18.5) {
    classificacao = 'Abaixo do peso'
    cor = 'text-amber-700 bg-amber-50 border-amber-200'
  } else if (imcVal < 25) {
    classificacao = 'Peso normal'
    cor = 'text-emerald-700 bg-emerald-50 border-emerald-200'
  } else if (imcVal < 30) {
    classificacao = 'Sobrepeso'
    cor = 'text-amber-700 bg-amber-50 border-amber-200'
  } else if (imcVal < 35) {
    classificacao = 'Obesidade Grau I'
    cor = 'text-orange-700 bg-orange-50 border-orange-200'
  } else if (imcVal < 40) {
    classificacao = 'Obesidade Grau II'
    cor = 'text-red-700 bg-red-50 border-red-200'
  } else {
    classificacao = 'Obesidade Grau III'
    cor = 'text-red-800 bg-red-100 border-red-300'
  }

  return { imc: imcVal, classificacao, cor }
}

/**
 * Formata data no padrão brasileiro dd/mm/aaaa
 * Suporta instâncias de Date, strings ISO e strings no formato YYYY-MM-DD
 */
export function formatDateBR(dateVal?: Date | string | null): string {
  if (!dateVal) return '-'
  try {
    if (dateVal instanceof Date) {
      if (isNaN(dateVal.getTime())) return '-'
      return dateVal.toLocaleDateString('pt-BR', { timeZone: 'UTC' })
    }

    const str = String(dateVal).trim()
    if (!str) return '-'

    const datePart = str.split('T')[0]
    const parts = datePart.split('-')
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`
    }

    const d = new Date(str)
    return isNaN(d.getTime()) ? str : d.toLocaleDateString('pt-BR')
  } catch {
    return String(dateVal || '-')
  }
}
