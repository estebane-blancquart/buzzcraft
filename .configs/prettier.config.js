export default {
  // Base formatting
  printWidth: 120,
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: true,
  quoteProps: 'as-needed',
  
  // Arrays et objects
  trailingComma: 'none',
  bracketSpacing: true,
  bracketSameLine: false,
  
  // JSX
  jsxSingleQuote: false,
  jsxBracketSameLine: false,
  
  // Arrow functions
  arrowParens: 'avoid',
  
  // Files
  endOfLine: 'lf',
  insertFinalNewline: true,
  
  // Overrides pour fichiers spécifiques
  overrides: [
    {
      files: '*.json',
      options: {
        tabWidth: 2
      }
    },
    {
      files: '*.md',
      options: {
        printWidth: 80,
        proseWrap: 'always'
      }
    },
    {
      files: '*.hbs',
      options: {
        parser: 'html',
        printWidth: 100
      }
    },
    {
      files: '*.scss',
      options: {
        singleQuote: false
      }
    }
  ]
};