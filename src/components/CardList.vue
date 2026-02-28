<script setup lang="ts">
import { computed, onBeforeUnmount, ref, type CSSProperties } from 'vue'
import MultiSelect from './MultiSelect.vue'
import { type CardMeta, normalizedCards } from '../utils/cardMeta'

interface Props {
  isExpanded: boolean
  compact: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  add: [cardId: string]
  toggle: []
}>()

interface Filters {
  colors: string[]
  types: string[]
  rarelities: string[]
  costs: number[]
  sets: string[]
}

const PREVIEW_WIDTH = 315
const PREVIEW_OFFSET = 16
const PREVIEW_MARGIN = 12
const PREVIEW_ASPECT_RATIO = 88 / 63
const PREVIEW_HEIGHT = PREVIEW_WIDTH * PREVIEW_ASPECT_RATIO
const LONG_PRESS_MS = 380
const MOVE_CANCEL_PX = 12
const BASE_URL = import.meta.env.BASE_URL

const cards = ref<CardMeta[]>(normalizedCards)
const hoveredCard = ref<string | null>(null)
const mousePos = ref<{ x: number; y: number } | null>(null)
const longPressTimer = ref<number | null>(null)
const longPressTriggered = ref(false)
const pointerStart = ref<{ x: number; y: number } | null>(null)
const suppressTap = ref(false)
const filters = ref<Filters>({
  colors: [],
  types: [],
  rarelities: [],
  costs: [],
  sets: [],
})

const setFilter = (key: keyof Filters, value: Array<string | number>) => {
  filters.value = {
    ...filters.value,
    [key]: value,
  } as Filters
}

const filteredCards = computed(() =>
  cards.value.filter(card => {
    if (filters.value.colors.length > 0 && !filters.value.colors.includes(card.color)) return false
    if (
      filters.value.types.length > 0 &&
      !filters.value.types.some(type => card.types.includes(type as '虫' | '術' | '強化'))
    )
      return false
    if (filters.value.rarelities.length > 0 && !filters.value.rarelities.includes(card.rarelity)) return false
    if (filters.value.costs.length > 0 && !filters.value.costs.includes(card.cost)) return false
    if (filters.value.sets.length > 0 && !filters.value.sets.includes(card.set)) return false
    return true
  }),
)

const getPreviewStyle = (): CSSProperties => {
  if (!mousePos.value) return {}

  const overflowsRight = mousePos.value.x + PREVIEW_OFFSET + PREVIEW_WIDTH > window.innerWidth
  const rawX = overflowsRight
    ? mousePos.value.x - PREVIEW_WIDTH - PREVIEW_OFFSET
    : mousePos.value.x + PREVIEW_OFFSET
  const x = Math.max(PREVIEW_MARGIN, Math.min(rawX, window.innerWidth - PREVIEW_WIDTH - PREVIEW_MARGIN))
  const rawY = mousePos.value.y - 20
  const y = Math.max(PREVIEW_MARGIN, Math.min(rawY, window.innerHeight - PREVIEW_HEIGHT - PREVIEW_MARGIN))

  return {
    position: 'fixed',
    left: `${x}px`,
    top: `${y}px`,
    width: `${PREVIEW_WIDTH}px`,
    zIndex: 9999,
    pointerEvents: 'none' as const,
    borderRadius: '8px',
    border: '2px solid var(--accent-base)',
    boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
  }
}

const activeFilterCount = computed(
  () =>
    filters.value.colors.length +
    filters.value.types.length +
    filters.value.rarelities.length +
    filters.value.costs.length +
    filters.value.sets.length,
)

const resetFilters = () => {
  filters.value = {
    colors: [],
    types: [],
    rarelities: [],
    costs: [],
    sets: [],
  }
}

const onCardImageError = (event: Event, cardId: string) => {
  const image = event.target as HTMLImageElement
  image.style.display = 'none'
  const parent = image.parentElement
  if (!parent) return
  parent.innerText = cardId
  parent.style.display = 'flex'
  parent.style.alignItems = 'center'
  parent.style.justifyContent = 'center'
  parent.style.color = 'var(--text-secondary)'
  parent.style.fontSize = '0.8rem'
}

