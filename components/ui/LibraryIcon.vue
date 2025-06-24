<template>
  <div :class="containerClasses" class="flex items-center justify-center">
    <span class="abs-icons" :class="iconClass" :data-icon="iconToUse"></span>
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
      const classes = ['flex', 'items-center', 'justify-center']
      
      // Size classes
      classes.push(`h-${this.size}`)
      classes.push(`w-${this.size}`)
      classes.push(`min-w-${this.size}`)
      
      // Font size class
      classes.push(`text-${this.fontSize}`)
      
      return classes.join(' ')
    },
    iconClass() {
      // Build icon class explicitly
      return `icon-${this.iconToUse}`
    }
  },
  methods: {},
  mounted() {
    // Debug font loading issues with large libraries
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
              iconClass: this.iconClass
            })
          }
        }
      })
    }
  }
}
</script>

<style scoped>
/* Fallback for when icon font fails to load */
.abs-icons[data-icon="database"]:empty::before {
  content: "📚";
  font-family: inherit;
}

.abs-icons[data-icon="audiobookshelf"]:empty::before {
  content: "📖";
  font-family: inherit;
}

.abs-icons[data-icon="books-1"]:empty::before,
.abs-icons[data-icon="books-2"]:empty::before,
.abs-icons[data-icon="book-1"]:empty::before {
  content: "📚";
  font-family: inherit;
}

.abs-icons[data-icon="microphone-1"]:empty::before,
.abs-icons[data-icon="microphone-3"]:empty::before,
.abs-icons[data-icon="podcast"]:empty::before {
  content: "🎙️";
  font-family: inherit;
}

.abs-icons[data-icon="radio"]:empty::before {
  content: "📻";
  font-family: inherit;
}

.abs-icons[data-icon="rss"]:empty::before {
  content: "📡";
  font-family: inherit;
}

.abs-icons[data-icon="headphones"]:empty::before {
  content: "🎧";
  font-family: inherit;
}

.abs-icons[data-icon="music"]:empty::before {
  content: "🎵";
  font-family: inherit;
}

.abs-icons[data-icon="file-picture"]:empty::before {
  content: "🖼️";
  font-family: inherit;
}

.abs-icons[data-icon="rocket"]:empty::before {
  content: "🚀";
  font-family: inherit;
}

.abs-icons[data-icon="power"]:empty::before {
  content: "⚡";
  font-family: inherit;
}

.abs-icons[data-icon="star"]:empty::before {
  content: "⭐";
  font-family: inherit;
}

.abs-icons[data-icon="heart"]:empty::before {
  content: "❤️";
  font-family: inherit;
}
</style>