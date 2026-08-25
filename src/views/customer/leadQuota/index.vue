<template>
  <div class="app-container lead-quota-page">
    <el-splitter>
      <el-splitter-panel size="220px" :collapsible="true" style="padding-right: 10px" max="320px">
        <el-card shadow="never" class="dept-card">
          <div class="head-container">
            <el-input v-model="deptName" placeholder="请输入部门名称" clearable prefix-icon="Search" class="dept-filter" />
          </div>
          <div class="head-container">
            <el-tree
              ref="deptTreeRef"
              :data="deptOptions"
              :props="{ label: 'label', children: 'children' }"
              :expand-on-click-node="false"
              :filter-node-method="filterNode"
              node-key="id"
              highlight-current
              default-expand-all
              @node-click="handleNodeClick">
              <template #default="{ node, data }">
                <span class="custom-tree-node">
                  <span>
                    <svg-icon name="index" v-if="data.children && data.children.length > 0" />
                    {{ node.label }}
                  </span>
                </span>
              </template>
            </el-tree>
          </div>
        </el-card>
      </el-splitter-panel>

      <el-splitter-panel>
        <div class="quota-content">
          <el-form :model="queryParams" :inline="true" v-show="showSearch" label-width="80px" @submit.prevent>
            <el-form-item label="员工姓名">
              <el-input v-model="queryParams.userName" placeholder="请输入员工姓名" clearable style="width: 220px" @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="配额日期">
              <el-date-picker
                v-model="queryParams.quotaDate"
                type="date"
                value-format="YYYY-MM-DD"
                placeholder="请选择配额日期"
                style="width: 180px" />
            </el-form-item>
            <el-form-item label="启用状态">
              <el-select v-model="queryParams.enabled" placeholder="全部" clearable style="width: 140px">
                <el-option label="启用" :value="true" />
                <el-option label="停用" :value="false" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="Search" @click="handleQuery">查询</el-button>
              <el-button icon="Refresh" @click="resetQuery">重置</el-button>
            </el-form-item>
          </el-form>

          <el-row :gutter="10" class="mb8">
            <el-col :span="1.5">
              <el-button type="primary" plain icon="Check" :disabled="!quotaEditable" @click="handleSave">保存配置</el-button>
            </el-col>
            <el-col :span="1.5">
              <el-button type="success" plain icon="Edit" :disabled="!quotaEditable" @click="batchSetDialogOpen = true">批量设置配额</el-button>
            </el-col>
            <el-col :span="1.5">
              <el-button type="warning" plain icon="RefreshLeft" :disabled="!quotaEditable" @click="handleClearQuota">清零</el-button>
            </el-col>
            <el-col :span="1.5">
              <el-button type="primary" plain icon="CopyDocument" @click="openCopyDialog">复制配置</el-button>
            </el-col>
            <right-toolbar v-model:showSearch="showSearch" @queryTable="handleQuery"></right-toolbar>
          </el-row>

          <el-alert
            v-if="copyPreviewing"
            :title="`正在预览从 ${copySourceDate} 复制到 ${queryParams.quotaDate} 的配置，当前内容尚未保存`"
            type="warning"
            show-icon
            :closable="false"
            class="mb8" />

          <el-table v-loading="loading" :data="userList" border>
            <el-table-column prop="employeeId" label="员工ID" align="center" width="110" />
            <el-table-column prop="userName" label="员工姓名" align="center" min-width="120" show-overflow-tooltip />
            <el-table-column prop="deptName" label="所属部门" align="center" min-width="160" show-overflow-tooltip />
            <el-table-column label="应分配额" align="center" width="160">
              <template #default="{ row }">
                <el-input-number v-model="row.quotaCount" :min="0" :max="999" :disabled="isPastQuotaDate(row.quotaDate)" controls-position="right" style="width: 120px" />
              </template>
            </el-table-column>
            <el-table-column prop="assignCount" label="已分配量" align="center" width="110">
              <template #default="{ row }">
                {{ row.assignCount ?? row.assignedCount ?? 0 }}
              </template>
            </el-table-column>
            <el-table-column prop="quotaDate" label="配额日期" align="center" width="140" />
            <el-table-column label="启用" align="center" width="100">
              <template #default="{ row }">
                <el-switch v-model="row.enabled" :disabled="isPastQuotaDate(row.quotaDate)" />
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-splitter-panel>
    </el-splitter>

    <el-dialog v-model="batchSetDialogOpen" title="批量设置配额" width="360px" append-to-body>
      <el-form label-width="90px">
        <el-form-item label="应分配额">
          <el-input-number v-model="batchQuotaCount" :min="0" :max="999" controls-position="right" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchSetDialogOpen = false">取消</el-button>
        <el-button type="primary" @click="handleBatchSetQuota">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="copyDialogOpen" title="复制配额配置" width="420px" append-to-body>
      <el-alert title="以当前页面配置为配置源，点击预览后将在列表页展示目标日期的配置。" type="info" :closable="false" class="mb15" />
      <el-form label-width="90px">
        <el-form-item label="源日期">
          <el-input :model-value="copySourceDate" disabled />
        </el-form-item>
        <el-form-item label="复制到">
          <el-date-picker
            v-model="copyTargetDate"
            type="date"
            value-format="YYYY-MM-DD"
            :disabled-date="disableCopyDate"
            placeholder="请选择当天之后的日期"
            style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="copyDialogOpen = false">取消</el-button>
        <el-button type="primary" @click="handleCopyPreview">预览</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="LeadAssignQuota">
