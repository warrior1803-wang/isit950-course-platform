// Sprint 2: mock data — swap for real axios calls in Sprint 3.
// TODO Sprint 3: replace MOCK_COURSES with → assignmentApi.listAll().then(res => ...)
import { useEffect, useState } from 'react';
import { MOCK_COURSES } from '../../mock/courses';
import { classifyAssignments } from './assignmentUtils.js';
import AssignmentList from './AssignmentList.jsx';

export default function AssignmentListPage() {
  const [sections, setSections] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setSections(classifyAssignments(MOCK_COURSES));
    }, 200);
    return () => clearTimeout(t);
  }, []);

  if (!sections) {
    return (
      <div className="max-w-[780px]">
        <div className="h-7 w-40 bg-[#e8dfd8] rounded-lg" />
      </div>
    );
  }

  return <AssignmentList sections={sections} />;
}
