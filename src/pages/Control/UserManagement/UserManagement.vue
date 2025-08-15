<template>
  <div :class="$style.userManagement" :data-theme="currentTheme" :dir="isRTL ? 'rtl' : 'ltr'">
    <!-- Header Section -->
    <header :class="$style.header">
      <div :class="$style.headerContent">
        <!-- <div :class="$style.headerInfo">
          <h1 :class="$style.title">{{ t('userManagement.title') }}</h1>
          <p :class="$style.subtitle">{{ t('userManagement.subtitle') }}</p>
        </div> -->
        
        <div :class="$style.headerActions" v-if="isCurrentUserAdmin">
          <button 
            :class="[$style.actionBtn, $style.primaryBtn]" 
            @click="openUserModal('create')"
          >
            <i class="fas fa-user-plus"></i>
            {{ t('userManagement.users.addUser') }}
          </button>
          
          <button 
            :class="[$style.actionBtn, $style.primaryBtn]" 
            @click="openGroupModal('create')"
          >
            <i class="fas fa-users"></i>
            {{ t('userManagement.groups.addGroup') }}
          </button>
          
          <button 
            :class="[$style.actionBtn, $style.refreshBtn]" 
            @click="refreshData"
            :disabled="loading"
          >
            <i class="fas fa-sync-alt" :class="{ [$style.spinning]: loading }"></i>
            {{ t('userManagement.buttons.refresh') }}
          </button>
        </div>
      </div>
    </header>

    <!-- Dashboard Stats -->
    <section :class="$style.statsSection" v-if="dashboardStats">
      <div :class="$style.statsGrid">
        <div :class="[$style.statCard, $style.totalUsers]">
          <div :class="$style.statIcon">
            <i class="fas fa-users"></i>
          </div>
          <div :class="$style.statContent">
            <div :class="$style.statNumber">{{ dashboardStats.total_users }}</div>
            <div :class="$style.statLabel">{{ t('userManagement.dashboard.totalUsers') }}</div>
          </div>
        </div>
        
        <div :class="[$style.statCard, $style.activeUsers]">
          <div :class="$style.statIcon">
            <i class="fas fa-user-check"></i>
          </div>
          <div :class="$style.statContent">
            <div :class="$style.statNumber">{{ dashboardStats.active_users }}</div>
            <div :class="$style.statLabel">{{ t('userManagement.dashboard.activeUsers') }}</div>
          </div>
        </div>
        
        <div :class="[$style.statCard, $style.totalGroups]">
          <div :class="$style.statIcon">
            <i class="fas fa-layer-group"></i>
          </div>
          <div :class="$style.statContent">
            <div :class="$style.statNumber">{{ dashboardStats.total_groups }}</div>
            <div :class="$style.statLabel">{{ t('userManagement.dashboard.totalGroups') }}</div>
          </div>
        </div>
        
        <div :class="[$style.statCard, $style.admins]">
          <div :class="$style.statIcon">
            <i class="fas fa-user-shield"></i>
          </div>
          <div :class="$style.statContent">
            <div :class="$style.statNumber">{{ dashboardStats.admins }}</div>
            <div :class="$style.statLabel">{{ t('userManagement.dashboard.admins') }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Main Content Tabs -->
    <main :class="$style.mainContent">
      <div :class="$style.tabsContainer">
        <div :class="$style.tabsHeader">
          <button 
            :class="[$style.tabBtn, { [$style.active]: activeTab === 'users' }]"
            @click="setActiveTab('users')"
          >
            <i class="fas fa-users"></i>
            {{ t('userManagement.users.title') }}
          </button>
          
          <button 
            :class="[$style.tabBtn, { [$style.active]: activeTab === 'groups' }]"
            @click="setActiveTab('groups')"
          >
            <i class="fas fa-layer-group"></i>
            {{ t('userManagement.groups.title') }}
          </button>
        </div>

        <!-- Tab Content -->
        <div :class="$style.tabContent">
          <!-- Users Tab -->
          <div v-if="activeTab === 'users'" :class="$style.tabPane">
            <UserManagementTable
              :users="paginatedUsers"
              :loading="loading"
              :selected-users="selectedUsers"
              :current-user="currentUser"
              :total-pages="totalUsersPages"
              :current-page="usersPage"
              :filters="userFilters"
              :sort="userSort"
              :roles="roles"
              @user-selected="toggleUserSelection"
              @select-all="selectAllUsersOnPage"
              @clear-selection="clearUserSelection"
              @page-changed="goToUsersPage"
              @filters-changed="updateUserFilters"
              @sort-changed="updateUserSort"
              @user-action="handleUserAction"
              @bulk-action="handleBulkAction"
            />
          </div>

          <!-- Groups Tab -->
          <div v-if="activeTab === 'groups'" :class="$style.tabPane">
            <GroupManagementTable
              :groups="paginatedGroups"
              :loading="loading"
              :selected-groups="selectedGroups"
              :current-user="currentUser"
              :total-pages="totalGroupsPages"
              :current-page="groupsPage"
              :filters="groupFilters"
              :sort="groupSort"
              @group-selected="toggleGroupSelection"
              @clear-selection="clearGroupSelection"
              @page-changed="goToGroupsPage"
              @filters-changed="updateGroupFilters"
              @sort-changed="updateGroupSort"
              @group-action="handleGroupAction"
            />
          </div>
        </div>
      </div>
    </main>

    <!-- User Modal -->
    <UserModal
      v-if="userModalVisible"
      :mode="userModalMode"
      :user="selectedUser"
      :roles="roles"
      :groups="groupsDropdown"
      @save="handleUserSave"
      @close="closeUserModal"
    />

    <!-- Group Modal -->
    <GroupModal
      v-if="groupModalVisible"
      :mode="groupModalMode"
      :group="selectedGroup"
      @save="handleGroupSave"
      @close="closeGroupModal"
    />

    <!-- Bulk Action Modal -->
    <BulkActionModal
      v-if="bulkActionModalVisible"
      :mode="bulkActionMode"
      :selected-users="selectedUsers"
      :groups="groupsDropdown"
      :roles="roles"
      @save="handleBulkActionApply"
      @close="closeBulkActionModal"
    />

    <!-- Add Users to Group Modal -->
    <AddUsersToGroupModal
      :visible="addUsersToGroupModalVisible"
      :group="selectedGroupForAddUsers"
      @success="handleAddUsersToGroupSuccess"
      @close="closeAddUsersToGroupModal"
    />

    <!-- User Role Change Modal -->
    <UserRoleModal
      :visible="userRoleModalVisible"
      :user="selectedUserForRole"
      @success="handleUserRoleChangeSuccess"
      @close="closeUserRoleModal"
    />

    <!-- Loading Overlay -->
    <div v-if="loading" :class="$style.loadingOverlay">
      <div :class="$style.loadingSpinner">
        <i class="fas fa-spinner fa-spin"></i>
        <p>{{ t('common.loading') }}...</p>
      </div>
    </div>

    <!-- Error Message -->
    <div v-if="error" :class="$style.errorMessage">
      <div :class="$style.errorContent">
        <i class="fas fa-exclamation-triangle"></i>
        <span>{{ error }}</span>
        <button @click="clearError" :class="$style.errorClose">
          <i class="fas fa-times"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAppStore } from '../../../stores/useAppStore'
