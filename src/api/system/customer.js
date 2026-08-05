import request from '@/utils/request'

// 查询巨量引擎广告账户列表
export function listOceanEngineAccount(query) {
  return request({
    url: '/system/customer/list',
    method: 'get',
    params: query
  })
}

// 修改巨量引擎广告账户启用状态
export function editOceanEngineAccountStatus(data) {
  return request({
    url: '/system/customer/edit',
    method: 'put',
    data: data
  })
}