const getImageUrl = (size: 'sc' | 'lc', cardId: string) => `${BASE_URL}img/${size}/${cardId}.jpg`

const showPreview = (cardId: string, event: PointerEvent) => {
  hoveredCard.value = cardId
  mousePos.value = { x: event.clientX, y: event.clientY }
}

const movePreview = (event: PointerEvent) => {
  if (!hoveredCard.value) return
  mousePos.value = { x: event.clientX, y: event.clientY }
}

const hidePreview = () => {
  hoveredCard.value = null
  mousePos.value = null
}

const clearLongPressTimer = () => {
  if (longPressTimer.value !== null) {
    window.clearTimeout(longPressTimer.value)
    longPressTimer.value = null
  }
}

const startLongPressPreview = (cardId: string, event: PointerEvent) => {
  if (!props.compact || event.pointerType === 'mouse') {
    showPreview(cardId, event)
    return
  }

  suppressTap.value = false
  longPressTriggered.value = false
  pointerStart.value = { x: event.clientX, y: event.clientY }
  clearLongPressTimer()
  longPressTimer.value = window.setTimeout(() => {
    longPressTriggered.value = true
    hoveredCard.value = cardId
    mousePos.value = { x: event.clientX, y: event.clientY }
  }, LONG_PRESS_MS)
}

const updateLongPressPreview = (event: PointerEvent) => {
  if (!props.compact || event.pointerType === 'mouse') {
    movePreview(event)
    return
  }

  if (!pointerStart.value) return

  const movedX = Math.abs(event.clientX - pointerStart.value.x)
  const movedY = Math.abs(event.clientY - pointerStart.value.y)
  if (movedX > MOVE_CANCEL_PX || movedY > MOVE_CANCEL_PX) {
    clearLongPressTimer()
    if (longPressTriggered.value) {
      suppressTap.value = true
      hidePreview()
      longPressTriggered.value = false
    }
    pointerStart.value = null
    return
  }

  if (longPressTriggered.value) {
    movePreview(event)
  }
}

const endLongPressPreview = (event: PointerEvent) => {
  if (!props.compact || event.pointerType === 'mouse') {
    hidePreview()
    return
  }

  clearLongPressTimer()
  if (longPressTriggered.value) {
    suppressTap.value = true
  }
  longPressTriggered.value = false
  pointerStart.value = null
  hidePreview()
}

const handleCardClick = (cardId: string) => {
  if (props.compact && suppressTap.value) {
    suppressTap.value = false
    return
  }
  emit('add', cardId)
}

onBeforeUnmount(() => {
  clearLongPressTimer()
})
</script>

