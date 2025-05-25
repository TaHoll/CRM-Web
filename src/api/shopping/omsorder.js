import request from '@/utils/request'
import { downFile } from '@/utils/request'

/**
 * 订单管理分页查询
 * @param {查询条件} data
 */
export function listOMSOrder(query) {
  return request({
    url: 'shopping/Order/list',
    method: 'get',
    params: query
  })
}

/**
 * 新增订单管理
 * @param data
 */
export function addOMSOrder(data) {
  return request({
    url: 'shopping/Order',
    method: 'post',
    data: data
  })
}
/**
 * 修改订单管理
 * @param data
 */
export function updateOMSOrder(data) {
  return request({
    url: 'shopping/Order',
    method: 'PUT',
    data: data
  })
}

/**
 * 获取订单管理详情
 * @param {Id}
 */
export function getOMSOrder(id) {
  return request({
    url: 'shopping/Order/' + id,
    method: 'get'
  })
}

/**
 * 删除订单管理
 * @param {主键} pid
 */
export function delOMSOrder(pid) {
  return request({
    url: 'shopping/Order/delete/' + pid,
    method: 'POST'
  })
}
// 导出订单管理
export async function exportOMSOrder(query) {
  await downFile('shopping/Order/export', { ...query })
}

/**
 * 查詢銷售統計
 * @param {查询条件} data
 */
export function listSales(query) {
  return request({
    url: 'shopping/Order/getSales',
    method: 'get',
    params: query
  })
}
export function listSalesTrade(query) {
  return request({
    url: 'shopping/Order/getSalesTrade',
    method: 'get',
    params: query
  })
}
/**
 * 查詢前n的商品
 * @param {} query
 * @returns
 */
export function listSaleTopProduct(query) {
  return request({
    url: 'shopping/Order/getSaleTopProduct',
    method: 'get',
    params: query
  })
}
