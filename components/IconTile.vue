<script setup lang="ts">
import {
  BadgeCheck,
  BookOpen,
  Briefcase,
  Code2,
  Database,
  FileText,
  Globe2,
  GraduationCap,
  Headphones,
  Layers,
  LayoutGrid,
  LockKeyhole,
  Mail,
  Megaphone,
  MonitorSmartphone,
  Network,
  Server,
  ShieldCheck,
  Users,
  Workflow,
  Wrench
} from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    name?: string
    size?: 'sm' | 'md' | 'lg'
    tone?: 'light' | 'dark' | 'sage'
  }>(),
  { name: 'layers', size: 'md', tone: 'sage' }
)

const icons = {
  mail: Mail,
  code: Code2,
  server: Server,
  layers: Layers,
  headphones: Headphones,
  network: Network,
  globe: Globe2,
  shield: ShieldCheck,
  grid: LayoutGrid,
  book: BookOpen,
  users: Users,
  workflow: Workflow,
  database: Database,
  academic: GraduationCap,
  monitor: MonitorSmartphone,
  file: FileText,
  megaphone: Megaphone,
  wrench: Wrench,
  badge: BadgeCheck,
  lock: LockKeyhole,
  briefcase: Briefcase
}

const component = computed(() => (icons as Record<string, any>)[props.name] || Layers)
const wrapper = computed(() => ({
  sm: 'h-9 w-9 rounded-lg',
  md: 'h-11 w-11 rounded-xl',
  lg: 'h-14 w-14 rounded-2xl'
})[props.size])

const tones = {
  light: 'bg-white text-charcoal ring-1 ring-line-warm',
  dark: 'bg-charcoal text-ivory',
  sage: 'bg-sage-soft text-charcoal ring-1 ring-sage'
}
</script>

<template>
  <span class="inline-grid shrink-0 place-items-center" :class="[wrapper, tones[tone]]" aria-hidden="true">
    <component :is="component" :size="size === 'lg' ? 26 : size === 'sm' ? 16 : 20" :stroke-width="1.8" />
  </span>
</template>
