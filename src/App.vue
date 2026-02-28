<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import CardList from './components/CardList.vue'
import DeckArea from './components/DeckArea.vue'
import { useDeck } from './composables/useDeck'

const { deck, addCard, removeCard, clearDeck } = useDeck()
const isDeckExpanded = ref(true)
const isLibraryExpanded = ref(true)
const isCompact = ref(false)

const updateCompactLayout = () => {
  isCompact.value = window.innerWidth < 768
}

onMounted(() => {
  updateCompactLayout()
  window.addEventListener('resize', updateCompactLayout)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateCompactLayout)
})

const toggleDeck = () => {
  if (isDeckExpanded.value && !isLibraryExpanded.value) {
    isLibraryExpanded.value = true
  }
  isDeckExpanded.value = !isDeckExpanded.value
}

const toggleLibrary = () => {
  if (isLibraryExpanded.value && !isDeckExpanded.value) {
    isDeckExpanded.value = true
  }
  isLibraryExpanded.value = !isLibraryExpanded.value
}
</script>

<template>
  <div
    :style="{
      minHeight: '100vh',
      height: '100dvh',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }"
  >
    <div
      :style="{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        flex: 1,
        minHeight: 0,
        overflow: 'hidden',
        height: isCompact ? 'auto' : '100%',
        maxHeight: '100%',
        maxWidth: '1600px',
        width: '100%',
        margin: '0 auto',
        padding: isCompact ? '0.4rem' : '0.5rem',
      }"
    >
      <div
        :style="{
          flex: isDeckExpanded ? '0 1 auto' : '0 0 auto',
          maxHeight: isDeckExpanded
            ? isLibraryExpanded
              ? isCompact
                ? '50vh'
                : '60vh'
              : isCompact
                ? '68vh'
                : '78vh'
            : 'auto',
          minHeight: isDeckExpanded
            ? isLibraryExpanded
              ? isCompact
                ? '220px'
                : '360px'
              : isCompact
                ? '220px'
                : '360px'
            : 'auto',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }"
      >
        <DeckArea
          :deck="deck"
          :is-expanded="isDeckExpanded"
          :compact="isCompact"
          @remove="removeCard"
          @clear="clearDeck"
          @toggle="toggleDeck"
        />
      </div>

      <div
        :style="{
          flex: isLibraryExpanded ? '1 1 auto' : '0 0 auto',
          minHeight: 0,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }"
      >
        <CardList :is-expanded="isLibraryExpanded" :compact="isCompact" @add="addCard" @toggle="toggleLibrary" />
      </div>
    </div>
  </div>
</template>
