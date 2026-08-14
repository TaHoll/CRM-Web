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
            <right-toolbar v-model:showSearch="showSearch" @queryTable="handleQuery"></right-toolbar>
          </el-row>

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
