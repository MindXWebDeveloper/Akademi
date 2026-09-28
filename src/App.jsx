import { useState } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import Login from './components/Login/Login';
import Dashboard from './components/Dashboard/Dashboard';
import AuthenticatedLayout from './components/AuthenticatedLayout/AuthenticatedLayout';
import StudentManagement from './components/StudentManagement/StudentManagement';
import StudentDetail from './components/StudentManagement/StudentDetail/StudentDetail';
import StudentGrades from './components/StudentManagement/StudentGrades/StudentGrades';
import StudentReportCard from './components/StudentManagement/StudentReportCard/StudentReportCard';
import StudentTranscript from './components/StudentManagement/StudentTranscript/StudentTranscript';
import ExtracurricularActivities from './components/ExtracurricularActivities/ExtracurricularActivities';
import ActivityDetail from './components/ExtracurricularActivities/ActivityDetail';
import LibraryManagement from './components/Library/LibraryManagement';
import TeacherManagement from './components/TeacherManagement/TeacherManagement';
import TeacherDetail from './components/TeacherManagement/TeacherDetail/TeacherDetail';
import ClassManagement from './components/ClassManagement/ClassManagement';
import ClassDetail from './components/ClassManagement/ClassDetail/ClassDetail';
import Timetable from './components/Timetable/Timetable';

const App = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const handleLogin = (userData) => {
    setCurrentUser(userData);
    setIsAuthenticated(true);
    navigate('/dashboard', { replace: true });
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    navigate('/', { replace: true });
  };

  return (
    <Routes>
      <Route
        path="/"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login onLogin={handleLogin} />}
      />
      <Route
        element={isAuthenticated ? <AuthenticatedLayout onLogout={handleLogout} /> : <Navigate to="/" replace />}
      >
        <Route path="/dashboard" element={<Dashboard user={currentUser} />} />
        <Route path="/students" element={<StudentManagement />} />
        <Route path="/students/new" element={<StudentDetail isCreateMode />} />
        <Route path="/students/:studentId/grades" element={<StudentGrades />} />
        <Route path="/students/:studentId/report-card" element={<StudentReportCard />} />
        <Route path="/students/:studentId/transcript" element={<StudentTranscript />} />
        <Route path="/students/:studentId" element={<StudentDetail />} />
        <Route path="/teachers" element={<TeacherManagement />} />
        <Route path="/teachers/new" element={<TeacherDetail isCreateMode />} />
        <Route path="/teachers/:recordId" element={<TeacherDetail />} />
        <Route path="/classes" element={<ClassManagement />} />
        <Route path="/classes/new" element={<ClassDetail isCreateMode />} />
        <Route path="/classes/:recordId" element={<ClassDetail />} />
        <Route path="/timetable" element={<Timetable />} />
        <Route path="/activities" element={<ExtracurricularActivities />} />
        <Route path="/activities/new" element={<ActivityDetail isCreateMode />} />
        <Route path="/activities/:activityId" element={<ActivityDetail />} />
        <Route path="/library" element={<LibraryManagement />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;