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
                    <el-button type="success" @click="handleBusinessAction('收款')">收款</el-button>
                    <el-button type="primary" plain @click="handleBusinessAction('合同')">合同</el-button>
                    <el-button type="warning" plain @click="handleBusinessAction('补录订单')">补录订单</el-button>
                    <el-button type="primary" @click="handleSave">保存客户信息</el-button>
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
                      <el-radio value="男">男</el-radio>
                      <el-radio value="女">女</el-radio>
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
                      <el-tag v-for="tag in form.tags" :key="tag" closable @close="removeTag(tag)">
                        {{ tag }}
                      </el-tag>
                      <span v-if="form.tags.length === 0" class="empty-tags">暂无标签</span>
                      <el-button plain size="small" @click="openTagPicker">新增标签</el-button>
                    </div>
                  </el-form-item>
                </div>

              </section>

            </el-form>
          </el-card>

        </el-tab-pane>

        <el-tab-pane label="跟进记录" name="records">
          <div class="follow-records-page">
            <div class="section-header">
              <div>
                <div class="section-title">跟进记录</div>
                <div class="section-desc">查看客户历史沟通记录，列表固定高度滚动展示</div>
              </div>
            </div>

            <div class="follow-record-scroll">
              <el-timeline>
                <el-timeline-item
                  v-for="item in followRecords"
                  :key="item.id"
                  :timestamp="item.time"
                  placement="top"
                  :type="item.type"
                >
                  <div class="follow-record">
                    <div class="follow-record-header">
                      <span class="follow-user">{{ item.userName }}</span>
                      <el-tag size="small" :type="item.tagType">{{ item.method }}</el-tag>
                      <el-tag size="small" effect="plain">{{ item.result }}</el-tag>
                    </div>
                    <div class="follow-content">{{ item.content }}</div>
                    <div class="follow-meta">
                      <span>下次跟进：{{ item.nextTime }}</span>
                      <span>阶段变更：{{ item.stageChange }}</span>
                    </div>
                  </div>
                </el-timeline-item>
              </el-timeline>
            </div>

            <el-card class="follow-add-card" shadow="never">
              <div class="follow-panel-title">新增跟进记录</div>
              <el-form label-position="top">
                <el-row :gutter="14">
                  <el-col :span="12">
                    <el-form-item label="跟进方式">
                      <el-select model-value="电话" placeholder="请选择跟进方式">
                        <el-option label="电话" value="电话" />
                        <el-option label="微信" value="微信" />
                        <el-option label="到店" value="到店" />
                        <el-option label="短信" value="短信" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="跟进结果">
                      <el-select model-value="有意向" placeholder="请选择跟进结果">
                        <el-option label="已接通" value="已接通" />
                        <el-option label="未接通" value="未接通" />
                        <el-option label="有意向" value="有意向" />
                        <el-option label="待考虑" value="待考虑" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-form-item label="跟进内容">
                  <el-input
                    type="textarea"
                    :rows="4"
                    model-value="客户咨询课程价格和上课时间，预算明确，约定明天下午再次沟通。"
                    placeholder="请输入本次跟进内容"
                  />
                </el-form-item>
                <el-row :gutter="14">
                  <el-col :span="12">
                    <el-form-item label="下次跟进时间">
                      <el-date-picker
                        model-value="2026-08-11 14:00:00"
                        type="datetime"
                        placeholder="请选择下次跟进时间"
                        value-format="YYYY-MM-DD HH:mm:ss"
                      />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="客户阶段">
                      <el-select model-value="一销跟进中" placeholder="请选择客户阶段">
                        <el-option label="一销跟进中" value="一销跟进中" />
                        <el-option label="二销待分配" value="二销待分配" />
                        <el-option label="已成交" value="已成交" />
                        <el-option label="无效线索" value="无效线索" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                </el-row>
                <div class="follow-form-actions">
                  <el-button>重置</el-button>
                  <el-button type="primary">保存跟进</el-button>
                </div>
              </el-form>
            </el-card>
          </div>
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
      <el-checkbox-group v-model="selectedTags" class="tag-picker">
        <el-checkbox v-for="tag in tagOptions" :key="tag" :value="tag" border>
          {{ tag }}
        </el-checkbox>
      </el-checkbox-group>
      <template #footer>
        <el-button @click="tagPickerVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmTags">确认添加</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="CustomerManagementEdit">
import { ElMessage } from 'element-plus'
import { useRoute } from 'vue-router'
import { getTelephone } from '@/api/public/lead'

const route = useRoute()
const form = reactive({
  id: '',
  name: '',
  province: '',
  city: '',
  stage: '',
  sourceTime: '',
  gender: '男',
  age: 0,
  tags: []
})

const fullPhone = ref('')
const phoneVisible = ref(false)
const phoneLoading = ref(false)
const tagPickerVisible = ref(false)
const selectedTags = ref([])
const pageTab = ref('base')
const logQuery = reactive({
  type: '',
  dateRange: []
})
const tagOptions = ['高意向', '待跟进', '已联系', '重点客户', '到店客户', '老客户', '活动来源', '转介绍']
const followRecords = ref([
  {
    id: 1,
    time: '2026-08-10 15:30',
    userName: '张三',
    method: '电话跟进',
    result: '有意向',
    content: '客户咨询课程价格，预算在 8000 左右，重点关注上课时间和老师资质。',
    nextTime: '2026-08-11 14:00',
    stageChange: '一销跟进中 -> 二销待分配',
    type: 'primary',
    tagType: 'primary'
  },
  {
    id: 2,
    time: '2026-08-09 10:12',
    userName: '李四',
    method: '微信沟通',
    result: '待考虑',
    content: '已发送课程资料和校区位置，客户表示需要和家人商量后再确认。',
    nextTime: '2026-08-10 16:00',
    stageChange: '新线索 -> 一销跟进中',
    type: 'success',
    tagType: 'success'
  }
])
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

function syncCustomerFromRoute() {
  Object.assign(form, {
    id: route.query.id || '',
    name: route.query.name || '',
    province: route.query.province || '',
    city: route.query.city || '',
    stage: route.query.stage || '',
    sourceTime: route.query.sourceTime || '',
    gender: route.query.gender || '男',
    age: Number(route.query.age) || 0,
    tags: route.query.tags ? String(route.query.tags).split(',').filter(Boolean) : []
  })

  fullPhone.value = route.query.phone || ''
  phoneVisible.value = false
  phoneLoading.value = false
  tagPickerVisible.value = false
  selectedTags.value = []
}

watch(() => route.fullPath, syncCustomerFromRoute, { immediate: true })

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

function openTagPicker() {
  selectedTags.value = [...form.tags]
  tagPickerVisible.value = true
}

function confirmTags() {
  form.tags = [...selectedTags.value]
  tagPickerVisible.value = false
}

function removeTag(tag) {
  form.tags = form.tags.filter((item) => item !== tag)
}

function handleSave() {
  ElMessage.success('基础资料已保存（演示操作）')
}

function handleBusinessAction(action) {
  ElMessage.info(`${action}功能暂未对接`)
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
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.tag-picker :deep(.el-checkbox) {
  margin-right: 0;
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
