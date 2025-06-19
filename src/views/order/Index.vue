<!--
 * @Descripttion: (订单管理/mms_order)
 * @Author: (admin)
 * @Date: (2025-05-30)
-->
<template>
  <div>
    <el-collapse>
      <el-collapse-item title="操作提示" name="1">
        <div>*订单状态有待付款，待发货，待收货，已完成，已关闭。</div>
        <div>*待付款订单取消后则为已关闭。待付款订单支付后则为待发货。待发货订单发货后则为待收货。待收货订单收货后则为已完成。</div>
      </el-collapse-item>
    </el-collapse>
    <el-form :model="queryParams" label-position="right" inline ref="queryRef" v-show="showSearch" @submit.prevent>
      <el-tabs v-model="queryParams.orderStatus" class="demo-tabs" @tab-change="handleQuery">
        <el-tab-pane label="全部" name=""></el-tab-pane>
        <el-tab-pane :label="item.dictLabel" :name="parseInt(item.dictValue)" v-for="item in dictStore.orderStatusOptions">
          <template #label>
            {{ item.dictLabel }}
            <span v-if="item.dictValue == 1"> ({{ notDelivereOrder }}) </span>
          </template>
        </el-tab-pane>
      </el-tabs>
      <!-- <el-form-item label="订单号" prop="orderNo">
        <el-input v-model="queryParams.orderNo" placeholder="请输入订单号" />
      </el-form-item>
      <el-form-item label="物流单号" prop="deliveryNo">
        <el-input v-model="queryParams.deliveryNo" placeholder="请输入物流单号" />
      </el-form-item>
      <el-form-item label="用户ID" prop="userId">
        <el-input v-model.number="queryParams.userId" placeholder="请输入用户ID" />
      </el-form-item> -->

      <el-form-item label="搜索">
        <el-input v-model="searchValue" label-width="130px" clearable placeholder="请输入搜索内容" style="width: 300px">
          <template #prepend>
            <el-select v-model="searchType" style="width: 115px">
              <el-option label="订单号" value="orderNo" />
              <el-option label="快递单号" value="deliveryNo" />
              <el-option label="用户id" value="userId" />
            </el-select>
          </template>
        </el-input>
      </el-form-item>

      <el-form-item label="创建时间">
        <el-date-picker
          v-model="dateRangeCreateTime"
          type="datetimerange"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD HH:mm:ss"
          @change="handleTimed"
          :default-time="defaultTime"
          :shortcuts="dateOptions">
        </el-date-picker>
      </el-form-item>

      <el-form-item>
        <el-button icon="search" type="primary" @click="handleQuery">{{ $t('btn.search') }}</el-button>
        <el-button icon="refresh" @click="resetQuery">{{ $t('btn.reset') }}</el-button>
      </el-form-item>
    </el-form>
    <!-- 工具区域 -->
    <el-row :gutter="15" class="mb10">
      <el-col :span="1.5">
        <el-button type="warning" plain icon="download" @click="handleExport" v-hasPermi="['oms:order:export']">
          {{ $t('btn.export') }}订单
        </el-button>
      </el-col>

      <el-col :span="1.5">
        <el-dropdown trigger="click" v-hasPermi="['oms:order:ship']">
          <el-button type="primary" plain icon="Upload">
            批量发货<el-icon class="el-icon--right"><arrow-down /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="upload">
                <importData
                  :data="queryParams"
                  templateUrl="shopping/Order/exportDelivery"
                  importUrl="/shopping/Order/importData"
                  @success="handleQuery()"
                  :resultFields="[
                    { prop: 'orderNo', label: '订单号' },
                    { prop: 'status', label: '发货状态' }
                  ]">
                </importData>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" :columns="columns"></right-toolbar>
    </el-row>

    <el-table
      :data="dataList"
      v-loading="loading"
      ref="table"
      border
      header-cell-class-name="el-table-header-cell"
      highlight-current-row
      @sort-change="sortChange">
      <el-table-column prop="id" label="订单Id" align="center" sortable v-if="columns.showColumn('id')" />
      <el-table-column label="收货信息" width="160" v-if="columns.showColumn('addressSnapshot')">
        <template #default="{ row }">
          <div class="flex" v-if="row.addressSnapshot">
            <el-button
              type="primary"
              icon="edit"
              link
              v-hasPermi="['oms:orderaddress:edit']"
              @click="handleEditAddress(row)"
              v-if="[1, 0].includes(row.orderStatus)">
            </el-button>
            <el-text truncated> {{ row.addressSnapshot.userName }} {{ row.addressSnapshot.phone }} </el-text>
          </div>
          {{ row.addressLabel }}
        </template>
      </el-table-column>
      <el-table-column prop="userId" label="用户ID" align="center" v-if="columns.showColumn('userId')" />

      <el-table-column prop="orderStatus" label="订单状态" width="190" v-if="columns.showColumn('orderStatus')">
        <template #default="{ row }">
          <dict-tag :options="dictStore.orderStatusOptions" :value="row.orderStatus" />

          <template v-if="row.deliveryCompany">
            <el-tag type="success" class="ml10"> {{ row.deliveryCompany }} </el-tag>
            <div>
              物流单号:{{ row.deliveryNo }}

              <el-button
                type="danger"
                text
                icon="document-copy"
                plain
                class="ml10"
                v-clipboard:success="copySuccess"
                v-clipboard:copy="row.deliveryCompany + '-' + row.deliveryNo">
              </el-button>
            </div>
            <div>发货时间:{{ row.shipTime }}</div>
          </template>
        </template>
      </el-table-column>
      <el-table-column prop="payTime" sortable label="下单/付款时间" width="150" v-if="columns.showColumn('createTime')">
        <template #default="{ row }">
          <div v-if="row.createTime">
            <el-tag>下单</el-tag>
            {{ dayjs(row.createTime).format('MM-DD HH:mm:ss') }}
          </div>
          <div v-if="row.payTime">
            <el-tag type="danger">付款</el-tag>
            {{ dayjs(row.payTime).format('MM-DD HH:mm:ss') }}
          </div>
        </template>
      </el-table-column>

      <el-table-column prop="cancelTime" label="取消时间" :show-overflow-tooltip="true" v-if="columns.showColumn('cancelTime')" />

      <el-table-column prop="deliveryStatus" label="发货状态" align="center" v-if="columns.showColumn('deliveryStatus')">
        <template #default="scope">
          <dict-tag :options="options.confirmStatusOptions" :value="scope.row.deliveryStatus" />
        </template>
      </el-table-column>
      <el-table-column prop="payAmount" label="实付金额" align="center"></el-table-column>
      <el-table-column prop="totalAmount" label="总金额" align="center" v-if="columns.showColumn('totalAmount')"> </el-table-column>
      <el-table-column label="商品明细" prop="items" width="200">
        <template #default="scope">
          <div class="order-product" v-for="item in scope.row.items">
            <ImagePreview style="width: 60px" :src="item.productPic"></ImagePreview>
            <div class="info">
              <div class="name">
                <el-text line-clamp="2">
                  {{ item.productName }}
                </el-text>
              </div>
              <div>
                <span class="price">{{ $t('currency') }}{{ item.totalPrice }} </span>
                x{{ item.quantity }}
              </div>
              <div>{{ item.skuSpec }}</div>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="orderNote" label="订单备注" width="140" v-if="columns.showColumn('orderNote')">
        <template #default="{ row }">
          <template v-if="row.orderNote">
            <div style="font-size: 12px; font-weight: bold">买家备注</div>
            {{ row.orderNote }}
          </template>

          <template v-if="row.merchantNote">
            <div style="font-size: 12px; font-weight: bold">商家备注</div>
            {{ row.merchantNote }}
          </template>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="190" fixed="right">
        <template #default="scope">
          <div class="fr" style="display: flex">
            <el-text style="width: 150px" truncated>
              {{ scope.row.orderNo }}
            </el-text>
            <el-button
              type="danger"
              text
              icon="document-copy"
              plain
              class="ml10"
              v-clipboard:success="copySuccess"
              v-clipboard:copy="scope.row.orderNo">
            </el-button>
          </div>
          <div class="fr">
            <el-button type="primary" text size="small" v-hasPermi="['oms:order:query']" @click="handleDetails(scope.row)"> 详情</el-button>
            <!-- <el-button type="primary" text size="small">日志</el-button> -->
            <el-button
              type="primary"
              text
              size="small"
              v-hasPermi="['oms:order:ship']"
              @click="handleShipments(scope.row)"
              v-if="scope.row.orderStatus == 1 && scope.row.deliveryStatus == 0">
              发货
            </el-button>
            <el-button type="info" link size="small" disabled v-else>发货</el-button>

            <el-dropdown>
              <el-button size="small" text>
                {{ $t('btn.more') }}
                <el-icon class="el-icon--right">
                  <arrow-down />
                </el-icon>
              </el-button>

              <template #dropdown>
                <el-dropdown-menu>
                  <div class="mb10">
                    <el-dropdown-item>
                      <el-button icon="edit" link @click="handlemerchantNote(scope.row)">备注</el-button>
                    </el-dropdown-item>
                  </div>
                  <div>
                    <el-dropdown-item>
                      <el-button icon="Delete" link @click="handleDelete(scope.row)">删除</el-button>
                    </el-dropdown-item>
                  </div>
                  <div class="mt10" v-if="[1, 2, 3].includes(scope.row.orderStatus)">
                    <el-dropdown-item>
                      <el-button icon="SoldOut" type="danger" link @click="handleOpen(scope.row)"> 退款 </el-button>
                    </el-dropdown-item>
                  </div>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </template>
      </el-table-column>
    </el-table>
    <pagination :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <el-dialog title="退款" :lock-scroll="false" v-model="open" width="400px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-row :gutter="20">
          <el-col :lg="24">
            <el-form-item label="订单号" prop="orderNo">
              <el-input v-model="form.orderNo" disabled placeholder="请输入订单号" />
            </el-form-item>
          </el-col>
          <el-col :lg="24">
            <el-form-item label="退款金额" prop="payAmount">
              <el-input-number v-model="form.payAmount" :min="0.01" :max="form.payAmount" placeholder="请输入退款金额" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button text @click="cancel">{{ $t('btn.cancel') }}</el-button>
        <el-button type="primary" @click="submitForm(form)" :loading="state.submitLoading">{{ $t('btn.submit') }}</el-button>
      </template>
    </el-dialog>
    <shipments ref="shipmentsRef" @success="handleQuery"></shipments>
    <merchantNoteForm ref="merchantNoteFormRef" @success="handleQuery"></merchantNoteForm>
    <addressForm ref="addressFormRef" @success="handleQuery"></addressForm>
  </div>
