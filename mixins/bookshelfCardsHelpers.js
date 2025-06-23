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
        var instance = new ComponentClass({
          propsData: props,
          created() {
            // this.$on('edit', (entity) => {
            //   if (_this.editEntity) _this.editEntity(entity)
            // })
            // this.$on('select', (entity) => {
            //   if (_this.selectEntity) _this.selectEntity(entity)
            // })
          }
        })
        this.entityComponentRefs[index] = instance
        
        // Mount without element first
        instance.$mount()
        
        // Wait for next tick to ensure DOM is ready
        Vue.nextTick(() => {
          try {
            if (!instance.$el) {
              console.error('[ERROR] Component mounted but has no $el after nextTick', index)
              return
            }
            
            instance.$el.style.transform = `translate3d(${shelfOffsetX}px, ${shelfOffsetY}px, 0px)`
            instance.$el.classList.add('absolute', 'top-0', 'left-0')
            shelfEl.appendChild(instance.$el)

            if (entity) {
              instance.setEntity(entity)

              if (this.isBookEntity && !entity.isLocal) {
                var localLibraryItem = this.localLibraryItems.find(lli => lli.libraryItemId == entity.id)
                if (localLibraryItem) {
                  instance.setLocalLibraryItem(localLibraryItem)
                }
              }
            }
          } catch (innerError) {
            console.error('[ERROR] Failed inside nextTick for card:', index, innerError.message, innerError.stack)
          }
        }).catch(err => {
          console.error('[ERROR] Vue.nextTick promise rejected:', index, err)
        })
      } catch (error) {
        console.error('[ERROR] Failed to mount entity card:', index, error.message, error.stack)
      }
    },
  }
}