// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://saleel-alsawarim.pages.dev',
  output: 'static',
  publicDir: './public',
  srcDir: './src',

  build: {
    assets: 'assets',
    inlineStylesheets: 'auto',
  },

  compressHTML: true,

  integrations: [
    mdx(),
  ],

  server: {
    host: true,
    port: 4321,
  },

  markdown: {
    shikiConfig: {
      theme: 'github-dark',
      wrap: true,
    },
    smartypants: true,
    gfm: true,
  },
});
