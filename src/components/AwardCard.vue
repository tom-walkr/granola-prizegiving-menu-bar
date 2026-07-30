<script setup lang="ts">
defineProps<{
  title: string;
  winnerName: string;
  value: string;
}>();
</script>

<template>
  <article>
    <h3>{{ title }}</h3>
    <p>{{ winnerName }}</p>
    <p>{{ value }}</p>
  </article>
</template>
