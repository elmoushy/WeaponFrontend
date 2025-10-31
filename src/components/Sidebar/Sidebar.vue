<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const props = defineProps<{
  theme?: 'day' | 'night'
  userRole?: string | null
  /** v-model */
  modelValue?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'logout'): void
  (e: 'toggleTheme'): void
}>()

const route = useRoute()
const router = useRouter()

/** collapse state mirrors v-model */
const internalCollapsed = ref<boolean>(props.modelValue ?? false)
watch(() => props.modelValue, v => { if (typeof v === 'boolean') internalCollapsed.value = v }, { immediate: true })
watch(internalCollapsed, v => emit('update:modelValue', v))

type NavItem = {
  name: string
  label: string
  icon: string
  path?: string
  requiresRole?: 'admin'
  badge?: number | string
}

type NavGroup = { id: string; items: NavItem[] }

const navGroups = computed<NavGroup[]>(() => {
  const primary: NavItem[] = [
    { name: 'manage-surveys', path: '/surveys', icon: 'fas fa-table-cells-large', label: 'إدارة الاستطلاعات' },
    { name: 'manage-users', path: '/control', icon: 'fas fa-user-group', label: 'إدارة المستخدمين', requiresRole: 'admin' },
    { name: 'surveys-overview', icon: 'fas fa-list-check', label: 'الاستطلاعات' },
    { name: 'placeholder-a', icon: 'far fa-clock', label: 'نص تجريبي' },
    { name: 'placeholder-b', icon: 'far fa-clock', label: 'نص تجريبي' },
  ]

  const support: NavItem[] = [
    { name: 'settings', icon: 'fas fa-gear', label: 'الاعدادات' },
    { name: 'support', icon: 'far fa-circle-question', label: 'الدعم والمساعدة' },
  ]

  const allowedRoles = new Set(['admin', 'super_admin'])
  const filteredPrimary = primary.filter(item => {
    if (!item.requiresRole) return true
    return props.userRole !== null && allowedRoles.has(props.userRole)
  })

  const groups: NavGroup[] = []
  if (filteredPrimary.length) groups.push({ id: 'primary', items: filteredPrimary })
  if (support.length) groups.push({ id: 'support', items: support })
  return groups
})
const isActive = (path?: string) => (path ? route.path === path : false)

/** keyboard shortcut: Cmd/Ctrl + B */
const onKey = (e: KeyboardEvent) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
    e.preventDefault()
    internalCollapsed.value = !internalCollapsed.value
  }
}
onMounted(() => document.addEventListener('keydown', onKey))
onUnmounted(() => document.removeEventListener('keydown', onKey))

/** actions */
const handleNav = (item: NavItem) => {
  if (!item.path || item.path === '#') return
  router.push(item.path)
}
const emitLogout = () => emit('logout')
const toggleTheme = () => emit('toggleTheme')

/** UI states for control buttons */
const isNight = computed(() => props.theme === 'night')           // active style for "الوضع الليلي"
const isCollapsed = computed(() => internalCollapsed.value)       // active style for "مصغّر"

/** Dynamic logo: swap when collapsed */
const logoSrc = computed(() => isCollapsed.value ? '/public/logo.png' : '/public/logo.png')
</script>

