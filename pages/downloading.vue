<template>
  <div class="w-full h-full py-6 px-4 overflow-y-auto">
    <div class="flex justify-between items-center mb-4">
      <p class="text-base text-fg">{{ $strings.HeaderDownloads }} ({{ downloadItemParts.length }})</p>
      <ui-btn v-if="hasFailedOrStuckDownloads" color="error" small @click="clearFailedDownloads">
        <span class="material-symbols text-lg mr-1">delete_sweep</span>
        <span class="text-sm">Clear Failed</span>
      </ui-btn>
    </div>

    <div v-if="!downloadItemParts.length" class="py-6 text-center text-lg">No download item parts</div>
    <template v-for="(itemPart, num) in downloadItemParts">
      <div :key="itemPart.id" class="w-full">
        <div class="flex">
          <div class="w-14">
            <span v-if="itemPart.failed" class="material-symbols text-error">error</span>
            <span v-else-if="itemPart.completed" class="material-symbols text-success">check_circle</span>
            <span v-else class="font-semibold text-fg">{{ Math.round(itemPart.progress) }}%</span>
          </div>
          <div class="flex-grow px-2">
            <p class="truncate" :class="itemPart.failed ? 'text-error' : ''">{{ itemPart.filename }}</p>
            <p v-if="isStuckDownload(itemPart)" class="text-xs text-warning">Download appears stuck</p>
          </div>
          <div v-if="itemPart.failed || isStuckDownload(itemPart)" class="pl-2">
            <ui-btn color="error" small @click="removeDownloadItem(itemPart.downloadItemId)">
              <span class="material-symbols text-lg">close</span>
            </ui-btn>
          </div>
        </div>

        <div v-if="num + 1 < downloadItemParts.length" class="flex border-t border-border my-3" />
      </div>
    </template>
  </div>
</template>

<script>
import { Dialog } from '@capacitor/dialog'

export default {
  data() {
    return {
      stuckThreshold: 60000 // 60 seconds without progress
    }
  },
  computed: {
    downloadItems() {
      return this.$store.state.globals.itemDownloads
    },
    downloadItemParts() {
      let parts = []
      this.downloadItems.forEach((di) => parts.push(...di.downloadItemParts))
      return parts
    },
    hasFailedOrStuckDownloads() {
      return this.downloadItemParts.some(part => part.failed || this.isStuckDownload(part))
    }
  },
  methods: {
    isStuckDownload(itemPart) {
      // Consider download stuck if:
      // 1. Not completed and not failed
      // 2. Progress is > 0 but < 100
      // 3. Last update was more than threshold ago (if we had timestamps)
      // For now, we'll consider > 90% progress but not completed as potentially stuck
      return !itemPart.completed && !itemPart.failed && itemPart.progress > 90 && itemPart.progress < 100
    },
    async removeDownloadItem(downloadItemId) {
      const { value } = await Dialog.confirm({
        title: 'Remove Download',
        message: 'Remove this download?',
        okButtonTitle: 'Remove'
      })
      if (!value) return

      try {
        // Remove from store
        this.$store.commit('globals/removeItemDownload', downloadItemId)
        
        // TODO: Add native cancelDownload method to AbsDownloader plugin
        // For now, removing from store will prevent UI from showing the download
        
        this.$toast.success('Download removed')
      } catch (error) {
        console.error('Failed to remove download:', error)
        this.$toast.error('Failed to remove download')
      }
    },
    async clearFailedDownloads() {
      const { value } = await Dialog.confirm({
        title: 'Clear Failed Downloads',
        message: 'Clear all failed and stuck downloads?',
        okButtonTitle: 'Clear'
      })
      if (!value) return

      try {
        const itemsToRemove = this.downloadItems.filter(item => {
          return item.downloadItemParts.some(part => part.failed || this.isStuckDownload(part))
        })

        for (const item of itemsToRemove) {
          this.$store.commit('globals/removeItemDownload', item.id)
          
          // TODO: Add native cancelDownload method to AbsDownloader plugin
        }
        
        this.$toast.success('Failed downloads cleared')
      } catch (error) {
        console.error('Failed to clear downloads:', error)
        this.$toast.error('Failed to clear downloads')
      }
    }
  },
  mounted() {},
  beforeDestroy() {}
}
</script>

