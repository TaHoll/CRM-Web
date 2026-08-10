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
