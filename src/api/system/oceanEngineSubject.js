import request from '@/utils/request'

// 查询巨量引擎主体列表
export function listOceanEngineSubjects() {
  return request({
    url: '/system/oceanEngineSubject/list',
    method: 'get'
  })
}

// 查询配额页面主体选项卡
export function listOceanEngineSubjectTabs() {
  return request({
    url: '/system/oceanEngineSubject/quotaTabs',
    method: 'get'
  })
}

// 创建巨量引擎主体
export function createOceanEngineSubject(data) {
  return request({
    url: '/system/oceanEngineSubject',
    method: 'post',
    data
  })
}

// 更新巨量引擎主体启用状态
export function changeOceanEngineSubjectStatus(data) {
  return request({
    url: '/system/oceanEngineSubject/status',
    method: 'put',
    data
  })
}

// 保存主体抖音开放平台配置
export function saveDouyinSubjectConfig(data) {
  return request({
    url: '/system/oceanEngineSubject/douyinConfig',
    method: 'put',
    data
  })
}

// 保存主体本地推账号启用配置
export function saveOceanEngineAccountConfig(data) {
  return request({
    url: '/system/oceanEngineSubject/accountConfig',
    method: 'put',
    data
  })
}

// 同步主体下的巨量引擎本地推账号
export function syncOceanEngineAdvertiserList(subjectId) {
  return request({
    url: `/openApi/OceanEngine/advertiser/list/${subjectId}`,
    method: 'get'
  })
}

// 查询指定主体下的本地推账号列表
export function listOceanEngineSubjectAccounts(subjectId) {
  return request({
    url: `/system/oceanEngineSubject/accountList/${subjectId}`,
    method: 'get'
  })
}
