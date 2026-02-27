<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

interface Props {
  label: string
  options: Array<string | number>
  selected: Array<string | number>
}

const props = defineProps<Props>()

const emit = defineEmits<{
  change: [value: Array<string | number>]
}>()

const open = ref(false)
const rootRef = ref<HTMLElement | null>(null)

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
  if (rootRef.value && !rootRef.value.contains(event.target as Node)) {
    open.value = false
  }
}

onMounted(() => {
  document.addEventListener('mousedown', closeOnOutsideClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', closeOnOutsideClick)
})
</script>

<template>
  <div ref="rootRef" :style="{ position: 'relative', display: 'inline-block' }">
    <button
      :style="{
        fontSize: '0.95rem',
        padding: '0.45rem 0.9rem',
        borderRadius: '6px',
        border: `1px solid ${active ? 'var(--accent-base)' : 'var(--border-color)'}`,
        backgroundColor: active ? 'rgba(16,185,129,0.15)' : 'var(--bg-dark)',
        color: active ? 'var(--accent-base)' : 'var(--text-secondary)',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }"
      @click.stop="open = !open"
    >
      {{ label }}{{ active ? ` (${selected.length})` : ' ▾' }}
    </button>

    <div
      v-if="open"
      :style="{
        position: 'absolute',
        top: 'calc(100% + 4px)',
        left: 0,
        zIndex: 5000,
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        padding: '0.4rem 0',
        minWidth: '100px',
        boxShadow: '0 8px 20px rgba(0,0,0,0.5)',
      }"
    >
      <label
        v-for="option in options"
        :key="String(option)"
        :style="{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.35rem 0.75rem',
          cursor: 'pointer',
          color: 'var(--text-primary)',
          fontSize: '0.85rem',
          userSelect: 'none',
        }"
      >
        <input
          type="checkbox"
          :checked="selected.includes(option)"
          :style="{ accentColor: 'var(--accent-base)' }"
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
  </div>
</template>
