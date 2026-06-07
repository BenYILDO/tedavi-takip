import React from 'react';
import { ProfileScreen } from '@/features/profile/ProfileScreen';

export default function PatientSettingsScreen() {
  return <ProfileScreen changePasswordRoute="/(patient)/change-password" />;
}
