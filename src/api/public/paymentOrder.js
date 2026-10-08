import request from '@/utils/request'

export function getDashboardPaymentStatistics() {
  return request({
    url: '/crm/payment/dashboard/statistics',
    method: 'get'
  })
}

export function getPaymentOrderList(clueId) {
  return request({
    url: '/crm/payment/list',
    method: 'get',
    params: { clueId }
  })
}

export function addPaymentOrder(data) {
  return request({
    url: '/crm/payment/add',
    method: 'post',
    data
  })
}

export function resubmitPaymentOrder(data) {
  return request({
    url: '/crm/payment/resubmit',
    method: 'put',
    data
  })
}

export function getFinancePaymentOrderList(query) {
  return request({
    url: '/crm/payment/finance/list',
    method: 'get',
    params: query
  })
}

export function getPaymentRefundList(query) {
  return request({
    url: '/crm/payment/refund/list',
    method: 'get',
    params: query
  })
}

export function addPaymentRefund(data) {
  return request({
    url: '/crm/payment/refund/add',
    method: 'post',
    data
  })
}

export function getRefundManagementList(query) {
  return request({
    url: '/crm/payment/refund/manage/list',
    method: 'get',
    params: query
  })
}

export function auditPaymentRefund(data) {
  return request({
    url: '/crm/payment/refund/audit',
    method: 'put',
    data
  })
}

export function completePaymentRefund(data) {
  return request({
    url: '/crm/payment/refund/complete',
    method: 'put',
    data
  })
}

export function auditPaymentOrder(data) {
  return request({
    url: '/crm/payment/audit',
    method: 'put',
    data
  })
}
