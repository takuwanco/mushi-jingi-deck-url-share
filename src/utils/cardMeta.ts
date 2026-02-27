import rawCardData from '../data/cards.json'

export type CardType = '虫' | '術' | '強化'

export interface CardMeta {
  id: string
  name: string
  color: string
  cost: number
  set: string
  rarelity: string
  types: CardType[]
}

type LegacyCardMeta = Omit<CardMeta, 'types'> & {
  type?: string
  types?: string[]
}

const TYPE_PRIORITY: Record<CardType, number> = {
  虫: 0,
  術: 1,
  強化: 1,
}

const COLOR_PRIORITY: Record<string, number> = {
  赤: 0,
  青: 1,
  緑: 2,
  無: 3,
}

const RARELITY_PRIORITY: Record<string, number> = {
  UR: 0,
  LR: 1,
  SR: 2,
  R: 3,
  N: 4,
}

const normalizeTypes = (card: LegacyCardMeta): CardType[] => {
  if (Array.isArray(card.types) && card.types.length > 0) {
    return card.types.filter(
      (value): value is CardType => value === '虫' || value === '術' || value === '強化',
    )
  }

  if (!card.type) {
    return []
  }

  if (card.type === '術・強化') {
    return ['術', '強化']
  }

  if (card.type === '虫' || card.type === '術' || card.type === '強化') {
    return [card.type]
  }

  return []
}

export const normalizeCard = (card: LegacyCardMeta): CardMeta => ({
  ...card,
  types: normalizeTypes(card),
})

export const normalizedCards: CardMeta[] = (rawCardData as LegacyCardMeta[]).map(normalizeCard)

export const cardMetaById = new Map(normalizedCards.map(card => [card.id, card]))

const getGroupPriority = (card: CardMeta): number => {
  const priorities = card.types.map(type => TYPE_PRIORITY[type])
  if (priorities.length === 0) return 99
  return Math.min(...priorities)
}

export const compareCardsForDeck = (a: CardMeta, b: CardMeta): number => {
  const groupA = getGroupPriority(a)
  const groupB = getGroupPriority(b)
  if (groupA !== groupB) return groupA - groupB

  if (a.cost !== b.cost) return b.cost - a.cost

  if (groupA === 0) {
    const colorDiff = (COLOR_PRIORITY[a.color] ?? 99) - (COLOR_PRIORITY[b.color] ?? 99)
    if (colorDiff !== 0) return colorDiff
  }

  const rarelityDiff = (RARELITY_PRIORITY[a.rarelity] ?? 99) - (RARELITY_PRIORITY[b.rarelity] ?? 99)
  if (rarelityDiff !== 0) return rarelityDiff

  return a.id.localeCompare(b.id, 'ja')
}
