import request from '@/utils/request'

// 查询可用枚举类型
export function getEnumTypes() {
  return request({
    url: '/system/enum/types',
    method: 'get'
  })
}

// 根据枚举名称查询下拉数据
export function getEnumOptions(enumName) {
  return request({
    url: '/system/enum/type/' + enumName,
    method: 'get'
  })
}

// 批量查询枚举下拉数据
export function getEnums(enumNames) {
  return request({
    url: '/system/enum/types',
    method: 'post',
    data: enumNames
  })
}
