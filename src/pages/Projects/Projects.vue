<template>
  <div class="projects-page">
    <Navigation />
    
    <!-- Loading Indicator -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Loading files...</p>
      </div>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="error-message">
      <div class="error-content">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>Error</h3>
        <p>{{ error }}</p>
        <button @click="error = null" class="dismiss-btn">Dismiss</button>
      </div>
    </div>

    <main :class="styles.main">
      <div :class="styles.container">
        <!-- Page Header -->
        <header :class="styles.pageHeader">
          <div :class="styles.titleSection">
            <h1 :class="styles.pageTitle">{{ appStore.t('files.title') }}</h1>
            
            <!-- Breadcrumb Navigation -->
            <nav :class="styles.breadcrumb" v-if="currentFolderId">
              <ol :class="styles.breadcrumbList">
                <li v-for="(breadcrumb, index) in breadcrumbs" :key="breadcrumb.id || 'root'">
                  <button 
                    :class="styles.breadcrumbItem"
                    @click="navigateToFolder(breadcrumb.id)"
                    :disabled="index === breadcrumbs.length - 1"
                  >
                    <i class="fas fa-folder" v-if="breadcrumb.id !== null"></i>
                    <i class="fas fa-home" v-else></i>
                    {{ breadcrumb.name }}
                  </button>
                  <i class="fas fa-chevron-right" v-if="index < breadcrumbs.length - 1" :class="styles.breadcrumbSeparator"></i>
                </li>
              </ol>
            </nav>
            
            <!-- Storage Info -->
            <div :class="styles.storageInfo" v-if="quota">
              <div :class="styles.storageBar">
                <div 
                  :class="styles.storageProgress" 
                  :style="{ width: storagePercentage + '%' }"
                ></div>
              </div>
              <span :class="styles.storageText">
                {{ formatFileSize(usedStorage) }} / {{ formatFileSize(totalStorage) }} 
                ({{ storagePercentage.toFixed(1) }}%)
              </span>
            </div>
          </div>
          
          <div :class="styles.headerActions">
            <button 
              :class="styles.createFolderBtn"
              @click="showCreateFolder = true"
              :title="appStore.t('files.createFolder')"
              :disabled="loading"
            >
              <i class="fas fa-folder-plus"></i>
              <span>{{ appStore.t('files.createFolder') }}</span>
            </button>
            
            <button 
              :class="styles.uploadBtn"
              @click="triggerFileUpload"
              :title="appStore.t('files.uploadFiles')"
              :disabled="uploading || loading"
            >
              <i class="fas fa-cloud-upload-alt"></i>
              <span>{{ uploading ? 'Uploading...' : appStore.t('files.uploadFiles') }}</span>
            </button>
          </div>
        </header>

        <!-- File Upload Area -->
        <div 
          :class="[styles.uploadArea, { [styles.dragOver]: isDragOver }]"
          @drop="handleDrop"
          @dragover.prevent="isDragOver = true"
          @dragleave="isDragOver = false"
          @click="triggerFileUpload"
          v-if="!uploading"
        >
          <div :class="styles.uploadContent">
            <i class="fas fa-cloud-upload-alt" :class="styles.uploadIcon"></i>
            <h3>{{ appStore.t('files.dragDropFiles') }}</h3>
            <p>{{ appStore.t('files.maxFileSize') }}</p>
            <button :class="styles.selectFilesBtn" :disabled="loading">
              {{ appStore.t('files.selectFiles') }}
            </button>
          </div>
          
          <!-- Hidden file input -->
          <input 
            ref="fileInput"
            type="file"
            multiple
            :class="styles.hiddenInput"
            @change="handleFileSelect"
            accept="*/*"
          />
        </div>

        <!-- Upload Progress -->
        <div v-if="uploadingFiles.length > 0" :class="styles.uploadProgress">
          <h3>{{ appStore.t('files.uploadProgress') }}</h3>
          <div 
            v-for="file in uploadingFiles" 
            :key="file.id"
            :class="styles.uploadItem"
          >
            <div :class="styles.uploadInfo">
              <i :class="getFileIcon(file as any)"></i>
              <span :class="styles.fileName">{{ file.name }}</span>
              <span :class="styles.fileSize">{{ formatFileSize(file.size) }}</span>
              <span v-if="file.error" :class="styles.uploadError">{{ file.error }}</span>
            </div>
            <div :class="styles.progressBar">
              <div 
                :class="styles.progress" 
                :style="{ width: file.progress + '%' }"
              ></div>
            </div>
            <span :class="styles.progressText">{{ file.progress }}%</span>
          </div>
        </div>

        <!-- Filter and View Controls -->
        <div :class="styles.controls">
          <div :class="styles.leftControls">
            <div :class="styles.searchBox">
              <i class="fas fa-search"></i>
              <input 
                type="text"
                :placeholder="appStore.t('files.searchPlaceholder')"
                v-model="searchQuery"
                :class="styles.searchInput"
                :disabled="loading"
              />
            </div>
            
            <div :class="styles.filterTabs">
              <button 
                v-for="tab in filterTabs"
                :key="tab.key"
                :class="[styles.filterTab, { [styles.active]: activeFilter === tab.key }]"
                @click="activeFilter = tab.key"
                :disabled="loading"
              >
                <i :class="tab.icon"></i>
                <span>{{ appStore.t(tab.label) }}</span>
                <span :class="styles.count">{{ getFileCount(tab.key) }}</span>
              </button>
            </div>
          </div>
          
          <div :class="styles.rightControls">
            <div :class="styles.sortDropdown">
              <select v-model="sortBy" :class="styles.sortSelect" :disabled="loading">
                <option value="name">{{ appStore.t('files.sortName') }}</option>
                <option value="date">{{ appStore.t('files.sortDate') }}</option>
                <option value="size">{{ appStore.t('files.sortSize') }}</option>
                <option value="type">{{ appStore.t('files.sortType') }}</option>
              </select>
            </div>
            
            <div :class="styles.viewToggle">
              <button 
                :class="[styles.viewBtn, { [styles.active]: viewMode === 'grid' }]"
                @click="viewMode = 'grid'"
                :title="appStore.t('files.viewGrid')"
                :disabled="loading"
              >
                <i class="fas fa-th"></i>
              </button>
              <button 
                :class="[styles.viewBtn, { [styles.active]: viewMode === 'list' }]"
                @click="viewMode = 'list'"
                :title="appStore.t('files.viewList')"
                :disabled="loading"
              >
                <i class="fas fa-list"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- Files Content -->
        <div :class="styles.filesContent">
          <!-- Selection Controls -->
          <div v-if="selectedFiles.length > 0" :class="styles.selectionControls">
            <div :class="styles.selectionInfo">
              <span>{{ selectedFiles.length }} {{ appStore.t('files.selectedItems') }}</span>
            </div>
            <div :class="styles.bulkActions">
              <button :class="styles.bulkBtn" @click="shareSelectedFiles" :disabled="loading">
                <i class="fas fa-share"></i>
                {{ appStore.t('files.shareSelected') }}
              </button>
              <button :class="styles.bulkBtn" @click="deleteSelectedFiles" :disabled="loading">
                <i class="fas fa-trash"></i>
                {{ appStore.t('files.deleteSelected') }}
              </button>
            </div>
          </div>

          <!-- Files Grid/List -->
          <div :class="[styles.filesGrid, viewMode === 'list' ? styles.listView : styles.gridView]">
            <div 
              v-for="file in filteredFiles"
              :key="file.id"
              :class="[
                styles.fileItem, 
                { 
                  [styles.selected]: selectedFiles.includes(file.id), 
                  [styles.starred]: starredFiles.includes(file.id) 
                }
              ]"
              @click="toggleSelection(file.id)"
              @dblclick="openFile(file)"
            >
              <!-- File Thumbnail/Icon -->
              <div :class="styles.fileIcon">
                <div :class="styles.fileIconContainer">
                  <i v-if="'thumbnail' in file && file.thumbnail" :class="styles.thumbnailPlaceholder"></i>
                  <i v-else :class="[getFileIcon(file as any), styles.mainFileIcon]" :style="getFileIconColor(file as any)"></i>
                  
                  <!-- File Status Indicators -->
                  <div :class="styles.statusIndicators">
                    <div v-if="'encrypted' in file && file.encrypted" :class="styles.encryptedIndicator" :title="appStore.t('files.security.encrypt')">
                      <i class="fas fa-lock"></i>
                    </div>
                    <div v-if="'file_count' in file" :class="styles.folderIndicator" :title="'Folder'">
                      <i class="fas fa-folder"></i>
                    </div>
                  </div>
                </div>
                
                <div v-if="'thumbnail' in file && file.thumbnail" :class="styles.thumbnail">
                  <img :src="file.thumbnail" :alt="file.name" />
                </div>
              </div>
              
              <!-- File Information -->
              <div :class="styles.fileInfo">
                <h4 :class="styles.fileName">{{ file.name }}</h4>
                
                <div :class="styles.fileDetails">
                  <span :class="styles.fileSize">{{ formatFileSize('file_count' in file ? 0 : file.size) }}</span>
                  <span :class="styles.fileDate">{{ formatDate(file.modified) }}</span>
                  <span v-if="'version' in file && file.version" :class="styles.fileVersion">v{{ file.version }}</span>
                </div>
                
                <!-- Sharing Info -->
                <div v-if="'shared_with' in file && file.shared_with && Array.isArray(file.shared_with) && file.shared_with.length > 0" :class="styles.sharedInfo">
                  <span :class="styles.sharedText">
                    Shared with {{ file.shared_with.length }} {{ file.shared_with.length === 1 ? 'user' : 'users' }}
                  </span>
                </div>
              </div>
              
              <!-- File Actions -->
              <div :class="styles.fileActions" @click.stop>
                <div :class="styles.primaryActions">
                  <button 
                    :class="[styles.actionBtn, styles.starBtn, { [styles.starred]: starredFiles.includes(file.id) }]"
                    @click="toggleStar(file.id)"
                    :title="starredFiles.includes(file.id) ? 'Remove from favorites' : 'Add to favorites'"
                    :disabled="loading"
                  >
                    <i :class="starredFiles.includes(file.id) ? 'fas fa-heart' : 'far fa-heart'"></i>
                  </button>
                  
                  <button 
                    v-if="'file_count' in file"
                    :class="styles.actionBtn"
                    @click="openFolderModal(file)"
                    :title="'Open Folder'"
                    :disabled="loading"
                  >
                    <i class="fas fa-folder-open"></i>
                  </button>
                  
                  <button 
                    v-if="'file_count' in file"
                    :class="styles.actionBtn"
                    @click="downloadFolder(file as any)"
                    :title="'Download as ZIP'"
                    :disabled="loading"
                  >
                    <i class="fas fa-file-archive"></i>
                  </button>
                </div>
                
                <div :class="styles.secondaryActions">
                  <button 
                    v-if="!('file_count' in file)"
                    :class="styles.actionBtn"
                    @click="downloadFile(file as any)"
                    :title="appStore.t('files.download')"
                    :disabled="loading"
                  >
                    <i class="fas fa-download"></i>
                  </button>
                  
                  <button 
                    :class="styles.actionBtn"
                    @click="shareFile(file)"
                    :title="appStore.t('files.share')"
                    :disabled="loading"
                  >
                    <i class="fas fa-share"></i>
                  </button>
                  
                  <button 
                    :class="[styles.actionBtn, styles.dangerBtn]"
                    @click="deleteItem(file)"
                    :title="appStore.t('files.delete')"
                    :disabled="loading"
                  >
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-if="filteredFiles.length === 0 && !loading" :class="styles.emptyState">
            <i class="fas fa-folder-open" :class="styles.emptyIcon"></i>
            <h3>{{ appStore.t('files.noFiles') }}</h3>
            <p>{{ appStore.t('files.dragDropFiles') }}</p>
          </div>
        </div>
      </div>
    </main>

    <!-- Share Modal -->
    <div v-if="showShareModal" :class="styles.modal" @click="closeShareModal">
      <div :class="styles.modalContent" @click.stop>
        <header :class="styles.modalHeader">
          <h3>{{ appStore.t('files.shareFile') }}</h3>
          <button :class="styles.closeBtn" @click="closeShareModal">
            <i class="fas fa-times"></i>
          </button>
        </header>
        
        <div :class="styles.modalBody">
          <div :class="styles.shareForm">
            <label for="userSelect">{{ appStore.t('files.selectUser') }}</label>
            <select id="userSelect" v-model="selectedUser" :class="styles.userSelect">
              <option value="">{{ appStore.t('files.chooseUser') }}</option>
              <option 
                v-for="user in availableUsers" 
                :key="user.id" 
                :value="user.id.toString()"
              >
                {{ user.name }} ({{ user.email }})
              </option>
            </select>
            
            <label>{{ appStore.t('files.permission') }}</label>
            <div :class="styles.permissionOptions">
              <label :class="styles.permissionOption">
                <input type="radio" v-model="sharePermission" value="view" />
                <span>{{ appStore.t('files.permissionView') }}</span>
              </label>
              <label :class="styles.permissionOption">
                <input type="radio" v-model="sharePermission" value="download" />
                <span>{{ appStore.t('files.permissionDownload') }}</span>
              </label>
              <label :class="styles.permissionOption">
                <input type="radio" v-model="sharePermission" value="edit" />
                <span>{{ appStore.t('files.permissionEdit') }}</span>
              </label>
            </div>
          </div>
        </div>
        
        <footer :class="styles.modalFooter">
          <button :class="styles.cancelBtn" @click="closeShareModal">
            {{ appStore.t('common.cancel') }}
          </button>
          <button 
            :class="styles.shareBtn" 
            @click="confirmShare"
            :disabled="!selectedUser || !sharePermission"
          >
            {{ appStore.t('files.share') }}
          </button>
        </footer>
      </div>
    </div>

    <!-- Create Folder Modal -->
    <div v-if="showCreateFolder" :class="styles.modal" @click="showCreateFolder = false">
      <div :class="styles.modalContent" @click.stop>
        <header :class="styles.modalHeader">
          <h3>{{ appStore.t('files.createFolder') }}</h3>
          <button :class="styles.closeBtn" @click="showCreateFolder = false">
            <i class="fas fa-times"></i>
          </button>
        </header>
        
        <div :class="styles.modalBody">
          <div :class="styles.shareForm">
            <label for="folderName">{{ appStore.t('files.folderName') }}</label>
            <input 
              id="folderName"
              type="text" 
              v-model="newFolderName" 
              :class="styles.folderNameInput"
              :placeholder="appStore.t('files.enterFolderName')"
              @keyup.enter="confirmCreateFolder"
            />
          </div>
        </div>
        
        <footer :class="styles.modalFooter">
          <button :class="styles.cancelBtn" @click="showCreateFolder = false">
            {{ appStore.t('common.cancel') }}
          </button>
          <button 
            :class="styles.createBtn" 
            @click="confirmCreateFolder"
            :disabled="!newFolderName.trim() || loading"
          >
            {{ appStore.t('files.create') }}
          </button>
        </footer>
      </div>
    </div>

    <!-- Enhanced Folder Modal Component -->
    <FolderModal
      v-if="showFolderModal"
      :isVisible="showFolderModal"
      :currentFolder="currentFile as any"
      :files="filteredFiles as any"
      :selectedFiles="selectedFiles as any"
      :starredFiles="starredFiles as any"
      :availableUsers="availableUsers"
      @dropFiles="handleFolderDropFiles"
      @close="showFolderModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAppStore } from '../../stores/useAppStore'
