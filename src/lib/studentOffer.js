export const isEduEmail = (value) =>
  typeof value === 'string' && /^[^\s@]+@(?:[a-z0-9-]+\.)+edu$/i.test(value.trim());

export const loadStudentEligibility = async (fetchImpl = window.fetch.bind(window)) => {
  const response = await fetchImpl('/api/student/eligibility', {
    credentials: 'same-origin',
    headers: { Accept: 'application/json' },
    cache: 'no-store'
  });
  if (!response.ok) throw new Error('student_eligibility_unavailable');
  const payload = await response.json();
  return { eligible: payload?.eligible === true, available: payload?.available === true };
};

export const requestStudentVerification = async (email, fetchImpl = window.fetch.bind(window)) => {
  const normalized = String(email || '').trim().toLowerCase();
  if (!isEduEmail(normalized)) throw new Error('edu_email_required');
  const response = await fetchImpl('/api/account/magic-link', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: normalized, next: 'buy' })
  });
  if (!response.ok) throw new Error('student_verification_unavailable');
};
