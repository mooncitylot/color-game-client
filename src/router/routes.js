import { pathToRegexp } from 'path-to-regexp'

export const routes = {
  LOGIN: {
    path: '/login',
    componentPath: 'login/login-container',
    componentName: 'login-container',
    isPublic: true,
  },
  SIGNUP: {
    path: '/signup',
    componentPath: 'signup/signup-container',
    componentName: 'signup-container',
    isPublic: true,
  },
  DASHBOARD: {
    path: '/dashboard',
    componentPath: 'dashboard/dashboard-container',
    componentName: 'dashboard-container',
    isPublic: false,
  },
  SCANNER: {
    path: '/scanner',
    componentPath: 'scanner/scanner-container',
    componentName: 'scanner-container',
    isPublic: false,
  },
  ADMIN: {
    path: '/admin',
    componentPath: 'admin/admin-container',
    componentName: 'admin-container',
    isPublic: false,
  },
}

// Add pathRegexp to each route
Object.values(routes).forEach((route) => {
  route.pathRegexp = pathToRegexp(route.path)
})

export function getRouteByPath(pathname) {
  return Object.values(routes).find((route) => route.pathRegexp.test(pathname))
}

export default routes
