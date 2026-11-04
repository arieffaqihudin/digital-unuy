<script setup lang="ts">
import { ArrowUpRight } from 'lucide-vue-next'
import type { SearchResultDTO } from '~/shared/types'

const props = withDefaults(defineProps<{ result: SearchResultDTO; query?: string; compact?: boolean }>(), {
  query: '',
  compact: false
})

type Part = { text: string; match: boolean }

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function highlightParts(text: string): Part[] {
  const value = String(text || '')
  const query = props.query.trim()
  if (!query) return [{ text: value, match: false }]
  const regex = new RegExp(escapeRegex(query), 'gi')
  const parts: Part[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = regex.exec(value)) !== null) {
    if (match.index > lastIndex) parts.push({ text: value.slice(lastIndex, match.index), match: false })
    parts.push({ text: match[0], match: true })
    lastIndex = match.index + match[0].length
    if (match[0].length === 0) regex.lastIndex += 1
  }
  if (lastIndex < value.length) parts.push({ text: value.slice(lastIndex), match: false })
  return parts.length ? parts : [{ text: value, match: false }]
}
</script>

<template>
  <NuxtLink
    :to="result.href"
    class="group flex items-start gap-3 border-b border-line-warm transition-colors duration-150 hover:bg-soft-white"
    :class="compact ? 'px-4 py-3' : 'px-5 py-4'"
  >
    <div class="min-w-0 flex-1">
      <div class="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-semibold uppercase tracking-[0.12em]">
        <span class="text-gold-dark">{{ result.typeLabel }}</span>
        <span class="h-1 w-1 rounded-full bg-slate-300" aria-hidden="true" />
        <span class="text-slate-500">{{ result.category }}</span>
      </div>
      <p class="mt-1 font-semibold leading-6 tracking-[-0.01em] text-charcoal transition-colors duration-150 group-hover:text-unu-green" :class="compact ? 'text-[15px]' : 'text-[16px]'">
        <template v-for="(part, index) in highlightParts(result.title)" :key="index">
          <mark v-if="part.match" class="rounded-[2px] bg-gold-soft/70 px-0.5 text-charcoal">{{ part.text }}</mark>
          <template v-else>{{ part.text }}</template>
        </template>
      </p>
      <p v-if="result.excerpt" class="mt-1 text-slate-600" :class="compact ? 'line-clamp-1 text-[13px] leading-5' : 'line-clamp-2 text-[14px] leading-6'">
        <template v-for="(part, index) in highlightParts(result.excerpt)" :key="index">
          <mark v-if="part.match" class="rounded-[2px] bg-gold-soft/70 px-0.5 text-charcoal">{{ part.text }}</mark>
          <template v-else>{{ part.text }}</template>
        </template>
      </p>
    </div>
    <ArrowUpRight :size="14" class="mt-1 shrink-0 text-slate-400 transition duration-150 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-unu-green" aria-hidden="true" />
  </NuxtLink>
</template>