</template>

<script setup name="order">
import { listOMSOrder, delOMSOrder, RefundOrder } from '@/api/shopping/omsorder.js'
import { dayjs, ElMessage } from 'element-plus'
import shipments from './components/ShipmentsForm.vue'
import merchantNoteForm from './components/MerchantNoteForm.vue'
import addressForm from './components/AddressForm.vue'
import router from '@/router'
import useDictStore from '@/store/modules/dict'
import importData from '@/components/ImportData'

const { proxy } = getCurrentInstance()
const ids = ref([])
const loading = ref(false)
const showSearch = ref(true)
const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  orderNo: undefined,
  userId: undefined,
  orderStatus: 1,
  deliveryNo: undefined
})

const searchType = ref('')
const searchValue = ref(undefined)
const dictStore = useDictStore()
const columns = ref([
  { visible: false, align: 'center', type: '', prop: 'id', label: '订单Id' },
  // { visible: true, align: 'center', type: '', prop: 'orderNo', label: '订单号', showOverflowTooltip: true },
  { visible: true, align: 'center', type: '', prop: 'userId', label: '用户ID' },
  { visible: false, align: 'center', type: '', prop: 'totalAmount', label: '总金额' },
  // { visible: true, align: 'center', type: '', prop: 'payAmount', label: '付款金额' },
  { visible: true, align: 'center', type: 'dict', prop: 'orderStatus', label: '订单状态' },
  { visible: true, align: 'center', type: '', prop: 'createTime', label: '下单时间', showOverflowTooltip: true },
  { visible: false, align: 'center', type: '', prop: 'cancelTime', label: '取消时间', showOverflowTooltip: true },
  { visible: true, align: 'center', type: '', prop: 'orderNote', label: '订单备注', showOverflowTooltip: true },
  // { visible: false, align: 'center', type: '', prop: 'merchantNote', label: '商家备注', showOverflowTooltip: true },
  { visible: true, align: 'center', type: 'dict', prop: 'deliveryStatus', label: '发货状态' },
  { visible: true, align: 'center', type: '', prop: 'addressSnapshot', label: '收货信息', showOverflowTooltip: true }
])
const total = ref(0)
const dataList = ref([])
const queryRef = ref()
const defaultTime = ref([new Date(2000, 1, 1, 0, 0, 0), new Date(2000, 2, 1, 23, 59, 59)])
const end = dayjs().endOf('week').add(1, 'day').format('YYYY-MM-DD') + ' 23:59:59'
const start = dayjs().startOf('week').add(1, 'day').format('YYYY-MM-DD 00:00:00')
// 下单时间时间范围
const dateRangeCreateTime = ref([])

