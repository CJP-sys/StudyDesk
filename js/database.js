/* Supabase browser client and per-user study-data access. The anon key is public;
   database access is protected by the RLS policies in supabase/schema.sql. */
if (!window.STUDYDESK_SUPABASE_URL || window.STUDYDESK_SUPABASE_URL.includes("YOUR-PROJECT") ||
    !window.STUDYDESK_SUPABASE_ANON_KEY || window.STUDYDESK_SUPABASE_ANON_KEY.startsWith("YOUR_")) {
  throw new Error("Add your Supabase project URL and publishable/anon key in js/supabase-config.js.");
}
const supabaseClient = window.supabase.createClient(
  window.STUDYDESK_SUPABASE_URL,
  window.STUDYDESK_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: window.localStorage,
    },
  },
);

const emptyStudyData = () => ({
  subjects: [], notes: [], tasks: [], cards: [], log: [], plans: [], n: 1,
});

const currentUserId = async () => {
  const { data: { user }, error } = await supabaseClient.auth.getUser();
  if (error || !user) throw new Error("Your session expired. Please log in again.");
  return user.id;
};

/* Keep the app's existing persistence interface, backed by a row owned by auth.uid(). */
const apiRequest = async (path, options = {}) => {
  if (path !== "/data") throw new Error("Unsupported StudyDesk data request.");
  const userId = await currentUserId();
  if (!options.method || options.method === "GET") {
    const { data, error } = await supabaseClient
      .from("study_data")
      .select("data")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (data) return data.data;

    const initialData = emptyStudyData();
    const { error: insertError } = await supabaseClient
      .from("study_data")
      .insert({ user_id: userId, data: initialData });
    if (insertError && insertError.code !== "23505") throw new Error(insertError.message);
    return initialData;
  }

  if (options.method === "PUT") {
    let data;
    try { data = JSON.parse(options.body || "{}"); }
    catch { throw new Error("Study data could not be saved."); }
    if (!data || typeof data !== "object" || Array.isArray(data) ||
        !["subjects", "notes", "tasks", "cards", "log", "plans"].every((key) => Array.isArray(data[key]))) {
      throw new Error("Study data is invalid and could not be saved.");
    }
    const { error } = await supabaseClient
      .from("study_data")
      .upsert({ user_id: userId, data, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
    if (error) throw new Error(error.message);
    return { saved: true };
  }

  throw new Error("Unsupported StudyDesk data request.");
};

const clearSession = async () => {
  const { error } = await supabaseClient.auth.signOut();
  if (error) throw new Error(error.message);
};
