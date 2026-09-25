// ============================================================
// صليل الصوارم — الاتصال بـ Supabase
// ============================================================
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';

// ------------------------------------------------------------
// 1. قراءة مفاتيح البيئة
// ------------------------------------------------------------
// ⚠️ تُضاف في Cloudflare Pages لاحقًا كمتغيرات بيئة
const SUPABASE_URL =
  import.meta.env.PUBLIC_SUPABASE_URL ||
  'https://ypmeskvlpxmnuhwjwtje.supabase.co';

const SUPABASE_ANON_KEY =
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY || '';

// ------------------------------------------------------------
// 2. إنشاء العميل (Singleton)
// ------------------------------------------------------------
let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (_client) return _client;

  if (!SUPABASE_ANON_KEY) {
    console.warn(
      '[Supabase] تحذير: لم يتم ضبط PUBLIC_SUPABASE_ANON_KEY — ' +
      'بعض الميزات (التعليقات، الإعجابات) لن تعمل.'
    );
  }

  _client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY || 'public-anon-key', {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
  });

  return _client;
}

// ------------------------------------------------------------
// 3. المصادقة (Authentication)
// ------------------------------------------------------------

/**
 * تسجيل الدخول عبر Google
 * @param redirectTo مسار العودة بعد نجاح الدخول
 */
export async function signInWithGoogle(redirectTo = '/') {
  const supabase = getSupabase();
  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}${redirectTo}`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) throw error;
  return data;
}

/** تسجيل الخروج */
export async function signOut() {
  const supabase = getSupabase();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  if (typeof window !== 'undefined') {
    window.location.href = '/';
  }
}

/** جلب المستخدم الحالي */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user;
}

/** الاستماع لتغيّرات حالة الدخول */
export function onAuthChange(callback: (user: User | null) => void) {
  const supabase = getSupabase();
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });
  return data.subscription;
}

// ------------------------------------------------------------
// 4. التعليقات
// ------------------------------------------------------------

export interface Comment {
  id: string;
  post_slug: string;
  user_id: string;
  content: string;
  created_at: string;
  parent_id: string | null;
  user_name?: string;
  user_avatar?: string;
}

/** جلب تعليقات منشور */
export async function getComments(postSlug: string): Promise<Comment[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('post_slug', postSlug)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[comments] فشل الجلب:', error.message);
    return [];
  }
  return (data as Comment[]) || [];
}

/** إضافة تعليق */
export async function addComment(
  postSlug: string,
  content: string,
  parentId: string | null = null
): Promise<Comment | null> {
  const supabase = getSupabase();
  const user = await getCurrentUser();
  if (!user) throw new Error('يجب تسجيل الدخول أولًا');

  const trimmed = content.trim();
  if (trimmed.length < 2) throw new Error('التعليق قصير جدًا');
  if (trimmed.length > 2000) throw new Error('التعليق طويل جدًا');

  const { data, error } = await supabase
    .from('comments')
    .insert({
      post_slug: postSlug,
      user_id: user.id,
      content: trimmed,
      parent_id: parentId,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Comment;
}

/** حذف تعليق (المستخدم نفسه فقط) */
export async function deleteComment(commentId: string) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId);
  if (error) throw error;
}

/** عدد تعليقات منشور */
export async function getCommentsCount(postSlug: string): Promise<number> {
  const supabase = getSupabase();
  const { count, error } = await supabase
    .from('comments')
    .select('*', { count: 'exact', head: true })
    .eq('post_slug', postSlug);

  if (error) return 0;
  return count || 0;
}

// ------------------------------------------------------------
// 5. الإعجابات
// ------------------------------------------------------------

/** عدد إعجابات منشور */
export async function getLikesCount(postSlug: string): Promise<number> {
  const supabase = getSupabase();
  const { count, error } = await supabase
    .from('likes')
    .select('*', { count: 'exact', head: true })
    .eq('post_slug', postSlug);

  if (error) return 0;
  return count || 0;
}

/** هل أعجب المستخدم بهذا المنشور؟ */
export async function hasUserLiked(postSlug: string): Promise<boolean> {
  const supabase = getSupabase();
  const user = await getCurrentUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from('likes')
    .select('id')
    .eq('post_slug', postSlug)
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) return false;
  return !!data;
}

/** تبديل حالة الإعجاب (إضافة/إزالة) */
export async function toggleLike(
  postSlug: string
): Promise<{ liked: boolean; count: number }> {
  const supabase = getSupabase();
  const user = await getCurrentUser();
  if (!user) throw new Error('يجب تسجيل الدخول أولًا');

  const alreadyLiked = await hasUserLiked(postSlug);

  if (alreadyLiked) {
    const { error } = await supabase
      .from('likes')
      .delete()
      .eq('post_slug', postSlug)
      .eq('user_id', user.id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('likes')
      .insert({ post_slug: postSlug, user_id: user.id });
    if (error) throw error;
  }

  const count = await getLikesCount(postSlug);
  return { liked: !alreadyLiked, count };
}

// ------------------------------------------------------------
// 6. أدوات مساعدة
// ------------------------------------------------------------

/** تنسيق التاريخ بالعربية */
export function formatDateArabic(iso: string): string {
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(d);
  } catch {
    return iso;
  }
}

/** منذ متى (منذ ساعتين، منذ 3 أيام...) */
export function timeAgo(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const sec = Math.floor(diff / 1000);
    const min = Math.floor(sec / 60);
    const hr = Math.floor(min / 60);
    const day = Math.floor(hr / 24);

    if (sec < 60) return 'الآن';
    if (min < 60) return `منذ ${min} دقيقة`;
    if (hr < 24) return `منذ ${hr} ساعة`;
    if (day < 30) return `منذ ${day} يوم`;
    return formatDateArabic(iso);
  } catch {
    return iso;
  }
}
