import request from '@/utils/request'

// 查询标签分类列表
export function listTagCategory(query) {
  return request({
    url: '/system/tag/category/list',
    method: 'get',
    params: query
  })
}

// 添加标签分类
export function addTagCategory(data) {
  return request({
    url: '/system/tag/category',
    method: 'post',
    data
  })
}

// 获取启用的标签分类及标签选项
export function listEnabledTagOptions() {
  return request({
    url: '/system/tag/category/enabled-options',
    method: 'get'
  })
}

// 修改标签分类状态
export function updateTagCategoryStatus(data) {
  return request({
    url: '/system/tag/category/status',
    method: 'put',
    data
  })
}

// 查询标签列表
export function listCustomerTag(query) {
  return request({
    url: '/system/tag/category/tag/list',
    method: 'get',
    params: query
  })
}

// 添加标签
export function addCustomerTag(data) {
  return request({
    url: '/system/tag/category/tag',
    method: 'post',
    data
  })
}

// 修改标签状态
export function updateCustomerTagStatus(data) {
  return request({
    url: '/system/tag/category/tag/status',
    method: 'put',
    data
  })
}

// 编辑标签（不允许修改标签名称）
export function updateCustomerTag(data) {
  return request({
    url: '/system/tag/category/tag',
    method: 'put',
    data
  })
}
