// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false,
  
  compatibilityDate: '2024-11-01',
  
  devtools: { enabled: true },

  modules: ['@nuxt/icon', '@nuxtjs/tailwindcss', 'shadcn-nuxt', 'motion-v/nuxt'],

  shadcn: {
    /**
     * Prefix for all the imported component
     */
    prefix: '',
    /**
     * Directory that the component lives in.
     * @default "./components/ui"
     */
    componentDir: './components/ui'
  },

  css: ['~/assets/css/tailwind.css'],
})