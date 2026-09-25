// ============================================================
// صليل الصوارم — تعريف بنية المحتوى
// ============================================================
import { defineCollection, z } from 'astro:content';

// ------------------------------------------------------------
// 1. التصنيفات الرئيسية (ثابتة — يمكن التوسع)
// ------------------------------------------------------------
const CATEGORIES = [
  // أقسام عامة
  'durus',       // دروس
  'maqalat',     // مقالات
  'fatawa',      // فتاوى
  'athar',       // أثر ودليل
  'tazkiya',     // تزكية
  'manhaj',      // منهج
  'misc',        // متفرقات
] as const;

// ------------------------------------------------------------
// 2. المجموعة: المنشورات
// ------------------------------------------------------------
const posts = defineCollection({
  type: 'content',

  schema: ({ image }) =>
    z.object({
      // العنوان الرئيسي
      title: z
        .string()
        .min(3, 'العنوان قصير جدًا')
        .max(200, 'العنوان طويل جدًا'),

      // الوصف المختصر (يظهر في الكروت والبحث)
      description: z
        .string()
        .min(10, 'الوصف قصير جدًا')
        .max(300, 'الوصف طويل جدًا'),

      // تاريخ النشر
      pubDate: z.coerce.date(),

      // تاريخ آخر تحديث (اختياري)
      updatedDate: z.coerce.date().optional(),

      // الصورة الرئيسية (تُرفع عبر لوحة التحكم)
      image: z
        .object({
          src: image(),
          alt: z.string().min(3).max(200),
        })
        .optional(),

      // التصنيف الرئيسي
      category: z.enum(CATEGORIES),

      // تصنيفات فرعية (اختياري)
      subcategory: z.string().max(50).optional(),

      // السلسلة التي ينتمي إليها المنشور (اختياري)
      series: z
        .object({
          slug: z.string().regex(/^[a-z0-9-]+$/i, 'معرّف السلسلة بالحروف الإنجليزية فقط'),
          order: z.number().int().positive().optional(),
        })
        .optional(),

      // الكلمات المفتاحية (للوسوم والبحث)
      tags: z.array(z.string().max(50)).default([]),

      // المؤلف (ثابت للموقع)
      author: z.string().default('مسلم موحّد'),

      // حالة النشر
      draft: z.boolean().default(false),

      // منشور مميز (يظهر في أعلى الصفحة)
      featured: z.boolean().default(false),

      // اللغة
      lang: z.enum(['ar', 'en']).default('ar'),

      // وقت القراءة المتوقع (بالدقائق — يُحسب تلقائيًا في الواجهة)
      readingTime: z.number().optional(),

      // الآيات والأحاديث المذكورة (للمنشورات العلمية)
      references: z
        .array(
          z.object({
            type: z.enum(['quran', 'hadith', 'book', 'scholar']),
            text: z.string(),
            source: z.string().optional(),
          })
        )
        .default([]),

      // هل المنشور منسوخ/منقول؟
      isQuote: z.boolean().default(false),
      quoteSource: z.string().optional(),
    }),
});

// ------------------------------------------------------------
// 3. المجموعة: السلاسل
// ------------------------------------------------------------
const series = defineCollection({
  type: 'content',

  schema: ({ image }) =>
    z.object({
      // عنوان السلسلة
      title: z.string().min(3).max(150),

      // وصف السلسلة
      description: z.string().min(10).max(500),

      // التصنيف الرئيسي للسلسلة
      category: z.enum(CATEGORIES),

      // صورة السلسلة
      image: z
        .object({
          src: image(),
          alt: z.string().min(3).max(200),
        })
        .optional(),

      // تاريخ بداية السلسلة
      startDate: z.coerce.date().optional(),

      // هل السلسلة مكتملة؟
      complete: z.boolean().default(false),

      // ترتيب السلسلة في العرض
      order: z.number().int().default(0),

      // منشورات السلسلة (يُبنى تلقائيًا)
      lang: z.enum(['ar', 'en']).default('ar'),
    }),
});

// ------------------------------------------------------------
// 4. المجموعة: التصنيفات (وصف كل تصنيف)
// ------------------------------------------------------------
const categories = defineCollection({
  type: 'data',

  schema: z.object({
    // العنوان بالعربية
    title: z.string(),

    // العنوان بالإنجليزية
    titleEn: z.string().optional(),

    // الوصف
    description: z.string(),

    // الأيقونة (اسم أيقونة SVG)
    icon: z.string().default('book'),

    // اللون الأساسي (اختياري)
    color: z.string().optional(),

    // ترتيب العرض
    order: z.number().int().default(0),
  }),
});

// ------------------------------------------------------------
// 5. تصدير المجموعات
// ------------------------------------------------------------
export const collections = {
  posts,
  series,
  categories,
};
