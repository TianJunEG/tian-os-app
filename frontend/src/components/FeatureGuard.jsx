import React from 'react';
import { Navigate } from 'react-router-dom';
import FEATURE_FLAGS from '../config/featureFlags';
import ComingSoon from './ComingSoon';

export default function FeatureGuard({ feature, comingSoonAllowed = false, children }) {
  const enabled = FEATURE_FLAGS[feature] === true;
  const comingSoon = FEATURE_FLAGS[`${feature}ComingSoon`] === true;

  if (enabled) return children;
  if (comingSoonAllowed && comingSoon) return <ComingSoon feature={feature} />;
  return <Navigate to="/" replace />;
}
