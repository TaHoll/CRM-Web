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
      <right-toolbar v-model:show-search="showSearch" @query-table="getList" />
    </el-row>

    <el-table v-loading="loading" :data="contractList" border min-height="520">
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
      <el-table-column label="操作" width="190" align="center" fixed="right">
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
          <el-button
            v-else-if="Number(row.contractStatus) === 1 && Number(row.enterpriseSealStatus) !== 1"
            v-hasPermi="['crm:contract:audit']"
            link
            type="success"
            :loading="signUrlLoadingId === row.id"
            @click="handleContractSeal(row)">签署</el-button>
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
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup name="CustomerContractAudit">
import { auditContract, getContractAuditList } from '@/api/public/contract'
import { getContractSignUrl } from '@/api/public/esign'

const { proxy } = getCurrentInstance()
const loading = ref(false)
const showSearch = ref(true)
const total = ref(0)
const contractList = ref([])
const createTimeRange = ref([])
const auditLoadingId = ref(null)
const signUrlLoadingId = ref(null)
const detailVisible = ref(false)
const currentContract = ref({})

const statusOptions = [
  { label: '审核中', value: 0 },
  { label: '签署中', value: 1 },
  { label: '签署完成', value: 2 },
  { label: '审核不通过', value: 3 }
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
  return ({ 0: 'warning', 1: 'primary', 2: 'success', 3: 'danger' })[Number(value)] || 'info'
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

async function getList() {
  loading.value = true
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

async function handleAudit(row, auditStatus) {
  const actionText = auditStatus === 1 ? '通过' : '不通过'
  await proxy.$modal.confirm(`确认${actionText}债权人“${row.creditorName}”的合同吗？`)
  auditLoadingId.value = row.id
  try {
    const response = await auditContract({ id: row.id, auditStatus })
    if (response.code === 200) {
      proxy.$modal.msgSuccess(`合同审核${actionText}`)
      await getList()
    }
  } finally {
    auditLoadingId.value = null
  }
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
</style>
