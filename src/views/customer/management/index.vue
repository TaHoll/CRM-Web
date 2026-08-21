<template>
  <div class="app-container">
    <el-form :inline="true" class="mb10" @submit.prevent>
      <el-form-item label="姓名">
        <el-input v-model="queryParams.name" placeholder="请输入姓名" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="线索时间">
        <el-date-picker
          v-model="leadTimeRange"
          type="datetimerange"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          value-format="YYYY-MM-DD HH:mm:ss"
          range-separator="至"
          clearable />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">查询</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="15" class="mb10">
      <right-toolbar @query-table="getList">
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
        :show-overflow-tooltip="column.prop !== 'customerTags'">
        <template #default="{ row }">
          <template v-if="column.prop === 'customerTags'">
            <el-tag
              v-for="tag in row.customerTags || []"
              :key="tag.id"
              :color="tag.color || '#909399'"
              class="tag-item"
              effect="dark">
              {{ tag.name }}
            </el-tag>
            <span v-if="!row.customerTags || row.customerTags.length === 0">-</span>
          </template>
          <template v-else-if="column.prop === 'leadLocation'">
            {{ formatLeadLocation(row) }}
          </template>
          <template v-else-if="column.prop === 'effectiveStateNameStr'">
            <el-tag :type="stageType[row.effectiveStateNameStr] || 'info'">{{ formatValue(row.effectiveStateNameStr) }}</el-tag>
          </template>
          <template v-else-if="column.prop === 'userNickName'">
            {{ formatValue(row.userNickName || row.UserNickName) }}
          </template>
          <template v-else-if="column.prop === 'deptName'">
            {{ formatValue(row.deptName || row.DeptName) }}
          </template>
          <template v-else-if="column.prop === 'wechat'">
            {{ formatValue(row.wechat || row.Wechat) }}
          </template>
          <template v-else>
            {{ formatValue(row[column.prop], column.type) }}
          </template>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="90" align="center" fixed="right">
        <template #default="{ row }">
          <el-button v-hasPermi="['customer:management:edit']" link type="primary" icon="Edit" @click="handleEdit(row)">编辑</el-button>
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
  </div>
</template>

<script setup name="CustomerManagement">
import { useRouter } from 'vue-router'
import { customerList } from '@/api/public/lead'

const router = useRouter()
const COLUMN_STORAGE_KEY = 'customer-management-columns'

const defaultColumns = [
  { prop: 'createTime', label: '来源时间', visible: true, type: 'datetime', minWidth: 170 },
  { prop: 'name', label: '姓名', visible: true, minWidth: 100 },
  { prop: 'telephone', label: '手机号', visible: true, minWidth: 130 },
  { prop: 'wechat', label: '微信', visible: true, minWidth: 130 },
  { prop: 'customerTags', label: '客户标签', visible: true, minWidth: 180 },
  { prop: 'genderStr', label: '性别', visible: true, width: 80 },
  { prop: 'age', label: '年龄', visible: true, width: 80 },
  { prop: 'leadLocation', label: '线索归属地', visible: true, minWidth: 150 },
  { prop: 'userNickName', label: '跟进人', visible: true, minWidth: 110 },
  { prop: 'deptName', label: '跟进部门', visible: true, minWidth: 130 },
  { prop: 'latestFollowRemark', label: '最新跟进内容', visible: true, minWidth: 220 },
  { prop: 'effectiveStateNameStr', label: '阶段', visible: false, minWidth: 110 }
]

function loadColumns() {
  try {
    const saved = JSON.parse(localStorage.getItem(COLUMN_STORAGE_KEY) || '[]')
      .map((item) => item.prop === 'createTimeDetail' ? { ...item, prop: 'createTime' } : item)
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
const total = ref(0)
const dataList = ref([])
const columns = ref(loadColumns())
const columnSettingVisible = ref(false)
const draggedColumnProp = ref('')
const visibleColumns = computed(() => columns.value.filter((column) => column.visible))
const leadTimeRange = ref([])
const queryParams = reactive({
  name: undefined,
  beginTime: undefined,
  endTime: undefined,
  pager: {
    pageNum: 1,
    pageSize: 10
  }
})

watch(
  columns,
  (value) => {
    localStorage.setItem(
      COLUMN_STORAGE_KEY,
      JSON.stringify(value.map(({ prop, visible }) => ({ prop, visible })))
    )
  },
  { deep: true }
)

async function getList() {
  ;[queryParams.beginTime, queryParams.endTime] = leadTimeRange.value || []
  loading.value = true
  try {
    const res = await customerList(queryParams)
    if (res.code === 200) {
      dataList.value = res.data?.result || []
      total.value = res.data?.totalNum || 0
    }
  } finally {
    loading.value = false
  }
}

function formatValue(value, type) {
  if (value === null || value === undefined || value === '') {
    return '-'
  }
  if (type === 'datetime') {
    return new Date(value).toLocaleString('zh-CN', { hour12: false })
  }
  return value
}

function handleQuery() {
  queryParams.pager.pageNum = 1
  getList()
}

function resetQuery() {
  queryParams.name = undefined
  leadTimeRange.value = []
  queryParams.beginTime = undefined
  queryParams.endTime = undefined
  handleQuery()
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

function handleEdit(row) {
  router.push({
    path: '/customer/management/edit',
    query: {
      id: row.clueId,
      name: row.name,
      wechat: row.wechat || row.Wechat,
      phone: row.telephone,
      city: row.autoCityName,
      province: row.autoProvinceName,
      stage: row.effectiveStateNameStr,
      deptStage: row.stage,
      sourceTime: row.createTime || row.CreateTime,
      gender: row.gender,
      age: row.age,
      customerTags: JSON.stringify(row.customerTags || [])
    }
  })
}

getList()
</script>

<style scoped>
.tag-item + .tag-item {
  margin-left: 6px;
}

.tag-item {
  border-color: transparent;
  color: #fff;
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

.column-setting-item:hover {
  background: var(--el-fill-color-light);
}

.drag-handle {
  margin-right: 10px;
  color: var(--el-text-color-secondary);
  font-size: 18px;
}
</style>
