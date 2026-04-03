<script setup lang="ts">
defineProps<{
  msg: string
}>()
</script>

<template>
  <div>
    <h1 class="text-4xl font-bold text-gray-800">{{ msg }}</h1>
    <p class="mt-4 text-gray-500">NPCs with memory and skills.</p>
  </div>
</template>
