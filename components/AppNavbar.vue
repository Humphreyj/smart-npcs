<template>
  <nav class="w-full bg-stone-950 border-b border-yellow-900/40 px-6 py-3 flex items-center justify-between">
    <!-- Logo -->
    <span class="text-xl font-cinzel font-semibold tracking-widest text-yellow-500 drop-shadow-[0_0_8px_rgba(202,138,4,0.4)]">
      Smart NPCs
    </span>

    <!-- Account -->
    <div class="flex items-center gap-3 cursor-pointer group">
      <!-- Avatar -->
      <div class="w-8 h-8 rounded-full bg-yellow-900/60 border border-yellow-700/60 flex items-center justify-center text-xs font-semibold text-yellow-300 tracking-wide select-none">
        DM
      </div>

      <!-- Username -->
      <span class="text-sm text-stone-300 group-hover:text-yellow-400 transition-colors">
        Dungeon Master
      </span>

      <!-- Chevron -->
      <svg class="w-4 h-4 text-stone-500 group-hover:text-yellow-500 transition-colors" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  </nav>
</template>
