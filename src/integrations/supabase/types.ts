export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      buku_kas: {
        Row: {
          created_at: string
          id: string
          jenis: string
          keterangan: string
          nominal: number
          rt_id: string | null
          tagihan_id: string | null
          tanggal: string
        }
        Insert: {
          created_at?: string
          id?: string
          jenis: string
          keterangan: string
          nominal: number
          rt_id?: string | null
          tagihan_id?: string | null
          tanggal?: string
        }
        Update: {
          created_at?: string
          id?: string
          jenis?: string
          keterangan?: string
          nominal?: number
          rt_id?: string | null
          tagihan_id?: string | null
          tanggal?: string
        }
        Relationships: [
          {
            foreignKeyName: "buku_kas_rt_id_fkey"
            columns: ["rt_id"]
            isOneToOne: false
            referencedRelation: "rt"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buku_kas_tagihan_id_fkey"
            columns: ["tagihan_id"]
            isOneToOne: false
            referencedRelation: "tagihan"
            referencedColumns: ["id"]
          },
        ]
      }
      kategori_iuran: {
        Row: {
          created_at: string
          deskripsi: string | null
          id: string
          nama: string
          nominal: number
          rt_id: string | null
        }
        Insert: {
          created_at?: string
          deskripsi?: string | null
          id?: string
          nama: string
          nominal?: number
          rt_id?: string | null
        }
        Update: {
          created_at?: string
          deskripsi?: string | null
          id?: string
          nama?: string
          nominal?: number
          rt_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kategori_iuran_rt_id_fkey"
            columns: ["rt_id"]
            isOneToOne: false
            referencedRelation: "rt"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          dibaca: boolean
          id: string
          jenis: string
          judul: string
          pesan: string
          rumah_id: string
          tagihan_id: string | null
        }
        Insert: {
          created_at?: string
          dibaca?: boolean
          id?: string
          jenis?: string
          judul: string
          pesan: string
          rumah_id: string
          tagihan_id?: string | null
        }
        Update: {
          created_at?: string
          dibaca?: boolean
          id?: string
          jenis?: string
          judul?: string
          pesan?: string
          rumah_id?: string
          tagihan_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_rumah_id_fkey"
            columns: ["rumah_id"]
            isOneToOne: false
            referencedRelation: "rumah"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_tagihan_id_fkey"
            columns: ["tagihan_id"]
            isOneToOne: false
            referencedRelation: "tagihan"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rt: {
        Row: {
          alamat: string | null
          created_at: string
          id: string
          nama: string
          updated_at: string
        }
        Insert: {
          alamat?: string | null
          created_at?: string
          id?: string
          nama: string
          updated_at?: string
        }
        Update: {
          alamat?: string | null
          created_at?: string
          id?: string
          nama?: string
          updated_at?: string
        }
        Relationships: []
      }
      rumah: {
        Row: {
          blok: string | null
          created_at: string
          email: string | null
          id: string
          kepala_keluarga: string
          no_hp: string | null
          no_rumah: string
          rt_id: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          blok?: string | null
          created_at?: string
          email?: string | null
          id?: string
          kepala_keluarga: string
          no_hp?: string | null
          no_rumah: string
          rt_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          blok?: string | null
          created_at?: string
          email?: string | null
          id?: string
          kepala_keluarga?: string
          no_hp?: string | null
          no_rumah?: string
          rt_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rumah_rt_id_fkey"
            columns: ["rt_id"]
            isOneToOne: false
            referencedRelation: "rt"
            referencedColumns: ["id"]
          },
        ]
      }
      tagihan: {
        Row: {
          bulan: number
          created_at: string
          id: string
          kategori_id: string
          nominal: number
          rumah_id: string
          status: string
          tahun: number
          tanggal_bayar: string | null
        }
        Insert: {
          bulan: number
          created_at?: string
          id?: string
          kategori_id: string
          nominal: number
          rumah_id: string
          status?: string
          tahun: number
          tanggal_bayar?: string | null
        }
        Update: {
          bulan?: number
          created_at?: string
          id?: string
          kategori_id?: string
          nominal?: number
          rumah_id?: string
          status?: string
          tahun?: number
          tanggal_bayar?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tagihan_kategori_id_fkey"
            columns: ["kategori_id"]
            isOneToOne: false
            referencedRelation: "kategori_iuran"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tagihan_rumah_id_fkey"
            columns: ["rumah_id"]
            isOneToOne: false
            referencedRelation: "rumah"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          rt_id: string | null
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          rt_id?: string | null
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          rt_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_rt_id_fkey"
            columns: ["rt_id"]
            isOneToOne: false
            referencedRelation: "rt"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_rt_id: { Args: { _user_id: string }; Returns: string }
      get_user_rumah_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "warga" | "super_admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "warga", "super_admin"],
    },
  },
} as const
