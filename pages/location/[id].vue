<script setup lang="ts">
import type { Campaign, CampaignLocation, CampaignNPC } from '~/server/utils/campaigns'

const route = useRoute()
const locationId = route.params.id as string
const campaignId = route.query.campaign as string

if (!campaignId) {
  await navigateTo('/')
}

const { data, status } = await useFetch<{ location: CampaignLocation; parent: CampaignLocation | null; campaign: Campaign }>(
  `/api/locations/${locationId}`,
  { query: { campaign: campaignId } },
)

const location = computed(() => data.value?.location)
const parent = computed(() => data.value?.parent)
const campaign = computed(() => data.value?.campaign)

const subLocations = computed<CampaignLocation[]>(() => location.value?.locations ?? [])
const npcs = computed<CampaignNPC[]>(() => location.value?.npcs ?? [])
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
      <!-- Breadcrumb -->
      <nav class="flex items-center gap-2 text-xs text-stone-500 mb-8 flex-wrap">
        <NuxtLink to="/" class="hover:text-stone-300 transition-colors">Home</NuxtLink>
        <span>›</span>
        <NuxtLink
          v-if="campaign"
          :to="`/campaign/${campaignId}`"
          class="hover:text-stone-300 transition-colors"
        >{{ campaign.name }}</NuxtLink>
        <template v-if="parent">
          <span>›</span>
          <NuxtLink
            :to="`/location/${parent.id}?campaign=${campaignId}`"
            class="hover:text-stone-300 transition-colors"
          >{{ parent.name }}</NuxtLink>
        </template>
        <span>›</span>
        <span class="text-stone-300">{{ location?.name ?? 'Location' }}</span>
      </nav>

      <!-- Loading -->
      <div v-if="status === 'pending'" class="space-y-6">
        <div class="bg-stone-900 border border-stone-800 rounded-lg h-28 animate-pulse" />
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div v-for="i in 3" :key="i" class="bg-stone-900 border border-stone-800 rounded-lg h-32 animate-pulse" />
        </div>
      </div>

      <template v-else-if="location">
        <!-- Location header -->
        <div class="mb-8">
          <div class="flex items-center gap-2 mb-1">
            <h2 class="font-serif text-3xl font-bold text-stone-100">{{ location.name }}</h2>
            <span class="text-xs text-stone-500 bg-stone-800 border border-stone-700 rounded px-2 py-0.5">{{ location.type }}</span>
          </div>
          <p class="text-stone-400 text-sm mb-3">{{ location.description }}</p>
          <p class="text-stone-500 text-xs italic">{{ location.atmosphere }}</p>
          <div class="mt-6 h-px bg-gradient-to-r from-amber-800/60 via-amber-700/30 to-transparent" />
        </div>

        <!-- Sub-locations -->
        <div v-if="subLocations.length" class="mb-10">
          <h3 class="font-serif text-xl font-semibold text-stone-200 mb-4">Areas</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <NuxtLink
              v-for="sub in subLocations"
              :key="sub.id"
              :to="`/location/${sub.id}?campaign=${campaignId}`"
              class="group bg-stone-900 border border-stone-800 hover:border-amber-800/60 rounded-lg p-5 transition-colors cursor-pointer"
            >
              <div class="flex items-start gap-3 mb-2">
                <div class="w-8 h-8 rounded-full bg-stone-800 border border-stone-700 flex items-center justify-center text-stone-400 text-xs flex-shrink-0">
                  ◈
                </div>
                <div>
                  <p class="text-amber-300 font-serif font-semibold group-hover:text-amber-200 transition-colors">{{ sub.name }}</p>
                  <p class="text-stone-500 text-xs mt-0.5">{{ sub.type }}</p>
                </div>
              </div>
              <p class="text-stone-400 text-sm line-clamp-2">{{ sub.description }}</p>
              <p class="text-amber-700 text-xs mt-3 group-hover:text-amber-500 transition-colors">Enter →</p>
            </NuxtLink>
          </div>
        </div>

        <!-- NPCs -->
        <div v-if="npcs.length">
          <h3 class="font-serif text-xl font-semibold text-stone-200 mb-4">Characters</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <NuxtLink
              v-for="npc in npcs"
              :key="npc.id"
              :to="`/chat/${npc.id}?campaign=${campaignId}`"
              class="group bg-stone-900 border border-stone-800 hover:border-amber-800/60 rounded-lg p-5 transition-colors cursor-pointer"
            >
              <div class="flex items-start gap-3 mb-3">
                <div class="w-9 h-9 rounded-full bg-amber-900/40 border border-amber-700/40 flex items-center justify-center text-amber-400 font-serif font-bold text-sm flex-shrink-0">
                  {{ npc.name.charAt(0) }}
                </div>
                <div>
                  <p class="text-amber-300 font-serif font-semibold group-hover:text-amber-200 transition-colors">{{ npc.name }}</p>
                  <p class="text-stone-500 text-xs mt-0.5">{{ npc.role }}</p>
                </div>
              </div>
              <p class="text-stone-400 text-sm line-clamp-2">{{ npc.appearance }}</p>
              <p class="text-amber-700 text-xs mt-3 group-hover:text-amber-500 transition-colors">Speak to them →</p>
            </NuxtLink>
          </div>
        </div>

        <div v-if="!subLocations.length && !npcs.length" class="text-center py-16 text-stone-500">
          <p class="text-4xl mb-3">☽</p>
          <p>This place is empty.</p>
        </div>
      </template>

      <div v-else class="text-center py-20 text-stone-500">
        <p class="text-4xl mb-3">☽</p>
        <p>Location not found.</p>
        <NuxtLink :to="`/campaign/${campaignId}`" class="text-amber-700 hover:text-amber-500 text-sm mt-3 inline-block">← Back to campaign</NuxtLink>
      </div>
    </main>
  </div>
</template>
