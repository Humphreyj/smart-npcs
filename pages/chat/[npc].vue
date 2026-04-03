<script setup lang="ts">
import type { Campaign, CampaignLocation, CampaignNPC } from '~/server/utils/campaigns'

const route = useRoute()
const npcId = route.params.npc as string
const campaignId = route.query.campaign as string

if (!campaignId) {
  await navigateTo('/')
}

const { data, status } = await useFetch<{ npc: CampaignNPC; location: CampaignLocation; campaign: Campaign }>(
  `/api/npcs/${npcId}`,
  { query: { campaign: campaignId } },
)

const npc = computed(() => data.value?.npc)
const location = computed(() => data.value?.location)
const party = computed(() => data.value?.campaign.party ?? [])

watchEffect(() => {
  if (status.value === 'success' && !npc.value) {
    navigateTo('/')
  }
})

const { activePlayer, setPlayer } = usePlayer(campaignId)

const chatMode = ref<'player' | 'dm'>('player')
const isDM = computed(() => chatMode.value === 'dm')

const showPlayerSelector = ref(false)

onMounted(() => {
  if (!activePlayer.value) {
    showPlayerSelector.value = true
  }
})

function handlePlayerSelect(id: string, name: string) {
  setPlayer(id, name)
  showPlayerSelector.value = false
}

const { messages, isStreaming, error, send, clear } = useChat(npcId, campaignId)

const inputText = ref('')
const messagesEnd = ref<HTMLElement | null>(null)
const inputRef = ref<HTMLTextAreaElement | null>(null)

const isSavingMemory = ref(false)
const memorySaveStatus = ref<'idle' | 'saving' | 'saved' | 'error'>('idle')
let savedFadeTimeout: ReturnType<typeof setTimeout> | null = null

async function handleEndSession() {
  if (isSavingMemory.value || messages.value.length === 0) return
  isSavingMemory.value = true
  memorySaveStatus.value = 'saving'

  try {
    await $fetch('/api/memory/update', {
      method: 'POST',
      body: {
        campaignId,
        npcId,
        playerId: activePlayer.value?.id ?? 'player-default',
        messages: messages.value,
        mode: chatMode.value,
      },
    })
    memorySaveStatus.value = 'saved'
    if (savedFadeTimeout) clearTimeout(savedFadeTimeout)
    savedFadeTimeout = setTimeout(() => {
      memorySaveStatus.value = 'idle'
    }, 3000)
  } catch {
    memorySaveStatus.value = 'error'
    if (savedFadeTimeout) clearTimeout(savedFadeTimeout)
    savedFadeTimeout = setTimeout(() => {
      memorySaveStatus.value = 'idle'
    }, 3000)
  } finally {
    isSavingMemory.value = false
  }
}

async function handleSend() {
  const text = inputText.value.trim()
  if (!text || isStreaming.value) return
  inputText.value = ''
  await nextTick()
  inputRef.value?.focus()
  await send(text, activePlayer.value?.id ?? 'player-default', chatMode.value)
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}

watch(
  messages,
  async () => {
    await nextTick()
    messagesEnd.value?.scrollIntoView({ behavior: 'smooth' })
  },
  { deep: true },
)
</script>

