<template>
  <div class="app-container lead-quota-page">
    <div v-loading="subjectLoading" class="subject-tabs-bar">
      <div v-if="subjectList.length" class="subject-tabs">
        <el-tooltip
          v-for="subject in subjectList"
          :key="subject.id"
          :content="getSubjectStatusText(subject)"
          placement="top">
          <button
            type="button"
            :class="[
              'subject-tab',
              isSubjectAvailable(subject) ? 'is-normal' : 'is-abnormal',
              { 'is-active': activeSubjectId === subject.id }
            ]"
            @click="handleSubjectChange(subject)">
            {{ subject.subjectName || '待授权主体' }}
          </button>
        </el-tooltip>
      </div>
      <el-empty v-else :image-size="48" description="暂无可配置主体" />
    </div>

    <el-splitter class="quota-workspace">
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
              <el-button v-hasPermi="['crm:quota:save']" type="primary" plain icon="Check" :disabled="!quotaSaveable" @click="handleSave">保存配置</el-button>
            </el-col>
            <el-col :span="1.5">
              <el-button type="success" plain icon="Edit" :disabled="!quotaSaveable" @click="batchSetDialogOpen = true">批量设置配额</el-button>
            </el-col>
            <el-col :span="1.5">
              <el-button type="warning" plain icon="RefreshLeft" :disabled="!quotaSaveable" @click="handleClearQuota">清零</el-button>
            </el-col>
            <el-col :span="1.5">
              <el-button type="primary" plain icon="CopyDocument" :disabled="!subjectAvailable" @click="openCopyDialog">复制配置</el-button>
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
import { listOceanEngineSubjectTabs } from '@/api/system/oceanEngineSubject'

const { proxy } = getCurrentInstance()

const loading = ref(false)
const subjectLoading = ref(false)
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
const subjectList = ref([])
const activeSubjectId = ref()
const today = getToday()
const currentSubject = computed(() => subjectList.value.find((subject) => subject.id === activeSubjectId.value))
const subjectAvailable = computed(() => isSubjectAvailable(currentSubject.value))
const quotaEditable = computed(() => !isPastQuotaDate(queryParams.quotaDate))
const quotaSaveable = computed(() => subjectAvailable.value && quotaEditable.value)

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

async function getSubjectList() {
  subjectLoading.value = true
  try {
    const response = await listOceanEngineSubjectTabs()
    subjectList.value = response.data || []
    if (subjectList.value.length === 0) {
      activeSubjectId.value = undefined
      proxy.$modal.msgWarning('系统未配置任何主体')
      return false
    }
    const defaultSubject = subjectList.value.find(isSubjectAvailable) || subjectList.value[0]
    activeSubjectId.value = defaultSubject?.id
    return true
  } finally {
    subjectLoading.value = false
  }
}

function isSubjectAvailable(subject) {
  return subject?.tabStatus === 0
}

function getSubjectStatusText(subject) {
  if (!subject) return '请选择主体'
  const subjectName = subject.subjectName || '待授权主体'
  if (subject.tabStatus === 1) return `${subjectName}：主体已停用`
  if (subject.tabStatus === 2) return `${subjectName}：主体未启用`
  return `${subjectName}：主体状态正常`
}

function handleSubjectChange(subject) {
  if (activeSubjectId.value === subject.id) return
  activeSubjectId.value = subject.id
  copyPreviewing.value = false
  userList.value = []
  if (selectedDeptId.value > 0) {
    handleQuery()
  }
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
    subjectId: activeSubjectId.value,
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
  if (!activeSubjectId.value) {
    proxy.$modal.msgWarning('请先选择主体')
    return
  }
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
  if (!subjectAvailable.value) {
    proxy.$modal.msgWarning('当前主体状态异常，不能配置配额')
    return
  }
  if (!quotaEditable.value) {
    return
  }
  userList.value.forEach((user) => {
    user.quotaCount = batchQuotaCount.value
  })
  batchSetDialogOpen.value = false
}

function handleClearQuota() {
  if (!subjectAvailable.value) {
    proxy.$modal.msgWarning('当前主体状态异常，不能配置配额')
    return
  }
  if (!quotaEditable.value) {
    return
  }
  userList.value.forEach((user) => {
    user.quotaCount = 0
  })
}

function openCopyDialog() {
  if (!subjectAvailable.value) {
    proxy.$modal.msgWarning('当前主体状态异常，不能复制配置')
    return
  }
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

  if (!subjectAvailable.value) {
    proxy.$modal.msgWarning('当前主体状态异常，不能保存配置')
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
    subjectId: activeSubjectId.value,
    quotaDate: queryParams.quotaDate,
    configs
  })

  if (res.code === 200) {
    proxy.$modal.msgSuccess('保存成功')
    handleQuery()
  }
}

async function initializePage() {
  const hasSubjects = await getSubjectList()
  if (hasSubjects) {
    getDeptTree()
  }
}

initializePage()
</script>

<style scoped>
.lead-quota-page {
  min-height: calc(100vh - 84px);
}

.subject-tabs-bar {
  position: relative;
  z-index: 2;
  min-height: 48px;
  padding: 8px 12px 0;
  border-bottom: 1px solid #dcdfe6;
  background: #fff;
}

.subject-tabs {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  margin-bottom: -1px;
}

.subject-tab {
  flex: 0 0 auto;
  min-width: 116px;
  height: 40px;
  padding: 0 18px;
  overflow: hidden;
  border: 1px solid #c8c9cc;
  border-radius: 8px 8px 0 0;
  background: #dcdfe6;
  color: #606266;
  cursor: pointer;
  font-size: 14px;
  text-overflow: ellipsis;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.subject-tab.is-normal {
  border-color: #67c23a;
  background: #dff3d5;
  color: #3d8b1f;
  font-weight: 600;
}

.subject-tab.is-normal.is-active {
  border-color: #4eaa28;
  background: #67c23a;
  color: #fff;
  box-shadow: 0 4px 10px rgb(82 155 46 / 28%);
}

.subject-tab.is-abnormal.is-active {
  border-color: #73767a;
  background: #73767a;
  color: #fff;
  box-shadow: 0 4px 10px rgb(96 98 102 / 24%);
}

.subject-tab:hover {
  transform: translateY(-1px);
}

.quota-workspace {
  background: #fff;
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
