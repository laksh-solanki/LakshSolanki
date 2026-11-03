import assert from "node:assert/strict";
import {
  generateSmartChatFallback,
  generateSmartSummary,
  generateSmartPromptEnhancement,
} from "../src/utils/aiEngines.js";
import {
  QUICK_STARTERS,
} from "../src/utils/mindlyticAiData.js";

console.log("Running Mindlytic AI Engines & Data Tests...\n");

// 1. Data sanity tests
assert(QUICK_STARTERS.length >= 6, "Must have at least 6 quick starters");
console.log("✓ Starters Data passed.");

// 2. Smart Chat Fallback tests
const chatEmpty = generateSmartChatFallback("");
assert(typeof chatEmpty === "string" && chatEmpty.length > 20, "Empty prompt should produce fallback");

const chatGreeting = generateSmartChatFallback("Hello! Who are you?");
assert(chatGreeting.includes("Mindlytic AI"), "Greeting should introduce Mindlytic AI");
assert(chatGreeting.includes("Interactive AI Chat"), "Greeting should list available tools");

const chatVue = generateSmartChatFallback("how to build a reactive component in vue 3");
assert(chatVue.includes("<script setup>") && chatVue.includes("computed"), "Vue query should produce Vue 3 Composition API code");

const chatDocker = generateSmartChatFallback("create a multi-stage dockerfile for node");
assert(chatDocker.includes("FROM node:20-alpine AS builder"), "Docker query should produce multi-stage Dockerfile");

const chatHtml = generateSmartChatFallback("how to center a div in css");
assert(chatHtml.includes("<!DOCTYPE html>") || chatHtml.includes("place-items: center"), "CSS query should return responsive layout");

const chatJs = generateSmartChatFallback("write a fetch function in javascript with retry");
assert(chatJs.includes("AbortController") || chatJs.includes("fetch"), "JS query should return robust fetch");

const chatSql = generateSmartChatFallback("write an analytics query in sql for orders");
assert(chatSql.includes("SELECT") && chatSql.includes("FROM"), "SQL query should return valid SQL block");
console.log("✓ Smart Chat Fallback passed.");

// 3. Smart Text Summarizer tests
const sumEmpty = generateSmartSummary("");
assert.equal(sumEmpty.status, "empty");

const longText = "Artificial intelligence is evolving at a breakneck speed. Teams are adopting LLMs across documentation and development workflows. Monitoring and security remain paramount.";
const sumBullets = generateSmartSummary(longText, "bullet_points", "short");
assert.equal(sumBullets.status, "success");
assert(sumBullets.summary.includes("• **Point"), "Should contain bullet points");
assert(sumBullets.wordCountOriginal > 0, "Should count original words");
assert(sumBullets.reductionPercent >= 0, "Reduction should be non-negative");

const sumExec = generateSmartSummary(longText, "executive", "detailed");
assert(sumExec.summary.includes("Executive Summary"), "Should contain Executive Summary header");
console.log("✓ Smart Text Summarizer passed.");

// 4. Smart Prompt Enhancer tests
const promptEmpty = generateSmartPromptEnhancement("");
assert(promptEmpty.enhanced.includes("Please provide"), "Empty prompt should request input");

const enhancedRtce = generateSmartPromptEnhancement("Build a markdown table editor", "rtce", "universal");
assert(enhancedRtce.enhanced.includes("Role & Persona"), "RTCE should have Role & Persona");
assert(enhancedRtce.enhanced.includes("Strict Constraints"), "RTCE should have Strict Constraints");

const enhancedCot = generateSmartPromptEnhancement("Debug memory leak in websocket server", "cot", "gemini");
assert(enhancedCot.enhanced.includes("Chain-of-Thought"), "COT should have Chain-of-Thought header");

const enhancedSpec = generateSmartPromptEnhancement("Implement resilient distributed locking", "spec", "openai");
assert(enhancedSpec.enhanced.includes("Senior Engineer Production Specification"), "Spec framework should have senior engineer title");
console.log("✓ Smart Prompt Enhancer passed.");

console.log("\nALL VERIFICATION SUITES PASSED CLEANLY!");
