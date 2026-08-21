<template>
  <div class="app-container customer-edit-page">
    <el-card class="page-card main-tabs-card" shadow="never">
      <el-tabs v-model="pageTab" class="customer-page-tabs">
        <el-tab-pane label="基本信息" name="base">
          <el-card class="inner-card customer-info-card" shadow="never">
            <el-form :model="form" label-position="top" class="customer-form">
              <section class="form-section">
                <div class="section-header">
                  <div>
                    <div class="section-title">客户信息</div>
                    <div class="section-desc">维护客户基础资料、手机号和标签信息</div>
                  </div>
                  <div class="header-actions">
                    <el-button type="success" @click="openPaymentDialog">收款</el-button>
                    <el-button type="primary" plain @click="handleBusinessAction('合同')">合同</el-button>
                    <el-button type="warning" plain @click="handleBusinessAction('补录订单')">补录订单</el-button>
                    <el-button type="primary" :loading="saveLoading" @click="handleSave">保存客户信息</el-button>
                  </div>
                </div>

                <div class="info-grid">
                  <el-form-item label="姓名" prop="name" class="info-item">
                    <el-input v-model="form.name" placeholder="请输入姓名" />
                  </el-form-item>

                  <el-form-item label="手机号" class="info-item">
                    <div class="phone-value">
                      <span class="readonly-value phone-text">{{ displayPhone }}</span>
                      <el-button link type="primary" :loading="phoneLoading" @click="getPhone">获取完整号码</el-button>
                    </div>
                  </el-form-item>

                  <el-form-item label="性别" class="info-item">
                    <el-radio-group v-model="form.gender">
                      <el-radio value="MALE">男</el-radio>
                      <el-radio value="FEMALE">女</el-radio>
                    </el-radio-group>
                  </el-form-item>

                  <el-form-item label="年龄" class="info-item">
                    <el-input-number v-model="form.age" :min="0" :max="120" controls-position="right" />
                  </el-form-item>

                  <el-form-item label="所属省份" class="info-item readonly-item">
                    <span class="readonly-value">{{ form.province || '-' }}</span>
                  </el-form-item>

                  <el-form-item label="所属城市" class="info-item readonly-item">
                    <span class="readonly-value">{{ form.city || '-' }}</span>
                  </el-form-item>

                  <el-form-item label="阶段" class="info-item readonly-item">
                    <span class="readonly-value">{{ form.stage || '-' }}</span>
                  </el-form-item>

                  <el-form-item label="来源时间" class="info-item readonly-item">
                    <span class="readonly-value">{{ form.sourceTime || '-' }}</span>
                  </el-form-item>

                  <el-form-item label="客户标签" class="info-item tag-info-item">
                    <div class="tag-editor">
                      <el-tag
                        v-for="tag in form.tags"
                        :key="tag.id || tag.name"
                        :color="tag.color || tagColorMap[tag.name] || '#909399'"
                        effect="dark"
                        closable
                        class="customer-tag"
                        @close="removeTag(tag)">
                        {{ tag.name }}
                      </el-tag>
                      <span v-if="form.tags.length === 0" class="empty-tags">暂无标签</span>
                      <el-button plain size="small" @click="openTagPicker">新增标签</el-button>
                    </div>
                  </el-form-item>
                </div>

              </section>

            </el-form>
          </el-card>

          <el-card class="inner-card follow-info-card" shadow="never">
            <div class="section-header follow-section-header">
              <div>
                <div class="section-title">跟进记录</div>
                <div class="section-desc">查看历史跟进内容并新增本次跟进记录。</div>
              </div>
            </div>
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
                <div class="follow-panel-title">新增跟进记录</div>
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
          </el-card>

        </el-tab-pane>

        <el-tab-pane label="操作日志" name="log">
          <div class="log-filter">
            <el-select v-model="logQuery.type" size="small" placeholder="操作类型">
              <el-option label="全部" value="" />
              <el-option label="分配" value="分配" />
              <el-option label="信息变更" value="信息变更" />
              <el-option label="获取号码" value="获取号码" />
              <el-option label="跟进" value="跟进" />
            </el-select>
            <el-date-picker
              v-model="logQuery.dateRange"
              size="small"
              type="daterange"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
              value-format="YYYY-MM-DD"
            />
          </div>
          <el-timeline>
            <el-timeline-item
              v-for="item in operLogs"
              :key="item.id"
              :timestamp="item.time"
              placement="top"
              :type="item.type"
            >
              <div class="oper-log-card">
                <div class="oper-log-header">
                  <el-tag size="small" :type="item.tagType">{{ item.operType }}</el-tag>
                  <span class="oper-log-title">{{ item.title }}</span>
                </div>
                <div class="oper-log-content">{{ item.content }}</div>
                <div class="oper-log-meta">
                  <span>操作人：{{ item.userName }}</span>
                  <span v-if="item.targetUser">目标用户：{{ item.targetUser }}</span>
                </div>
                <div v-if="item.beforeValue || item.afterValue" class="oper-change-box">
                  <div>变更前：{{ item.beforeValue || '-' }}</div>
                  <div>变更后：{{ item.afterValue || '-' }}</div>
                </div>
              </div>
            </el-timeline-item>
          </el-timeline>
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
              <el-tag :color="tag.color || '#409eff'" effect="dark" class="tag-option-preview">
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

    <el-dialog v-model="paymentDialogVisible" title="收款" width="420px" append-to-body>
      <el-tabs v-model="paymentTab" stretch>
        <el-tab-pane label="收款码" name="qrcode">
          <div class="payment-qrcode-panel">
            <img :src="paymentQrCode" alt="收款二维码" class="payment-qrcode" />
            <p>请使用微信扫码完成付款</p>
          </div>
        </el-tab-pane>
        <el-tab-pane label="企微收款" name="wecom">
          <el-form label-position="top">
            <el-form-item label="付款单号">
              <el-input v-model="paymentOrderNo" placeholder="请输入付款单号" clearable />
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
      <template #footer>
        <el-button @click="paymentDialogVisible = false">关闭</el-button>
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
import { ElMessage } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'
import { addFollowLog, followLogList, getTelephone, updateCustomer } from '@/api/public/lead'
import { listEnabledTagOptions } from '@/api/system/tagCategory'
import paymentQrCode from '@/assets/images/qrcode.jpg'

