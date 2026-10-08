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
    height: 500,
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

const frameSrc = computed(() => {
  const url = projectUrl.value
  if (!url) return ''

  const projectId = url.pathname.replace(/^\/|\/$/g, '')
  if (
    url.hostname === 'makecode.microbit.org' &&
    /^(?:_[a-zA-Z0-9]+|\d+(?:-\d+){3})$/.test(projectId)
  ) {
    return `${url.origin}/---codeembed#pub:${projectId}`
  }

  return url.href
})

const frameHeight = computed(() => {
  return typeof props.height === 'number' ? `${props.height}px` : props.height
})
</script>

<template>
  <div v-if="projectUrl" class="feishu-form">
    <iframe
      class="feishu-form__frame"
      :src="frameSrc"
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
  border-radius: 4px;
  background: var(--vp-c-bg-soft);
}

.feishu-form > a {
  font-size: 14px;
}
</style>
