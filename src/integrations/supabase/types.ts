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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      clients: {
        Row: {
          created_at: string
          doc: string | null
          email: string | null
          endereco: string | null
          id: string
          nome: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          doc?: string | null
          email?: string | null
          endereco?: string | null
          id?: string
          nome: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          doc?: string | null
          email?: string | null
          endereco?: string | null
          id?: string
          nome?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      items: {
        Row: {
          categoria: string
          classe: string
          codigo: string
          created_at: string
          descricao: string
          id: string
          link_referencia: string | null
          marca: string | null
          preco_unitario: number
          tipo: string
          unidade: string
          updated_at: string
        }
        Insert: {
          categoria: string
          classe: string
          codigo: string
          created_at?: string
          descricao: string
          id?: string
          link_referencia?: string | null
          marca?: string | null
          preco_unitario?: number
          tipo: string
          unidade?: string
          updated_at?: string
        }
        Update: {
          categoria?: string
          classe?: string
          codigo?: string
          created_at?: string
          descricao?: string
          id?: string
          link_referencia?: string | null
          marca?: string | null
          preco_unitario?: number
          tipo?: string
          unidade?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar: string | null
          created_at: string
          email: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          avatar?: string | null
          created_at?: string
          email: string
          id: string
          name: string
          updated_at?: string
        }
        Update: {
          avatar?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      purchase_request_items: {
        Row: {
          created_at: string
          discount: number
          id: string
          is_servico: boolean
          item_categoria: string | null
          item_classe: string | null
          item_codigo: string | null
          item_descricao: string | null
          item_id: string | null
          item_link_referencia: string | null
          item_marca: string | null
          item_tipo: string | null
          item_unidade: string | null
          purchase_request_id: string
          qty: number
          servico_descricao: string | null
          unit_price: number
        }
        Insert: {
          created_at?: string
          discount?: number
          id?: string
          is_servico?: boolean
          item_categoria?: string | null
          item_classe?: string | null
          item_codigo?: string | null
          item_descricao?: string | null
          item_id?: string | null
          item_link_referencia?: string | null
          item_marca?: string | null
          item_tipo?: string | null
          item_unidade?: string | null
          purchase_request_id: string
          qty?: number
          servico_descricao?: string | null
          unit_price?: number
        }
        Update: {
          created_at?: string
          discount?: number
          id?: string
          is_servico?: boolean
          item_categoria?: string | null
          item_classe?: string | null
          item_codigo?: string | null
          item_descricao?: string | null
          item_id?: string | null
          item_link_referencia?: string | null
          item_marca?: string | null
          item_tipo?: string | null
          item_unidade?: string | null
          purchase_request_id?: string
          qty?: number
          servico_descricao?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_request_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_request_items_purchase_request_id_fkey"
            columns: ["purchase_request_id"]
            isOneToOne: false
            referencedRelation: "purchase_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_requests: {
        Row: {
          approved_at: string | null
          approver_id: string | null
          created_at: string
          delivery_address: string | null
          delivery_carrier: string | null
          delivery_mode: string
          discount: number
          id: string
          invoice_data: Json | null
          notes: string | null
          paid: boolean
          paid_at: string | null
          po_number: string | null
          project_client: string
          project_number: string
          rejected_at: string | null
          rejection_reason: string | null
          requester_id: string
          status: Database["public"]["Enums"]["rc_status"]
          supplier_id: string | null
          tax: number
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approver_id?: string | null
          created_at?: string
          delivery_address?: string | null
          delivery_carrier?: string | null
          delivery_mode?: string
          discount?: number
          id: string
          invoice_data?: Json | null
          notes?: string | null
          paid?: boolean
          paid_at?: string | null
          po_number?: string | null
          project_client: string
          project_number: string
          rejected_at?: string | null
          rejection_reason?: string | null
          requester_id: string
          status?: Database["public"]["Enums"]["rc_status"]
          supplier_id?: string | null
          tax?: number
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approver_id?: string | null
          created_at?: string
          delivery_address?: string | null
          delivery_carrier?: string | null
          delivery_mode?: string
          discount?: number
          id?: string
          invoice_data?: Json | null
          notes?: string | null
          paid?: boolean
          paid_at?: string | null
          po_number?: string | null
          project_client?: string
          project_number?: string
          rejected_at?: string | null
          rejection_reason?: string | null
          requester_id?: string
          status?: Database["public"]["Enums"]["rc_status"]
          supplier_id?: string | null
          tax?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_requests_approver_id_fkey"
            columns: ["approver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_requests_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      rfq_items: {
        Row: {
          codigo: string
          created_at: string
          descricao: string
          id: string
          item_id: string | null
          qty: number
          referencia: string | null
          rfq_id: string
          unidade: string
        }
        Insert: {
          codigo: string
          created_at?: string
          descricao: string
          id?: string
          item_id?: string | null
          qty?: number
          referencia?: string | null
          rfq_id: string
          unidade?: string
        }
        Update: {
          codigo?: string
          created_at?: string
          descricao?: string
          id?: string
          item_id?: string | null
          qty?: number
          referencia?: string | null
          rfq_id?: string
          unidade?: string
        }
        Relationships: [
          {
            foreignKeyName: "rfq_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfq_items_rfq_id_fkey"
            columns: ["rfq_id"]
            isOneToOne: false
            referencedRelation: "rfqs"
            referencedColumns: ["id"]
          },
        ]
      }
      rfqs: {
        Row: {
          created_at: string
          created_by: string | null
          data_emissao: string
          data_limite_entrega: string | null
          id: string
          nome_projeto: string
          numero_projeto: string
          numero_rfq: string
          observacoes: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          data_emissao?: string
          data_limite_entrega?: string | null
          id: string
          nome_projeto?: string
          numero_projeto: string
          numero_rfq: string
          observacoes?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          data_emissao?: string
          data_limite_entrega?: string | null
          id?: string
          nome_projeto?: string
          numero_projeto?: string
          numero_rfq?: string
          observacoes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          address: string | null
          cnpj: string
          contact: string
          created_at: string
          id: string
          name: string
          phone: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          cnpj: string
          contact: string
          created_at?: string
          id?: string
          name: string
          phone: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          cnpj?: string
          contact?: string
          created_at?: string
          id?: string
          name?: string
          phone?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "solicitante"
        | "aprovador"
        | "conferente"
        | "financeiro"
      rc_status:
        | "rascunho"
        | "aguardando_aprovacao"
        | "aprovado"
        | "rejeitado"
        | "em_cotacao"
        | "po_emitido"
        | "em_conferencia"
        | "conferido"
        | "pago"
        | "cancelado"
        | "aguardando_confirmacao_entrega"
        | "entrega_confirmada"
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
      app_role: [
        "admin",
        "solicitante",
        "aprovador",
        "conferente",
        "financeiro",
      ],
      rc_status: [
        "rascunho",
        "aguardando_aprovacao",
        "aprovado",
        "rejeitado",
        "em_cotacao",
        "po_emitido",
        "em_conferencia",
        "conferido",
        "pago",
        "cancelado",
        "aguardando_confirmacao_entrega",
        "entrega_confirmada",
      ],
    },
  },
} as const
