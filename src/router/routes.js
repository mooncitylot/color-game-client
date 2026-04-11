import { pathToRegexp } from "path-to-regexp";

export const routes = {
  LOGIN: {
    path: "/login",
    componentPath: "login/login-container",
    componentName: "login-container",
    isPublic: true,
    showNav: false,
    showHeader: true,
  },
  SIGNUP: {
    path: "/signup",
    componentPath: "signup/signup-container",
    componentName: "signup-container",
    isPublic: true,
    showNav: false,
    showHeader: true,
  },
  DASHBOARD: {
    path: "/dashboard",
    componentPath: "dashboard/dashboard-container",
    componentName: "dashboard-container",
    isPublic: false,
    showNav: true,
    showHeader: true,
  },
  LEADERBOARD: {
    path: "/leaderboard",
    componentPath: "leaderboard/leaderboard-container",
    componentName: "leaderboard-container",
    isPublic: false,
    showNav: true,
    showHeader: true,
  },
  SCANNER: {
    path: "/scanner",
    componentPath: "scanner/scanner-container",
    componentName: "scanner-container",
    isPublic: false,
    showNav: true,
    showHeader: true,
  },
  ADMIN: {
    path: "/admin",
    componentPath: "admin/admin-container",
    componentName: "admin-container",
    isPublic: false,
    showNav: true,
    showHeader: true,
  },
  STORE: {
    path: "/store",
    componentPath: "store/store-container",
    componentName: "store-container",
    isPublic: false,
    showNav: true,
    showHeader: true,
  },
  FRIENDS: {
    path: "/friends",
    componentPath: "friends/friends-container",
    componentName: "friends-container",
    isPublic: false,
    showNav: true,
    showHeader: true,
  },
  PROFILE: {
    path: "/profile",
    componentPath: "profile/profile-container",
    componentName: "profile-container",
    isPublic: false,
    showNav: true,
    showHeader: true,
  },
  SETTINGS: {
    path: "/settings",
    componentPath: "settings/settings-container",
    componentName: "settings-container",
    isPublic: false,
    showNav: true,
    showHeader: true,
  },
};

// Add pathRegexp to each route
Object.values(routes).forEach((route) => {
  route.pathRegexp = pathToRegexp(route.path);
});

export function getRouteByPath(pathname) {
  return Object.values(routes).find((route) => route.pathRegexp.test(pathname));
}

export default routes;
