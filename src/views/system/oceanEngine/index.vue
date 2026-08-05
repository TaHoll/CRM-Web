<template>
  <div class="app-container lead-config-page">
    <!-- <el-card shadow="never" class="config-panel top-panel">
      <template #header>
        <span>线索配置</span>
      </template>
    </el-card> -->

    <div class="bottom-panels">
      <el-card shadow="never" class="config-panel account-panel">
        <template #header>
          <span>巨量引擎广告账户列表</span>
        </template>

        <el-table :data="accountList" v-loading="loading" border>
          <el-table-column prop="dictValue" label="账号id" align="center" :show-overflow-tooltip="true" />
          <el-table-column prop="dictLabel" label="账号名" align="center" :show-overflow-tooltip="true" />
          <el-table-column label="启用" align="center" width="120">
            <template #default="{ row }">
              <el-checkbox v-model="row.enabled" />
            </template>
          </el-table-column>
        </el-table>

        <pagination
          class="mt10"
          background
          :total="accountTotal"
          v-model:page="accountQuery.pageNum"
          v-model:limit="accountQuery.pageSize"
          @pagination="getList" />

        <div class="account-actions">
          <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
        </div>
      </el-card>

      <el-card shadow="never" class="config-panel assign-panel">
        <template #header>
          <span>线索分配部门</span>
        </template>

        <el-form :model="assignDeptForm" label-width="70px" class="assign-form">
          <el-form-item label="一销">
            <el-tree-select
              v-model="assignDeptForm.firstSalesDeptId"
              :data="deptOptions"
              :props="{ value: 'id', label: 'label', children: 'children' }"
              value-key="id"
              placeholder="请选择一销部门"
              check-strictly
              clearable
              filterable />
          </el-form-item>
          <el-form-item label="二销">
            <el-tree-select
              v-model="assignDeptForm.secondSalesDeptId"
              :data="deptOptions"
              :props="{ value: 'id', label: 'label', children: 'children' }"
              value-key="id"
              placeholder="请选择二销部门"
              check-strictly
              clearable
              filterable />
          </el-form-item>
          <el-form-item label="三销">
            <el-tree-select
              v-model="assignDeptForm.thirdSalesDeptId"
              :data="deptOptions"
              :props="{ value: 'id', label: 'label', children: 'children' }"
              value-key="id"
              placeholder="请选择三销部门"
              check-strictly
              clearable
              filterable />
          </el-form-item>
        </el-form>

        <div class="assign-actions">
          <el-button type="primary" @click="handleSaveAssignDept">保存</el-button>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup name="OceanEngineConfig">
import { listOceanEngineAccount } from '@/api/system/customer.js'
import { changeStatus } from '@/api/system/dict/data.js'
import { treeselect } from '@/api/system/dept'

const { proxy } = getCurrentInstance()

const loading = ref(false)
const saving = ref(false)
const accountList = ref([])
const accountTotal = ref(0)
const accountQuery = reactive({
  pageNum: 1,
  pageSize: 10,
  sort: 'Status',
  sortType: 'ascending'
})
const deptOptions = ref([])
const assignDeptForm = reactive({
  firstSalesDeptId: undefined,
  secondSalesDeptId: undefined,
  thirdSalesDeptId: undefined
})

function normalizeEnabled(row) {
  if (row.enabled !== undefined) {
    return Boolean(row.enabled)
  }
  if (row.status !== undefined) {
    return row.status === 0 || row.status === '0'
  }
  return true
}

function getList() {
  loading.value = true
  listOceanEngineAccount(accountQuery)
    .then((res) => {
      if (res.code === 200) {
        accountList.value = (res.data?.result || []).map((item) => ({
          ...item,
          enabled: normalizeEnabled(item)
        }))
        accountTotal.value = res.data?.totalNum || 0
      }
    })
    .finally(() => {
      loading.value = false
    })
}

function getDeptOptions() {
  treeselect().then((response) => {
    deptOptions.value = response.data || []
  })
}

function buildSavePayload(row) {
  return {
    dictCode: row.dictCode,
    status: row.enabled ? '0' : '1'
  }
}

function handleSave() {
  saving.value = true
  Promise.all(
    accountList.value.map((item) => {
      const payload = buildSavePayload(item)
      return changeStatus(payload.dictCode, payload.status)
    })
  )
    .then(() => {
      proxy.$modal.msgSuccess('保存成功')
      getList()
    })
    .finally(() => {
      saving.value = false
    })
}

function handleSaveAssignDept() {
  proxy.$modal.msgSuccess('保存成功')
}

getList()
getDeptOptions()
</script>

<style scoped>
.lead-config-page {
  min-height: calc(100vh - 84px);
}

.config-panel {
  border-radius: 4px;
}

.top-panel {
  min-height: 180px;
  margin-bottom: 16px;
}

.bottom-panels {
  display: grid;
  grid-template-columns: minmax(420px, 1fr) minmax(320px, 1fr);
  gap: 16px;
  min-height: 420px;
}

.account-panel {
  min-width: 0;
}

.assign-panel {
  min-width: 0;
}

.assign-form {
  max-width: 420px;
}

.assign-actions {
  display: flex;
  justify-content: center;
  padding-top: 16px;
}

.account-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 16px;
}

@media (max-width: 992px) {
  .bottom-panels {
    grid-template-columns: 1fr;
  }
}
</style>
