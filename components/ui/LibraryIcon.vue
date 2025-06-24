<template>
  <div :class="containerClasses" class="flex items-center justify-center">
    <span class="abs-icons" :class="iconClass" :data-icon="iconToUse" :aria-label="iconToUse"></span>
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
  mounted() {
    // With embedded font, no special loading is needed
    // The font is immediately available as base64 data
    
    // Only keep the iOS/Safari repaint fix if needed
    if (this.$capacitor?.platform === 'ios' || /Safari/.test(navigator.userAgent)) {
      const iconElement = this.$el.querySelector('.abs-icons')
      if (!iconElement) return
      
      // Force a repaint to ensure icon renders on iOS/Safari
      requestAnimationFrame(() => {
        iconElement.style.display = 'none'
        void iconElement.offsetHeight // Force reflow
        iconElement.style.display = ''
      })
    }
  }
}
</script>

<style scoped>
/* Embedded font definition */
@font-face {
  font-family: 'absicons';
  src: url(data:font/woff;base64,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) format('woff');
  font-weight: normal;
  font-style: normal;
  font-display: block;
}

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
  /* Ensure minimum size for icon visibility */
  min-width: 1em;
  min-height: 1em;
  /* Position relative for ::before positioning */
  position: relative;
  display: inline-block;
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

/* Ensure icon displays even before font loads */
.abs-icons::before {
  display: inline-block;
  font-style: normal;
  font-variant: normal;
  text-rendering: auto;
  -webkit-font-smoothing: antialiased;
}

</style>