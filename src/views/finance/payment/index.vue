<template>
  <div class="app-container payment-finance-page">
    <el-form ref="queryRef" :model="queryParams" :inline="true" v-show="showSearch" label-width="82px">
      <el-form-item label="付款单号" prop="paymentOrderNo">
        <el-input v-model.trim="queryParams.paymentOrderNo" placeholder="请输入付款单号" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="销售人员" prop="salesNickName">
        <el-input v-model.trim="queryParams.salesNickName" placeholder="请输入销售昵称" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="支付方式" prop="paymentMethod">
        <el-select v-model="queryParams.paymentMethod" placeholder="全部方式" clearable style="width: 160px">
          <el-option v-for="item in paymentMethodOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="费用类型" prop="feeType">
        <el-select v-model="queryParams.feeType" placeholder="全部类型" clearable style="width: 160px">
          <el-option v-for="item in feeTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="审核状态" prop="orderStatus">
        <el-select v-model="queryParams.orderStatus" placeholder="全部状态" clearable style="width: 160px">
          <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="支付时间">
        <el-date-picker
          v-model="paymentTimeRange"
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

    <el-table v-loading="loading" :data="paymentList" border min-height="520">
      <el-table-column type="index" label="序号" width="60" align="center" />
      <el-table-column prop="paymentOrderNo" label="付款单号" min-width="180" show-overflow-tooltip />
      <el-table-column prop="paymentMethod" label="支付方式" width="110" align="center">
        <template #default="{ row }">{{ formatPaymentMethod(row.paymentMethod) }}</template>
      </el-table-column>
      <el-table-column prop="feeType" label="费用类型" width="100" align="center">
        <template #default="{ row }">{{ formatFeeType(row.feeType) }}</template>
      </el-table-column>
      <el-table-column prop="paymentAmount" label="支付金额" width="130" align="right">
        <template #default="{ row }"><span class="amount-text">¥ {{ formatAmount(row.paymentAmount) }}</span></template>
      </el-table-column>
      <el-table-column prop="contractNo" label="合同编号" min-width="140" show-overflow-tooltip>
        <template #default="{ row }">{{ row.contractNo || '-' }}</template>
      </el-table-column>
      <el-table-column prop="salesNickName" label="销售人员" width="110" align="center" />
      <el-table-column prop="salesDeptName" label="销售部门" min-width="130" show-overflow-tooltip />
      <el-table-column prop="paymentTime" label="支付时间" width="170" align="center">
        <template #default="{ row }">{{ parseTime(row.paymentTime) }}</template>
      </el-table-column>
      <el-table-column prop="createTime" label="提交时间" width="170" align="center">
        <template #default="{ row }">{{ parseTime(row.createTime) }}</template>
      </el-table-column>
      <el-table-column prop="orderStatus" label="审核状态" width="110" align="center">
        <template #default="{ row }">
          <el-tag :type="statusTagType(row.orderStatus)">{{ formatStatus(row.orderStatus) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="paymentScreenshotUrl" label="支付截图" width="100" align="center">
        <template #default="{ row }">
          <el-link
            v-if="row.paymentScreenshotUrl"
            type="primary"
            :underline="false"
            @click="previewPaymentScreenshot(row.paymentScreenshotUrl)">查看</el-link>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column prop="auditUserNickName" label="审核人" width="100" align="center">
        <template #default="{ row }">{{ row.auditUserNickName || '-' }}</template>
      </el-table-column>
      <el-table-column prop="auditTime" label="审核时间" width="170" align="center">
        <template #default="{ row }">{{ row.auditTime || '-' }}</template>
      </el-table-column>
      <el-table-column label="操作" width="150" align="center" fixed="right">
        <template #default="{ row }">
          <template v-if="row.orderStatus === 0">
            <el-button v-hasPermi="['crm:payment:audit']" link type="success" @click="openAudit(row, 1)">通过</el-button>
            <el-button v-hasPermi="['crm:payment:audit']" link type="danger" @click="openAudit(row, 2)">不通过</el-button>
          </template>
          <el-button v-else link type="primary" @click="showAuditDetail(row)">审核详情</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total > 0"
      v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize"
      :total="total"
      @pagination="getList" />

    <el-dialog v-model="auditVisible" :title="auditForm.orderStatus === 1 ? '审核通过' : '审核不通过'" width="480px" append-to-body>
      <el-descriptions :column="1" border class="mb15">
        <el-descriptions-item label="付款单号">{{ currentOrder.paymentOrderNo }}</el-descriptions-item>
        <el-descriptions-item label="支付金额">¥ {{ formatAmount(currentOrder.paymentAmount) }}</el-descriptions-item>
      </el-descriptions>
      <el-form ref="auditRef" :model="auditForm" :rules="auditRules" label-width="82px">
        <el-form-item label="审核备注" prop="auditRemark">
          <el-input v-model.trim="auditForm.auditRemark" type="textarea" :rows="4" maxlength="500" show-word-limit placeholder="请输入审核备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="auditVisible = false">取消</el-button>
        <el-button :type="auditForm.orderStatus === 1 ? 'success' : 'danger'" :loading="auditSubmitting" @click="submitAudit">确认审核</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="paymentScreenshotPreviewVisible" title="支付截图" width="720px" append-to-body>
      <div class="payment-screenshot-preview">
        <img :src="paymentScreenshotPreviewUrl" alt="支付截图" />
      </div>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="审核详情" width="480px" append-to-body>
      <el-descriptions :column="1" border>
        <el-descriptions-item label="审核状态"><el-tag :type="statusTagType(currentOrder.orderStatus)">{{ formatStatus(currentOrder.orderStatus) }}</el-tag></el-descriptions-item>
        <el-descriptions-item label="审核人">{{ currentOrder.auditUserNickName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="审核时间">{{ currentOrder.auditTime ? parseTime(currentOrder.auditTime) : '-' }}</el-descriptions-item>
        <el-descriptions-item label="审核备注">{{ currentOrder.auditRemark || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup name="FinancePayment">
import { auditPaymentOrder, getFinancePaymentOrderList } from '@/api/public/paymentOrder'

const { proxy } = getCurrentInstance()
const loading = ref(false)
const showSearch = ref(true)
const total = ref(0)
const paymentList = ref([])
const paymentTimeRange = ref([])
const auditVisible = ref(false)
const detailVisible = ref(false)
const paymentScreenshotPreviewVisible = ref(false)
const paymentScreenshotPreviewUrl = ref('')
const auditSubmitting = ref(false)
const auditRef = ref()
const currentOrder = ref({})

const paymentMethodOptions = [
  { label: '企微支付', value: 0 },
  { label: '对公账户', value: 1 },
  { label: '支付宝', value: 2 }
]
const feeTypeOptions = [
  { label: '调解费', value: 0 },
  { label: '诉讼费', value: 1 },
  { label: '律师费', value: 2 },
  { label: '保函费', value: 3 }
]
const statusOptions = [
  { label: '待审核', value: 0 },
  { label: '审核通过', value: 1 },
  { label: '审核未通过', value: 2 }
]
const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  paymentOrderNo: undefined,
  paymentMethod: undefined,
  feeType: undefined,
  orderStatus: undefined,
  salesNickName: undefined,
  beginPaymentTime: undefined,
  endPaymentTime: undefined
})
const auditForm = reactive({ id: undefined, orderStatus: 1, auditRemark: '' })
const auditRules = computed(() => ({
  auditRemark: auditForm.orderStatus === 2
    ? [{ required: true, message: '审核不通过时请填写审核备注', trigger: 'blur' }]
    : []
}))

function formatPaymentMethod(value) {
  return paymentMethodOptions.find((item) => item.value === value)?.label || '-'
}
function formatFeeType(value) {
  return feeTypeOptions.find((item) => item.value === value)?.label || '-'
}
function formatStatus(value) {
  return statusOptions.find((item) => item.value === value)?.label || '-'
}
function statusTagType(value) {
  return { 0: 'warning', 1: 'success', 2: 'danger' }[value] || 'info'
}
function formatAmount(value) {
  return Number(value || 0).toFixed(2)
}

function normalizePaymentScreenshotUrl(value) {
  if (!value) return ''
  try {
    return new URL(value, window.location.origin).href
  } catch {
    return value
  }
}

function previewPaymentScreenshot(value) {
  const url = normalizePaymentScreenshotUrl(value)
  if (!url) return
  paymentScreenshotPreviewUrl.value = url
  paymentScreenshotPreviewVisible.value = true
}

async function getList() {
  loading.value = true
  ;[queryParams.beginPaymentTime, queryParams.endPaymentTime] = paymentTimeRange.value || []
  try {
    const response = await getFinancePaymentOrderList(queryParams)
    paymentList.value = response.data?.result || []
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
  paymentTimeRange.value = []
  proxy.resetForm('queryRef')
  handleQuery()
}
function openAudit(row, status) {
  currentOrder.value = row
  auditForm.id = row.id
  auditForm.orderStatus = status
  auditForm.auditRemark = ''
  auditVisible.value = true
  nextTick(() => auditRef.value?.clearValidate())
}
function showAuditDetail(row) {
  currentOrder.value = row
  detailVisible.value = true
}
async function submitAudit() {
  const valid = await auditRef.value?.validate().catch(() => false)
  if (!valid || auditSubmitting.value) return
  auditSubmitting.value = true
  try {
    const response = await auditPaymentOrder({ ...auditForm })
    if (response.code === 200) {
      proxy.$modal.msgSuccess('审核成功')
      auditVisible.value = false
      await getList()
    }
  } finally {
    auditSubmitting.value = false
  }
}

getList()
</script>

<style scoped>
.payment-finance-page :deep(.el-table .cell) { white-space: nowrap; }

.payment-screenshot-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 240px;
}

.payment-screenshot-preview img {
  display: block;
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
}
.amount-text { color: #e65d2f; font-weight: 600; }
.voucher-image { width: 44px; height: 44px; border-radius: 4px; cursor: pointer; }
</style>
