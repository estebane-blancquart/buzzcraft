/**
 * COMMIT 24 - System Ports
 * 
 * FAIT QUOI : Registry ports avec détection conflits et allocation automatique
 * REÇOIT : operation: string, port?: number, service?: string, options?: object
 * RETOURNE : { success: boolean, assignedPort?: number, conflicts: number[], available: number[] }
 * ERREURS : PortError si port occupé, ConflictError si collision détectée, RegistryError si registry corrompu
 */

// systems/ports/registry : System Ports (commit 24)
// DEPENDENCY FLOW (no circular deps)
// systems/ → utils/