<template>
  <aside
    :class="[$style.sidebar, internalCollapsed ? $style.collapsed : '', theme === 'night' ? $style.night : '']"
    role="navigation"
    aria-label="Sidebar"
  >
    <div :class="$style.header">
      <div :class="$style.emblemWrap">
        <img :src="logoSrc" :class="$style.emblem" alt="شعار المجلس الأعلى للأمن الوطني" />
      </div>
  
    </div>

    <nav :class="$style.navArea">
      <template v-for="(group, index) in navGroups" :key="group.id">
        <section :class="$style.groupCard">
          <button
            v-for="item in group.items"
            :key="item.name"
            type="button"
            :class="[$style.item, isActive(item.path) ? $style.active : '']"
            :title="item.label"
            @click="handleNav(item)"
          >
            <span :class="$style.itemIcon">
              <i :class="item.icon"></i>
            </span>
            <span :class="$style.itemText">{{ item.label }}</span>
            <span v-if="item.badge !== undefined" :class="$style.badge">{{ item.badge }}</span>
          </button>
        </section>
        <div v-if="index < navGroups.length - 1" :class="$style.sectionDivider"></div>
      </template>
    </nav>

    <div :class="$style.controls">
      <button
        type="button"
        :class="[$style.controlBtn, isCollapsed ? $style.controlActive : '']"
        @click="internalCollapsed = !internalCollapsed"
      >
        <span :class="$style.controlIcon"><i class="far fa-square"></i></span>
        <span :class="$style.controlText">{{ isCollapsed ? 'موسّع' : 'مصغّر' }}</span>
      </button>

      <button
        type="button"
        :class="[$style.controlBtn, isNight ? $style.controlActive : '']"
        @click="toggleTheme"
      >
        <span :class="$style.controlIcon"><i class="far fa-moon"></i></span>
        <span :class="$style.controlText">الوضع الليلي</span>
      </button>

      <button type="button" :class="$style.logoutBtn" @click="emitLogout">
        <span :class="$style.logoutIcon"><i class="fas fa-arrow-left-long"></i></span>
        <span :class="$style.logoutText">تسجيل الخروج</span>
      </button>
    </div>
  </aside>
</template>

<style module>
:root {
  --sb-width: 320px;
  --sb-width-collapsed: 92px;
}

.sidebar{
  position: fixed;
  /* inset: 0 auto 0 0; */
  inline-size: var(--sb-width);
  block-size: 100vh;
  background:#ffffff;
  /* border-inline-end:1px solid rgba(15,23,42,.08); */
  /* box-shadow:0 12px 34px rgba(15,23,42,.08); */
  display:flex;
  flex-direction:column;
  gap:12px;
  padding-block:18px;
  transition:inline-size .25s ease, background .25s ease, border-color .25s ease;
  z-index: 999;
  direction: rtl;
}
.night{
  background:#181a1f;
  border-inline-end-color:rgba(255,255,255,.08);
  box-shadow:0 18px 40px rgba(8,8,12,.45);
}
.collapsed{ inline-size: var(--sb-width-collapsed); }



.emblem{
  object-fit:contain;
  transition: transform .25s ease, inline-size .25s ease, block-size .25s ease;
}

