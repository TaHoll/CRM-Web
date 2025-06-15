<template>
  <el-dialog title="修改收件信息" v-model="open" width="400px">
    <el-form :model="form" label-position="right" :rules="rules" ref="formRef" label-width="100px">
      <el-form-item label="订单号" prop="orderNo">
        <el-input v-model="form.orderNo" disabled></el-input>
      </el-form-item>
      <el-form-item label="收件人姓名" prop="userName">
        <el-input v-model="form.userName"></el-input>
      </el-form-item>
      <el-form-item label="收件人电话" prop="userName" allow-create>
        <el-input v-model="form.phone"></el-input>
      </el-form-item>
      <el-form-item label="省" prop="province">
        <el-input v-model="form.province"></el-input>
      </el-form-item>
      <el-form-item label="市" prop="city">
        <el-input v-model="form.city"></el-input>
      </el-form-item>
      <el-form-item label="区" prop="district">
        <el-input v-model="form.district"></el-input>
      </el-form-item>
      <el-form-item label="地址详情" prop="detailAddress" allow-create>
        <el-input v-model="form.detailAddress"></el-input>
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="footer">
        <el-button text @click="open = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { updateOMSOrder } from '@/api/shopping/omsorder'
import { ElMessage } from 'element-plus'
const { proxy } = getCurrentInstance()

const state = reactive({
  form: {},
  rules: {
    userName: [{ required: true, message: '请输入', trigger: 'blur' }],
    phone: [{ required: true, message: '请输入', trigger: 'blur' }],
    province: [{ required: true, message: '请输入', trigger: 'blur' }],
    city: [{ required: true, message: '请输入', trigger: 'blur' }],
    district: [{ required: false, message: '请输入', trigger: 'blur' }],
    detailAddress: [{ required: true, message: '请输入', trigger: 'blur' }]
  },
  options: {}
})
const emits = defineEmits(['success'])
const { form, rules, options } = toRefs(state)
const open = ref(false)
const formRef = ref()
// 重置表单
function reset() {
  state.form = {
    orderNo: '',
    userName: undefined,
    phone: undefined,
    province: '',
    city: '',
    district: '',
    detailAddress: '',
    operType: 3 //修改地址
  }

  proxy.resetForm('formRef')
}

/**
 *
 * @param orderNo 订单号
 * @param address 地址
 */
function handleOpen(orderNo, address) {
  reset()
  form.value = { ...address, orderNo }
  open.value = true
}

/**
 * 发货
 */
function handleSubmit() {
  formRef.value.validate((valid) => {
    if (!valid) return

    updateOMSOrder({ AddressSnapshot: form.value, orderNo: form.value.orderNo, operType: 3 }).then(() => {
      ElMessage.success('修改成功')
      open.value = false
      emits('success')
    })
  })
}

defineExpose({
  handleOpen
})
</script>
