import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import type { User } from '@supabase/supabase-js';

export function useAuth(requireAuth = true) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    const safetyTimer = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 6000);

    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error) {
          console.error('Erro ao verificar sessão:', error);
          if (requireAuth) router.replace('/');
          return;
        }

        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (requireAuth && !currentUser) {
          router.replace('/');
          return;
        }
      } catch (error) {
        console.error('Erro inesperado na autenticação:', error);
        if (requireAuth) router.replace('/');
      } finally {
        clearTimeout(safetyTimer);
        if (mounted) setLoading(false);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (requireAuth && !currentUser) {
          router.replace('/');
        }
      }
    );

    return () => {
      mounted = false;
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, [router, requireAuth]);

  return { user, loading };
}