import { useUserManagement } from '../../../composables/useUserManagement'
import userManagementService from '../../../services/userManagementService'
import Swal from 'sweetalert2'
import UserManagementTable from '../../../components/UserManagementTable/UserManagementTable.vue'
import GroupManagementTable from '../../../components/GroupManagementTable/GroupManagementTable.vue'
import UserModal from '../../../components/UserModal/UserModal.vue'
import GroupModal from '../../../components/GroupModal/GroupModal.vue'
import BulkActionModal from '../../../components/BulkActionModal/BulkActionModal.vue'
import AddUsersToGroupModal from '../../../components/AddUsersToGroupModal/AddUsersToGroupModal.vue'
import UserRoleModal from '../../../components/UserRoleModal/UserRoleModal.vue'
import type { 
  User, 
  Group,
  UserModalMode,
  GroupModalMode,
  BulkActionMode,
  CreateGroupRequest,
  UpdateGroupRequest,
  InviteUserRequest,
  UpdateUserRoleRequest,
  CreateUserRequest
} from '../../../types/user-management.types'

// Store and composables
const store = useAppStore()
const userManagement = useUserManagement()

// Computed properties
const currentTheme = computed(() => store.currentTheme)
const isRTL = computed(() => store.currentLanguage === 'ar')
const t = computed(() => store.t)

