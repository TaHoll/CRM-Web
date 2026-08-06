<template>
  <div class="app-container">
    <el-table :data="pagedList" border highlight-current-row>
      <el-table-column type="index" label="序号" width="60" align="center" />
      <el-table-column prop="name" label="姓名" min-width="100" align="center" />
      <el-table-column prop="phone" label="手机号" min-width="130" align="center" />
      <el-table-column prop="city" label="所属城市" min-width="110" align="center" />
      <el-table-column prop="province" label="所属省份" min-width="110" align="center" />
      <el-table-column prop="stage" label="阶段" min-width="110" align="center">
        <template #default="{ row }">
          <el-tag :type="stageType[row.stage] || 'info'">{{ row.stage }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="sourceTime" label="来源时间" min-width="170" align="center" />
      <el-table-column prop="gender" label="性别" width="80" align="center" />
      <el-table-column prop="age" label="年龄" width="80" align="center" />
      <el-table-column prop="tags" label="标签" min-width="180" align="center">
        <template #default="{ row }">
          <el-tag v-for="tag in row.tags" :key="tag" class="tag-item" effect="plain">{{ tag }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="90" align="center" fixed="right">
        <template #default="{ row }">
          <el-button  v-hasPermi="['customer:management:edit']" link type="primary" icon="Edit" @click="handleEdit(row)">编辑</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total > 0"
      v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize"
      :total="total" />
  </div>
</template>

<script setup name="CustomerManagement">
import { useRouter } from 'vue-router'

const router = useRouter()

const stageType = {
  新线索: 'primary',
  有意向: 'warning',
  已成交: 'success',
  无效: 'info'
}

const leadList = [
  { id: 1, name: '张晓明', phone: '13800138001', city: '杭州', province: '浙江', stage: '新线索', sourceTime: '2026-08-05 09:12:30', gender: '男', age: 28, tags: ['短视频', '高意向'] },
  { id: 2, name: '李婷婷', phone: '13900139002', city: '宁波', province: '浙江', stage: '有意向', sourceTime: '2026-08-05 09:25:11', gender: '女', age: 31, tags: ['直播', '待回访'] },
  { id: 3, name: '王建国', phone: '13700137003', city: '上海', province: '上海', stage: '已成交', sourceTime: '2026-08-05 09:48:56', gender: '男', age: 42, tags: ['团购', '到店'] },
  { id: 4, name: '赵敏', phone: '13600136004', city: '南京', province: '江苏', stage: '新线索', sourceTime: '2026-08-05 10:03:16', gender: '女', age: 26, tags: ['企业主页'] },
  { id: 5, name: '陈志强', phone: '13500135005', city: '苏州', province: '江苏', stage: '有意向', sourceTime: '2026-08-05 10:17:43', gender: '男', age: 35, tags: ['短视频', '加微信'] },
  { id: 6, name: '刘洋', phone: '13400134006', city: '合肥', province: '安徽', stage: '无效', sourceTime: '2026-08-05 10:35:22', gender: '男', age: 30, tags: ['未接通'] },
  { id: 7, name: '周雨欣', phone: '13300133007', city: '武汉', province: '湖北', stage: '新线索', sourceTime: '2026-08-05 10:48:09', gender: '女', age: 24, tags: ['私信留资'] },
  { id: 8, name: '吴磊', phone: '13200132008', city: '长沙', province: '湖南', stage: '有意向', sourceTime: '2026-08-05 11:02:37', gender: '男', age: 33, tags: ['直播', '深度沟通'] },
  { id: 9, name: '郑佳怡', phone: '13100131009', city: '成都', province: '四川', stage: '已成交', sourceTime: '2026-08-05 11:16:54', gender: '女', age: 29, tags: ['自然流量', '到店'] },
  { id: 10, name: '孙伟', phone: '13000130010', city: '重庆', province: '重庆', stage: '新线索', sourceTime: '2026-08-05 11:28:15', gender: '男', age: 38, tags: ['搜索广告'] },
  { id: 11, name: '马丽', phone: '18900189011', city: '西安', province: '陕西', stage: '有意向', sourceTime: '2026-08-05 11:42:48', gender: '女', age: 32, tags: ['短视频', '待回访'] },
  { id: 12, name: '何军', phone: '18800188012', city: '郑州', province: '河南', stage: '无效', sourceTime: '2026-08-05 11:57:20', gender: '男', age: 40, tags: ['号码无效'] },
  { id: 13, name: '高倩', phone: '18700187013', city: '青岛', province: '山东', stage: '新线索', sourceTime: '2026-08-05 12:10:06', gender: '女', age: 27, tags: ['企业主页', '高意向'] },
  { id: 14, name: '罗浩', phone: '18600186014', city: '深圳', province: '广东', stage: '已成交', sourceTime: '2026-08-05 12:26:39', gender: '男', age: 36, tags: ['团购', '预付定金'] },
  { id: 15, name: '宋洁', phone: '18500185015', city: '广州', province: '广东', stage: '有意向', sourceTime: '2026-08-05 12:45:18', gender: '女', age: 30, tags: ['直播', '加微信'] }
]

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10
})

const total = computed(() => leadList.length)
const pagedList = computed(() => {
  const start = (queryParams.pageNum - 1) * queryParams.pageSize
  return leadList.slice(start, start + queryParams.pageSize)
})

function handleEdit(row) {
  router.push({
    path: '/customer/management/edit',
    query: {
      id: row.id,
      name: row.name,
      phone: row.phone,
      city: row.city,
      province: row.province,
      stage: row.stage,
      sourceTime: row.sourceTime,
      gender: row.gender,
      age: row.age,
      tags: row.tags.join(',')
    }
  })
}
</script>

<style scoped>
.tag-item + .tag-item {
  margin-left: 6px;
}
</style>
