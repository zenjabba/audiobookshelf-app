import Vue from 'vue'
import LazyBookCard from '@/components/cards/LazyBookCard'
import LazyListBookCard from '@/components/cards/LazyListBookCard'
import LazySeriesCard from '@/components/cards/LazySeriesCard'
import LazyCollectionCard from '@/components/cards/LazyCollectionCard'
import LazyPlaylistCard from '@/components/cards/LazyPlaylistCard'

export default {
  data() {
    return {
      cardsHelpers: {
        mountEntityCard: this.mountEntityCard
      }
    }
  },
  methods: {
    getComponentClass() {
      if (this.entityName === 'series') return Vue.extend(LazySeriesCard)
      if (this.entityName === 'collections') return Vue.extend(LazyCollectionCard)
      if (this.entityName === 'playlists') return Vue.extend(LazyPlaylistCard)
      if (this.showBookshelfListView) return Vue.extend(LazyListBookCard)
      return Vue.extend(LazyBookCard)
    },
    async mountEntityCard(index) {
      var shelf = Math.floor(index / this.entitiesPerShelf)
      var shelfEl = document.getElementById(`shelf-${shelf}`)
      console.log('[mountEntityCard] Mounting card', index, 'on shelf', shelf, 'shelfEl exists:', !!shelfEl)
      if (!shelfEl) {
        console.error('[ERROR] mount entity card invalid shelf', shelf, 'book index', index)
        console.error('[ERROR] Available shelves:', Array.from(document.querySelectorAll('[id^="shelf-"]')).map(el => el.id))
        return
      }
      const entity = this.entities[index]
      if (!entity) {
        console.error('[ERROR] No entity at index', index, 'Total entities:', this.entities.length)
        return
      }
      console.log('[mountEntityCard] Entity at index', index, ':', entity.media?.metadata?.title || 'No title')
      this.entityIndexesMounted.push(index)
      if (this.entityComponentRefs[index]) {
        var bookComponent = this.entityComponentRefs[index]
        shelfEl.appendChild(bookComponent.$el)
        bookComponent.setSelectionMode(false)
        bookComponent.isHovering = false
        return
      }
      var shelfOffsetY = this.showBookshelfListView ? 8 : this.isBookEntity ? 24 : 16
      var row = index % this.entitiesPerShelf

      var marginShiftLeft = this.showBookshelfListView ? 0 : 12
      var shelfOffsetX = row * this.totalEntityCardWidth + this.bookshelfMarginLeft + marginShiftLeft

      var ComponentClass = this.getComponentClass()
      var props = {
        index,
        width: this.entityWidth,
        height: this.entityHeight,
        bookCoverAspectRatio: this.bookCoverAspectRatio,
        isAltViewEnabled: this.altViewEnabled
      }
      if (this.entityName === 'series-books') props.showSequence = true
      if (this.entityName === 'books') {
        props.filterBy = this.filterBy
        props.orderBy = this.orderBy
        props.sortingIgnorePrefix = !!this.sortingIgnorePrefix
      }

      // var _this = this
      try {
        console.log('[DEBUG] Creating container for card', index, 'shelfOffsetX:', shelfOffsetX, 'shelfOffsetY:', shelfOffsetY)
        // Create a container div for the component
        var containerEl = document.createElement('div')
        containerEl.id = `book-card-${index}`
        containerEl.style.position = 'absolute'
        containerEl.style.transform = `translate3d(${shelfOffsetX}px, ${shelfOffsetY}px, 0px)`
        
        console.log('[DEBUG] Creating Vue instance for card', index)
        var instance = new ComponentClass({
          parent: this,
          propsData: props,
          created() {
            console.log('[DEBUG] Vue instance created for card', index)
            // this.$on('edit', (entity) => {
            //   if (_this.editEntity) _this.editEntity(entity)
            // })
            // this.$on('select', (entity) => {
            //   if (_this.selectEntity) _this.selectEntity(entity)
            // })
          }
        })
        this.entityComponentRefs[index] = instance
        
        console.log('[DEBUG] Appending container to shelf for card', index)
        // Append container to shelf first
        shelfEl.appendChild(containerEl)
        
        console.log('[DEBUG] Mounting Vue instance for card', index)
        // Mount the instance
        instance.$mount()
        
        console.log('[DEBUG] Setting position styles on mounted element for card', index)
        // Apply positioning to the mounted element
        if (instance.$el) {
          instance.$el.id = `book-card-${index}`
          instance.$el.style.position = 'absolute'
          instance.$el.style.transform = `translate3d(${shelfOffsetX}px, ${shelfOffsetY}px, 0px)`
        }
        
        // Replace container with the actual component element
        containerEl.parentNode.replaceChild(instance.$el, containerEl)
        
        console.log('[DEBUG] Vue instance mounted, checking $el for card', index, '- $el exists:', !!instance.$el)
        
        if (!instance.$el) {
          console.error('[ERROR] No $el after mounting for card', index)
        }
        
        if (entity) {
          console.log('[DEBUG] Setting entity for card', index)
          try {
            instance.setEntity(entity)
          } catch (setEntityError) {
            console.error('[ERROR] Failed to setEntity for card', index, setEntityError.message, setEntityError.stack)
          }

          if (this.isBookEntity && !entity.isLocal) {
            var localLibraryItem = this.localLibraryItems.find(lli => lli.libraryItemId == entity.id)
            if (localLibraryItem) {
              console.log('[DEBUG] Setting local library item for card', index)
              try {
                instance.setLocalLibraryItem(localLibraryItem)
              } catch (setLocalError) {
                console.error('[ERROR] Failed to setLocalLibraryItem for card', index, setLocalError.message, setLocalError.stack)
              }
            }
          }
        }
        console.log('[DEBUG] Successfully mounted card', index)
      } catch (error) {
        console.error('[ERROR] Failed to mount entity card:', index)
        console.error('[ERROR] Error message:', error.message || 'No message')
        console.error('[ERROR] Error stack:', error.stack || 'No stack trace')
        console.error('[ERROR] Error type:', typeof error)
        console.error('[ERROR] Error constructor:', error.constructor?.name || 'Unknown')
        console.error('[ERROR] Error keys:', Object.keys(error || {}))
        try {
          console.error('[ERROR] Error stringified:', JSON.stringify(error))
        } catch (stringifyError) {
          console.error('[ERROR] Could not stringify error:', stringifyError.message)
        }
      }
    },
  }
}