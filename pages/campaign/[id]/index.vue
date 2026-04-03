<script setup lang="ts">
import type { Campaign, CampaignLocation } from '~/server/utils/campaigns'

const route = useRoute()
const campaignId = route.params.id as string

const { data: campaign, status } = await useFetch<Campaign>(`/api/campaigns/${campaignId}`)

const topLevelLocations = computed<CampaignLocation[]>(() => campaign.value?.locations ?? [])
</script>

<template>
  <div class="min-h-screen bg-stone-950">
    <header class="border-b border-stone-800 bg-stone-950/80 backdrop-blur-sm sticky top-0 z-10">
      <div class="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
        <span class="text-amber-500 text-xl">⚔</span>
        <h1 class="font-serif text-xl font-semibold text-amber-300 tracking-wide">Smart NPCs</h1>
        <NuxtLink
          :to="`/campaign/${campaignId}/dashboard`"
          class="text-stone-500 hover:text-amber-400 text-sm ml-auto transition-colors"
        >⚙ DM Dashboard</NuxtLink>
      </div>
    </header>

    <main class="max-w-4xl mx-auto px-4 py-10">
      <!-- Breadcrumb -->
      <nav class="flex items-center gap-2 text-xs text-stone-500 mb-8">
        <NuxtLink to="/" class="hover:text-stone-300 transition-colors">Home</NuxtLink>
        <span>›</span>
        <span class="text-stone-300">{{ campaign?.name ?? 'Campaign' }}</span>
      </nav>

      <!-- Loading -->
      <div v-if="status === 'pending'" class="space-y-6">
        <div class="bg-stone-900 border border-stone-800 rounded-lg h-28 animate-pulse" />
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div v-for="i in 3" :key="i" class="bg-stone-900 border border-stone-800 rounded-lg h-32 animate-pulse" />
        </div>
      </div>

      <template v-else-if="campaign">
        <!-- Campaign header -->
        <div class="mb-8">
          <h2 class="font-serif text-3xl font-bold text-stone-100 mb-1">{{ campaign.name }}</h2>
          <p class="text-stone-400 text-sm italic mb-4">{{ campaign.tone }}</p>
          <p class="text-stone-300 text-sm mb-6">{{ campaign.setting }}</p>

          <!-- Factions -->
          <div v-if="campaign.factions?.length" class="mb-2">
            <h3 class="text-xs text-stone-500 uppercase tracking-widest mb-2">Factions</h3>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="faction in campaign.factions"
                :key="faction.id"
                class="text-xs bg-stone-800 border border-stone-700 text-stone-300 rounded px-2 py-1"
                :title="faction.description"
              >
                {{ faction.name }}
              </span>
            </div>
          </div>

          <div class="mt-6 h-px bg-gradient-to-r from-amber-800/60 via-amber-700/30 to-transparent" />
        </div>

        <!-- Locations -->
        <div>
          <h3 class="font-serif text-xl font-semibold text-stone-200 mb-4">Locations</h3>
          <div v-if="topLevelLocations.length" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <NuxtLink
              v-for="loc in topLevelLocations"
              :key="loc.id"
              :to="`/location/${loc.id}?campaign=${campaignId}`"
              class="group bg-stone-900 border border-stone-800 hover:border-amber-800/60 rounded-lg p-5 transition-colors cursor-pointer"
            >
              <div class="flex items-start gap-3 mb-2">
                <div class="w-8 h-8 rounded-full bg-stone-800 border border-stone-700 flex items-center justify-center text-stone-400 text-xs flex-shrink-0">
                  ◈
                </div>
                <div>
                  <p class="text-amber-300 font-serif font-semibold group-hover:text-amber-200 transition-colors">{{ loc.name }}</p>
                  <p class="text-stone-500 text-xs mt-0.5">{{ loc.type }}</p>
                </div>
              </div>
              <p class="text-stone-400 text-sm line-clamp-2">{{ loc.description }}</p>
              <p class="text-amber-700 text-xs mt-3 group-hover:text-amber-500 transition-colors">Explore →</p>
            </NuxtLink>
          </div>
          <div v-else class="text-stone-500 text-sm">No locations defined for this campaign.</div>
        </div>
      </template>

      <div v-else class="text-center py-20 text-stone-500">
        <p class="text-4xl mb-3">☽</p>
        <p>Campaign not found.</p>
        <NuxtLink to="/" class="text-amber-700 hover:text-amber-500 text-sm mt-3 inline-block">← Back to campaigns</NuxtLink>
      </div>
    </main>
  </div>
</template>