<template>
  <div
    class="glass-panel"
    :style="{
      flex: isExpanded ? 1 : '0 0 auto',
      minHeight: isExpanded ? 0 : 'auto',
      marginTop: '4px',
      transition: 'flex 0.3s ease',
      padding: compact ? '0.6rem 0.8rem' : '0.7rem 1.2rem',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }"
  >
    <div
      :style="{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '0.5rem',
        borderBottom: isExpanded ? '1px solid var(--border-color)' : 'none',
        paddingBottom: isExpanded ? '0.75rem' : '0',
        marginBottom: isExpanded ? '0.75rem' : '0',
        flexWrap: 'wrap',
        flexShrink: 0,
        cursor: 'pointer',
      }"
      @click="emit('toggle')"
    >
      <div
        :style="{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginRight: '0.25rem' }"
      >
        <span :style="{ transform: `rotate(${isExpanded ? 0 : -90}deg)`, transition: 'transform 0.2s', fontSize: '1.1rem' }">▼</span>
        <h2 :style="{ margin: 0, fontSize: compact ? '1.2rem' : '1.5rem', fontWeight: 700 }">カード・ライブラリ</h2>
        <span :style="{ fontSize: '0.95rem', color: 'var(--text-secondary)' }">({{ filteredCards.length }})</span>
      </div>

      <div
        v-if="isExpanded"
        :style="{ marginLeft: compact ? 0 : 'auto', display: 'flex', gap: compact ? '0.4rem' : '0.5rem', alignItems: 'center', flexWrap: 'wrap' }"
        @click.stop
      >
        <MultiSelect
          label="セット"
          :options="['01', '02', '03', '04', '05', '06', '07']"
          :selected="filters.sets"
          :compact="compact"
          @change="value => setFilter('sets', value)"
        />
        <MultiSelect
          label="色"
          :options="['赤', '青', '緑', '無']"
          :selected="filters.colors"
          :compact="compact"
          @change="value => setFilter('colors', value)"
        />
        <MultiSelect
          label="種類"
          :options="['虫', '術', '強化']"
          :selected="filters.types"
          :compact="compact"
          @change="value => setFilter('types', value)"
        />
        <MultiSelect
          label="レア"
          :options="['LR', 'UR', 'SR', 'R', 'N']"
          :selected="filters.rarelities"
          :compact="compact"
          @change="value => setFilter('rarelities', value)"
        />
        <MultiSelect
          label="コスト"
          :options="[0, 1, 2, 3, 4, 5, 6]"
          :selected="filters.costs"
          :compact="compact"
          @change="value => setFilter('costs', value)"
        />
        <button
          :disabled="activeFilterCount === 0"
          :style="{
            fontSize: '0.95rem',
            padding: compact ? '0.55rem 0.95rem' : '0.45rem 0.9rem',
            minHeight: compact ? '2.6rem' : '2.25rem',
            lineHeight: '1.2',
            backgroundColor: 'var(--bg-dark)',
            border: '1px solid var(--border-color)',
            color: activeFilterCount > 0 ? 'var(--text-primary)' : 'var(--text-secondary)',
            borderRadius: '6px',
            cursor: activeFilterCount > 0 ? 'pointer' : 'default',
            opacity: activeFilterCount > 0 ? 1 : 0.45,
          }"
          @click="resetFilters"
        >
          クリア
        </button>
      </div>
    </div>

    <div
      v-if="isExpanded"
      :style="{
        flex: 1,
        overflowY: 'auto',
        scrollbarWidth: 'thin',
      }"
    >
      <div
        :style="{
          display: 'grid',
          gridTemplateColumns: compact ? 'repeat(5, minmax(0, 1fr))' : 'repeat(auto-fill, minmax(105px, 1fr))',
          gridAutoRows: 'auto',
          gap: compact ? '0.6rem' : '1rem',
          padding: compact ? '0.25rem' : '0.5rem',
        }"
      >
        <div
          v-for="card in filteredCards"
          :key="card.id"
          class="card-item"
          :style="{
            aspectRatio: '63/88',
            cursor: 'pointer',
            borderRadius: '6px',
            border: '1px solid transparent',
            backgroundColor: 'var(--bg-primary)',
          }"
          @click="handleCardClick(card.id)"
          @pointerdown="event => startLongPressPreview(card.id, event as PointerEvent)"
          @pointermove="event => updateLongPressPreview(event as PointerEvent)"
          @pointerup="event => endLongPressPreview(event as PointerEvent)"
          @pointercancel="event => endLongPressPreview(event as PointerEvent)"
          @pointerleave="event => endLongPressPreview(event as PointerEvent)"
          @contextmenu.prevent
        >
          <img
            class="no-drag-image"
            :src="getImageUrl('sc', card.id)"
            :alt="card.name"
            :title="`${card.name} [${card.color}/${card.types.join('・')}/${card.rarelity}/コスト${card.cost}]`"
            :style="{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', userSelect: 'none' }"
            draggable="false"
            @error="event => onCardImageError(event, card.id)"
          />
        </div>
      </div>
    </div>

    <Teleport to="body">
      <img
        v-if="hoveredCard && mousePos"
        class="no-drag-image"
        :src="getImageUrl('lc', hoveredCard)"
        :alt="hoveredCard"
        draggable="false"
        :style="getPreviewStyle()"
      />
    </Teleport>
  </div>
</template>
