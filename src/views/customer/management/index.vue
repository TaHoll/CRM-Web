<template>
  <div class="app-container">
    <el-row :gutter="15" class="mb10">
      <right-toolbar @query-table="getList" />
    </el-row>

    <el-table v-loading="loading" :data="dataList" border highlight-current-row row-key="clueId">
      <el-table-column type="index" label="序号" width="60" align="center" />
      <el-table-column prop="name" label="姓名" min-width="100" align="center" show-overflow-tooltip />
      <el-table-column prop="telephone" label="手机号" min-width="130" align="center" show-overflow-tooltip />
      <el-table-column prop="autoCityName" label="所属城市" min-width="110" align="center" show-overflow-tooltip />
      <el-table-column prop="autoProvinceName" label="所属省份" min-width="110" align="center" show-overflow-tooltip />
      <el-table-column prop="effectiveStateNameStr" label="阶段" min-width="110" align="center">
        <template #default="{ row }">
          <el-tag :type="stageType[row.effectiveStateNameStr] || 'info'">{{ formatValue(row.effectiveStateNameStr) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="userNickName" label="跟进人" min-width="110" align="center" show-overflow-tooltip>
        <template #default="{ row }">
          {{ formatValue(row.userNickName || row.UserNickName) }}
        </template>
      </el-table-column>
      <el-table-column prop="deptName" label="跟进部门" min-width="130" align="center" show-overflow-tooltip>
        <template #default="{ row }">
          {{ formatValue(row.deptName || row.DeptName) }}
        </template>
      </el-table-column>
      <el-table-column prop="createTimeDetail" label="来源时间" min-width="170" align="center">
        <template #default="{ row }">
          {{ formatValue(row.createTimeDetail, 'datetime') }}
        </template>
      </el-table-column>
      <el-table-column prop="genderStr" label="性别" width="80" align="center">
        <template #default="{ row }">
          {{ formatValue(row.genderStr) }}
        </template>
      </el-table-column>
      <el-table-column prop="age" label="年龄" width="80" align="center">
        <template #default="{ row }">
          {{ formatValue(row.age) }}
        </template>
      </el-table-column>
      <el-table-column prop="tagsArrary" label="标签" min-width="180" align="center">
        <template #default="{ row }">
          <el-tag v-for="tag in row.tagsArrary || []" :key="tag" class="tag-item" effect="plain">{{ tag }}</el-tag>
          <span v-if="!row.tagsArrary || row.tagsArrary.length === 0">-</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="90" align="center" fixed="right">
        <template #default="{ row }">
          <el-button v-hasPermi="['customer:management:edit']" link type="primary" icon="Edit" @click="handleEdit(row)">编辑</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total > 0"
      v-model:page="queryParams.pager.pageNum"
      v-model:limit="queryParams.pager.pageSize"
      :total="total"
      @pagination="getList" />
  </div>
</template>

<script setup name="CustomerManagement">
import { useRouter } from 'vue-router'
import { customerList } from '@/api/public/lead'

const router = useRouter()

const stageType = {
  新线索: 'primary',
  有意向: 'warning',
  已成交: 'success',
  无效: 'info'
}

const loading = ref(false)
const total = ref(0)
const dataList = ref([])
const queryParams = reactive({
  pager: {
    pageNum: 1,
    pageSize: 10
  }
})

async function getList() {
  loading.value = true
  try {
    const res = await customerList(queryParams)
    if (res.code === 200) {
      dataList.value = res.data?.result || []
      total.value = res.data?.totalNum || 0
    }
  } finally {
    loading.value = false
  }
}

function formatValue(value, type) {
  if (value === null || value === undefined || value === '') {
    return '-'
  }
  if (type === 'datetime') {
    return new Date(value).toLocaleString('zh-CN', { hour12: false })
  }
  return value
}

function handleEdit(row) {
  router.push({
    path: '/customer/management/edit',
    query: {
      id: row.clueId,
      name: row.name,
      phone: row.telephone,
      city: row.autoCityName,
      province: row.autoProvinceName,
      stage: row.effectiveStateNameStr,
      sourceTime: row.createTimeDetail,
      gender: row.genderStr,
      age: row.age,
      tags: (row.tagsArrary || []).join(',')
    }
  })
}

getList()
</script>

<style scoped>
.tag-item + .tag-item {
  margin-left: 6px;
}
</style>
