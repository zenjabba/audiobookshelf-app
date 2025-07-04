<template>
  <div ref="wrapper" :style="{ height: height + 'px', width: width + 'px' }" class="relative">
    <div v-if="noValidCovers" class="absolute top-0 left-0 w-full h-full flex items-center justify-center box-shadow-book" :style="{ padding: `${sizeMultiplier}rem` }">
      <p :style="{ fontSize: sizeMultiplier + 'rem' }">{{ name }}</p>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    id: String,
    name: String,
    bookItems: {
      type: Array,
      default: () => []
    },
    width: Number,
    height: Number,
    groupTo: String,
    bookCoverAspectRatio: Number
  },
  data() {
    return {
      noValidCovers: false,
      coverDiv: null,
      isHovering: false,
      coverWrapperEl: null,
      coverImageEls: [],
      coverWidth: 0,
      offsetIncrement: 0,
      isFannedOut: false,
      isDetached: false,
      isAttaching: false,
      isInit: false
    }
  },
  watch: {
    bookItems: {
      immediate: true,
      handler(newVal) {
        if (newVal) {
          // ensure wrapper is initialized
          this.$nextTick(this.init)
        }
      }
    }
  },
  computed: {
    sizeMultiplier() {
      if (this.bookCoverAspectRatio === 1) return this.width / (120 * 1.6 * 2)
      return this.width / 240
    },
    store() {
      return this.$store || this.$nuxt.$store
    },
    router() {
      return this.$router || this.$nuxt.$router
    }
  },
  methods: {
    getCoverUrl(book) {
      // Handle case where book might just be an ID string or a book object without full data
      if (typeof book === 'string') {
        // If book is just an ID, use the ID-based cover getter
        return this.store.getters['globals/getLibraryItemCoverSrcById'](book)
      } else if (book && book.id && (!book.media || !book.media.coverPath)) {
        // If book has an ID but no media data, use the ID-based getter
        return this.store.getters['globals/getLibraryItemCoverSrcById'](book.id)
      }
      // Otherwise use the normal getter
      return this.store.getters['globals/getLibraryItemCoverSrc'](book, '')
    },
    async buildCoverImg(coverData, bgCoverWidth, offsetLeft, zIndex, forceCoverBg = false) {
      var src = coverData.coverUrl

      var showCoverBg =
        forceCoverBg ||
        (await new Promise((resolve) => {
          var image = new Image()

          image.onload = () => {
            var { naturalWidth, naturalHeight } = image
            var aspectRatio = naturalHeight / naturalWidth
            var arDiff = Math.abs(aspectRatio - this.bookCoverAspectRatio)

            // If image aspect ratio is <= 1.45 or >= 1.75 then use cover bg, otherwise stretch to fit
            if (arDiff > 0.15) {
              resolve(true)
            } else {
              resolve(false)
            }
          }
          image.onerror = (err) => {
            console.error(err)
            resolve(false)
          }
          image.src = src
        }))

      var imgdiv = document.createElement('div')
      imgdiv.style.height = this.height + 'px'
      imgdiv.style.width = bgCoverWidth + 'px'
      imgdiv.style.left = offsetLeft + 'px'
      imgdiv.style.zIndex = zIndex
      imgdiv.dataset.audiobookId = coverData.id
      imgdiv.dataset.volumeNumber = coverData.volumeNumber || ''
      imgdiv.className = 'absolute top-0 box-shadow-book transition-transform'
      imgdiv.style.boxShadow = '4px 0px 4px #11111166'
      // imgdiv.style.transform = 'skew(0deg, 15deg)'

      if (showCoverBg) {
        var coverbgwrapper = document.createElement('div')
        coverbgwrapper.className = 'absolute top-0 left-0 w-full h-full overflow-hidden rounded-sm bg-primary'

        var coverbg = document.createElement('div')
        coverbg.className = 'absolute cover-bg'
        coverbg.style.backgroundImage = `url("${src}")`

        coverbgwrapper.appendChild(coverbg)
        imgdiv.appendChild(coverbgwrapper)
      }

      var img = document.createElement('img')
      img.src = src
      img.className = 'absolute top-0 left-0 w-full h-full'
      img.style.objectFit = showCoverBg ? 'contain' : 'cover'

      imgdiv.appendChild(img)
      return imgdiv
    },
    createSeriesNameCover(offsetLeft) {
      var imgdiv = document.createElement('div')
      imgdiv.style.height = this.height + 'px'
      imgdiv.style.width = this.height / this.bookCoverAspectRatio + 'px'
      imgdiv.style.left = offsetLeft + 'px'
      imgdiv.className = 'absolute top-0 box-shadow-book transition-transform flex items-center justify-center'
      imgdiv.style.boxShadow = '4px 0px 4px #11111166'
      imgdiv.style.backgroundColor = '#111'

      var innerP = document.createElement('p')
      innerP.textContent = this.name
      innerP.className = 'text-smtext-white'
      imgdiv.appendChild(innerP)

      return imgdiv
    },
    async init() {
      if (this.isInit) return
      this.isInit = true

      if (this.coverDiv) {
        this.coverDiv.remove()
        this.coverDiv = null
      }
      
      // Debug log book items for series covers
      if (this.name && this.bookItems.length > 0) {
        console.log(`[GroupCover] Series "${this.name}" book items:`, this.bookItems.slice(0, 3).map(b => typeof b === 'string' ? b : b.id))
      }
      
      var validCovers = this.bookItems
        .map((bookItem) => {
          // Handle both string IDs and book objects
          const id = typeof bookItem === 'string' ? bookItem : bookItem.id
          return {
            id: id,
            coverUrl: this.getCoverUrl(bookItem)
          }
        })
        .filter((b) => b.coverUrl && b.coverUrl !== '')
      if (!validCovers.length) {
        this.noValidCovers = true
        return
      }
      this.noValidCovers = false

      validCovers = validCovers.slice(0, 10)

      var coverWidth = this.width
      var widthPer = this.width
      if (validCovers.length > 1) {
        coverWidth = this.height / this.bookCoverAspectRatio
        widthPer = (this.width - coverWidth) / (validCovers.length - 1)
      }
      this.coverWidth = coverWidth
      this.offsetIncrement = widthPer

      var outerdiv = document.createElement('div')
      outerdiv.id = `group-cover-${this.id}`
      this.coverWrapperEl = outerdiv
      outerdiv.className = 'w-full h-full relative box-shadow-book'

      var coverImageEls = []
      var offsetLeft = 0
      for (let i = 0; i < validCovers.length; i++) {
        offsetLeft = widthPer * i
        var zIndex = validCovers.length - i
        var img = await this.buildCoverImg(validCovers[i], coverWidth, offsetLeft, zIndex, validCovers.length === 1)
        outerdiv.appendChild(img)
        coverImageEls.push(img)
      }

      this.coverImageEls = coverImageEls

      if (this.$refs.wrapper) {
        this.coverDiv = outerdiv
        this.$refs.wrapper.appendChild(outerdiv)
      }
    }
  },
  mounted() {},
  beforeDestroy() {
    if (this.coverWrapperEl) this.coverWrapperEl.remove()
    if (this.coverImageEls && this.coverImageEls.length) {
      this.coverImageEls.forEach((el) => el.remove())
    }
    if (this.coverDiv) this.coverDiv.remove()
  }
}
</script>
