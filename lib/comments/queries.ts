import "server-only";

import { resolvePublicDiscussionRead } from "@/lib/comments/domain";
import { withCommentsReadDeadline } from "@/lib/comments/read-deadline";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { PublicDiscussionResult } from "@/types/comments";

const PUBLIC_ROOT_LIMIT = 50;

export async function getPublicWritingDiscussion(articleId: string): Promise<PublicDiscussionResult> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(articleId)) {
    return { status: "unavailable", state: null, comments: [] };
  }

  try {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) {
      return { status: "unavailable", state: null, comments: [] };
    }
    const supabase = getSupabaseServerClient();
    const results = await withCommentsReadDeadline(
      (signal) => Promise.all([
        supabase
          .from("writing_articles")
          .select("id")
          .eq("id", articleId)
          .eq("status", "published")
          .not("published_at", "is", null)
          .abortSignal(signal)
          .maybeSingle(),
        supabase
          .from("writing_discussions")
          .select("state")
          .eq("article_id", articleId)
          .abortSignal(signal)
          .maybeSingle(),
        supabase
          .from("writing_comments")
          .select("id, guest_display_name, body, created_at")
          .eq("article_id", articleId)
          .eq("moderation_status", "visible")
          .is("parent_comment_id", null)
          .order("created_at", { ascending: true })
          .order("id", { ascending: true })
          .limit(PUBLIC_ROOT_LIMIT)
          .abortSignal(signal),
      ]),
      null,
    );
    if (!results) return { status: "unavailable", state: null, comments: [] };
    const [articleResult, settingsResult, commentsResult] = results;
    return resolvePublicDiscussionRead(articleResult, settingsResult, commentsResult);
  } catch {
    return { status: "unavailable", state: null, comments: [] };
  }
}