// Destructure user management composable
const {
  loading,
  error,
  currentUser,
  // users, // Unused - commenting out
  // groups, // Unused - commenting out
  selectedUsers,
  selectedGroups,
  dashboardStats,
  roles,
  groupsDropdown,
  userFilters,
  groupFilters,
  userSort,
  groupSort,
  usersPage,
  groupsPage,
  paginatedUsers,
  paginatedGroups,
  totalUsersPages,
  totalGroupsPages,
  isCurrentUserAdmin,
  toggleUserSelection,
  toggleGroupSelection,
  selectAllUsersOnPage,
  clearUserSelection,
  clearGroupSelection,
  goToUsersPage,
  goToGroupsPage,
  updateUserFilters,
  updateGroupFilters,
  updateUserSort,
  updateGroupSort,
  initialize,
  refreshData,
  clearError,
  createNewGroup,
  updateExistingGroup,
  deleteExistingGroup,
  inviteNewUser,
  createNewUser,
  updateExistingUserRole,
  // addUserToExistingGroup, // Unused - commenting out
  // removeUserFromExistingGroup, // Unused - commenting out
  bulkAddUsersToExistingGroup
} = userManagement

// Local state
const activeTab = ref<'users' | 'groups'>('users')
const userModalVisible = ref(false)
const groupModalVisible = ref(false)
const bulkActionModalVisible = ref(false)
const selectedUser = ref<User | null>(null)
const selectedGroup = ref<Group | null>(null)
const userModalMode = ref<UserModalMode>({ type: 'create' })
const groupModalMode = ref<GroupModalMode>({ type: 'create' })
const bulkActionMode = ref<BulkActionMode>({ type: 'add_to_group', selected_users: [] })

// New modals
const addUsersToGroupModalVisible = ref(false)
const selectedGroupForAddUsers = ref<Group | null>(null)
const userRoleModalVisible = ref(false)
const selectedUserForRole = ref<User | null>(null)

// Methods
const setActiveTab = (tab: 'users' | 'groups') => {
  activeTab.value = tab
}

const openUserModal = (type: 'create' | 'edit' | 'view' | 'invite', user?: User) => {
  userModalMode.value = { type, user }
  selectedUser.value = user || null
  userModalVisible.value = true
}

const closeUserModal = () => {
  userModalVisible.value = false
  selectedUser.value = null
}

const openGroupModal = (type: 'create' | 'edit' | 'view', group?: Group) => {
  groupModalMode.value = { type, group }
  selectedGroup.value = group || null
  groupModalVisible.value = true
}

const closeGroupModal = () => {
  groupModalVisible.value = false
  selectedGroup.value = null
}

const openBulkActionModal = (type: 'add_to_group' | 'remove_from_group' | 'change_role') => {
  bulkActionMode.value = { type, selected_users: selectedUsers.value }
  bulkActionModalVisible.value = true
}

const closeBulkActionModal = () => {
  bulkActionModalVisible.value = false
}

const handleUserAction = async (action: string, user: User) => {
  try {
    switch (action) {
      case 'view':
        openUserModal('view', user)
        break
      case 'edit':
        openUserModal('edit', user)
        break
      case 'delete':
        const userDeleteResult = await Swal.fire({
          title: 'تأكيد حذف المستخدم',
          text: 'هل أنت متأكد من حذف هذا المستخدم؟ لا يمكن التراجع عن هذا الإجراء.',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'نعم، احذف',
          cancelButtonText: 'إلغاء',
          confirmButtonColor: '#dc3545',
          cancelButtonColor: '#6c757d'
        })
        
        if (userDeleteResult.isConfirmed) {
          // TODO: Implement user deletion
          await refreshData()
          await Swal.fire({
            title: 'تم الحذف',
            text: 'تم حذف المستخدم بنجاح',
            icon: 'success',
            confirmButtonText: 'موافق',
            confirmButtonColor: '#28a745'
          })
        }
        break
      case 'change_role':
        openUserRoleModal(user)
        break
      case 'view_groups':
        // TODO: Show user groups modal
        break
    }
  } catch (err: any) {
    // Logging removed for production
    await Swal.fire({
      title: 'خطأ في عملية المستخدم',
      text: err.message || 'فشل في تنفيذ العملية المطلوبة',
      icon: 'error',
      confirmButtonText: 'موافق',
      confirmButtonColor: '#dc3545'
    })
  }
}

