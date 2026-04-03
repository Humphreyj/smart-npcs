<script setup lang="ts">
import type { PartyMember } from '~/server/utils/campaigns'

const props = defineProps<{
  party: PartyMember[]
}>()

const emit = defineEmits<{
  select: [id: string, name: string]
}>()

const selectedId = ref<string | null>(null)
const customName = ref('')

function selectPartyMember(member: PartyMember) {
  selectedId.value = member.id
  customName.value = ''
}

function handleCustomInput() {
  if (customName.value.trim()) {
    selectedId.value = null
  }
}

const canConfirm = computed(
  () => selectedId.value !== null || customName.value.trim().length > 0,
)

function confirm() {
  if (selectedId.value) {
    const member = props.party.find((m) => m.id === selectedId.value)
    if (member) {
      emit('select', member.id, member.name)
      return
    }
  }
  const name = customName.value.trim()
  if (name) {
    const id = `custom-${name.toLowerCase().replace(/\s+/g, '-')}`
    emit('select', id, name)
  }
}
</script>

<template>
  <!-- Backdrop -->
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
    <!-- Panel -->
    <div
      class="w-full max-w-md bg-stone-950 border border-amber-900/60 rounded-lg shadow-2xl shadow-black/60 overflow-hidden"
    >
      <!-- Header -->
      <div class="px-6 pt-6 pb-4 border-b border-stone-800">
        <h2 class="font-serif text-amber-300 text-xl font-semibold tracking-wide">Who enters this place?</h2>
        <p class="text-stone-500 text-xs mt-1">Choose your character to begin the encounter.</p>
      </div>

      <!-- Party list -->
      <div class="px-6 py-4 space-y-2">
        <button
          v-for="member in party"
          :key="member.id"
          class="w-full text-left px-4 py-3 rounded border transition-all duration-150"
          :class="
            selectedId === member.id
              ? 'bg-amber-900/30 border-amber-700/70 text-amber-200'
              : 'bg-stone-900 border-stone-700 text-stone-300 hover:border-amber-800/60 hover:bg-stone-800'
          "
          @click="selectPartyMember(member)"
        >
          <span class="font-serif font-semibold text-sm">{{ member.name }}</span>
          <span class="text-stone-500 text-xs ml-2">{{ member.race }} · {{ member.class }}</span>
        </button>
      </div>

      <!-- Custom name fallback -->
      <div class="px-6 pb-4">
        <p class="text-stone-600 text-xs text-center mb-2">— or enter a name —</p>
        <input
          v-model="customName"
          type="text"
          placeholder="Your name…"
          class="w-full bg-stone-900 border border-stone-700 rounded px-3 py-2 text-sm text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-800 transition-colors"
          @input="handleCustomInput"
          @keydown.enter="canConfirm && confirm()"
        />
      </div>

      <!-- Confirm -->
      <div class="px-6 pb-6">
        <button
          class="w-full bg-amber-800 hover:bg-amber-700 disabled:bg-stone-800 disabled:text-stone-600 text-amber-100 disabled:cursor-not-allowed font-serif font-semibold rounded py-2.5 text-sm transition-colors"
          :disabled="!canConfirm"
          @click="confirm"
        >
          Enter
        </button>
      </div>
    </div>
  </div>
</template>
