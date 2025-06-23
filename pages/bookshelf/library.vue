<template>
  <div class="w-full h-full min-h-full relative">
    <!-- Always use lazy bookshelf which has grid view and virtual scrolling -->
    <bookshelf-lazy-bookshelf page="books" />
  </div>
</template>

<script>
export default {
  async asyncData({ store, params, query }) {
    // Set filter by
    if (query.filter) {
      await store.dispatch('user/updateUserSettings', { mobileFilterBy: query.filter })
    }
  }
}
</script>