import { useFiles } from '../../composables/useFiles'
import Navigation from '../../components/Navigation/Navigation.vue'
import FolderModal from '../../components/FolderModal/FolderModal.vue'
import type { FileItem, FolderItem } from '../../types/files.types'
import styles from './Projects.module.css'

const appStore = useAppStore()

// Use the files composable for all file operations
const {
  // Reactive state
  quota,
  usedStorage,
  totalStorage,
  storagePercentage,
  filteredFiles,
  currentFolderId,
  breadcrumbs,
  loading,
  uploading,
  uploadingFiles,
  selectedFiles,
  starredFiles,
  searchQuery,
  activeFilter,
  sortBy,
  viewMode,
  showShareModal,
  showCreateFolder,
  showFolderModal,
  currentFile,
  availableUsers,
  error,
  filterTabs,

  // Operations
  uploadFiles,
  downloadFile,
  deleteFile,
  toggleFileFavorite,
  createFolder,
  deleteFolder,
  downloadFolder,
  navigateToFolder,
  loadUsersForSharing,
  toggleSelection,
  deleteSelectedFiles,
  getFileCount,
  formatFileSize,
  formatDate,
  getFileIcon,
  getFileIconColor,
  initialize
} = useFiles()

// Local component state
const isDragOver = ref<boolean>(false)
const fileInput = ref<HTMLInputElement | null>(null)
const selectedUser = ref<string>('')
const sharePermission = ref<'view' | 'download' | 'edit' | 'fullAccess'>('view')
const newFolderName = ref<string>('')

