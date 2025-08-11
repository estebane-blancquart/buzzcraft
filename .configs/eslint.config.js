export default [
  {
    files: ["**/*.js", "**/*.jsx"],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: "module",
      globals: {
        console: "readonly",
        process: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        __filename: "readonly"
      }
    },
    rules: {
      // Erreurs critiques
      "no-unused-vars": ["error", { 
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_" 
      }],
      "no-undef": "error",
      "no-console": "off", // Autorisé pour nos logs
      "no-debugger": "error",
      
      // Style cohérent
      "indent": ["error", 2],
      "quotes": ["error", "single", { avoidEscape: true }],
      "semi": ["error", "always"],
      "comma-dangle": ["error", "never"],
      
      // Bonnes pratiques
      "eqeqeq": ["error", "always"],
      "no-var": "error",
      "prefer-const": "error",
      "arrow-spacing": "error",
      "object-curly-spacing": ["error", "always"],
      "array-bracket-spacing": ["error", "never"],
      
      // Imports
      "no-duplicate-imports": "error",
      
      // Perfectionnisme BuzzCraft
      "no-trailing-spaces": "error",
      "eol-last": "error",
      "max-len": ["warn", { code: 120 }],
      "no-multiple-empty-lines": ["error", { max: 2 }]
    }
  },
  {
    files: ["**/*.jsx"],
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    rules: {
      // React spécifique
      "react/jsx-uses-react": "off", // React 17+
      "react/react-in-jsx-scope": "off" // React 17+
    }
  },
  {
    files: [".tests/**/*.js"],
    languageOptions: {
      globals: {
        describe: "readonly",
        test: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        jest: "readonly"
      }
    }
  }
];