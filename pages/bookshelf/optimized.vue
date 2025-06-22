<template>
  <div class="w-full h-full min-h-full relative">
    <bookshelf-optimized-bookshelf v-if="shouldUseOptimized" />
    
    <!-- Fallback to regular bookshelf for smaller libraries -->
    <div v-else>
      <div v-if="attemptingConnection" class="w-full pt-4 flex items-center justify-center">
        <widgets-loading-spinner />
        <p class="pl-4">{{ $strings.MessageAttemptingServerConnection }}</p>
      </div>
      <div v-if="shelves.length && isLoading" class="w-full pt-4 flex items-center justify-center">
        <widgets-loading-spinner />
        <p class="pl-4">{{ $strings.MessageLoadingServerData }}</p>
      </div>

      <div class="w-full" :class="{ 'py-6': altViewEnabled }">
        <template v-for="(shelf, index) in shelves">
          <bookshelf-shelf :key="shelf.id" :label="getShelfLabel(shelf)" :entities="shelf.entities" :type="shelf.type" :style="{ zIndex: shelves.length - index }" />
        </template>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      shelves: [],
      isLoading: false,
      attemptingConnection: false,
      shouldUseOptimized: false,
      librarySize: 0
    }
  },
  computed: {
    user() {
      return this.$store.state.user.user
    },
    currentLibraryId() {
      return this.$store.state.libraries.currentLibraryId
    },
    altViewEnabled() {
      return this.$store.state.libraries.altViewEnabled
    }
  },
  methods: {
    async checkLibrarySize() {
      if (!this.user || !this.currentLibraryId) {
        this.shouldUseOptimized = false
        return
      }

      try {
        // Quick check of library size
        const response = await this.$nativeHttp.get(
          `/api/libraries/${this.currentLibraryId}/stats`,
          { connectTimeout: 5000 }
        ).catch(() => null)

        if (response && response.totalItems) {
          this.librarySize = response.totalItems
          // Use optimized component for libraries with more than 5000 items
          this.shouldUseOptimized = response.totalItems > 5000
          
          console.log(`[OptimizedBookshelf] Library size: ${response.totalItems}, using optimized: ${this.shouldUseOptimized}`)
        }
      } catch (error) {
        console.error('[OptimizedBookshelf] Failed to check library size:', error)
        // Default to regular bookshelf on error
        this.shouldUseOptimized = false
      }
    },

    getShelfLabel(shelf) {
      if (shelf.labelStringKey) return this.$getString(shelf.labelStringKey)
      return shelf.label || ''
    },

    async fetchCategories() {
      // Implementation for regular bookshelf
      // ... (copy from original bookshelf/index.vue)
    }
  },
  async mounted() {
    await this.checkLibrarySize()
    
    if (!this.shouldUseOptimized) {
      // Initialize regular bookshelf
      await this.fetchCategories()
    }
  },
  watch: {
    currentLibraryId() {
      this.checkLibrarySize()
    }
  }
}
</script>