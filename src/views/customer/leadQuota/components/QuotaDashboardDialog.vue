<template>
  <el-dialog v-model="visible" title="每日线索分量看板" width="96%" top="2vh" append-to-body destroy-on-close class="quota-dashboard-dialog">
    <div class="dashboard-toolbar">
      <div class="subject-tabs">
        <button
          v-for="subject in subjects"
          :key="subject.id"
          type="button"
          :class="['subject-tab', { active: activeSubjectId === subject.id, abnormal: subject.tabStatus !== 0 }]"
          @click="activeSubjectId = subject.id">
          {{ subject.subjectName || '待授权主体' }}
        </button>
      </div>
      <el-date-picker v-model="quotaDate" type="date" value-format="YYYY-MM-DD" :clearable="false" style="width: 150px" />
    </div>

    <div class="summary-bar">
      <div><span>主体总配额</span><strong>{{ subjectQuota }}</strong></div>
      <div><span>主体已分配</span><strong class="assigned">{{ subjectAssigned }}</strong></div>
      <div class="summary-progress">
        <div
          class="progress-fill"
          :style="{
            width: progressWidth(rate(subjectAssigned, subjectQuota)),
            background: progressBackground(rate(subjectAssigned, subjectQuota))
          }"></div>
        <span>主体进度</span><strong>{{ rate(subjectAssigned, subjectQuota) }}%</strong>
      </div>
      <div><span>参与分配销售</span><strong>{{ subjectUserCount }}</strong></div>
    </div>

    <div v-loading="loading" class="matrix-wrap">
      <table class="quota-matrix" :style="{ width: `${matrixWidth}px` }">
        <colgroup>
          <template v-for="department in departments" :key="`width-${department.id}`">
            <col :style="{ width: `${salesWidth(department.id)}px` }" />
              <col style="width: 58px" />
              <col style="width: 58px" />
              <col style="width: 58px" />
              <col style="width: 68px" />
          </template>
        </colgroup>
        <thead>
          <tr>
            <th v-for="department in departments" :key="department.id" colspan="5" class="department-head">
              <div
                class="progress-fill department-progress-fill"
                :style="{
                  width: progressWidth(rate(department.assigned, department.quota)),
                  background: progressBackground(rate(department.assigned, department.quota))
                }"></div>
              <div class="department-name">{{ department.name }}</div>
              <div class="department-summary">配额 {{ department.quota }} · 已分 {{ department.assigned }} · 差额 {{ department.quota - department.assigned }} · 进度 {{ rate(department.assigned, department.quota) }}%</div>
              <span class="resize-handle" title="拖动调整列宽" @mousedown="startResize($event, department.id)"></span>
            </th>
          </tr>
          <tr class="column-head">
            <template v-for="department in departments" :key="`columns-${department.id}`">
              <th class="sales-column">销售</th>
              <th>配额</th>
              <th>已分</th>
              <th>差额</th>
              <th>进度</th>
            </template>
          </tr>
        </thead>
        <tbody>
          <tr v-for="rowIndex in maxRows" :key="rowIndex">
            <template v-for="department in departments" :key="`${department.id}-${rowIndex}`">
              <template v-if="department.users[rowIndex - 1]">
                <td class="sales-cell">{{ department.users[rowIndex - 1].name }}</td>
                <td>{{ department.users[rowIndex - 1].quota }}</td>
                <td class="assigned-cell">{{ department.users[rowIndex - 1].assigned }}</td>
                <td :class="['difference-cell', { exceeded: department.users[rowIndex - 1].assigned > department.users[rowIndex - 1].quota }]">
                  {{ department.users[rowIndex - 1].quota - department.users[rowIndex - 1].assigned }}
                </td>
                <td class="progress-cell">
                  <div
                    class="progress-fill sales-progress-fill"
                    :style="{
                      width: progressWidth(rate(department.users[rowIndex - 1].assigned, department.users[rowIndex - 1].quota)),
                      background: progressBackground(rate(department.users[rowIndex - 1].assigned, department.users[rowIndex - 1].quota))
                    }"></div>
                  <span :style="{ color: progressColor(rate(department.users[rowIndex - 1].assigned, department.users[rowIndex - 1].quota)) }">
                    {{ rate(department.users[rowIndex - 1].assigned, department.users[rowIndex - 1].quota) }}%
                  </span>
                </td>
              </template>
              <template v-else>
                <td class="empty">—</td><td class="empty">—</td><td class="empty">—</td><td class="empty">—</td><td class="empty">—</td>
              </template>
            </template>
          </tr>
        </tbody>
      </table>
      <el-empty v-if="!loading && departments.length === 0" description="当前主体在该日期暂无分配配置" />
    </div>
  </el-dialog>
</template>

