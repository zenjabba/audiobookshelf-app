<template>
  <div id="bookshelf" ref="bookshelf" class="w-full max-w-full h-full overflow-y-auto">
    <div v-if="!initialized && user" class="w-full py-16 text-center text-xl">Loading library...</div>
    
    <!-- Virtual spacer to maintain correct scroll height -->
    <div :style="{ height: virtualSpacerHeight + 'px', position: 'relative' }">
      <!-- Only render visible shelves -->
      <template v-for="shelf in visibleShelves">
        <div 
          :key="`shelf-${shelf}`" 
          class="w-full px-2 absolute" 
          :class="showBookshelfListView || altViewEnabled ? '' : 'bookshelfRow'" 
          :id="`shelf-${shelf}`" 
          :style="{ 
            height: shelfHeight + 'px', 
            minHeight: shelfHeight + 'px',
            transform: `translateY(${shelf * shelfHeight}px)`
          }"
        >
          <div v-if="!showBookshelfListView && !altViewEnabled" class="w-full absolute bottom-0 left-0 z-30 bookshelfDivider" style="min-height: 16px" :class="`h-${shelfDividerHeightIndex}`" />
          <div v-else-if="showBookshelfListView" class="flex border-t border-white border-opacity-10" />
        </div>
      </template>
    </div>

    <div v-show="!Object.keys(entities).length && initialized" class="w-full py-16 text-center text-xl">
      <div v-if="page === 'collections'" class="py-4">{{ $strings.MessageNoCollections }}</div>
      <div v-else class="py-4 capitalize">No {{ entityName }}</div>
      <ui-btn v-if="hasFilter" @click="clearFilter">{{ $strings.ButtonClearFilter }}</ui-btn>
    </div>
  </div>
</template>

<script>
import bookshelfCardsHelpers from '@/mixins/bookshelfCardsHelpers'

