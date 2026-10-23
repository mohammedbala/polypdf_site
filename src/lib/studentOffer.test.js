import { isEduEmail, loadStudentEligibility, requestStudentVerification } from './studentOffer';

test('accepts only .edu email domains', () => {
  expect(isEduEmail('Student@School.EDU')).toBe(true);
  expect(isEduEmail('student@dept.school.edu')).toBe(true);
  for (const email of ['student@school.edu.example', 'student@school..edu', 'student@example.com', '']) {
    expect(isEduEmail(email)).toBe(false);
  }
});

test('checks verified session status without caching', async () => {
  const fetchImpl = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ eligible: true, available: true }) });
  await expect(loadStudentEligibility(fetchImpl)).resolves.toEqual({ eligible: true, available: true });
  expect(fetchImpl).toHaveBeenCalledWith('/api/student/eligibility', expect.objectContaining({
    credentials: 'same-origin', cache: 'no-store'
  }));
});

test('requests a school verification link without leaking it to checkout attribution', async () => {
  const fetchImpl = jest.fn().mockResolvedValue({ ok: true });
  await requestStudentVerification(' STUDENT@SCHOOL.EDU ', fetchImpl);
  expect(JSON.parse(fetchImpl.mock.calls[0][1].body)).toEqual({ email: 'student@school.edu', next: 'buy' });
  await expect(requestStudentVerification('buyer@example.com', fetchImpl)).rejects.toThrow('edu_email_required');
  expect(fetchImpl).toHaveBeenCalledTimes(1);
});