<script setup>
import { quotaDashboardList } from '@/api/public/lead'
import { treeselect } from '@/api/system/dept'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  subjectList: {
    type: Array,
    default: () => []
  },
  activeSubjectId: {
    type: [Number, String],
    default: undefined
  },
  quotaDate: {
    type: String,
    default: ''
  }
})
const emit = defineEmits(['update:modelValue'])
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const quotaDate = ref(today())
const activeSubjectId = ref()
const loading = ref(false)
const quotaRows = ref([])
const departmentTree = ref([])
const widths = reactive({})
const subjects = computed(() => props.subjectList || [])
const departments = computed(() => {
  const departmentMap = new Map()
  quotaRows.value.forEach((row) => {
    const departmentId = row.deptId || 0
    if (!departmentMap.has(departmentId)) {
      departmentMap.set(departmentId, {
        id: departmentId,
        name: row.deptName || '未知部门',
        quota: 0,
        assigned: 0,
        users: []
      })
    }
    const department = departmentMap.get(departmentId)
    const quota = Number(row.quotaCount || 0)
    const assigned = Number(row.assignCount ?? row.assignedCount ?? 0)
    department.quota += quota
    department.assigned += assigned
    department.users.push({
      id: row.userId,
      name: row.userNickName || '未命名用户',
      quota,
      assigned
    })
  })
  const orderedDepartments = flattenDepartments(departmentTree.value)
    .map(department => departmentMap.get(department.id))
    .filter(Boolean)
  const orderedIds = new Set(orderedDepartments.map(department => department.id))
  return orderedDepartments.concat(
    Array.from(departmentMap.values()).filter(department => !orderedIds.has(department.id))
  )
})
const subjectQuota = computed(() => departments.value.reduce((total, item) => total + item.quota, 0))
const subjectAssigned = computed(() => departments.value.reduce((total, item) => total + item.assigned, 0))
const subjectUserCount = computed(() => departments.value.reduce((total, item) => total + item.users.length, 0))
const maxRows = computed(() => Math.max(0, ...departments.value.map((item) => item.users.length)))
const matrixWidth = computed(() => departments.value.reduce((total, item) => total + salesWidth(item.id) + 242, 0))

watch(visible, (value) => {
  if (!value) return
  activeSubjectId.value = props.activeSubjectId || subjects.value[0]?.id
  quotaDate.value = props.quotaDate || today()
  loadDashboard()
})

watch([activeSubjectId, quotaDate], () => {
  if (visible.value) loadDashboard()
})

async function loadDashboard() {
  if (!activeSubjectId.value || !quotaDate.value) {
    quotaRows.value = []
    return
  }
  loading.value = true
  try {
    if (departmentTree.value.length === 0) {
      const departmentResponse = await treeselect()
      departmentTree.value = departmentResponse.data || []
    }
    const response = await quotaDashboardList({
      subjectId: activeSubjectId.value,
      quotaDate: quotaDate.value
    })
    quotaRows.value = normalizeRows(response.data || [])
  } finally {
    loading.value = false
  }
}

function flattenDepartments(nodes, parent = null, result = [], level = 1) {
  ;(nodes || []).forEach(node => {
    const children = Array.isArray(node.children) ? node.children : []
    const department = {
      id: String(node.id),
      name: node.label || '未知部门',
      parentId: parent ? String(parent.id) : null,
      isLeaf: children.length === 0,
      level
    }
    result.push(department)
    flattenDepartments(children, department, result, level + 1)
  })
  return result
}

function normalizeRows(rows) {
  const treeDepartments = flattenDepartments(departmentTree.value)
  const departmentMap = new Map(treeDepartments.map(department => [department.id, department]))
  const treeById = new Map(treeDepartments.map(department => [department.id, department]))
  const maxLevel = Math.max(0, ...treeDepartments.map(department => department.level))

  return rows.map(row => {
    const department = departmentMap.get(String(row.deptId))
    const targetDepartment = department?.level === maxLevel && department.parentId
      ? treeById.get(department.parentId)
      : department

    return targetDepartment
      ? { ...row, deptId: targetDepartment.id, deptName: targetDepartment.name }
      : row
  })
}

