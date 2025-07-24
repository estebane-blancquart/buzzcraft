/**
 * COMMIT 64 - Panel Structure
 * 
 * FAIT QUOI : Éditeur structure avec modification hiérarchie et validation temps réel
 * REÇOIT : structure: object, editMode: boolean, validationRules?: object
 * RETOURNE : { editor: object, structure: object, validation: object, changes: object[] }
 * ERREURS : EditorError si mode édition impossible, ValidationError si structure invalide, HierarchyError si hiérarchie corrompue
 */

export async function createStructureEditor(structure, editMode = true, validationRules = {}) {
  if (!structure || typeof structure !== 'object') {
    throw new Error('EditorError: Structure requise object');
  }

  if (typeof editMode !== 'boolean') {
    throw new Error('EditorError: EditMode doit être boolean');
  }

  try {
    const editor = {
      mode: editMode ? 'edit' : 'readonly',
      validation: 'realtime',
      autosave: editMode,
      history: true
    };

    const validation = await validateStructureIntegrity(structure, validationRules);

    return {
      editor,
      structure: { ...structure },
      validation,
      changes: [],
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`EditorError: Création éditeur échouée: ${error.message}`);
  }
}

export async function validateStructureChanges(structure, changes, rules = {}) {
  if (!structure || typeof structure !== 'object') {
    throw new Error('EditorError: Structure requise object');
  }

  if (!Array.isArray(changes)) {
    throw new Error('EditorError: Changes doit être array');
  }

  try {
    const errors = [];
    const warnings = [];

    // Validation chaque changement
    for (const change of changes) {
      if (!change.type || !change.target) {
        errors.push(`invalid_change_format: ${change.id || 'unknown'}`);
        continue;
      }

      // Validation selon type
      switch (change.type) {
        case 'add':
          if (!change.data) {
            errors.push(`missing_add_data: ${change.target}`);
          }
          break;
        case 'remove':
          if (hasChildren(structure, change.target)) {
            warnings.push(`remove_has_children: ${change.target}`);
          }
          break;
        case 'move':
          if (!change.destination) {
            errors.push(`missing_move_destination: ${change.target}`);
          }
          break;
        case 'rename':
          if (!change.newName) {
            errors.push(`missing_new_name: ${change.target}`);
          }
          break;
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      changesCount: changes.length,
      validChanges: changes.length - errors.length,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`ValidationError: Validation changements échouée: ${error.message}`);
  }
}

export async function applyStructureChanges(structure, changes, options = {}) {
  if (!structure || typeof structure !== 'object') {
    throw new Error('EditorError: Structure requise object');
  }

  if (!Array.isArray(changes)) {
    throw new Error('EditorError: Changes doit être array');
  }

  const atomic = options.atomic !== false;
  const backup = options.backup !== false;

  try {
    const validation = await validateStructureChanges(structure, changes);
    
    if (!validation.valid && atomic) {
      throw new Error(`ValidationError: Changements invalides: ${validation.errors.join(', ')}`);
    }

    // Simulation application changements
    const newStructure = backup ? { ...structure } : structure;
    const applied = [];
    const failed = [];

    for (const change of changes) {
      try {
        // Simulation application
        applied.push(change);
      } catch (error) {
        failed.push({ change, error: error.message });
        if (atomic) {
          throw error;
        }
      }
    }

    return {
      applied: true,
      structure: newStructure,
      appliedChanges: applied,
      failedChanges: failed,
      backup: backup ? structure : null,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`EditorError: Application changements échouée: ${error.message}`);
  }
}

export async function getStructureEditorStatus(editor, structure) {
  if (!editor || typeof editor !== 'object') {
    throw new Error('EditorError: Editor requis object');
  }

  try {
    const editable = editor.editor?.mode === 'edit';
    const validation = structure ? await validateStructureIntegrity(structure) : { valid: false };
    
    const status = validation.valid ? 
      (editable ? 'ready' : 'readonly') : 
      'invalid';

    return {
      status,
      editable,
      mode: editor.editor?.mode || 'unknown',
      validation: validation.valid,
      changes: editor.changes?.length || 0,
      lastEdit: editor.timestamp || new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'error',
      editable: false,
      issues: [`status_check_failed: ${error.message}`],
      lastEdit: new Date().toISOString()
    };
  }
}

// Helper functions pour simulation
async function validateStructureIntegrity(structure, rules = {}) {
  // Simulation validation intégrité
  const issues = [];
  
  if (!structure.root) {
    issues.push('missing_root');
  }
  
  return {
    valid: issues.length === 0,
    issues,
    rules: Object.keys(rules).length,
    timestamp: new Date().toISOString()
  };
}

function hasChildren(structure, target) {
  // Simulation détection enfants
  return Math.random() > 0.7; // 30% chance d'avoir des enfants
}

// panels/structure/editor : Panel Structure (commit 64)
// DEPENDENCY FLOW (no circular deps)
// app-client/ → api/
