<script setup lang="ts">
import { ref } from 'vue'
import { img } from '../data/mock'
// Unsplash image with a quiet fallback tone when the network blocks it.
defineProps<{ id: string; w?: number; alt?: string }>()
const failed = ref(false)
</script>

<template>
  <div class="photo">
    <img v-if="!failed" :src="img(id, w)" :alt="alt ?? ''" loading="lazy" @error="failed = true" />
  </div>
</template>

<style scoped>
.photo { position: relative; overflow: hidden; background: linear-gradient(135deg, #2a3142, #161b26); }
.photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
</style>
