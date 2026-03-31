<template>
  <template v-if="!item.hidden">
    <!-- ✅ 没有子菜单 or 只有一个有效子菜单 -->
    <el-menu-item v-if="isSingleMenu" :index="resolvePath(finalChild.path)">
      <app-link :to="resolvePath(finalChild.path, finalChild.query)">
        <svg-icon class="menu-icon" :name="finalChild.meta?.icon || item.meta?.icon" />

        <span v-if="isCollapse && !finalChild.meta?.icon">
          {{ shortTitle(finalChild.meta?.title) }}
        </span>

        <span v-if="finalChild.meta?.titleKey">
          {{ $t(finalChild.meta.titleKey) }}
        </span>
        <span v-else>
          {{ finalChild.meta?.title }}
        </span>

        <svg-icon v-if="finalChild.meta?.isNew == 1 && defaultSettings.menuShowNew" name="new" color="#fff" style="width: 50px; height: 25px" />
      </app-link>
    </el-menu-item>

    <!-- ✅ 有多个子菜单 -->
    <el-sub-menu v-else-if="visibleChildren.length > 0" :index="resolvePath(item.path)">
      <template #title>
        <svg-icon class="menu-icon" :name="item.meta?.icon" />

        <span v-if="item.meta?.titleKey">
          {{ $t(item.meta.titleKey) }}
        </span>
        <span v-else>
          {{ item.meta?.title }}
        </span>

        <svg-icon v-if="item.meta?.isNew == 1 && defaultSettings.menuShowNew" name="new" color="#fff" style="width: 50px; height: 25px" />
      </template>

      <sidebar-item
        v-for="(child, index) in visibleChildren"
        :key="child.path + index"
        :item="child"
        :is-nest="true"
        :base-path="resolvePath(child.path)" />
    </el-sub-menu>
  </template>
</template>

<script setup>
import { isExternal } from '@/utils/validate'
import { getNormalPath } from '@/utils/ruoyi'
import defaultSettings from '@/settings'
import AppLink from './Link.vue'

const props = defineProps({
  item: { type: Object, required: true },
  isNest: { type: Boolean, default: false },
  basePath: { type: String, default: '' },
  isCollapse: { type: Boolean, default: false }
})

/**
 * ✅ 过滤可见子菜单（核心优化点）
 */
const visibleChildren = computed(() => {
  return (props.item.children || []).filter((c) => !c.hidden)
})

/**
 * ✅ 是否单菜单
 */
const isSingleMenu = computed(() => {
  return !props.item.alwaysShow && (visibleChildren.value.length === 0 || visibleChildren.value.length === 1)
})

/**
 * ✅ 最终使用的子节点
 */
const finalChild = computed(() => {
  if (visibleChildren.value.length === 1) {
    return visibleChildren.value[0]
  }
  return { ...props.item, path: '' }
})

/**
 * 路径处理
 */
function resolvePath(routePath, routeQuery) {
  if (isExternal(routePath)) return routePath
  if (isExternal(props.basePath)) return props.basePath

  if (routeQuery) {
    return {
      path: getNormalPath(props.basePath + '/' + routePath),
      query: JSON.parse(routeQuery)
    }
  }

  return getNormalPath(props.basePath + '/' + routePath)
}

/**
 * 标题缩短
 */
function shortTitle(title) {
  if (!title) return ''
  return title.length > 1 ? title.charAt(0) + '...' : title
}
</script>
