import { onMounted, ref } from 'vue'
import { cardMetaById, compareCardsForDeck } from '../utils/cardMeta'

const MAX_CARDS = 20

const getParamKey = (index: number) => `c${String(index + 1).padStart(2, '0')}`

const sortAndPad = (cards: string[]) => {
  const sorted = [...cards].sort((idA, idB) => {
    const cardA = cardMetaById.get(idA)
    const cardB = cardMetaById.get(idB)

    if (cardA && cardB) {
      return compareCardsForDeck(cardA, cardB)
    }

    if (cardA) return -1
    if (cardB) return 1

    return idA.localeCompare(idB, 'ja')
  })

  return [...sorted, ...Array(MAX_CARDS - sorted.length).fill('')]
}

const updateUrl = (newDeck: string[]) => {
  const params = new URLSearchParams(window.location.search)

  newDeck.forEach((cardId, index) => {
    const key = getParamKey(index)
    if (cardId) {
      params.set(key, cardId)
    } else {
      params.delete(key)
    }
  })

  const newSearch = params.toString()
  const newUrl = newSearch ? `${window.location.pathname}?${newSearch}` : window.location.pathname
  window.history.replaceState({}, '', newUrl)
}

export const useDeck = () => {
  const deck = ref<string[]>(Array(MAX_CARDS).fill(''))

  onMounted(() => {
    const params = new URLSearchParams(window.location.search)
    const initialDeck = Array(MAX_CARDS).fill('')
    let hasParams = false

    for (let i = 0; i < MAX_CARDS; i++) {
      const key = getParamKey(i)
      const value = params.get(key)
      if (value) {
        initialDeck[i] = value
        hasParams = true
      }
    }

    if (hasParams) {
      deck.value = initialDeck
    }
  })

  const addCard = (cardId: string) => {
    const currentCards = deck.value.filter(c => c !== '')
    if (currentCards.length >= MAX_CARDS) {
      window.alert('デッキがいっぱいです。カードを削除してから追加してください。')
      return
    }

    const cards = deck.value.filter(c => c !== '')
    if (cards.length >= MAX_CARDS) return

    const newDeck = sortAndPad([...cards, cardId])
    deck.value = newDeck
    updateUrl(newDeck)
  }

  const removeCard = (index: number) => {
    const currentCards = deck.value.filter((_, i) => i !== index && deck.value[i] !== '')
    const newDeck = sortAndPad(currentCards)
    deck.value = newDeck
    updateUrl(newDeck)
  }

  const clearDeck = () => {
    const newDeck = Array(MAX_CARDS).fill('')
    deck.value = newDeck
    updateUrl(newDeck)
  }

  return { deck, addCard, removeCard, clearDeck }
}
