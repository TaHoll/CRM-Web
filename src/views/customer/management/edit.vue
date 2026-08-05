<template>
  <div class="app-container customer-edit-page">
    <el-card class="page-card" shadow="never"> 

      <el-form :model="form" label-position="top" class="customer-form">
        <section class="form-section">
          <div class="section-title">客户信息</div>
          <el-row :gutter="24">
            <el-col :xs="24" :sm="12">
              <el-form-item label="姓名" prop="name">
                <el-input v-model="form.name" placeholder="请输入姓名" />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12">
              <el-form-item label="手机号">
                <div class="phone-value">
                  <span class="readonly-value">{{ displayPhone }}</span>
                  <el-button link type="primary" @click="getPhone">获取完整号码</el-button>
                </div>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12">
              <el-form-item label="性别">
                <el-radio-group v-model="form.gender">
                  <el-radio value="男">男</el-radio>
                  <el-radio value="女">女</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12">
              <el-form-item label="年龄">
                <el-input-number v-model="form.age" :min="0" :max="120" controls-position="right" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="24">
            <el-col :xs="24" :sm="12" :lg="8">
              <el-form-item label="所属省份">
                <span class="readonly-value">{{ form.province || '-' }}</span>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :lg="8">
              <el-form-item label="所属城市">
                <span class="readonly-value">{{ form.city || '-' }}</span>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :lg="8">
              <el-form-item label="阶段">
                <span class="readonly-value">{{ form.stage || '-' }}</span>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :lg="8">
              <el-form-item label="来源时间">
                <span class="readonly-value">{{ form.sourceTime || '-' }}</span>
              </el-form-item>
            </el-col>
          </el-row>
          <div class="section-action">
            <el-button type="primary" @click="handleSave">保存客户信息</el-button>
          </div>
        </section>

        <section class="form-section tags-section">
          <div class="section-title">客户标签</div>
          <el-form-item label="标签">
            <div class="tag-editor">
              <el-tag v-for="tag in form.tags" :key="tag" closable @close="removeTag(tag)">
                {{ tag }}
              </el-tag>
              <el-button plain @click="openTagPicker">新增标签</el-button>
            </div>
          </el-form-item>
        </section>

        <div class="bottom-actions">
          <el-button type="success" @click="handleBusinessAction('收款')">收款</el-button>
          <el-button type="primary" plain @click="handleBusinessAction('合同')">合同</el-button>
          <el-button type="warning" plain @click="handleBusinessAction('补录订单')">补录订单</el-button>
        </div>
      </el-form>
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

const route = useRoute()
const form = reactive({
  id: route.query.id || '',
  name: route.query.name || '',
  province: route.query.province || '',
  city: route.query.city || '',
  stage: route.query.stage || '',
  sourceTime: route.query.sourceTime || '',
  gender: route.query.gender || '男',
  age: Number(route.query.age) || 0,
  tags: route.query.tags ? route.query.tags.split(',').filter(Boolean) : []
})

const fullPhone = ref(route.query.phone || '')
const phoneVisible = ref(false)
const tagPickerVisible = ref(false)
const selectedTags = ref([])
const tagOptions = ['高意向', '待跟进', '已联系', '重点客户', '到店客户', '老客户', '活动来源', '转介绍']
const displayPhone = computed(() => {
  if (phoneVisible.value || fullPhone.value.length < 7) return fullPhone.value || '-'
  return `${fullPhone.value.slice(0, 3)}****${fullPhone.value.slice(-4)}`
})

function getPhone() {
  phoneVisible.value = true
  ElMessage.success('已展示完整手机号（演示数据）')
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
  max-width: 960px;
}

.form-section + .form-section {
  margin-top: 26px;
  padding-top: 24px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.section-title {
  margin-bottom: 18px;
  padding-left: 10px;
  font-size: 15px;
  font-weight: 600;
  line-height: 20px;
  color: var(--el-text-color-primary);
  border-left: 3px solid var(--el-color-primary);
}

.section-action {
  display: flex;
  justify-content: flex-end;
  margin-top: 4px;
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
}

.readonly-value {
  min-height: 32px;
  line-height: 32px;
  color: var(--el-text-color-regular);
}

.tags-section :deep(.el-form-item) {
  margin-bottom: 0;
}

.tag-editor {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.tag-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.tag-picker :deep(.el-checkbox) {
  margin-right: 0;
}

.bottom-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid var(--el-border-color-lighter);
}

@media (max-width: 767px) {
  .customer-edit-page {
    padding: 0;
  }

  .card-header {
    align-items: flex-start;
  }

}
</style>
