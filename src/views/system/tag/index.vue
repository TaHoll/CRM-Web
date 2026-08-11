<template>
  <div class="app-container tag-manage-page">
    <el-splitter>
      <el-splitter-panel size="240px" :collapsible="true" min="200px" max="320px">
        <el-card class="category-card" shadow="never">
          <div class="category-header">
            <div>
              <div class="panel-title">标签分类</div>
              <div class="panel-desc">按业务场景维护标签</div>
            </div>
            <el-button type="primary" icon="Plus" size="small" @click="openCategoryDialog">添加</el-button>
          </div>

          <el-input
            v-model="categoryKeyword"
            placeholder="搜索分类"
            clearable
            prefix-icon="Search"
            class="category-search"
            @keyup.enter="getCategoryList" />

          <div class="category-list">
            <div
              v-for="item in filteredCategories"
              :key="item.id"
              class="category-item"
              :class="{ active: item.id === activeCategoryId }"
              @click="activeCategoryId = item.id">
              <div class="category-name">{{ item.name }}</div>
              <el-switch
                :model-value="item.status === 1"
                active-text="启用"
                inactive-text="停用"
                inline-prompt
                @click.stop
                @change="(value) => changeCategoryStatus(item, value)" />
              <!-- <el-tag size="small" effect="plain">{{ getCategoryTagCount(item.id) }}</el-tag> -->
            </div>
            <el-empty v-if="filteredCategories.length === 0" description="暂无标签分类" :image-size="80" />
          </div>
        </el-card>
      </el-splitter-panel>

      <el-splitter-panel>
        <div class="tag-content">
          <el-card class="tag-table-card" shadow="never">
            <template #header>
              <div class="table-header">
                <div>
                  <div class="panel-title">{{ activeCategoryName }}</div>
                  <div class="panel-desc">维护标签名称、回传事件和展示颜色</div>
                </div>
                <el-button type="primary" icon="Plus" @click="openTagDialog">新增标签</el-button>
              </div>
            </template>

            <el-table :data="currentTags" border highlight-current-row>
              <el-table-column type="index" label="序号" width="70" align="center" />
              <el-table-column prop="name" label="标签名称" min-width="160" align="center" show-overflow-tooltip>
                <template #default="{ row }">
                  <el-tag :color="row.color" effect="dark" class="tag-preview">{{ row.name }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="eventData" label="对应回传事件" min-width="180" align="center" show-overflow-tooltip>
                <template #default="{ row }">
                  {{ getEventLabel(row.eventData) }}
                </template>
              </el-table-column>
              <el-table-column prop="status" label="状态" width="90" align="center">
                <template #default="{ row }">
                  <el-switch
                    :model-value="row.status === 1"
                    @change="(value) => changeTagStatus(row, value)" />
                </template>
              </el-table-column>
              <el-table-column label="操作" width="90" align="center" fixed="right">
                <template #default="{ row }">
                  <el-button link type="primary" icon="Edit" @click="openTagDialog(row)">编辑</el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </div>
      </el-splitter-panel>
    </el-splitter>

    <el-dialog v-model="categoryDialogVisible" title="添加标签分类" width="420px" append-to-body>
      <el-form :model="categoryForm" label-width="90px">
        <el-form-item label="分类名称">
          <el-input v-model="categoryForm.categoryName" placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="categoryForm.sort" :min="0" controls-position="right" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="categoryDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="categorySaveLoading" @click="saveCategory">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="tagDialogVisible" :title="tagForm.id ? '编辑标签' : '新增标签'" width="520px" append-to-body>
      <el-form :model="tagForm" label-width="110px">
        <el-form-item label="标签名称">
          <el-input v-model="tagForm.name" :disabled="Boolean(tagForm.id)" placeholder="请输入标签名称" />
        </el-form-item>
        <el-form-item label="回传事件">
          <el-select v-model="tagForm.eventName" placeholder="请选择对应回传事件" filterable>
            <el-option v-for="item in eventOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="isInvalidEvent" label="通用无效标签">
          <el-select v-model="tagForm.reasonCode" placeholder="请选择通用无效标签" filterable>
            <el-option v-for="item in reasonCodeOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="颜色">
          <div class="tag-color-presets">
            <button
              v-for="color in tagPredefineColors"
              :key="color"
              type="button"
              class="tag-color-preset"
              :class="{ selected: tagForm.color === color }"
              :style="{ backgroundColor: color }"
              :aria-label="`选择颜色 ${color}`"
              @click="tagForm.color = color">
              <span v-if="tagForm.color === color">✓</span>
            </button>
          </div>
          <div class="tag-effect-preview">
            <span class="tag-effect-preview-label">标签效果预览</span>
            <el-tag :color="tagForm.color" effect="dark" class="tag-effect-preview-value">
              {{ tagForm.name || '标签名称' }}
            </el-tag>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="tagDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="tagSaveLoading" @click="saveTag">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="CustomerTagManage">
import { ElMessage } from 'element-plus'
import {
  addCustomerTag,
  addTagCategory,
  listCustomerTag,
  listTagCategory,
  updateCustomerTag,
  updateCustomerTagStatus,
  updateTagCategoryStatus
} from '@/api/system/tagCategory'
import { getEnumOptions } from '@/api/system/enum'

const categoryKeyword = ref('')
const activeCategoryId = ref(undefined)
const categoryDialogVisible = ref(false)
const categorySaveLoading = ref(false)
const tagDialogVisible = ref(false)
const tagSaveLoading = ref(false)

const categories = ref([])

const tags = ref([])

const eventOptions = ref([])
const reasonCodeOptions = ref([])
const tagPredefineColors = [
  '#409EFF',
  '#67C23A',
  '#E6A23C',
  '#F56C6C',
  '#909399',
  '#7B61FF',
  '#14B8A6',
  '#D97706'
]

const categoryForm = reactive({
  categoryName: '',
  sort: 0
})

const tagForm = reactive({
  id: undefined,
  categoryId: undefined,
  name: '',
  eventName: '',
  reasonCode: '',
  color: '#409eff'
})

const filteredCategories = computed(() => {
  return categories.value
})

const activeCategoryName = computed(() => {
  return categories.value.find((item) => item.id === activeCategoryId.value)?.name || '标签列表'
})

const currentTags = computed(() => {
  return tags.value
})

const isInvalidEvent = computed(() => {
  return tagForm.eventName === 'INVALID_EVENT'
})

function getCategoryTagCount(categoryId) {
  return categoryId === activeCategoryId.value ? tags.value.length : 0
}

function openCategoryDialog() {
  categoryForm.categoryName = ''
  categoryForm.sort = 0
  categoryDialogVisible.value = true
}

async function saveCategory() {
  if (!categoryForm.categoryName) {
    ElMessage.warning('请输入分类名称')
    return
  }

  categorySaveLoading.value = true
  try {
    const res = await addTagCategory({
      categoryName: categoryForm.categoryName,
      sort: categoryForm.sort,
      status: 1
    })
    if (res.code === 200) {
      categoryDialogVisible.value = false
      ElMessage.success('分类已添加')
      await getCategoryList()
    }
  } finally {
    categorySaveLoading.value = false
  }
}

async function getCategoryList() {
  const res = await listTagCategory({
    categoryName: categoryKeyword.value
  })
  if (res.code === 200) {
    categories.value = res.data || []
    if (!activeCategoryId.value || !categories.value.some((item) => item.id === activeCategoryId.value)) {
      activeCategoryId.value = categories.value[0]?.id
    }
  }
}

async function getTagList() {
  if (!activeCategoryId.value) {
    tags.value = []
    return
  }

  const res = await listCustomerTag({
    categoryId: activeCategoryId.value
  })
  if (res.code === 200) {
    tags.value = res.data || []
  }
}

async function getEventOptions() {
  const res = await getEnumOptions('ClueConvertState')
  if (res.code === 200) {
    eventOptions.value = (res.data || []).map((item) => ({
      label: item.label,
      value: item.value
    }))
  }
}

async function getReasonCodeOptions() {
  const res = await getEnumOptions('ReasonCode')
  if (res.code === 200) {
    reasonCodeOptions.value = (res.data || []).map((item) => ({
      label: item.label,
      value: item.value
    }))
  }
}

function getEventLabel(value) {
  return eventOptions.value.find((item) => item.value === String(value))?.label || value
}

function openTagDialog(row) {
  Object.assign(tagForm, {
    id: row?.id,
    categoryId: row?.categoryId || activeCategoryId.value,
    name: row?.name || '',
    eventName: row?.eventData || '',
    reasonCode: row?.reasonCode || '',
    color: row?.color || '#409eff'
  })
  tagDialogVisible.value = true
}

async function saveTag() {
  if (!activeCategoryId.value) {
    ElMessage.warning('请先选择标签分类')
    return
  }
  if (!tagForm.name) {
    ElMessage.warning('请输入标签名称')
    return
  }
  if (isInvalidEvent.value && !tagForm.reasonCode) {
    ElMessage.warning('请选择通用无效标签')
    return
  }

  tagSaveLoading.value = true
  try {
    const res = tagForm.id
      ? await updateCustomerTag({
          id: tagForm.id,
          eventData: String(tagForm.eventName),
          reasonCode: isInvalidEvent.value ? tagForm.reasonCode : '',
          color: tagForm.color
        })
      : await addCustomerTag({
          categoryId: activeCategoryId.value,
          name: tagForm.name,
          eventData: String(tagForm.eventName),
          reasonCode: isInvalidEvent.value ? tagForm.reasonCode : '',
          color: tagForm.color,
          status: 1
        })

    if (res.code === 200) {
      tagDialogVisible.value = false
      ElMessage.success(tagForm.id ? '标签已保存' : '标签已添加')
      await getTagList()
    }
  } finally {
    tagSaveLoading.value = false
  }
}

async function changeCategoryStatus(item, value) {
  const nextStatus = value ? 1 : 0
  const res = await updateTagCategoryStatus({ id: item.id, status: nextStatus })
  if (res.code === 200) {
    item.status = nextStatus
    ElMessage.success(nextStatus === 1 ? '分类已启用' : '分类已停用')
  }
}

async function changeTagStatus(item, value) {
  const nextStatus = value ? 1 : 0
  const res = await updateCustomerTagStatus({ id: item.id, status: nextStatus })
  if (res.code === 200) {
    item.status = nextStatus
    ElMessage.success(nextStatus === 1 ? '标签已启用' : '标签已停用')
  }
}

watch(activeCategoryId, () => {
  getTagList()
})

watch(
  () => tagForm.eventName,
  () => {
    if (!isInvalidEvent.value) {
      tagForm.reasonCode = ''
    }
  }
)

getEventOptions()
getReasonCodeOptions()
getCategoryList()
</script>

<style scoped>
.tag-manage-page {
  padding: 16px;
}

.category-card {
  height: calc(100vh - 120px);
}

.category-header,
.table-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.panel-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.panel-desc {
  margin-top: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.category-search {
  margin: 16px 0;
}

.category-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.category-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 12px;
  cursor: pointer;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
}

.category-item:hover {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.category-item.active {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary-light-5);
}

.category-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tag-content {
  padding-left: 12px;
}

.tag-table-card {
  min-height: calc(100vh - 120px);
}

.tag-preview {
  border: none;
  color: #fff;
}

.tag-color-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.tag-color-preset {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  padding: 0;
  color: #fff;
  font-size: 16px;
  cursor: pointer;
  border: 2px solid transparent;
  border-radius: 6px;
  box-shadow: 0 0 0 1px var(--el-border-color);
}

.tag-color-preset.selected {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 2px var(--el-color-primary-light-7);
}

.tag-effect-preview {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.tag-effect-preview-label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.tag-effect-preview-value {
  color: #fff;
  border: none;
}

:deep(.el-select) {
  width: 100%;
}

@media (max-width: 768px) {
  .tag-manage-page {
    padding: 0;
  }

  .tag-content {
    padding-left: 8px;
  }
}
</style>
