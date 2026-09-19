<template>
  <div class="app-container public-pool-page">
    <div v-loading="subjectLoading" class="subject-tabs-bar">
      <div v-if="subjectList.length" class="subject-tabs">
        <el-tooltip v-for="subject in subjectList" :key="subject.id" :content="getSubjectStatusText(subject)" placement="top">
          <button
            type="button"
            :class="['subject-tab', isSubjectAvailable(subject) ? 'is-normal' : 'is-abnormal', { 'is-active': activeSubjectId === subject.id }]"
            @click="handleSubjectChange(subject)">
            {{ subject.subjectName || '待授权主体' }}
          </button>
        </el-tooltip>
      </div>
      <el-empty v-else :image-size="48" description="暂无可用主体" />
    </div>

    <template v-if="activeSubjectId">
      <el-form v-show="showSearch" class="public-pool-search-form" @submit.prevent>
        <el-form-item label="来源时间">
          <el-date-picker
            v-model="leadTimeRange"
            type="datetimerange"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="YYYY-MM-DD HH:mm:ss"
            range-separator="至"
            clearable />
        </el-form-item>
        <el-form-item class="search-action-item">
          <el-button type="primary" icon="Search" @click="handleQuery">查询</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <el-row :gutter="15" class="mb10">
        <right-toolbar v-model:show-search="showSearch" @query-table="getList">
          <el-tooltip content="列设置" placement="top">
            <el-button circle icon="Menu" @click="columnSettingVisible = true" />
          </el-tooltip>
        </right-toolbar>
      </el-row>

      <el-table v-loading="loading" :data="dataList" min-height="520" border highlight-current-row row-key="clueId">
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column
          v-for="column in visibleColumns"
          :key="column.prop"
          :prop="column.prop"
          :label="column.label"
          :width="column.width"
          :min-width="column.minWidth || 120"
          :align="column.align || 'center'"
          show-overflow-tooltip>
          <template #default="{ row }">
            <template v-if="column.prop === 'leadLocation'">
              {{ formatLeadLocation(row) }}
            </template>
            <template v-else-if="column.prop === 'effectiveStateStr'">
              <el-tag :type="stageType[row.effectiveStateStr] || 'info'">{{ formatValue(row.effectiveStateStr) }}</el-tag>
            </template>
            <template v-else>
              {{ formatValue(row[column.prop], column.type) }}
            </template>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="190" align="center" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" icon="UserFilled" @click="handleClaim(row)">领取</el-button>
            <el-button link type="success" icon="Phone" @click="handleViewContact(row)">查看联系方式</el-button>
          </template>
        </el-table-column>
      </el-table>

      <pagination
        v-show="total > 0"
        v-model:page="queryParams.pager.pageNum"
        v-model:limit="queryParams.pager.pageSize"
        :total="total"
        @pagination="getList" />

      <el-dialog v-model="columnSettingVisible" title="列设置" width="420px" append-to-body>
        <el-alert title="拖拽字段可调整展示顺序，勾选控制是否显示。" type="info" :closable="false" class="mb10" />
        <div class="column-setting-list">
          <div
            v-for="column in columns"
            :key="column.prop"
            class="column-setting-item"
            draggable="true"
            @dragstart="handleColumnDragStart(column.prop)"
            @dragover.prevent
            @drop="handleColumnDrop(column.prop)">
            <span class="drag-handle">⠿</span>
            <el-checkbox v-model="column.visible">{{ column.label }}</el-checkbox>
          </div>
        </div>
      </el-dialog>
    </template>
  </div>
</template>

<script setup name="PublicLeadPool">
import { publicPoolList } from '@/api/public/lead'
import { listOceanEngineSubjectTabs } from '@/api/system/oceanEngineSubject'

const COLUMN_STORAGE_KEY = 'public-lead-pool-columns'
const defaultColumns = [
  { prop: 'createTimeDetail', label: '来源时间', visible: true, type: 'datetime', minWidth: 170 },
  { prop: 'name', label: '姓名', visible: true, minWidth: 100 },
  { prop: 'telephone', label: '手机号', visible: true, minWidth: 130 },
  { prop: 'weixin', label: '微信', visible: true, minWidth: 130 },
  { prop: 'genderStr', label: '性别', visible: true, width: 80 },
  { prop: 'age', label: '年龄', visible: true, width: 80 },
  { prop: 'leadLocation', label: '线索归属地', visible: true, minWidth: 150 },
  { prop: 'effectiveStateStr', label: '阶段', visible: true, minWidth: 110 }
]

function loadColumns() {
  try {
    const saved = JSON.parse(localStorage.getItem(COLUMN_STORAGE_KEY) || '[]')
    const defaultMap = new Map(defaultColumns.map((item) => [item.prop, item]))
    const savedColumns = saved
      .filter((item) => defaultMap.has(item.prop))
      .map((item) => ({ ...defaultMap.get(item.prop), visible: item.visible }))
    const newColumns = defaultColumns
      .filter((item) => !saved.some((savedItem) => savedItem.prop === item.prop))
      .map((item) => ({ ...item }))
    return [...savedColumns, ...newColumns]
  } catch {
    return defaultColumns.map((item) => ({ ...item }))
  }
}