const route = useRoute()
const router = useRouter()
const form = reactive({
  id: '',
  name: '',
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
const followLogLoading = ref(false)
const followSaveLoading = ref(false)
let followLogRequestId = 0
const tagPickerVisible = ref(false)
const paymentDialogVisible = ref(false)
const paymentTab = ref('qrcode')
const paymentOrderNo = ref('')
const supplementOrderDialogVisible = ref(false)
const supplementOrderFiles = ref([])
const supplementOrderForm = reactive({
  orderNo: '',
  amount: undefined,
  paymentMethod: ''
})
const selectedTags = ref([])
const pageTab = ref('base')
const logQuery = reactive({
  type: '',
  dateRange: []
})
const tagOptions = ref([])
const tagColorMap = ref({})
const followRecords = ref([])
const followRemark = ref('')
const operLogs = ref([
  {
    id: 1,
    time: '2026-08-10 15:30',
    operType: '分配',
    title: '手动分配线索',
    content: '张三将该线索手动分配给李四。',
    userName: '张三',
    targetUser: '李四',
    beforeValue: '',
    afterValue: '',
    type: 'primary',
    tagType: 'primary'
  },
  {
    id: 2,
    time: '2026-08-10 15:36',
    operType: '获取号码',
    title: '查看完整手机号',
    content: '李四查看了客户完整手机号，本次为第 1 次查看。',
    userName: '李四',
    targetUser: '',
    beforeValue: '',
    afterValue: '',
    type: 'warning',
    tagType: 'warning'
  },
  {
    id: 3,
    time: '2026-08-10 16:20',
    operType: '信息变更',
    title: '修改客户标签',
    content: '李四更新了客户标签信息。',
    userName: '李四',
    targetUser: '',
    beforeValue: '待跟进',
    afterValue: '高意向',
    type: 'success',
    tagType: 'success'
  }
])
const displayPhone = computed(() => {
  if (phoneVisible.value || fullPhone.value.length < 7) return fullPhone.value || '-'
  return `${fullPhone.value.slice(0, 3)}****${fullPhone.value.slice(-4)}`
})

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

function syncCustomerFromRoute() {
  Object.assign(form, {
    id: route.query.id || '',
    name: route.query.name || '',
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
  tagPickerVisible.value = false
  syncSelectedTags()
  followRecords.value = []
  void getFollowRecords()
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
      age: form.age,
      gender: form.gender,
      stage: form.deptStage,
      tagIds: selectedTags.value
    })
    if (res.code === 200) {
      await router.replace({
        path: route.path,
        query: {
          ...route.query,
          name: form.name,
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

function openPaymentDialog() {
  paymentTab.value = 'qrcode'
  paymentOrderNo.value = ''
  paymentDialogVisible.value = true
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
  padding: 16px;
}

.page-card {
  max-width: 1120px;
  margin: 0 auto;
}

.main-tabs-card {
  border-radius: 10px;
}

.customer-page-tabs :deep(.el-tabs__header) {
  margin-bottom: 18px;
}

.customer-page-tabs :deep(.el-tabs__item) {
  height: 42px;
  font-size: 15px;
}

.inner-card {
  border-radius: 10px;
}

.follow-info-card {
  margin-top: 16px;
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

.info-item {
  min-width: 0;
  margin-bottom: 0 !important;
  padding: 14px 16px;
  background: var(--el-fill-color-extra-light);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
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
  padding: 18px 18px 0 0;
  overflow-y: auto;
  background: var(--el-fill-color-extra-light);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
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

.payment-qrcode-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 0 4px;
  color: var(--el-text-color-secondary);
}

.payment-qrcode {
  width: 220px;
  height: 220px;
  padding: 8px;
  object-fit: contain;
  background: #fff;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
}

.amount-input,
.amount-input :deep(.el-input-number) {
  width: 100%;
}

.upload-plus {
  color: var(--el-text-color-secondary);
  font-size: 28px;
  line-height: 1;
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

  .info-grid {
    grid-template-columns: 1fr;
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
