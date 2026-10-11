<template>
  <div class="app-container contract-audit-page">
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
      <el-form-item label="合同状态" prop="contractStatus">
        <el-select v-model="queryParams.contractStatus" placeholder="全部状态" clearable style="width: 150px">
          <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
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
      <el-button
        v-hasPermi="['crm:contract:audit']"
        type="primary"
        :disabled="selectedContracts.length === 0"
        :loading="batchSignLoading"
        @click="handleBatchSeal">批量盖章</el-button>
      <right-toolbar v-model:show-search="showSearch" @query-table="getList" />
    </el-row>

    <el-table ref="contractTableRef" v-loading="loading" :data="contractList" border min-height="520" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" :selectable="canBatchSeal" />
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
      <el-table-column prop="recoveryServiceFeeRate" label="服务费" width="90" align="center">
        <template #default="{ row }">{{ formatRate(row.recoveryServiceFeeRate) }}</template>
      </el-table-column>
      <el-table-column prop="salesNickName" label="销售人员" width="110" align="center" />
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
      <el-table-column prop="enterpriseSealStatus" label="盖章状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag v-if="Number(row.contractStatus) === 0" type="info">未发起</el-tag>
          <el-tag v-else :type="Number(row.enterpriseSealStatus) === 1 ? 'success' : 'warning'">
            {{ Number(row.enterpriseSealStatus) === 1 ? '已盖章' : '未盖章' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" width="170" align="center">
        <template #default="{ row }">{{ parseTime(row.createTime) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="270" align="center" fixed="right">
        <template #default="{ row }">
          <template v-if="Number(row.contractStatus) === 0">
            <el-button
              v-hasPermi="['crm:contract:audit']"
              link
              type="success"
              :loading="auditLoadingId === row.id"
              @click="handleAudit(row, 1)">通过</el-button>
            <el-button
              v-hasPermi="['crm:contract:audit']"
              link
              type="danger"
              :loading="auditLoadingId === row.id"
              @click="handleAudit(row, 2)">不通过</el-button>
          </template>
          <template v-else-if="Number(row.contractStatus) === 1">
            <el-button
              v-if="Number(row.enterpriseSealStatus) !== 1"
              v-hasPermi="['crm:contract:audit']"
              link
              type="success"
              :loading="signUrlLoadingId === row.id"
              @click="handleContractSeal(row)">盖章</el-button>
            <el-button
              v-if="Number(row.enterpriseSealStatus) === 1"
              v-hasPermi="['crm:contract:audit']"
              link
              type="success"
              :loading="completeLoadingId === row.id"
              @click="handleComplete(row)">签署完成</el-button>
            <el-button
              v-hasPermi="['crm:contract:audit']"
              link
              type="primary"
              :loading="signUrlLoadingId === row.id"
              @click="handleShareContract(row)">分享签署</el-button>
            <el-button
              v-hasPermi="['crm:contract:audit']"
              link
              type="danger"
              :loading="revokeLoadingId === row.id"
              @click="handleRevoke(row)">撤销</el-button>
          </template>
          <el-button
            v-if="[1, 2].includes(Number(row.contractStatus))"
            link
            type="primary"
            :loading="downloadLoadingId === row.id"
            @click="handleDownload(row)">下载</el-button>
          <el-button
            v-if="[3, 4].includes(Number(row.contractStatus)) && row.invalidReason"
            link
            type="danger"
            @click="showContractReason(row)">查看原因</el-button>
          <el-button link type="primary" @click="showDetail(row)">详情</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total > 0"
      v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize"
      :total="total"
      @pagination="getList" />

    <el-dialog v-model="detailVisible" title="合同详情" width="720px" append-to-body>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="所属主体">{{ currentContract.subjectName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="合同状态">
          <el-tag :type="statusTagType(currentContract.contractStatus)">{{ formatStatus(currentContract.contractStatus) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="盖章状态">
          <el-tag :type="Number(currentContract.enterpriseSealStatus) === 1 ? 'success' : 'warning'">
            {{ Number(currentContract.enterpriseSealStatus) === 1 ? '已盖章' : '未盖章' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="债权人姓名">{{ currentContract.creditorName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="债权人电话">{{ currentContract.creditorMobile || '-' }}</el-descriptions-item>
        <el-descriptions-item label="身份证号码" :span="2">{{ currentContract.creditorIdCardNo || '-' }}</el-descriptions-item>
        <el-descriptions-item label="联系地址" :span="2">{{ currentContract.creditorAddress || '-' }}</el-descriptions-item>
        <el-descriptions-item label="债务人姓名">{{ currentContract.debtorName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="纠纷类型">{{ currentContract.disputeType || '-' }}</el-descriptions-item>
        <el-descriptions-item label="合同金额">¥ {{ formatAmount(currentContract.contractAmount) }}</el-descriptions-item>
        <el-descriptions-item label="服务费">{{ formatRate(currentContract.recoveryServiceFeeRate) }}</el-descriptions-item>
        <el-descriptions-item label="受委托人">{{ currentContract.entrustedPersonName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="受委托人电话">{{ currentContract.entrustedPersonPhone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="销售人员">{{ currentContract.salesNickName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="线索阶段">{{ formatStage(currentContract.stage) }}</el-descriptions-item>
        <el-descriptions-item label="线索ID" :span="2">{{ currentContract.clueId || '-' }}</el-descriptions-item>
        <el-descriptions-item label="审核人">{{ currentContract.auditUserNickName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="审核时间">{{ currentContract.auditTime ? parseTime(currentContract.auditTime) : '-' }}</el-descriptions-item>
        <el-descriptions-item label="审核/失效原因" :span="2">{{ currentContract.invalidReason || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <div
      v-if="contractShareDialogVisible"
      class="contract-share-overlay"
      @click.self="contractShareDialogVisible = false">
      <div v-loading="contractShareImageLoading" class="contract-share-panel">
        <el-image
          v-if="contractShareImage"
          class="contract-share-image"
          :src="contractShareImage"
          fit="contain" />
        <el-empty v-else description="暂无分享图片" />
        <div v-if="contractShareImage" class="contract-share-actions-trigger">
          <div class="contract-share-actions">
            <span
              class="contract-share-action-item"
              :class="{ 'is-disabled': !contractShareImage }"
              @click="handleCopyShareImage">
              复制图片
            </span>
            <span class="contract-share-action-divider">|</span>
            <span
              class="contract-share-action-item"
              :class="{ 'is-disabled': !contractShareUrl }"
              @click="handleCopyShareUrl">
              复制链接
            </span>
          </div>
        </div>
        <button class="contract-share-close" type="button" @click="contractShareDialogVisible = false">×</button>
      </div>
    </div>
  </div>
</template>

<script setup name="CustomerContractAudit">
import { ElMessageBox } from 'element-plus'
import useClipboard from 'vue-clipboard3'
import { auditContract, completeContract, getContractAuditList, getContractDownloadUrl, revokeContract } from '@/api/public/contract'
import { getBatchSignUrl, getContractSignUrl } from '@/api/public/esign'
import generateContractImage from '@/utils/contractCanvas'

const { proxy } = getCurrentInstance()
const { toClipboard } = useClipboard()
const loading = ref(false)
const showSearch = ref(true)
const total = ref(0)
const contractList = ref([])
const contractTableRef = ref(null)
const selectedContracts = ref([])
const batchSignLoading = ref(false)
const createTimeRange = ref([])
const auditLoadingId = ref(null)
const signUrlLoadingId = ref(null)
const completeLoadingId = ref(null)
const revokeLoadingId = ref(null)
const downloadLoadingId = ref(null)
const contractShareDialogVisible = ref(false)
const contractShareImageLoading = ref(false)
const contractShareImage = ref('')
const contractShareUrl = ref('')
const detailVisible = ref(false)
const currentContract = ref({})

const statusOptions = [
  { label: '审核中', value: 0 },
  { label: '签署中', value: 1 },
  { label: '签署完成', value: 2 },
  { label: '审核不通过', value: 3 },
  { label: '已失效', value: 4 }
]

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  creditorName: undefined,
  creditorMobile: undefined,
  salesNickName: undefined,
  subjectName: undefined,
  contractStatus: 0,
  beginCreateTime: undefined,
  endCreateTime: undefined
})

function formatStatus(value) {
  return statusOptions.find(item => item.value === Number(value))?.label || '未知状态'
}

function statusTagType(value) {
  return ({ 0: 'warning', 1: 'primary', 2: 'success', 3: 'danger', 4: 'info' })[Number(value)] || 'info'
}

function formatStage(value) {
  return ({ 0: '一销', 100: '二销', 200: '三销', 300: '售后' })[Number(value)] || String(value ?? '-')
}

function formatAmount(value) {
  return Number(value || 0).toFixed(2)
}

function formatRate(value) {
  return `${Number(value || 0).toFixed(2)}%`
}

function formatShareDateTime() {
  const value = new Date()
  const pad = number => String(number).padStart(2, '0')
  return `${value.getFullYear()}年${pad(value.getMonth() + 1)}月${pad(value.getDate())}日 ${pad(value.getHours())}:${pad(value.getMinutes())}`
}

function canBatchSeal(row) {
  return Number(row.contractStatus) === 1
    && Number(row.enterpriseSealStatus) !== 1
    && Boolean(row.signFlowId)
}

function handleSelectionChange(rows) {
  selectedContracts.value = rows
}

async function getList() {
  loading.value = true
  contractTableRef.value?.clearSelection()
  ;[queryParams.beginCreateTime, queryParams.endCreateTime] = createTimeRange.value || []
  try {
    const response = await getContractAuditList(queryParams)
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
  createTimeRange.value = []
  proxy.resetForm('queryRef')
  queryParams.contractStatus = 0
  handleQuery()
}

function showDetail(row) {
  currentContract.value = row
  detailVisible.value = true
}

async function handleBatchSeal() {
  if (batchSignLoading.value || selectedContracts.value.length === 0) return

  const contracts = selectedContracts.value
  if (contracts.some(row => !canBatchSeal(row))) {
    proxy.$modal.msgWarning('请选择签署中且未盖章的合同')
    return
  }

  if (contracts.some(row => row.subjectId !== contracts[0].subjectId)) {
    proxy.$modal.msgWarning('批量盖章的合同必须属于同一主体')
    return
  }

  const signWindow = window.open('', '_blank')
  if (signWindow) {
    signWindow.document.title = '正在打开批量盖章页面'
    signWindow.document.body.innerText = '正在获取批量盖章链接，请稍候...'
  }

  batchSignLoading.value = true
  try {
    const response = await getBatchSignUrl(contracts.map(row => row.id))
    const signUrl = response.data
    if (!signUrl) {
      signWindow?.close()
      proxy.$modal.msgWarning('未获取到批量盖章链接')
      return
    }

    if (signWindow) {
      signWindow.location.replace(signUrl)
    } else {
      window.location.assign(signUrl)
    }
  } catch (error) {
    signWindow?.close()
    throw error
  } finally {
    batchSignLoading.value = false
  }
}

async function handleDownload(row) {
  if (downloadLoadingId.value || ![1, 2].includes(Number(row.contractStatus))) return

  const downloadWindow = window.open('', '_blank')
  downloadLoadingId.value = row.id
  try {
    const response = await getContractDownloadUrl(row.id)
    const downloadUrl = response.data
    if (!downloadUrl) {
      downloadWindow?.close()
      proxy.$modal.msgWarning('未获取到合同下载链接')
      return
    }

    if (downloadWindow) {
      downloadWindow.location.replace(downloadUrl)
    } else {
      window.location.assign(downloadUrl)
    }
  } catch (error) {
    downloadWindow?.close()
    throw error
  } finally {
    downloadLoadingId.value = null
  }
}

async function handleAudit(row, auditStatus) {
  const actionText = auditStatus === 1 ? '通过' : '不通过'
  let auditRemark = ''
  if (auditStatus === 2) {
    const result = await ElMessageBox.prompt('请输入审核不通过的原因', '合同审核不通过', {
      inputPlaceholder: '请输入驳回原因',
      inputValidator: value => value?.trim() ? true : '驳回原因不能为空',
      inputErrorMessage: '驳回原因不能为空'
    })
    auditRemark = result.value.trim()
  } else {
    await proxy.$modal.confirm(`确认通过债权人“${row.creditorName}”的合同吗？`)
  }
  auditLoadingId.value = row.id
  try {
    const response = await auditContract({ id: row.id, auditStatus, auditRemark })
    if (response.code === 200) {
      proxy.$modal.msgSuccess(`合同审核${actionText}`)
      await getList()
    }
  } finally {
    auditLoadingId.value = null
  }
}

function showContractReason(row) {
  ElMessageBox.alert(row.invalidReason || '暂无原因', '审核/失效原因', {
    confirmButtonText: '知道了'
  })
}

async function handleContractSeal(row) {
  if (signUrlLoadingId.value || Number(row.contractStatus) !== 1) return

  const signWindow = window.open('', '_blank')
  if (signWindow) {
    signWindow.document.title = '正在打开签署页面'
    signWindow.document.body.innerText = '正在获取企业盖章链接，请稍候...'
  }

  signUrlLoadingId.value = row.id
  try {
    const response = await getContractSignUrl(row.id, 1)
    const signUrl = response.data?.shortUrl || response.data?.url
    if (!signUrl) {
      signWindow?.close()
      proxy.$modal.msgWarning('未获取到盖章链接')
      return
    }

    if (signWindow) {
      signWindow.location.replace(signUrl)
    } else {
      window.location.assign(signUrl)
    }
  } catch (error) {
    signWindow?.close()
    throw error
  } finally {
    signUrlLoadingId.value = null
  }
}

async function handleShareContract(row) {
  if (signUrlLoadingId.value || Number(row.contractStatus) !== 1) return

  signUrlLoadingId.value = row.id
  contractShareImageLoading.value = true
  contractShareImage.value = ''
  contractShareUrl.value = ''
  try {
    const response = await getContractSignUrl(row.id, 2)
    const signUrl = response.data?.shortUrl || response.data?.url || response.data
    if (!signUrl) {
      proxy.$modal.msgWarning('未获取到签署链接')
      return
    }

    const contractName = Number(row.stage) === 0
      ? '调解法律服务委托合同'
      : `${formatStage(row.stage)}法律服务委托合同`
    contractShareUrl.value = signUrl
    contractShareImage.value = await generateContractImage({
      initiatorName: row.subjectName,
      signerName: row.creditorName,
      contractName,
      initiatedAt: formatShareDateTime(),
      signQrCode: signUrl
    })
    contractShareDialogVisible.value = true
  } finally {
    contractShareImageLoading.value = false
    signUrlLoadingId.value = null
  }
}

async function handleCopyShareImage() {
  if (!contractShareImage.value) return
  if (!navigator.clipboard?.write || !window.ClipboardItem) {
    proxy.$modal.msgWarning('当前浏览器不支持复制图片，请右键保存后分享')
    return
  }

  try {
    const response = await fetch(contractShareImage.value)
    const blob = await response.blob()
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
    proxy.$modal.msgSuccess('已复制图片')
  } catch {
    proxy.$modal.msgError('图片复制失败，请检查浏览器剪贴板权限')
  }
}

async function handleCopyShareUrl() {
  if (!contractShareUrl.value) return
  try {
    await toClipboard(contractShareUrl.value)
    proxy.$modal.msgSuccess('已复制链接')
  } catch {
    proxy.$modal.msgError('链接复制失败，请检查浏览器剪贴板权限')
  }
}

async function handleRevoke(row) {
  if (revokeLoadingId.value || Number(row.contractStatus) !== 1) return

  await proxy.$modal.confirm(`确认撤销债权人“${row.creditorName}”的签署流程吗？撤销后不可恢复。`)
  revokeLoadingId.value = row.id
  try {
    const response = await revokeContract(row.id)
    if (response.code === 200) {
      proxy.$modal.msgSuccess('合同已撤销')
      await getList()
    }
  } finally {
    revokeLoadingId.value = null
  }
}

async function handleComplete(row) {
  if (completeLoadingId.value
    || Number(row.contractStatus) !== 1
    || Number(row.enterpriseSealStatus) !== 1) return

  await proxy.$modal.confirm(`确认将债权人“${row.creditorName}”的合同标记为签署完成吗？`)
  completeLoadingId.value = row.id
  try {
    const response = await completeContract(row.id)
    if (response.code === 200) {
      proxy.$modal.msgSuccess('合同已标记为签署完成')
      await getList()
    }
  } finally {
    completeLoadingId.value = null
  }
}

getList()
</script>

<style scoped>
.contract-audit-page :deep(.el-table .cell) {
  white-space: nowrap;
}

.amount-text {
  color: #e65d2f;
  font-weight: 600;
}

.reason-text {
  color: var(--el-color-danger);
}

.contract-share-overlay {
  position: fixed;
  z-index: 3000;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgb(0 0 0 / 56%);
}

.contract-share-panel {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  max-width: min(90vw, 520px);
  max-height: 94vh;
}

.contract-share-image {
  display: block;
  width: min(90vw, 520px);
  max-height: 94vh;
}

.contract-share-actions-trigger {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 68px;
  background: rgb(15 25 40 / 38%);
  backdrop-filter: blur(5px);
}

.contract-share-actions {
  display: flex;
  justify-content: center;
  gap: 10px;
}

.contract-share-action-item {
  color: rgb(255 255 255 / 92%);
  cursor: pointer;
  font-size: 14px;
  line-height: 32px;
  text-shadow: 0 1px 3px rgb(0 0 0 / 55%);
}

.contract-share-action-item:hover {
  color: #fff;
  text-decoration: underline;
}

.contract-share-action-divider {
  color: rgb(255 255 255 / 55%);
  font-size: 14px;
  line-height: 32px;
}

.contract-share-close {
  position: absolute;
  top: -12px;
  right: -12px;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: rgb(0 0 0 / 58%);
  color: #fff;
  cursor: pointer;
  font-size: 24px;
  line-height: 30px;
}

.contract-share-close:hover {
  background: rgb(0 0 0 / 78%);
}
</style>
