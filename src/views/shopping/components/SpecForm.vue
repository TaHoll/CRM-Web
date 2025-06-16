<template>
  <el-form ref="specFormRef" :model="info" :rules="rules" label-position="left" label-width="110px">
    <el-form-item label="商品规格">
      <div class="spec-wrap" v-for="(spec, specIndex) in form.specList" :key="specIndex">
        <div class="left">
          <el-select v-model="spec.name" placeholder="如：颜色、尺寸" class="mr-2" style="width: 150px" filterable allow-create>
            <el-option v-for="item in commonSpecNames" :key="item" :label="item" :value="item" />
          </el-select>

          <el-tag v-for="(val, valIndex) in spec.values" :key="valIndex" closable @close="removeSpecValue(spec, valIndex)" class="mr-2">
            {{ val }}
          </el-tag>
          <el-input
            v-model="spec.temp"
            class="mr-2"
            placeholder="输入规格值后回车"
            @keyup.enter="addSpecValue(spec, specIndex)"
            style="width: 200px" />
        </div>

        <div class="right">
          <el-button icon="remove" @click="removeSpec(specIndex)">删除规格</el-button>
        </div>
      </div>

      <el-button icon="plus" type="primary" @click="addSpec()">添加规格</el-button>
    </el-form-item>
    <!-- <el-form-item>
      <el-button type="success" @click="generateSkus" class="ml-2">生成 SKU 列表</el-button>
    </el-form-item> -->

    <!-- SKU 批量设置 -->
    <el-form-item label="批量设置 SKU">
      <el-button link text @click="handleMultiSet('price')">价格</el-button>
      <el-button link text @click="handleMultiSet('stock')">库存</el-button>
      <el-button link text @click="handleMultiSet('weight')">重量</el-button>
    </el-form-item>
    <!-- SKU 表格 -->
    <el-form-item label="SKU 列表">
      <el-table :data="skus" border :key="tableKey">
        <el-table-column label="skuId" prop="skuId" width="70"></el-table-column>
        <el-table-column
          v-for="(spec, index) in form.specList"
          :key="index"
          :label="spec.name || `规格${index + 1}`"
          :prop="'specs[' + index + ']'">
          <template #default="{ row }">
            {{ row.specs.find((s) => s.name === spec.name)?.value || '-' }}
          </template>
        </el-table-column>

        <el-table-column label="规格图片" width="70">
          <template #default="{ row }">
            <UploadImage v-model="row.imageUrl" :limit="1" style="width: 50px"></UploadImage>
          </template>
        </el-table-column>
        <el-table-column label="商品价格" width="120">
          <template #default="{ row }">
            <el-input-number v-model="row.price" :min="0" style="width: 100px" controls-position="right" />
          </template>
        </el-table-column>
        <el-table-column label="库存数量" width="120">
          <template #default="{ row }">
            <el-input-number v-model="row.stock" :min="0" style="width: 100px" controls-position="right" />
          </template>
        </el-table-column>
        <el-table-column label="商品重量(KG)" width="120">
          <template #default="{ row }">
            <el-input-number v-model="row.weight" :min="0" style="width: 100px" controls-position="right" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="50">
          <template #default="scope">
            <el-button-group>
              <el-button type="danger" text icon="delete" size="small" @click="removeSku(scope.$index, scope.row)"> </el-button>
            </el-button-group>
          </template>
        </el-table-column>
      </el-table>
    </el-form-item>

    <el-form-item label="商品限购" prop="purchaseLimit.limit">
      <el-radio-group v-model="info.purchaseLimit.limit">
        <el-radio-button :value="false">不限购</el-radio-button>
        <el-radio-button :value="true">限购</el-radio-button>
      </el-radio-group>
    </el-form-item>
    <el-row :gutter="10" style="margin-left: 100px">
      <template v-if="info.purchaseLimit.limit">
        <el-col :lg="24">
          <el-form-item label="总限购" prop="purchaseLimit.totalLimit">
            <el-input-number v-model.number="info.purchaseLimit.totalLimit" :min="1" style="width: 100px"></el-input-number> 件/人
          </el-form-item>
        </el-col>
        <el-col :lg="24">
          <el-form-item label="每单限购" prop="purchaseLimit.singleLimit">
            <el-input-number v-model.number="info.purchaseLimit.singleLimit" :min="1" style="width: 100px"></el-input-number> 件/人
          </el-form-item>
        </el-col>
        <div class="text-muted" style="font-size: 13px">用于限制每人购买该商品的数量</div>
      </template>
    </el-row>
  </el-form>
