// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// ============================================================
// إعدادات موقع صليل الصوارم
// ============================================================
// الموقع يدعم لغتين:
//   - العربية (افتراضية) على المسار  /
//   - الإنجليزية على المسار        /en/
// ============================================================

export default defineConfig({
  // رابط الموقع النهائي (سنغيّره لاحقًا إن ربطنا دومين خاص)
  site: 'https://saleel-alsawarim.pages.dev',

  // البناء الثابت (الأسرع والأخف والأرخص — مجاني على Cloudflare)
  output: 'static',

  // مجلد الملفات العامة (الصور، الأيقونات، الخطوط)
  publicDir: './public',

  // مجلد ملفات المصدر
  srcDir: './src',

  // مسار الملفات الثابتة داخل البناء
  build: {
    assets: 'assets',
    inlineStylesheets: 'auto',
  },

  // ضغط الـ HTML النهائي
  compressHTML: true,

  // إعدادات اللغة والتوجيه (RTL/LTR)
  i18n: {
    defaultLocale: 'ar',
    locales: ['ar', 'en'],
    routing: {
      prefixDefaultLocale: false, // العربية على / مباشرة، الإنجليزية على /en/
    },
  },

  // إضافات Astro
  integrations: [
    // دعم ملفات MDX (Markdown + JSX) للمنشورات المتقدمة
    mdx(),

    // توليد خريطة الموقع تلقائيًا
    sitemap({
      i18n: {
        defaultLocale: 'ar',
        locales: {
          ar: 'ar-SA',
          en: 'en-US',
        },
      },
      filter: (page) => !page.includes('/admin'),
      changefreq: 'daily',
      priority: 0.7,
      lastmod: new Date(),
    }),
  ],

  // إعدادات الصور
  image: {
    service: {
      entrypoint: 'astro/assets/services/sharp',
    },
  },

  // إعدادات خادم التطوير (للاستخدام المحلي فقط)
  server: {
    host: true,
    port: 4321,
  },

  // تحسينات Markdown
  markdown: {
    shikiConfig: {
      theme: 'github-dark',
      wrap: true,
    },
    smartypants: true,
    gfm: true,
  },

  // إعدادات Vite لتحسين البناء
  vite: {
    build: {
      cssMinify: 'lightningcss',
    },
    ssr: {
      noExternal: ['reading-time'],
    },
  },
});
