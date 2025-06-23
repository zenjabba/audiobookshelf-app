<template>
  <div>
    <div v-if="author" ref="card" :style="{ width: cardWidth + 'px', height: cardHeight + 'px' }" class="bg-primary box-shadow-book rounded-md relative overflow-hidden">
      <!-- Image or placeholder -->
      <covers-author-image :author="author" />

      <!-- Author name & num books overlay -->
      <div class="absolute bottom-0 left-0 w-full py-1 bg-black bg-opacity-60 px-2">
        <p class="text-center font-semibold truncate text-white" :style="{ fontSize: sizeMultiplier * 0.75 + 'rem' }">{{ author.name }}</p>
        <p class="text-center text-gray-200" :style="{ fontSize: sizeMultiplier * 0.65 + 'rem' }">{{ author.numBooks }} {{ $strings.LabelBooks }}</p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    index: Number,
    width: Number,
    height: Number,
    bookshelfView: {
      type: Number,
      default: 1
    }
  },
  data() {
    return {
      author: null,
      imageReady: false,
      selected: false,
      selectionMode: false
    }
  },
  computed: {
    cardWidth() {
      return this.width || 200
    },
    cardHeight() {
      return this.height || 250
    },
    sizeMultiplier() {
      return Math.min(1.5, Math.max(0.5, this.cardWidth / 150))
    }
  },
  methods: {
    setSelectionMode(val) {
      this.selectionMode = val
    },
    setEntity(author) {
      this.author = author
    },
    setSelected(val) {
      this.selected = val
    },
    destroy() {
      // Cleanup
    }
  },
  mounted() {
    console.log('[LazyAuthorCard] Component mounted, index:', this.index)
  }
}
</script>