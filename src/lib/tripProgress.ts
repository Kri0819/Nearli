import { Stop } from "@/types/stop";
import { Trip } from "@/types/trip";

/** 依照 order 排序後，找出下一個尚未抵達的停靠點；若全部完成則回傳 null */
export function getNextStop(trip: Trip): Stop | null {
  const ordered = [...trip.stops].sort((a, b) => a.order - b.order);
  return ordered.find((s) => !s.actualArrivalTime) ?? null;
}

/** 這個行程的所有停靠點是否都已經抵達 */
export function isTripFullyArrived(trip: Trip): boolean {
  return trip.stops.length > 0 && trip.stops.every((s) => Boolean(s.actualArrivalTime));
}

export function markPrepStarted(trip: Trip): Trip {
  return { ...trip, actualPrepStartTime: new Date().toISOString() };
}

export function markStopDeparted(trip: Trip, stopId: string): Trip {
  const now = new Date().toISOString();
  return {
    ...trip,
    stops: trip.stops.map((s) => (s.id === stopId ? { ...s, actualDepartureTime: now } : s)),
  };
}

export function markStopArrived(trip: Trip, stopId: string): Trip {
  const now = new Date().toISOString();
  const nextStops = trip.stops.map((s) => (s.id === stopId ? { ...s, actualArrivalTime: now } : s));
  const nextTrip = { ...trip, stops: nextStops };
  return { ...nextTrip, completed: isTripFullyArrived(nextTrip) };
}
