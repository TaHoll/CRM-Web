<template>
  <div class="app-container finance-refund-page">
    <el-form ref="queryRef" :model="queryParams" :inline="true" v-show="showSearch" label-width="82px">
      <el-form-item label="退款单号" prop="refundNo">
        <el-input v-model.trim="queryParams.refundNo" placeholder="请输入转款单号" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="客户姓名" prop="customerName">
        <el-input v-model.trim="queryParams.customerName" placeholder="请输入客户姓名" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="销售人员" prop="salesNickName">
        <el-input v-model.trim="queryParams.salesNickName" placeholder="请输入销售昵称" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="退款状态" prop="refundStatus">
        <el-select v-model="queryParams.refundStatus" placeholder="全部状态" clearable style="width: 160px">
          <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
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

    <el-row class="mb10">
      <right-toolbar v-model:show-search="showSearch" @query-table="getList" />
    </el-row>

    <el-table v-loading="loading" :data="refundList" border min-height="520">
      <el-table-column type="index" label="序号" width="60" align="center" />
      <el-table-column prop="refundNo" label="退款单号" min-width="180" show-overflow-tooltip>
        <template #default="{ row }">{{ row.refundNo || '-' }}</template>
      </el-table-column>
      <el-table-column prop="paymentOrderNo" label="付款单号" min-width="180" show-overflow-tooltip />
      <el-table-column prop="customerName" label="客户姓名" width="110" show-overflow-tooltip>
        <template #default="{ row }">{{ row.customerName || '-' }}</template>
      </el-table-column>
      <el-table-column prop="contractNo" label="合同编号" min-width="160" show-overflow-tooltip>
        <template #default="{ row }">{{ row.contractNo || '-' }}</template>
      </el-table-column>
      <el-table-column prop="refundAmount" label="退款金额" width="125" align="right">
        <template #default="{ row }"><span class="amount-text">¥ {{ formatAmount(row.refundAmount) }}</span></template>
      </el-table-column>
      <el-table-column prop="refundStatus" label="退款状态" width="110" align="center">
        <template #default="{ row }"><el-tag :type="statusTagType(row.refundStatus)">{{ statusText(row.refundStatus) }}</el-tag></template>
      </el-table-column>
      <el-table-column prop="refundScreenshotUrl" label="转款截图" width="100" align="center">
        <template #default="{ row }">
          <el-link v-if="row.refundScreenshotUrl" type="primary" :underline="false" @click="previewScreenshot(row.refundScreenshotUrl)">查看</el-link>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column prop="salesNickName" label="销售人员" width="110" show-overflow-tooltip />
      <el-table-column prop="salesDeptName" label="销售部门" min-width="130" show-overflow-tooltip />
      <el-table-column prop="applyUserNickName" label="申请人" width="110" show-overflow-tooltip />
      <el-table-column prop="applyTime" label="申请时间" width="170" align="center">
        <template #default="{ row }">{{ parseTime(row.applyTime) }}</template>
      </el-table-column>
      <el-table-column prop="auditUserNickName" label="审核人" width="110" align="center">
        <template #default="{ row }">{{ row.auditUserNickName || '-' }}</template>
      </el-table-column>
      <el-table-column prop="auditTime" label="审核时间" width="170" align="center">
        <template #default="{ row }">{{ row.auditTime ? parseTime(row.auditTime) : '-' }}</template>
      </el-table-column>
      <el-table-column prop="refundTime" label="退款时间" width="170" align="center">
        <template #default="{ row }">{{ row.refundTime ? parseTime(row.refundTime) : '-' }}</template>
      </el-table-column>
      <el-table-column label="操作" width="170" align="center" fixed="right">
        <template #default="{ row }">
          <template v-if="Number(row.refundStatus) === 0">
            <el-button v-hasPermi="['crm:refund:audit']" link type="success" @click="handleAudit(row, 1)">审核通过</el-button>
            <el-button v-hasPermi="['crm:refund:audit']" link type="danger" @click="handleAudit(row, 2)">不通过</el-button>
          </template>
          <el-button
            v-if="Number(row.refundStatus) === 2"
            v-hasPermi="['crm:refund:complete']"
            link
            type="primary"
            @click="openCompleteDialog(row)">完成转款</el-button>
          <span v-if="![0, 2].includes(Number(row.refundStatus))">-</span>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total > 0"
      v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize"
      :total="total"
      @pagination="getList" />

    <el-dialog v-model="completeVisible" title="完成退款转款" width="520px" append-to-body @closed="resetCompleteForm">
      <el-descriptions :column="1" border class="mb15">
        <el-descriptions-item label="退款金额">¥ {{ formatAmount(currentRefund.refundAmount) }}</el-descriptions-item>
      </el-descriptions>
      <el-form ref="completeRef" :model="completeForm" :rules="completeRules" label-width="96px">
        <el-form-item label="退款单号" prop="refundNo">
          <el-input v-model.trim="completeForm.refundNo" maxlength="64" placeholder="请输入转款单号" />
        </el-form-item>
        <el-form-item label="转款截图" prop="screenshot">
          <el-upload
            v-model:file-list="screenshotFiles"
            action="#"
            list-type="picture-card"
            accept="image/jpeg,image/png,image/webp"
            :auto-upload="false"
            :limit="1"
            :on-change="handleScreenshotChange"
            :on-remove="handleScreenshotRemove"
            :class="{ 'is-limit-reached': screenshotFiles.length >= 1 }">
            <el-icon><Plus /></el-icon>
            <template #tip><div class="el-upload__tip">支持 JPG、PNG、WebP，大小不超过 2MB</div></template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="completeVisible = false">取消</el-button>
        <el-button type="primary" :loading="completeSubmitting" @click="submitComplete">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="screenshotPreviewVisible" title="转款截图" width="720px" append-to-body>
      <div class="screenshot-preview"><img :src="screenshotPreviewUrl" alt="转款截图" /></div>
    </el-dialog>
  </div>
