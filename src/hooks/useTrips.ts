"use client";

import { useCallback, useEffect, useState } from "react";
import { Trip } from "@/types/trip";
import { loadTrips, saveTrips } from "@/lib/storage";

interface UseTripsResult {
  trips: Trip[];
  isLoading: boolean;
  addTrip: (trip: Trip) => void;
  updateTrip: (trip: Trip) => void;
  removeTrip: (tripId: string) => void;
  duplicateTrip: (tripId: string) => void;
  getTrip: (tripId: string) => Trip | undefined;
}

export function useTrips(): UseTripsResult {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTrips(loadTrips());
    setIsLoading(false);
  }, []);

  const persist = useCallback((next: Trip[]) => {
    setTrips(next);
    saveTrips(next);
  }, []);

  const addTrip = useCallback(
    (trip: Trip) => {
      persist([trip, ...trips]);
    },
    [trips, persist]
  );

  const updateTrip = useCallback(
    (trip: Trip) => {
      const updated = { ...trip, updatedAt: new Date().toISOString() };
      persist(trips.map((t) => (t.id === trip.id ? updated : t)));
    },
    [trips, persist]
  );

  const removeTrip = useCallback(
    (tripId: string) => {
      persist(trips.filter((t) => t.id !== tripId));
    },
    [trips, persist]
  );

  const duplicateTrip = useCallback(
    (tripId: string) => {
      const original = trips.find((t) => t.id === tripId);
      if (!original) return;
      const now = new Date().toISOString();
      const copy: Trip = {
        ...original,
        id: `trip-${Date.now()}`,
        title: `${original.title}（複製）`,
        completed: false,
        reviewCompletedAt: null,
        createdAt: now,
        updatedAt: now,
        stops: original.stops.map((s, i) => ({ ...s, id: `stop-${Date.now()}-${i}` })),
      };
      persist([copy, ...trips]);
    },
    [trips, persist]
  );

  const getTrip = useCallback((tripId: string) => trips.find((t) => t.id === tripId), [trips]);

  return { trips, isLoading, addTrip, updateTrip, removeTrip, duplicateTrip, getTrip };
}
