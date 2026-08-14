<template>
  <div class="app-container ocean-auth-page">
    <div class="page-header">
      <div>
        <h2 class="page-title">巨量引擎授权配置</h2>
        <p class="page-description">管理用于获取巨量引擎账户和线索数据的应用授权信息</p>
      </div>
      <el-button type="primary" :icon="Plus" @click="handleAdd">添加</el-button>
    </div>

    <div v-if="authorizationList.length" class="authorization-grid">
      <el-card
        v-for="item in authorizationList"
        :key="item.id"
        shadow="hover"
        class="authorization-card"
      >
        <div class="card-header">
          <div class="application-icon">巨</div>
          <div class="application-info">
            <div class="application-name">{{ item.subjectName || '待授权' }}</div>
            <div class="application-type">巨量引擎开放平台应用</div>
          </div>
          <span :class="['authorization-status', item.authorized ? 'is-authorized' : 'is-unauthorized']">
            {{ item.authorized ? '已授权' : '未授权' }}
          </span>
        </div>

        <div class="card-content">
          <div class="info-row">
            <span class="info-label">App ID</span>
            <span class="info-value">{{ item.appId }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Secret</span>
            <span class="info-value secret-value">{{ maskSecret(item.secret) }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">添加时间</span>
            <span class="info-value">{{ item.createTime }}</span>
          </div>
        </div>

        <div class="card-footer">
          <el-button
            link
            :type="item.authorized ? 'primary' : 'danger'"
            @click="handleAuthorize(item)"
          >
            {{ item.authorized ? '重新授权' : '去授权' }}
          </el-button>
          <div class="card-actions">
            <el-button link type="primary" @click="handleEdit(item)">编辑</el-button>
            <el-button link type="danger" @click="handleDelete(item)">删除</el-button>
          </div>
        </div>
      </el-card>
    </div>

    <el-card v-else shadow="never" class="empty-card">
      <el-empty description="暂无巨量引擎授权配置">
        <el-button type="primary" :icon="Plus" @click="handleAdd">添加授权配置</el-button>
      </el-empty>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="form.id ? '编辑授权配置' : '添加授权配置'"
      width="520px"
      append-to-body
      destroy-on-close
      @closed="resetForm"
    >
      <div class="dialog-tip">
        <el-icon><InfoFilled /></el-icon>
        <span>请填写巨量引擎开放平台创建应用后获得的授权信息。</span>
      </div>

      <el-form ref="authorizationFormRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="App ID" prop="appId">
          <el-input v-model.trim="form.appId" maxlength="100" placeholder="请输入 App ID" />
        </el-form-item>
        <el-form-item label="Secret" prop="secret">
          <el-input
            v-model.trim="form.secret"
            type="password"
            maxlength="200"
            placeholder="请输入 Secret"
            show-password
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="OceanEngineConfig">
import { InfoFilled, Plus } from '@element-plus/icons-vue'

const { proxy } = getCurrentInstance()

const dialogVisible = ref(false)
const saving = ref(false)
const authorizationFormRef = ref()
const authorizationList = ref([
  {
    id: 1,
    subjectName: '重庆示例科技有限公司',
    appId: '179***********428',
    secret: 'ocean-engine-secret-example',
    authorized: true,
    createTime: '2026-08-13 10:30:00'
  },
  {
    id: 2,
    subjectName: '',
    appId: '182***********716',
    secret: 'local-promotion-secret-example',
    authorized: false,
    createTime: '2026-08-12 16:20:00'
  }
])

const form = reactive(createDefaultForm())

const rules = {
  appId: [{ required: true, message: '请输入 App ID', trigger: 'blur' }],
  secret: [{ required: true, message: '请输入 Secret', trigger: 'blur' }]
}

function createDefaultForm() {
  return {
    id: undefined,
    appId: '',
    secret: ''
  }
}

function maskSecret(secret) {
  if (!secret) return '-'
  return `${secret.slice(0, 3)}${'*'.repeat(12)}${secret.slice(-3)}`
}

function handleAdd() {
  resetForm()
  dialogVisible.value = true
}

function handleEdit(item) {
  Object.assign(form, {
    id: item.id,
    appId: item.appId,
    secret: item.secret
  })
  dialogVisible.value = true
}

function handleSave() {
  authorizationFormRef.value.validate((valid) => {
    if (!valid) return

    saving.value = true
    const currentItem = authorizationList.value.find((item) => item.id === form.id)

    if (currentItem) {
      Object.assign(currentItem, {
        appId: form.appId,
        secret: form.secret
      })
    } else {
      authorizationList.value.unshift({
        id: Date.now(),
        subjectName: '',
        appId: form.appId,
        secret: form.secret,
        authorized: false,
        createTime: new Date().toLocaleString('zh-CN', { hour12: false }).replaceAll('/', '-')
      })
    }

    saving.value = false
    dialogVisible.value = false
    proxy.$modal.msgSuccess('保存成功')
  })
}

function handleDelete(item) {
  proxy.$modal.confirm(`确定删除 App ID 为“${item.appId}”的配置吗？`).then(() => {
    authorizationList.value = authorizationList.value.filter((config) => config.id !== item.id)
    proxy.$modal.msgSuccess('删除成功')
  })
}

function handleAuthorize(item) {
  proxy.$modal.msg(`即将为 App ID ${item.appId} 发起${item.authorized ? '重新' : ''}授权`)
}

function resetForm() {
  Object.assign(form, createDefaultForm())
  authorizationFormRef.value?.clearValidate()
}
</script>

<style scoped>
.ocean-auth-page {
  min-height: calc(100vh - 84px);
  background: #f5f7fa;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 20px;
}

.page-title {
  margin: 0;
  color: #303133;
  font-size: 22px;
  font-weight: 600;
  line-height: 32px;
}

.page-description {
  margin: 5px 0 0;
  color: #909399;
  font-size: 14px;
}

.authorization-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.authorization-card {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
}

.authorization-card :deep(.el-card__body) {
  padding: 0;
}

.card-header {
  display: flex;
  align-items: center;
  padding: 20px 22px;
  border-bottom: 1px solid #ebeef5;
}

.application-icon {
  display: flex;
  flex: 0 0 44px;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  margin-right: 12px;
  border-radius: 10px;
  background: linear-gradient(135deg, #2667ff, #38a5ff);
  color: #fff;
  font-size: 21px;
  font-weight: 600;
}

.application-info {
  min-width: 0;
  flex: 1;
}

.application-name {
  overflow: hidden;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.application-type {
  margin-top: 5px;
  color: #909399;
  font-size: 13px;
}

.authorization-status {
  flex: 0 0 auto;
  font-size: 14px;
  font-weight: 500;
}

.authorization-status.is-authorized {
  color: #67c23a;
}

.authorization-status.is-unauthorized {
  color: #f56c6c;
}

.card-content {
  padding: 18px 22px;
}

.info-row {
  display: flex;
  align-items: center;
  min-height: 34px;
  font-size: 14px;
}

.info-label {
  flex: 0 0 78px;
  color: #909399;
}

.info-value {
  min-width: 0;
  overflow: hidden;
  color: #606266;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.secret-value {
  letter-spacing: 1px;
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 13px 22px;
  border-top: 1px solid #ebeef5;
  background: #fafafa;
}

.card-actions {
  display: flex;
  align-items: center;
}

.empty-card {
  min-height: 420px;
  border-radius: 8px;
}

.empty-card :deep(.el-card__body) {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 420px;
}

.dialog-tip {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 22px;
  padding: 11px 14px;
  border-radius: 4px;
  background: #ecf5ff;
  color: #409eff;
  font-size: 13px;
  line-height: 20px;
}

@media (max-width: 900px) {
  .authorization-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 576px) {
  .page-header {
    align-items: stretch;
    flex-direction: column;
    gap: 14px;
  }
}
</style>
