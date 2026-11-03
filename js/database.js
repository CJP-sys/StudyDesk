/* Browser API client. PostgreSQL credentials stay in server/.env. */
const apiRequest = async (path, options = {}) => {
  const token = sessionStorage.getItem('sd_token');
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || 'Could not connect to StudyDesk.');
  return result;
};
const saveSession = ({ token, user }) => {
  sessionStorage.setItem('sd_token', token);
  sessionStorage.setItem('sd_user', JSON.stringify(user));
};
const clearSession = () => { sessionStorage.removeItem('sd_token'); sessionStorage.removeItem('sd_user'); };
