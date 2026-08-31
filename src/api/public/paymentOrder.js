import request from '@/utils/request'

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

export function getFinancePaymentOrderList(query) {
  return request({
    url: '/crm/payment/finance/list',
    method: 'get',
    params: query
  })
}

export function auditPaymentOrder(data) {
  return request({
    url: '/crm/payment/audit',
    method: 'put',
    data
  })
}
