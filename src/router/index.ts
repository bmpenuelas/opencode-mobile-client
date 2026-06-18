import { createRouter, createWebHashHistory } from 'vue-router'
import LandingScreen from '@/components/LandingScreen.vue'
import ServerList from '@/components/ServerList.vue'
import ServerProfileForm from '@/components/ServerProfileForm.vue'
import SettingsScreen from '@/components/SettingsScreen.vue'
import HelpScreen from '@/components/HelpScreen.vue'
import ConnectionShell from '@/components/ConnectionShell.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'landing',
      component: LandingScreen,
    },
    {
      path: '/servers',
      name: 'servers',
      component: ServerList,
    },
    {
      path: '/servers/new',
      name: 'server-new',
      component: ServerProfileForm,
    },
    {
      path: '/servers/:id/edit',
      name: 'server-edit',
      component: ServerProfileForm,
    },
    {
      path: '/settings',
      name: 'settings',
      component: SettingsScreen,
    },
    {
      path: '/help',
      name: 'help',
      component: HelpScreen,
    },
    {
      path: '/connect/:id',
      name: 'connect',
      component: ConnectionShell,
    },
  ],
})

export default router
