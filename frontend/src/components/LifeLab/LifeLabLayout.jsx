import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import LibraryScreen from './screens/LibraryScreen';
import DetailScreen from './screens/DetailScreen';
import AssignScreen from './screens/AssignScreen';
import SubmissionScreen from './screens/SubmissionScreen';
import ReviewScreen from './screens/ReviewScreen';
import ClassOverviewScreen from './screens/ClassOverviewScreen';
import ParentViewScreen from './screens/ParentViewScreen';
import TutorViewScreen from './screens/TutorViewScreen';
import './LifeLab.css';

export default function LifeLabLayout() {
  const { user } = useAuth();
  const [activeScreen, setActiveScreen] = useState('library');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template);
    setActiveScreen('detail');
  };

  const handleAssignTemplate = (template) => {
    setSelectedTemplate(template);
    setActiveScreen('assign');
  };

  const handleViewAssignment = (assignment) => {
    setSelectedAssignment(assignment);
    setActiveScreen('submission');
  };

  const handleReviewSubmission = (submission) => {
    setActiveScreen('review');
  };

  const renderScreen = () => {
    switch (activeScreen) {
      case 'library':
        return <LibraryScreen onSelectTemplate={handleSelectTemplate} onAssign={handleAssignTemplate} onNavigate={setActiveScreen} />;
      case 'detail':
        return <DetailScreen template={selectedTemplate} onAssign={handleAssignTemplate} onBack={() => setActiveScreen('library')} />;
      case 'assign':
        return <AssignScreen template={selectedTemplate} onBack={() => setActiveScreen('library')} />;
      case 'submission':
        return <SubmissionScreen assignment={selectedAssignment} onBack={() => setActiveScreen('library')} />;
      case 'review':
        return <ReviewScreen onBack={() => setActiveScreen('library')} />;
      case 'class':
        return <ClassOverviewScreen onBack={() => setActiveScreen('library')} />;
      case 'parent':
        return <ParentViewScreen onBack={() => setActiveScreen('library')} />;
      case 'tutor':
        return <TutorViewScreen onBack={() => setActiveScreen('library')} />;
      default:
        return <LibraryScreen />;
    }
  };

  return (
    <div className="lifelab-container">
      {renderScreen()}
    </div>
  );
}
