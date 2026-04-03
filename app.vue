<template>
  <div>
    <header class="bg-gray-900 text-white p-4">
      <nav class="flex gap-4">
        <NuxtLink to="/" class="hover:text-gray-300">Home</NuxtLink>
        <NuxtLink to="/about" class="hover:text-gray-300">About</NuxtLink>
      </nav>
    </header>
    <main class="p-4">
      <NuxtPage />
    </main>
  </div>
</template>
