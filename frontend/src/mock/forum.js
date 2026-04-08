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
      title: 'Discussion on scalability testing with many replies',
      body: 'This is a test post to demonstrate handling of posts with many replies for scalability testing. Let\'s see how the UI performs with a large number of responses.',
      author: { id: 2, name: 'Chris Lee' },
      authorRole: 'student',
      createdAt: '2026-04-01T10:00:00Z',
      replies: [
        {
          id: 5005,
          postId: 1004,
          body: 'Great idea for testing! I\'ve been wondering how the forum handles long threads.',
          author: { id: 1, name: 'Bingyan Wang' },
          authorRole: 'student',
          createdAt: '2026-04-01T10:15:00Z',
        },
        {
          id: 5006,
          postId: 1004,
          body: 'Agreed, scalability is crucial for user experience. Let\'s add more replies to test the limits.',
          author: { id: 3, name: 'Dr. Mitchell' },
          authorRole: 'instructor',
          createdAt: '2026-04-01T10:30:00Z',
        },
        {
          id: 5007,
          postId: 1004,
          body: 'I think the current implementation should handle this well, but testing is important.',
          author: { id: 4, name: 'Alice Johnson' },
          authorRole: 'student',
          createdAt: '2026-04-01T10:45:00Z',
        },
        {
          id: 5008,
          postId: 1004,
          body: 'What about performance? Does the UI lag with many replies?',
          author: { id: 5, name: 'Bob Smith' },
          authorRole: 'student',
          createdAt: '2026-04-01T11:00:00Z',
        },
        {
          id: 5009,
          postId: 1004,
          body: 'From what I\'ve seen, React should handle this efficiently with proper key props.',
          author: { id: 3, name: 'Dr. Mitchell' },
          authorRole: 'instructor',
          createdAt: '2026-04-01T11:15:00Z',
        },
        {
          id: 5010,
          postId: 1004,
          body: 'Let\'s keep adding replies to really test the scalability.',
          author: { id: 6, name: 'Charlie Brown' },
          authorRole: 'student',
          createdAt: '2026-04-01T11:30:00Z',
        },
        {
          id: 5011,
          postId: 1004,
          body: 'I\'m curious about the rendering performance with virtual scrolling.',
          author: { id: 7, name: 'Diana Prince' },
          authorRole: 'student',
          createdAt: '2026-04-01T11:45:00Z',
        },
        {
          id: 5012,
          postId: 1004,
          body: 'Good point. For now, let\'s see how it performs without virtual scrolling.',
          author: { id: 1, name: 'Bingyan Wang' },
          authorRole: 'student',
          createdAt: '2026-04-01T12:00:00Z',
        },
        {
          id: 5013,
          postId: 1004,
          body: 'Another reply to increase the count. Testing continues.',
          author: { id: 8, name: 'Eve Wilson' },
          authorRole: 'student',
          createdAt: '2026-04-01T12:15:00Z',
        },
        {
          id: 5014,
          postId: 1004,
          body: 'The forum seems to handle this well so far.',
          author: { id: 9, name: 'Frank Miller' },
          authorRole: 'student',
          createdAt: '2026-04-01T12:30:00Z',
        },
        {
          id: 5015,
          postId: 1004,
          body: 'Let\'s add a few more to really push the limits.',
          author: { id: 10, name: 'Grace Lee' },
          authorRole: 'student',
          createdAt: '2026-04-01T12:45:00Z',
        },
        {
          id: 5016,
          postId: 1004,
          body: 'I think we\'re at a good number now for testing purposes.',
          author: { id: 3, name: 'Dr. Mitchell' },
          authorRole: 'instructor',
          createdAt: '2026-04-01T13:00:00Z',
        },
        {
          id: 5017,
          postId: 1004,
          body: 'One more reply to make it 13 total.',
          author: { id: 11, name: 'Henry Ford' },
          authorRole: 'student',
          createdAt: '2026-04-01T13:15:00Z',
        },
        {
          id: 5018,
          postId: 1004,
          body: 'Actually, let\'s make it 14.',
          author: { id: 12, name: 'Ivy Chen' },
          authorRole: 'student',
          createdAt: '2026-04-01T13:30:00Z',
        },
        {
          id: 5019,
          postId: 1004,
          body: 'And finally, 15 replies for comprehensive testing.',
          author: { id: 13, name: 'Jack Ryan' },
          authorRole: 'student',
          createdAt: '2026-04-01T13:45:00Z',
        },
      ],
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

  3: [
    {
      id: 1001,
      courseId: 3,
      title: 'Question about the research proposal word count',
      body: 'Hi everyone, does the 1500-word limit for the research proposal include the reference list, or is it just the body text? The rubric isn\'t entirely clear on this.',
      author: { id: 1, name: 'Bingyan Wang' },
      authorRole: 'student',
      createdAt: '2025-07-28T11:22:00Z',
      replies: [
        {
          id: 7001,
          postId: 1001,
          body: 'Great question, Bingyan. The 1500 words refers to the body text only — the reference list is excluded from the count.',
          author: { id: 3, name: 'Dr. Mitchell' },
          authorRole: 'instructor',
          createdAt: '2025-07-28T13:45:00Z',
        },
        {
          id: 7002,
          postId: 1001,
          body: 'Thanks Dr. Mitchell! That\'s a relief.',
          author: { id: 1, name: 'Bingyan Wang' },
          authorRole: 'student',
          createdAt: '2025-07-28T14:02:00Z',
        },
      ],
    },
    {
      id: 1002,
      courseId: 3,
      title: 'Recommended databases for literature search?',
      body: 'I\'m struggling to find enough peer-reviewed articles on my topic (AI ethics in healthcare). Which databases would you recommend beyond Google Scholar?',
      author: { id: 2, name: 'Chris Lee' },
      authorRole: 'student',
      createdAt: '2025-07-28T09:15:00Z',
      replies: [
        {
          id: 7003,
          postId: 1002,
          body: 'Try IEEE Xplore, ACM Digital Library, and PubMed. The UOW Library also has great subject guides — search "IT research" on the library website.',
          author: { id: 3, name: 'Dr. Mitchell' },
          authorRole: 'instructor',
          createdAt: '2025-07-28T10:30:00Z',
        },
        {
          id: 7004,
          postId: 1002,
          body: 'Also Scopus is really good for checking citation counts — helps you identify the key papers in a field.',
          author: { id: 1, name: 'Bingyan Wang' },
          authorRole: 'student',
          createdAt: '2025-07-28T11:05:00Z',
        },
      ],
    },
    {
      id: 1003,
      courseId: 3,
      title: 'Study group for Week 7 content?',
      body: 'Is anyone interested in forming a study group before the Week 7 quiz? I\'m thinking Saturday afternoon on campus or on Zoom.',
      author: { id: 1, name: 'Bingyan Wang' },
      authorRole: 'student',
      createdAt: '2025-07-28T16:40:00Z',
      replies: [],
    },
  ],

  4: [],
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
