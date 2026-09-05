// Stub Supabase Client for local environment
export const supabase = {
  from: (_table: string) => ({
    select: (_query?: string) => ({
      order: (_column: string, _options?: { ascending?: boolean }) =>
        Promise.resolve({ data: null as any, error: null as any }),
    }),
    insert: (_record: any) => Promise.resolve({ data: null as any, error: null as any }),
  }),
};
