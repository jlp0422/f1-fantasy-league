export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      constructor: {
        Row: {
          car_image_url: string | null
          id: number
          name: string | null
          number: number | null
          number_image_url: string | null
          season_id: number | null
          sponsor_list: string[] | null
          team_principal: string | null
        }
        Insert: {
          car_image_url?: string | null
          id?: number
          name?: string | null
          number?: number | null
          number_image_url?: string | null
          season_id?: number | null
          sponsor_list?: string[] | null
          team_principal?: string | null
        }
        Update: {
          car_image_url?: string | null
          id?: number
          name?: string | null
          number?: number | null
          number_image_url?: string | null
          season_id?: number | null
          sponsor_list?: string[] | null
          team_principal?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'constructor_season_id_fkey'
            columns: ['season_id']
            isOneToOne: false
            referencedRelation: 'season'
            referencedColumns: ['id']
          }
        ]
      }
      constructor_driver: {
        Row: {
          constructor_id: number | null
          driver_one_id: number | null
          driver_two_id: number | null
          id: number
          season_id: number | null
        }
        Insert: {
          constructor_id?: number | null
          driver_one_id?: number | null
          driver_two_id?: number | null
          id?: number
          season_id?: number | null
        }
        Update: {
          constructor_id?: number | null
          driver_one_id?: number | null
          driver_two_id?: number | null
          id?: number
          season_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'constructor_driver_constructor_id_fkey'
            columns: ['constructor_id']
            isOneToOne: false
            referencedRelation: 'constructor'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'constructor_driver_driver_one_id_fkey'
            columns: ['driver_one_id']
            isOneToOne: false
            referencedRelation: 'driver'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'constructor_driver_driver_two_id_fkey'
            columns: ['driver_two_id']
            isOneToOne: false
            referencedRelation: 'driver'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'constructor_driver_season_id_fkey'
            columns: ['season_id']
            isOneToOne: false
            referencedRelation: 'season'
            referencedColumns: ['id']
          }
        ]
      }
      draft: {
        Row: {
          created_at: string | null
          id: number
          season_id: number | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          season_id?: number | null
        }
        Update: {
          created_at?: string | null
          id?: number
          season_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'draft_season_id_fkey'
            columns: ['season_id']
            isOneToOne: false
            referencedRelation: 'season'
            referencedColumns: ['id']
          }
        ]
      }
      draft_selection: {
        Row: {
          constructor_id: number | null
          created_at: string | null
          draft_id: number | null
          driver_id: number | null
          id: number
          pick_number: number | null
        }
        Insert: {
          constructor_id?: number | null
          created_at?: string | null
          draft_id?: number | null
          driver_id?: number | null
          id?: number
          pick_number?: number | null
        }
        Update: {
          constructor_id?: number | null
          created_at?: string | null
          draft_id?: number | null
          driver_id?: number | null
          id?: number
          pick_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'draft_selection_constructor_id_fkey'
            columns: ['constructor_id']
            isOneToOne: false
            referencedRelation: 'constructor'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'draft_selection_draft_id_fkey'
            columns: ['draft_id']
            isOneToOne: false
            referencedRelation: 'draft'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'draft_selection_driver_id_fkey'
            columns: ['driver_id']
            isOneToOne: false
            referencedRelation: 'driver'
            referencedColumns: ['id']
          }
        ]
      }
      driver: {
        Row: {
          abbreviation: string | null
          constructor_name: string | null
          fast_f1_id: number | null
          first_name: string | null
          id: number
          image_url: string | null
          is_full_time: boolean | null
          last_name: string | null
          number: number | null
          season_id: number | null
        }
        Insert: {
          abbreviation?: string | null
          constructor_name?: string | null
          fast_f1_id?: number | null
          first_name?: string | null
          id?: number
          image_url?: string | null
          is_full_time?: boolean | null
          last_name?: string | null
          number?: number | null
          season_id?: number | null
        }
        Update: {
          abbreviation?: string | null
          constructor_name?: string | null
          fast_f1_id?: number | null
          first_name?: string | null
          id?: number
          image_url?: string | null
          is_full_time?: boolean | null
          last_name?: string | null
          number?: number | null
          season_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'driver_season_id_fkey'
            columns: ['season_id']
            isOneToOne: false
            referencedRelation: 'season'
            referencedColumns: ['id']
          }
        ]
      }
      driver_race_result: {
        Row: {
          constructor_id: number | null
          driver_id: number | null
          finish_position: number | null
          finish_position_points: number | null
          grid_difference: number | null
          grid_difference_points: number | null
          id: number
          is_dnf: boolean | null
          race_id: number | null
        }
        Insert: {
          constructor_id?: number | null
          driver_id?: number | null
          finish_position?: number | null
          finish_position_points?: number | null
          grid_difference?: number | null
          grid_difference_points?: number | null
          id?: number
          is_dnf?: boolean | null
          race_id?: number | null
        }
        Update: {
          constructor_id?: number | null
          driver_id?: number | null
          finish_position?: number | null
          finish_position_points?: number | null
          grid_difference?: number | null
          grid_difference_points?: number | null
          id?: number
          is_dnf?: boolean | null
          race_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'driver_race_result_constructor_id_fkey'
            columns: ['constructor_id']
            isOneToOne: false
            referencedRelation: 'constructor'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'driver_race_result_driver_id_fkey'
            columns: ['driver_id']
            isOneToOne: false
            referencedRelation: 'driver'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'driver_race_result_race_id_fkey'
            columns: ['race_id']
            isOneToOne: false
            referencedRelation: 'race'
            referencedColumns: ['id']
          }
        ]
      }
      driver_transaction: {
        Row: {
          constructor_id: number | null
          created_at: string | null
          current_driver_id: number | null
          id: number
          replacement_driver_id: number | null
          season_id: number | null
          transaction_type: string
        }
        Insert: {
          constructor_id?: number | null
          created_at?: string | null
          current_driver_id?: number | null
          id?: number
          replacement_driver_id?: number | null
          season_id?: number | null
          transaction_type?: string
        }
        Update: {
          constructor_id?: number | null
          created_at?: string | null
          current_driver_id?: number | null
          id?: number
          replacement_driver_id?: number | null
          season_id?: number | null
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: 'driver_transaction_constructor_id_fkey'
            columns: ['constructor_id']
            isOneToOne: false
            referencedRelation: 'constructor'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'driver_transaction_current_driver_id_fkey'
            columns: ['current_driver_id']
            isOneToOne: false
            referencedRelation: 'driver'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'driver_transaction_replacement_driver_id_fkey'
            columns: ['replacement_driver_id']
            isOneToOne: false
            referencedRelation: 'driver'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'driver_transaction_season_id_fkey'
            columns: ['season_id']
            isOneToOne: false
            referencedRelation: 'season'
            referencedColumns: ['id']
          }
        ]
      }
      race: {
        Row: {
          country: string | null
          fast_f1_id: number | null
          id: number
          location: string | null
          name: string | null
          round_number: number | null
          season_id: number | null
          start_date: string | null
        }
        Insert: {
          country?: string | null
          fast_f1_id?: number | null
          id?: number
          location?: string | null
          name?: string | null
          round_number?: number | null
          season_id?: number | null
          start_date?: string | null
        }
        Update: {
          country?: string | null
          fast_f1_id?: number | null
          id?: number
          location?: string | null
          name?: string | null
          round_number?: number | null
          season_id?: number | null
          start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'race_season_id_fkey'
            columns: ['season_id']
            isOneToOne: false
            referencedRelation: 'season'
            referencedColumns: ['id']
          }
        ]
      }
      season: {
        Row: {
          id: number
          year: number | null
        }
        Insert: {
          id?: number
          year?: number | null
        }
        Update: {
          id?: number
          year?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      c_points: {
        Args: Record<PropertyKey, never>
        Returns: {
          f_id: number
          f_name: string
          f_team_principal: string
          f_number: number
          f_sponsor: string
          f_total_points: number
        }[]
      }
      sum_constructor_points: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: number
          name: string
          team_principal: string
          number: number
          sponsor: string
          total_points: number
        }[]
      }
      sum_constructor_points_by_season: {
        Args: {
          season: number
        }
        Returns: {
          id: number
          name: string
          team_principal: string
          number: number
          sponsor_list: string[]
          total_points: number
        }[]
      }
      total_points_by_constructor_by_race: {
        Args: {
          season: number
        }
        Returns: {
          constructor_id: number
          race_id: number
          total_points: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, 'public'>]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema['Tables'] & PublicSchema['Views'])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions['schema']]['Tables'] &
        Database[PublicTableNameOrOptions['schema']]['Views'])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions['schema']]['Tables'] &
      Database[PublicTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema['Tables'] &
      PublicSchema['Views'])
  ? (PublicSchema['Tables'] &
      PublicSchema['Views'])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema['Tables']
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
  ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema['Tables']
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
  ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema['Enums']
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions['schema']]['Enums']
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions['schema']]['Enums'][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema['Enums']
  ? PublicSchema['Enums'][PublicEnumNameOrOptions]
  : never