</template>

<script setup name="FinanceRefund">
import { upload } from '@/api/common'
import { auditPaymentRefund, completePaymentRefund, getRefundManagementList } from '@/api/public/paymentOrder'

const { proxy } = getCurrentInstance()
const loading = ref(false)
const showSearch = ref(true)
const total = ref(0)
const refundList = ref([])
const applyTimeRange = ref([])
const completeVisible = ref(false)
const completeSubmitting = ref(false)
const completeRef = ref()
const currentRefund = ref({})
const screenshotFiles = ref([])
const screenshotPreviewVisible = ref(false)
const screenshotPreviewUrl = ref('')

const statusOptions = [
  { label: '待审核', value: 0 },
  { label: '已驳回', value: 1 },
  { label: '退款中', value: 2 },
  { label: '已退款', value: 3 },
  { label: '已取消', value: 4 }
]
const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  refundNo: undefined,
  customerName: undefined,
  salesNickName: undefined,
  refundStatus: undefined,
  beginApplyTime: undefined,
  endApplyTime: undefined
})
const completeForm = reactive({ id: undefined, refundNo: '', screenshot: '' })
const completeRules = {
  refundNo: [{ required: true, message: '请输入退款单号', trigger: 'blur' }],
  screenshot: [{ validator: (_rule, _value, callback) => screenshotFiles.value.length ? callback() : callback(new Error('请上传转款截图')), trigger: 'change' }]
}

function formatAmount(value) {
  return Number(value || 0).toFixed(2)
}
function statusText(value) {
  return statusOptions.find(item => item.value === Number(value))?.label || '未知状态'
}
function statusTagType(value) {
  return ({ 0: 'warning', 1: 'danger', 2: 'primary', 3: 'success', 4: 'info' })[Number(value)] || 'info'
}
function normalizeStorageUrl(value) {
  if (!value) return ''
  try {
    const url = new URL(value, window.location.origin)
    const isLocalAddress = ['localhost', '127.0.0.1', '::1'].includes(url.hostname)
    if (isLocalAddress || url.origin === window.location.origin) {
      const baseApi = String(import.meta.env.VITE_APP_BASE_API || '').replace(/\/$/, '')
      const pathname = baseApi && url.pathname.startsWith(`${baseApi}/`) ? url.pathname.slice(baseApi.length) : url.pathname
      return `${pathname}${url.search}`
    }
  } catch {
    return value
  }
  return value
}
function previewScreenshot(value) {
  try {
    screenshotPreviewUrl.value = new URL(value, window.location.origin).href
  } catch {
    screenshotPreviewUrl.value = value
  }
  screenshotPreviewVisible.value = true
}

