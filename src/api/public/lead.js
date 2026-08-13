import request from '@/utils/request'

/**
 * 查询线索池
 * @param {{ pager: { pageNum: number, pageSize: number } }} data
 */
export function listLead(data) {
  return request({
    url: '/crm/lead/list',
    method: 'post',
    data
  })
}

export function assignLead(data) {
  return request({
    url: '/crm/lead/assign',
    method: 'post',
    data
  })
}

export function customerList(data) {
  return request({
    url: '/crm/lead/customerList',
    method: 'post',
    data
  })
}

export function getTelephone(clueId) {
  return request({
    url: '/crm/lead/telephone',
    method: 'get',
    params: { clueId }
  })
}

export function updateCustomer(data) {
  return request({
    url: '/crm/lead/customer',
    method: 'put',
    data
  })
}

export function followLogList(clueId) {
  return request({
    url: '/crm/lead/loglist',
    method: 'get',
    params: { clueId }
  })
}

export function addFollowLog(data) {
  return request({
    url: '/crm/lead/addlog',
    method: 'post',
    data
  })
}

export function userQuotaList(query) {
  return request({
    url: '/crm/lead/UserQuotaList',
    method: 'get',
    params: query
  })
}

export function userQuotaSave(data) {
  return request({
    url: '/crm/lead/UserQuotaSave',
    method: 'post',
    data
  })
}
