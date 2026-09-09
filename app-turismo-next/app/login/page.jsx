'use client';
import { LoggedInRoute } from '@/components/AuthGuards';
import Login from '@/legacy_pages/Login';
export default function Page() { return <LoggedInRoute><Login /></LoggedInRoute>; }