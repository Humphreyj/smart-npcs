<script setup lang="ts">
import type { NPC } from '~/server/data/npcs'

defineProps<{
  npc: Omit<NPC, 'systemPrompt'>
}>()
</script>

<template>
  <NuxtLink
    :to="`/chat/${npc.id}`"
    class="group block bg-stone-900 border border-stone-700 rounded-lg p-5 hover:border-amber-700 hover:bg-stone-800 transition-all duration-200 cursor-pointer"
  >
    <!-- Header -->
    <div class="flex items-start gap-3 mb-3">
      <div
        class="flex-shrink-0 w-10 h-10 rounded-full bg-amber-900/60 border border-amber-700/50 flex items-center justify-center text-amber-300 font-serif font-bold text-lg group-hover:border-amber-500 transition-colors"
      >
        {{ npc.name.charAt(0) }}
      </div>
      <div>
        <h3 class="text-amber-300 font-serif font-semibold text-base leading-tight group-hover:text-amber-200 transition-colors">
          {{ npc.name }}
        </h3>
        <p class="text-stone-400 text-xs mt-0.5 uppercase tracking-wide">{{ npc.role }}</p>
      </div>
    </div>

    <!-- Description -->
    <p class="text-stone-300 text-sm leading-relaxed line-clamp-3">
      {{ npc.description }}
    </p>

    <!-- CTA -->
    <p class="text-amber-600 text-xs mt-3 group-hover:text-amber-400 transition-colors">
      Begin conversation →
    </p>
  </NuxtLink>
</template>
