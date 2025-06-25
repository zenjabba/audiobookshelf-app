<template>
  <modals-modal v-model="show" :width="400" height="100%">
    <template #outer>
      <div class="absolute top-11 left-4 z-40">
        <p class="text-white text-2xl truncate">{{ $strings.HeaderDetails }}</p>
      </div>
    </template>

    <div class="w-full h-full overflow-hidden absolute top-0 left-0 flex items-center justify-center" @click="show = false">
      <div class="w-full overflow-x-hidden overflow-y-auto bg-primary rounded-lg border border-border p-2" style="max-height: 75%" @click.stop>
        <p class="mb-2">{{ mediaMetadata.title }}</p>

        <div v-if="size" class="text-sm mb-2">{{ $strings.LabelSize }}: {{ $bytesPretty(size) }}</div>

        <p class="mb-1 text-xs text-fg">ID: {{ _libraryItem.id }}</p>
      </div>
    </div>
  </modals-modal>
</template>

<script>
export default {
  props: {
    value: Boolean,
    libraryItem: {
      type: Object,
      default: () => {}
    }
  },
  data() {
    return {}
  },
  computed: {
    show: {
      get() {
        return this.value
      },
      set(val) {
        this.$emit('input', val)
      }
    },
    _libraryItem() {
      return this.libraryItem || {}
    },
    media() {
      return this._libraryItem.media || {}
    },
    mediaMetadata() {
      return this.media.metadata || {}
    },
    isLocal() {
      return this._libraryItem.isLocal || false
    },
    localLibraryItem() {
      if (this.isLocal) return this._libraryItem
      return this._libraryItem.localLibraryItem || null
    },
    size() {
      console.log('ItemDetailsModal - Computing size for:', this.mediaMetadata.title)
      console.log('ItemDetailsModal - Full libraryItem:', JSON.stringify(this._libraryItem, null, 2))
      console.log('ItemDetailsModal - isLocal:', this.isLocal)
      console.log('ItemDetailsModal - localLibraryItem:', this.localLibraryItem)
      
      // For downloaded items, calculate size from localFiles
      if (this.localLibraryItem && this.localLibraryItem.localFiles) {
        console.log('ItemDetailsModal - Using localFiles for size calculation')
        console.log('ItemDetailsModal - localFiles:', this.localLibraryItem.localFiles)
        let totalSize = 0
        for (let i = 0; i < this.localLibraryItem.localFiles.length; i++) {
          const fileSize = this.localLibraryItem.localFiles[i].size || 0
          console.log(`ItemDetailsModal - localFile[${i}] size:`, fileSize)
          totalSize += fileSize
        }
        console.log('ItemDetailsModal - Total size from localFiles:', totalSize)
        return totalSize
      }
      
      // For server items, use media.size if available
      console.log('ItemDetailsModal - media object:', JSON.stringify(this.media, null, 2))
      console.log('ItemDetailsModal - media.size:', this.media.size)
      if (this.media.size) {
        console.log('ItemDetailsModal - Using media.size:', this.media.size)
        return this.media.size
      }
      
      // If media.size is not available, calculate from audioFiles (for books)
      console.log('ItemDetailsModal - media.audioFiles:', this.media.audioFiles)
      if (this.media.audioFiles && this.media.audioFiles.length) {
        console.log('ItemDetailsModal - Calculating size from audioFiles')
        console.log('ItemDetailsModal - audioFiles array:', JSON.stringify(this.media.audioFiles, null, 2))
        let totalSize = 0
        for (let i = 0; i < this.media.audioFiles.length; i++) {
          const audioFile = this.media.audioFiles[i]
          console.log(`ItemDetailsModal - audioFile[${i}]:`, JSON.stringify(audioFile, null, 2))
          if (audioFile.metadata && audioFile.metadata.size) {
            console.log(`ItemDetailsModal - audioFile[${i}].metadata.size:`, audioFile.metadata.size)
            totalSize += audioFile.metadata.size
          } else {
            console.log(`ItemDetailsModal - audioFile[${i}] has no metadata.size`)
          }
        }
        console.log('ItemDetailsModal - Total size from audioFiles:', totalSize)
        return totalSize
      }
      
      // For podcasts, calculate from episodes
      console.log('ItemDetailsModal - media.episodes:', this.media.episodes)
      if (this.media.episodes && this.media.episodes.length) {
        console.log('ItemDetailsModal - Calculating size from episodes')
        let totalSize = 0
        for (let i = 0; i < this.media.episodes.length; i++) {
          const episodeSize = this.media.episodes[i].size || 0
          console.log(`ItemDetailsModal - episode[${i}] size:`, episodeSize)
          totalSize += episodeSize
        }
        console.log('ItemDetailsModal - Total size from episodes:', totalSize)
        return totalSize
      }
      
      console.log('ItemDetailsModal - No size data found, returning 0')
      return 0
    }
  },
  methods: {},
  mounted() {
    console.log('ItemDetailsModal - Component mounted')
    console.log('ItemDetailsModal - Initial libraryItem prop:', this.libraryItem)
  }
}
</script>
