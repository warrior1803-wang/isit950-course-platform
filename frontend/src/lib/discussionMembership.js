import { membershipApi } from '../api';

const PLACEHOLDER_DISCUSSION_MEMBERSHIP = {
  isMember: false,
  weeklyPostsUsed: 'x',
  weeklyPostsLimit: 10,
  remaining: 'x',
  resetsAt: null,
  isPlaceholder: true,
};

function normalizeDiscussionMembership(membership, limits) {
  const isMember = membership?.type === 'MEMBER';
  const posts = limits?.posts;

  if (!posts) return null;

  return {
    isMember,
    weeklyPostsUsed: isMember ? null : (posts.used ?? 0),
    weeklyPostsLimit: isMember ? null : (posts.limit ?? 10),
    remaining: isMember ? null : (posts.remaining ?? Math.max((posts.limit ?? 10) - (posts.used ?? 0), 0)),
    resetsAt: posts.resetsAt ?? null,
  };
}

export async function loadDiscussionMembershipState() {
  try {
    const [membershipRes, limitsRes] = await Promise.all([
      membershipApi.getCurrent(),
      membershipApi.getLimits(),
    ]);

    return normalizeDiscussionMembership(membershipRes.data, limitsRes.data);
  } catch {
    return PLACEHOLDER_DISCUSSION_MEMBERSHIP;
  }
}

export function incrementDiscussionUsage(state) {
  if (!state || state.isMember) return state;
  if (state.isPlaceholder) return state;

  const nextUsed = (state.weeklyPostsUsed ?? 0) + 1;
  const nextLimit = state.weeklyPostsLimit ?? 10;

  return {
    ...state,
    weeklyPostsUsed: nextUsed,
    remaining: Math.max(nextLimit - nextUsed, 0),
  };
}

export function hasReachedDiscussionLimit(state) {
  if (!state || state.isMember) return false;
  if (state.isPlaceholder) return false;
  if (state.weeklyPostsLimit == null) return false;
  return (state.weeklyPostsUsed ?? 0) >= state.weeklyPostsLimit;
}

export function formatDiscussionResetText(resetsAt) {
  if (!resetsAt) return 'Weekly limits refresh automatically';

  const parsed = new Date(resetsAt);
  if (Number.isNaN(parsed.getTime())) return 'Weekly limits refresh automatically';

  const weekday = parsed.toLocaleDateString('en-AU', { weekday: 'long' });
  const day = parsed.toLocaleDateString('en-AU', { day: 'numeric' });
  const month = parsed.toLocaleDateString('en-AU', { month: 'short' });
  const time = parsed.toLocaleTimeString('en-AU', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).replace(' ', '');

  return `⏱ Limits reset ${weekday} ${day} ${month} at ${time} AEST`;
}
