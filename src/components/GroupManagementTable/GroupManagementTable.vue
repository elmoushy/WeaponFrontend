<template>
  <div :class="$style.groupTable" :dir="isRTL ? 'rtl' : 'ltr'">
    <!-- Similar structure to UserManagementTable but for groups -->
    <div :class="$style.tableHeader">
      <div :class="$style.searchSection">
        <div :class="$style.searchBox">
          <i class="fas fa-search" :class="$style.searchIcon"></i>
          <input 
            type="text" 
            :placeholder="t('userManagement.groups.searchGroups')"
            :value="filters.search || ''"
            @input="onSearchChange"
            :class="$style.searchInput"
          />
        </div>
      </div>
    </div>

    <div :class="$style.tableContainer">
      <table :class="$style.table">
        <thead :class="$style.tableHead">
          <tr>
            <th :class="$style.checkboxColumn">
              <input type="checkbox" :class="$style.checkbox" />
            </th>
            <th :class="$style.nameColumn">{{ t('userManagement.groups.columns.name') }}</th>
            <th :class="$style.countColumn">{{ t('userManagement.groups.columns.adminCount') }}</th>
            <th :class="$style.countColumn">{{ t('userManagement.groups.columns.userCount') }}</th>
            <th :class="$style.actionsColumn">{{ t('userManagement.groups.columns.actions') }}</th>
          </tr>
        </thead>
        <tbody :class="$style.tableBody">
          <tr v-for="group in groups" :key="group.id" :class="$style.tableRow">
            <td :class="$style.checkboxCell">
              <input type="checkbox" :class="$style.checkbox" />
            </td>
            <td :class="$style.nameCell">{{ group.name }}</td>
            <td :class="$style.countCell">{{ group.admin_count }}</td>
            <td :class="$style.countCell">{{ group.user_count }}</td>
            <td :class="$style.actionsCell">
              <div :class="$style.actionButtons">
                <button 
                  :class="[$style.actionBtn, $style.addUsersBtn]"
                  @click="handleAddUsersClick(group)"
                  :title="isRTL ? 'إضافة مستخدمين' : 'Add Users'"
                >
                  <i class="fas fa-user-plus"></i>
                </button>
                <button 
                  :class="[$style.actionBtn, $style.viewBtn]"
                  @click="$emit('group-action', 'view', group)"
                  :title="isRTL ? 'عرض' : 'View'"
                >
                  <i class="fas fa-eye"></i>
                </button>
                <button 
                  :class="[$style.actionBtn, $style.editBtn]"
                  @click="$emit('group-action', 'edit', group)"
                  :title="isRTL ? 'تعديل' : 'Edit'"
                >
                  <i class="fas fa-edit"></i>
                </button>
                <button 
                  :class="[$style.actionBtn, $style.deleteBtn]"
                  @click="$emit('group-action', 'delete', group)"
                  :title="isRTL ? 'حذف' : 'Delete'"
                >
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      
      <div v-if="groups.length === 0 && !loading" :class="$style.emptyState">
        <i class="fas fa-layer-group" :class="$style.emptyIcon"></i>
        <h3 :class="$style.emptyTitle">{{ t('userManagement.groups.noGroupsFound') }}</h3>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '../../stores/useAppStore'
import type { Group, GroupFilters, SortOptions, User } from '../../types/user-management.types'

interface Props {
  groups: Group[]
  loading?: boolean
  selectedGroups: Group[]
  currentUser: User | null
  totalPages: number
  currentPage: number
  filters: GroupFilters
  sort: SortOptions
}

// Props are used through destructuring in the template, so we need to keep them available
defineProps<Props>()

interface Emits {
  (e: 'group-selected', group: Group): void
  (e: 'clear-selection'): void
  (e: 'page-changed', page: number): void
  (e: 'filters-changed', filters: Partial<GroupFilters>): void
  (e: 'sort-changed', sort: SortOptions): void
  (e: 'group-action', action: string, group: Group): void
}

const emit = defineEmits<Emits>()

const store = useAppStore()
const isRTL = computed(() => store.currentLanguage === 'ar')
const t = computed(() => store.t)

const onSearchChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('filters-changed', { search: target.value })
}

const handleAddUsersClick = (group: Group) => {
  // Logging removed for production
  alert(`Add Users clicked for group: ${group.name}`)
  emit('group-action', 'add_users', group)
}
</script>

<style module>
.groupTable {
  width: 100%;
}

.tableHeader {
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-glass);
}

.searchSection {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.searchBox {
  position: relative;
  flex: 1;
  min-width: 250px;
}

.searchInput {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 0.9rem;
}

.groupTable[dir="rtl"] .searchInput {
  padding: 0.75rem 2.5rem 0.75rem 1rem;
}

.searchIcon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
}

.groupTable[dir="rtl"] .searchIcon {
  right: 0.75rem;
  left: auto;
}

.tableContainer {
  overflow-x: auto;
}

.table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.tableHead {
  background: var(--bg-glass);
}

.tableHead th {
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border-color);
  vertical-align: middle;
}

.groupTable[dir="rtl"] .tableHead th {
  text-align: right;
}

.checkboxColumn {
  width: 60px;
  text-align: center !important;
}

.nameColumn {
  width: auto;
  min-width: 200px;
}

.countColumn {
  width: 120px;
  text-align: center !important;
}

.actionsColumn {
  width: 200px;
  text-align: center !important;
}

.checkbox {
  width: 16px;
  height: 16px;
  accent-color: var(--accent-primary);
  cursor: pointer;
}

.tableBody {
  background: transparent;
}

.tableRow {
  transition: all 0.2s;
}

.tableRow:hover {
  background: var(--bg-glass);
}

.tableRow td {
  padding: 1rem;
  border-bottom: 1px solid var(--border-color);
  vertical-align: middle;
}

.checkboxCell {
  text-align: center;
  width: 60px;
}

.nameCell {
  font-weight: 500;
  color: var(--text-primary);
}

.countCell {
  text-align: center;
  font-weight: 600;
  color: var(--text-primary);
}

.actionsCell {
  text-align: center;
}

.actionButtons {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}

.actionBtn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  background: var(--bg-glass);
  color: var(--text-secondary);
}

.addUsersBtn:hover {
  background: #28a745;
  color: white;
}

.viewBtn:hover {
  background: var(--accent-primary);
  color: white;
}

.editBtn:hover {
  background: #4facfe;
  color: white;
}

.deleteBtn:hover {
  background: #ff6b6b;
  color: white;
}

.emptyState {
  padding: 4rem 2rem;
  text-align: center;
  color: var(--text-muted);
}

.emptyIcon {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: var(--text-muted);
}
</style>
