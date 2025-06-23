const { BookCoverAspectRatio } = require('../plugins/constants')

export const state = () => ({
  libraries: [],
  lastLoad: 0,
  currentLibraryId: '',
  showModal: false,
  issues: 0,
  filterData: null,
  numUserPlaylists: 0,
  ereaderDevices: []
})

export const getters = {
  getCurrentLibrary: state => {
    return state.libraries.find(lib => lib.id === state.currentLibraryId)
  },
  getCurrentLibraryName: (state, getters) => {
    return getters.getCurrentLibrary?.name || null
  },
  getCurrentLibraryMediaType: (state, getters) => {
    return getters.getCurrentLibrary?.mediaType || null
  },
  getCurrentLibrarySettings: (state, getters) => {
    return getters.getCurrentLibrary?.settings || null
  },
  getBookCoverAspectRatio: (state, getters) => {
    if (isNaN(getters.getCurrentLibrarySettings?.coverAspectRatio)) return 1
    return getters.getCurrentLibrarySettings.coverAspectRatio === BookCoverAspectRatio.STANDARD ? 1.6 : 1
  },
  getLibraryIsAudiobooksOnly: (state, getters) => {
    return !!getters.getCurrentLibrarySettings?.audiobooksOnly
  }
}

export const actions = {
  async fetch({ state, commit, dispatch, rootState }, libraryId) {
    if (!rootState.user || !rootState.user.user) {
      console.error('libraries/fetch - User not set')
      return false
    }

    return this.$nativeHttp
      .get(`/api/libraries/${libraryId}?include=filterdata`)
      .then(async (data) => {
        const library = data.library
        const filterData = data.filterdata
        const issues = data.issues || 0
        const numUserPlaylists = data.numUserPlaylists || 0

        dispatch('user/checkUpdateLibrarySortFilter', library.mediaType, { root: true })

        commit('addUpdate', library)
        commit('setLibraryIssues', issues)
        commit('setLibraryFilterData', filterData)
        commit('setNumUserPlaylists', numUserPlaylists)
        
        // Use the new action to set library and start sync if needed
        await dispatch('setCurrentLibraryWithSync', libraryId)
        
        return data
      })
      .catch((error) => {
        console.error('Failed', error)
        return false
      })
  },
  // Return true if calling load
  async load({ state, commit, dispatch, rootState }) {
    if (!rootState.user || !rootState.user.user) {
      console.error('libraries/load - User not set')
      return false
    }

    // Don't load again if already loaded in the last 5 minutes
    var lastLoadDiff = Date.now() - state.lastLoad
    if (lastLoadDiff < 5 * 60 * 1000) {
      // Already up to date
      return false
    }

    return this.$nativeHttp
      .get(`/api/libraries`)
      .then(async (data) => {
        // TODO: Server release 2.2.9 changed response to an object. Remove after a few releases
        const libraries = data.libraries || data

        // Set current library if not already set or was not returned in results
        if (libraries.length && (!state.currentLibraryId || !libraries.find(li => li.id == state.currentLibraryId))) {
          await dispatch('setCurrentLibraryWithSync', libraries[0].id)
        }

        commit('set', libraries)
        commit('setLastLoad', Date.now())
        return true
      })
      .catch((error) => {
        console.error('Failed', error)
        commit('set', [])
        return false
      })
  },
  
  // Set current library and start metadata sync if needed
  async setCurrentLibraryWithSync({ commit, rootState }, libraryId) {
    commit('setCurrentLibrary', libraryId)
    
    // Start metadata sync for large libraries
    if (libraryId && rootState.networkConnected) {
      try {
        const response = await this.$nativeHttp.get(
          `/api/libraries/${libraryId}/stats`,
          { connectTimeout: 5000 }
        )
        
        if (response && response.totalItems > 5000) {
          console.log(`[libraries] Starting metadata sync for large library (${response.totalItems} items)`)
          this.$db.syncLibraryMetadata(libraryId, false).catch(error => {
            console.error('[libraries] Background sync failed:', error)
          })
        }
      } catch (error) {
        // Ignore errors, sync is optional optimization
        console.log('[libraries] Could not check library size for sync')
      }
    }
  }
}

export const mutations = {
  setShowModal(state, val) {
    state.showModal = val
  },
  setLastLoad(state, val) {
    state.lastLoad = val
  },
  reset(state) {
    state.lastLoad = 0
    state.currentLibraryId = null
    state.libraries = []
  },
  setCurrentLibrary(state, val) {
    state.currentLibraryId = val
  },
  set(state, libraries) {
    state.libraries = libraries
  },
  addUpdate(state, library) {
    var index = state.libraries.findIndex(a => a.id === library.id)
    if (index >= 0) {
      state.libraries.splice(index, 1, library)
    } else {
      state.libraries.push(library)
    }
  },
  remove(state, library) {
    state.libraries = state.libraries.filter(a => a.id !== library.id)
  },
  setLibraryIssues(state, val) {
    state.issues = val
  },
  setNumUserPlaylists(state, numUserPlaylists) {
    state.numUserPlaylists = numUserPlaylists
  },
  setLibraryFilterData(state, filterData) {
    state.filterData = filterData
  },
  updateFilterDataWithAudiobook(state, audiobook) {
    if (!audiobook || !audiobook.book || !state.filterData) return
    if (state.currentLibraryId !== audiobook.libraryId) return
    /*
    var filterdata = {
      authors: [],
      genres: [],
      tags: [],
      series: [],
      narrators: []
    }
    */

    if (audiobook.book.authorFL) {
      audiobook.book.authorFL.split(', ').forEach((author) => {
        if (author && !state.filterData.authors.includes(author)) {
          state.filterData.authors.push(author)
        }
      })
    }
    if (audiobook.book.narratorFL) {
      audiobook.book.narratorFL.split(', ').forEach((narrator) => {
        if (narrator && !state.filterData.narrators.includes(narrator)) {
          state.filterData.narrators.push(narrator)
        }
      })
    }
    if (audiobook.book.series && !state.filterData.series.includes(audiobook.book.series)) {
      state.filterData.series.push(audiobook.book.series)
    }
    if (audiobook.tags && audiobook.tags.length) {
      audiobook.tags.forEach((tag) => {
        if (tag && !state.filterData.tags.includes(tag)) state.filterData.tags.push(tag)
      })
    }
    if (audiobook.book.genres && audiobook.book.genres.length) {
      audiobook.book.genres.forEach((genre) => {
        if (genre && !state.filterData.genres.includes(genre)) state.filterData.genres.push(genre)
      })
    }
  },
  setEReaderDevices(state, ereaderDevices) {
    state.ereaderDevices = ereaderDevices
  }
}