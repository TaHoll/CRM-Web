<template>
  <div class="app-container customer-refund-page">
    <el-form ref="queryRef" :model="queryParams" :inline="true" v-show="showSearch" label-width="76px">
      <el-form-item label="客户姓名" prop="customerName">
        <el-input v-model.trim="queryParams.customerName" placeholder="请输入客户姓名" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="销售人员" prop="salesNickName">
        <el-input v-model.trim="queryParams.salesNickName" placeholder="请输入销售昵称" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="退款状态" prop="refundStatus">
        <el-select v-model="queryParams.refundStatus" placeholder="请选择退款状态" clearable style="width: 160px">
          <el-option v-for="item in refundStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="申请时间">
        <el-date-picker
          v-model="applyTimeRange"
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

    <div class="table-toolbar mb10">
      <el-button type="primary" icon="Plus" @click="openContractDialog">申请退款</el-button>
      <right-toolbar v-model:show-search="showSearch" @query-table="getList" />
    </div>

    <el-table v-loading="loading" :data="refundList" border min-height="520">
      <el-table-column type="index" label="序号" width="60" align="center" />
      <el-table-column prop="customerName" label="客户姓名" width="110" show-overflow-tooltip>
        <template #default="{ row }">{{ row.customerName || '-' }}</template>
      </el-table-column>
      <el-table-column prop="paymentOrderNo" label="付款单号" min-width="180" show-overflow-tooltip />
      <el-table-column prop="contractNo" label="合同编号" min-width="180" show-overflow-tooltip>
        <template #default="{ row }">{{ row.contractNo || '-' }}</template>
      </el-table-column>
      <el-table-column prop="refundAmount" label="退款金额" width="125" align="right">
        <template #default="{ row }"><span class="amount-text">¥ {{ formatAmount(row.refundAmount) }}</span></template>
      </el-table-column>
      <el-table-column prop="refundStatus" label="退款状态" width="110" align="center">
        <template #default="{ row }">
          <el-tag :type="refundStatusType(row.refundStatus)">{{ refundStatusText(row.refundStatus) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="salesNickName" label="销售人员" width="110" show-overflow-tooltip />
      <el-table-column prop="salesDeptName" label="销售部门" min-width="130" show-overflow-tooltip>
        <template #default="{ row }">{{ row.salesDeptName || '-' }}</template>
      </el-table-column>
      <el-table-column prop="applyUserNickName" label="申请人" width="110" show-overflow-tooltip />
      <el-table-column prop="applyTime" label="申请时间" width="170" align="center">
        <template #default="{ row }">{{ parseTime(row.applyTime) }}</template>
      </el-table-column>
      <el-table-column prop="refundTime" label="退款时间" width="170" align="center">
        <template #default="{ row }">{{ row.refundTime ? parseTime(row.refundTime) : '-' }}</template>
      </el-table-column>
      <el-table-column label="详情" width="90" align="center" fixed="right">
        <template #default="{ row }">
          <el-button v-if="[1, 2, 3].includes(Number(row.refundStatus))" link type="primary" @click="openRefundDetail(row)">详情</el-button>
          <span v-else>-</span>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total > 0"
      v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize"
      :total="total"
      @pagination="getList" />

    <el-dialog v-model="contractDialogVisible" title="选择退款合同" width="1200px" class="contract-dialog" append-to-body>
      <el-form ref="contractQueryRef" :model="contractQueryParams" :inline="true" label-width="76px">
        <el-form-item label="客户姓名" prop="creditorName">
          <el-input v-model.trim="contractQueryParams.creditorName" placeholder="请输入客户姓名" clearable @keyup.enter="handleContractQuery" />
        </el-form-item>
        <el-form-item label="手机号" prop="creditorMobile">
          <el-input v-model.trim="contractQueryParams.creditorMobile" placeholder="请输入手机号" clearable @keyup.enter="handleContractQuery" />
        </el-form-item>
        <el-form-item label="销售人员" prop="salesNickName">
          <el-input v-model.trim="contractQueryParams.salesNickName" placeholder="请输入销售昵称" clearable @keyup.enter="handleContractQuery" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleContractQuery">查询</el-button>
          <el-button icon="Refresh" @click="resetContractQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table v-loading="contractLoading" :data="contractList" border min-height="420" max-height="500">
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="customerName" label="客户姓名" width="110" show-overflow-tooltip>
          <template #default="{ row }">{{ row.customerName || '-' }}</template>
        </el-table-column>
        <el-table-column prop="signFlowId" label="合同编号" min-width="210" show-overflow-tooltip>
          <template #default="{ row }">{{ row.signFlowId || `合同ID：${row.id}` }}</template>
        </el-table-column>
        <el-table-column prop="contractAmount" label="合同金额" width="120" align="right">
          <template #default="{ row }"><span class="amount-text">¥ {{ formatAmount(row.contractAmount) }}</span></template>
        </el-table-column>
        <el-table-column prop="approvedPaymentAmount" label="已收款" width="120" align="right">
          <template #default="{ row }"><span class="amount-text">¥ {{ formatAmount(row.approvedPaymentAmount) }}</span></template>
        </el-table-column>
        <el-table-column prop="salesNickName" label="销售昵称" width="110" show-overflow-tooltip />
        <el-table-column prop="salesDeptName" label="部门" min-width="120" show-overflow-tooltip>
          <template #default="{ row }">{{ row.salesDeptName || '-' }}</template>
        </el-table-column>
        <el-table-column prop="disputeType" label="纠纷类型" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">{{ row.disputeType || '-' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="90" align="center" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" :loading="paymentLoadingContractId === row.id" @click="openRefundDialog(row)">退款</el-button>
          </template>
        </el-table-column>
      </el-table>

      <pagination
        v-show="contractTotal > 0"
        v-model:page="contractQueryParams.pageNum"
        v-model:limit="contractQueryParams.pageSize"
        :total="contractTotal"
        @pagination="getContractList" />
    </el-dialog>

    <el-dialog v-model="refundDialogVisible" title="发起客户退款" width="1100px" class="refund-dialog" append-to-body>
      <div class="refund-dialog-content">
        <div class="refund-contract-summary">
          <span>客户：{{ selectedContract?.customerName || '-' }}</span>
          <span>合同编号：{{ selectedContract?.signFlowId || (selectedContract ? `合同ID：${selectedContract.id}` : '-') }}</span>
        </div>
        <el-table v-loading="paymentLoading" :data="paymentList" border min-height="420" max-height="500" @selection-change="handlePaymentSelectionChange">
          <el-table-column type="selection" width="52" align="center" :selectable="canSelectPayment" />
          <el-table-column prop="paymentOrderNo" label="付款单号" min-width="180" show-overflow-tooltip />
          <el-table-column prop="paymentAmount" label="付款金额" width="120" align="right">
            <template #default="{ row }"><span class="amount-text">¥ {{ formatAmount(row.paymentAmount) }}</span></template>
          </el-table-column>
          <el-table-column prop="refundAmount" label="已退款" width="120" align="right">
            <template #default="{ row }"><span class="amount-text">¥ {{ formatAmount(row.refundAmount) }}</span></template>
          </el-table-column>
          <el-table-column prop="pendingRefundAmount" label="申请中退款" width="125" align="right">
            <template #default="{ row }">
              <el-tooltip v-if="row.hasActiveRefundApplication" content="该付款订单存在待审核或退款中的申请，不可重复退款" placement="top">
                <span class="pending-amount-text">¥ {{ formatAmount(row.pendingRefundAmount) }}</span>
              </el-tooltip>
              <span v-else>¥ 0.00</span>
            </template>
          </el-table-column>
          <el-table-column label="可退金额" width="120" align="right">
            <template #default="{ row }"><span class="amount-text">¥ {{ formatAmount(refundableAmount(row)) }}</span></template>
          </el-table-column>
          <el-table-column label="退款金额" width="260" align="center">
            <template #default="{ row }">
              <div v-if="isPaymentSelected(row)" class="refund-amount-actions">
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
        <el-button type="primary" :loading="refundSubmitting" @click="submitRefund">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="refundDetailVisible" title="退款详情" width="520px" append-to-body>
      <el-descriptions :column="1" border>
        <template v-if="[1, 2].includes(Number(currentRefund.refundStatus))">
          <el-descriptions-item label="审核人">{{ currentRefund.auditUserNickName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="审核时间">{{ currentRefund.auditTime ? parseTime(currentRefund.auditTime) : '-' }}</el-descriptions-item>
          <el-descriptions-item label="审核备注">{{ currentRefund.remark || '-' }}</el-descriptions-item>
        </template>
        <template v-else-if="Number(currentRefund.refundStatus) === 3">
          <el-descriptions-item label="退款单号">{{ currentRefund.refundNo || '-' }}</el-descriptions-item>
          <el-descriptions-item label="退款截图">
            <el-link v-if="currentRefund.refundScreenshotUrl" type="primary" :underline="false" @click="previewRefundScreenshot(currentRefund.refundScreenshotUrl)">查看截图</el-link>
            <span v-else>-</span>
          </el-descriptions-item>
          <el-descriptions-item label="退款时间">{{ currentRefund.refundTime ? parseTime(currentRefund.refundTime) : '-' }}</el-descriptions-item>
        </template>
      </el-descriptions>
    </el-dialog>

    <el-dialog v-model="screenshotPreviewVisible" title="退款截图" width="720px" append-to-body>
      <div class="screenshot-preview"><img :src="screenshotPreviewUrl" alt="退款截图" /></div>
    </el-dialog>
  </div>
</template>

<script setup name="CustomerRefund">
import { getRefundContractList, getRefundPaymentList } from '@/api/public/contract'
import { addPaymentRefund, getPaymentRefundList } from '@/api/public/paymentOrder'

const { proxy } = getCurrentInstance()
const loading = ref(false)
const showSearch = ref(true)
const total = ref(0)
const refundList = ref([])
const applyTimeRange = ref([])
const contractDialogVisible = ref(false)
const contractLoading = ref(false)
const contractTotal = ref(0)
const contractList = ref([])
const refundDialogVisible = ref(false)
const paymentLoading = ref(false)
const paymentLoadingContractId = ref(null)
const paymentList = ref([])
const selectedContract = ref(null)
const selectedPayments = ref([])
const refundForms = ref({})
const refundSubmitting = ref(false)
const refundDetailVisible = ref(false)
const currentRefund = ref({})
const screenshotPreviewVisible = ref(false)
const screenshotPreviewUrl = ref('')

const refundStatusOptions = [
  { label: '待审核', value: 0 },
  { label: '已驳回', value: 1 },
  { label: '退款中', value: 2 },
  { label: '已退款', value: 3 },
  { label: '已取消', value: 4 }
]

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  customerName: undefined,
  salesNickName: undefined,
  refundStatus: undefined,
  beginApplyTime: undefined,
  endApplyTime: undefined
})

const contractQueryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  creditorName: undefined,
  creditorMobile: undefined,
  salesNickName: undefined
})

