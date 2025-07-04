<template>
  <div ref="card" :id="`series-card-${index}`" :style="{ width: width + 'px', height: height + 'px' }" class="rounded-sm cursor-pointer z-30" @click="clickCard">
    <div class="absolute top-0 left-0 w-full box-shadow-book shadow-height" />
    <div class="w-full h-full bg-primary relative rounded overflow-hidden">
      <covers-group-cover v-if="series && books.length && hasBookData" ref="cover" :id="seriesId" :name="title" :book-items="books" :width="width" :height="height" :book-cover-aspect-ratio="bookCoverAspectRatio" />
      <div v-else-if="series" class="absolute inset-0 flex items-center justify-center p-3 bg-gradient-to-br from-gray-600 to-gray-800">
        <div class="absolute inset-0 opacity-20">
          <div class="absolute inset-0 bg-black rounded" />
          <div class="absolute top-0 left-0 w-full h-full flex items-center justify-center">
            <span class="material-symbols text-6xl text-gray-500 opacity-50">collections_bookmark</span>
          </div>
        </div>
        <div class="text-center relative z-10">
          <p class="text-gray-100 font-bold leading-tight" :style="{ fontSize: labelFontSize + 'rem' }">{{ title }}</p>
          <p v-if="series.numBooks" class="text-gray-300 text-xs mt-1 font-medium">{{ series.numBooks }} {{ series.numBooks === 1 ? 'book' : 'books' }}</p>
        </div>
      </div>
    </div>

    <div v-if="seriesPercentInProgress > 0" class="absolute bottom-0 left-0 h-1 max-w-full z-10 rounded-b w-full box-shadow-progressbar" :class="isSeriesFinished ? 'bg-success' : 'bg-yellow-400'" :style="{ width: seriesPercentInProgress * 100 + '%' }" />

    <div v-if="isAltViewEnabled && isCategorized" class="absolute z-30 left-0 right-0 mx-auto -bottom-8 h-8 py-1 rounded-md text-center">
      <p class="truncate" :style="{ fontSize: labelFontSize + 'rem' }">{{ title }}</p>
    </div>
    <div v-if="!isCategorized" class="categoryPlacard absolute z-30 left-0 right-0 mx-auto -bottom-6 h-6 rounded-md text-center" :style="{ width: Math.min(240, width) + 'px' }">
      <div class="w-full h-full flex items-center justify-center rounded-sm border" :class="isAltViewEnabled ? 'altBookshelfLabel' : 'shinyBlack'" :style="{ padding: `0rem ${0.5 * sizeMultiplier}rem` }">
        <p class="truncate" :style="{ fontSize: labelFontSize + 'rem' }">{{ title }}</p>
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
    bookCoverAspectRatio: Number,
    seriesMount: {
      type: Object,
      default: () => null
    },
    isAltViewEnabled: Boolean,
    isCategorized: Boolean
  },
  data() {
    return {
      series: null,
      isSelectionMode: false,
      selected: false,
      imageReady: false
    }
  },
  computed: {
    labelFontSize() {
      if (this.width < 160) return 0.75
      return 0.875
    },
    sizeMultiplier() {
      if (this.bookCoverAspectRatio === 1) return this.width / (120 * 1.6 * 2)
      return this.width / 240
    },
    title() {
      return this.series ? this.series.name : 'No title'
    },
    books() {
      // For series listing, we may not have books array populated
      // The cover component should handle empty arrays gracefully
      return this.series ? this.series.books || [] : []
    },
    hasBookData() {
      // Check if we have actual book data, not just IDs or empty array
      if (!this.books.length) return false
      // If first item is an object with media property, we have full book data
      const firstBook = this.books[0]
      return typeof firstBook === 'object' && firstBook !== null && (firstBook.media || firstBook.id)
    },
    seriesBookProgress() {
      return this.books
        .map((libraryItem) => {
          return this.store.getters['user/getUserMediaProgress'](libraryItem.id)
        })
        .filter((p) => !!p)
    },
    seriesBooksFinished() {
      return this.seriesBookProgress.filter((p) => p.isFinished)
    },
    hasSeriesBookInProgress() {
      return this.seriesBookProgress.some((p) => !p.isFinished && p.progress > 0)
    },
    seriesPercentInProgress() {
      let totalFinishedAndInProgress = this.seriesBooksFinished.length
      if (this.hasSeriesBookInProgress) totalFinishedAndInProgress += 1
      return Math.min(1, Math.max(0, totalFinishedAndInProgress / this.books.length))
    },
    isSeriesFinished() {
      return this.books.length === this.seriesBooksFinished.length
    },
    store() {
      return this.$store || this.$nuxt?.$store || this.$parent?.$store
    },
    currentLibraryId() {
      return this.store.state.libraries.currentLibraryId
    },
    seriesId() {
      return this.series ? this.series.id : null
    }
  },
  methods: {
    setEntity(_series) {
      this.series = _series
    },
    setSelectionMode(val) {
      this.isSelectionMode = val
    },
    clickCard() {
      if (!this.series) return
      var router = this.$router || this.$nuxt.$router
      router.push(`/bookshelf/series/${this.seriesId}`)
    },
    imageLoaded() {
      this.imageReady = true
    },
    destroy() {
      // destroy the vue listeners, etc
      this.$destroy()

      // remove the element from the DOM
      if (this.$el && this.$el.parentNode) {
        this.$el.parentNode.removeChild(this.$el)
      } else if (this.$el && this.$el.remove) {
        this.$el.remove()
      }
    }
  },
  mounted() {
    if (this.seriesMount) {
      this.setEntity(this.seriesMount)
    }
  },
  beforeDestroy() {}
}
</script>
