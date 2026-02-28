<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, type CSSProperties, watch } from 'vue'

interface Props {
  label: string
  options: Array<string | number>
  selected: Array<string | number>
  compact: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  change: [value: Array<string | number>]
}>()

const open = ref(false)
const rootRef = ref<HTMLElement | null>(null)
const triggerRef = ref<HTMLElement | null>(null)
const dropdownRef = ref<HTMLElement | null>(null)
const dropdownStyle = ref<CSSProperties>({})

const DROPDOWN_MARGIN = 8
const DROPDOWN_OFFSET = 4
const DROPDOWN_MAX_HEIGHT = 320
const DROPDOWN_MIN_HEIGHT = 96

const active = computed(() => props.selected.length > 0)

const toggle = (option: string | number) => {
  if (props.selected.includes(option)) {
    emit(
      'change',
      props.selected.filter(item => item !== option),
    )
    return
  }

  emit('change', [...props.selected, option])
}

const closeOnOutsideClick = (event: MouseEvent) => {
  const targetNode = event.target as Node
  if (rootRef.value?.contains(targetNode) || dropdownRef.value?.contains(targetNode)) {
    return
  }
  if (rootRef.value && !rootRef.value.contains(targetNode)) {
    open.value = false
  }
}

const updateDropdownPosition = () => {
  if (!open.value || !triggerRef.value) return

  const rect = triggerRef.value.getBoundingClientRect()
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  const minWidth = Math.max(rect.width, props.compact ? 120 : 100)
  const preferredHeight = Math.min(
    DROPDOWN_MAX_HEIGHT,
    Math.max(DROPDOWN_MIN_HEIGHT, dropdownRef.value?.scrollHeight ?? DROPDOWN_MAX_HEIGHT),
  )

  const spaceBelow = viewportHeight - rect.bottom - DROPDOWN_MARGIN - DROPDOWN_OFFSET
  const spaceAbove = rect.top - DROPDOWN_MARGIN - DROPDOWN_OFFSET
  const canFitBelow = spaceBelow >= preferredHeight
  const canFitAbove = spaceAbove >= preferredHeight
  const shouldOpenUpward = !canFitBelow && (canFitAbove || spaceAbove > spaceBelow)
  const availableHeight = Math.max(
    DROPDOWN_MIN_HEIGHT,
    Math.min(viewportHeight - DROPDOWN_MARGIN * 2, shouldOpenUpward ? spaceAbove : spaceBelow),
  )
  const maxHeight = Math.min(preferredHeight, availableHeight)


  let left = rect.left
  left = Math.max(DROPDOWN_MARGIN, Math.min(left, viewportWidth - minWidth - DROPDOWN_MARGIN))

  const top = shouldOpenUpward
    ? Math.max(DROPDOWN_MARGIN, rect.top - maxHeight - DROPDOWN_OFFSET)
    : Math.min(viewportHeight - maxHeight - DROPDOWN_MARGIN, rect.bottom + DROPDOWN_OFFSET)

  dropdownStyle.value = {
    position: 'fixed',
    top: `${top}px`,
    left: `${left}px`,
    zIndex: 5000,
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    padding: '0.4rem 0',
    minWidth: `${minWidth}px`,
    maxHeight: `${maxHeight}px`,
    overflowY: 'auto',
    boxShadow: '0 8px 20px rgba(0,0,0,0.5)',
  }
}

const toggleOpen = async () => {
  open.value = !open.value
  if (open.value) {
    await nextTick()
    updateDropdownPosition()
  }
}

watch(open, value => {
  if (value) {
    window.addEventListener('resize', updateDropdownPosition)
    window.addEventListener('scroll', updateDropdownPosition, true)
  } else {
    window.removeEventListener('resize', updateDropdownPosition)
    window.removeEventListener('scroll', updateDropdownPosition, true)
  }
})

onMounted(() => {
  document.addEventListener('mousedown', closeOnOutsideClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', closeOnOutsideClick)
  window.removeEventListener('resize', updateDropdownPosition)
  window.removeEventListener('scroll', updateDropdownPosition, true)
})
</script>

<template>
  <div ref="rootRef" :style="{ position: 'relative', display: 'inline-block' }">
    <button
      ref="triggerRef"
      :style="{
        fontSize: '0.95rem',
        padding: compact ? '0.55rem 0.95rem' : '0.45rem 0.9rem',
        minHeight: compact ? '2.6rem' : '2.25rem',
        lineHeight: '1.2',
        borderRadius: '6px',
        border: `1px solid ${active ? 'var(--accent-base)' : 'var(--border-color)'}`,
        backgroundColor: active ? 'rgba(16,185,129,0.15)' : 'var(--bg-dark)',
        color: active ? 'var(--accent-base)' : 'var(--text-secondary)',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }"
      @click.stop="toggleOpen"
    >
      {{ label }}{{ active ? ` (${selected.length})` : ' ▾' }}
    </button>

    <Teleport to="body">
      <div
        v-if="open"
        ref="dropdownRef"
        :style="dropdownStyle"
      >
        <label
          v-for="option in options"
          :key="String(option)"
          :style="{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            padding: compact ? '0.62rem 0.85rem' : '0.52rem 0.85rem',
            cursor: 'pointer',
            color: 'var(--text-primary)',
            fontSize: '1.05rem',
            userSelect: 'none',
          }"
        >
          <input
            type="checkbox"
            :checked="selected.includes(option)"
            :style="{ accentColor: 'var(--accent-base)', width: compact ? '1.25rem' : '1.1rem', height: compact ? '1.25rem' : '1.1rem' }"
            @change="toggle(option)"
          />
          {{ String(option) }}
        </label>

        <div
          v-if="selected.length > 0"
          :style="{
            padding: '0.3rem 0.75rem',
            borderTop: '1px solid var(--border-color)',
            fontSize: '0.75rem',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            textAlign: 'center',
          }"
          @click="emit('change', [])"
        >
          クリア
        </div>
      </div>
    </Teleport>
  </div>
</template>