export default {
  props: {
    page: String,
    seriesId: String
  },
  mixins: [bookshelfCardsHelpers],
  data() {
    return {
      routeFullPath: null,
      entitiesPerShelf: 2,
      bookshelfHeight: 0,
      bookshelfWidth: 0,
      bookshelfMarginLeft: 0,
      shelvesPerPage: 0,
      currentPage: 0,
      booksPerFetch: 20,
      initialized: false,
      currentSFQueryString: null,
      isFetchingEntities: false,
      entities: {},
      totalEntities: 0,
      totalShelves: 0,
      entityComponentRefs: {},
      entityIndexesMounted: [],
      pagesLoaded: {},
      isFirstInit: false,
      pendingReset: false,
      localLibraryItems: [],
      scrollTimeout: null,
      lastScrollTop: 0,
      isScrolling: false,
      visibleShelves: [],
      shelfBuffer: 3
    }
  },
  watch: {
    showBookshelfListView(newVal) {
      this.resetEntities()
    },
    seriesId() {
      this.resetEntities()
    },
    shelfHeight() {
      // Recalculate visible shelves when shelf height changes
      if (this.initialized) {
        this.updateVisibleShelves(this.currScrollTop || 0)
      }
    }
  },
  computed: {
    user() {
      return this.$store.state.user.user
    },
    isBookEntity() {
      return this.entityName === 'books' || this.entityName === 'series-books'
    },
    shelfDividerHeightIndex() {
      if (this.isBookEntity) return 4
      return 6
    },
    bookshelfListView() {
      return this.$store.state.globals.bookshelfListView
    },
    showBookshelfListView() {
      return this.isBookEntity && this.bookshelfListView
    },
    sortingIgnorePrefix() {
      return this.$store.getters['getServerSetting']('sortingIgnorePrefix')
    },
    entityName() {
      return this.page
    },
    hasFilter() {
      if (this.page === 'series' || this.page === 'collections' || this.page === 'playlists') return false
      return this.filterBy !== 'all'
    },
    orderBy() {
      return this.$store.getters['user/getUserSetting']('mobileOrderBy')
    },
    orderDesc() {
      return this.$store.getters['user/getUserSetting']('mobileOrderDesc')
    },
    filterBy() {
      return this.$store.getters['user/getUserSetting']('mobileFilterBy')
    },
    collapseSeries() {
      return this.$store.getters['user/getUserSetting']('collapseSeries')
    },
    collapseBookSeries() {
      return this.$store.getters['user/getUserSetting']('collapseBookSeries')
    },
    isCoverSquareAspectRatio() {
      return this.bookCoverAspectRatio === 1
    },
    bookCoverAspectRatio() {
      return this.$store.getters['libraries/getBookCoverAspectRatio']
    },
    bookWidth() {
      const availableWidth = window.innerWidth - 16
      let coverSize = 100

      // Smaller screens fill width with 2 items per row
      if (availableWidth <= 400) {
        coverSize = Math.floor(availableWidth / 2 - 24)
        if (coverSize < 120) {
          // Fallback to 1 item per row
          coverSize = Math.min(availableWidth - 24, 200)
        }
        if (this.isCoverSquareAspectRatio || this.entityName === 'playlists') coverSize /= 1.6
      }

      if (this.isCoverSquareAspectRatio || this.entityName === 'playlists') return coverSize * 1.6
      return coverSize
    },
    bookHeight() {
      if (this.isCoverSquareAspectRatio || this.entityName === 'playlists') return this.bookWidth
      return this.bookWidth * 1.6
    },
    entityWidth() {
      if (this.showBookshelfListView) return this.bookshelfWidth - 16
      if (this.entityName === 'authors') {
        // Use similar sizing to books for more authors per row
        return this.bookWidth
      }
      if (this.isBookEntity || this.entityName === 'playlists') return this.bookWidth
      return this.bookWidth * 2
    },
    entityHeight() {
      if (this.showBookshelfListView) return 88
      if (this.entityName === 'authors') {
        // Use similar sizing to books with 1.25 aspect ratio
        return this.bookWidth * 1.25
      }
      return this.bookHeight
    },
    currentLibraryId() {
      return this.$store.state.libraries.currentLibraryId
    },
    currentLibraryMediaType() {
      return this.$store.getters['libraries/getCurrentLibraryMediaType']
    },
    shelfHeight() {
      if (this.showBookshelfListView) return this.entityHeight + 16
      if (this.altViewEnabled) {
        var extraTitleSpace = this.isBookEntity ? 80 : 40
        return this.entityHeight + extraTitleSpace * this.sizeMultiplier
      }
      return this.entityHeight + 40
    },
    totalEntityCardWidth() {
      if (this.showBookshelfListView) return this.entityWidth
      // Includes margin
      return this.entityWidth + 24
    },
    altViewEnabled() {
      return this.$store.getters['getAltViewEnabled']
    },
    sizeMultiplier() {
      const baseSize = this.isCoverSquareAspectRatio ? 192 : 120
      return this.entityWidth / baseSize
    },
    virtualSpacerHeight() {
      // Total height needed for all shelves
      return this.totalShelves * this.shelfHeight
    }
  },
  methods: {
    clearFilter() {
      this.$store.dispatch('user/updateUserSettings', {
        mobileFilterBy: 'all'
      })
    },
    async fetchEntities(page) {
      const startIndex = page * this.booksPerFetch

      this.isFetchingEntities = true

      if (!this.initialized) {
        this.currentSFQueryString = this.buildSearchParams()
      }

      const entityPath = this.entityName === 'books' || this.entityName === 'series-books' ? `items` : this.entityName
      const sfQueryString = this.currentSFQueryString ? this.currentSFQueryString + '&' : ''
      const fullQueryString = `?${sfQueryString}limit=${this.booksPerFetch}&page=${page}&minified=1&include=rssfeed,numEpisodesIncomplete`

      const fullUrl = `/api/libraries/${this.currentLibraryId}/${entityPath}${fullQueryString}`
      console.log('[LazyBookshelf] Fetching entities - URL:', fullUrl, 'Page:', page, 'Limit:', this.booksPerFetch)
      
      const payload = await this.$nativeHttp.get(fullUrl).catch((error) => {
        console.error('failed to fetch entities', error)
        return null
      })

      this.isFetchingEntities = false
      if (this.pendingReset) {
        this.pendingReset = false
        this.resetEntities()
        return
      }
      if (payload) {
        console.log('Received payload', payload)
        // Handle different response structures for different entity types
        let results = payload.results || payload.series || payload.collections || payload.authors || []
        const total = payload.total !== undefined ? payload.total : results.length
        
        // Debug logging for series data
        if (this.entityName === 'series' && results.length > 0) {
          console.log('[LazyBookshelf] Series data debug:')
          results.slice(0, 3).forEach((series, index) => {
            console.log(`Series ${index}: ${series.name} (${series.id})`)
            if (series.books && series.books.length > 0) {
              console.log(`  Books: ${series.books.map(b => typeof b === 'string' ? b : b.id).join(', ')}`)
            }
          })
        }
        
        // Special handling for authors - if server returns all authors, slice only what we need
        if (this.entityName === 'authors' && results.length > this.booksPerFetch) {
          console.log('[LazyBookshelf] Server returned all', results.length, 'authors, slicing to requested range')
          const sliceStart = page * this.booksPerFetch
          const sliceEnd = sliceStart + this.booksPerFetch
          results = results.slice(sliceStart, sliceEnd)
        }
        
        console.log('[LazyBookshelf] Page:', page, 'Start index:', startIndex, 'Results count:', results.length)
        if (!this.initialized) {
          this.initialized = true
          this.totalEntities = total
          this.totalShelves = Math.ceil(this.totalEntities / this.entitiesPerShelf)
          // Use object instead of array to avoid pre-allocating memory for all entities
          this.entities = {}
          this.$eventBus.$emit('bookshelf-total-entities', this.totalEntities)
          console.log('[LazyBookshelf] Initialized - Total entities:', this.totalEntities, 'Total shelves:', this.totalShelves, 'Entities per shelf:', this.entitiesPerShelf)
        }

        for (let i = 0; i < results.length; i++) {
          const index = i + startIndex
          this.entities[index] = results[i]
          
          // Log first few entities for debugging
          if (i < 3) {
            console.log(`[LazyBookshelf] Entity at global index ${index}:`, results[i].name || results[i].title || results[i].id)
          }
          
          if (this.entityComponentRefs[index]) {
            this.entityComponentRefs[index].setEntity(this.entities[index])

            if (this.isBookEntity) {
              const localLibraryItem = this.localLibraryItems.find((lli) => lli.libraryItemId == this.entities[index].id)
              if (localLibraryItem) {
                this.entityComponentRefs[index].setLocalLibraryItem(localLibraryItem)
              }
            }
          }
        }
        
        console.log('[LazyBookshelf] Page', page, 'loaded. Total entities loaded:', Object.keys(this.entities).length)
      }
    },
    async loadPage(page) {
      if (!this.currentLibraryId) {
        console.error('[LazyBookshelf] loadPage current library id not set')
        return
      }
      this.pagesLoaded[page] = true
      await this.fetchEntities(page)
    },
    mountEntites(fromIndex, toIndex) {
      console.log('[LazyBookshelf] Mounting entities from', fromIndex, 'to', toIndex, 'Entities available:', Object.keys(this.entities).length)
      console.log('[LazyBookshelf] Currently mounted indices:', this.entityIndexesMounted.slice().sort((a, b) => a - b))
      
      for (let i = fromIndex; i < toIndex; i++) {
        if (!this.entityIndexesMounted.includes(i)) {
          if (!this.entities[i]) {
            console.warn('[LazyBookshelf] No entity at index', i, '- skipping mount')
            continue
          }
          console.log('[LazyBookshelf] Mounting card at index', i, 'Entity exists:', !!this.entities[i])
          this.cardsHelpers.mountEntityCard(i)
        }
      }
      console.log('[LazyBookshelf] Mounted entities count:', this.entityIndexesMounted.length)
      console.log('[LazyBookshelf] Mounted indices range:', Math.min(...this.entityIndexesMounted), '-', Math.max(...this.entityIndexesMounted))
    },
    updateVisibleShelves(scrollTop) {
      const firstVisibleShelf = Math.max(0, Math.floor(scrollTop / this.shelfHeight) - this.shelfBuffer)
      const lastVisibleShelf = Math.min(this.totalShelves - 1, Math.ceil((scrollTop + this.bookshelfHeight) / this.shelfHeight) + this.shelfBuffer)
      
      // Create array of visible shelf indices
      const newVisibleShelves = []
      for (let i = firstVisibleShelf; i <= lastVisibleShelf; i++) {
        newVisibleShelves.push(i)
      }
      
      // Only update if changed
      if (JSON.stringify(this.visibleShelves) !== JSON.stringify(newVisibleShelves)) {
        console.log('[LazyBookshelf] Updating visible shelves from', this.visibleShelves.length, 'to', newVisibleShelves.length, 'shelves')
        this.visibleShelves = newVisibleShelves
      }
    },
    handleScroll(scrollTop) {
      this.currScrollTop = scrollTop
      
      // Update visible shelves first
      this.updateVisibleShelves(scrollTop)
      
      // Debug logging
      console.log('[LazyBookshelf] handleScroll - scrollTop:', scrollTop, 'shelfHeight:', this.shelfHeight, 'entitiesPerShelf:', this.entitiesPerShelf)
      
      var firstShelfIndex = Math.max(0, Math.floor(scrollTop / this.shelfHeight))
      var lastShelfIndex = Math.ceil((scrollTop + this.bookshelfHeight) / this.shelfHeight)
      lastShelfIndex = Math.min(this.totalShelves - 1, lastShelfIndex)

      var firstBookIndex = Math.max(0, firstShelfIndex * this.entitiesPerShelf)
      var lastBookIndex = Math.min(this.totalEntities, (lastShelfIndex + 1) * this.entitiesPerShelf)

      console.log('[LazyBookshelf] Shelf indices:', firstShelfIndex, '-', lastShelfIndex, 'Entity indices:', firstBookIndex, '-', lastBookIndex)

      var firstBookPage = Math.floor(firstBookIndex / this.booksPerFetch)
      var lastBookPage = Math.floor((lastBookIndex - 1) / this.booksPerFetch)
      if (!this.pagesLoaded[firstBookPage]) {
        console.log('Must load next batch', firstBookPage, 'book index', firstBookIndex)
        this.loadPage(firstBookPage)
      }
      if (lastBookPage !== firstBookPage && !this.pagesLoaded[lastBookPage]) {
        console.log('Must load last next batch', lastBookPage, 'book index', lastBookIndex)
        this.loadPage(lastBookPage)
      }

      // Remove entities out of view - with a buffer for smoother scrolling
      const bufferEntities = this.entitiesPerShelf * 2
      const removeBeforeIndex = Math.max(0, firstBookIndex - bufferEntities)
      const removeAfterIndex = Math.min(this.totalEntities, lastBookIndex + bufferEntities)
      
      this.entityIndexesMounted = this.entityIndexesMounted.filter((_index) => {
        if (_index < removeBeforeIndex || _index >= removeAfterIndex) {
          var el = document.getElementById(`book-card-${_index}`)
          if (el) el.remove()
          if (this.entityComponentRefs[_index]) {
            if (this.entityComponentRefs[_index].$destroy) {
              this.entityComponentRefs[_index].$destroy()
            }
            delete this.entityComponentRefs[_index]
          }
          return false
        }
        return true
      })
      
      // Always mount entities that should be visible
      this.mountEntites(firstBookIndex, lastBookIndex)
    },
    destroyEntityComponents() {
      for (const key in this.entityComponentRefs) {
        if (this.entityComponentRefs[key] && this.entityComponentRefs[key].destroy) {
          this.entityComponentRefs[key].destroy()
        }
      }
    },
    setDownloads() {
      if (this.entityName === 'books') {
        this.entities = {}
        // TOOD: Sort and filter here
        this.totalEntities = 0
        this.totalShelves = Math.ceil(this.totalEntities / this.entitiesPerShelf)
      } else {
        // TODO: Support offline series and collections
        this.entities = {}
        this.totalEntities = 0
        this.totalShelves = 0
      }
      this.$eventBus.$emit('bookshelf-total-entities', this.totalEntities)
    },
    async resetEntities() {
      if (this.isFetchingEntities) {
        this.pendingReset = true
        return
      }
      this.destroyEntityComponents()
      this.entityIndexesMounted = []
      this.entityComponentRefs = {}
      this.pagesLoaded = {}
      this.entities = {}
      this.totalShelves = 0
      this.totalEntities = 0
      this.currentPage = 0
      this.initialized = false
      this.visibleShelves = []

      this.initSizeData()
      if (this.user) {
        await this.loadPage(0)
        var lastBookIndex = Math.min(this.totalEntities, this.shelvesPerPage * this.entitiesPerShelf)
        
        // Set visible shelves before mounting entities
        this.updateVisibleShelves(0)
        await this.$nextTick()
        
        this.mountEntites(0, lastBookIndex)
      } else {
        // Local only
        // Set initial visible shelves for immediate render
        this.updateVisibleShelves(0)
      }
    },
    remountEntities() {
      // Remount when an entity is removed
      for (const key in this.entityComponentRefs) {
        if (this.entityComponentRefs[key]) {
          this.entityComponentRefs[key].destroy()
        }
      }
      this.entityComponentRefs = {}
      this.entityIndexesMounted.forEach((i) => {
        this.cardsHelpers.mountEntityCard(i)
      })
    },
    initSizeData() {
      var bookshelf = document.getElementById('bookshelf')
      if (!bookshelf) {
        console.error('Failed to init size data')
        return
      }
      var entitiesPerShelfBefore = this.entitiesPerShelf

      var { clientHeight, clientWidth } = bookshelf
      
      // Check if we have valid dimensions
      if (!clientHeight || !clientWidth) {
        console.error('[LazyBookshelf] Invalid bookshelf dimensions:', clientHeight, clientWidth)
        // Try again after a delay
        setTimeout(() => this.initSizeData(), 100)
        return
      }
      
      this.bookshelfHeight = clientHeight
      this.bookshelfWidth = clientWidth
      this.entitiesPerShelf = Math.max(1, this.showBookshelfListView ? 1 : Math.floor((this.bookshelfWidth - 16) / this.totalEntityCardWidth))
      this.shelvesPerPage = Math.ceil(this.bookshelfHeight / this.shelfHeight) + 2
      this.bookshelfMarginLeft = (this.bookshelfWidth - this.entitiesPerShelf * this.totalEntityCardWidth) / 2

      const entitiesPerPage = this.shelvesPerPage * this.entitiesPerShelf
      // Use larger fetch size for series and authors to improve scrolling experience
      if (this.page === 'series' || this.page === 'authors') {
        this.booksPerFetch = 200
      } else {
        this.booksPerFetch = Math.ceil(entitiesPerPage / 20) * 20
      } // Round up to the nearest 20

      console.log('[LazyBookshelf] Size data - Height:', this.bookshelfHeight, 'Width:', this.bookshelfWidth, 'Entities per shelf:', this.entitiesPerShelf, 'Shelves per page:', this.shelvesPerPage)
      console.log('[LazyBookshelf] Additional info - Shelf height:', this.shelfHeight, 'Entity width:', this.entityWidth, 'Entity height:', this.entityHeight, 'Total entity card width:', this.totalEntityCardWidth)
      console.log('[LazyBookshelf] Book dimensions - Width:', this.bookWidth, 'Height:', this.bookHeight, 'Aspect ratio:', this.bookCoverAspectRatio)
      console.log('[LazyBookshelf] Page type:', this.page, 'Entity name:', this.entityName)

      if (this.totalEntities) {
        this.totalShelves = Math.ceil(this.totalEntities / this.entitiesPerShelf)
      }
      
      // Force recalculation of shelf positions if entities per shelf changed
      if (entitiesPerShelfBefore !== this.entitiesPerShelf && this.initialized) {
        console.log('[LazyBookshelf] Entities per shelf changed from', entitiesPerShelfBefore, 'to', this.entitiesPerShelf, '- remounting entities')
        this.remountEntities()
      }
      
      return entitiesPerShelfBefore < this.entitiesPerShelf // Books per shelf has changed
    },
    async init() {
      if (this.isFirstInit) return
      if (!this.user) {
        // Offline support not available
        await this.resetEntities()
        this.$eventBus.$emit('bookshelf-total-entities', 0)
        return
      }

      this.localLibraryItems = await this.$db.getLocalLibraryItems(this.currentLibraryMediaType)
      console.log('Local library items loaded for lazy bookshelf', this.localLibraryItems.length)

      this.isFirstInit = true
      
      // Initialize size data - retry if dimensions are not ready
      const maxRetries = 10
      let retries = 0
      while (retries < maxRetries) {
        this.initSizeData()
        if (this.bookshelfHeight > 0 && this.bookshelfWidth > 0) {
          break
        }
        await new Promise(resolve => setTimeout(resolve, 100))
        retries++
      }
      
      if (this.bookshelfHeight === 0 || this.bookshelfWidth === 0) {
        console.error('[LazyBookshelf] Failed to get valid bookshelf dimensions after retries')
        return
      }
      
      await this.loadPage(0)
      var lastBookIndex = Math.min(this.totalEntities, this.shelvesPerPage * this.entitiesPerShelf)
      console.log('[LazyBookshelf] init - Total entities:', this.totalEntities, 'Last book index:', lastBookIndex, 'Total shelves:', this.totalShelves)
      console.log('[LazyBookshelf] About to mount entities. Shelves per page:', this.shelvesPerPage, 'Entities per shelf:', this.entitiesPerShelf)
      
      // Initialize visible shelves
      this.updateVisibleShelves(0)
      
      // Wait for Vue to render the shelf elements before mounting cards
      await this.$nextTick()
      
      this.mountEntites(0, lastBookIndex)

      // Set last scroll position for this bookshelf page
      if (this.$store.state.lastBookshelfScrollData[this.page] && this.$refs.bookshelf) {
        const { path, scrollTop } = this.$store.state.lastBookshelfScrollData[this.page]
        if (path === this.routeFullPath) {
          // Exact path match with query so use scroll position
          this.$refs.bookshelf.scrollTop = scrollTop
        }
      }
    },
    scroll(e) {
      if (!e || !e.target) return
      if (!this.user) return
      var { scrollTop } = e.target
      
      // Throttle scroll events
      if (this.scrollTimeout) {
        clearTimeout(this.scrollTimeout)
      }
      
      // Only handle scroll if position changed significantly (more than 50px)
      const scrollDiff = Math.abs(scrollTop - this.lastScrollTop)
      if (scrollDiff < 50 && this.isScrolling) {
        return
      }
      
      this.isScrolling = true
      this.scrollTimeout = setTimeout(() => {
        this.isScrolling = false
      }, 150)
      
      this.lastScrollTop = scrollTop
      console.log('[LazyBookshelf] Scroll event - scrollTop:', scrollTop, 'diff:', scrollDiff)
      this.handleScroll(scrollTop)
    },
    buildSearchParams() {
      if (this.page === 'search' || this.page === 'collections') {
        return ''
      } else if (this.page === 'series' || this.page === 'authors') {
        // Sort by name ascending for series and authors
        let searchParams = new URLSearchParams()
        searchParams.set('sort', 'name')
        searchParams.set('desc', 0)
        // Don't add minified here as it's added in the query string already
        return searchParams.toString()
      }

      let searchParams = new URLSearchParams()
      if (this.page === 'series-books') {
        searchParams.set('filter', `series.${this.$encode(this.seriesId)}`)
        if (this.collapseBookSeries) {
          searchParams.set('collapseseries', 1)
        }
      } else {
        if (this.filterBy && this.filterBy !== 'all') {
          searchParams.set('filter', this.filterBy)
        }
        if (this.orderBy) {
          searchParams.set('sort', this.orderBy)
          searchParams.set('desc', this.orderDesc ? 1 : 0)
        }
        if (this.collapseSeries) {
          searchParams.set('collapseseries', 1)
        }
      }
      return searchParams.toString()
    },
    checkUpdateSearchParams() {
      const newSearchParams = this.buildSearchParams()
      let currentQueryString = window.location.search
      if (currentQueryString && currentQueryString.startsWith('?')) currentQueryString = currentQueryString.slice(1)

      if (newSearchParams === '' && !currentQueryString) {
        return false
      }
      if (newSearchParams !== this.currentSFQueryString || newSearchParams !== currentQueryString) {
        const queryString = newSearchParams ? `?${newSearchParams}` : ''
        let newurl = window.location.protocol + '//' + window.location.host + window.location.pathname + queryString
        window.history.replaceState({ path: newurl }, '', newurl)

        this.routeFullPath = window.location.pathname + (window.location.search || '') // Update for saving scroll position
        return true
      }

      return false
    },
    settingsUpdated(settings) {
      const wasUpdated = this.checkUpdateSearchParams()
      if (wasUpdated) {
        this.resetEntities()
      }
    },
    libraryChanged() {
      if (this.currentLibraryMediaType !== 'book' && (this.page === 'series' || this.page === 'collections' || this.page === 'series-books')) {
        this.$router.replace('/bookshelf')
        return
      }

      if (this.hasFilter) {
        this.clearFilter()
      } else {
        this.resetEntities()
      }
    },
    libraryItemAdded(libraryItem) {
      console.log('libraryItem added', libraryItem)
      // TODO: Check if item would be on this shelf
      this.resetEntities()
    },
    libraryItemUpdated(libraryItem) {
      console.log('Item updated', libraryItem)
      if (this.entityName === 'books' || this.entityName === 'series-books') {
        // Find the entity by iterating through the object
        let foundIndex = -1
        for (const index in this.entities) {
          if (this.entities[index] && this.entities[index].id === libraryItem.id) {
            foundIndex = parseInt(index)
            break
          }
        }
        
        if (foundIndex >= 0) {
          this.entities[foundIndex] = libraryItem
          if (this.entityComponentRefs[foundIndex]) {
            this.entityComponentRefs[foundIndex].setEntity(libraryItem)

            if (this.isBookEntity) {
              var localLibraryItem = this.localLibraryItems.find((lli) => lli.libraryItemId == libraryItem.id)
              if (localLibraryItem) {
                this.entityComponentRefs[foundIndex].setLocalLibraryItem(localLibraryItem)
              }
            }
          }
        }
      }
    },
    libraryItemRemoved(libraryItem) {
      if (this.entityName === 'books' || this.entityName === 'series-books') {
        // Find and remove the entity from the object
        let foundIndex = -1
        for (const index in this.entities) {
          if (this.entities[index] && this.entities[index].id === libraryItem.id) {
            foundIndex = parseInt(index)
            break
          }
        }
        
        if (foundIndex >= 0) {
          delete this.entities[foundIndex]
          this.totalEntities = Math.max(0, this.totalEntities - 1)
          this.$eventBus.$emit('bookshelf-total-entities', this.totalEntities)
          // TODO: Implement executeRebuild if needed
          // this.executeRebuild()
        }
      }
    },
    libraryItemsAdded(libraryItems) {
      console.log('items added', libraryItems)
      // TODO: Check if item would be on this shelf
      this.resetEntities()
    },
    libraryItemsUpdated(libraryItems) {
      libraryItems.forEach((ab) => {
        this.libraryItemUpdated(ab)
      })
    },
    screenOrientationChange() {
      setTimeout(() => {
        console.log('LazyBookshelf Screen orientation change')
        this.resetEntities()
      }, 50)
    },
    initListeners() {
      const bookshelf = document.getElementById('bookshelf')
      if (bookshelf) {
        bookshelf.addEventListener('scroll', this.scroll)
      }

      this.$eventBus.$on('library-changed', this.libraryChanged)
      this.$eventBus.$on('user-settings', this.settingsUpdated)

      this.$socket.$on('item_updated', this.libraryItemUpdated)
      this.$socket.$on('item_added', this.libraryItemAdded)
      this.$socket.$on('item_removed', this.libraryItemRemoved)
      this.$socket.$on('items_updated', this.libraryItemsUpdated)
      this.$socket.$on('items_added', this.libraryItemsAdded)

      if (screen.orientation) {
        // Not available on ios
        screen.orientation.addEventListener('change', this.screenOrientationChange)
      } else {
        document.addEventListener('orientationchange', this.screenOrientationChange)
      }
    },
    removeListeners() {
      const bookshelf = document.getElementById('bookshelf')
      if (bookshelf) {
        bookshelf.removeEventListener('scroll', this.scroll)
      }

      this.$eventBus.$off('library-changed', this.libraryChanged)
      this.$eventBus.$off('user-settings', this.settingsUpdated)

      this.$socket.$off('item_updated', this.libraryItemUpdated)
      this.$socket.$off('item_added', this.libraryItemAdded)
      this.$socket.$off('item_removed', this.libraryItemRemoved)
      this.$socket.$off('items_updated', this.libraryItemsUpdated)
      this.$socket.$off('items_added', this.libraryItemsAdded)

      if (screen.orientation) {
        // Not available on ios
        screen.orientation.removeEventListener('change', this.screenOrientationChange)
      } else {
        document.removeEventListener('orientationchange', this.screenOrientationChange)
      }
    }
  },
  updated() {
    this.routeFullPath = window.location.pathname + (window.location.search || '')
  },
  mounted() {
    this.routeFullPath = window.location.pathname + (window.location.search || '')

    // Add a small delay to ensure the DOM is ready
    this.$nextTick(() => {
      console.log('[LazyBookshelf] Component mounted. Bookshelf element:', this.$refs.bookshelf)
      if (this.$refs.bookshelf) {
        const rect = this.$refs.bookshelf.getBoundingClientRect()
        console.log('[LazyBookshelf] Bookshelf dimensions:', rect.width, 'x', rect.height)
      }
      this.init()
      this.initListeners()
    })
  },
  beforeDestroy() {
    this.removeListeners()

    // Set bookshelf scroll position for specific bookshelf page and query
    if (this.$refs.bookshelf) {
      this.$store.commit('setLastBookshelfScrollData', { scrollTop: this.$refs.bookshelf.scrollTop || 0, path: this.routeFullPath, name: this.page })
    }
  }
}
</script>