// File upload handling
const triggerFileUpload = () => {
  if (loading.value || uploading.value) return
  fileInput.value?.click()
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files) {
    const selectedFiles = Array.from(target.files)
    uploadFiles(selectedFiles)
  }
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  isDragOver.value = false
  
  if (event.dataTransfer?.files) {
    const droppedFiles = Array.from(event.dataTransfer.files)
    uploadFiles(droppedFiles)
  }
}

// File operations
const openFile = (file: FileItem | FolderItem) => {
  if ('file_count' in file) { // Check if it's a folder
    navigateToFolder(file.id)
  } else {
    downloadFile(file)
  }
}

const toggleStar = (fileId: string) => {
  toggleFileFavorite(fileId)
}

const deleteItem = async (file: FileItem | FolderItem) => {
  if (!confirm(`Are you sure you want to delete "${file.name}"?`)) return
  
  try {
    if ('file_count' in file) { // Check if it's a folder
      await deleteFolder(file.id)
    } else {
      await deleteFile(file.id)
    }
  } catch (err) {
    // Logging removed for production
  }
}

// Folder operations
const openFolderModal = (folder: FileItem | FolderItem) => {
  currentFile.value = folder as any
  showFolderModal.value = true
}

const handleFolderDropFiles = (droppedFiles: File[]) => {
  if (currentFile.value && 'file_count' in currentFile.value) {
    // Upload files to the specific folder
    uploadFiles(droppedFiles)
  }
}