</template>
<script setup name="SpecInfoForm">
import { ElMessage, ElMessageBox } from 'element-plus'
import { debounce } from '@/utils'
const commonSpecNames = ['颜色', '尺寸', '尺码', '版本', '材质', '内存', '容量', '型号', '规格']
const tableKey = ref(0)
const form = reactive({
  specList: [],
  skus: [],
  // 规格类型 1.单规格 2.多规格
  specType: 2
})
const rules = {
  'purchaseLimit.limit': [{ required: true, trigger: 'blur' }],
  'purchaseLimit.totalLimit': [{ required: true, trigger: 'blur' }],
  'purchaseLimit.singleLimit': [{ required: true, trigger: 'blur' }]
}

const props = defineProps({
  specList: {
    type: Array,
    default: () => []
  },
  skus: {
    type: Array,
    default: () => []
  },
  info: {
    type: Object,
    default: () => {
      return {
        type: 1,
        purchaseLimit: {}
      }
    }
  }
})
const emit = defineEmits(['update:specList', 'update:skus'])

/**
 * 添加规格
 */
function addSpec() {
  if (form.specList.length >= 3) {
    ElMessage.warning('最多添加3个规格')
    return
  }
  form.specList.push({ name: '颜色', values: [], temp: '' })
}
/**
 * 删除规格
 * @param specIndex
 */
function removeSpec(specIndex) {
  form.specList.splice(specIndex, 1)
  generateSkus()
}

/**
 * 添加规格值
 */
function addSpecValue(spec, specIndex) {
  const val = form.specList[specIndex].temp.trim()
  if (val && !form.specList[specIndex].values.includes(val)) {
    form.specList[specIndex].values.push(val)
    generateSkus()
  }
  form.specList[specIndex].temp = ''
}
/**
 * 删除规格值
 * @param spec
 * @param index
 */
function removeSpecValue(spec, index) {
  spec.values.splice(index, 1)
  generateSkus()
}

// 监听 specList 变化，自动生成 SKU，使用防抖减少频繁计算
const debouncedGenerateSkus = debounce(generateSkus, 300)
watch(
  () => props.specList,
  (val) => {
    form.specList = val ?? []
  },
  {
    immediate: true
  }
)

// 监听 specList 变化，自动生成 SKU
watch(
  () => form.specList,
  () => {
    debouncedGenerateSkus()
    emit('update:specList', form.specList)
  },
  { deep: true } // 深度监听每个规格和规格值
)
function getSkuKey(specs) {
  return specs
    .map((s) => `${s.name}:${s.value}`)
    .sort() // 保证顺序一致
    .join('|')
}
// SKU 生成（笛卡尔积）
// 单规格模式不需要笛卡尔积
function generateSkus() {
  const specs = form.specList.filter((s) => s.name && s.values.length > 0)

  if (specs.length === 0) {
    form.skus = []

    emit('update:skus', [])
    return
  }
  // 生成笛卡尔积
  const combinations = cartesianProduct(specs.map((s) => s.values))

  // 旧数据映射，用 key = 颜色:红|尺码:M 的方式保存
  const oldMap = new Map(props.skus.map((sku) => [getSkuKey(sku.specs), sku]))

  // 生成新 SKU
  form.skus = combinations.map((comb) => {
    const specItems = comb.map((val, i) => ({
      name: specs[i].name,
      value: val
    }))
    const key = getSkuKey(specItems)

    if (oldMap.has(key)) {
      return { ...oldMap.get(key) }
    }

    return {
      specs: specItems,
      price: 0,
      stock: 0,
      imageUrl: '',
      weight: 0
    }
  })
  emit('update:skus', form.skus)
  tableKey.value++ // 触发表格刷新
}
function cartesianProduct(arrays) {
  if (arrays.length === 0) return []
  return arrays.reduce(
    (acc, curr) => {
      const result = []
      for (const a of acc) {
        for (const b of curr) {
          result.push([...a, b])
        }
      }
      return result
    },
    [[]]
  )
}
/**
 *
 * 批量设置sku
 * @param type
 */
function handleMultiSet(type) {
  if (props.skus.length === 0) {
    ElMessage.warning('请先点击“生成 SKU 列表”')
    return
  }
  ElMessageBox.prompt('请输入', '', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputPattern: /^(0\.(0[1-9]|[1-9]\d?)|[1-9]\d*(\.\d{1,2})?)$/,
    inputErrorMessage: '请输入有效值'
  }).then(({ value }) => {
    props.skus.forEach((sku) => {
      if (value > 0) {
        sku[type] = parseFloat(value)
      }
    })
  })
}
// 删除 SKU
function removeSku(index, row) {
  props.skus.splice(index, 1)

  ElMessage.success('SKU 已删除')
}
</script>

<style scoped lang="scss">
.mr-2 {
  margin-right: 8px;
}
.ml-2 {
  margin-left: 8px;
}
.mb-4 {
  margin-bottom: 16px;
}
.el-card__header {
  padding: 10px;
}
.spec-wrap {
  display: flex;
  width: 100%;
  margin-bottom: 10px;
  .left {
    flex: 1;
  }
  .right {
    width: 100px;
  }
}
</style>
