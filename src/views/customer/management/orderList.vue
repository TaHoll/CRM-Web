<template>
  <div class="app-container contract-order-page">
    <el-form ref="queryRef" :model="queryParams" :inline="true" v-show="showSearch" label-width="82px">
      <el-form-item label="债权人" prop="creditorName">
        <el-input v-model.trim="queryParams.creditorName" placeholder="请输入债权人姓名" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="手机号码" prop="creditorMobile">
        <el-input v-model.trim="queryParams.creditorMobile" placeholder="请输入债权人手机号" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="销售人员" prop="salesNickName">
        <el-input v-model.trim="queryParams.salesNickName" placeholder="请输入销售昵称" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="所属主体" prop="subjectName">
        <el-input v-model.trim="queryParams.subjectName" placeholder="请输入主体名称" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="创建时间">
        <el-date-picker
          v-model="createTimeRange"
          type="datetimerange"
          value-format="YYYY-MM-DD HH:mm:ss"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          range-separator="至"
          clearable />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">查询</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row class="mb10">
      <right-toolbar v-model:show-search="showSearch" @query-table="getList" />
    </el-row>

    <el-table v-loading="loading" :data="orderList" border min-height="520">
      <el-table-column type="index" label="序号" width="60" align="center" />
      <el-table-column prop="subjectName" label="所属主体" min-width="150" show-overflow-tooltip>
        <template #default="{ row }">{{ row.subjectName || '-' }}</template>
      </el-table-column>
      <el-table-column prop="creditorName" label="债权人" width="110" show-overflow-tooltip />
      <el-table-column prop="creditorMobile" label="债权人电话" width="135" align="center" />
      <el-table-column prop="debtorName" label="债务人" width="110" show-overflow-tooltip />
      <el-table-column prop="disputeType" label="纠纷类型" min-width="180" show-overflow-tooltip />
      <el-table-column prop="contractAmount" label="合同金额" width="130" align="right">
        <template #default="{ row }"><span class="amount-text">¥ {{ formatAmount(row.contractAmount) }}</span></template>
      </el-table-column>
      <el-table-column prop="approvedPaymentAmount" label="已审核付款" width="130" align="right">
        <template #default="{ row }"><span class="amount-text">¥ {{ formatAmount(row.approvedPaymentAmount) }}</span></template>
      </el-table-column>
      <el-table-column label="付款状态" width="110" align="center">
        <template #default="{ row }">
          <el-tag :type="Number(row.approvedPaymentAmount) >= Number(row.contractAmount) ? 'success' : 'warning'">
            {{ Number(row.approvedPaymentAmount) >= Number(row.contractAmount) ? '已付清' : '未付清' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="salesNickName" label="销售人员" width="110" align="center" />
      <el-table-column prop="salesDeptName" label="销售部门" min-width="130" show-overflow-tooltip>
        <template #default="{ row }">{{ row.salesDeptName || '-' }}</template>
      </el-table-column>
      <el-table-column prop="stage" label="线索阶段" width="100" align="center">
        <template #default="{ row }">{{ formatStage(row.stage) }}</template>
      </el-table-column>
      <el-table-column prop="contractStatus" label="合同状态" width="110" align="center">
        <template #default="{ row }">
          <el-tag :type="statusTagType(row.contractStatus)">{{ formatStatus(row.contractStatus) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="signFlowId" label="合同编号" min-width="230" show-overflow-tooltip>
        <template #default="{ row }">{{ row.signFlowId || '-' }}</template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" width="170" align="center">
        <template #default="{ row }">{{ parseTime(row.createTime) }}</template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total > 0"
      v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize"
      :total="total"
      @pagination="getList" />
  </div>
</template>

<script setup name="CustomerOrderList">
import { getContractOrderList } from '@/api/public/contract'

const { proxy } = getCurrentInstance()
const loading = ref(false)
const showSearch = ref(true)
const total = ref(0)
const orderList = ref([])
const createTimeRange = ref([])

const statusOptions = [
  { label: '签署中', value: 1 },
  { label: '签署完成', value: 2 }
]

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  creditorName: undefined,
  creditorMobile: undefined,
  salesNickName: undefined,
  subjectName: undefined,
  beginCreateTime: undefined,
  endCreateTime: undefined
})

function formatStatus(value) {
  return statusOptions.find(item => item.value === Number(value))?.label || '未知状态'
}

function statusTagType(value) {
  return ({ 1: 'primary', 2: 'success' })[Number(value)] || 'info'
}

function formatStage(value) {
  return ({ 0: '一销', 100: '二销', 200: '三销', 300: '售后' })[Number(value)] || String(value ?? '-')
}

function formatAmount(value) {
  return Number(value || 0).toFixed(2)
}

async function getList() {
  loading.value = true
  ;[queryParams.beginCreateTime, queryParams.endCreateTime] = createTimeRange.value || []
  try {
    const response = await getContractOrderList(queryParams)
    orderList.value = response.data?.result || []
    total.value = response.data?.totalNum || 0
  } finally {
    loading.value = false
  }
}

function handleQuery() {
  queryParams.pageNum = 1
  getList()
}

function resetQuery() {
  createTimeRange.value = []
  proxy.resetForm('queryRef')
  handleQuery()
}

getList()
</script>

<style scoped>
.contract-order-page :deep(.el-table .cell) {
  white-space: nowrap;
}

.amount-text {
  color: #f56c6c;
  font-weight: 600;
}
</style>
