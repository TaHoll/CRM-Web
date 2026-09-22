<template>
  <div class="app-container customer-refund-page">
    <el-form ref="queryRef" :model="queryParams" :inline="true" v-show="showSearch" label-width="72px">
      <el-form-item label="客户姓名" prop="creditorName">
        <el-input v-model.trim="queryParams.creditorName" placeholder="请输入线索客户姓名" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="销售人员" prop="salesNickName">
        <el-input v-model.trim="queryParams.salesNickName" placeholder="请输入销售昵称" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">查询</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row class="mb10">
      <right-toolbar v-model:show-search="showSearch" @query-table="getList" />
    </el-row>

    <el-table v-loading="loading" :data="contractList" border min-height="520">
      <el-table-column type="index" label="序号" width="60" align="center" />
      <el-table-column prop="clueId" label="线索ID" min-width="150" show-overflow-tooltip />
      <el-table-column prop="customerName" label="客户姓名" width="120" show-overflow-tooltip>
        <template #default="{ row }">{{ row.customerName || '-' }}</template>
      </el-table-column>
      <el-table-column prop="signFlowId" label="合同编号" min-width="220" show-overflow-tooltip>
        <template #default="{ row }">{{ row.signFlowId || `合同ID：${row.id}` }}</template>
      </el-table-column>
      <el-table-column prop="contractAmount" label="合同金额" width="125" align="right">
        <template #default="{ row }"><span class="amount-text">¥ {{ formatAmount(row.contractAmount) }}</span></template>
      </el-table-column>
      <el-table-column prop="approvedPaymentAmount" label="已收款" width="125" align="right">
        <template #default="{ row }"><span class="amount-text">¥ {{ formatAmount(row.approvedPaymentAmount) }}</span></template>
      </el-table-column>
      <el-table-column prop="salesNickName" label="销售昵称" width="120" show-overflow-tooltip />
      <el-table-column prop="salesDeptName" label="部门" min-width="130" show-overflow-tooltip>
        <template #default="{ row }">{{ row.salesDeptName || '-' }}</template>
      </el-table-column>
      <el-table-column prop="disputeType" label="纠纷类型" min-width="160" show-overflow-tooltip>
        <template #default="{ row }">{{ row.disputeType || '-' }}</template>
      </el-table-column>
      <el-table-column label="操作" width="100" align="center" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" :loading="paymentLoadingContractId === row.id" @click="openRefundDialog(row)">退款</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total > 0"
      v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize"
      :total="total"
      @pagination="getList" />

    <el-dialog v-model="refundDialogVisible" title="发起客户退款" width="1100px" class="refund-dialog" append-to-body>
      <div class="refund-dialog-content">
        <div class="refund-contract-summary">
          <span>客户：{{ selectedContract?.customerName || '-' }}</span>
          <span>合同编号：{{ selectedContract?.signFlowId || (selectedContract ? `合同ID：${selectedContract.id}` : '-') }}</span>
        </div>
        <el-table v-loading="paymentLoading" :data="paymentList" border min-height="480" max-height="500" @selection-change="handlePaymentSelectionChange">
        <el-table-column type="selection" width="52" align="center" />
        <el-table-column prop="paymentOrderNo" label="付款单号" min-width="180" show-overflow-tooltip />
        <el-table-column prop="paymentAmount" label="付款金额" width="120" align="right">
          <template #default="{ row }"><span class="amount-text">¥ {{ formatAmount(row.paymentAmount) }}</span></template>
        </el-table-column>
        <el-table-column prop="refundAmount" label="已退款" width="120" align="right">
          <template #default="{ row }"><span class="amount-text">¥ {{ formatAmount(row.refundAmount) }}</span></template>
        </el-table-column>
        <el-table-column label="可退金额" width="120" align="right">
          <template #default="{ row }"><span class="amount-text">¥ {{ formatAmount(refundableAmount(row)) }}</span></template>
        </el-table-column>
        <el-table-column label="退款金额" width="260" align="center">
          <template #default="{ row }">
            <template v-if="isPaymentSelected(row)">
              <div class="refund-amount-actions">
                <el-input-number
                v-model="refundForms[row.id].refundAmount"
                :min="0.01"
                :max="refundableAmount(row)"
                :precision="2"
                :step="1"
                size="small"
                controls-position="right"
                class="refund-amount-input"
                @change="clearRefundRate(row)" />
                <el-select v-model="refundForms[row.id].refundRate" size="small" placeholder="退款比例" class="refund-rate-select" @change="handleRefundRateChange(row)">
                  <el-option label="自定义金额" value="" />
                  <el-option label="退款 25%" :value="25" />
                  <el-option label="退款 50%" :value="50" />
                  <el-option label="退款 75%" :value="75" />
                  <el-option label="全额退款" :value="100" />
                </el-select>
              </div>
            </template>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="paymentTime" label="付款时间" width="170" align="center">
          <template #default="{ row }">{{ parseTime(row.paymentTime) }}</template>
        </el-table-column>
        </el-table>
        <el-empty v-if="!paymentLoading && paymentList.length === 0" description="该合同暂无审核通过的付款记录" :image-size="72" />
        <div v-if="selectedPayments.length > 0" class="refund-total">
          已选择 {{ selectedPayments.length }} 笔付款记录，退款合计：
          <span class="amount-text">¥ {{ formatAmount(selectedRefundTotal) }}</span>
        </div>
      </div>
      <template #footer>
        <el-button @click="refundDialogVisible = false">取消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="CustomerRefund">
