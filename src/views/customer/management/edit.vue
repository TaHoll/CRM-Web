<template>
  <div class="app-container customer-edit-page">
    <el-card class="page-card customer-summary-card" shadow="never">
      <div class="customer-profile">
        <div :class="['customer-subject-name', { 'is-abnormal': form.subjectTabStatus !== 0 }]">
          <span class="subject-name-value">{{ form.subjectName || '未设置主体' }}</span>
        </div>
        <div class="customer-profile-main">
          <div class="customer-profile-title-row">
            <div class="customer-name-row">
              <div v-if="editingField === 'name'" class="profile-inline-editor name-editor">
                <el-input v-model="form.name" size="small" placeholder="请输入姓名" />
                <el-button link type="primary" @click="finishEdit">完成</el-button>
              </div>
              <template v-else>
                <span class="customer-name">{{ form.name || '未命名客户' }}</span>
                <el-tooltip content="编辑姓名" placement="top">
                  <el-button link type="primary" :icon="Edit" @click="startEdit('name')" />
                </el-tooltip>
              </template>
            </div>
            <div class="header-actions">
              <el-button type="success" @click="openPaymentDialog">收款</el-button>
              <el-button type="primary" plain @click="openContractDialog">创建合同</el-button>
              <el-button type="warning" plain @click="handleBusinessAction('转客诉')">转客诉</el-button>
              <el-button type="primary" :loading="saveLoading" @click="handleSave">保存</el-button>
            </div>
          </div>

          <div class="customer-profile-fields">
            <div class="profile-field">
              <span class="profile-label">手机号：</span>
              <span class="profile-value">{{ displayPhone }}</span>
              <el-button link type="primary" :loading="phoneLoading" :disabled="phoneVisible" @click="getPhone">获取</el-button>
            </div>
            <div class="profile-field">
              <span class="profile-label">年龄：</span>
              <div v-if="editingField === 'age'" class="profile-inline-editor">
                <el-input-number v-model="form.age" :min="0" :max="120" size="small" controls-position="right" />
                <el-button link type="primary" @click="finishEdit">完成</el-button>
              </div>
              <template v-else>
                <span class="profile-value">{{ form.age ?? '-' }}</span>
                <el-tooltip content="编辑年龄" placement="top">
                  <el-button link type="primary" :icon="Edit" @click="startEdit('age')" />
                </el-tooltip>
              </template>
            </div>
            <div class="profile-field">
              <span class="profile-label">性别：</span>
              <el-radio-group v-model="form.gender" size="small" class="gender-selector">
                <el-radio-button value="MALE">男</el-radio-button>
                <el-radio-button value="FEMALE">女</el-radio-button>
                <el-radio-button value="UNKNOWN">未知</el-radio-button>
              </el-radio-group>
            </div>
            <div class="profile-field">
              <span class="profile-label">线索归属地：</span>
              <span class="profile-value">{{ [form.province, form.city].filter(Boolean).join('') || '-' }}</span>
            </div>
            <div class="profile-field">
              <span class="profile-label">微信：</span>
              <div v-if="editingField === 'weixin'" class="profile-inline-editor">
                <el-input v-model.trim="form.weixin" size="small" maxlength="30" placeholder="请输入微信号" clearable />
                <el-button link type="primary" @click="finishEdit">完成</el-button>
              </div>
              <template v-else>
                <span class="profile-value">{{ form.weixin || '-' }}</span>
                <el-tooltip content="编辑微信" placement="top">
                  <el-button link type="primary" :icon="Edit" @click="startEdit('weixin')" />
                </el-tooltip>
              </template>
            </div>
            <div class="profile-field">
              <span class="profile-label">线索阶段：</span>
              <span class="profile-value">{{ form.stage || '-' }}</span>
            </div>
            <div class="profile-field">
              <span class="profile-label">来源时间：</span>
              <span class="profile-value">{{ form.sourceTime || '-' }}</span>
            </div>
            <div class="profile-field profile-tags-field">
              <span class="profile-label">客户标签：</span>
              <div class="tag-editor">
                <el-tag
                  v-for="tag in form.tags"
                  :key="tag.id || tag.name"
                  :color="tag.color || tagColorMap[tag.name] || '#909399'"
                  effect="dark"
                  size="small"
                  closable
                  class="customer-tag"
                  @close="removeTag(tag)">
                  {{ tag.name }}
                </el-tag>
                <span v-if="form.tags.length === 0" class="empty-tags">暂无标签</span>
                <el-tooltip content="新增标签" placement="top">
                  <el-button circle size="small" :icon="Plus" @click="openTagPicker" />
                </el-tooltip>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <el-card class="page-card main-tabs-card" shadow="never">
      <el-tabs v-model="pageTab" class="customer-page-tabs">
        <el-tab-pane label="跟进记录" name="base">
          <div class="follow-info-content">
            <div class="follow-records-page">
              <div v-loading="followLogLoading" class="follow-record-scroll">
                <el-timeline v-if="followRecords.length > 0">
                  <el-timeline-item
                    v-for="item in followRecords"
                    :key="item.id"
                    :timestamp="formatFollowTime(item.createTime || item.CreateTime)"
                    placement="top"
                  >
                    <div class="follow-record">
                      <div class="follow-record-header">
                        <span class="follow-user">{{ item.followUserNickName || item.FollowUserNickName || '-' }}</span>
                        <el-tag
                          v-for="tag in item.customerTags || item.CustomerTags || []"
                          :key="tag.id"
                          :color="tag.color || '#909399'"
                          class="follow-tag"
                          effect="dark"
                          size="small">
                          {{ tag.name }}
                        </el-tag>
                      </div>
                      <div class="follow-content">{{ item.remark || item.Remark || '-' }}</div>
                      <div class="follow-meta">
                        <span>跟进阶段：{{ formatFollowStage(item.stage ?? item.Stage) }}</span>
                      </div>
                    </div>
                  </el-timeline-item>
                </el-timeline>
                <el-empty v-else-if="!followLogLoading" description="暂无跟进记录" :image-size="70" />
              </div>

              <el-card class="follow-add-card" shadow="never">
                <el-form label-position="top">
                  <el-form-item label="跟进内容">
                    <el-input
                      v-model="followRemark"
                      type="textarea"
                      :rows="4"
                      placeholder="请输入本次跟进内容"
                    />
                  </el-form-item>
                  <div class="follow-form-actions">
                    <el-button type="primary" :loading="followSaveLoading" @click="handleSaveFollowLog">保存</el-button>
                  </div>
                </el-form>
              </el-card>
            </div>
          </div>

        </el-tab-pane>

        <el-tab-pane label="案件进度" name="caseProgress">
          <div class="business-empty-panel">
            <el-empty description="暂无案件进度" :image-size="80" />
          </div>
        </el-tab-pane>

        <el-tab-pane label="收款记录" name="paymentRecords">
          <el-table
            v-loading="paymentRecordLoading"
            :data="paymentRecords"
            border
            stripe
            empty-text="暂无收款记录">
            <el-table-column prop="paymentOrderNo" label="付款单号" min-width="180" show-overflow-tooltip />
            <el-table-column label="支付方式" width="120" align="center">
              <template #default="{ row }">{{ formatPaymentMethod(row.paymentMethod) }}</template>
            </el-table-column>
            <el-table-column label="费用类型" width="110" align="center">
              <template #default="{ row }">{{ formatFeeType(row.feeType) }}</template>
            </el-table-column>
            <el-table-column label="支付金额" width="130" align="right">
              <template #default="{ row }">¥ {{ formatPaymentAmount(row.paymentAmount) }}</template>
            </el-table-column>
            <el-table-column label="合同编号" min-width="150" show-overflow-tooltip>
              <template #default="{ row }">{{ row.contractNo || '-' }}</template>
            </el-table-column>
            <el-table-column label="审核状态" width="120" align="center">
              <template #default="{ row }">
                <el-tag :type="paymentStatusTagType(row.orderStatus)">
                  {{ formatPaymentStatus(row.orderStatus) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="支付时间" min-width="170">
              <template #default="{ row }">{{ formatFollowTime(row.paymentTime) }}</template>
            </el-table-column>
            <el-table-column label="提交时间" min-width="170">
              <template #default="{ row }">{{ formatFollowTime(row.createTime) }}</template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="合同信息" name="contracts">
          <div class="business-empty-panel">
            <el-empty description="暂无合同信息" :image-size="80" />
          </div>
        </el-tab-pane>

        <el-tab-pane label="操作日志" name="operationLogs">
          <div v-loading="operationLogLoading" class="oper-log-panel">
            <el-timeline v-if="operationLogs.length > 0">
              <el-timeline-item
                v-for="item in operationLogs"
                :key="item.id"
                :timestamp="item.createTime"
                placement="top">
                <div class="oper-log-card">
                  <div class="oper-log-header">
                    <el-tag :type="operationLogTagType(item.type)" size="small">
                      {{ operationLogTypeName(item.type) }}
                    </el-tag>
                    <span class="oper-log-title">{{ item.operatorNickName || '系统' }}</span>
                  </div>
                  <div class="oper-log-content">
                    <template v-if="item.type === 1">
                      将客户分配给 <strong>{{ item.targetUserNickName || '-' }}</strong>
                    </template>
                    <template v-else-if="item.type === 2">编辑了客户信息</template>
                    <template v-else-if="item.type === 3">查看了客户完整号码</template>
                    <template v-else>操作了客户信息</template>
                  </div>
                  <div class="oper-log-meta">
                    <span>操作部门：{{ item.operatorDeptName || '-' }}</span>
                    <span>线索阶段：{{ item.stageName || '-' }}</span>
                  </div>
                </div>
              </el-timeline-item>
            </el-timeline>
            <el-empty v-else-if="!operationLogLoading" description="暂无操作日志" :image-size="70" />
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <el-dialog v-model="tagPickerVisible" title="选择客户标签" width="480px" append-to-body>
      <div class="tag-picker">
        <div v-for="category in tagOptions" :key="category.id" class="tag-category-group">
          <div class="tag-category-name">
            {{ category.categoryName || category.name || '未分类' }}
          </div>
          <el-checkbox-group v-model="selectedTags" class="tag-category-options">
            <el-checkbox v-for="tag in category.tags" :key="tag.id" :value="tag.id" class="tag-option">
              <el-tag :color="tag.color || '#409eff'" effect="dark" size="small" class="tag-option-preview">
                {{ tag.name }}
              </el-tag>
            </el-checkbox>
          </el-checkbox-group>
        </div>
        <el-empty v-if="tagOptions.length === 0" description="暂无可用标签" :image-size="70" />
      </div>
      <template #footer>
        <el-button @click="tagPickerVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmTags">确认添加</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="contractDialogVisible" title="创建合同" width="680px" append-to-body>
      <el-form ref="contractFormRef" :model="contractForm" :rules="contractRules" label-width="100px">
        <section class="contract-form-section">
          <div class="contract-section-title">合同信息</div>
          <div class="contract-form-grid">
            <el-form-item label="合同类型" prop="contractType">
              <el-input v-model.trim="contractForm.contractType" maxlength="50" placeholder="请输入合同类型" />
            </el-form-item>
            <el-form-item label="合同金额" prop="contractAmount">
              <el-input-number
                v-model="contractForm.contractAmount"
                :min="0.01"
                :precision="2"
                :step="0.01"
                controls-position="right"
                class="amount-input" />
            </el-form-item>
          </div>
        </section>

        <section class="contract-form-section">
          <div class="contract-section-title">债权人信息</div>
          <div class="contract-form-grid">
            <el-form-item label="债权人姓名" prop="creditorName">
              <el-input v-model.trim="contractForm.creditorName" maxlength="50" placeholder="请输入债权人姓名" />
            </el-form-item>
            <el-form-item label="债权人电话" prop="creditorPhone">
              <el-input v-model.trim="contractForm.creditorPhone" maxlength="20" placeholder="请输入债权人电话" />
            </el-form-item>
            <el-form-item label="身份证号码" prop="creditorIdCard">
              <el-input v-model.trim="contractForm.creditorIdCard" maxlength="18" placeholder="请输入债权人身份证号码" />
            </el-form-item>
            <el-form-item label="债权人地址" prop="creditorAddress" class="contract-address-item">
              <el-input v-model.trim="contractForm.creditorAddress" maxlength="200" placeholder="请输入债权人地址" />
            </el-form-item>
          </div>
        </section>

        <section class="contract-form-section">
          <div class="contract-section-title">债务人信息</div>
          <div class="contract-form-grid">
            <el-form-item label="债务人姓名" prop="debtorName">
              <el-input v-model.trim="contractForm.debtorName" maxlength="50" placeholder="请输入债务人姓名" />
            </el-form-item>
          </div>
        </section>
      </el-form>
      <template #footer>
        <el-button @click="contractDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleCreateContract">创建</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="paymentDialogVisible" title="收款" width="520px" append-to-body>
      <el-form
        ref="paymentFormRef"
        :model="paymentForm"
        :rules="paymentRules"
        label-width="100px">
        <el-form-item label="支付方式" prop="paymentMethod">
          <el-radio-group v-model="paymentForm.paymentMethod">
            <el-radio-button :value="0">企微支付</el-radio-button>
            <el-radio-button :value="1">对公账户</el-radio-button>
            <el-radio-button :value="2">支付宝</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="费用类型" prop="feeType">
          <el-select v-model="paymentForm.feeType" placeholder="请选择费用类型" style="width: 100%">
            <el-option label="调解费" :value="0" />
            <el-option label="诉讼费" :value="1" />
            <el-option label="律师费" :value="2" />
            <el-option label="保函费" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="支付订单号" prop="orderNo">
          <el-input
            v-model.trim="paymentForm.orderNo"
            maxlength="64"
            placeholder="请输入支付订单号"
            clearable />
        </el-form-item>
        <el-form-item label="金额" prop="amount">
          <el-input-number
            v-model="paymentForm.amount"
            :min="0.01"
            :precision="2"
            :step="0.01"
            controls-position="right"
            class="amount-input" />
        </el-form-item>
        <el-form-item label="支付时间" prop="paymentTime">
          <el-date-picker
            v-model="paymentForm.paymentTime"
            type="datetime"
            value-format="YYYY-MM-DD HH:mm:ss"
            placeholder="请选择支付时间"
            class="payment-time-picker" />
        </el-form-item>
        <el-form-item label="合同">
          <el-input
            v-model.trim="paymentForm.contract"
            maxlength="100"
            placeholder="请输入合同名称或编号（选填）"
            clearable />
        </el-form-item>
        <el-form-item label="支付凭证">
          <el-upload
            v-model:file-list="paymentFiles"
            :class="{ 'is-limit-reached': paymentFiles.length >= 1 }"
            action="#"
            :auto-upload="false"
            :limit="1"
            :on-change="handlePaymentFileChange"
            accept="image/jpeg,image/png,image/webp"
            list-type="picture-card">
            <span class="upload-plus">+</span>
            <template #tip>
              <div class="upload-tip">支持 JPG、PNG、WebP 图片，大小不超过 2MB，最多上传 1 张。</div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="paymentDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="paymentSubmitting" @click="handlePaymentSave">提交</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="supplementOrderDialogVisible" title="补录订单" width="520px" append-to-body>
      <el-form :model="supplementOrderForm" label-width="90px">
        <el-form-item label="订单号" required>
          <el-input v-model="supplementOrderForm.orderNo" placeholder="请输入订单号" clearable />
        </el-form-item>
        <el-form-item label="金额" required>
          <el-input-number
            v-model="supplementOrderForm.amount"
            :min="0"
            :precision="2"
            :step="0.01"
            controls-position="right"
            class="amount-input" />
        </el-form-item>
        <el-form-item label="支付方式" required>
          <el-select v-model="supplementOrderForm.paymentMethod" placeholder="请选择支付方式" clearable>
            <el-option label="企微收款" value="wecom" />
            <el-option label="支付宝" value="alipay" />
            <el-option label="银行卡" value="bank_card" />
            <el-option label="其它" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="支付截图">
          <el-upload
            v-model:file-list="supplementOrderFiles"
            action="#"
            :auto-upload="false"
            :limit="1"
            accept="image/jpeg,image/png,image/webp"
            list-type="picture-card">
            <span class="upload-plus">+</span>
            <template #tip>
              <div class="upload-tip">支持 JPG、PNG、WebP 图片，最多上传 1 张。</div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="supplementOrderDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSupplementOrderSave">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="CustomerManagementEdit">
import { Edit, Plus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'
import { upload } from '@/api/common'
import { addFollowLog, followLogList, getTelephone, operationLogList, updateCustomer } from '@/api/public/lead'
import { addPaymentOrder, getPaymentOrderList } from '@/api/public/paymentOrder'
import { listEnabledTagOptions } from '@/api/system/tagCategory'

const route = useRoute()
const router = useRouter()
const form = reactive({
  id: '',
  subjectId: undefined,
  subjectName: '',
  subjectTabStatus: 0,
  name: '',
  weixin: '',
  province: '',
  city: '',
  stage: '',
  deptStage: undefined,
  sourceTime: '',
  gender: 'MALE',
  age: 0,
  tags: []
})

const fullPhone = ref('')
const phoneVisible = ref(false)
const phoneLoading = ref(false)
const saveLoading = ref(false)
const editingField = ref('')
const followLogLoading = ref(false)
const followSaveLoading = ref(false)
let followLogRequestId = 0
const operationLogLoading = ref(false)
let operationLogRequestId = 0
let paymentRecordRequestId = 0
const tagPickerVisible = ref(false)
const contractDialogVisible = ref(false)
const contractFormRef = ref()
const paymentDialogVisible = ref(false)
const paymentFormRef = ref()
const paymentFiles = ref([])
const paymentSubmitting = ref(false)
const paymentRecordLoading = ref(false)
const paymentRecords = ref([])
const paymentForm = reactive({
  paymentMethod: undefined,
  feeType: undefined,
  orderNo: '',
  amount: undefined,
  paymentTime: '',
  contract: ''
})
const contractForm = reactive({
  creditorName: '',
  creditorPhone: '',
  creditorIdCard: '',
  creditorAddress: '',
  debtorName: '',
  contractAmount: undefined,
  contractType: ''
})
const contractRules = {
  creditorName: [{ required: true, message: '请输入债权人姓名', trigger: 'blur' }],
  creditorPhone: [{ required: true, message: '请输入债权人电话', trigger: 'blur' }],
  creditorIdCard: [{ required: true, message: '请输入债权人身份证号码', trigger: 'blur' }],
  creditorAddress: [{ required: true, message: '请输入债权人地址', trigger: 'blur' }],
  debtorName: [{ required: true, message: '请输入债务人姓名', trigger: 'blur' }],
  contractAmount: [{ required: true, type: 'number', message: '请输入合同金额', trigger: 'change' }],
  contractType: [{ required: true, message: '请输入合同类型', trigger: 'blur' }]
}
const paymentRules = {
  paymentMethod: [{ required: true, type: 'number', message: '请选择支付方式', trigger: 'change' }],
  feeType: [{ required: true, type: 'number', message: '请选择费用类型', trigger: 'change' }],
  orderNo: [{ required: true, message: '请输入支付订单号', trigger: 'blur' }],
  amount: [{ required: true, type: 'number', min: 0.01, message: '请输入大于0的金额', trigger: 'change' }],
  paymentTime: [{ required: true, message: '请选择支付时间', trigger: 'change' }]
}
const supplementOrderDialogVisible = ref(false)
const supplementOrderFiles = ref([])
const supplementOrderForm = reactive({
  orderNo: '',
  amount: undefined,
  paymentMethod: ''
})
const selectedTags = ref([])
const pageTab = ref('base')
const tagOptions = ref([])
const tagColorMap = ref({})
const followRecords = ref([])
const operationLogs = ref([])
const followRemark = ref('')
const displayPhone = computed(() => {
  if (phoneVisible.value || fullPhone.value.length < 7) return fullPhone.value || '-'
  return `${fullPhone.value.slice(0, 3)}****${fullPhone.value.slice(-4)}`
})
function startEdit(field) {
  editingField.value = field
}

function finishEdit() {
  editingField.value = ''
}

function formatFollowTime(value) {
  if (!value) return '-'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('zh-CN', { hour12: false })
}

function formatFollowStage(stage) {
  const stageMap = {
    0: '一销',
    100: '二销',
    200: '三销',
    300: '售后'
  }
  return stage === null || stage === undefined ? '-' : stageMap[stage] || String(stage)
}

function operationLogTypeName(type) {
  return { 1: '分配客户', 2: '编辑客户', 3: '查看号码' }[type] || '客户操作'
}

function operationLogTagType(type) {
  return { 1: 'primary', 2: 'warning', 3: 'success' }[type] || 'info'
}

function formatPaymentMethod(method) {
  return { 0: '企微支付', 1: '对公账户', 2: '支付宝' }[method] || '-'
}

function formatFeeType(type) {
  return { 0: '调解费', 1: '诉讼费', 2: '律师费', 3: '保函费' }[type] || '-'
}

function formatPaymentStatus(status) {
  return { 0: '待审核', 1: '审核通过', 2: '审核未通过' }[status] || '-'
}

function paymentStatusTagType(status) {
  return { 0: 'warning', 1: 'success', 2: 'danger' }[status] || 'info'
}

function formatPaymentAmount(amount) {
  const value = Number(amount)
  return Number.isFinite(value) ? value.toFixed(2) : '0.00'
}

function normalizePaymentScreenshotStorageUrl(value) {
  if (!value) return ''
  try {
    const url = new URL(value, window.location.origin)
    const isLocalAddress = ['localhost', '127.0.0.1', '::1'].includes(url.hostname)
    if (isLocalAddress || url.origin === window.location.origin) {
      const baseApi = String(import.meta.env.VITE_APP_BASE_API || '').replace(/\/$/, '')
      const pathname = baseApi && url.pathname.startsWith(`${baseApi}/`)
        ? url.pathname.slice(baseApi.length)
        : url.pathname
      return `${pathname}${url.search}`
    }
  } catch {
    return value
  }
  return value
}

function syncCustomerFromRoute() {
  Object.assign(form, {
    id: route.query.id || '',
    subjectId: route.query.subjectId === undefined ? undefined : Number(route.query.subjectId),
    subjectName: route.query.subjectName || '',
    subjectTabStatus: route.query.subjectTabStatus === undefined ? 0 : Number(route.query.subjectTabStatus),
    name: route.query.name || '',
    weixin: route.query.wechat || '',
    province: route.query.province || '',
    city: route.query.city || '',
    stage: route.query.stage || '',
    deptStage: route.query.deptStage === undefined ? undefined : Number(route.query.deptStage),
    sourceTime: route.query.sourceTime || '',
    gender: route.query.gender || 'MALE',
    age: Number(route.query.age) || 0,
    tags: parseCustomerTags()
  })

  fullPhone.value = route.query.phone || ''
  phoneVisible.value = false
  phoneLoading.value = false
  editingField.value = ''
  tagPickerVisible.value = false
  syncSelectedTags()
  followRecords.value = []
  operationLogRequestId++
  operationLogLoading.value = false
  operationLogs.value = []
  paymentRecordRequestId++
  paymentRecordLoading.value = false
  paymentRecords.value = []
  void getFollowRecords()
  void getOperationLogs()
  void getPaymentRecords()
}

watch(() => route.fullPath, syncCustomerFromRoute, { immediate: true })

async function getFollowRecords() {
  if (!form.id || followLogLoading.value) return

  const requestId = ++followLogRequestId
  followLogLoading.value = true
  try {
    const res = await followLogList(form.id)
    if (requestId === followLogRequestId && res.code === 200) {
      followRecords.value = Array.isArray(res.data) ? res.data : res.data?.result || []
    }
  } catch {
    if (requestId === followLogRequestId) {
      followRecords.value = []
    }
  } finally {
    if (requestId === followLogRequestId) {
      followLogLoading.value = false
    }
  }
}

async function handleSaveFollowLog() {
  if (!form.id) {
    ElMessage.warning('线索ID不能为空')
    return
  }
  if (!followRemark.value.trim()) {
    ElMessage.warning('请输入跟进内容')
    return
  }
  if (form.deptStage === undefined || form.deptStage === null || Number.isNaN(form.deptStage)) {
    ElMessage.warning('跟进阶段不能为空')
    return
  }

  followSaveLoading.value = true
  try {
    const res = await addFollowLog({
      clueId: form.id,
      remark: followRemark.value.trim(),
      stage: form.deptStage
    })
    if (res.code === 200) {
      ElMessage.success('跟进记录已保存')
      followRemark.value = ''
      await getFollowRecords()
    }
  } finally {
    followSaveLoading.value = false
  }
}

async function getPhone() {
  if (!form.id) {
    ElMessage.warning('线索ID不能为空')
    return
  }

  phoneLoading.value = true
  try {
    const res = await getTelephone(form.id)
    if (res.code === 200) {
      fullPhone.value = res.data || ''
      phoneVisible.value = true
      ElMessage.success('已获取完整号码')
      await getOperationLogs()
    }
  } finally {
    phoneLoading.value = false
  }
}

async function openTagPicker() {
  await loadTagOptions()
  syncSelectedTags()
  tagPickerVisible.value = true
}

async function loadTagOptions() {
  const res = await listEnabledTagOptions()
  if (res.code === 200) {
    const options = Array.isArray(res.data) ? res.data : res.data?.result || []
    tagOptions.value = options.map((item) => ({
      ...item,
      categoryName: item.categoryName || item.name || '未分类',
      tags: item.tags || []
    }))
    tagColorMap.value = Object.fromEntries(
      tagOptions.value.flatMap((category) =>
        category.tags.map((tag) => [tag.name, tag.color || '#909399'])
      )
    )
    syncSelectedTags()
  }
}

loadTagOptions()

function confirmTags() {
  const selectedTagIds = new Set(selectedTags.value)
  form.tags = tagOptions.value
    .flatMap((category) => category.tags)
    .filter((tag) => selectedTagIds.has(tag.id))
    .map((tag) => ({ id: tag.id, name: tag.name, color: tag.color }))
  tagPickerVisible.value = false
}

function removeTag(tag) {
  form.tags = form.tags.filter((item) => item.id !== tag.id)
  syncSelectedTags()
}

function syncSelectedTags() {
  const selectedIds = new Set(form.tags.map((tag) => tag.id).filter(Boolean))
  selectedTags.value = tagOptions.value
    .flatMap((category) => category.tags)
    .filter((tag) => selectedIds.has(tag.id))
    .map((tag) => tag.id)
}

function parseCustomerTags() {
  try {
    const source = Array.isArray(route.query.customerTags)
      ? route.query.customerTags[0]
      : route.query.customerTags
    const tags = JSON.parse(source || '[]')
    if (Array.isArray(tags)) {
      return tags
        .filter((tag) => tag?.name)
        .map((tag) => ({ id: tag.id, name: tag.name, color: tag.color }))
    }
  } catch {
    // 兼容旧页面跳转参数。
  }

  return route.query.tags
    ? String(route.query.tags).split(',').filter(Boolean).map((name) => ({ name }))
    : []
}

async function handleSave() {
  if (!form.id) {
    ElMessage.warning('线索ID不能为空')
    return
  }

  saveLoading.value = true
  try {
    const res = await updateCustomer({
      clueId: form.id,
      name: form.name,
      weixin: form.weixin,
      age: form.age,
      gender: form.gender,
      stage: form.deptStage,
      tagIds: selectedTags.value
    })
    if (res.code === 200) {
      finishEdit()
      await router.replace({
        path: route.path,
        query: {
          ...route.query,
          name: form.name,
          wechat: form.weixin,
          age: String(form.age),
          gender: form.gender,
          customerTags: JSON.stringify(form.tags)
        }
      })
      ElMessage.success('客户信息已保存')
    }
  } finally {
    saveLoading.value = false
  }
}

function handleBusinessAction(action) {
  if (action === '补录订单') {
    openSupplementOrderDialog()
    return
  }

  ElMessage.info(`${action}功能暂未对接`)
}

function openContractDialog() {
  Object.assign(contractForm, {
    creditorName: '',
    creditorPhone: '',
    creditorIdCard: '',
    creditorAddress: '',
    debtorName: '',
    contractAmount: undefined,
    contractType: ''
  })
  contractFormRef.value?.clearValidate()
  contractDialogVisible.value = true
}

async function handleCreateContract() {
  const valid = await contractFormRef.value?.validate().catch(() => false)
  if (!valid) return

  contractDialogVisible.value = false
  ElMessage.success('合同信息已填写，创建接口待对接')
}

function openPaymentDialog() {
  paymentForm.paymentMethod = undefined
  paymentForm.feeType = undefined
  paymentForm.orderNo = ''
  paymentForm.amount = undefined
  paymentForm.paymentTime = ''
  paymentForm.contract = ''
  paymentFiles.value = []
  paymentSubmitting.value = false
  paymentFormRef.value?.clearValidate()
  paymentDialogVisible.value = true
}

async function getOperationLogs() {
  if (!form.id || operationLogLoading.value) return

  const requestId = ++operationLogRequestId
  operationLogLoading.value = true
  try {
    const res = await operationLogList(form.id)
    if (requestId === operationLogRequestId && res.code === 200) {
      operationLogs.value = Array.isArray(res.data) ? res.data : res.data?.result || []
    }
  } catch {
    if (requestId === operationLogRequestId) {
      operationLogs.value = []
    }
  } finally {
    if (requestId === operationLogRequestId) {
      operationLogLoading.value = false
    }
  }
}

async function getPaymentRecords() {
  if (!form.id || paymentRecordLoading.value) return

  const requestId = ++paymentRecordRequestId
  paymentRecordLoading.value = true
  try {
    const res = await getPaymentOrderList(form.id)
    if (requestId === paymentRecordRequestId && res.code === 200) {
      paymentRecords.value = Array.isArray(res.data) ? res.data : []
    }
  } catch {
    if (requestId === paymentRecordRequestId) {
      paymentRecords.value = []
    }
  } finally {
    if (requestId === paymentRecordRequestId) {
      paymentRecordLoading.value = false
    }
  }
}

function handlePaymentFileChange(uploadFile) {
  const rawFile = uploadFile.raw
  if (!rawFile) return

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(rawFile.type)) {
    paymentFiles.value = []
    ElMessage.warning('只能上传 JPG、PNG、WebP 图片')
    return
  }
  if (rawFile.size / 1024 / 1024 > 2) {
    paymentFiles.value = []
    ElMessage.warning('支付凭证图片不能超过2MB')
  }
}

async function handlePaymentSave() {
  if (!paymentFormRef.value || paymentSubmitting.value) return

  const valid = await paymentFormRef.value.validate().catch(() => false)
  if (!valid) return
  if (!form.id) {
    ElMessage.warning('线索ID不能为空')
    return
  }
  if (form.deptStage === undefined || form.deptStage === null || Number.isNaN(form.deptStage)) {
    ElMessage.warning('线索阶段不能为空')
    return
  }

  paymentSubmitting.value = true
  try {
    let paymentScreenshotUrl = ''
    const rawFile = paymentFiles.value[0]?.raw
    if (rawFile) {
      const uploadForm = new FormData()
      uploadForm.append('file', rawFile)
      uploadForm.append('FileDir', 'payment')
      uploadForm.append('FileNameType', '3')
      uploadForm.append('ClassifyType', 'payment_voucher')
      uploadForm.append('Quality', '80')
      const uploadRes = await upload(uploadForm)
      if (uploadRes.code !== 200 || !uploadRes.data?.url) {
        ElMessage.error(uploadRes.msg || '支付凭证上传失败')
        return
      }
      paymentScreenshotUrl = normalizePaymentScreenshotStorageUrl(uploadRes.data.url)
    }

    const res = await addPaymentOrder({
      paymentMethod: paymentForm.paymentMethod,
      feeType: paymentForm.feeType,
      paymentAmount: paymentForm.amount,
      paymentOrderNo: paymentForm.orderNo,
      contractNo: paymentForm.contract || null,
      paymentScreenshotUrl: paymentScreenshotUrl || null,
      paymentTime: paymentForm.paymentTime,
      clueId: form.id,
      stage: form.deptStage
    })
    if (res.code === 200) {
      paymentDialogVisible.value = false
      ElMessage.success('付款订单提交成功')
      await getPaymentRecords()
    }
  } finally {
    paymentSubmitting.value = false
  }
}

function openSupplementOrderDialog() {
  supplementOrderForm.orderNo = ''
  supplementOrderForm.amount = undefined
  supplementOrderForm.paymentMethod = ''
  supplementOrderFiles.value = []
  supplementOrderDialogVisible.value = true
}

function handleSupplementOrderSave() {
  if (!supplementOrderForm.orderNo.trim()) {
    ElMessage.warning('请输入订单号')
    return
  }
  if (supplementOrderForm.amount === undefined || supplementOrderForm.amount === null) {
    ElMessage.warning('请输入金额')
    return
  }
  if (!supplementOrderForm.paymentMethod) {
    ElMessage.warning('请选择支付方式')
    return
  }

  supplementOrderDialogVisible.value = false
  ElMessage.success('补录订单信息已填写，保存接口待对接')
}
</script>

<style scoped>
.customer-edit-page {
  padding: 0;
}

.page-card {
  max-width: none;
  margin: 0;
}

.main-tabs-card {
  box-sizing: border-box;
  border: 1px solid #dcdfe6 !important;
  border-radius: 0;
}

.main-tabs-card :deep(.el-card__body) {
  padding: 12px 16px 16px;
}

.customer-summary-card {
  margin-bottom: 0;
  border-radius: 0;
}

.customer-summary-card :deep(.el-card__body) {
  padding: 16px 20px;
}

.customer-profile {
  display: flex;
  align-items: center;
  gap: 20px;
}

.customer-subject-name {
  display: flex;
  flex: 0 0 118px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 70px;
  padding: 10px 12px;
  overflow: hidden;
  border: 1px solid #4eaa28;
  border-radius: 12px;
  background: #67c23a;
  box-shadow: 0 4px 10px rgb(82 155 46 / 28%);
  color: #fff;
}

.customer-subject-name.is-abnormal {
  border-color: #73767a;
  background: #73767a;
  box-shadow: 0 4px 10px rgb(96 98 102 / 24%);
}

.subject-name-value {
  display: -webkit-box;
  overflow: hidden;
  text-align: center;
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  word-break: break-all;
}

.customer-profile-main {
  flex: 1;
  min-width: 0;
}

.customer-profile-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 10px;
}

.customer-profile-title-row .header-actions {
  gap: 8px;
}

.customer-profile-title-row .header-actions :deep(.el-button) {
  height: 28px;
  padding: 0 10px;
  font-size: 12px;
}

.customer-name-row,
.profile-inline-editor {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.customer-name {
  color: var(--el-text-color-primary);
  font-size: 18px;
  font-weight: 600;
  line-height: 28px;
}

.name-editor :deep(.el-input) {
  width: 180px;
}

.customer-profile-fields {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px 20px;
}

.profile-field {
  display: flex;
  align-items: center;
  min-width: 0;
  min-height: 24px;
  color: var(--el-text-color-regular);
  font-size: 13px;
  line-height: 20px;
}

.profile-label {
  flex: 0 0 auto;
  color: var(--el-text-color-secondary);
}

.profile-value {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.profile-inline-editor {
  flex: 1;
}

.profile-inline-editor :deep(.el-input),
.profile-inline-editor :deep(.el-input-number) {
  flex: 1;
  min-width: 0;
}

.profile-inline-editor :deep(.el-input-number) {
  width: 108px;
}

.profile-inline-editor :deep(.el-radio) {
  margin-right: 8px;
}

.profile-tags-field {
  grid-column: 1 / -1;
}

.customer-page-tabs :deep(.el-tabs__header) {
  margin-bottom: 12px;
}

.customer-page-tabs :deep(.el-tabs__item) {
  height: 34px;
  font-size: 14px;
  line-height: 34px;
}

.customer-page-tabs :deep(.el-tabs__nav-wrap::after) {
  height: 1px;
}

.business-empty-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 360px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-fill-color-extra-light);
}

.inner-card {
  border-radius: 10px;
}

.follow-info-card {
  margin-top: 16px;
}

.follow-info-content {
  padding: 0;
}

.follow-section-header {
  margin-bottom: 16px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.card-desc {
  margin-top: 6px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.customer-form {
  max-width: none;
}

.form-section + .form-section {
  margin-top: 26px;
  padding-top: 24px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.compact-section-header {
  align-items: center;
  margin-bottom: 12px;
}

.section-title {
  margin-bottom: 4px;
  padding-left: 10px;
  font-size: 15px;
  font-weight: 600;
  line-height: 20px;
  color: var(--el-text-color-primary);
  border-left: 3px solid var(--el-color-primary);
}

.section-desc {
  padding-left: 13px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.compact-info-grid {
  grid-template-columns: repeat(auto-fit, minmax(175px, 1fr));
  gap: 10px;
}

.info-item {
  min-width: 0;
  margin-bottom: 0 !important;
  padding: 14px 16px;
  background: var(--el-fill-color-extra-light);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
}

.compact-info-grid .info-item {
  padding: 8px 12px;
}

.compact-info-grid .tag-info-item {
  grid-column: span 2;
}

.readonly-item {
  background: var(--el-fill-color-blank);
}

.customer-form :deep(.el-form-item) {
  margin-bottom: 20px;
}

.customer-form :deep(.el-form-item__label) {
  padding-bottom: 7px;
  font-weight: 500;
  line-height: 20px;
  color: var(--el-text-color-regular);
}

.compact-customer-form :deep(.el-form-item__label) {
  padding-bottom: 2px;
  font-size: 12px;
  line-height: 18px;
}

.customer-form :deep(.el-input),
.customer-form :deep(.el-input-number) {
  width: 100%;
}

.phone-value {
  display: flex;
  align-items: center;
  min-height: 32px;
  gap: 8px;
  width: 100%;
}

.readonly-value {
  min-height: 32px;
  line-height: 32px;
  color: var(--el-text-color-regular);
}

.compact-info-grid .readonly-value {
  min-height: 28px;
  line-height: 28px;
}

.field-value-row,
.editable-value {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  min-height: 28px;
}

.field-value-row .readonly-value {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.editable-value :deep(.el-input),
.editable-value :deep(.el-input-number) {
  flex: 1;
  min-width: 0;
}

.phone-text {
  flex: 1;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.tag-info-item {
  grid-column: 1 / -1;
}

.tag-editor {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-height: 32px;
}

.empty-tags {
  color: var(--el-text-color-placeholder);
}

.tag-picker {
  display: grid;
  gap: 16px;
  width: 100%;
}

.customer-tag {
  color: #fff;
  border: none;
}

.customer-tag :deep(.el-tag__close) {
  color: #fff;
}

.tag-category-name {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.tag-category-options {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.tag-category-options :deep(.el-checkbox) {
  margin-right: 0;
}

.tag-option :deep(.el-checkbox__label) {
  padding-left: 6px;
}

.tag-option-preview {
  border: none;
}

.header-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: flex-end;
}

.follow-panel-title {
  margin-bottom: 16px;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.log-filter {
  display: grid;
  grid-template-columns: 120px minmax(0, 1fr);
  gap: 10px;
  margin-bottom: 16px;
}

.log-filter :deep(.el-select),
.log-filter :deep(.el-date-editor) {
  width: 100%;
}

.follow-form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.follow-records-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.follow-record-scroll {
  height: 360px;
  padding: 8px 18px 0 0;
  overflow-y: auto;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
}

.follow-record-scroll :deep(.el-timeline) {
  padding-left: 28px;
}

.follow-add-card {
  border-radius: 10px;
}

.follow-add-card :deep(.el-select),
.follow-add-card :deep(.el-date-editor) {
  width: 100%;
}

.follow-record {
  padding: 14px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
}

.follow-record-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.follow-tag {
  border-color: transparent;
  color: #fff;
}

.amount-input,
.amount-input :deep(.el-input-number) {
  width: 100%;
}

.contract-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 16px;
}

.contract-form-section + .contract-form-section {
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.contract-section-title {
  margin: 0 0 14px;
  padding-left: 10px;
  border-left: 3px solid var(--el-color-primary);
  color: var(--el-text-color-primary);
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
}

.contract-address-item {
  grid-column: 1 / -1;
}

.payment-time-picker {
  width: 100% !important;
}

.upload-plus {
  color: var(--el-text-color-secondary);
  font-size: 28px;
  line-height: 1;
}

.is-limit-reached :deep(.el-upload--picture-card) {
  display: none;
}

.upload-tip {
  margin-top: 8px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.follow-user {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.follow-content {
  line-height: 1.7;
  color: var(--el-text-color-regular);
}

.follow-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 10px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.oper-log-card {
  padding: 14px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
}

.oper-log-panel {
  max-width: 900px;
  padding: 24px 20px 8px;
}

.oper-log-panel :deep(.el-timeline) {
  padding-left: 10px;
}

.oper-log-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.oper-log-title {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.oper-log-content {
  line-height: 1.7;
  color: var(--el-text-color-regular);
}

.oper-log-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 10px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.oper-change-box {
  display: grid;
  gap: 6px;
  margin-top: 10px;
  padding: 10px;
  font-size: 12px;
  color: var(--el-text-color-regular);
  background: var(--el-fill-color-extra-light);
  border-radius: 6px;
}

@media (max-width: 767px) {
  .customer-edit-page {
    padding: 0;
  }

  .section-header {
    flex-direction: column;
  }

  .customer-profile,
  .customer-profile-title-row {
    align-items: stretch;
    flex-direction: column;
  }

  .customer-subject-name {
    flex-basis: auto;
    min-height: auto;
  }

  .customer-profile-fields {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px 12px;
  }

  .profile-tags-field {
    grid-column: 1 / -1;
  }

  .contract-form-grid {
    grid-template-columns: 1fr;
  }

  .contract-address-item {
    grid-column: auto;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .compact-info-grid .tag-info-item {
    grid-column: auto;
  }

  .phone-value {
    align-items: flex-start;
    flex-direction: column;
  }

}

@media (min-width: 768px) and (max-width: 1199px) {
  .info-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
