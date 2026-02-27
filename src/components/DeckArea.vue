<script setup lang="ts">
import { computed, ref, type CSSProperties } from 'vue'

interface Props {
  deck: string[]
  isExpanded: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  remove: [index: number]
  clear: []
  toggle: []
}>()

const PREVIEW_WIDTH = 315
const PREVIEW_OFFSET = 16
const BASE_URL = import.meta.env.BASE_URL

const hoveredIndex = ref<number | null>(null)
const mousePos = ref<{ x: number; y: number } | null>(null)
const copied = ref(false)

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
  const x = overflowsRight
    ? mousePos.value.x - PREVIEW_WIDTH - PREVIEW_OFFSET
    : mousePos.value.x + PREVIEW_OFFSET
  const y = Math.min(mousePos.value.y - 20, window.innerHeight - 300)

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
</script>

<template>
  <div
    class="glass-panel"
    :style="{
      padding: '0.7rem 1.2rem',
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
        marginBottom: isExpanded ? '1rem' : '0',
        transition: 'all 0.3s ease',
        flexShrink: 0,
      }"
    >
      <div
        :style="{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }"
        @click="emit('toggle')"
      >
        <div :style="{ display: 'flex', alignItems: 'center', gap: '0.5rem' }">
          <span :style="{ transform: `rotate(${isExpanded ? 0 : -90}deg)`, transition: 'transform 0.2s' }">▼</span>
          <span>Deck ({{ filledCount }} / 20)</span>
        </div>
        <div
          :style="{ display: 'flex', alignItems: 'center', gap: '0.75rem' }"
          @click.stop
        >
          <button
            :style="{
              fontSize: '0.85rem',
              padding: '0.3rem 0.7rem',
              backgroundColor: 'transparent',
              border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)',
              borderRadius: '6px',
              cursor: 'pointer',
            }"
            @click="handleCopy"
          >
            {{ copied ? 'コピーしました！' : 'URLをコピー' }}
          </button>
          <button
            :disabled="filledCount === 0"
            :style="{
              fontSize: '0.85rem',
              padding: '0.3rem 0.7rem',
              backgroundColor: 'transparent',
              border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)',
              borderRadius: '6px',
              cursor: filledCount > 0 ? 'pointer' : 'default',
              opacity: filledCount > 0 ? 1 : 0.35,
            }"
            @click="emit('clear')"
          >
            全クリア
          </button>
        </div>
      </div>
    </h2>

    <div
      v-if="isExpanded"
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
          gridTemplateColumns: 'repeat(10, 1fr)',
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
          @click="cardId && emit('remove', index)"
          @pointerdown="event => cardId && showPreview(index, event as PointerEvent)"
          @pointermove="event => movePreview(event as PointerEvent)"
          @pointerup="hidePreview"
          @pointercancel="hidePreview"
          @pointerleave="hidePreview"
        >
          <img
            v-if="cardId"
            :src="getImageUrl('sc', cardId)"
            :alt="cardId"
            :style="{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: '3px',
              display: 'block',
            }"
          />
          <span v-else>{{ index + 1 }}</span>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <img
        v-if="hoveredCardId && mousePos"
        :src="getImageUrl('lc', hoveredCardId)"
        :alt="hoveredCardId"
        :style="getPreviewStyle()"
      />
    </Teleport>
  </div>
</template>
