import type { Metadata } from 'next';
import { TasksPage } from '@/components/crm/tasks/TasksPage';

export const metadata: Metadata = { title: 'Tareas y seguimiento' };

export default function Page() {
  return <TasksPage />;
}