var dictParams = []
const notDelivereOrder = ref(0)
function getList() {
  proxy.addDateRange(queryParams, dateRangeCreateTime.value, 'CreateTime')
  loading.value = true

  // 清空这三个字段
  queryParams.userId = undefined
  queryParams.orderNo = undefined
  queryParams.deliveryNo = undefined
  // 设置被选中的字段
  if (searchType.value && searchValue.value) {
    queryParams[searchType.value] = searchValue.value
  }
  listOMSOrder(queryParams).then((res) => {
    const { code, data } = res
    if (code == 200) {
      dataList.value = data.result
      total.value = data.totalNum
      loading.value = false
      notDelivereOrder.value = data.extra.notDelivereOrder
    }
  })
}

// 查询
function handleQuery() {
  queryParams.pageNum = 1

  getList()
}

// 重置查询操作
function resetQuery() {
  searchType.value = ''
  searchValue.value = ''
  // 下单时间时间范围
  dateRangeCreateTime.value = []
  proxy.resetForm('queryRef')
  handleQuery()
}
// 自定义排序
function sortChange(column) {
  var sort = undefined
  var sortType = undefined

  if (column.prop != null && column.order != null) {
    sort = column.prop
    sortType = column.order
  }
  queryParams.sort = sort
  queryParams.sortType = sortType
  handleQuery()
}