const stageType = {
  新线索: 'primary',
  有意向: 'warning',
  已成交: 'success',
  无效: 'info'
}
const loading = ref(false)
const subjectLoading = ref(false)
const showSearch = ref(true)
const total = ref(0)
const dataList = ref([])
const subjectList = ref([])
const activeSubjectId = ref()
const leadTimeRange = ref([])
const columns = ref(loadColumns())
const columnSettingVisible = ref(false)
const draggedColumnProp = ref('')
const visibleColumns = computed(() => columns.value.filter((column) => column.visible))
const queryParams = reactive({
  subjectId: undefined,
  beginTime: undefined,
  endTime: undefined,
  pager: {
    pageNum: 1,
    pageSize: 10
  }
})

watch(
  columns,
  (value) => localStorage.setItem(COLUMN_STORAGE_KEY, JSON.stringify(value.map(({ prop, visible }) => ({ prop, visible })))),
  { deep: true }
)

async function getList() {
  if (!activeSubjectId.value) {
    dataList.value = []
    total.value = 0
    return
  }
  ;[queryParams.beginTime, queryParams.endTime] = leadTimeRange.value || []
  queryParams.subjectId = activeSubjectId.value
  loading.value = true
  try {
    const response = await publicPoolList(queryParams)
    if (response.code === 200) {
      dataList.value = response.data?.result || []
      total.value = response.data?.totalNum || 0
    }
  } finally {
    loading.value = false
  }
}

async function getSubjectList() {
  subjectLoading.value = true
  try {
    const response = await listOceanEngineSubjectTabs()
    subjectList.value = response.data || []
    if (!subjectList.value.length) {
      activeSubjectId.value = undefined
      return false
    }
    activeSubjectId.value = (subjectList.value.find(isSubjectAvailable) || subjectList.value[0])?.id
    return true
  } finally {
    subjectLoading.value = false
  }
}

function isSubjectAvailable(subject) {
  return subject?.tabStatus === 0
}

function getSubjectStatusText(subject) {
  const subjectName = subject?.subjectName || '待授权主体'
  if (subject?.tabStatus === 1) return `${subjectName}：主体已停用`
  if (subject?.tabStatus === 2) return `${subjectName}：主体未启用`
  return `${subjectName}：主体状态正常`
}

function handleSubjectChange(subject) {
  if (activeSubjectId.value === subject.id) return
  activeSubjectId.value = subject.id
  queryParams.pager.pageNum = 1
  getList()
}

function handleQuery() {
  queryParams.pager.pageNum = 1
  getList()
}

function resetQuery() {
  leadTimeRange.value = []
  queryParams.beginTime = undefined
  queryParams.endTime = undefined
  handleQuery()
}

function formatValue(value, type) {
  if (value === null || value === undefined || value === '') return '-'
  if (type === 'datetime') return new Date(value).toLocaleString('zh-CN', { hour12: false })
  return value
}

function formatLeadLocation(row) {
  return [row.autoProvinceName, row.autoCityName].filter(Boolean).join('') || '-'
}

function handleColumnDragStart(prop) {
  draggedColumnProp.value = prop
}

function handleColumnDrop(targetProp) {
  const fromIndex = columns.value.findIndex((item) => item.prop === draggedColumnProp.value)
  const toIndex = columns.value.findIndex((item) => item.prop === targetProp)
  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return
  const [draggedColumn] = columns.value.splice(fromIndex, 1)
  columns.value.splice(toIndex, 0, draggedColumn)
}

function handleClaim() {
  ElMessage.info('领取功能暂未对接')
}

function handleViewContact() {
  ElMessage.info('查看联系方式功能暂未对接')
}

async function initializePage() {
  if (await getSubjectList()) getList()
}

initializePage()
</script>

<style scoped>
.public-pool-page {
  min-height: calc(100vh - 84px);
}

.subject-tabs-bar {
  position: relative;
  z-index: 2;
  min-height: 48px;
  margin: -20px -20px 16px;
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
}

.public-pool-search-form {
  display: grid;
  grid-template-columns: minmax(360px, 520px) auto;
  justify-content: start;
  align-items: end;
  gap: 0 16px;
  margin-bottom: 10px;
  padding: 16px;
  border-radius: 8px;
  background: var(--el-fill-color-extra-light);
}

.public-pool-search-form :deep(.el-form-item) {
  display: flex;
  margin-right: 0;
  margin-bottom: 14px;
}

.public-pool-search-form :deep(.el-form-item__content) {
  flex: 1;
  min-width: 0;
}

.public-pool-search-form :deep(.el-input),
.public-pool-search-form :deep(.el-date-editor) {
  width: 100%;
}

.public-pool-search-form .search-action-item {
  align-items: flex-end;
}

.public-pool-search-form .search-action-item :deep(.el-form-item__content) {
  justify-content: flex-start;
}

.column-setting-list {
  max-height: 420px;
  overflow-y: auto;
}

.column-setting-item {
  display: flex;
  align-items: center;
  min-height: 38px;
  padding: 0 8px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  cursor: move;
}

.drag-handle {
  margin-right: 10px;
  color: var(--el-text-color-secondary);
  font-size: 18px;
}

@media (max-width: 768px) {
  .public-pool-search-form {
    grid-template-columns: 1fr;
    padding: 12px;
  }

  .public-pool-search-form .search-action-item :deep(.el-form-item__content) {
    justify-content: flex-start;
  }
}
</style>
