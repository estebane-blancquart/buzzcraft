/**
 * COMMIT 24 - System Ports
 * 
 * FAIT QUOI : Allocation ports avec range management et réservation automatique
 * REÇOIT : serviceType: string, portRange: object, reservationOptions: object
 * RETOURNE : { allocatedPorts: number[], reserved: boolean, expiry?: string, metadata: object }
 * ERREURS : AllocationError si allocation impossible, RangeError si range épuisé, ReservationError si réservation échoue
 */

// systems/ports/allocator : System Ports (commit 24)
// DEPENDENCY FLOW (no circular deps)
// systems/ → utils/
