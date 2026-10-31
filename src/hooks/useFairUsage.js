import { useContext, useMemo } from 'react';
import { DataContext } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';

export function useFairUsage() {
  const { bookings } = useContext(DataContext);
  const { user } = useAuth();
  const MAX_ACTIVE_BOOKINGS = 2;

  const userActiveBookings = useMemo(() => {
    return bookings.filter(
      (b) => b.userId === user?.uid && ['Requested', 'Waitlisted', 'Approved', 'Checked-Out', 'Returned'].includes(b.status)
    );
  }, [bookings, user?.uid]);

  return {
    userActiveBookings,
    isQuotaReached: userActiveBookings.length >= MAX_ACTIVE_BOOKINGS,
    MAX_ACTIVE_BOOKINGS
  };
}