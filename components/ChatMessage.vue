<script setup lang="ts">
defineProps<{
  role: 'user' | 'assistant'
  content: string
  npcName?: string
}>()
</script>

<template>
  <div :class="['flex gap-3', role === 'user' ? 'justify-end' : 'justify-start']">
    <!-- NPC avatar -->
    <div
      v-if="role === 'assistant'"
      class="flex-shrink-0 w-8 h-8 rounded-full bg-amber-900 border border-amber-700 flex items-center justify-center text-amber-300 text-xs font-serif font-bold mt-1"
    >
      {{ npcName?.charAt(0) ?? '?' }}
    </div>

    <!-- Bubble -->
    <div
      :class="[
        'max-w-[75%] rounded-lg px-4 py-3 text-sm leading-relaxed',
        role === 'user'
          ? 'bg-stone-700 text-stone-100 rounded-br-none'
          : 'bg-stone-800 border border-amber-900/40 text-stone-200 rounded-bl-none',
      ]"
    >
      <p class="text-xs font-semibold mb-1" :class="role === 'user' ? 'text-stone-400' : 'text-amber-500'">
        {{ role === 'user' ? 'You' : npcName }}
      </p>
      <p class="whitespace-pre-wrap">{{ content }}</p>
    </div>

    <!-- User avatar -->
    <div
      v-if="role === 'user'"
      class="flex-shrink-0 w-8 h-8 rounded-full bg-stone-600 border border-stone-500 flex items-center justify-center text-stone-300 text-xs font-bold mt-1"
    >
      DM
    </div>
  </div>
</template>
