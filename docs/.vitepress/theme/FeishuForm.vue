<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    url: string
    title?: string
    height?: number | string
    lang?: string
  }>(),
  {
    title: 'MakeCode Project',
    height: 800,
    lang: 'en',
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

const projectId = computed(() => {
  const url = projectUrl.value
  if (url?.hostname !== 'makecode.microbit.org') return ''
  const id = url.pathname.replace(/^\/|\/$/g, '')
  return /^(?:_[a-zA-Z0-9]+|\d+(?:-\d+){3})$/.test(id) ? id : ''
})

function makeCodeUrl(pathname: string, hash = '') {
  const url = new URL(pathname, 'https://makecode.microbit.org')
  url.searchParams.set('lang', props.lang)
  url.hash = hash
  return url.href
}

// The official share page does not pass its language parameter to its inner frame.
const frameSrc = computed(() => projectId.value
  ? makeCodeUrl('/', 'sandbox:' + projectId.value)
  : projectUrl.value?.href)
const editUrl = computed(() => makeCodeUrl('/', 'pub:' + projectId.value))
const evaluateUrl = computed(() => makeCodeUrl('/--eval', 'project=' + projectId.value))
const openUrl = computed(() => projectId.value
  ? makeCodeUrl('/' + projectId.value)
  : projectUrl.value?.href)

const projectName = ref('')
const displayTitle = computed(() => props.title !== 'MakeCode Project'
  ? props.title
  : projectName.value || props.title)

watch(projectId, async (id, _, onCleanup) => {
  projectName.value = ''
  if (!id || typeof window === 'undefined') return
  const controller = new AbortController()
  onCleanup(() => controller.abort())
  try {
    const response = await fetch('https://makecode.microbit.org/api/' + id, {
      signal: controller.signal,
    })
    if (!response.ok) return
    const metadata = await response.json()
    if (!controller.signal.aborted && typeof metadata.name === 'string') {
      projectName.value = metadata.name
    }
  } catch {
    // Keep the supplied title when metadata is unavailable.
  }
}, { immediate: true })

const frameHeight = computed(() => {
  return typeof props.height === 'number' ? props.height + 'px' : props.height
})
</script>

<template>
  <div v-if="projectUrl" class="feishu-form">
    <div class="feishu-form__card">
      <div v-if="projectId" class="feishu-form__header">
        <a class="feishu-form__brand" href="https://makecode.com/" target="_blank" rel="noopener noreferrer" aria-label="Microsoft MakeCode">
          <img src="https://makecode.trafficmanager.cn/blob/6b77415ea54ca5734e224edcc035e72def037edf/static/Microsoft-logo_rgb_c-gray.png" alt="Microsoft" width="108" height="24">
        </a>
        <span class="feishu-form__title">{{ displayTitle }}</span>
        <div class="feishu-form__actions">
          <a :href="evaluateUrl" target="_blank" rel="noopener noreferrer">Evaluate</a>
          <a :href="editUrl" target="_blank" rel="noopener noreferrer">Edit Code</a>
        </div>
      </div>
      <iframe
        class="feishu-form__frame"
        :src="frameSrc"
        :title="displayTitle"
        :style="{ height: frameHeight }"
        width="100%"
        loading="lazy"
        allowfullscreen
      />
    </div>
    <a :href="openUrl" target="_blank" rel="noopener noreferrer">
      Open project in a new tab
    </a>
  </div>
</template>

<style scoped>
.feishu-form {
  margin: 16px 0 28px;
}

.feishu-form__card {
  margin-bottom: 8px;
  overflow: hidden;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: #fff;
}

.feishu-form__header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  color: #222;
}

.feishu-form__brand {
  flex-shrink: 0;
}

.feishu-form__brand img {
  display: block;
  margin: 0;
}

.feishu-form__title {
  flex: 1;
  font-size: 20px;
  font-weight: 600;
  overflow-wrap: anywhere;
}

.feishu-form__actions {
  display: flex;
  gap: 4px;
}

.feishu-form__actions a {
  padding: 8px 14px;
  border-radius: 4px;
  background: #e0e1e2;
  color: #333;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
}

.feishu-form__actions a:hover {
  background: #cacbcd;
}

.feishu-form__frame {
  display: block;
  width: 100%;
  border: 0;
}

.feishu-form > a {
  font-size: 14px;
}
</style>
