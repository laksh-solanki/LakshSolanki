/**
 * Mindlytic AI - Prompt Library, Starters, and System Constants
 */

export const QUICK_STARTERS = [
  {
    icon: "mdi-bug-outline",
    title: "Debug & Fix Code",
    desc: "Find runtime errors, edge cases, and performance bottlenecks",
    prompt: "Please review and debug the following code. Identify any errors, memory leaks, or anti-patterns and provide the corrected version:\n\n```javascript\nfunction processUserData(users) {\n  let result = [];\n  for (var i = 0; i < users.length; i++) {\n    if (users[i].active == true) {\n      result.push(users[i].name.toUpperCase());\n    }\n  }\n  return result;\n}\n```",
    tool: "chat",
  },
  {
    icon: "mdi-regex",
    title: "Regex & SQL Builder",
    desc: "Generate regular expressions and optimized SQL queries",
    prompt: "Generate an optimized PostgreSQL query that finds the top 5 highest spending customers in the last 90 days, including their total spent, order count, and last purchase date.",
    tool: "chat",
  },
  {
    icon: "mdi-file-document-edit-outline",
    title: "Summarize & Polish",
    desc: "Turn dense articles or transcripts into executive bullet points",
    prompt: "Summarize the key architectural benefits and trade-offs of micro-frontends vs a modular monolith into concise executive bullet points.",
    tool: "summarizer",
  },
  {
    icon: "mdi-auto-fix",
    title: "Prompt Architect",
    desc: "Transform simple ideas into high-performance system prompts",
    prompt: "I want to create an AI assistant for code review that checks security vulnerabilities, performance issues, and readability according to Clean Code standards.",
    tool: "prompter",
  },
  {
    icon: "mdi-code-braces",
    title: "Build REST API Endpoint",
    desc: "Scaffold complete, production-ready Express or FastAPI routes",
    prompt: "Write a production-ready Express.js router for user authentication with JWT, input validation, bcrypt password hashing, and error handling.",
    tool: "chat",
  },
  {
    icon: "mdi-palette-outline",
    title: "Modern CSS Grid & Flex",
    desc: "Create responsive layouts with dark-mode CSS variables",
    prompt: "Create a modern, responsive card grid component in HTML and CSS using CSS Grid (auto-fit minmax), glassmorphism background, and smooth hover elevation transitions.",
    tool: "chat",
  },
];

export const CODE_LANGUAGES = [
  { label: "JavaScript", value: "javascript", ext: "js" },
  { label: "TypeScript", value: "typescript", ext: "ts" },
  { label: "Python", value: "python", ext: "py" },
  { label: "HTML", value: "html", ext: "html" },
  { label: "CSS", value: "css", ext: "css" },
  { label: "SQL", value: "sql", ext: "sql" },
  { label: "JSON", value: "json", ext: "json" },
  { label: "Java", value: "java", ext: "java" },
  { label: "C++", value: "cpp", ext: "cpp" },
  { label: "Go", value: "go", ext: "go" },
  { label: "Rust", value: "rust", ext: "rs" },
  { label: "Shell / Bash", value: "bash", ext: "sh" },
];
