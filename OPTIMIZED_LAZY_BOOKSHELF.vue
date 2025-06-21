<template>
  <div id="bookshelf" class="w-full max-w-full h-full" @scroll="onScroll">
    <!-- Virtual scrolling container with dynamic height -->
    <div 
      :style="{ height: totalHeight + 'px', position: 'relative' }"
      class="virtual-scroll-container"
    >
      <!-- Visible items container -->
      <div 
        :style="{ 
          transform: `translateY(${offsetY}px)`,
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0
        }"
      >
        <template v-for="item in visibleItems" :key="item.id">
          <component
            :is="getCardComponent(item.type)"
            :ref="'item-' + item.index"
            :libraryItem="item.data"
            :index="item.index"
            @loaded="onItemLoaded(item.index)"
          />
        </template>
      </div>

      <!-- Loading indicators -->
      <div v-if="isLoadingTop" class="loading-indicator loading-top">
        Loading...
      </div>
      <div v-if="isLoadingBottom" class="loading-indicator loading-bottom">
        Loading...
      </div>
    </div>

    <!-- Empty state -->
    <div v-show="!totalEntities && initialized" class="w-full py-16 text-center text-xl">
      <div class="py-4">No {{ entityName }}</div>
    </div>
  </div>
</template>

<script>
import { debounce } from 'lodash'

