import "server-only";

import { resolvePublicDiscussionRead } from "@/lib/comments/domain";
import { withCommentsReadDeadline } from "@/lib/comments/read-deadline";
import { createAccountCommentFormToken, createCommentFormToken } from "@/lib/comments/security";
import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { DiscussionParticipation, WritingDiscussionPageData } from "@/types/comments";

const PUBLIC_ROOT_LIMIT = 50;

const unavailable: WritingDiscussionPageData = {
  discussion: { status: "unavailable", state: null, comments: [] },
  participation: { kind: "unavailable" },
};

function guestParticipation(articleId: string): DiscussionParticipation {
  const secret = process.env.WRITING_COMMENTS_FORM_TOKEN_SECRET;
  return { kind: "guest", formToken: secret ? createCommentFormToken(articleId, secret) : null };
}

export async function getWritingDiscussionPageData(articleId: string): Promise<WritingDiscussionPageData> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(articleId)) {
    return unavailable;
  }

  try {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) {
      return unavailable;
    }
    const supabase = getSupabaseServerClient();
    const results = await withCommentsReadDeadline(
      async (signal) => {
        const auth = await createSupabaseAuthServerClient();
        const [articleResult, settingsResult, userResult] = await Promise.all([
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
          auth.auth.getUser(),
        ]);

        const actorUserId = !userResult.error && userResult.data.user
          ? userResult.data.user.id
          : null;
        const [commentsResult, profileResult] = await Promise.all([
          supabase
            .rpc("list_public_writing_comments_for_viewer", {
              p_article_id: articleId,
              p_actor_user_id: actorUserId,
            })
            .limit(PUBLIC_ROOT_LIMIT)
            .abortSignal(signal),
          actorUserId
            ? supabase
                .from("bts_account_profiles")
                .select("display_name")
                .eq("user_id", actorUserId)
                .is("deleted_at", null)
                .abortSignal(signal)
                .maybeSingle()
            : Promise.resolve({ data: null, error: null }),
        ]);

        const discussion = resolvePublicDiscussionRead(articleResult, settingsResult, commentsResult);
        if (discussion.status === "unavailable") return { discussion, participation: { kind: "unavailable" } as const };
        if (!actorUserId) {
          return { discussion, participation: guestParticipation(articleId) };
        }

        if (profileResult.error) {
          return { discussion, participation: { kind: "unavailable" } as const };
        }
        if (!profileResult.data) {
          return { discussion, participation: { kind: "profile-setup" } as const };
        }

        const secret = process.env.WRITING_COMMENTS_FORM_TOKEN_SECRET;
        return {
          discussion,
          participation: {
            kind: "account" as const,
            displayName: profileResult.data.display_name,
            formToken: secret
              ? createAccountCommentFormToken(articleId, actorUserId, secret)
              : null,
          },
        };
      },
      null,
    );
    return results ?? unavailable;
  } catch {
    return unavailable;
  }
}
