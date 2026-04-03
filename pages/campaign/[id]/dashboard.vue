<script setup lang="ts">
import type { Campaign, CampaignNPC, CampaignLocation } from '~/server/utils/campaigns'

const route = useRoute()
const campaignId = route.params.id as string

const { data: campaign, status, refresh } = await useFetch<Campaign>(`/api/campaigns/${campaignId}`)

interface NPCRow {
  npc: CampaignNPC
  locationName: string
}

function collectNPCs(locations: CampaignLocation[], result: NPCRow[] = []): NPCRow[] {
  for (const loc of locations) {
    if (loc.npcs) {
      for (const npc of loc.npcs) {
        result.push({ npc, locationName: loc.name })
      }
    }
    if (loc.locations) collectNPCs(loc.locations, result)
  }
  return result
}

const allNPCs = computed<NPCRow[]>(() => {
  if (!campaign.value) return []
  return collectNPCs(campaign.value.locations)
})

const partyMembers = computed(() => campaign.value?.party ?? [])

const npcsWithInstructions = computed(() =>
  allNPCs.value.filter(({ npc }) => npc.dmInstructions?.length),
)

async function deleteInstruction(npcId: string, idx: number) {
  await $fetch('/api/memory/instructions', {
    method: 'DELETE',
    body: { campaignId, npcId, instructionIndex: idx },
  })
  await refresh()
}
</script>