.night .headerText{ color:#f8fafc; }
.night .headerSubtitle{ color:rgba(248,250,252,.65); }
.collapsed .headerText{ display:none; }
.collapsed .emblemWrap{
  inline-size:70px;
  block-size:70px;
  border-radius:22px;
}
.collapsed .emblem{
  inline-size:48px;
  block-size:48px;
  transform:scale(.96);
}

.navArea{
  flex:1;
  overflow:auto;
  padding-inline:10px;
  display:flex;
  flex-direction:column;
  gap:8px;
}
.groupCard{
  background:#F5F7FA;
  border-radius:26px;
  padding:5px 5px;
  display:flex;
  flex-direction:column;
  gap:8px;
  /* box-shadow: inset 0 0 0 1px rgba(148,163,184,.12); */
}
.night .groupCard{
  background:rgba(245,246,255,.05);
  box-shadow: inset 0 0 0 1px rgba(248,250,252,.08);
}


.item{
  border:none;
  background:transparent;
  display:flex;
  align-items:center;
  justify-content:flex-start;
  gap:12px;
  inline-size:100%;
  padding:12px 14px;
  border-radius:18px;
  font-weight:700;
  font-size:15px;
  color:#111827;
  cursor:pointer;
  transition: background .2s ease, color .2s ease, transform .2s ease;
}
.item:hover{
  background:rgba(255,255,255,.8);
  transform:translateY(-1px);
}
.night .item{
  color:#e2e8f0;
}
.night .item:hover{
  background:rgba(255,255,255,.08);
}
.itemIcon{
  inline-size:36px;
  block-size:36px;
  border-radius:14px;
  background:#ffffff;
  display:grid;
  place-items:center;
  color:#b78a41;
  box-shadow:0 10px 20px rgba(183,138,65,.25);
  flex-shrink:0;
}
.night .itemIcon{
  background:rgba(24,26,31,.92);
  color:#facc15;
}
.itemText{
  flex:1;
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
  text-align:right;
}
.badge{
  font-size:12px;
  padding:2px 10px;
  border-radius:999px;
  font-weight:700;
  background:linear-gradient(135deg,#A17D23,#B78A41);
  color:#f8fafc;
  box-shadow:0 6px 16px rgba(161,125,35,.35);
}
.active{
  background:#faf0dc;
  color:#b78a41;
  box-shadow: inset 0 0 0 1px rgba(183,138,65,.28), 0 10px 24px rgba(183,138,65,.22);
}
.active .itemIcon{
  background:linear-gradient(135deg,#B78A41,#A17D23);
  color:#ffffff;
  box-shadow:0 12px 24px rgba(183,138,65,.35);
}

.controls{
  padding:0 18px 24px;
  display:flex;
  flex-direction:column;
  gap:12px;
}
.controlBtn{
  border:none;
  background:#f4f6fb;
  border-radius:999px;
  padding:12px 20px;
  display:flex;
  align-items:center;
  justify-content:flex-start;
  gap:12px;
  font-weight:700;
  color:#111827;
  cursor:pointer;
  transition: background .2s ease, box-shadow .2s ease, color .2s ease;
}
.controlBtn:hover{
  background:#ffffff;
  box-shadow:0 14px 28px rgba(148,163,184,.22);
}
.night .controlBtn{
  background:rgba(248,250,252,.08);
  color:#e2e8f0;
}
.controlIcon{
  inline-size:34px;
  block-size:34px;
  border-radius:50%;
  background:#ffffff;
  display:grid;
  place-items:center;
  color:#111827;
  box-shadow:0 10px 20px rgba(15,23,42,.15);
  flex-shrink:0;
}
.night .controlIcon{
  background:rgba(24,26,31,.92);
  color:#facc15;
}
.controlActive{
  box-shadow: inset 0 0 0 2px rgba(183,138,65,.35), 0 12px 28px rgba(183,138,65,.18);
  color:#b78a41;
}
.controlActive .controlIcon{
  background:linear-gradient(135deg,#B78A41,#A17D23);
  color:#ffffff;
  box-shadow:0 16px 28px rgba(183,138,65,.28);
}
.controlText{
  flex:1;
  text-align:right;
}

.logoutBtn{
  border:none;
  background:#efe5d8;
  border-radius:999px;
  padding:12px 20px;
  display:flex;
  align-items:center;
  justify-content:flex-start;
  gap:12px;
  font-weight:800;
  color:#7a5a1e;
  cursor:pointer;
  transition: transform .2s ease, box-shadow .2s ease;
}
.logoutBtn:hover{
  transform:translateY(-1px);
  box-shadow:0 18px 32px rgba(183,138,65,.25);
}
.night .logoutBtn{
  background:rgba(183,138,65,.2);
  color:#f8fafc;
}
.logoutIcon{
  inline-size:36px;
  block-size:36px;
  border-radius:50%;
  background:linear-gradient(135deg,#B78A41,#A17D23);
  display:grid;
  place-items:center;
  color:#ffffff;
  box-shadow:0 20px 30px rgba(183,138,65,.35);
  flex-shrink:0;
}
.logoutText{
  flex:1;
  text-align:right;
}

.collapsed .navArea{
  padding-inline:12px;
}
.collapsed .groupCard{
  padding:14px 10px;
  align-items:center;
  gap:10px;
}
.collapsed .item{
  flex-direction:column;
  align-items:center;
  gap:8px;
  padding:12px;
}
.collapsed .itemText,
.collapsed .badge,
.collapsed .controlText,
.collapsed .logoutText{
  display:none;
}
.collapsed .itemIcon{
  inline-size:46px;
  block-size:46px;
  border-radius:16px;
}
.collapsed .controls{
  padding-inline:12px;
}
.collapsed .controlBtn,
.collapsed .logoutBtn{
  justify-content:center;
  padding-block:14px;
}
.collapsed .controlIcon,
.collapsed .logoutIcon{
  inline-size:44px;
  block-size:44px;
}
</style>
