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
                    class="progress-fill"
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
  return Array.from(departmentMap.values())
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
    const response = await quotaDashboardList({
      subjectId: activeSubjectId.value,
      quotaDate: quotaDate.value
    })
    quotaRows.value = response.data || []
  } finally {
    loading.value = false
  }
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
  margin-bottom: 10px;
}

.subject-tabs {
  display: flex;
  gap: 7px;
  overflow-x: auto;
}

.subject-tab {
  min-width: max-content;
  padding: 7px 13px;
  color: #606b7c;
  background: #f5f7fa;
  border: 1px solid transparent;
  border-radius: 6px;
  cursor: pointer;
}

.subject-tab.active {
  color: #1677ff;
  background: #edf5ff;
  border-color: #9bc7ff;
}

.subject-tab.abnormal:not(.active) {
  color: #9ca3af;
  background: #f3f4f6;
}

.summary-bar {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  margin-bottom: 10px;
  overflow: hidden;
  border: 1px solid #e3e8ef;
  border-radius: 6px;
}

.summary-bar > div {
  position: relative;
  padding: 8px 14px;
  overflow: hidden;
  border-right: 1px solid #e3e8ef;
}

.summary-bar > div:last-child { border-right: 0; }
.summary-bar span { margin-right: 12px; color: #8792a3; font-size: 12px; }
.summary-bar strong { color: #263449; font-size: 19px; }
.summary-bar strong.assigned { color: #1677ff; }
.summary-bar span,
.summary-bar strong { position: relative; z-index: 1; }

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
  border: 1px solid #dfe5ed;
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
  color: #4d586b;
  font-size: 12px;
}

.quota-matrix th,
.quota-matrix td {
  height: 43px;
  padding: 6px;
  background: #fff;
  border-right: 1px solid #e5e9ef;
  border-bottom: 1px solid #e5e9ef;
  text-align: center;
  white-space: nowrap;
}

.quota-matrix th:nth-child(5n),
.quota-matrix td:nth-child(5n) {
  border-right: 2px solid #c5d0de;
}

.department-head {
  position: sticky;
  top: 0;
  z-index: 3;
  height: 62px !important;
  background: #edf5ff !important;
  border-right: 2px solid #aacaf1 !important;
}

.department-progress-fill { z-index: 0; opacity: 1; }
.department-name { position: relative; z-index: 1; color: #273449; font-size: 14px; font-weight: 700; }
.department-summary { position: relative; z-index: 1; margin-top: 4px; color: #758297; font-size: 11px; font-weight: 400; }

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
.column-head th { position: sticky; top: 62px; z-index: 2; color: #687588; background: #f7f9fc; }
.sales-column, .sales-cell { text-align: left !important; }
.sales-cell { overflow: hidden; color: #303b4d; font-weight: 600; text-overflow: ellipsis; }
.assigned-cell { color: #1677ff; font-weight: 700; }
.difference-cell { color: #e6a23c; font-weight: 700; }
.difference-cell.exceeded { color: #f56c6c; }
.progress-cell { position: relative; overflow: hidden; font-weight: 700; }
.progress-cell span { position: relative; z-index: 1; }
.empty { color: #c5cbd4; background: #fbfcfd !important; }

:deep(.el-dialog__body) {
  padding-top: 8px;
}
</style>
