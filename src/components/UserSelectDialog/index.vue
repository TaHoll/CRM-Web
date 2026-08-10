<template>
  <el-dialog
    v-model="visible"
    title="选择用户"
    width="820px"
    append-to-body
    destroy-on-close
    @open="handleOpen"
    @close="handleClose">
    <div class="user-select-dialog">
      <div class="dept-panel">
        <el-input v-model="deptKeyword" placeholder="请输入部门名称" clearable prefix-icon="Search" class="filter-input" />
        <el-scrollbar class="tree-scrollbar">
          <el-tree
            ref="deptTreeRef"
            :data="deptTree"
            :props="treeProps"
            node-key="id"
            highlight-current
            default-expand-all
            :expand-on-click-node="false"
            :filter-node-method="filterDeptNode"
            @node-click="handleDeptClick" />
        </el-scrollbar>
      </div>

      <div class="user-panel">
        <el-input v-model="userKeyword" placeholder="请输入用户名称" clearable prefix-icon="Search" class="filter-input" />
        <el-table
          ref="userTableRef"
          v-loading="loading"
          :data="filteredUsers"
          border
          height="380"
          highlight-current-row
          @row-click="handleRowClick"
          @selection-change="handleSelectionChange">
          <el-table-column v-if="multiple" type="selection" width="50" align="center" />
          <el-table-column v-else width="50" align="center">
            <template #default="{ row }">
              <el-radio :model-value="singleSelectedId" :label="row.userId">
                <span></span>
              </el-radio>
            </template>
          </el-table-column>
          <el-table-column prop="userId" label="用户ID" width="100" align="center" />
          <el-table-column prop="userName" label="用户账号" min-width="130" show-overflow-tooltip />
          <el-table-column label="用户昵称" min-width="130" show-overflow-tooltip>
            <template #default="{ row }">
              {{ getUserNickname(row) }}
            </template>
          </el-table-column>
          <el-table-column prop="deptName" label="所属部门" min-width="160" show-overflow-tooltip />
        </el-table>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" @click="handleConfirm">确定</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { treeSelectWithUserList } from '@/api/system/dept'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  multiple: {
    type: Boolean,
    default: true
  },
  selectedIds: {
    type: [Array, Number, String],
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue', 'update:selectedIds', 'confirm'])

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const loading = ref(false)
const deptTree = ref([])
const allUsers = ref([])
const currentUsers = ref([])
const hasSelectedDept = ref(false)
const selectedUsers = ref([])
const selectedUserMap = ref(new Map())
const singleSelectedId = ref(undefined)
const deptKeyword = ref('')
const userKeyword = ref('')
const deptTreeRef = ref()
const userTableRef = ref()
const syncingSelection = ref(false)

const treeProps = {
  label: 'label',
  children: 'children'
}

const normalizedSelectedIds = computed(() => {
  if (Array.isArray(props.selectedIds)) {
    return props.selectedIds.map((id) => Number(id))
  }
  if (props.selectedIds === undefined || props.selectedIds === null || props.selectedIds === '') {
    return []
  }
  return [Number(props.selectedIds)]
})

const filteredUsers = computed(() => {
  const keyword = userKeyword.value.trim().toLowerCase()
  const users = hasSelectedDept.value ? currentUsers.value : allUsers.value
  if (!keyword) {
    return users
  }
  return users.filter((user) => {
    return [user.userName, getUserNickname(user), user.deptName].filter(Boolean).some((text) => String(text).toLowerCase().includes(keyword))
  })
})

watch(deptKeyword, (value) => {
  deptTreeRef.value?.filter(value)
})

watch(userKeyword, () => {
  nextTick(syncTableSelection)
})

watch(
  () => props.modelValue,
  (value) => {
    if (value) {
      syncSelectedState()
    }
  }
)

function handleOpen() {
  if (deptTree.value.length === 0) {
    getDeptUserTree()
    return
  }
  syncSelectedState()
}

function handleClose() {
  deptKeyword.value = ''
  userKeyword.value = ''
  hasSelectedDept.value = false
  currentUsers.value = allUsers.value
}

function getDeptUserTree() {
  loading.value = true
  treeSelectWithUserList()
    .then((response) => {
      deptTree.value = response.data || []
      allUsers.value = flattenUsers(deptTree.value)
      currentUsers.value = allUsers.value
      hasSelectedDept.value = false
      nextTick(syncSelectedState)
    })
    .finally(() => {
      loading.value = false
    })
}

function flattenUsers(nodes, deptName = '') {
  const result = []
  nodes.forEach((node) => {
    const currentDeptName = node.label || deptName
    const users = node.users || []
    users.forEach((user) => {
      result.push({
        ...user,
        deptId: user.deptId || node.id,
        deptName: currentDeptName
      })
    })
    if (node.children?.length) {
      result.push(...flattenUsers(node.children, currentDeptName))
    }
  })
  return result
}

function filterDeptNode(value, data) {
  if (!value) {
    return true
  }
  return String(data.label || '').includes(value)
}

function getUserNickname(user) {
  return user?.nickName || user?.nickname || '-'
}

function handleDeptClick(data) {
  hasSelectedDept.value = true
  currentUsers.value = flattenUsers([data])
  nextTick(syncTableSelection)
}

function handleRowClick(row) {
  if (props.multiple) {
    userTableRef.value?.toggleRowSelection(row)
    return
  }
  singleSelectedId.value = row.userId
  selectedUsers.value = [row]
}

function handleSelectionChange(selection) {
  if (!props.multiple) {
    return
  }
  if (syncingSelection.value) {
    return
  }
  const currentUserIds = filteredUsers.value.map((user) => Number(user.userId))
  currentUserIds.forEach((userId) => selectedUserMap.value.delete(userId))
  selection.forEach((user) => selectedUserMap.value.set(Number(user.userId), user))
  selectedUsers.value = Array.from(selectedUserMap.value.values())
}

function syncSelectedState() {
  if (!props.multiple) {
    singleSelectedId.value = normalizedSelectedIds.value[0]
    const selected = allUsers.value.find((user) => Number(user.userId) === singleSelectedId.value)
    selectedUsers.value = selected ? [selected] : []
    return
  }
  selectedUserMap.value = new Map()
  const selectedIdSet = new Set(normalizedSelectedIds.value)
  allUsers.value.forEach((user) => {
    if (selectedIdSet.has(Number(user.userId))) {
      selectedUserMap.value.set(Number(user.userId), user)
    }
  })
  selectedUsers.value = Array.from(selectedUserMap.value.values())
  syncTableSelection()
}

function syncTableSelection() {
  if (!props.multiple || !userTableRef.value) {
    return
  }
  syncingSelection.value = true
  userTableRef.value.clearSelection()
  filteredUsers.value.forEach((user) => {
    if (selectedUserMap.value.has(Number(user.userId))) {
      userTableRef.value.toggleRowSelection(user, true)
    }
  })
  nextTick(() => {
    syncingSelection.value = false
  })
}

function handleConfirm() {
  const users = props.multiple
    ? selectedUsers.value
    : allUsers.value.filter((user) => Number(user.userId) === Number(singleSelectedId.value))
  const ids = users.map((user) => user.userId)

  emit('update:selectedIds', props.multiple ? ids : ids[0])
  emit('confirm', props.multiple ? users : users[0])
  visible.value = false
}
</script>

<style scoped>
.user-select-dialog {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 12px;
}

.dept-panel,
.user-panel {
  min-width: 0;
}

.filter-input {
  margin-bottom: 10px;
}

.tree-scrollbar {
  height: 380px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  padding: 8px;
  box-sizing: border-box;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
}
</style>
