
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "families": {
                  Row: {
                    "created_at": string,"id": string,"invite_code": string,"name": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"invite_code": string,"name": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"invite_code"?: string,"name"?: string
                  }
                  Relationships: [
                    
                  ]
                },"members": {
                  Row: {
                    "avatar": string,"created_at": string,"display_name": string,"family_id": string,"id": string,"lifetime_points": number,"role": Database["public"]['Enums']["member_role"],"user_id": string | null,"wallet_points": number
                  }
                  ComputedFields: never
                  Insert: {
                    "avatar"?: string,"created_at"?: string,"display_name": string,"family_id": string,"id"?: string,"lifetime_points"?: number,"role": Database["public"]['Enums']["member_role"],"user_id"?: string | null,"wallet_points"?: number
                  }
                  Update: {
                    "avatar"?: string,"created_at"?: string,"display_name"?: string,"family_id"?: string,"id"?: string,"lifetime_points"?: number,"role"?: Database["public"]['Enums']["member_role"],"user_id"?: string | null,"wallet_points"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "members_family_id_fkey"
      columns: ["family_id"]
isOneToOne: false
      referencedRelation: "families"
      referencedColumns: ["id"]
    }
                  ]
                },"quests": {
                  Row: {
                    "approved_at": string | null,"category": Database["public"]['Enums']["quest_category"],"claimed_at": string | null,"created_at": string,"due_at": string,"family_id": string,"id": string,"kid_id": string,"points_awarded": number | null,"proof_path": string | null,"size": Database["public"]['Enums']["quest_size"],"status": Database["public"]['Enums']["quest_status"],"title": string
                  }
                  ComputedFields: never
                  Insert: {
                    "approved_at"?: string | null,"category": Database["public"]['Enums']["quest_category"],"claimed_at"?: string | null,"created_at"?: string,"due_at"?: string,"family_id": string,"id"?: string,"kid_id": string,"points_awarded"?: number | null,"proof_path"?: string | null,"size": Database["public"]['Enums']["quest_size"],"status"?: Database["public"]['Enums']["quest_status"],"title": string
                  }
                  Update: {
                    "approved_at"?: string | null,"category"?: Database["public"]['Enums']["quest_category"],"claimed_at"?: string | null,"created_at"?: string,"due_at"?: string,"family_id"?: string,"id"?: string,"kid_id"?: string,"points_awarded"?: number | null,"proof_path"?: string | null,"size"?: Database["public"]['Enums']["quest_size"],"status"?: Database["public"]['Enums']["quest_status"],"title"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "quests_family_id_fkey"
      columns: ["family_id"]
isOneToOne: false
      referencedRelation: "families"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "quests_kid_id_family_id_fkey"
      columns: ["kid_id","family_id"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["id","family_id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "add_kid":
{ Args: { "kid_avatar": string,"kid_name": string }; Returns: {
              "avatar": string,
"created_at": string,
"display_name": string,
"family_id": string,
"id": string,
"lifetime_points": number,
"role": Database["public"]['Enums']["member_role"],
"user_id": string | null,
"wallet_points": number
            }
                          SetofOptions: {
        from: "*"
        to: "members"
        isOneToOne: true
        isSetofReturn: false
      } },
"claim_quest":
{ Args: { "quest_id": string }; Returns: {
              "approved_at": string | null,
"category": Database["public"]['Enums']["quest_category"],
"claimed_at": string | null,
"created_at": string,
"due_at": string,
"family_id": string,
"id": string,
"kid_id": string,
"points_awarded": number | null,
"proof_path": string | null,
"size": Database["public"]['Enums']["quest_size"],
"status": Database["public"]['Enums']["quest_status"],
"title": string
            }
                          SetofOptions: {
        from: "*"
        to: "quests"
        isOneToOne: true
        isSetofReturn: false
      } },
"create_family":
{ Args: { "family_name": string,"parent_name": string }; Returns: {
              "created_at": string,
"id": string,
"invite_code": string,
"name": string
            }
                          SetofOptions: {
        from: "*"
        to: "families"
        isOneToOne: true
        isSetofReturn: false
      } },
"family_kids":
{ Args: { "code": string }; Returns: {
              "avatar": string,"display_name": string,"id": string
            }[]
                           },
"join_family":
{ Args: { "code": string,"kid_id": string }; Returns: {
              "avatar": string,
"created_at": string,
"display_name": string,
"family_id": string,
"id": string,
"lifetime_points": number,
"role": Database["public"]['Enums']["member_role"],
"user_id": string | null,
"wallet_points": number
            }
                          SetofOptions: {
        from: "*"
        to: "members"
        isOneToOne: true
        isSetofReturn: false
      } },
"quest_points":
{ Args: { "at": string,"due_at": string,"size": Database["public"]['Enums']["quest_size"] }; Returns: number
                           },
"review_claim":
{ Args: { "approve": boolean,"quest_id": string }; Returns: {
              "approved_at": string | null,
"category": Database["public"]['Enums']["quest_category"],
"claimed_at": string | null,
"created_at": string,
"due_at": string,
"family_id": string,
"id": string,
"kid_id": string,
"points_awarded": number | null,
"proof_path": string | null,
"size": Database["public"]['Enums']["quest_size"],
"status": Database["public"]['Enums']["quest_status"],
"title": string
            }
                          SetofOptions: {
        from: "*"
        to: "quests"
        isOneToOne: true
        isSetofReturn: false
      } }
          }
          Enums: {
            "member_role": "parent"|"kid","quest_category": "dishes"|"trash"|"room"|"laundry"|"pets"|"homework"|"other","quest_size": "S"|"M"|"L","quest_status": "open"|"claimed"|"done"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "member_role": ["parent", "kid"],"quest_category": ["dishes", "trash", "room", "laundry", "pets", "homework", "other"],"quest_size": ["S", "M", "L"],"quest_status": ["open", "claimed", "done"]
          }
        }
} as const
