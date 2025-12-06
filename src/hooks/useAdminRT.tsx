import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface RTInfo {
  id: string;
  nama: string;
  alamat: string | null;
}

export function useAdminRT() {
  const { user, role } = useAuth();
  const [rtId, setRtId] = useState<string | null>(null);
  const [rtInfo, setRtInfo] = useState<RTInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRTInfo = async () => {
      if (!user || role !== 'admin') {
        setLoading(false);
        return;
      }

      try {
        // Get admin's RT ID from user_roles
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('rt_id')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();

        if (roleError) throw roleError;

        if (roleData?.rt_id) {
          setRtId(roleData.rt_id);

          // Get RT details
          const { data: rtData, error: rtError } = await supabase
            .from('rt')
            .select('id, nama, alamat')
            .eq('id', roleData.rt_id)
            .maybeSingle();

          if (rtError) throw rtError;
          setRtInfo(rtData);
        }
      } catch (error) {
        console.error('Error fetching RT info:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRTInfo();
  }, [user, role]);

  return { rtId, rtInfo, loading };
}
