const pkg = require('./package.json')

export default {
  ssr: false,
  target: 'static',
  telemetry: false,
  env: {
    PROD: '1',
    ANDROID_APP_URL: 'https://play.google.com/store/apps/details?id=com.audiobookshelf.app',
    IOS_APP_URL: ''
  },

  publicRuntimeConfig: {
    version: pkg.version
  },

  head: {
    title: 'Datahorders',
    htmlAttrs: {
      lang: 'en'
    },
    meta: [{ charset: 'utf-8' }, { name: 'viewport', content: 'viewport-fit=cover, width=device-width, initial-scale=1, user-scalable=no, maximum-scale=1' }, { hid: 'description', name: 'description', content: '' }, { name: 'format-detection', content: 'telephone=no' }],
    script: [
      {
        src: '/libs/sortable.js'
      }
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
      // Preload icon font to prevent missing icons with large libraries
      { rel: 'preload', href: '/fonts/absicons/absicons.woff', as: 'font', type: 'font/woff', crossorigin: 'anonymous' }
    ]
  },

  css: ['@/assets/tailwind.css', '@/assets/app.css'],

  plugins: ['@/plugins/server.js', '@/plugins/db.js', '@/plugins/localStore.js', '@/plugins/init.client.js', '@/plugins/axios.js', '@/plugins/nativeHttp.js', '@/plugins/capacitor/index.js', '@/plugins/capacitor/AbsAudioPlayer.js', '@/plugins/toast.js', '@/plugins/constants.js', '@/plugins/haptics.js', '@/plugins/i18n.js'],

  components: true,

  modules: ['@nuxtjs/axios'],

  axios: {},

  build: {
    postcss: {
      postcssOptions: {
        plugins: {
          tailwindcss: {},
          autoprefixer: {}
        }
      }
    },
    babel: {
      plugins: [['@babel/plugin-proposal-private-property-in-object', { loose: true }]]
    }
  }
}