<template>
  <div class="min-h-screen bg-stone-950">
    <header class="border-b border-stone-800 bg-stone-950/80 backdrop-blur-sm sticky top-0 z-10">
      <div class="max-w-6xl mx-auto px-4 py-4 flex items-center gap-3">
        <span class="text-amber-500 text-xl">⚔</span>
        <h1 class="font-serif text-xl font-semibold text-amber-300 tracking-wide">Smart NPCs</h1>
        <span class="text-stone-700 text-sm ml-2">|</span>
        <NuxtLink
          :to="`/campaign/${campaignId}`"
          class="text-stone-400 text-sm hover:text-stone-200 transition-colors"
        >
          ← {{ campaign?.name ?? 'Campaign' }}
        </NuxtLink>
        <span class="text-amber-700 text-xs uppercase tracking-widest ml-auto">DM Dashboard</span>
      </div>
    </header>

    <main class="max-w-6xl mx-auto px-4 py-8">
      <!-- Loading -->
      <div v-if="status === 'pending'" class="space-y-5">
        <div class="bg-stone-900 border border-stone-800 rounded-lg h-16 animate-pulse" />
        <div class="bg-stone-900 border border-stone-800 rounded-lg h-56 animate-pulse" />
        <div class="bg-stone-900 border border-stone-800 rounded-lg h-32 animate-pulse" />
      </div>

      <template v-else-if="campaign">
        <!-- Page title -->
        <div class="mb-8">
          <h2 class="font-serif text-2xl font-bold text-stone-100">{{ campaign.name }}</h2>
          <p class="text-amber-700 text-xs uppercase tracking-widest mt-1 mb-4">DM Dashboard</p>
          <div class="h-px bg-gradient-to-r from-amber-800/60 via-amber-700/20 to-transparent" />
        </div>

        <!-- Section 1: Memory Matrix -->
        <section class="mb-12">
          <div class="flex items-baseline gap-3 mb-1">
            <h3 class="font-serif text-lg font-semibold text-stone-200">Memory Matrix</h3>
            <span class="text-stone-600 text-xs">{{ allNPCs.length }} NPCs</span>
          </div>
          <p class="text-stone-600 text-xs mb-4">
            Colored dot = NPC has memory of that player. Hover for relationship.
          </p>

          <div v-if="partyMembers.length === 0" class="text-stone-600 text-sm border border-stone-800 rounded p-4 bg-stone-900/40">
            No party members defined in this campaign.
          </div>

          <div v-else class="overflow-x-auto">
            <table class="w-full text-sm border-collapse">
              <thead>
                <tr class="border-b border-stone-800">
                  <th class="text-left text-xs text-stone-500 uppercase tracking-widest font-normal py-2 pr-4 w-44">
                    NPC
                  </th>
                  <th class="text-left text-xs text-stone-600 font-normal py-2 pr-4 w-28">Role</th>
                  <th class="text-left text-xs text-stone-600 font-normal py-2 pr-6 w-36">Location</th>
                  <th
                    v-for="member in partyMembers"
                    :key="member.id"
                    class="text-center text-xs font-normal py-2 px-3 min-w-[4.5rem]"
                  >
                    <div class="text-stone-300">{{ member.name }}</div>
                    <div class="text-stone-600 text-[10px]">{{ member.class }}</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="{ npc, locationName } in allNPCs"
                  :key="npc.id"
                  class="border-b border-stone-800/30 hover:bg-stone-900/40 transition-colors"
                >
                  <td class="py-2 pr-4">
                    <NuxtLink
                      :to="`/chat/${npc.id}?campaign=${campaignId}&mode=dm`"
                      class="text-amber-400 hover:text-amber-200 font-medium transition-colors text-sm"
                    >
                      {{ npc.name }}
                    </NuxtLink>
                  </td>
                  <td class="py-2 pr-4 text-stone-500 text-xs truncate max-w-[7rem]">{{ npc.role }}</td>
                  <td class="py-2 pr-6 text-stone-600 text-xs truncate max-w-[9rem]">{{ locationName }}</td>
                  <td
                    v-for="member in partyMembers"
                    :key="member.id"
                    class="py-2 px-3 text-center"
                  >
                    <span
                      v-if="npc.memory[member.id]"
                      class="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 ring-1 ring-amber-600/50 cursor-default"
                      :title="npc.memory[member.id].relationship"
                    />
                    <span
                      v-else
                      class="inline-block w-2.5 h-2.5 rounded-full bg-stone-800 border border-stone-700 cursor-default"
                      title="No memory"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- Section 2: Pending DM Instructions -->
        <section>
          <div class="flex items-baseline gap-3 mb-1">
            <h3 class="font-serif text-lg font-semibold text-stone-200">Pending DM Instructions</h3>
            <span class="text-stone-600 text-xs">{{ npcsWithInstructions.length }} NPCs queued</span>
          </div>
          <p class="text-stone-600 text-xs mb-4">
            Instructions for NPCs to carry out. Remove once resolved.
          </p>

          <div
            v-if="npcsWithInstructions.length === 0"
            class="text-stone-600 text-sm border border-stone-800 rounded p-4 bg-stone-900/40"
          >
            No pending instructions.
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="{ npc, locationName } in npcsWithInstructions"
              :key="npc.id"
              class="bg-stone-900 border border-stone-800 rounded-lg p-4"
            >
              <div class="flex items-baseline gap-3 mb-3">
                <NuxtLink
                  :to="`/chat/${npc.id}?campaign=${campaignId}&mode=dm`"
                  class="text-amber-400 hover:text-amber-200 font-serif font-semibold transition-colors"
                >
                  {{ npc.name }}
                </NuxtLink>
                <span class="text-stone-600 text-xs">{{ npc.role }} — {{ locationName }}</span>
              </div>
              <ul class="space-y-1.5">
                <li
                  v-for="(instruction, idx) in npc.dmInstructions"
                  :key="idx"
                  class="flex items-start gap-2 group"
                >
                  <span class="text-amber-900 mt-0.5 flex-shrink-0 text-xs">▸</span>
                  <span class="flex-1 text-stone-300 text-sm leading-snug">{{ instruction }}</span>
                  <button
                    class="text-stone-700 hover:text-red-400 transition-colors text-xs px-1 flex-shrink-0 opacity-0 group-hover:opacity-100"
                    title="Remove instruction"
                    @click="deleteInstruction(npc.id, idx)"
                  >
                    ✕
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </section>
      </template>

      <div v-else class="text-center py-20 text-stone-500">
        <p class="text-4xl mb-3">☽</p>
        <p>Campaign not found.</p>
        <NuxtLink to="/" class="text-amber-700 hover:text-amber-500 text-sm mt-3 inline-block">
          ← Back to campaigns
        </NuxtLink>
      </div>
    </main>
  </div>
</template>