// Selection operations
const shareSelectedFiles = () => {
  
  // TODO: Implement batch sharing
}

// Sharing modal operations
const shareFile = (file: FileItem | FolderItem) => {
  currentFile.value = file as any
  showShareModal.value = true
  selectedUser.value = ''
  sharePermission.value = 'view'
}

const confirmShare = () => {
  if (!selectedUser.value || !sharePermission.value || !currentFile.value) return
  
  // TODO: Implement actual sharing API call
  
  
  closeShareModal()
}

const closeShareModal = () => {
  showShareModal.value = false
  currentFile.value = null
  selectedUser.value = ''
  sharePermission.value = 'view'
}

// Folder creation
const confirmCreateFolder = () => {
  if (!newFolderName.value.trim()) return
  
  createFolder(newFolderName.value.trim())
  newFolderName.value = ''
  showCreateFolder.value = false
}

// Initialize component
onMounted(async () => {
  try {
    await initialize()
    await loadUsersForSharing()
  } catch (err) {
    // Logging removed for production
  }
})
</script>

<style scoped>
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.loading-spinner {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.loading-spinner i {
  font-size: 2rem;
  color: var(--brand-green);
  margin-bottom: 1rem;
}

.error-message {
  position: fixed;
  top: 20px;
  right: 20px;
  background: #dc3545;
  color: white;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  z-index: 9998;
  max-width: 400px;
}

.error-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.error-content i {
  font-size: 1.2rem;
}

.dismiss-btn {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  align-self: flex-end;
  margin-top: 0.5rem;
}

.dismiss-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.upload-error {
  color: #dc3545;
  font-size: 0.8rem;
  margin-left: 0.5rem;
}
</style>
