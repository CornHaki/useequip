export function getBookingLifecycleIndex(status) {
  if (status === 'Requested' || status === 'Waitlisted' || status === 'Rejected') return 1;
  if (status === 'Approved') return 2;
  if (status === 'Checked-Out') return 3;
  if (status === 'Returned' || status === 'Inspected' || status === 'Completed') return 4;
  return 0;
}