async function getList() {
  loading.value = true
  ;[queryParams.beginApplyTime, queryParams.endApplyTime] = applyTimeRange.value || []
  try {
    const response = await getRefundManagementList(queryParams)
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
async function handleAudit(row, auditStatus) {
  const actionText = auditStatus === 1 ? '审核通过' : '审核不通过'
  const confirmed = await proxy.$modal.confirm(`确认将该退款申请${actionText}吗？`).then(() => true).catch(() => false)
  if (!confirmed) return
  const response = await auditPaymentRefund({ id: row.id, auditStatus })
  if (response.code === 200) {
    proxy.$modal.msgSuccess(`${actionText}成功`)
    await getList()
  }
}
function openCompleteDialog(row) {
  currentRefund.value = row
  completeForm.id = row.id
  completeForm.refundNo = ''
  completeForm.screenshot = ''
  screenshotFiles.value = []
  completeVisible.value = true
  nextTick(() => completeRef.value?.clearValidate())
}
function handleScreenshotChange(uploadFile) {
  const file = uploadFile.raw
  if (!file) return
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    screenshotFiles.value = []
    proxy.$modal.msgWarning('只能上传 JPG、PNG、WebP 图片')
    return
  }
  if (file.size / 1024 / 1024 > 2) {
    screenshotFiles.value = []
    proxy.$modal.msgWarning('转款截图不能超过2MB')
    return
  }
  completeForm.screenshot = file.name
  completeRef.value?.validateField('screenshot')
}
function handleScreenshotRemove() {
  screenshotFiles.value = []
  completeForm.screenshot = ''
  completeRef.value?.validateField('screenshot')
}
function resetCompleteForm() {
  completeForm.id = undefined
  completeForm.refundNo = ''
  completeForm.screenshot = ''
  screenshotFiles.value = []
  currentRefund.value = {}
  completeRef.value?.resetFields()
}
async function submitComplete() {
  const valid = await completeRef.value?.validate().catch(() => false)
  if (!valid || completeSubmitting.value) return

  completeSubmitting.value = true
  try {
    const file = screenshotFiles.value[0]?.raw
    const uploadForm = new FormData()
    uploadForm.append('file', file)
    uploadForm.append('FileDir', 'refund')
    uploadForm.append('FileNameType', '3')
    uploadForm.append('ClassifyType', 'refund_voucher')
    uploadForm.append('Quality', '80')
    const uploadResponse = await upload(uploadForm)
    if (uploadResponse.code !== 200 || !uploadResponse.data?.url) {
      proxy.$modal.msgError(uploadResponse.msg || '转款截图上传失败')
      return
    }

    const response = await completePaymentRefund({
      id: completeForm.id,
      refundNo: completeForm.refundNo,
      refundScreenshotUrl: normalizeStorageUrl(uploadResponse.data.url)
    })
    if (response.code === 200) {
      proxy.$modal.msgSuccess('转款完成')
      completeVisible.value = false
      await getList()
    }
  } finally {
    completeSubmitting.value = false
  }
}

getList()
</script>

<style scoped>
.finance-refund-page :deep(.el-table .cell) { white-space: nowrap; }
.amount-text { color: #e65d2f; font-weight: 600; }
.screenshot-preview { display: flex; align-items: center; justify-content: center; min-height: 240px; }
.screenshot-preview img { display: block; max-width: 100%; max-height: 70vh; object-fit: contain; }
.is-limit-reached :deep(.el-upload--picture-card) { display: none; }
</style>