const selectedRefundTotal = computed(() => selectedPayments.value.reduce(
  (sum, item) => sum + Number(refundForms.value[item.id]?.refundAmount || 0), 0
))

function formatAmount(value) {
  return Number(value || 0).toFixed(2)
}

function openRefundDetail(row) {
  currentRefund.value = row
  refundDetailVisible.value = true
}

function previewRefundScreenshot(value) {
  try {
    screenshotPreviewUrl.value = new URL(value, window.location.origin).href
  } catch {
    screenshotPreviewUrl.value = value
  }
  screenshotPreviewVisible.value = true
}

function refundStatusText(value) {
  return refundStatusOptions.find(item => item.value === Number(value))?.label || '未知状态'
}

function refundStatusType(value) {
  return ({ 0: 'warning', 1: 'danger', 2: 'primary', 3: 'success', 4: 'info' })[Number(value)] || 'info'
}

function refundableAmount(row) {
  return Math.max(
    0,
    Number(row.paymentAmount || 0)
      - Number(row.refundAmount || 0)
      - Number(row.pendingRefundAmount || 0)
  )
}

function canSelectPayment(row) {
  return !row.hasActiveRefundApplication && refundableAmount(row) > 0
}

function createRefundForm(row) {
  if (!refundForms.value[row.id]) {
    refundForms.value[row.id] = { refundAmount: refundableAmount(row), refundRate: '' }
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
  ;[queryParams.beginApplyTime, queryParams.endApplyTime] = applyTimeRange.value || []
  try {
    const response = await getPaymentRefundList(queryParams)
    refundList.value = response.data?.result || []
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
  applyTimeRange.value = []
  proxy.resetForm('queryRef')
  handleQuery()
}

async function getContractList() {
  contractLoading.value = true
  try {
    const response = await getRefundContractList(contractQueryParams)
    contractList.value = response.data?.result || []
    contractTotal.value = response.data?.totalNum || 0
  } finally {
    contractLoading.value = false
  }
}

function openContractDialog() {
  contractDialogVisible.value = true
  contractQueryParams.pageNum = 1
  getContractList()
}

function handleContractQuery() {
  contractQueryParams.pageNum = 1
  getContractList()
}

function resetContractQuery() {
  proxy.resetForm('contractQueryRef')
  handleContractQuery()
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

async function submitRefund() {
  if (selectedPayments.value.length === 0) {
    proxy.$modal.msgWarning('请选择需要退款的付款记录')
    return
  }

  const items = selectedPayments.value.map(item => ({
    paymentOrderId: item.id,
    refundAmount: Number(refundForms.value[item.id]?.refundAmount || 0)
  }))
  const invalidItem = selectedPayments.value.find((item, index) => {
    const amount = items[index].refundAmount
    return !Number.isFinite(amount)
      || amount <= 0
      || amount > refundableAmount(item)
      || Math.abs(amount - Number(amount.toFixed(2))) > Number.EPSILON
  })
  if (invalidItem) {
    proxy.$modal.msgWarning(`付款单${invalidItem.paymentOrderNo}的退款金额不合规`)
    return
  }

  refundSubmitting.value = true
  try {
    await addPaymentRefund({ items })
    proxy.$modal.msgSuccess('退款申请创建成功')
    refundDialogVisible.value = false
    contractDialogVisible.value = false
    await getList()
  } finally {
    refundSubmitting.value = false
  }
}

getList()
</script>

<style scoped>
.customer-refund-page :deep(.el-table .cell) {
  white-space: nowrap;
}

.table-toolbar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
}

.refund-contract-summary {
  display: flex;
  gap: 28px;
  margin-bottom: 14px;
  color: var(--el-text-color-regular);
}

:global(.refund-dialog .el-dialog__body),
:global(.contract-dialog .el-dialog__body) {
  max-height: calc(100vh - 180px);
  overflow-y: auto;
}

.refund-dialog-content {
  min-height: 480px;
}

.refund-total {
  margin-top: 14px;
  text-align: right;
  color: var(--el-text-color-regular);
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

.pending-amount-text {
  color: var(--el-color-warning);
  font-weight: 600;
}

.screenshot-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 240px;
}

.screenshot-preview img {
  display: block;
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
}
</style>
