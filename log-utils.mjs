"use strict";

export function logInfo(message) {
  console.log(`ℹ️ Info: ${message}`);
}

export function logSuccess(message) {
  console.log(`✅ Sucesso: ${message}`);
}

export function logError(message, error) {
  console.error(`❌ Erro: ${message}`, error);
}
