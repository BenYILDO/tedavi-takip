import React from 'react';
import { ProfileScreen } from '@/features/profile/ProfileScreen';

export default function AdminSettingsScreen() {
  return <ProfileScreen changePasswordRoute="/(admin)/change-password" />;
}
