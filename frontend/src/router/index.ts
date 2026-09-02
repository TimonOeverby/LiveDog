import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes: RouteRecordRaw[] = [
    {
        path: '/',
        name: 'Home',
        component: () => import('@/views/HomeView.vue')
    },
    {
        path: '/login',
        name: 'Login',
        component: () => import('@/views/LoginView.vue')
    },
    {
        path: '/register',
        name: 'Register',
        component: () => import('@/views/RegisterView.vue')
    },
    {
        path: '/competitions',
        name: 'Competitions',
        component: () => import('@/views/CompetitionsView.vue')
    },
    {
        path: '/contact',
        name: 'Contact',
        component: () => import('@/views/ContactView.vue')
    },
    {
        path: '/dogs',
        name: 'Dogs',
        component: () => import('@/views/DogsView.vue')
    },
    {
        path: '/users',
        name: 'Users',
        component: () => import('@/views/UsersView.vue')
    },
    {
        path: '/my-profile',
        name: 'MyProfile',
        component: () => import('@/views/MyProfileView.vue')
    },
    {
        path: '/createDogs',
        name: 'Dog',
        component: () => import('@/views/CreateDogView.vue')
    },
    {
        path: '/advertisment',
        name: 'Advertisment',
        component: () => import('@/views/AdvertismentWiev.vue')
    },
    {
        path: '/admin-dashboard',
        name: 'AdminDashboard',
        component: () => import('@/views/AdminDashboardView.vue'),
        meta: { requiresAdmin: true, hideAdvertisements: true, adminRealm: true }
    }
]

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes
})

router.beforeEach((to) => {
    if (!to.meta.requiresAdmin) {
        return true
    }

    const authStore = useAuthStore()

    if (authStore.isAdmin) {
        return true
    }

    return '/'
})

export default router
