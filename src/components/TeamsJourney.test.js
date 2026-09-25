import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { EnrollmentCode, OrderDocuments, paymentMessage, safeDocumentUrl, teamError } from './TeamsJourney';
let root, container;
beforeEach(() => { globalThis.IS_REACT_ACT_ENVIRONMENT = true; container = document.createElement('div'); document.body.append(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); container.remove(); jest.useRealTimers(); globalThis.IS_REACT_ACT_ENVIRONMENT = false; });
test('payment return never grants seats and delayed add-on purchases remain visibly pending', () => {
 expect(paymentMessage([], true)).toContain('does not grant seats');
 expect(paymentMessage([{status:'processing'}, {status:'paid'}], true)).toContain('Do not pay again');
 expect(paymentMessage([{status:'payment_failed'}])).toContain('added no seats');
 expect(paymentMessage([{status:'expired'}])).toContain('expired');
});
test('enrollment codes expire in place and connected state hides the code', () => {
 jest.useFakeTimers();jest.setSystemTime(new Date('2026-09-25T00:00:00Z'));
 const enrollment={code:'single-use-fixture',expiresAt:Date.now()+2000};
 act(()=>root.render(<EnrollmentCode enrollment={enrollment} connected={false}/>));
 expect(container.textContent).toContain('0:02');
 act(()=>jest.advanceTimersByTime(2000));expect(container.textContent).toContain('expired');expect(container.querySelector('input').value).toBe('');expect(container.querySelector('button').disabled).toBe(true);
 act(()=>root.render(<EnrollmentCode enrollment={enrollment} connected={true}/>));expect(container.textContent).toContain('manager is connected');expect(container.querySelector('input')).toBeNull();
});
test('receipts load only from the selected owner-authorized order route', async () => {
 const request=jest.fn().mockResolvedValue({receiptUrl:'https://pay.stripe.com/receipts/test',invoiceUrl:'https://attacker.test/',pending:false});
 act(()=>root.render(<OrderDocuments organizationId="org-a" order={{id:'order-a',status:'paid'}} request={request}/>));
 expect(request).not.toHaveBeenCalled();
 await act(async()=>container.querySelector('button').click());
 expect(request).toHaveBeenCalledWith('/api/teams/v1/organizations/org-a/orders/order-a/documents');
 expect(container.querySelectorAll('a')).toHaveLength(1);expect(container.querySelector('a').href).toBe('https://pay.stripe.com/receipts/test');
});
test.each(['http://pay.stripe.com/x','https://pay.stripe.com.attacker.test/x','https://user:pass@pay.stripe.com/x','javascript:alert(1)'])('reject unsafe document URL %s', value => {expect(safeDocumentUrl(value)).toBeNull();});
test('provider errors are actionable and never echo private provider messages', () => {
 expect(teamError({error:'checkout_already_open',reference:'ref-123'})).toContain('cancel the unpaid checkout');
 expect(teamError({error:'private value with spaces',reference:'ref-123'})).not.toContain('private value');
 expect(teamError({error:'order_documents_pending'})).toContain('Wait for payment confirmation');
});
