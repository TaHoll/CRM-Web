<template>
  <div class="home">
    <!-- 用户信息 -->
    <el-row :gutter="15">
      <el-col :span="24" class="mb10">
        <el-card shadow="hover">
          <div class="user-card-content">
            <div class="user-item">
              <div class="user-item-left">
                <el-avatar :size="60" shape="circle" :src="userInfo.avatar" />
              </div>

              <div class="user-item-right">
                <el-row>
                  <el-col :xs="24" :md="24" class="right-title mb20 one-text-overflow">
                    <div class="mb10">
                      {{ userInfo.welcomeMessage }} <strong>{{ userInfo.nickName }}</strong>
                      <span>({{ userInfo.welcomeContent }})</span>
                    </div>
                  </el-col>
                </el-row>
                <el-row>
                  <el-button icon="edit">
                    <router-link to="/user/profile">{{ $t('layout.modifyInformation') }}</router-link>
                  </el-button>
                </el-row>
              </div>
            </div>
            <div class="dashboard-date">{{ currentTime }} {{ weekName }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    <panel-group @handleSetLineChartData="handleSetLineChartData" />

    <el-row :gutter="32">
      <el-col :xs="24" :sm="24" :lg="24">
        <div class="chart-wrapper">
          <line-chart :chart-data="lineChartData" :key="dataType" />
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="32">
      <el-col :xs="24" :sm="24" :lg="8">
        <div class="chart-wrapper">
          <raddar-chart />
        </div>
      </el-col>
      <el-col :xs="24" :sm="24" :lg="8">
        <div class="chart-wrapper">
          <pie-chart />
        </div>
      </el-col>
      <el-col :xs="24" :sm="24" :lg="8">
        <div class="chart-wrapper">
          <bar-chart />
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup name="index">
import PanelGroup from './dashboard/PanelGroup'
import LineChart from './dashboard/LineChart'
import RaddarChart from './dashboard/RaddarChart'
import PieChart from './dashboard/PieChart'
import BarChart from './dashboard/BarChart'

import useUserStore from '@/store/modules/user'
import { getWeek } from '@/utils/ruoyi'
const data = {
  newVisitis: {
    expectedData: [100, 120, 161, 134, 105, 160, 165],
    actualData: [120, 82, 91, 154, 162, 140, 145]
  },
  messages: {
    expectedData: [200, 192, 120, 144, 160, 130, 140],
    actualData: [180, 160, 151, 106, 145, 150, 130]
  },
  purchases: {
    expectedData: [80, 100, 121, 104, 105, 90, 100],
    actualData: [120, 90, 100, 138, 142, 130, 130]
  },
  shoppings: {
    expectedData: [130, 140, 141, 142, 145, 150, 160],
    actualData: [120, 82, 91, 154, 162, 140, 130]
  }
}
const { proxy } = getCurrentInstance()
const userInfo = computed(() => {
  return useUserStore().userInfo
})
const currentTime = computed(() => {
  return proxy.parseTime(new Date(), 'YYYY-MM-DD')
})
const weekName = getWeek()

let lineChartData = reactive([])
const dataType = ref(null)
function handleSetLineChartData(type) {
  dataType.value = type
  lineChartData = data[type]
}
handleSetLineChartData('newVisitis')

</script>

<style lang="scss" scoped>
.home {
  .user-card-content {
    position: relative;
    min-height: 60px;
  }

  .dashboard-date {
    position: absolute;
    top: 0;
    right: 0;
    padding: 8px 14px;
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
    border-radius: 6px;
    font-size: 22px;
    font-weight: 700;
    letter-spacing: 1px;
  }

  .user-item {
    display: flex;
    align-items: center;
    .user-item-left {
      width: 60px;
      height: 60px;
      overflow: hidden;
      margin-right: 10px;
    }
    .user-item-right {
      flex: 1;
      .right-title {
        font-size: 20px;
      }
    }
  }
  .info {
    height: 200px;
  }

}
.chart-wrapper {
  background: var(--base-bg-main);
  padding: 16px 16px 0;
  margin-bottom: 32px;
}

@media (max-width: 1024px) {
  .home .dashboard-date {
    position: static;
    margin-top: 12px;
    text-align: right;
  }

  .chart-wrapper {
    padding: 8px;
  }
}
</style>
