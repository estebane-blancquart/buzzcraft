export default {
  // Extensions de fichiers
  defaultSeverity: 'warning',
  
  // Plugins pour fonctionnalités avancées
  plugins: [
    'stylelint-scss',
    'stylelint-order'
  ],
  
  // Extensions rules
  extends: [
    'stylelint-config-standard-scss',
    'stylelint-config-prettier-scss'
  ],
  
  // Rules personnalisées
  rules: {
    // === SCSS SPECIFIC ===
    'scss/at-rule-no-unknown': null,
    'scss/dollar-variable-pattern': '^[a-z][a-zA-Z0-9-]*$',
    'scss/at-import-partial-extension': 'never',
    
    // === FORMATTING ===
    'indentation': 2,
    'string-quotes': 'single',
    'color-hex-case': 'lower',
    'color-hex-length': 'short',
    
    // === ORDERING ===
    'order/properties-alphabetical-order': true,
    
    // === NAMING ===
    'selector-class-pattern': '^[a-z][a-zA-Z0-9-]*$',
    'selector-id-pattern': '^[a-z][a-zA-Z0-9-]*$',
    
    // === PERFORMANCE ===
    'selector-max-id': 1,
    'selector-max-universal': 1,
    'selector-max-compound-selectors': 4,
    
    // === BEST PRACTICES ===
    'declaration-no-important': true,
    'selector-no-qualifying-type': [true, {
      ignore: ['attribute', 'class']
    }],
    
    // === TAILWIND COMPATIBILITY ===
    'at-rule-no-unknown': [true, {
      ignoreAtRules: [
        'tailwind',
        'apply',
        'variants',
        'responsive',
        'screen',
        'layer'
      ]
    }],
    
    // === DISABLE PROBLEMATIC RULES ===
    'no-descending-specificity': null,
    'selector-pseudo-class-no-unknown': [true, {
      ignorePseudoClasses: ['global']
    }]
  },
  
  // Ignorer certains fichiers
  ignoreFiles: [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/*.min.css'
  ]
};