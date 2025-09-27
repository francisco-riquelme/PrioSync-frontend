'use client';

import DashboardLayout from '../../components/layout/DashboardLayout';
import UserProfile from '../../components/profile/UserProfile';
import { useEffect, useState } from 'react';
import { getQueryFactories } from '@/utils/commons/queries';
import { MainTypes } from '@/utils/api/schema';

export default function ProfilePage() {
  const [state, setState] = useState("")
  
  const getUser = async () => {
    try {
      const { Curso } = await getQueryFactories<MainTypes, "Curso">({
        entities: ["Curso"],
      });
      const res = await Curso.list();
      setState(JSON.stringify(res, null, 2));
    } catch (error) {
      console.error('Error fetching courses:', error);
      setState(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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