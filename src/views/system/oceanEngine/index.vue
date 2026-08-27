<template>
  <div v-loading="loading" class="app-container subject-page">
    <div class="page-toolbar">
      <el-button class="add-subject-button" type="primary" :icon="Plus" @click="handleAdd">添加主体</el-button>
    </div>

    <div v-if="subjectList.length" class="subject-grid">
      <el-card
        v-for="item in subjectList"
        :key="item.id"
        shadow="never"
        :class="['subject-card', { 'is-disabled': item.status !== 1 }]"
      >
        <div class="card-header">
          <div class="subject-name">{{ item.subjectName || '待授权主体' }}</div>
          <div class="subject-actions">
            <el-switch
              class="subject-switch"
              :model-value="item.status === 1"
              inline-prompt
              active-text="启用"
              inactive-text="未启用"
              :width="64"
              :loading="statusChangingSubjectId === item.id"
              @change="handleToggleSubject(item, $event)"
            />
          </div>
        </div>

        <div class="platform-list">
          <div class="platform-row">
            <div class="platform-content">
              <div class="platform-heading">
                <span class="platform-name">巨量引擎</span>
                <span :class="['platform-status', oceanStatusClass(item.oceanAuthStatus)]">
                  {{ oceanStatusText(item.oceanAuthStatus) }}
                </span>
              </div>
              <span v-if="item.oceanAuthStatus === 1 && item.enabledAccountCount > 0" class="account-summary">
                已启用 {{ item.enabledAccountCount }}/{{ item.accountCount }} 个账号
              </span>
              <span v-else-if="item.oceanAuthStatus === 1 && item.accountCount > 0" class="account-summary no-account-warning">
                已启用 0/{{ item.accountCount }} 个账号
              </span>
              <span v-else-if="item.oceanAuthStatus === 1" class="account-summary no-account-warning">
                暂未同步账号
              </span>
            </div>
            <div class="platform-actions">
              <el-button v-if="item.oceanAuthStatus !== 1" link type="primary" @click="handleAuthorize(item)">
                {{ item.oceanAuthStatus === 2 ? '重新授权' : '去授权' }}
              </el-button>
              <el-tooltip content="编辑巨量引擎配置" placement="top">
                <el-button class="platform-edit-button" :icon="Edit" circle text @click="handlePlatformEdit(item, 'oceanEngine')" />
              </el-tooltip>
            </div>
          </div>

          <div :class="['platform-row', { 'is-locked': item.oceanAuthStatus !== 1 }]">
            <div class="platform-content">
              <div class="platform-heading">
                <span class="platform-name">抖音开放平台</span>
                <span :class="['platform-status', item.oceanAuthStatus !== 1 ? 'is-locked' : item.douyinAuthorized ? 'is-authorized' : 'is-pending']">
                  {{ item.oceanAuthStatus !== 1 ? '待解锁' : item.douyinAuthorized ? '已授权' : '未授权' }}
                </span>
              </div>
              <span v-if="item.oceanAuthStatus !== 1" class="platform-tip">完成巨量授权后可配置</span>
            </div>
            <el-tooltip :content="item.oceanAuthStatus === 1 ? '编辑抖音开放平台配置' : '请先完成巨量引擎授权'" placement="top">
              <span>
                <el-button class="platform-edit-button" :icon="item.oceanAuthStatus === 1 ? Edit : Lock" circle text :disabled="item.oceanAuthStatus !== 1" @click="handlePlatformEdit(item, 'douyin')" />
              </span>
            </el-tooltip>
          </div>

          <div :class="['platform-row', { 'is-locked': item.oceanAuthStatus !== 1 }]">
            <div class="platform-content">
              <div class="platform-heading">
                <span class="platform-name">企业微信</span>
                <span :class="['platform-status', item.oceanAuthStatus !== 1 ? 'is-locked' : item.weComAuthorized ? 'is-authorized' : 'is-pending']">
                  {{ item.oceanAuthStatus !== 1 ? '待解锁' : item.weComAuthorized ? '已授权' : '未授权' }}
                </span>
              </div>
              <span v-if="item.oceanAuthStatus !== 1" class="platform-tip">完成巨量授权后可配置</span>
            </div>
            <el-tooltip :content="item.oceanAuthStatus === 1 ? '编辑企业微信配置' : '请先完成巨量引擎授权'" placement="top">
              <span>
                <el-button class="platform-edit-button" :icon="item.oceanAuthStatus === 1 ? Edit : Lock" circle text :disabled="item.oceanAuthStatus !== 1" @click="handlePlatformEdit(item, 'weCom')" />
              </span>
            </el-tooltip>
          </div>
        </div>
      </el-card>
    </div>

    <el-card v-else shadow="never" class="empty-card">
      <el-empty description="暂无主体">
        <el-button type="primary" :icon="Plus" @click="handleAdd">添加主体</el-button>
      </el-empty>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" :width="dialogWidth" append-to-body destroy-on-close @closed="resetForm">
      <div v-if="dialogMode === 'create'" class="dialog-tip">
        <el-icon><InfoFilled /></el-icon>
        <span>创建主体后需要完成巨量引擎授权，授权成功后系统会自动获取主体名称和账户列表。</span>
      </div>

      <el-form ref="configFormRef" :model="form" :rules="rules" label-position="top">
        <template v-if="activePlatform === 'oceanEngine'">
          <div v-if="dialogMode === 'edit'" :class="['authorization-panel', oceanStatusClass(currentSubject?.oceanAuthStatus)]">
            <div>
              <div class="authorization-title-row">
                <div class="authorization-title">巨量引擎授权</div>
                <span :class="['platform-status', oceanStatusClass(currentSubject?.oceanAuthStatus)]">
                  {{ oceanStatusText(currentSubject?.oceanAuthStatus) }}
                </span>
              </div>
              <div class="authorization-description">{{ oceanAuthorizationDescription }}</div>
            </div>
            <el-button v-if="currentSubject?.oceanAuthStatus !== 1" type="primary" plain @click="handleAuthorize(currentSubject)">
              {{ currentSubject?.oceanAuthStatus === 2 ? '重新授权' : '去授权' }}
            </el-button>
          </div>

          <div v-if="dialogMode === 'create'" class="form-section">
            <div class="section-title">应用凭证</div>
            <div class="form-grid">
              <el-form-item label="APP_ID" prop="appId">
                <el-input v-model.trim="form.appId" maxlength="100" placeholder="请输入巨量引擎 APP_ID" />
              </el-form-item>
              <el-form-item label="Secret" prop="secret">
                <el-input v-model.trim="form.secret" type="password" maxlength="200" placeholder="请输入巨量引擎 Secret" show-password />
              </el-form-item>
            </div>
          </div>

          <div v-if="dialogMode === 'edit'" class="ocean-config-layout">
            <div class="form-section credential-section">
              <div class="section-title">应用凭证</div>
              <el-form-item label="APP_ID">
                <el-input v-model="form.appId" readonly />
              </el-form-item>
              <el-form-item label="Secret">
                <el-input v-model="form.secret" type="password" readonly show-password />
              </el-form-item>
            </div>

            <div v-loading="accountLoading" class="form-section account-section">
              <div class="section-heading">
                <div>
                  <div class="section-title-row">
                    <div class="section-title">巨量本地推账号配置</div>
                    <el-button
                      v-if="currentSubject?.oceanAuthStatus === 1"
                      type="primary"
                      link
                      :icon="Refresh"
                      :loading="syncingAccounts"
                      @click="handleSyncAccounts"
                    >
                      同步账户
                    </el-button>
                  </div>
                  <div class="section-description">启用允许系统获取线索和执行回传的本地推账号。</div>
                </div>
                <span v-if="currentSubject?.oceanAuthStatus === 1" class="selected-count">
                  已启用 {{ form.enabledAccountIds.length }} 个
                </span>
              </div>

              <el-table
                v-if="currentSubject?.oceanAuthStatus === 1 && currentSubject.accounts.length"
                :data="currentSubject.accounts"
                border
                max-height="360"
                class="account-table"
              >
                <el-table-column prop="accountId" label="账号 ID" min-width="150" />
                <el-table-column prop="accountName" label="账号名称" min-width="190" show-overflow-tooltip />
                <el-table-column label="启用" width="80" align="center">
                  <template #default="scope">
                    <el-checkbox
                      :model-value="form.enabledAccountIds.includes(scope.row.accountId)"
                      @change="handleAccountEnabledChange(scope.row.accountId, $event)"
                    />
                  </template>
                </el-table-column>
              </el-table>
              <el-empty
                v-else
                :image-size="70"
                :description="currentSubject?.oceanAuthStatus === 1 ? '暂未同步到本地推账号' : '完成巨量引擎授权后可配置本地推账号'"
              />
            </div>
          </div>
        </template>

        <template v-else-if="activePlatform === 'douyin'">
          <div class="dialog-tip">
            <el-icon><InfoFilled /></el-icon>
            <span>抖音开放平台配置将归属于当前已授权的巨量主体。</span>
          </div>
          <div class="form-section">
            <div class="section-title">抖音开放平台凭证</div>
            <div class="form-grid">
              <el-form-item label="APP_ID" prop="douyinAppId">
                <el-input v-model.trim="form.douyinAppId" placeholder="请输入抖音开放平台 APP_ID" />
              </el-form-item>
              <el-form-item label="AppSecret" prop="douyinSecret">
                <el-input v-model.trim="form.douyinSecret" type="password" show-password placeholder="请输入 AppSecret" />
              </el-form-item>
            </div>
          </div>
        </template>

        <template v-else>
          <div class="dialog-tip">
            <el-icon><InfoFilled /></el-icon>
            <span>企业微信配置将归属于当前已授权的巨量主体。</span>
          </div>
          <div class="form-section">
            <div class="section-title">企业微信凭证</div>
            <div class="form-grid">
              <el-form-item label="CorpId" prop="weComCorpId">
                <el-input v-model.trim="form.weComCorpId" placeholder="请输入企业微信 CorpId" />
              </el-form-item>
              <el-form-item label="Secret" prop="weComSecret">
                <el-input v-model.trim="form.weComSecret" type="password" show-password placeholder="请输入企业微信 Secret" />
              </el-form-item>
            </div>
          </div>
        </template>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button
          v-if="dialogMode === 'create' || activePlatform !== 'oceanEngine' || currentSubject?.oceanAuthStatus === 1"
          type="primary"
          :loading="saving"
          @click="handleSave"
        >
          {{ dialogMode === 'create' ? '创建主体' : '保存配置' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="OceanEngineConfig">
import { Edit, InfoFilled, Lock, Plus, Refresh } from '@element-plus/icons-vue'
import {
  changeOceanEngineSubjectStatus,
  createOceanEngineSubject,
  listOceanEngineSubjectAccounts,
  listOceanEngineSubjects,
  saveOceanEngineAccountConfig,
  syncOceanEngineAdvertiserList
} from '@/api/system/oceanEngineSubject'

const { proxy } = getCurrentInstance()
const dialogVisible = ref(false)
const saving = ref(false)
const syncingAccounts = ref(false)
const accountLoading = ref(false)
const statusChangingSubjectId = ref()
const loading = ref(false)
const configFormRef = ref()
const dialogMode = ref('create')
const activePlatform = ref('oceanEngine')
const currentSubjectId = ref()

const subjectList = ref([
  {
    id: 1,
    subjectName: '重庆示例科技有限公司',
    status: 1,
    appId: '179000000000428',
    secret: 'ocean-engine-secret-example',
    oceanAuthStatus: 1,
    douyinAuthorized: false,
    douyinAppId: '',
    douyinSecret: '',
    weComAuthorized: false,
    weComCorpId: '',
    weComSecret: '',
    accounts: [
      { accountId: 190001001, accountName: '重庆本地推一号账户', enabled: true },
      { accountId: 190001002, accountName: '重庆本地推二号账户', enabled: true },
      { accountId: 190001003, accountName: '成都本地推账户', enabled: false },
      { accountId: 190001004, accountName: '品牌线索账户', enabled: false },
      { accountId: 190001005, accountName: '重庆教育行业账户', enabled: true },
      { accountId: 190001006, accountName: '重庆家装行业账户', enabled: false },
      { accountId: 190001007, accountName: '成都到店推广账户', enabled: true },
      { accountId: 190001008, accountName: '川渝餐饮线索账户', enabled: false },
      { accountId: 190001009, accountName: '重庆汽车行业账户', enabled: true },
      { accountId: 190001010, accountName: '西南区域测试账户', enabled: false },
      { accountId: 190001011, accountName: '重庆生活服务账户', enabled: true },
      { accountId: 190001012, accountName: '成都房产线索账户', enabled: false }
    ]
  },
  {
    id: 2,
    subjectName: '',
    status: 1,
    appId: '182000000000716',
    secret: 'local-promotion-secret-example',
    oceanAuthStatus: 0,
    douyinAuthorized: false,
    douyinAppId: '',
    douyinSecret: '',
    weComAuthorized: false,
    weComCorpId: '',
    weComSecret: '',
    accounts: []
  },
  {
    id: 3,
    subjectName: '成都星河数字科技有限公司',
    status: 1,
    appId: '183000000000839',
    secret: 'chengdu-ocean-secret-example',
    oceanAuthStatus: 1,
    douyinAuthorized: true,
    douyinAppId: 'tt8899001122',
    douyinSecret: 'douyin-secret-example',
    weComAuthorized: true,
    weComCorpId: 'ww8899001122',
    weComSecret: 'wecom-secret-example',
    accounts: [
      { accountId: 290001001, accountName: '成都教育推广账户', enabled: true },
      { accountId: 290001002, accountName: '成都商业服务账户', enabled: true },
      { accountId: 290001003, accountName: '四川区域备用账户', enabled: false },
      { accountId: 290001004, accountName: '成都本地生活账户', enabled: true }
    ]
  },
  {
    id: 4,
    subjectName: '四川远景网络有限公司',
    status: 0,
    appId: '185000000000526',
    secret: 'expired-ocean-secret-example',
    oceanAuthStatus: 2,
    douyinAuthorized: false,
    douyinAppId: '',
    douyinSecret: '',
    weComAuthorized: false,
    weComCorpId: '',
    weComSecret: '',
    accounts: []
  }
])

const form = reactive(createDefaultForm())
const rules = {
  appId: [{ required: true, message: '请输入巨量引擎 APP_ID', trigger: 'blur' }],
  secret: [{ required: true, message: '请输入巨量引擎 Secret', trigger: 'blur' }],
  douyinAppId: [{ required: true, message: '请输入抖音开放平台 APP_ID', trigger: 'blur' }],
  douyinSecret: [{ required: true, message: '请输入抖音开放平台 AppSecret', trigger: 'blur' }],
  weComCorpId: [{ required: true, message: '请输入企业微信 CorpId', trigger: 'blur' }],
  weComSecret: [{ required: true, message: '请输入企业微信 Secret', trigger: 'blur' }]
}

const currentSubject = computed(() => subjectList.value.find((item) => item.id === currentSubjectId.value))
const dialogTitle = computed(() => {
  if (dialogMode.value === 'create') return '添加主体'
  return ({ oceanEngine: '巨量引擎配置', douyin: '抖音开放平台配置', weCom: '企业微信配置' })[activePlatform.value]
})
const dialogWidth = computed(() => dialogMode.value === 'edit' && activePlatform.value === 'oceanEngine' ? '960px' : '720px')
const oceanAuthorizationDescription = computed(() => {
  if (currentSubject.value?.oceanAuthStatus === 1) return '授权有效，已获取主体名称和巨量账户列表。'
  if (currentSubject.value?.oceanAuthStatus === 2) return '当前授权已失效，需要重新完成授权。'
  return '保存应用凭证后，前往巨量引擎完成主体授权。'
})

function createDefaultForm() {
  return { appId: '', secret: '', douyinAppId: '', douyinSecret: '', weComCorpId: '', weComSecret: '', enabledAccountIds: [] }
}

function oceanStatusText(status) {
  return ({ 0: '未授权', 1: '已授权', 2: '已失效' })[status] || '未授权'
}

function oceanStatusClass(status) {
  return ({ 0: 'is-pending', 1: 'is-authorized', 2: 'is-invalid' })[status] || 'is-pending'
}

function handleAdd() {
  resetForm()
  dialogMode.value = 'create'
  activePlatform.value = 'oceanEngine'
  dialogVisible.value = true
}

async function handlePlatformEdit(item, platform) {
  if (platform !== 'oceanEngine' && item.oceanAuthStatus !== 1) return
  resetForm()
  currentSubjectId.value = item.id
  dialogMode.value = 'edit'
  activePlatform.value = platform
  Object.assign(form, {
    appId: item.appId,
    secret: item.secret,
    douyinAppId: item.douyinAppId,
    douyinSecret: item.douyinSecret,
    weComCorpId: item.weComCorpId,
    weComSecret: item.weComSecret,
    enabledAccountIds: []
  })
  dialogVisible.value = true

  if (platform !== 'oceanEngine' || item.oceanAuthStatus !== 1) return
  accountLoading.value = true
  try {
    const response = await listOceanEngineSubjectAccounts(item.id)
    item.accounts = (response.data || []).map((account) => ({
      accountId: account.accountId,
      accountName: account.accountName,
      enabled: account.status === 1
    }))
    form.enabledAccountIds = item.accounts
      .filter((account) => account.enabled)
      .map((account) => account.accountId)
  } finally {
    accountLoading.value = false
  }
}

function handleAuthorize(item) {
  if (!item) return
  proxy.$modal.msg(`即将为 App ID ${item.appId} 发起${item.oceanAuthStatus === 2 ? '重新' : ''}授权`)
}

async function handleToggleSubject(item, nextEnabled) {
  if (statusChangingSubjectId.value) return
  const nextStatus = nextEnabled ? 1 : 0
  try {
    await proxy.$modal.confirm(`确定要${nextEnabled ? '启用' : '将'}主体“${item.subjectName || '待授权主体'}”${nextEnabled ? '' : '设为未启用'}吗？`)
  } catch {
    return
  }

  statusChangingSubjectId.value = item.id
  try {
    await changeOceanEngineSubjectStatus({ subjectId: item.id, status: nextStatus })
    item.status = nextStatus
    proxy.$modal.msgSuccess(`主体已${nextEnabled ? '启用' : '设为未启用'}`)
  } finally {
    statusChangingSubjectId.value = undefined
  }
}

function handleAccountEnabledChange(accountId, enabled) {
  if (enabled) {
    if (!form.enabledAccountIds.includes(accountId)) form.enabledAccountIds.push(accountId)
    return
  }
  form.enabledAccountIds = form.enabledAccountIds.filter((id) => id !== accountId)
}

async function handleSyncAccounts() {
  if (!currentSubject.value || syncingAccounts.value) return
  syncingAccounts.value = true
  try {
    const subjectId = currentSubject.value.id
    await syncOceanEngineAdvertiserList(subjectId)
    proxy.$modal.msgSuccess('账户同步成功')

    const response = await listOceanEngineSubjectAccounts(subjectId)
    const accounts = (response.data || []).map((account) => ({
      accountId: account.accountId,
      accountName: account.accountName,
      enabled: account.status === 1
    }))
    currentSubject.value.accounts = accounts
    currentSubject.value.accountCount = accounts.length
    currentSubject.value.enabledAccountCount = accounts.filter((account) => account.enabled).length
    form.enabledAccountIds = accounts
      .filter((account) => account.enabled)
      .map((account) => account.accountId)
  } finally {
    syncingAccounts.value = false
  }
}

async function loadSubjectList() {
  loading.value = true
  subjectList.value = []
  try {
    const response = await listOceanEngineSubjects()
    subjectList.value = (response.data || []).map((item) => ({
      id: item.id,
      subjectName: item.subjectName,
      status: item.status,
      appId: item.appId,
      secret: item.secret,
      oceanAuthStatus: item.oceanEngineAuthStatus,
      douyinAuthorized: item.douyinAuthStatus === 1,
      douyinAppId: '',
      douyinSecret: '',
      weComAuthorized: item.weComAuthStatus === 1,
      weComCorpId: '',
      weComSecret: '',
      accountCount: item.accountCount || 0,
      enabledAccountCount: item.enabledAccountCount || 0,
      accounts: []
    }))
  } finally {
    loading.value = false
  }
}

function handleSave() {
  configFormRef.value.validate(async (valid) => {
    if (!valid) return
    saving.value = true
    try {
      if (dialogMode.value === 'create') {
        await createOceanEngineSubject({ appId: form.appId, secret: form.secret })
        await loadSubjectList()
        proxy.$modal.msgSuccess('主体创建成功，请继续完成巨量引擎授权')
      } else if (activePlatform.value === 'oceanEngine') {
        await saveOceanEngineAccountConfig({
          subjectId: currentSubject.value.id,
          enabledAccountIds: form.enabledAccountIds
        })
        await loadSubjectList()
        proxy.$modal.msgSuccess('巨量引擎配置已保存')
      } else if (activePlatform.value === 'douyin') {
        currentSubject.value.douyinAppId = form.douyinAppId
        currentSubject.value.douyinSecret = form.douyinSecret
        currentSubject.value.douyinAuthorized = true
        proxy.$modal.msgSuccess('抖音开放平台配置已保存')
      } else {
        currentSubject.value.weComCorpId = form.weComCorpId
        currentSubject.value.weComSecret = form.weComSecret
        currentSubject.value.weComAuthorized = true
        proxy.$modal.msgSuccess('企业微信配置已保存')
      }
      dialogVisible.value = false
    } finally {
      saving.value = false
    }
  })
}

function resetForm() {
  Object.assign(form, createDefaultForm())
  currentSubjectId.value = undefined
  configFormRef.value?.clearValidate()
}

onMounted(loadSubjectList)
</script>

<style scoped>
.subject-page { min-height: calc(100vh - 84px); background: #f5f7fa; }
.page-toolbar { display: flex; justify-content: flex-end; margin-bottom: 16px; }
.add-subject-button { min-width: 112px; height: 38px; border: 0; border-radius: 8px; box-shadow: 0 5px 12px rgb(64 158 255 / 22%); font-weight: 500; }
.subject-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; }
.subject-card { overflow: hidden; border: 1px solid #e8ebf0; border-radius: 12px; box-shadow: 0 4px 16px rgb(31 45 61 / 5%); transition: box-shadow 0.2s ease, transform 0.2s ease; }
.subject-card:hover { box-shadow: 0 10px 26px rgb(31 45 61 / 9%); transform: translateY(-2px); }
.subject-card.is-disabled { background: #f4f5f7; box-shadow: none; filter: saturate(55%); opacity: 0.62; }
.subject-card.is-disabled:hover { box-shadow: 0 4px 12px rgb(31 45 61 / 5%); transform: none; }
.subject-card :deep(.el-card__body) { padding: 0; }
.card-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 22px 12px; }
.subject-name { min-width: 0; overflow: hidden; color: #303133; font-size: 17px; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
.subject-actions { display: flex; flex: 0 0 auto; align-items: center; gap: 12px; }
.subject-switch { --el-switch-on-color: #67c23a; --el-switch-off-color: #a8abb2; }
.platform-status::before { display: inline-block; width: 6px; height: 6px; margin-right: 6px; border-radius: 50%; background: currentColor; content: ''; vertical-align: 1px; }
.platform-status.is-authorized { color: #67c23a; }
.platform-status.is-locked { color: #a8abb2; }
.platform-list { display: flex; flex-direction: column; padding: 4px 22px 18px; }
.platform-row { display: flex; align-items: center; justify-content: space-between; min-height: 58px; }
.platform-row.is-locked .platform-name, .platform-row.is-locked .platform-tip { color: #b4b7bd; }
.platform-content { min-width: 0; }
.platform-heading, .platform-actions { display: flex; align-items: center; gap: 10px; }
.platform-name { color: #4e5969; font-size: 14px; font-weight: 500; }
.platform-status { font-size: 12px; font-weight: 500; }
.platform-status.is-pending { color: #e6a23c; }
.platform-status.is-invalid { color: #f56c6c; }
.account-summary, .platform-tip { display: block; margin-top: 5px; color: #909399; font-size: 12px; }
.no-account-warning { color: #e6a23c; }
.platform-edit-button { width: 30px; height: 30px; color: #8492a6; font-size: 15px; }
.platform-edit-button:not(.is-disabled):hover { background: #ecf5ff; color: #409eff; }
.empty-card, .empty-card :deep(.el-card__body) { min-height: 420px; }
.empty-card :deep(.el-card__body) { display: flex; align-items: center; justify-content: center; }
.dialog-tip, .authorization-panel { display: flex; align-items: center; gap: 9px; margin-bottom: 20px; padding: 12px 14px; border-radius: 8px; background: #ecf5ff; color: #409eff; font-size: 13px; line-height: 20px; }
.authorization-panel { justify-content: space-between; background: #f7f9fc; color: #606266; }
.authorization-panel.is-authorized { background: #f0f9eb; }
.authorization-panel.is-invalid { background: #fef0f0; }
.authorization-title { color: #303133; font-size: 14px; font-weight: 600; }
.authorization-title-row { display: flex; align-items: center; gap: 10px; }
.authorization-description { margin-top: 3px; color: #7b8494; font-size: 12px; }
.form-section { padding: 2px 2px 6px; }
.ocean-config-layout { display: grid; grid-template-columns: 280px minmax(0, 1fr); gap: 26px; align-items: start; }
.credential-section { padding-right: 4px; }
.credential-section :deep(.el-input__wrapper) { background: #f7f8fa; }
.account-section { min-width: 0; }
.section-heading { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 14px; }
.section-title-row { display: flex; align-items: center; gap: 10px; }
.section-title { margin-bottom: 14px; color: #303133; font-size: 15px; font-weight: 600; }
.section-heading .section-title { margin-bottom: 4px; }
.section-title-row .section-title { margin-bottom: 0; }
.section-description, .selected-count { color: #909399; font-size: 12px; }
.selected-count { padding-top: 3px; color: #409eff; }
.form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; }
.account-table { width: 100%; border-radius: 6px; }
.account-table :deep(.el-table__header th) { background: #f7f8fa; color: #606266; font-weight: 500; }
@media (max-width: 900px) {
  .subject-grid, .form-grid, .ocean-config-layout { grid-template-columns: 1fr; }
}
</style>
