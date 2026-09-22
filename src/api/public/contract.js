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
export function checkContractCreate(assignId) {
  return request({
    url: '/crm/contract/create-check',
    method: 'get',
    params: { assignId }
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

// 根据合同ID获取文件下载链接
export function getContractDownloadUrl(contractId) {
  return request({
    url: `/crm/contract/${contractId}/download-url`,
    method: 'get'
  })
}

// 分页查询客户合同订单列表
export function getContractOrderList(query) {
  return request({
    url: '/crm/contract/order/list',
    method: 'get',
    params: query
  })
}

// 分页查询可发起退款的合同
export function getRefundContractList(query) {
  return request({
    url: '/crm/contract/refund/list',
    method: 'get',
    params: query
  })
}

// 查询合同下审核通过的付款记录
export function getRefundPaymentList(contractId) {
  return request({
    url: `/crm/contract/${contractId}/refund/payments`,
    method: 'get'
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

// 撤销签署中的客户合同
export function revokeContract(contractId) {
  return request({
    url: `/crm/contract/revoke/${contractId}`,
    method: 'put'
  })
}

// 完成已盖章合同的签署
export function completeContract(contractId) {
  return request({
    url: `/crm/contract/complete/${contractId}`,
    method: 'put'
  })
}
