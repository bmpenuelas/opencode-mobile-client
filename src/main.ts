import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import { applyDocumentLocale, i18n, useI18n } from './i18n'
import './styles/base.css'

document.addEventListener('gesturestart', (e) => e.preventDefault())

applyDocumentLocale(useI18n().locale.value)

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(i18n)
app.mount('#app')