import { getRefundContractList, getRefundPaymentList } from '@/api/public/contract'

const { proxy } = getCurrentInstance()
const loading = ref(false)
const showSearch = ref(true)
const total = ref(0)
const contractList = ref([])
const refundDialogVisible = ref(false)
const paymentLoading = ref(false)
const paymentLoadingContractId = ref(null)
const paymentList = ref([])
const selectedContract = ref(null)
const selectedPayments = ref([])
const refundForms = ref({})

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  creditorName: undefined,
  salesNickName: undefined
})

function formatAmount(value) {
  return Number(value || 0).toFixed(2)
}

function refundableAmount(row) {
  return Math.max(0, Number(row.paymentAmount || 0) - Number(row.refundAmount || 0))
}

const selectedRefundTotal = computed(() => selectedPayments.value.reduce(
  (total, item) => total + Number(refundForms.value[item.id]?.refundAmount || 0), 0
))

function createRefundForm(row) {
  if (!refundForms.value[row.id]) {
    refundForms.value[row.id] = {
      refundAmount: refundableAmount(row),
      refundRate: ''
    }
  }
}

function isPaymentSelected(row) {
  return selectedPayments.value.some(item => item.id === row.id)
}

function handlePaymentSelectionChange(rows) {
  rows.forEach(createRefundForm)
  selectedPayments.value = rows
}

function clearRefundRate(row) {
  refundForms.value[row.id].refundRate = ''
}

function handleRefundRateChange(row) {
  const form = refundForms.value[row.id]
  if (!form.refundRate) return
  form.refundAmount = Number((refundableAmount(row) * form.refundRate / 100).toFixed(2))
}

async function getList() {
  loading.value = true
  try {
    const response = await getRefundContractList(queryParams)
    contractList.value = response.data?.result || []
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
  proxy.resetForm('queryRef')
  handleQuery()
}

async function openRefundDialog(row) {
  selectedContract.value = row
  paymentList.value = []
  selectedPayments.value = []
  refundForms.value = {}
  refundDialogVisible.value = true
  paymentLoading.value = true
  paymentLoadingContractId.value = row.id
  try {
    const response = await getRefundPaymentList(row.id)
    paymentList.value = Array.isArray(response.data) ? response.data : []
  } finally {
    paymentLoading.value = false
    paymentLoadingContractId.value = null
  }
}

getList()
</script>

<style scoped>
.customer-refund-page :deep(.el-table .cell) {
  white-space: nowrap;
}

.refund-contract-summary {
  display: flex;
  gap: 28px;
  margin-bottom: 14px;
  color: var(--el-text-color-regular);
}

:global(.refund-dialog .el-dialog__body) {
  min-height: 560px;
  max-height: calc(100vh - 180px);
  overflow-y: auto;
}

.refund-dialog-content {
  min-height: 520px;
}

.refund-total {
  margin-top: 14px;
  text-align: right;
  color: var(--el-text-color-regular);
}

.placeholder-text {
  color: var(--el-text-color-placeholder);
  font-size: 13px;
}

.refund-amount-input {
  width: 150px;
}

.refund-amount-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.refund-rate-select {
  width: 110px;
}

.amount-text {
  color: #f56c6c;
  font-weight: 600;
}
</style>
