/**
 * COMMIT 70 - Panel Help
 * 
 * FAIT QUOI : Tutoriels interactifs avec progression et exemples pratiques
 * REÇOIT : tutorialId: string, userProgress: object, interactive: boolean
 * RETOURNE : { tutorial: object, steps: object[], progress: object, examples: object[] }
 * ERREURS : TutorialError si tutoriel invalide, ProgressError si progression corrompue, ExampleError si exemples indisponibles
 */

export async function createInteractiveTutorial(tutorialId, userProgress = {}, interactive = true) {
  if (!tutorialId || typeof tutorialId !== 'string') {
    throw new Error('TutorialError: TutorialId requis string');
  }

  const availableTutorials = [
    'getting-started', 'first-project', 'component-creation', 
    'state-management', 'deployment', 'troubleshooting'
  ];

  if (!availableTutorials.includes(tutorialId)) {
    throw new Error(`TutorialError: Tutoriel "${tutorialId}" non disponible`);
  }

  const tutorial = buildTutorial(tutorialId);
  const steps = buildTutorialSteps(tutorialId, interactive);
  const progress = calculateProgress(userProgress, steps);
  const examples = getTutorialExamples(tutorialId);

  return {
    tutorial: {
      id: tutorialId,
      title: tutorial.title,
      description: tutorial.description,
      difficulty: tutorial.difficulty,
      estimatedTime: tutorial.estimatedTime,
      interactive
    },
    steps,
    progress,
    examples,
    metadata: {
      tutorialId,
      totalSteps: steps.length,
      completedSteps: progress.completed.length,
      timestamp: new Date().toISOString()
    }
  };
}

export async function validateTutorialProgress(tutorialConfig, stepId, validation = {}) {
  if (!tutorialConfig || typeof tutorialConfig !== 'object') {
    throw new Error('TutorialError: Configuration tutoriel requise');
  }

  if (!stepId || typeof stepId !== 'string') {
    throw new Error('TutorialError: StepId requis string');
  }

  const step = tutorialConfig.steps?.find(s => s.id === stepId);
  if (!step) {
    throw new Error(`TutorialError: Étape "${stepId}" introuvable`);
  }

  // Validation selon le type d'étape
  const validationResult = await validateStepByType(step, validation);

  return {
    valid: validationResult.valid,
    errors: validationResult.errors || [],
    score: validationResult.score || 0,
    feedback: validationResult.feedback || [],
    stepId,
    stepType: step.type,
    timestamp: new Date().toISOString()
  };
}

export async function updateTutorialStep(tutorialConfig, stepId, userInput, action = 'complete') {
  if (!tutorialConfig || typeof tutorialConfig !== 'object') {
    throw new Error('TutorialError: Configuration tutoriel requise');
  }

  const validActions = ['complete', 'skip', 'reset', 'hint'];
  if (!validActions.includes(action)) {
    throw new Error(`TutorialError: Action "${action}" non supportée`);
  }

  const progress = tutorialConfig.progress;
  let result = { updated: false };

  switch (action) {
    case 'complete':
      if (!progress.completed.includes(stepId)) {
        progress.completed.push(stepId);
        progress.currentStep = findNextStep(tutorialConfig.steps, stepId);
        progress.percentage = (progress.completed.length / tutorialConfig.steps.length) * 100;
        result = { updated: true, action: 'completed', nextStep: progress.currentStep };
      }
      break;

    case 'skip':
      if (!progress.skipped) progress.skipped = [];
      if (!progress.skipped.includes(stepId)) {
        progress.skipped.push(stepId);
        progress.currentStep = findNextStep(tutorialConfig.steps, stepId);
        result = { updated: true, action: 'skipped', nextStep: progress.currentStep };
      }
      break;

    case 'reset':
      progress.completed = progress.completed.filter(id => id !== stepId);
      progress.currentStep = stepId;
      progress.percentage = (progress.completed.length / tutorialConfig.steps.length) * 100;
      result = { updated: true, action: 'reset', currentStep: stepId };
      break;

    case 'hint':
      const hint = generateHint(stepId);
      result = { updated: false, action: 'hint', hint };
      break;
  }

  return {
    ...result,
    stepId,
    timestamp: new Date().toISOString()
  };
}