import { treeselect } from '@/api/system/dept'
import { userQuotaList, userQuotaSave } from '@/api/public/lead'

const { proxy } = getCurrentInstance()

const loading = ref(false)
const showSearch = ref(true)
const deptName = ref('')
const selectedDeptId = ref(0)
const deptOptions = ref([])
const deptTreeRef = ref()
const batchSetDialogOpen = ref(false)
const batchQuotaCount = ref(10)
const copyDialogOpen = ref(false)
const copySourceDate = ref('')
const copySourceList = ref([])
const copyTargetDate = ref('')
const copyPreviewing = ref(false)
const today = getToday()
const quotaEditable = computed(() => !isPastQuotaDate(queryParams.quotaDate))

const queryParams = reactive({
  userName: '',
  quotaDate: today,
  enabled: undefined
})

const userList = ref([])

watch(deptName, (value) => {
  deptTreeRef.value?.filter(value)
})

function getToday() {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getTomorrow() {
  const date = new Date()
  date.setDate(date.getDate() + 1)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function disableCopyDate(date) {
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  return date.getTime() <= todayStart.getTime()
}

function isPastQuotaDate(quotaDate) {
  if (!quotaDate) {
    return false
  }
  return String(quotaDate).slice(0, 10) < today
}

function getDeptTree() {
  treeselect().then((response) => {
    deptOptions.value = [{ id: 0, label: '未知部门', children: [] }, ...(response.data || [])]
  })
}

function filterNode(value, data) {
  if (!value) {
    return true
  }
  return String(data.label || '').includes(value)
}

function handleNodeClick(data) {
  selectedDeptId.value = data.id
  handleQuery()
}

function buildQueryParams() {
  const params = {
    userNickName: queryParams.userName,
    deptId: selectedDeptId.value || 0,
    quotaDate: queryParams.quotaDate
  }
  if (queryParams.enabled !== undefined && queryParams.enabled !== null && queryParams.enabled !== '') {
    params.status = queryParams.enabled ? 1 : 0
  }
  return params
}

async function handleQuery() {
  copyPreviewing.value = false
  loading.value = true
  try {
    const res = await userQuotaList(buildQueryParams())
    if (res.code === 200) {
      userList.value = (res.data || []).map((item) => ({
        ...item,
        employeeId: item.userId,
        userName: item.userNickName,
        enabled: item.status === 1,
        originalQuotaCount: Number(item.quotaCount || 0),
        originalStatus: Number(item.status || 0)
      }))
    }
  } finally {
    loading.value = false
  }
}

function resetQuery() {
  copyPreviewing.value = false
  queryParams.userName = ''
  queryParams.quotaDate = today
  queryParams.enabled = undefined
  selectedDeptId.value = 0
  userList.value = []
  deptTreeRef.value?.setCurrentKey(null)
}

function handleBatchSetQuota() {
  if (!quotaEditable.value) {
    return
  }
  userList.value.forEach((user) => {
    user.quotaCount = batchQuotaCount.value
  })
  batchSetDialogOpen.value = false
}

function handleClearQuota() {
  if (!quotaEditable.value) {
    return
  }
  userList.value.forEach((user) => {
    user.quotaCount = 0
  })
}

function openCopyDialog() {
  if (selectedDeptId.value === 0) {
    proxy.$modal.msgWarning('请先选择需要复制配置的部门')
    return
  }
  if (userList.value.length === 0) {
    proxy.$modal.msgWarning('当前页面没有可复制的配置')
    return
  }
  copySourceDate.value = queryParams.quotaDate
  copySourceList.value = userList.value.map((user) => ({ ...user }))
  copyTargetDate.value = getTomorrow()
  copyDialogOpen.value = true
}

function handleCopyPreview() {
  if (!copyTargetDate.value || copyTargetDate.value <= today) {
    proxy.$modal.msgWarning('复制目标日期只能选择当天之后的日期')
    return
  }

  if (copySourceList.value.length === 0) {
    proxy.$modal.msgWarning('当前页面没有可复制的配置')
    return
  }

  const targetDate = copyTargetDate.value
  userList.value = copySourceList.value.map((user) => ({
    ...user,
    id: null,
    quotaDate: targetDate,
    assignCount: 0,
    assignedCount: 0,
    originalQuotaCount: 0,
    originalStatus: 0
  }))
  queryParams.quotaDate = targetDate
  copyPreviewing.value = true
  copyDialogOpen.value = false
  proxy.$modal.msgSuccess(`正在预览 ${targetDate} 的复制配置，确认后请点击保存配置`)
}

async function handleSave() {
  if (!quotaEditable.value) {
    proxy.$modal.msgWarning('历史配额日期不允许编辑')
    return
  }

  const configs = userList.value
    .filter((user) => {
      const quotaCount = Number(user.quotaCount || 0)
      const status = user.enabled ? 1 : 0
      const hasConfig = user.id !== null && user.id !== undefined

      // 未配置用户仅在设置了正配额时新增；已有配置仅在配额或状态变化时提交。
      return !hasConfig
        ? quotaCount > 0
        : quotaCount !== user.originalQuotaCount || status !== user.originalStatus
    })
    .map((user) => ({
      id: user.id ?? null,
      userId: user.userId,
      userNickName: user.userNickName || user.userName,
      deptId: user.deptId,
      deptName: user.deptName,
      quotaDate: queryParams.quotaDate,
      quotaCount: Number(user.quotaCount),
      assignCount: Number(user.assignCount ?? user.assignedCount ?? 0),
      status: user.enabled ? 1 : 0
    }))

  if (configs.length === 0) {
    proxy.$modal.msgInfo('配额和启用状态未发生变化')
    return
  }

  const res = await userQuotaSave({
    quotaDate: queryParams.quotaDate,
    configs
  })

  if (res.code === 200) {
    proxy.$modal.msgSuccess('保存成功')
    handleQuery()
  }
}

getDeptTree()
</script>

<style scoped>
.lead-quota-page {
  min-height: calc(100vh - 84px);
}

.dept-card {
  min-height: calc(100vh - 110px);
}

.dept-filter {
  margin-bottom: 20px;
}

.quota-content {
  padding: 10px;
}
</style>
