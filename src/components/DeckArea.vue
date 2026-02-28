<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, type CSSProperties } from 'vue'

interface Props {
  deck: string[]
  isExpanded: boolean
  compact: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  remove: [index: number]
  clear: []
  toggle: []
}>()

const PREVIEW_WIDTH = 315
const PREVIEW_OFFSET = 16
const PREVIEW_MARGIN = 12
const PREVIEW_ASPECT_RATIO = 88 / 63
const PREVIEW_HEIGHT = PREVIEW_WIDTH * PREVIEW_ASPECT_RATIO
const LONG_PRESS_MS = 380
const MOVE_CANCEL_PX = 12
const BASE_URL = import.meta.env.BASE_URL
const INFO_POPUP_WIDTH = 420
const INFO_POPUP_MAX_HEIGHT = 420
const INFO_POPUP_MARGIN = 12
const INFO_POPUP_OFFSET = 8

const hoveredIndex = ref<number | null>(null)
const mousePos = ref<{ x: number; y: number } | null>(null)
const longPressTimer = ref<number | null>(null)
const longPressTriggered = ref(false)
const pointerStart = ref<{ x: number; y: number } | null>(null)
const suppressTap = ref(false)
const copied = ref(false)
const infoOpen = ref(false)
const infoButtonRef = ref<HTMLElement | null>(null)
const infoPopupStyle = ref<CSSProperties>({})

const filledCount = computed(() => props.deck.filter(Boolean).length)
const hoveredCardId = computed(() => (hoveredIndex.value !== null ? props.deck[hoveredIndex.value] : null))

