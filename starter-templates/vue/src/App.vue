<script setup lang="ts">
const features = ["Single-file components", "Reactive state", "Vite dev server"];
</script>

<template>
  <main class="shell">
    <p class="eyebrow">Vue 3 Playground</p>
    <h1>Compose interfaces with Vue inside WebContainers.</h1>
    <ul>
      <li v-for="feature in features" :key="feature">{{ feature }}</li>
    </ul>
  </main>
</template>
