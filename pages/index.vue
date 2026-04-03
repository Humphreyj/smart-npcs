<script setup lang="ts">
const { data: campaigns, status } = await useFetch<{ id: string; name: string; setting: string; tone: string }[]>('/api/campaigns')
</script>

<template>
  <div class="min-h-screen bg-stone-950">
    <header class="border-b border-stone-800 bg-stone-950/80 backdrop-blur-sm sticky top-0 z-10">
      <div class="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
        <span class="text-amber-500 text-xl">⚔</span>
        <h1 class="font-serif text-xl font-semibold text-amber-300 tracking-wide">Smart NPCs</h1>
        <span class="text-stone-600 text-sm ml-auto">Dungeon Master's Console</span>
      </div>
    </header>

    <main class="max-w-4xl mx-auto px-4 py-10">
      <div class="mb-10">
        <h2 class="font-serif text-3xl font-bold text-stone-100 mb-2">Campaigns</h2>
        <p class="text-stone-400 text-sm">Select a campaign to begin your journey.</p>
        <div class="mt-4 h-px bg-gradient-to-r from-amber-800/60 via-amber-700/30 to-transparent" />
      </div>

      <div v-if="status === 'pending'" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div v-for="i in 2" :key="i" class="bg-stone-900 border border-stone-800 rounded-lg p-5 h-40 animate-pulse" />
      </div>

      <div v-else-if="campaigns?.length" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <NuxtLink
          v-for="campaign in campaigns"
          :key="campaign.id"
          :to="`/campaign/${campaign.id}`"
          class="group bg-stone-900 border border-stone-800 hover:border-amber-800/60 rounded-lg p-5 transition-colors cursor-pointer"
        >
          <div class="flex items-start gap-3 mb-3">
            <div class="w-9 h-9 rounded-full bg-amber-900/40 border border-amber-700/40 flex items-center justify-center text-amber-400 font-serif font-bold text-sm flex-shrink-0">
              {{ campaign.name.charAt(0) }}
            </div>
            <div>
              <p class="text-amber-300 font-serif font-semibold group-hover:text-amber-200 transition-colors">{{ campaign.name }}</p>
              <p class="text-stone-500 text-xs mt-0.5 italic">{{ campaign.tone }}</p>
            </div>
          </div>
          <p class="text-stone-400 text-sm line-clamp-3">{{ campaign.setting }}</p>
          <p class="text-amber-700 text-xs mt-3 group-hover:text-amber-500 transition-colors">Enter campaign →</p>
        </NuxtLink>
      </div>

      <div v-else class="text-center py-20 text-stone-500">
        <p class="text-4xl mb-3">☽</p>
        <p>No campaigns found.</p>
      </div>
    </main>
  </div>
</template>
