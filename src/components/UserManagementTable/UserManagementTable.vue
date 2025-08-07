<template>
  <div :class="$style.userTable" :dir="isRTL ? 'rtl' : 'ltr'">
    <!-- Search and Filters -->
    <div :class="$style.tableHeader">
      <div :class="$style.searchSection">
        <div :class="$style.searchBox">
          <i class="fas fa-search" :class="$style.searchIcon"></i>
          <input 
            type="text" 
            :placeholder="t('userManagement.users.searchUsers')"
            :value="filters.search || ''"
            @input="onSearchChange"
            :class="$style.searchInput"
          />
        </div>
        
        <div :class="$style.filters">
          <select 
            :value="filters.role || ''"
            @change="onRoleFilterChange"
            :class="$style.filterSelect"
          >
            <option value="">{{ t('userManagement.filters.all') }}</option>
            <option 
              v-for="role in roles" 
              :key="role.value" 
              :value="role.value"
            >
              {{ role.display }}
            </option>
          </select>
          
          <select 
            :value="filters.is_active?.toString() || ''"
            @change="onStatusFilterChange"
            :class="$style.filterSelect"
          >
            <option value="">{{ t('userManagement.filters.all') }}</option>
            <option value="true">{{ t('userManagement.filters.active') }}</option>
            <option value="false">{{ t('userManagement.filters.inactive') }}</option>
          </select>
        </div>
      </div>
      
      <!-- Bulk Actions -->
      <div :class="$style.bulkActions" v-if="selectedUsers.length > 0">
        <span :class="$style.selectedCount">
          {{ selectedUsers.length }} {{ t('userManagement.users.selectedUsers') }}
        </span>
        <button 
          :class="[$style.bulkBtn, $style.primaryBtn]"
          @click="$emit('bulk-action', 'add_to_group')"
        >
          <i class="fas fa-users"></i>
          {{ t('userManagement.users.actions.addToGroup') }}
        </button>
        <button 
          :class="[$style.bulkBtn, $style.secondaryBtn]"
          @click="$emit('clear-selection')"
        >
          <i class="fas fa-times"></i>
          {{ t('userManagement.buttons.cancel') }}
        </button>
      </div>
    </div>

    <!-- Table Container -->
    <div :class="$style.tableContainer">
      <table :class="$style.table">
        <thead :class="$style.tableHead">
          <tr>
            <th :class="$style.checkboxColumn">
              <input 
                type="checkbox" 
                @change="onSelectAllChange"
                :checked="isAllSelected"
                :class="$style.checkbox"
              />
            </th>
            <th :class="$style.sortableColumn" @click="onSortChange('email')">
              {{ t('userManagement.users.columns.email') }}
              <i :class="getSortIcon('email')"></i>
            </th>
            <th :class="$style.sortableColumn" @click="onSortChange('full_name')">
              {{ t('userManagement.users.columns.name') }}
              <i :class="getSortIcon('full_name')"></i>
            </th>
            <th :class="$style.sortableColumn" @click="onSortChange('role')">
              {{ t('userManagement.users.columns.role') }}
              <i :class="getSortIcon('role')"></i>
            </th>
            <th>{{ t('userManagement.users.columns.status') }}</th>
            <th :class="$style.sortableColumn" @click="onSortChange('last_login')">
              {{ t('userManagement.users.columns.lastLogin') }}
              <i :class="getSortIcon('last_login')"></i>
            </th>
            <th>{{ t('userManagement.users.columns.actions') }}</th>
          </tr>
        </thead>
        <tbody :class="$style.tableBody">
          <tr 
            v-for="user in users" 
            :key="user.id"
            :class="[$style.tableRow, { [$style.selected]: isUserSelected(user) }]"
          >
            <td :class="$style.checkboxColumn">
              <input 
                type="checkbox" 
                :checked="isUserSelected(user)"
                @change="() => $emit('user-selected', user)"
                :class="$style.checkbox"
              />
            </td>
            <td :class="$style.emailColumn">
              <div :class="$style.userEmail">{{ user.email }}</div>
            </td>
            <td :class="$style.nameColumn">
              <div :class="$style.userName">{{ user.full_name }}</div>
            </td>
            <td :class="$style.roleColumn">
              <span :class="[$style.roleBadge, $style[user.role]]">
                {{ getRoleDisplay(user.role) }}
              </span>
            </td>
            <td :class="$style.statusColumn">
              <span :class="[$style.statusBadge, user.is_active ? $style.active : $style.inactive]">
                {{ user.is_active ? t('userManagement.users.status.active') : t('userManagement.users.status.inactive') }}
              </span>
            </td>
            <td :class="$style.lastLoginColumn">
              {{ formatDate(user.last_login) }}
            </td>
            <td :class="$style.actionsColumn">
              <div :class="$style.actionButtons">
                <!-- <button 
                  :class="[$style.actionBtn, $style.viewBtn]"
                  @click="$emit('user-action', 'view', user)"
                  :title="t('userManagement.tooltips.viewUser')"
                >
                  <i class="fas fa-eye"></i>
                </button> -->
                <button 
                  v-if="canEditUser(user)"
                  :class="[$style.actionBtn, $style.editBtn]"
                  @click="$emit('user-action', 'edit', user)"
                  :title="t('userManagement.tooltips.editUser')"
                >
                  <i class="fas fa-edit"></i>
                </button>
                <!-- <button 
                  v-if="canDeleteUser(user)"
                  :class="[$style.actionBtn, $style.deleteBtn]"
                  @click="$emit('user-action', 'delete', user)"
                  :title="t('userManagement.tooltips.deleteUser')"
                >
                  <i class="fas fa-trash"></i>
                </button> -->
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      
      <!-- Empty State -->
      <div v-if="users.length === 0 && !loading" :class="$style.emptyState">
        <i class="fas fa-users" :class="$style.emptyIcon"></i>
        <h3 :class="$style.emptyTitle">{{ t('userManagement.users.noUsersFound') }}</h3>
      </div>
      
      <!-- Loading State -->
      <div v-if="loading" :class="$style.loadingState">
        <i class="fas fa-spinner fa-spin" :class="$style.loadingIcon"></i>
        <p>{{ t('common.loading') }}...</p>
      </div>
    </div>

    <!-- Pagination -->
    <div :class="$style.pagination" v-if="totalPages > 1">
      <button 
        :class="[$style.paginationBtn, { [$style.disabled]: currentPage === 1 }]"
        @click="$emit('page-changed', 1)"
        :disabled="currentPage === 1"
      >
        {{ t('userManagement.pagination.first') }}
      </button>
      
      <button 
        :class="[$style.paginationBtn, { [$style.disabled]: currentPage === 1 }]"
        @click="$emit('page-changed', currentPage - 1)"
        :disabled="currentPage === 1"
      >
        {{ t('userManagement.pagination.previous') }}
      </button>
      
      <span :class="$style.paginationInfo">
        {{ t('userManagement.pagination.showing') }} {{ currentPage }} {{ t('userManagement.pagination.of') }} {{ totalPages }}
      </span>
      
      <button 
        :class="[$style.paginationBtn, { [$style.disabled]: currentPage === totalPages }]"
        @click="$emit('page-changed', currentPage + 1)"
        :disabled="currentPage === totalPages"
      >
        {{ t('userManagement.pagination.next') }}
      </button>
      
      <button 
        :class="[$style.paginationBtn, { [$style.disabled]: currentPage === totalPages }]"
        @click="$emit('page-changed', totalPages)"
        :disabled="currentPage === totalPages"
      >
        {{ t('userManagement.pagination.last') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '../../stores/useAppStore'
import type { User, UserFilters, SortOptions } from '../../types/user-management.types'

// Props
interface Props {
  users: User[]
  loading?: boolean
  selectedUsers: User[]
  currentUser: User | null
  totalPages: number
  currentPage: number
  filters: UserFilters
  sort: SortOptions
  roles: Array<{ value: string; display: string }>
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

// Emits
interface Emits {
  (e: 'user-selected', user: User): void
  (e: 'select-all'): void
  (e: 'clear-selection'): void
  (e: 'page-changed', page: number): void
  (e: 'filters-changed', filters: Partial<UserFilters>): void
  (e: 'sort-changed', sort: SortOptions): void
  (e: 'user-action', action: string, user: User): void
  (e: 'bulk-action', action: string): void
}

const emit = defineEmits<Emits>()

// Store
const store = useAppStore()

// Computed
const isRTL = computed(() => store.currentLanguage === 'ar')
const t = computed(() => store.t)

const isAllSelected = computed(() => {
  return props.users.length > 0 && props.selectedUsers.length === props.users.length
})

// Methods
const isUserSelected = (user: User) => {
  return props.selectedUsers.some(selected => selected.id === user.id)
}

const canEditUser = (user: User) => {
  if (!props.currentUser) return false
  return props.currentUser.role === 'super_admin' || 
         (props.currentUser.role === 'admin' && user.role !== 'super_admin')
}

const getRoleDisplay = (role: string) => {
  const roleObj = props.roles.find(r => r.value === role)
  return roleObj?.display || role
}

const formatDate = (dateString: string | null) => {
  if (!dateString) return t.value('common.never')
  
  const date = new Date(dateString)
  return new Intl.DateTimeFormat(store.currentLanguage, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

const getSortIcon = (field: string) => {
  if (props.sort.field !== field) return 'fas fa-sort'
  return props.sort.direction === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down'
}

const onSearchChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('filters-changed', { search: target.value })
}

const onRoleFilterChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  emit('filters-changed', { role: target.value || undefined })
}

const onStatusFilterChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  const value = target.value
  let isActive: boolean | undefined = undefined
  if (value === 'true') isActive = true
  if (value === 'false') isActive = false
  emit('filters-changed', { is_active: isActive })
}

const onSelectAllChange = () => {
  if (isAllSelected.value) {
    emit('clear-selection')
  } else {
    emit('select-all')
  }
}

const onSortChange = (field: string) => {
  const newDirection = props.sort.field === field && props.sort.direction === 'asc' ? 'desc' : 'asc'
  emit('sort-changed', { field, direction: newDirection })
}
</script>

<style module>
/* Component-specific styles will go here - keeping it minimal for now */
.userTable {
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
  flex-wrap: wrap;
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

.searchIcon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
}

.filters {
  display: flex;
  gap: 0.5rem;
}

.filterSelect {
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 0.9rem;
}

.bulkActions {
  margin-top: 1rem;
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.selectedCount {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.bulkBtn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
}

.primaryBtn {
  background: var(--accent-primary);
  color: var(--text-primary);
}

.secondaryBtn {
  background: var(--bg-glass);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
}

.tableContainer {
  overflow-x: auto;
}

.table {
  width: 100%;
  border-collapse: collapse;
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
}

.sortableColumn {
  cursor: pointer;
  user-select: none;
}

.sortableColumn:hover {
  background: var(--bg-glass-hover);
}

.tableRow {
  transition: all 0.2s;
}

.tableRow:hover {
  background: var(--bg-glass);
}

.tableRow.selected {
  background: rgba(207, 163, 101, 0.1);
}

.tableRow td {
  padding: 1rem;
  border-bottom: 1px solid var(--border-color);
}

.roleBadge {
  padding: 0.25rem 0.75rem;
  border-radius: 16px;
  font-size: 0.8rem;
  font-weight: 500;
}

.roleBadge.super_admin {
  background: linear-gradient(135deg, #ff6b6b, #ee5a52);
  color: white;
}

.roleBadge.admin {
  background: linear-gradient(135deg, #4facfe, #00f2fe);
  color: white;
}

.roleBadge.user {
  background: var(--bg-glass);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
}

.statusBadge {
  padding: 0.25rem 0.75rem;
  border-radius: 16px;
  font-size: 0.8rem;
  font-weight: 500;
}

.statusBadge.active {
  background: linear-gradient(135deg, #43e97b, #38f9d7);
  color: white;
}

.statusBadge.inactive {
  background: var(--bg-glass);
  color: var(--text-muted);
  border: 1px solid var(--border-color);
}

.actionButtons {
  display: flex;
  gap: 0.5rem;
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
}

.viewBtn {
  background: var(--bg-glass);
  color: var(--text-secondary);
}

.viewBtn:hover {
  background: var(--accent-primary);
  color: white;
}

.editBtn {
  background: var(--bg-glass);
  color: var(--text-secondary);
}

.editBtn:hover {
  background: #4facfe;
  color: white;
}

.deleteBtn {
  background: var(--bg-glass);
  color: var(--text-secondary);
}

.deleteBtn:hover {
  background: #ff6b6b;
  color: white;
}

.emptyState,
.loadingState {
  padding: 4rem 2rem;
  text-align: center;
  color: var(--text-muted);
}

.emptyIcon,
.loadingIcon {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: var(--text-muted);
}

.pagination {
  padding: 1.5rem;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  border-top: 1px solid var(--border-color);
  background: var(--bg-glass);
}

.paginationBtn {
  padding: 0.5rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s;
}

.paginationBtn:hover:not(.disabled) {
  background: var(--accent-primary);
  color: white;
}

.paginationBtn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.paginationInfo {
  margin: 0 1rem;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

/* RTL Support */
[dir="rtl"] .searchIcon {
  left: auto;
  right: 0.75rem;
}

[dir="rtl"] .searchInput {
  padding-left: 1rem;
  padding-right: 2.5rem;
}

[dir="rtl"] .tableHead th {
  text-align: right;
}
</style>
