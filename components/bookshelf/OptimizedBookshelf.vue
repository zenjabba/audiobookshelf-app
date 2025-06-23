<template>
  <div class="w-full h-full">
    <!-- Sync Progress Bar -->
    <div v-if="syncProgress && !syncProgress.isComplete" class="w-full p-4 bg-primary bg-opacity-20">
      <div class="flex items-center justify-between mb-2">
        <p class="text-sm">{{ $strings.MessageSyncingLibrary }}: {{ syncProgress.percentage.toFixed(1) }}%</p>
        <p class="text-xs text-gray-400">{{ syncProgress.synced }} / {{ syncProgress.total }}</p>
      </div>
      <div class="w-full bg-gray-700 rounded-full h-2">
        <div class="bg-success h-2 rounded-full transition-all duration-300" :style="{ width: syncProgress.percentage + '%' }"></div>
      </div>
    </div>

    <!-- Virtual Scroller for Large Libraries -->
    <div class="w-full h-full overflow-y-auto" @scroll="handleScroll">
      <div class="relative" :style="{ height: totalHeight + 'px' }">
        <div class="absolute w-full" :style="{ top: offsetY + 'px' }">
          <template v-for="(shelf, index) in visibleShelves">
            <bookshelf-shelf 
              :key="shelf.id + '_' + index" 
              :label="shelf.label" 
              :entities="shelf.entities" 
              :type="shelf.type"
              :style="{ zIndex: visibleShelves.length - index }"
            />
          </template>
        </div>
      </div>
    </div>

    <!-- Loading indicator -->
    <div v-if="isLoadingMore" class="w-full p-4 flex items-center justify-center">
      <widgets-loading-spinner />
      <p class="pl-4">{{ $strings.MessageLoadingMore }}</p>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      shelves: [],
      visibleShelves: [],
      localLibraryItems: [],
      syncProgress: null,
      isLoadingMore: false,
      hasMoreData: true,
      currentOffset: 0,
      pageSize: 25,
      itemHeight: 300, // Approximate height of each shelf
      scrollTop: 0,
      viewportHeight: 800,
      totalHeight: 0,
      offsetY: 0,
      syncInterval: null
    }
  },
  computed: {
    currentLibraryId() {
      return this.$store.state.libraries.currentLibraryId
    },
    networkConnected() {
      return this.$store.state.networkConnected
    },
    user() {
      return this.$store.state.user.user
    }
  },
  methods: {
    async initializeLibrary() {
      if (!this.currentLibraryId) return

      // Start metadata sync in background
      this.startMetadataSync()

      // Load initial data from cache
      await this.loadCachedData()

      // Fetch fresh data from server
      if (this.networkConnected && this.user) {
        await this.fetchServerData()
      }
    },

    async startMetadataSync() {
      if (!this.networkConnected || !this.user) return

      try {
        // Start sync
        await this.$db.syncLibraryMetadata(this.currentLibraryId, false)
        
        // Check progress periodically
        this.syncInterval = setInterval(async () => {
          const progress = await this.$db.getLibrarySyncProgress(this.currentLibraryId)
          this.syncProgress = {
            synced: progress.synced,
            total: progress.total,
            percentage: progress.percentage,
            isComplete: progress.synced >= progress.total
          }

          if (this.syncProgress.isComplete) {
            clearInterval(this.syncInterval)
            this.syncInterval = null
            // Refresh shelves after sync complete
            await this.loadCachedData()
          }
        }, 2000)
      } catch (error) {
        console.error('[OptimizedBookshelf] Failed to start metadata sync:', error)
      }
    },

    async loadCachedData() {
      try {
        // Get sync progress to know total count
        const syncProgress = await this.$db.getLibrarySyncProgress(this.currentLibraryId)
        if (syncProgress && syncProgress.total > 0) {
          // Emit the total count to update the toolbar
          this.$eventBus.$emit('bookshelf-total-entities', syncProgress.total)
        }

        // Get metadata from local database
        const metadata = await this.$db.getLibraryMetadata(this.currentLibraryId, 0, 1000)
        
        if (metadata.results && metadata.results.length > 0) {
          // Group by type/category for shelves
          this.processCachedMetadata(metadata.results)
        }
      } catch (error) {
        console.error('[OptimizedBookshelf] Failed to load cached data:', error)
      }
    },

    processCachedMetadata(items) {
      // Group items into shelves
      const continueListening = []
      const recentlyAdded = []
      const discover = []

      items.forEach(item => {
        if (item.userMediaProgress && item.userMediaProgress.progress > 0 && !item.userMediaProgress.isFinished) {
          continueListening.push(item)
        } else if (Date.now() - item.addedAt < 7 * 24 * 60 * 60 * 1000) { // Added within last 7 days
          recentlyAdded.push(item)
        } else {
          discover.push(item)
        }
      })

      const shelves = []
      
      if (continueListening.length > 0) {
        shelves.push({
          id: 'continue-listening',
          label: this.$strings.LabelContinueListening,
          type: 'book',
          entities: continueListening.slice(0, 10)
        })
      }

      if (recentlyAdded.length > 0) {
        shelves.push({
          id: 'recently-added',
          label: this.$strings.LabelRecentlyAdded,
          type: 'book',
          entities: recentlyAdded.slice(0, 10)
        })
      }

      if (discover.length > 0) {
        shelves.push({
          id: 'discover',
          label: this.$strings.LabelDiscover,
          type: 'book',
          entities: discover.slice(0, 10)
        })
      }

      this.shelves = shelves
      this.updateVirtualScroller()
    },

    async fetchServerData() {
      try {
        // Fetch personalized shelves with limit
        const categories = await this.$nativeHttp.get(
          `/api/libraries/${this.currentLibraryId}/personalized?minified=1&include=rssfeed,numEpisodesIncomplete&limit=100`,
          { connectTimeout: 10000 }
        ).catch((error) => {
          console.error('[OptimizedBookshelf] Failed to fetch categories', error)
          return []
        })

        if (categories.length > 0) {
          // Map local library items
          this.localLibraryItems = await this.$db.getLocalLibraryItems()
          
          this.shelves = categories.map((cat) => {
            if (cat.type === 'book' || cat.type === 'podcast' || cat.type === 'episode') {
              cat.entities = cat.entities.map((entity) => {
                const localItem = this.localLibraryItems.find(lli => lli.libraryItemId === entity.id)
                if (localItem) {
                  entity.localLibraryItem = localItem
                }
                return entity
              })
            }
            return cat
          })

          this.updateVirtualScroller()
        }
      } catch (error) {
        console.error('[OptimizedBookshelf] Failed to fetch server data:', error)
      }
    },

    updateVirtualScroller() {
      this.totalHeight = this.shelves.length * this.itemHeight
      this.calculateVisibleShelves()
    },

    calculateVisibleShelves() {
      const startIndex = Math.floor(this.scrollTop / this.itemHeight)
      const endIndex = Math.ceil((this.scrollTop + this.viewportHeight) / this.itemHeight)
      
      // Add buffer for smooth scrolling
      const bufferSize = 2
      const start = Math.max(0, startIndex - bufferSize)
      const end = Math.min(this.shelves.length, endIndex + bufferSize)

      this.visibleShelves = this.shelves.slice(start, end)
      this.offsetY = start * this.itemHeight
    },

    handleScroll(event) {
      this.scrollTop = event.target.scrollTop
      this.calculateVisibleShelves()

      // Load more if near bottom
      if (this.hasMoreData && !this.isLoadingMore && 
          event.target.scrollTop + event.target.clientHeight >= event.target.scrollHeight - 500) {
        this.loadMore()
      }
    },

    async loadMore() {
      if (this.isLoadingMore || !this.hasMoreData) return

      this.isLoadingMore = true
      this.currentOffset += this.pageSize

      try {
        const metadata = await this.$db.getLibraryMetadata(
          this.currentLibraryId, 
          this.currentOffset * 10, // Assuming 10 items per shelf
          this.pageSize * 10
        )

        if (metadata.results && metadata.results.length > 0) {
          // Process and add new shelves
          this.processCachedMetadata([...this.shelves.flatMap(s => s.entities), ...metadata.results])
        } else {
          this.hasMoreData = false
        }
      } catch (error) {
        console.error('[OptimizedBookshelf] Failed to load more:', error)
      } finally {
        this.isLoadingMore = false
      }
    },

    getShelfLabel(shelf) {
      if (shelf.labelStringKey) return this.$getString(shelf.labelStringKey)
      return shelf.label || ''
    }
  },
  mounted() {
    this.viewportHeight = this.$el.clientHeight
    this.initializeLibrary()

    // Update viewport height on resize
    window.addEventListener('resize', () => {
      this.viewportHeight = this.$el.clientHeight
      this.calculateVisibleShelves()
    })
  },
  beforeDestroy() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
    }
  },
  watch: {
    currentLibraryId() {
      this.shelves = []
      this.visibleShelves = []
      this.currentOffset = 0
      this.hasMoreData = true
      this.initializeLibrary()
    },
    networkConnected(newVal) {
      if (newVal && this.user) {
        this.startMetadataSync()
        this.fetchServerData()
      }
    }
  }
}
</script>