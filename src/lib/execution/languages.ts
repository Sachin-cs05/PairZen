export type SupportedLanguage =
  | "typescript"
  | "javascript"
  | "python"
  | "java"
  | "cpp"
  | "go"
  | "rust";

export interface LanguageConfig {
  id: SupportedLanguage;
  name: string;
  monacoLanguage: string;
  judge0Id: number; // Judge0 standard language ID
  version: string;
  isCompiled: boolean;
  fileExtension: string;
}

export const SUPPORTED_LANGUAGES: Record<SupportedLanguage, LanguageConfig> = {
  typescript: {
    id: "typescript",
    name: "TypeScript",
    monacoLanguage: "typescript",
    judge0Id: 74, // TypeScript (3.7.4 / 4.x / 5.x)
    version: "5.x",
    isCompiled: true,
    fileExtension: ".ts",
  },
  javascript: {
    id: "javascript",
    name: "JavaScript (Node.js)",
    monacoLanguage: "javascript",
    judge0Id: 63, // JavaScript (Node.js 12.14.0+)
    version: "Node.js 20+",
    isCompiled: false,
    fileExtension: ".js",
  },
  python: {
    id: "python",
    name: "Python 3",
    monacoLanguage: "python",
    judge0Id: 71, // Python (3.8.1+)
    version: "3.10+",
    isCompiled: false,
    fileExtension: ".py",
  },
  java: {
    id: "java",
    name: "Java",
    monacoLanguage: "java",
    judge0Id: 62, // Java (OpenJDK 13/17+)
    version: "OpenJDK 17",
    isCompiled: true,
    fileExtension: ".java",
  },
  cpp: {
    id: "cpp",
    name: "C++ (GCC)",
    monacoLanguage: "cpp",
    judge0Id: 54, // C++ (GCC 9.2.0+)
    version: "GCC 11+",
    isCompiled: true,
    fileExtension: ".cpp",
  },
  go: {
    id: "go",
    name: "Go",
    monacoLanguage: "go",
    judge0Id: 60, // Go (1.13.5+)
    version: "1.20+",
    isCompiled: true,
    fileExtension: ".go",
  },
  rust: {
    id: "rust",
    name: "Rust",
    monacoLanguage: "rust",
    judge0Id: 73, // Rust (1.40.0+)
    version: "1.70+",
    isCompiled: true,
    fileExtension: ".rs",
  },
};

export const LANGUAGE_LIST = Object.values(SUPPORTED_LANGUAGES);

export function isSupportedLanguage(lang: string): lang is SupportedLanguage {
  return lang in SUPPORTED_LANGUAGES;
}

export function getLanguageConfig(lang: string): LanguageConfig {
  if (isSupportedLanguage(lang)) {
    return SUPPORTED_LANGUAGES[lang];
  }
  return SUPPORTED_LANGUAGES.typescript;
}
