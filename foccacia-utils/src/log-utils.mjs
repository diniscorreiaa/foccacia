function now() {
  return new Date().toISOString();
}

export function logInfo(message) {
  console.log(`${now()} ℹ️ Info: ${message}`);
}

export function logSuccess(message) {
  console.log(`${now()} ✅ Sucesso: ${message}`);
}

export function logError(message, error) {
  if (error) {
    console.error(
      `${now()} ❌ Erro: ${message}`,
      error.stack ? error.stack : error
    );
  } else {
    console.error(`${now()} ❌ Erro: ${message}`);
  }
}
