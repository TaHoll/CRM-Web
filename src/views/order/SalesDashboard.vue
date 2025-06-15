<template>
  <div class="p-4">
    <el-card class="mb10">
      <template #header>
        <div class="flex justify-between items-center">
          <span>销售总额</span>
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            @change="fetchSales" />
        </div>
      </template>
      <el-row :gutter="20" class="mb10" v-if="saleInfo">
        <el-col :span="6">
          <el-statistic title="销售总额" :value="saleInfo.totalSales" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="订单数" :value="saleInfo.orderCount" />
        </el-col>
      </el-row>
    </el-card>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="flex justify-between items-center">
              <span>销售趋势</span>
              <el-date-picker v-model="trendDateRange" @change="fetchTrendData" type="daterange" size="small" style="margin-left: 8px" />
            </div>
          </template>
          <div ref="lineChartRef" style="height: 300px" />
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="flex justify-between items-center">
              <span>商品销量排行</span>
              <el-date-picker v-model="rankDateRange" @change="fetchTopProduct" type="daterange" size="small" style="margin-left: 8px" />
            </div>
          </template>
          <div ref="barChartRef" style="height: 300px" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import * as echarts from 'echarts'
import { listSales, listSalesTrade, listSaleTopProduct } from '@/api/shopping/omsorder'
// 日期区间
const dateRange = ref([new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0], new Date().toISOString().split('T')[0]])
const trendDateRange = ref([
  new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
  new Date().toISOString().split('T')[0]
])

const rankDateRange = ref([
  new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
  new Date().toISOString().split('T')[0]
])
const lineChartRef = ref(null)
const barChartRef = ref(null)

let lineChart, barChart

const renderLineChart = (data) => {
  if (!lineChart) lineChart = echarts.init(lineChartRef.value)
  lineChart.setOption({
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: data.map((d) => d.date)
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '销售额',
        type: 'line',
        data: data.map((d) => d.totalSales)
      }
    ]
  })
}

const renderBarChart = (data) => {
  if (!barChart) barChart = echarts.init(barChartRef.value)
  barChart.setOption({
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: data.map((d) => d.productName),
      axisLabel: {
        interval: 0 // ✅ 强制显示每个标签
        // formatter: function (value) {
        //   const maxLength = 6 // 每行最多6个字
        //   const reg = new RegExp(`.{1,${maxLength}}`, 'g')
        //   return value.match(reg)?.join('\n') ?? value
        // }
      }
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '销量',
        type: 'bar',
        data: data.map((d) => d.totalSold),
        barWidth: '40%' // 控制柱子宽度
      }
    ]
  })
}

function fetchTrendData() {
  const [start, end] = trendDateRange.value
  listSalesTrade({ beginCreateTime: start, endCreateTime: end }).then((res) => {
    renderLineChart(res.data)
  })
}

function fetchTopProduct() {
  const [start, end] = rankDateRange.value
  listSaleTopProduct({ beginCreateTime: start, endCreateTime: end }).then((res) => {
    renderBarChart(res.data)
  })
}

function fetchSales() {
  const [start, end] = dateRange.value
  listSales({ beginCreateTime: start, endCreateTime: end }).then((res) => {
    saleInfo.value = res.data
  })
}
const saleInfo = ref()
fetchTrendData()
fetchTopProduct()
fetchSales()
</script>

<style scoped>
/* ECharts 尺寸自适应建议加宽高设定 */
</style>