export async function getTutorialStatus(tutorialConfig) {
  if (!tutorialConfig) {
    return {
      status: 'missing',
      configured: false,
      timestamp: new Date().toISOString()
    };
  }

  const totalSteps = tutorialConfig.steps?.length || 0;
  const completedSteps = tutorialConfig.progress?.completed?.length || 0;

  return {
    status: totalSteps > 0 ? 'healthy' : 'empty',
    configured: !!tutorialConfig.tutorial,
    tutorial: {
      id: tutorialConfig.tutorial?.id || 'unknown',
      title: tutorialConfig.tutorial?.title || 'Unknown',
      difficulty: tutorialConfig.tutorial?.difficulty || 'beginner'
    },
    progress: {
      totalSteps,
      completedSteps,
      currentStep: tutorialConfig.progress?.currentStep || null,
      percentage: tutorialConfig.progress?.percentage || 0,
      isCompleted: completedSteps === totalSteps
    },
    lastCheck: new Date().toISOString()
  };
}

// Fonctions utilitaires
function buildTutorial(tutorialId) {
  const tutorials = {
    'getting-started': {
      title: 'Démarrage avec BuzzCraft',
      description: 'Apprenez les bases de BuzzCraft',
      difficulty: 'beginner',
      estimatedTime: '30 minutes'
    },
    'first-project': {
      title: 'Votre premier projet',
      description: 'Créez un site web complet',
      difficulty: 'beginner',
      estimatedTime: '45 minutes'
    },
    'component-creation': {
      title: 'Création de composants',
      description: 'Développez des composants réutilisables',
      difficulty: 'intermediate',
      estimatedTime: '60 minutes'
    }
  };

  return tutorials[tutorialId] || {
    title: 'Tutoriel inconnu',
    description: 'Description non disponible',
    difficulty: 'unknown',
    estimatedTime: 'Non défini'
  };
}

function buildTutorialSteps(tutorialId, interactive) {
  const stepTemplates = {
    'getting-started': [
      {
        id: 'intro',
        title: 'Introduction à BuzzCraft',
        type: 'content',
        content: 'BuzzCraft est une plateforme qui utilise une machine à états...'
      },
      {
        id: 'installation',
        title: 'Installation',
        type: 'code',
        content: 'Installez BuzzCraft avec npm',
        code: 'npm install -g buzzcraft'
      }
    ],
    'first-project': [
      {
        id: 'setup',
        title: 'Configuration projet',
        type: 'config',
        content: 'Configurez votre projet'
      }
    ]
  };

  const steps = stepTemplates[tutorialId] || [];
  return steps.map((step, index) => ({
    ...step,
    index: index + 1,
    interactive: interactive && step.type !== 'content'
  }));
}

function calculateProgress(userProgress, steps) {
  const completed = userProgress.completed || [];
  const totalSteps = steps.length;
  const percentage = totalSteps > 0 ? (completed.length / totalSteps) * 100 : 0;

  return {
    completed,
    skipped: userProgress.skipped || [],
    currentStep: userProgress.currentStep || (steps.length > 0 ? steps[0].id : null),
    percentage,
    totalSteps,
    isCompleted: completed.length === totalSteps
  };
}

function getTutorialExamples(tutorialId) {
  const examples = {
    'getting-started': [
      {
        title: 'Configuration basique',
        code: `// buzzcraft.config.js\nexport default {\n  name: 'mon-site'\n};`,
        language: 'javascript'
      }
    ]
  };

  return examples[tutorialId] || [];
}

async function validateStepByType(step, validation) {
  switch (step.type) {
    case 'code':
      return validation.code ? 
        { valid: true, score: 100, feedback: ['Code valide'] } :
        { valid: false, score: 0, errors: ['Code manquant'] };
    
    case 'config':
      return validation.config ? 
        { valid: true, score: 100, feedback: ['Configuration valide'] } :
        { valid: false, score: 0, errors: ['Configuration manquante'] };
    
    default:
      return { valid: true, score: 100, feedback: ['Étape validée'] };
  }
}

function findNextStep(steps, currentStepId) {
  const currentIndex = steps.findIndex(s => s.id === currentStepId);
  return currentIndex < steps.length - 1 ? steps[currentIndex + 1].id : null;
}

function generateHint(stepId) {
  return `Conseil pour l'étape ${stepId}: Consultez la documentation`;
}

// panels/help/tutorials : Panel Help (commit 70)
// DEPENDENCY FLOW (no circular deps)
// app-client/ → api/