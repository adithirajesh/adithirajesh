// import glsl from 'vite-plugin-glsl';

// export default {
//   base: '/threejs-water-shader/',
//   build: {
//     sourcemap: true
//   },
//   plugins: [glsl()]
// } 

import { defineConfig } from 'vite'

export default defineConfig({
  base: './', // forces relative paths, not /threejs-water-shader/
  assetsInclude: ['**/*.hdr'],
  server: {
    host: true,
    port: 5173
  }
  
})