<template>
  <div class="flex flex-col h-screen bg-stone-950">
    <!-- Player selector modal (hidden in DM mode) -->
    <PlayerSelector
      v-if="showPlayerSelector && !isDM"
      :party="party"
      @select="handlePlayerSelect"
    />

    <!-- Header -->
    <header
      class="flex-shrink-0 border-b backdrop-blur-sm px-4 py-3 transition-colors duration-300"
      :class="isDM
        ? 'border-indigo-900/60 bg-stone-950/90'
        : 'border-stone-800 bg-stone-950/90'"
    >
      <div class="max-w-3xl mx-auto flex items-center gap-3">
        <NuxtLink
          :to="location ? `/location/${location.id}?campaign=${campaignId}` : `/campaign/${campaignId}`"
          class="text-stone-400 hover:text-stone-200 transition-colors text-sm mr-1"
          aria-label="Back"
        >
          ← Back
        </NuxtLink>

        <div v-if="npc" class="flex items-center gap-3 flex-1">
          <div
            class="w-8 h-8 rounded-full border flex items-center justify-center font-serif font-bold text-sm flex-shrink-0 transition-colors duration-300"
            :class="isDM
              ? 'bg-indigo-900/60 border-indigo-700/50 text-indigo-300'
              : 'bg-amber-900/60 border-amber-700/50 text-amber-300'"
          >
            {{ npc.name.charAt(0) }}
          </div>
          <div>
            <p
              class="font-serif font-semibold text-sm leading-none transition-colors duration-300"
              :class="isDM ? 'text-indigo-300' : 'text-amber-300'"
            >{{ npc.name }}</p>
            <p class="text-stone-500 text-xs mt-0.5">{{ npc.role }}</p>
          </div>
        </div>

        <!-- Mode toggle -->
        <div class="flex items-center gap-1 text-xs">
          <button
            class="transition-colors px-1.5 py-0.5 rounded"
            :class="!isDM
              ? 'text-amber-500 bg-amber-950/40'
              : 'text-stone-600 hover:text-stone-400'"
            @click="chatMode = 'player'"
          >
            Player
          </button>
          <span class="text-stone-700">·</span>
          <button
            class="transition-colors px-1.5 py-0.5 rounded"
            :class="isDM
              ? 'text-indigo-400 bg-indigo-950/40'
              : 'text-stone-600 hover:text-stone-400'"
            @click="chatMode = 'dm'"
          >
            DM
          </button>
        </div>

        <!-- Active player + switch (player mode only) -->
        <div v-if="activePlayer && !isDM" class="flex items-center gap-2 text-xs text-stone-500">
          <span class="text-stone-400">{{ activePlayer.name }}</span>
          <button
            class="text-stone-600 hover:text-amber-600 transition-colors"
            @click="showPlayerSelector = true"
          >
            Switch
          </button>
        </div>

        <div v-if="messages.length > 0" class="ml-auto flex items-center gap-3">
          <!-- Memory save status -->
          <Transition name="fade">
            <span
              v-if="memorySaveStatus === 'saving'"
              class="text-xs animate-pulse"
              :class="isDM ? 'text-indigo-600' : 'text-amber-600'"
            >{{ isDM ? 'Saving instructions…' : 'Saving memories…' }}</span>
            <span
              v-else-if="memorySaveStatus === 'saved'"
              class="text-xs text-emerald-600"
            >{{ isDM ? 'Instructions saved' : 'Session saved' }}</span>
            <span
              v-else-if="memorySaveStatus === 'error'"
              class="text-xs text-red-500"
            >Save failed</span>
          </Transition>

          <button
            class="text-xs transition-colors disabled:opacity-40"
            :class="isDM
              ? 'text-stone-500 hover:text-indigo-400'
              : 'text-stone-500 hover:text-amber-400'"
            :disabled="isSavingMemory || isStreaming"
            @click="handleEndSession"
          >
            {{ isDM ? 'Save Instructions' : 'End Session' }}
          </button>

          <button
            class="text-stone-600 hover:text-stone-400 text-xs transition-colors"
            @click="clear"
          >
            Clear
          </button>
        </div>
      </div>
    </header>

    <!-- Messages -->
    <main class="flex-1 overflow-y-auto px-4 py-6">
      <div class="max-w-3xl mx-auto space-y-4">
        <div v-if="messages.length === 0" class="text-center py-16">
          <p v-if="isDM" class="text-stone-600 text-sm">
            Speak directly to
            <span class="text-indigo-700">{{ npc?.name }}</span>
            as their creator.
          </p>
          <p v-else class="text-stone-600 text-sm">
            Your conversation with
            <span class="text-amber-700">{{ npc?.name }}</span>
            begins here.
          </p>
          <p class="text-stone-700 text-xs mt-2">Say something to start.</p>
        </div>

        <ChatMessage
          v-for="(msg, i) in messages"
          :key="i"
          :role="msg.role"
          :content="msg.content"
          :npc-name="npc?.name"
        />

        <!-- Streaming indicator -->
        <div v-if="isStreaming && messages.at(-1)?.content === ''" class="flex justify-start gap-3">
          <div
            class="w-8 h-8 rounded-full border flex items-center justify-center font-serif font-bold text-sm transition-colors duration-300"
            :class="isDM
              ? 'bg-indigo-900/60 border-indigo-700/50 text-indigo-300'
              : 'bg-amber-900/60 border-amber-700/50 text-amber-300'"
          >
            {{ npc?.name.charAt(0) }}
          </div>
          <div
            class="border rounded-lg rounded-bl-none px-4 py-3 transition-colors duration-300"
            :class="isDM
              ? 'bg-stone-800 border-indigo-900/40'
              : 'bg-stone-800 border-amber-900/40'"
          >
            <span class="inline-flex gap-1">
              <span
                class="w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:0ms]"
                :class="isDM ? 'bg-indigo-600' : 'bg-amber-600'"
              />
              <span
                class="w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:150ms]"
                :class="isDM ? 'bg-indigo-600' : 'bg-amber-600'"
              />
              <span
                class="w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:300ms]"
                :class="isDM ? 'bg-indigo-600' : 'bg-amber-600'"
              />
            </span>
          </div>
        </div>

        <!-- Error -->
        <div v-if="error" class="text-center">
          <p class="text-red-400 text-xs bg-red-950/40 border border-red-900/40 rounded px-3 py-2 inline-block">
            {{ error }}
          </p>
        </div>

        <div ref="messagesEnd" />
      </div>
    </main>

    <!-- Input -->
    <footer
      class="flex-shrink-0 border-t backdrop-blur-sm px-4 py-3 transition-colors duration-300"
      :class="isDM ? 'border-indigo-900/40 bg-stone-900/80' : 'border-stone-800 bg-stone-900/80'"
    >
      <div class="max-w-3xl mx-auto flex gap-3 items-end">
        <textarea
          ref="inputRef"
          v-model="inputText"
          rows="1"
          :placeholder="isDM ? `Give instructions to ${npc?.name ?? 'NPC'}…` : 'Speak to the NPC…'"
          class="flex-1 resize-none bg-stone-800 border rounded-lg px-3 py-2.5 text-sm text-stone-100 placeholder-stone-500 focus:outline-none transition-colors leading-relaxed"
          :class="isDM
            ? 'border-stone-600 focus:border-indigo-700'
            : 'border-stone-600 focus:border-amber-700'"
          :disabled="isStreaming || (showPlayerSelector && !isDM)"
          @keydown="handleKeydown"
        />
        <button
          class="flex-shrink-0 disabled:bg-stone-700 disabled:text-stone-500 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
          :class="isDM
            ? 'bg-indigo-800 hover:bg-indigo-700 text-indigo-100'
            : 'bg-amber-800 hover:bg-amber-700 text-amber-100'"
          :disabled="isStreaming || !inputText.trim() || (showPlayerSelector && !isDM)"
          @click="handleSend"
        >
          Send
        </button>
      </div>
      <p class="text-stone-600 text-xs text-center mt-2">Enter to send · Shift+Enter for new line</p>
    </footer>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
