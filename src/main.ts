import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import './styles/base.css'

document.addEventListener('gesturestart', (e) => e.preventDefault())

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
