import router from './router'
// import { ElMessage } from 'element-plus'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import { getToken } from '@/utils/auth'
import { isHttp } from '@/utils/validate'
import useUserStore from '@/store/modules/user'
import useSettingsStore from '@/store/modules/settings'
import usePermissionStore from '@/store/modules/permission'
import useLockStore from '@/store/modules/lock'
import { getQueryObject } from '@/utils/index'
NProgress.configure({ showSpinner: false })

const whiteList = new Set(['/login', '/bind', '/register', '/socialLogin', '/error'])

router.beforeEach(async (to) => {
  NProgress.start()
  const userStore = useUserStore()
  const settingsStore = useSettingsStore()
  const permissionStore = usePermissionStore()
  const lockStore = useLockStore()

  if (!getToken()) {
    // 没有token
    if (whiteList.has(to.path)) {
      // 在免登录白名单，直接进入
      return true
    }

    let toPath = to.fullPath // /index?redirect=/demo
    const obj = getQueryObject(to.fullPath)
    if (obj.redirect) {
      toPath = obj.redirect
    }
    return `/login?redirect=${encodeURIComponent(toPath)}` // 否则全部重定向到登录页
  }

  to.meta.title && settingsStore.setTitle(to.meta.title)
  const isLock = lockStore.isLock

  /* has token*/
  if (to.path === '/login') {
    return { path: '/' }
  }
  if (isLock && to.path !== '/lock') {
    return { path: '/lock' }
  }
  if (!isLock && to.path === '/lock') {
    return { path: '/' }
  }

  if (userStore.roles.length > 0) {
    return true
  }

  // 判断当前用户是否已拉取完user_info信息
  try {
    await userStore.getInfo()
    const accessRoutes = await permissionStore.generateRoutes()
    // 根据roles权限生成可访问的路由表
    accessRoutes.forEach((route) => {
      if (!isHttp(route.path)) {
        router.addRoute(route) // 动态添加可访问路由表
      }
    })
    return { ...to, replace: true } // hack方法 确保addRoutes已完成
  } catch (err) {
    await userStore.logOut()
    // ElMessage.error(err != undefined ? err : '登录失败')
    return { path: '/' }
  }
})

router.afterEach(() => {
  NProgress.done()
})
