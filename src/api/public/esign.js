import request from '@/utils/request'

// 创建合同前检查主体是否已授权e签宝并选择合同模板
export function checkContractCreateConfig(subjectId) {
  return request({
    url: `/openApi/ESign/contract-create-check/${subjectId}`,
    method: 'get'
  })
}

// 获取企业盖章或乙方签署链接
export function getContractSignUrl(contractId, linkType) {
  return request({
    url: '/openApi/ESign/sign-url',
    method: 'post',
    data: { contractId, linkType }
  })
}