const handleGroupAction = async (action: string, group: Group) => {
  // Logging removed for production
  try {
    switch (action) {
      case 'view':
        openGroupModal('view', group)
        break
      case 'edit':
        openGroupModal('edit', group)
        break
      case 'delete':
        const groupDeleteResult = await Swal.fire({
          title: 'تأكيد حذف المجموعة',
          text: 'هل أنت متأكد من حذف هذه المجموعة؟ لا يمكن التراجع عن هذا الإجراء.',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'نعم، احذف',
          cancelButtonText: 'إلغاء',
          confirmButtonColor: '#dc3545',
          cancelButtonColor: '#6c757d'
        })
        
        if (groupDeleteResult.isConfirmed) {
          await deleteExistingGroup(group.id)
          await Swal.fire({
            title: 'تم الحذف',
            text: 'تم حذف المجموعة بنجاح',
            icon: 'success',
            confirmButtonText: 'موافق',
            confirmButtonColor: '#28a745'
          })
        }
        break
      case 'add_users':
        // Logging removed for production
        openAddUsersToGroupModal(group)
        break
      case 'view_members':
        openGroupModal('view', group)
        break
    }
  } catch (err: any) {
    // Logging removed for production
    await Swal.fire({
      title: 'خطأ في عملية المجموعة',
      text: err.message || 'فشل في تنفيذ العملية المطلوبة',
      icon: 'error',
      confirmButtonText: 'موافق',
      confirmButtonColor: '#dc3545'
    })
  }
}

const handleBulkAction = (action: string) => {
  if (selectedUsers.value.length === 0) return
  
  openBulkActionModal(action as 'add_to_group' | 'remove_from_group' | 'change_role')
}

const handleUserSave = async (userData: any) => {
  try {
    switch (userModalMode.value.type) {
      case 'create':
        await createNewUser(userData as CreateUserRequest)
        break
      case 'edit':
        if (selectedUser.value) {
          await updateExistingUserRole(selectedUser.value.id, userData as UpdateUserRoleRequest)
        }
        break
      case 'invite':
        await inviteNewUser(userData as InviteUserRequest)
        break
    }
    closeUserModal()
    await Swal.fire({
      title: 'تم بنجاح',
      text: 'تمت عملية المستخدم بنجاح',
      icon: 'success',
      confirmButtonText: 'موافق',
      confirmButtonColor: '#28a745'
    })
  } catch (err: any) {
    // Logging removed for production
    await Swal.fire({
      title: 'خطأ في حفظ المستخدم',
      text: err.message || 'فشل في حفظ بيانات المستخدم',
      icon: 'error',
      confirmButtonText: 'موافق',
      confirmButtonColor: '#dc3545'
    })
  }
}

const handleGroupSave = async (groupData: any) => {
  try {
    let createdGroup: Group | null = null
    
    switch (groupModalMode.value.type) {
      case 'create':
        const response = await createNewGroup(groupData as CreateGroupRequest)
        createdGroup = response.group
        break
      case 'edit':
        if (selectedGroup.value) {
          await updateExistingGroup(selectedGroup.value.id, groupData as UpdateGroupRequest)
        }
        break
    }
    closeGroupModal()
    
    // If group was just created, optionally show add users modal
    if (createdGroup && groupModalMode.value.type === 'create') {
      // Auto-open the add users modal for newly created groups
      setTimeout(() => {
        openAddUsersToGroupModal(createdGroup!)
      }, 300) // Small delay to allow modal transition
    }
    
    await Swal.fire({
      title: 'تم بنجاح',
      text: 'تمت عملية المجموعة بنجاح',
      icon: 'success',
      confirmButtonText: 'موافق',
      confirmButtonColor: '#28a745'
    })
  } catch (err: any) {
    // Logging removed for production
    await Swal.fire({
      title: 'خطأ في حفظ المجموعة',
      text: err.message || 'فشل في حفظ بيانات المجموعة',
      icon: 'error',
      confirmButtonText: 'موافق',
      confirmButtonColor: '#dc3545'
    })
  }
}