const handleCopy = async () => {
  try {
    await navigator.clipboard.writeText(window.location.href)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (error) {
    console.error('Failed to copy: ', error)
  }
}

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

const getImageUrl = (size: 'sc' | 'lc', cardId: string) => `${BASE_URL}img/${size}/${cardId}.jpg`

const showPreview = (index: number, event: PointerEvent) => {
  hoveredIndex.value = index
  mousePos.value = { x: event.clientX, y: event.clientY }
}

const movePreview = (event: PointerEvent) => {
  if (hoveredIndex.value === null) return
  mousePos.value = { x: event.clientX, y: event.clientY }
}

const hidePreview = () => {
  hoveredIndex.value = null
  mousePos.value = null
}

const clearLongPressTimer = () => {
  if (longPressTimer.value !== null) {
    window.clearTimeout(longPressTimer.value)
    longPressTimer.value = null
  }
}

const startLongPressPreview = (index: number, event: PointerEvent) => {
  if (!props.compact || event.pointerType === 'mouse') {
    showPreview(index, event)
    return
  }

  suppressTap.value = false
  longPressTriggered.value = false
  pointerStart.value = { x: event.clientX, y: event.clientY }
  clearLongPressTimer()
  longPressTimer.value = window.setTimeout(() => {
    longPressTriggered.value = true
    hoveredIndex.value = index
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

const handleDeckSlotClick = (cardId: string, index: number) => {
  if (!cardId) return
  if (props.compact && suppressTap.value) {
    suppressTap.value = false
    return
  }
  emit('remove', index)
}

const updateInfoPopupPosition = () => {
  if (!infoOpen.value || !infoButtonRef.value) return

  const rect = infoButtonRef.value.getBoundingClientRect()
  const popupWidth = Math.min(INFO_POPUP_WIDTH, window.innerWidth * 0.85)
  const popupMaxHeight = Math.min(INFO_POPUP_MAX_HEIGHT, window.innerHeight * 0.7)

  let left = rect.right - popupWidth
  left = Math.max(INFO_POPUP_MARGIN, Math.min(left, window.innerWidth - popupWidth - INFO_POPUP_MARGIN))

  let top = rect.bottom + INFO_POPUP_OFFSET
  if (top + popupMaxHeight > window.innerHeight - INFO_POPUP_MARGIN) {
    top = Math.max(INFO_POPUP_MARGIN, rect.top - popupMaxHeight - INFO_POPUP_OFFSET)
  }

  infoPopupStyle.value = {
    position: 'fixed',
    top: `${top}px`,
    left: `${left}px`,
    width: `${popupWidth}px`,
    maxHeight: `${popupMaxHeight}px`,
    overflowY: 'auto',
    zIndex: 6000,
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    borderRadius: '10px',
    padding: '0.9rem 1rem',
    boxShadow: '0 8px 20px rgba(0,0,0,0.5)',
    color: 'var(--text-primary)',
  }
}

const toggleInfoPopup = () => {
  infoOpen.value = !infoOpen.value
  if (infoOpen.value) {
    updateInfoPopupPosition()
  }
}

onMounted(() => {
  window.addEventListener('resize', updateInfoPopupPosition)
  window.addEventListener('scroll', updateInfoPopupPosition, true)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateInfoPopupPosition)
  window.removeEventListener('scroll', updateInfoPopupPosition, true)
  clearLongPressTimer()
})
</script>

<template>
  <div
    class="glass-panel"
    :style="{
      padding: compact ? '0.6rem 0.8rem' : '0.7rem 1.2rem',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      height: '100%',
      maxHeight: '100%',
    }"
  >
    <h2
      :style="{
        textAlign: 'left',
        marginTop: 0,
        borderBottom: isExpanded ? '1px solid var(--border-color)' : 'none',
        paddingBottom: isExpanded ? '0.5rem' : '0',
        marginBottom: isExpanded ? (compact ? '0.75rem' : '1rem') : '0',
        transition: 'all 0.3s ease',
        flexShrink: 0,
      }"
    >
      <div
        :style="{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', flexWrap: 'wrap', rowGap: '0.5rem' }"
        @click="emit('toggle')"
      >
        <div :style="{ display: 'flex', alignItems: 'center', gap: '0.5rem' }">
          <span :style="{ transform: `rotate(${isExpanded ? 0 : -90}deg)`, transition: 'transform 0.2s', fontSize: '1.1rem' }">▼</span>
          <span :style="{ fontSize: compact ? '1.2rem' : '1.5rem', fontWeight: 700 }">デッキ</span>
          <span :style="{ fontSize: '0.95rem', color: 'var(--text-secondary)' }">({{ filledCount }})</span>
        </div>
        <div
          :style="{ display: 'flex', alignItems: 'center', gap: compact ? '0.45rem' : '0.75rem', flexWrap: 'wrap', marginLeft: compact ? 0 : 'auto' }"
          @click.stop
        >
          <div>
            <button
              ref="infoButtonRef"
              :style="{
                width: compact ? '2.6rem' : '2.25rem',
                height: compact ? '2.6rem' : '2.25rem',
                minHeight: compact ? '2.6rem' : '2.25rem',
                lineHeight: '1',
                borderRadius: '999px',
                backgroundColor: infoOpen ? 'rgba(16,185,129,0.15)' : 'var(--bg-dark)',
                border: '1px solid var(--border-color)',
                color: infoOpen ? 'var(--accent-base)' : 'var(--text-secondary)',
                fontSize: '1rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }"
              aria-label="このサイトについて"
              title="このサイトについて"
              @click="toggleInfoPopup"
            >
              ?
            </button>
          </div>

          <button
            :style="{
              fontSize: '0.95rem',
              padding: compact ? '0.55rem 0.95rem' : '0.45rem 0.9rem',
              minHeight: compact ? '2.6rem' : '2.25rem',
              lineHeight: '1.2',
              backgroundColor: copied ? 'rgba(16,185,129,0.15)' : 'var(--bg-dark)',
              border: '1px solid var(--border-color)',
              color: copied ? 'var(--accent-base)' : 'var(--text-primary)',
              borderRadius: '6px',
              cursor: 'pointer',
            }"
            @click="handleCopy"
          >
            {{ copied ? 'コピーしました！' : 'URLコピー' }}
          </button>
          <button
            :disabled="filledCount === 0"
            :style="{
              fontSize: '0.95rem',
              padding: compact ? '0.55rem 0.95rem' : '0.45rem 0.9rem',
              minHeight: compact ? '2.6rem' : '2.25rem',
              lineHeight: '1.2',
              backgroundColor: 'var(--bg-dark)',
              border: '1px solid var(--border-color)',
              color: filledCount > 0 ? 'var(--text-primary)' : 'var(--text-secondary)',
              borderRadius: '6px',
              cursor: filledCount > 0 ? 'pointer' : 'default',
              opacity: filledCount > 0 ? 1 : 0.45,
            }"
            @click="emit('clear')"
          >
            クリア
          </button>
        </div>
      </div>
    </h2>

    <div
      v-if="isExpanded"
      class="fancy-scroll"
      :style="{
        flex: 1,
        overflowY: 'auto',
        scrollbarWidth: 'thin',
        marginTop: '0.5rem',
        paddingRight: '0.25rem',
      }"
    >
      <div
        :style="{
          display: 'grid',
          gridTemplateColumns: compact ? 'repeat(5, minmax(0, 1fr))' : 'repeat(10, 1fr)',
          gap: '0.5rem',
          paddingBottom: '0.5rem',
        }"
      >
        <div
          v-for="(cardId, index) in deck"
          :key="index"
          :class="cardId ? 'card-item' : ''"
          :style="{
            aspectRatio: '63/88',
            backgroundColor: cardId ? 'transparent' : 'rgba(0,0,0,0.2)',
            border: '1px solid var(--border-color)',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.8rem',
            color: 'var(--text-secondary)',
            cursor: cardId ? 'pointer' : 'default',
            position: 'relative',
          }"
          @click="handleDeckSlotClick(cardId, index)"
          @pointerdown="event => cardId && startLongPressPreview(index, event as PointerEvent)"
          @pointermove="event => updateLongPressPreview(event as PointerEvent)"
          @pointerup="event => endLongPressPreview(event as PointerEvent)"
          @pointercancel="event => endLongPressPreview(event as PointerEvent)"
          @pointerleave="event => endLongPressPreview(event as PointerEvent)"
          @contextmenu.prevent
        >
          <img
            v-if="cardId"
            class="no-drag-image"
            :src="getImageUrl('sc', cardId)"
            :alt="cardId"
            draggable="false"
            :style="{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: '3px',
              userSelect: 'none',
              display: 'block',
            }"
          />
          <span v-else>{{ index + 1 }}</span>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="infoOpen"
        :style="infoPopupStyle"
      >
        <div :style="{ fontSize: '0.92rem', color: 'var(--text-secondary)', marginBottom: '0.45rem' }">※ 習作。鋭意開発中です。画像は今のところ4弾まで追加済</div>
        <div :style="{ borderTop: '1px solid var(--border-color)', marginBottom: '0.6rem' }"></div>

        <div :style="{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.45rem' }">1. このサイトについて</div>
        <ul :style="{ margin: 0, paddingLeft: '1.1rem', display: 'grid', gap: '0.35rem', fontSize: '0.92rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }">
          <li>蟲神器の「デッキ」をURLとして共有できます。URLなので、ブラウザのブックマークでも保存できます。</li>
          <li>各パネルは折り畳めます。表示環境次第でレイアウトが崩れる可能性があります。</li>
          <li>PCからであれば、右クリックでカードを追加せず拡大表示できます。</li>
        </ul>

        <div :style="{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.45rem' }">2. 表示画像について</div>
        <ul :style="{ margin: 0, paddingLeft: '1.1rem', display: 'grid', gap: '0.35rem', fontSize: '0.92rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }">
          <li>私物のスキャン画像を使用しています。画質が悪かったり、古いテキストだったり、プロモ版だったりしますが、気にしないでください。</li>
          <li>公式に怒られたら閉鎖します。</li>
        </ul>

        <div :style="{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.45rem' }">3. 連絡先</div>
        <ul :style="{ margin: 0, paddingLeft: '1.1rem', display: 'grid', gap: '0.35rem', fontSize: '0.92rem', color: 'var(--text-secondary)' }">
          <li>
            <a
              href="https://x.com/takuwan_takusan"
              target="_blank"
              rel="noopener noreferrer"
              :style="{ color: 'var(--accent-base)' }"
            >
              https://x.com/takuwan_takusan
            </a>
          </li>
        </ul>
      </div>

      <img
        v-if="hoveredCardId && mousePos"
        class="no-drag-image"
        :src="getImageUrl('lc', hoveredCardId)"
        :alt="hoveredCardId"
        draggable="false"
        :style="getPreviewStyle()"
      />
    </Teleport>
  </div>
</template>
