function now() {
  return new Date().toISOString();
}

export const { logInfo, logSuccess, logError } = Object.fromEntries(
  [
    ["logInfo", "ℹ️ Info"],
    ["logSuccess", "✅ Sucesso"],
    ["logError", "❌ Erro"],
  ].map(([name, label]) => [
    name,
    (message, error) => {
      const prefix = `${now()} ${label}: ${message}`;
      if (name === "logError")
        console.error(prefix, error && (error.stack ? error.stack : error));
      else console.log(prefix);
    },
  ])
);