export default {
  name: 'OptimizedLazyBookshelf',
  props: {
    page: String,
    seriesId: String
  },
  data() {
    return {
      // Virtual scrolling properties
      itemHeight: 200, // Estimated item height
      containerHeight: 0,
      scrollTop: 0,
      visibleStartIndex: 0,
      visibleEndIndex: 0,
      bufferSize: 5, // Items to render outside viewport
      
      // Data management
      totalEntities: 0,
      loadedChunks: new Map(), // Map<chunkIndex, items[]>
      chunkSize: 100,
      maxCachedChunks: 10,
      
      // Component recycling
      componentPool: new Map(), // Map<componentType, component[]>
      activeComponents: new Map(), // Map<index, component>
      maxPoolSize: 50,
      
      // Loading states
      isLoadingTop: false,
      isLoadingBottom: false,
      initialized: false,
      
      // API management
      activeRequests: new Map(),
      cancelTokens: new Map(),
      
      // Current visible items for rendering
      visibleItems: []
    }
  },

  computed: {
    totalHeight() {
      return this.totalEntities * this.itemHeight
    },

    offsetY() {
      return this.visibleStartIndex * this.itemHeight
    },

    entityName() {
      return this.page === 'collections' ? 'collections' : 'items'
    }
  },

  mounted() {
    this.initializeVirtualScrolling()
    this.loadInitialData()
  },

  beforeDestroy() {
    this.cleanup()
  },

  methods: {
    initializeVirtualScrolling() {
      this.containerHeight = this.$el.clientHeight
      this.calculateVisibleRange()
      
      // Setup resize observer
      if (window.ResizeObserver) {
        this.resizeObserver = new ResizeObserver((entries) => {
          this.containerHeight = entries[0].contentRect.height
          this.calculateVisibleRange()
          this.updateVisibleItems()
        })
        this.resizeObserver.observe(this.$el)
      }
    },

    onScroll: debounce(function(event) {
      this.scrollTop = event.target.scrollTop
      this.calculateVisibleRange()
      this.updateVisibleItems()
    }, 16), // ~60fps

    calculateVisibleRange() {
      const visibleCount = Math.ceil(this.containerHeight / this.itemHeight)
      
      this.visibleStartIndex = Math.max(0, 
        Math.floor(this.scrollTop / this.itemHeight) - this.bufferSize
      )
      
      this.visibleEndIndex = Math.min(this.totalEntities - 1,
        this.visibleStartIndex + visibleCount + (this.bufferSize * 2)
      )
    },

    async updateVisibleItems() {
      if (this.visibleStartIndex < 0 || this.visibleEndIndex < 0) return

      // Load required chunks
      await this.loadRequiredChunks()
      
      // Recycle components outside visible range
      this.recycleInvisibleComponents()
      
      // Update visible items array
      this.visibleItems = []
      for (let i = this.visibleStartIndex; i <= this.visibleEndIndex; i++) {
        const item = await this.getItemAtIndex(i)
        if (item) {
          this.visibleItems.push({
            id: item.id || i,
            index: i,
            data: item,
            type: this.getItemType(item)
          })
        }
      }
    },

    async loadRequiredChunks() {
      const startChunk = Math.floor(this.visibleStartIndex / this.chunkSize)
      const endChunk = Math.floor(this.visibleEndIndex / this.chunkSize)
      
      const loadPromises = []
      for (let chunkIndex = startChunk; chunkIndex <= endChunk; chunkIndex++) {
        if (!this.loadedChunks.has(chunkIndex)) {
          loadPromises.push(this.loadChunk(chunkIndex))
        }
      }
      
      await Promise.all(loadPromises)
    },

    async loadChunk(chunkIndex) {
      const requestKey = `chunk-${chunkIndex}`
      
      // Return existing request if in progress
      if (this.activeRequests.has(requestKey)) {
        return this.activeRequests.get(requestKey)
      }

      // Show loading indicator
      if (chunkIndex === 0) this.isLoadingTop = true
      else this.isLoadingBottom = true

      try {
        const offset = chunkIndex * this.chunkSize
        const loadPromise = this.fetchChunkData(offset, this.chunkSize)
        this.activeRequests.set(requestKey, loadPromise)
        
        const chunkData = await loadPromise
        
        // Implement LRU cache
        if (this.loadedChunks.size >= this.maxCachedChunks) {
          const oldestChunk = this.loadedChunks.keys().next().value
          this.loadedChunks.delete(oldestChunk)
        }
        
        this.loadedChunks.set(chunkIndex, chunkData)
        return chunkData
        
      } catch (error) {
        console.error(`Failed to load chunk ${chunkIndex}:`, error)
        return []
      } finally {
        this.activeRequests.delete(requestKey)
        this.isLoadingTop = false
        this.isLoadingBottom = false
      }
    },

    async fetchChunkData(offset, limit) {
      // This would be replaced with actual API call
      const response = await this.$api.getLibraryItems({
        offset,
        limit,
        libraryId: this.currentLibraryId
      })
      
      return response.results || []
    },

    async getItemAtIndex(index) {
      const chunkIndex = Math.floor(index / this.chunkSize)
      const chunk = this.loadedChunks.get(chunkIndex)
      
      if (!chunk) {
        await this.loadChunk(chunkIndex)
        return this.getItemAtIndex(index) // Retry after loading
      }
      
      const itemIndex = index % this.chunkSize
      return chunk[itemIndex]
    },

    getItemType(item) {
      // Determine component type based on item
      if (this.page === 'collections') return 'collection'
      if (item.mediaType === 'podcast') return 'podcast'
      return 'book'
    },

    getCardComponent(type) {
      const componentMap = {
        book: 'book-card',
        podcast: 'podcast-card',
        collection: 'collection-card'
      }
      return componentMap[type] || 'book-card'
    },

    recycleInvisibleComponents() {
      for (const [index, component] of this.activeComponents) {
        if (index < this.visibleStartIndex || index > this.visibleEndIndex) {
          this.recycleComponent(component)
          this.activeComponents.delete(index)
        }
      }
    },

    recycleComponent(component) {
      const type = component.componentType || 'book'
      
      if (!this.componentPool.has(type)) {
        this.componentPool.set(type, [])
      }
      
      const pool = this.componentPool.get(type)
      if (pool.length < this.maxPoolSize) {
        component.reset?.() // Reset component state
        pool.push(component)
      } else {
        component.$destroy?.()
      }
    },

    async loadInitialData() {
      try {
        // Get total count first
        this.totalEntities = await this.getTotalEntityCount()
        
        // Load first chunk
        await this.loadChunk(0)
        
        this.initialized = true
        this.calculateVisibleRange()
        this.updateVisibleItems()
        
      } catch (error) {
        console.error('Failed to load initial data:', error)
      }
    },

    async getTotalEntityCount() {
      const response = await this.$api.getLibraryItemCount({
        libraryId: this.currentLibraryId
      })
      return response.count || 0
    },

    onItemLoaded(index) {
      // Handle item load completion if needed
      this.$emit('item-loaded', index)
    },

    cleanup() {
      // Cancel all active requests
      for (const [key, cancelToken] of this.cancelTokens) {
        cancelToken.cancel?.()
      }
      this.cancelTokens.clear()
      this.activeRequests.clear()
      
      // Destroy all pooled components
      for (const [type, pool] of this.componentPool) {
        pool.forEach(component => component.$destroy?.())
      }
      this.componentPool.clear()
      
      // Cleanup resize observer
      if (this.resizeObserver) {
        this.resizeObserver.disconnect()
      }
    }
  }
}
</script>

<style scoped>
.virtual-scroll-container {
  overflow: hidden;
}

.loading-indicator {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  padding: 10px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  border-radius: 4px;
  z-index: 100;
}

.loading-top {
  top: 10px;
}

.loading-bottom {
  bottom: 10px;
}
</style>