/*************** form操作 ***************/
const formRef = ref()
const open = ref(false)
const state = reactive({
  single: true,
  multiple: true,
  submitLoading: false,
  form: {},
  rules: {
    payAmount: [{ required: true, message: '退款金额不能为空', trigger: 'blur', type: 'number' }]
  },
  options: {
    confirmStatusOptions: [
      { dictLabel: '未发货', dictValue: '0' },
      { dictLabel: '已发货', dictValue: '1', listClass: 'success' },
      { dictLabel: '已收货', dictValue: '2', listClass: 'danger' }
    ]
  }
})

const { form, rules, options } = toRefs(state)

// 关闭dialog
function cancel() {
  open.value = false
}

function handleOpen(row) {
  state.form = {
    ...row
  }
  open.value = true
}
// 表单提交
function submitForm(row) {
  proxy.$refs['formRef'].validate((valid) => {
    if (valid) {
      state.submitLoading = true
      RefundOrder(row)
        .then((res) => {
          proxy.$modal.msgSuccess(res.msg)
        })
        .finally(() => {
          state.submitLoading = false
        })
    }
  })
}

// 删除按钮操作
function handleDelete(row) {
  const Ids = row.id || ids.value

  proxy
    .$confirm('删除后订单将消失，确认删除订单吗?', '警告', {
      confirmButtonText: proxy.$t('common.ok'),
      cancelButtonText: proxy.$t('common.cancel'),
      type: 'warning'
    })
    .then(function () {
      return delOMSOrder(Ids)
    })
    .then(() => {
      getList()
      proxy.$modal.msgSuccess('删除成功')
    })
}

// 导出按钮操作
function handleExport() {
  proxy
    .$confirm('是否确认导出订单管理数据项?', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    .then(async () => {
      await proxy.downFile('/shopping/Order/export', { ...queryParams })
    })
}
function handleTimed() {
  proxy.addDateRange(queryParams, dateRangeCreateTime.value, 'CreateTime')
}

function copySuccess() {
  ElMessage.success('复制成功')
}
const shipmentsRef = ref()
/**
 * 发货
 */
function handleShipments(row) {
  if (!row.addressSnapshot) {
    ElMessage.error('用户还未选择收货地址不能发货')
    return
  }
  shipmentsRef.value.handleOpen(row)
}

const merchantNoteFormRef = ref()
function handlemerchantNote(row) {
  merchantNoteFormRef.value.handleOpen(row.orderNo)
}

const addressFormRef = ref()
/**
 * 修改收货地址信息
 * @param orderNo
 * @param row
 */
function handleEditAddress(row) {
  addressFormRef.value.handleOpen(row.orderNo, row.addressSnapshot)
}

/**
 * 详情
 * @param row
 */
function handleDetails(row) {
  router.push({
    path: '/orderdetails',
    query: {
      id: row.id
    }
  })
}
handleQuery()
</script>
<style lang="scss" scoped>
.amount_label {
  width: 60px;
  display: inline-block;
}
.flex {
  display: flex;
}

.order-product {
  display: flex;
  align-items: flex-start;
  margin-bottom: 12px;
  margin-top: 12px;
}

.order-product .info {
  flex: 1;
  padding: 0 10px;
}

.order-product .price {
  color: #f44;
}
</style>
