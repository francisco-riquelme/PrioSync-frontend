'use client';

import DashboardLayout from '../../components/layout/DashboardLayout';
import UserProfile from '../../components/profile/UserProfile';
import { useEffect, useState } from 'react';
import { initializeDB } from '@/utils/api/api';

export default function ProfilePage() {
  const [state, setState] = useState("")
  
  const getUser = async () => {
    const { models: { Curso } } = await initializeDB()
    const res = await Curso.list()
    setState(JSON.stringify(res))
  }

  useEffect(()=> {
    getUser()
  },[]) 

  return (
    <DashboardLayout>
      {state}
      <UserProfile />
    </DashboardLayout>
  );
}