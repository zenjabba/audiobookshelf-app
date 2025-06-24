<template>
  <div :class="containerClasses" class="flex items-center justify-center">
    <span class="abs-icons" :class="iconClass" :data-icon="iconToUse">&nbsp;</span>
  </div>
</template>

<script>
export default {
  props: {
    icon: {
      type: String,
      default: 'audiobookshelf'
    },
    fontSize: {
      type: String,
      default: 'lg'
    },
    size: {
      type: Number,
      default: 5
    }
  },
  data() {
    return {}
  },
  computed: {
    iconToUse() {
      // Ensure icons array exists before checking
      if (!this.icons || !Array.isArray(this.icons)) {
        console.warn('[LibraryIcon] Icons array not available, using default')
        return this.icon || 'audiobookshelf'
      }
      return this.icons.includes(this.icon) ? this.icon : 'audiobookshelf'
    },
    icons() {
      // Provide fallback if store state is not initialized
      return this.$store.state.globals?.libraryIcons || ['database', 'audiobookshelf', 'books-1', 'books-2', 'book-1', 'microphone-1', 'microphone-3', 'radio', 'podcast', 'rss', 'headphones', 'music', 'file-picture', 'rocket', 'power', 'star', 'heart']
    },
    containerClasses() {
      // Build classes explicitly to avoid dynamic class issues
      const baseClasses = 'flex items-center justify-center'
      
      // Size classes - use explicit mapping to avoid Tailwind purging
      const sizeMap = {
        3: 'h-3 w-3 min-w-3',
        4: 'h-4 w-4 min-w-4',
        5: 'h-5 w-5 min-w-5',
        6: 'h-6 w-6 min-w-6',
        8: 'h-8 w-8 min-w-8',
        10: 'h-10 w-10 min-w-10'
      }
      
      // Font size class mapping
      const fontSizeMap = {
        'xs': 'text-xs',
        'sm': 'text-sm',
        'base': 'text-base',
        'lg': 'text-lg',
        'xl': 'text-xl',
        '2xl': 'text-2xl'
      }
      
      const sizeClasses = sizeMap[this.size] || 'h-5 w-5 min-w-5'
      const fontSizeClass = fontSizeMap[this.fontSize] || 'text-lg'
      
      return `${baseClasses} ${sizeClasses} ${fontSizeClass}`
    },
    iconClass() {
      // Build icon class explicitly
      return `icon-${this.iconToUse}`
    }
  },
  methods: {},
  async mounted() {
    // Check if Font Loading API is available and font needs loading
    if ('fonts' in document) {
      try {
        // Check if font is already loaded
        const fontLoaded = await document.fonts.check('1em absicons')
        
        if (!fontLoaded) {
          // Try to load the font
          await document.fonts.load('1em absicons')
          
          // Add a class to indicate font is loaded
          const iconElement = this.$el.querySelector('.abs-icons')
          if (iconElement) {
            iconElement.classList.add('font-loaded')
          }
        }
      } catch (error) {
        console.error('[LibraryIcon] Font loading error:', error)
      }
    }
    
    // Force font load on iOS with a different approach
    if (this.$capacitor?.platform === 'ios' || this.$capacitor?.platform === 'web') {
      // Create a temporary element to force font loading
      const tempEl = document.createElement('span')
      tempEl.style.position = 'absolute'
      tempEl.style.left = '-9999px'
      tempEl.style.fontFamily = 'absicons'
      tempEl.innerHTML = '&#xe906;' // database icon using HTML entity
      document.body.appendChild(tempEl)
      
      // Force a reflow
      void tempEl.offsetHeight
      
      // Remove after a short delay
      setTimeout(() => {
        if (tempEl.parentNode) {
          document.body.removeChild(tempEl)
        }
      }, 100)
    }
    
    // Debug font loading issues
    if (process.env.NODE_ENV !== 'production') {
      this.$nextTick(() => {
        const iconElement = this.$el.querySelector('.abs-icons')
        if (iconElement) {
          const computedStyle = window.getComputedStyle(iconElement)
          const fontFamily = computedStyle.fontFamily
          if (!fontFamily.includes('absicons')) {
            console.error('[LibraryIcon] Font not loaded correctly:', {
              fontFamily,
              icon: this.icon,
              iconToUse: this.iconToUse,
              iconClass: this.iconClass,
              platform: this.$capacitor?.platform
            })
          }
        }
      })
    }
  }
}
</script>

<style scoped>
/* Force icon font to be used */
.abs-icons {
  font-family: 'absicons' !important;
  speak: none;
  font-style: normal;
  font-weight: normal;
  font-variant: normal;
  text-transform: none;
  line-height: 1;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Icon content definitions - duplicate from absicons.css for reliability */
.abs-icons.icon-database::before {
  content: "\e906";
}

.abs-icons.icon-audiobookshelf::before {
  content: "\e900";
}

.abs-icons.icon-books-1::before {
  content: "\e905";
}

.abs-icons.icon-books-2::before {
  content: "\e920";
}

.abs-icons.icon-book-1::before {
  content: "\e91f";
}

.abs-icons.icon-microphone-1::before {
  content: "\e902";
}

.abs-icons.icon-microphone-3::before {
  content: "\e91e";
}

.abs-icons.icon-radio::before {
  content: "\e903";
}

.abs-icons.icon-podcast::before {
  content: "\e904";
}

.abs-icons.icon-rss::before {
  content: "\ea9b";
}

.abs-icons.icon-headphones::before {
  content: "\e910";
}

.abs-icons.icon-music::before {
  content: "\e911";
}

.abs-icons.icon-file-picture::before {
  content: "\e927";
}

.abs-icons.icon-rocket::before {
  content: "\e9a5";
}

.abs-icons.icon-power::before {
  content: "\e9b5";
}

.abs-icons.icon-star::before {
  content: "\e9d9";
}

.abs-icons.icon-heart::before {
  content: "\e9da";
}

</style>