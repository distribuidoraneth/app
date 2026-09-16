'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ClientRegistrationView } from '@/components/admin/ClientRegistrationView';
import { Loader2 } from 'lucide-react';

function ClientFormContent() {
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');
  return <ClientRegistrationView clientIdToEdit={editId} />;
}

export default function NuevoClientePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
        </div>
      }
    >
      <ClientFormContent />
    </Suspense>
  );
}
