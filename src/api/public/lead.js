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
