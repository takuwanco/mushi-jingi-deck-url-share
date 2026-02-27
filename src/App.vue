<script setup lang="ts">
import { ref } from 'vue'
import CardList from './components/CardList.vue'
import DeckArea from './components/DeckArea.vue'
import { useDeck } from './composables/useDeck'

const { deck, addCard, removeCard, clearDeck } = useDeck()
const isDeckExpanded = ref(true)
const isLibraryExpanded = ref(true)

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
      height: '100vh',
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
        height: '100%',
        maxHeight: '100%',
        maxWidth: '1600px',
        width: '100%',
        margin: '0 auto',
        padding: '0.5rem',
      }"
    >
      <div
        :style="{
          flex: isDeckExpanded ? '0 1 auto' : '0 0 auto',
          maxHeight: isDeckExpanded ? '60vh' : 'auto',
          minHeight: isDeckExpanded ? '360px' : 'auto',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }"
      >
        <DeckArea
          :deck="deck"
          :is-expanded="isDeckExpanded"
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
        <CardList :is-expanded="isLibraryExpanded" @add="addCard" @toggle="toggleLibrary" />
      </div>
    </div>
  </div>
</template>
