/**
 * Mock data — GET /api/courses/:id/materials  →  { materials }
 *
 * fileType: 'pdf' | 'doc' | 'ppt' | 'zip'
 * section: used as group heading in the Materials tab
 */

const MATERIALS = {
  1: [
    {
      id: 101,
      courseId: 1,
      filename: 'Week1_Introduction_to_Research.pdf',
      fileType: 'pdf',
      url: '#',
      section: 'Week 1: Introduction',
      size: 2_400_000,
      uploadedAt: '2026-02-24T10:00:00Z',
    },
    {
      id: 102,
      courseId: 1,
      filename: 'ResearchMethodsOverview.pptx',
      fileType: 'ppt',
      url: '#',
      section: 'Week 1: Introduction',
      size: 3_200_000,
      uploadedAt: '2026-02-24T10:30:00Z',
    },
    {
      id: 103,
      courseId: 1,
      filename: 'LiteratureReview_Guide.docx',
      fileType: 'doc',
      url: '#',
      section: 'Week 2: Literature Review',
      size: 560_000,
      uploadedAt: '2026-03-03T09:00:00Z',
    },
    {
      id: 104,
      courseId: 1,
      filename: 'Research_Resources_Pack.zip',
      fileType: 'zip',
      url: '#',
      section: 'Week 2: Literature Review',
      size: 8_900_000,
      uploadedAt: '2026-03-03T09:30:00Z',
    },
    {
      id: 105,
      courseId: 1,
      filename: 'DataCollection_Methods.pdf',
      fileType: 'pdf',
      url: '#',
      section: 'Week 3: Data Collection',
      size: 1_800_000,
      uploadedAt: '2026-03-10T08:45:00Z',
    },
    {
      id: 106,
      courseId: 1,
      filename: 'SurveyDesign_Template.docx',
      fileType: 'doc',
      url: '#',
      section: 'Week 3: Data Collection',
      size: 340_000,
      uploadedAt: '2026-03-10T09:00:00Z',
    },
  ],

  2: [
    {
      id: 201,
      courseId: 2,
      filename: 'CloudFundamentals_Lecture1.pdf',
      fileType: 'pdf',
      url: '#',
      section: 'Week 1: Cloud Foundations',
      size: 3_100_000,
      uploadedAt: '2026-02-24T11:00:00Z',
    },
    {
      id: 202,
      courseId: 2,
      filename: 'AWS_vs_GCP_vs_Azure.pptx',
      fileType: 'ppt',
      url: '#',
      section: 'Week 1: Cloud Foundations',
      size: 4_500_000,
      uploadedAt: '2026-02-24T11:30:00Z',
    },
    {
      id: 203,
      courseId: 2,
      filename: 'Docker_QuickStart.pdf',
      fileType: 'pdf',
      url: '#',
      section: 'Week 2: Containers',
      size: 2_700_000,
      uploadedAt: '2026-03-03T10:00:00Z',
    },
    {
      id: 204,
      courseId: 2,
      filename: 'ContainerLab_Files.zip',
      fileType: 'zip',
      url: '#',
      section: 'Week 2: Containers',
      size: 12_400_000,
      uploadedAt: '2026-03-03T10:15:00Z',
    },
  ],

  3: [
    {
      id: 301,
      courseId: 3,
      filename: 'Python_Basics_Week1.pdf',
      fileType: 'pdf',
      url: '#',
      section: 'Week 1: Getting Started',
      size: 1_200_000,
      uploadedAt: '2025-07-28T09:00:00Z',
    },
    {
      id: 302,
      courseId: 3,
      filename: 'ControlFlow_Slides.pptx',
      fileType: 'ppt',
      url: '#',
      section: 'Week 2: Control Flow',
      size: 2_100_000,
      uploadedAt: '2025-08-04T09:00:00Z',
    },
  ],
};

/** Simulates GET /api/courses/:id/materials  →  { materials } */
export function getMockMaterials(courseId) {
  return MATERIALS[Number(courseId)] ?? [];
}