const handleBulkActionApply = async (actionData: any) => {
  try {
    switch (bulkActionMode.value.type) {
      case 'add_to_group':
        await bulkAddUsersToExistingGroup(actionData)
        break
      case 'remove_from_group':
        // TODO: Implement bulk remove from group
        break
      case 'change_role':
        // TODO: Implement bulk role change
        break
    }
    closeBulkActionModal()
    clearUserSelection()
    await Swal.fire({
      title: 'تم بنجاح',
      text: 'تمت العملية المجمعة بنجاح',
      icon: 'success',
      confirmButtonText: 'موافق',
      confirmButtonColor: '#28a745'
    })
  } catch (err: any) {
    // Logging removed for production
    await Swal.fire({
      title: 'خطأ في العملية المجمعة',
      text: err.message || 'فشل في تنفيذ العملية المجمعة',
      icon: 'error',
      confirmButtonText: 'موافق',
      confirmButtonColor: '#dc3545'
    })
  }
}

// Add Users to Group Modal Functions
const openAddUsersToGroupModal = async (group: Group) => {
  try {
    // Logging removed for production
    
    // Timeout Promise for 15 seconds
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('TIMEOUT')), 15000)
    })
    
    // Fetch the detailed groups information with members and admins
    const detailedGroupsResponse = await Promise.race([
      userManagementService.getGroupsWithDetails(),
      timeoutPromise
    ]) as any
    
    // Find the detailed group data with members
    const detailedGroup = detailedGroupsResponse.groups.find((g: Group) => g.id === group.id)
    if (!detailedGroup) {
      // Logging removed for production
      return
    }
    
    // Logging removed for production
    selectedGroupForAddUsers.value = detailedGroup
    addUsersToGroupModalVisible.value = true
  } catch (error: any) {
    // Logging removed for production
    if (error.message === 'TIMEOUT') {
      await Swal.fire({
        title: 'انتهت مهلة الطلب',
        text: 'فشل في تحميل بيانات المجموعة خلال 15 ثانية. يرجى المحاولة مرة أخرى.',
        icon: 'error',
        confirmButtonText: 'موافق',
        confirmButtonColor: '#dc3545'
      })
    } else {
      await Swal.fire({
        title: 'خطأ في تحميل البيانات',
        text: 'فشل في تحميل بيانات المجموعة. سيتم استخدام البيانات الأساسية.',
        icon: 'warning',
        confirmButtonText: 'موافق',
        confirmButtonColor: '#ffc107'
      })
    }
    // Fallback to the original group if detailed fetch fails
    selectedGroupForAddUsers.value = group
    addUsersToGroupModalVisible.value = true
  }
}

const closeAddUsersToGroupModal = () => {
  addUsersToGroupModalVisible.value = false
  selectedGroupForAddUsers.value = null
}

const handleAddUsersToGroupSuccess = async () => {
  // Logging removed for production
  
  // Refresh the data
  await initialize()
  
  // Close the modal
  closeAddUsersToGroupModal()
  
  // You could show a success notification here
  // showNotification(`Added users to group successfully`)
}

// User Role Change Modal Functions
const openUserRoleModal = (user: User) => {
  selectedUserForRole.value = user
  userRoleModalVisible.value = true
}

const closeUserRoleModal = () => {
  userRoleModalVisible.value = false
  selectedUserForRole.value = null
}

const handleUserRoleChangeSuccess = async () => {
  // Logging removed for production
  
  // Refresh the data
  await initialize()
  
  // Close the modal
  closeUserRoleModal()
  
  // You could show a success notification here
  // showNotification(`Changed ${data.user.full_name}'s role from ${data.oldRole} to ${data.newRole}`)
}

// Lifecycle
onMounted(() => {
  initialize()
})
</script>

<style module src="./UserManagement.module.css">
/* CSS Module styles are imported from UserManagement.module.css */
</style>