function today() {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function rate(assigned, quota) {
  return quota ? Math.round((assigned / quota) * 100) : 0
}

function progressColor(value) {
  if (value > 100) return '#f56c6c'
  return '#1677ff'
}

function progressBackground(value) {
  if (value > 100) return 'linear-gradient(90deg, #f89898, #f56c6c)'
  return 'linear-gradient(90deg, #79bbff, #1677ff)'
}

function progressWidth(value) {
  return `${Math.min(Math.max(value, 0), 100)}%`
}

function salesWidth(departmentId) {
  return widths[departmentId] || 96
}

function startResize(event, departmentId) {
  event.preventDefault()
  const startX = event.clientX
  const startWidth = salesWidth(departmentId)
  const move = (moveEvent) => {
    widths[departmentId] = Math.min(220, Math.max(76, startWidth + moveEvent.clientX - startX))
  }
  const up = () => {
    document.removeEventListener('mousemove', move)
    document.removeEventListener('mouseup', up)
  }
  document.addEventListener('mousemove', move)
  document.addEventListener('mouseup', up)
}
</script>

<style scoped lang="scss">
.dashboard-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 42px;
  margin-bottom: 12px;
  padding: 7px 10px 7px 12px;
  background: linear-gradient(135deg, #f8fbff 0%, #f2f7ff 100%);
  border: 1px solid #e1eaf6;
  border-radius: 10px;
}

.subject-tabs {
  display: flex;
  gap: 8px;
  min-width: 0;
  overflow-x: auto;
  scrollbar-width: thin;
}

.subject-tab {
  min-width: max-content;
  padding: 7px 15px;
  color: #606b7c;
  background: #fff;
  border: 1px solid #dce5f0;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgb(31 56 88 / 4%);
  cursor: pointer;
  transition: all 0.2s ease;
}

.subject-tab:hover {
  color: #1677ff;
  border-color: #9fc5f5;
  transform: translateY(-1px);
}

.subject-tab.active {
  color: #fff;
  background: linear-gradient(135deg, #287cf0, #155ed0);
  border-color: #287cf0;
  box-shadow: 0 4px 10px rgb(22 119 255 / 22%);
}

.subject-tab.abnormal:not(.active) {
  color: #9ca3af;
  background: #f3f4f6;
  border-color: #e5e7eb;
}

.summary-bar {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-bottom: 12px;
  padding: 10px;
  overflow: hidden;
  background: #f5f8fc;
  border: 1px solid #e5ebf3;
  border-radius: 10px;
}

.summary-bar > div {
  position: relative;
  min-height: 46px;
  padding: 8px 14px;
  overflow: hidden;
  background: #fff;
  border: 1px solid #e9eef5;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgb(31 56 88 / 4%);
}

.summary-bar span { position: relative; z-index: 1; display: block; margin-bottom: 2px; color: #8792a3; font-size: 12px; }
.summary-bar strong { position: relative; z-index: 1; color: #263449; font-size: 20px; line-height: 1.2; }
.summary-bar strong.assigned { color: #1677ff; }
.summary-progress { display: flex; flex-direction: column; justify-content: center; }
.summary-progress .progress-fill { opacity: 0.12; }

.progress-fill {
  position: absolute;
  inset: 0 auto 0 0;
  opacity: 1;
  pointer-events: none;
  transition: width 0.25s ease;
}

.matrix-wrap {
  position: relative;
  height: 68vh;
  overflow: auto;
  background: #f6f8fb;
  border: 1px solid #dfe7f1;
  border-radius: 10px;
  box-shadow: inset 0 1px 3px rgb(31 56 88 / 3%);
}

.matrix-wrap :deep(.el-empty) {
  position: absolute;
  inset: 100px 0 auto;
}

.quota-matrix {
  min-width: 100%;
  border-spacing: 0;
  border-collapse: separate;
  table-layout: fixed;
  color: #4b5870;
  font-size: 12px;
}

.quota-matrix th,
.quota-matrix td {
  height: 44px;
  padding: 7px 8px;
  background: #fff;
  border-right: 1px solid #edf1f6;
  border-bottom: 1px solid #edf1f6;
  text-align: center;
  white-space: nowrap;
  transition: background 0.15s ease;
}

.quota-matrix th:nth-child(5n),
.quota-matrix td:nth-child(5n) {
  border-right: 2px solid #c8d7ea;
}

.department-head {
  position: sticky;
  top: 0;
  z-index: 3;
  height: 62px !important;
  background: linear-gradient(135deg, #eaf3ff 0%, #f4f8ff 100%) !important;
  border-right: 2px solid #b8d0ee !important;
  box-shadow: inset 0 -1px 0 #d7e5f5;
}

.department-progress-fill { z-index: 0; opacity: 0.16; }
.department-name { position: relative; z-index: 1; color: #1d3c68; font-size: 14px; font-weight: 700; }
.department-summary { position: relative; z-index: 1; margin-top: 4px; color: #6d7f98; font-size: 11px; font-weight: 400; }

.resize-handle {
  position: absolute;
  top: 0;
  right: -3px;
  z-index: 4;
  width: 7px;
  height: 100%;
  cursor: col-resize;
}

.resize-handle:hover { background: rgb(22 119 255 / 22%); }
.column-head th {
  position: sticky;
  top: 62px;
  z-index: 2;
  height: 34px;
  padding: 4px 6px;
  color: #63738b;
  background: #f8fafc;
  border-bottom-color: #dbe5f1;
  font-size: 11px;
  font-weight: 600;
}
.sales-column, .sales-cell { text-align: left !important; }
.sales-cell { overflow: hidden; color: #293b55; font-weight: 600; text-overflow: ellipsis; }
.assigned-cell { color: #1677ff; font-weight: 700; }
.difference-cell { color: #e6a23c; font-weight: 700; }
.difference-cell.exceeded { color: #f56c6c; }
.quota-matrix tbody tr:nth-child(even) td { background: #fbfcfe; }
.quota-matrix tbody tr:hover td { background: #eef6ff; }
.progress-cell { position: relative; overflow: hidden; font-weight: 700; }
.sales-progress-fill { z-index: 0; opacity: 0.14; }
.progress-cell span { position: relative; z-index: 1; }
.empty { color: #c5cbd4; background: #fbfcfd !important; }

:deep(.el-dialog__body) {
  padding-top: 8px;
}
</style>
