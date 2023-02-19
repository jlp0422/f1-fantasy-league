export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[]

export interface Database {
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
          sponsor: string | null
          team_principal: string | null
        }
        Insert: {
          car_image_url?: string | null
          id?: number
          name?: string | null
          number?: number | null
          number_image_url?: string | null
          season_id?: number | null
          sponsor?: string | null
          team_principal?: string | null
        }
        Update: {
          car_image_url?: string | null
          id?: number
          name?: string | null
          number?: number | null
          number_image_url?: string | null
          season_id?: number | null
          sponsor?: string | null
          team_principal?: string | null
        }
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
      }
      driver_transaction: {
        Row: {
          constructor_id: number | null
          created_at: string | null
          current_driver_id: number | null
          id: number
          replacement_driver_id: number | null
          season_id: number | null
        }
        Insert: {
          constructor_id?: number | null
          created_at?: string | null
          current_driver_id?: number | null
          id?: number
          replacement_driver_id?: number | null
          season_id?: number | null
        }
        Update: {
          constructor_id?: number | null
          created_at?: string | null
          current_driver_id?: number | null
          id?: number
          replacement_driver_id?: number | null
          season_id?: number | null
        }
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
          sponsor: string
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
