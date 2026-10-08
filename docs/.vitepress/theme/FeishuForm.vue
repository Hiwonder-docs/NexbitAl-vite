<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    url: string
    title?: string
    height?: number | string
  }>(),
  {
    title: 'MakeCode Project',
    height: 800,
  },
)

const projectUrl = computed(() => {
  try {
    const url = new URL(props.url)
    return ['https:', 'http:'].includes(url.protocol) ? url : null
  } catch {
    return null
  }
})

const frameHeight = computed(() => {
  return typeof props.height === 'number' ? `${props.height}px` : props.height
})
</script>

<template>
  <div v-if="projectUrl" class="feishu-form">
    <iframe
      class="feishu-form__frame"
      :src="projectUrl.href"
      :title="title"
      :style="{ height: frameHeight }"
      width="100%"
      loading="lazy"
      allowfullscreen
    />
    <a :href="projectUrl.href" target="_blank" rel="noopener noreferrer">
      Open project in a new tab
    </a>
  </div>
</template>

<style scoped>
.feishu-form {
  margin: 16px 0 28px;
}

.feishu-form__frame {
  display: block;
  width: 100%;
  margin-bottom: 8px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: #fff;
}

.feishu-form > a {
  font-size: 14px;
}
</style>
