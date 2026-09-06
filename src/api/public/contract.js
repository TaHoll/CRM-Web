import request from '@/utils/request'

// 创建客户合同
export function addContract(data) {
  return request({
    url: '/crm/contract/add',
    method: 'post',
    data
  })
}

// 编辑审核中的客户合同
export function updateContract(data) {
  return request({
    url: '/crm/contract/edit',
    method: 'put',
    data
  })
}

// 创建合同前检查当前线索是否满足创建条件
export function checkContractCreate(clueId) {
  return request({
    url: '/crm/contract/create-check',
    method: 'get',
    params: { clueId }
  })
}

// 查询指定线索的合同列表
export function getContractList(clueId) {
  return request({
    url: '/crm/contract/list',
    method: 'get',
    params: { clueId }
  })
}

// 分页查询合同审核列表
export function getContractAuditList(query) {
  return request({
    url: '/crm/contract/audit/list',
    method: 'get',
    params: query
  })
}

// 审核客户合同
export function auditContract(data) {
  return request({
    url: '/crm/contract/audit',
    method: 'put',
    data
  })
}
