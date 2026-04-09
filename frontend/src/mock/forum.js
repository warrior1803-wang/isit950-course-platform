/**
 * Mock data — GET /api/courses/:id/posts  →  { posts }
 *
 * post.authorRole: 'student' | 'instructor'
 * reply.authorRole: 'student' | 'instructor'
 */

let _nextPostId = 9000;
let _nextReplyId = 9500;

const POSTS = {
  1: [
    {
      id: 1001,
      courseId: 1,
      title: 'Question about the research proposal word count',
      body: 'Hi everyone, does the 1500-word limit for the research proposal include the reference list, or is it just the body text? The rubric isn\'t entirely clear on this.',
      author: { id: 1, name: 'Bingyan Wang' },
      authorRole: 'student',
      createdAt: '2026-03-05T11:22:00Z',
      replies: [
        {
          id: 5001,
          postId: 1001,
          body: 'Great question, Bingyan. The 1500 words refers to the body text only — the reference list is excluded from the count.',
          author: { id: 3, name: 'Dr. Mitchell' },
          authorRole: 'instructor',
          createdAt: '2026-03-05T13:45:00Z',
        },
        {
          id: 5002,
          postId: 1001,
          body: 'Thanks Dr. Mitchell! That\'s a relief.',
          author: { id: 1, name: 'Bingyan Wang' },
          authorRole: 'student',
          createdAt: '2026-03-05T14:02:00Z',
        },
      ],
    },
    {
      id: 1002,
      courseId: 1,
      title: 'Recommended databases for literature search?',
      body: 'I\'m struggling to find enough peer-reviewed articles on my topic (AI ethics in healthcare). Which databases would you recommend beyond Google Scholar?',
      author: { id: 2, name: 'Chris Lee' },
      authorRole: 'student',
      createdAt: '2026-03-12T09:15:00Z',
      replies: [
        {
          id: 5003,
          postId: 1002,
          body: 'Try IEEE Xplore, ACM Digital Library, and PubMed. The UOW Library also has great subject guides — search "IT research" on the library website.',
          author: { id: 3, name: 'Dr. Mitchell' },
          authorRole: 'instructor',
          createdAt: '2026-03-12T10:30:00Z',
        },
        {
          id: 5004,
          postId: 1002,
          body: 'Also Scopus is really good for checking citation counts — helps you identify the key papers in a field.',
          author: { id: 1, name: 'Bingyan Wang' },
          authorRole: 'student',
          createdAt: '2026-03-12T11:05:00Z',
        },
      ],
    },
    {
      id: 1003,
      courseId: 1,
      title: 'Study group for Week 7 content?',
      body: 'Is anyone interested in forming a study group before the Week 7 quiz? I\'m thinking Saturday afternoon on campus or on Zoom.',
      author: { id: 1, name: 'Bingyan Wang' },
      authorRole: 'student',
      createdAt: '2026-03-28T16:40:00Z',
      replies: [],
    },
  ],

  2: [
    {
      id: 2001,
      courseId: 2,
      title: 'Docker not starting on Windows — permission error',
      body: 'I\'m getting "permission denied while trying to connect to the Docker daemon socket" on Windows 11. I\'ve installed Docker Desktop and WSL2 but still getting the error.',
      author: { id: 2, name: 'Chris Lee' },
      authorRole: 'student',
      createdAt: '2026-03-08T20:12:00Z',
      replies: [
        {
          id: 6001,
          postId: 2001,
          body: 'This usually means your user isn\'t in the docker group. Try running: `sudo usermod -aG docker $USER` and then log out and back in. If you\'re on WSL2, make sure "Use the WSL 2 based engine" is enabled in Docker Desktop settings.',
          author: { id: 3, name: 'Dr. Mitchell' },
          authorRole: 'instructor',
          createdAt: '2026-03-09T09:00:00Z',
        },
      ],
    },
    {
      id: 2002,
      courseId: 2,
      title: 'Difference between ECS and EKS on AWS?',
      body: 'I\'m writing the cloud architecture assignment and not sure which to recommend — ECS or EKS. Can anyone explain the key differences and when to choose each?',
      author: { id: 1, name: 'Bingyan Wang' },
      authorRole: 'student',
      createdAt: '2026-03-15T14:30:00Z',
      replies: [],
    },
  ],

  3: [],
};

/** Simulates GET /api/courses/:id/posts  →  { posts } */
export function getMockPosts(courseId) {
  // Return a deep copy so local mutations don't pollute the source
  return JSON.parse(JSON.stringify(POSTS[Number(courseId)] ?? []));
}

/** Simulates POST /api/courses/:id/posts — creates a new post locally */
export function createMockPost(courseId, { title, body }, author) {
  const post = {
    id: ++_nextPostId,
    courseId: Number(courseId),
    title,
    body,
    author: { id: author.id, name: author.name },
    authorRole: author.role,
    createdAt: new Date().toISOString(),
    replies: [],
  };
  if (POSTS[Number(courseId)]) {
    POSTS[Number(courseId)].unshift(post);
  }
  return post;
}

/** Simulates POST /api/courses/:id/posts/:postId/replies */
export function createMockReply(postId, { body }, author) {
  return {
    id: ++_nextReplyId,
    postId,
    body,
    author: { id: author.id, name: author.name },
    authorRole: author.role,
    createdAt: new Date().toISOString(),
  };
}
