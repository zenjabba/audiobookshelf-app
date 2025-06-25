<template>
  <bookshelf-lazy-bookshelf page="authors" />
</template>

<script>
export default {
  asyncData({ store, redirect }) {
    if (!store.state.user.user) {
      return redirect('/bookshelf')
    }
  }
}
</script>