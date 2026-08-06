<template>
  <div class="app-container">
    <el-form v-show="showSearch" :inline="true" @submit.prevent>
      <el-form-item label="创建时间">
        <el-date-picker
          v-model="dateRange"
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
      <el-col :span="1.5">
        <el-button type="success" plain icon="User" @click="handleAssign">分配</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="primary" plain icon="Refresh" @click="getList">刷新</el-button>
      </el-col>
      <right-toolbar v-model:show-search="showSearch" @query-table="getList">
        <el-tooltip content="列设置" placement="top">
          <el-button circle icon="Menu" @click="columnSettingVisible = true" />
        </el-tooltip>
      </right-toolbar>
    </el-row>

    <el-table
      v-loading="loading"
      :data="dataList"
      border
      highlight-current-row
      row-key="clueId"
      header-cell-class-name="el-table-header-cell"
      @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column
        v-for="column in visibleColumns"
        :key="column.prop"
        :prop="column.prop"
        :label="column.label"
        :width="column.width"
        :min-width="column.minWidth || 120"
        :align="column.align || 'center'"
        :show-overflow-tooltip="true">
        <template #default="{ row }">
          {{ formatValue(row[column.prop], column.type) }}
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

    <UserSelectDialog
      v-model="assignUserDialogOpen"
      v-model:selected-ids="assignUserId"
      :multiple="false"
      @confirm="handleAssignUserConfirm" />
  </div>
</template>

<script setup name="LeadPool">
import { listLead } from '@/api/public/lead'
import UserSelectDialog from '@/components/UserSelectDialog/index.vue'

const COLUMN_STORAGE_KEY = 'lead-pool-columns'

const defaultColumns = [ 
  { prop: 'name', label: '姓名', visible: true, minWidth: 100 },
  { prop: 'telephone', label: '手机号', visible: true, minWidth: 130 },
  { prop: 'advertiserName', label: '来源广告账号', visible: true, minWidth: 150 },
  { prop: 'autoCityName', label: '线索所属城市', visible: true, minWidth: 130 }, 
  { prop: 'autoProvinceName', label: '线索所属省份', visible: true, minWidth: 130 }, 
  { prop: 'allocationStatusStr', label: '分配状态', visible: true },
  { prop: 'effectiveStateStr', label: '阶段', visible: true },
  { prop: 'clueTypeStr', label: '来源类型', visible: true },
  { prop: 'clueOwnerName', label: '分配所属人', visible: true }, 
  { prop: 'createTimeDetail', label: '创建时间', visible: true, type: 'datetime', minWidth: 170 },
  { prop: 'modifyTime', label: '修改时间', visible: false, type: 'datetime', minWidth: 170 },
  { prop: 'promotionName', label: '营销名称', visible: false, minWidth: 150 },
  { prop: 'flowTypeStr', label: '流量类型', visible: false },
  { prop: 'actionTypeStr', label: '互动场景', visible: false, minWidth: 130 },
  { prop: 'followStateNameStr', label: '通话状态', visible: false },
  { prop: 'genderStr', label: '性别', visible: false, width: 80 },
  { prop: 'age', label: '年龄', visible: false, width: 80 },
  { prop: 'provinceName', label: '填写省份', visible: false },
  { prop: 'cityName', label: '填写城市', visible: false },
  { prop: 'countyName', label: '填写区县', visible: false },
  { prop: 'address', label: '地址', visible: false, minWidth: 180 },
  { prop: 'followLifeAccountName', label: '跟进广告账户', visible: false, minWidth: 180 },
  { prop: 'weixin', label: '微信', visible: false, minWidth: 130 },
  { prop: 'tags', label: '标签', visible: false, minWidth: 150 },
  { prop: 'componentEventTypeTagsStr', label: '营销事件', visible: false, minWidth: 150 },
  { prop: 'authorNickname', label: '内容创作者', visible: false, minWidth: 150 }, 
  { prop: 'clueReturnStatus', label: '投放账号状态', visible: false, minWidth: 150 }, 
  { prop: 'leadsPageStr', label: '留资页面', visible: false, minWidth: 150 },  
  { prop: 'searchBidWord', label: '搜索关键词', visible: false, minWidth: 150 },   
  { prop: 'staffNickname', label: '接待抖音号', visible: false, minWidth: 150 },   
  { prop: 'systemTags', label: '系统标签', visible: false, minWidth: 150 },
  { prop: 'authorAwemeId', label: '内容创作抖音号', visible: false, minWidth: 150 } 
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

const loading = ref(false)
const showSearch = ref(true)
const total = ref(0)
const dataList = ref([])
const selectedLeads = ref([])
const assignUserDialogOpen = ref(false)
const assignUserId = ref(undefined)
const assignUser = ref()
const columns = ref(loadColumns())
const columnSettingVisible = ref(false)
const draggedColumnProp = ref('')
const dateRange = ref([])
const queryParams = reactive({
  beginTime: undefined,
  endTime: undefined,
  pager: {
    pageNum: 1,
    pageSize: 10
  }
})

const visibleColumns = computed(() => columns.value.filter((column) => column.visible))

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
  ;[queryParams.beginTime, queryParams.endTime] = dateRange.value || []
  loading.value = true
  try {
    const res = await listLead(queryParams)
    if (res.code === 200) {
      dataList.value = res.data?.result || []
      total.value = res.data?.totalNum || 0
    }
  } finally {
    loading.value = false
  }
}

function handleQuery() {
  queryParams.pager.pageNum = 1
  getList()
}

function resetQuery() {
  dateRange.value = []
  queryParams.beginTime = undefined
  queryParams.endTime = undefined
  handleQuery()
}

function formatValue(value, type) {
  if (value === null || value === undefined || value === '') return '-'
  if (type === 'datetime') return new Date(value).toLocaleString('zh-CN', { hour12: false })
  return value
}

function handleSelectionChange(selection) {
  selectedLeads.value = selection
}

function handleAssign() {
  assignUserDialogOpen.value = true
}

function handleAssignUserConfirm(user) {
  assignUser.value = user
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

getList()
</script>

<style scoped>
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
