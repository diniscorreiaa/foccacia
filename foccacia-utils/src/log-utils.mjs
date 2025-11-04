function now() {
  return new Date().toISOString();
}

const logTypes = [
  ["logInfo", "ℹ️ Info"],
  ["logSuccess", "✅ Sucesso"],
  ["logError", "❌ Erro"],
];

export const { logInfo, logSuccess, logError } = Object.fromEntries(
  [
    ["logInfo", "ℹ️ Info"],
    ["logSuccess", "✅ Sucesso"],
    ["logError", "❌ Erro"],
  ].map(([name, label]) => [
    name,
    (message, error) => {
      const prefix = `${now()} ${label}: ${message}`;
      if (name === "logError" && error)
        console.error(prefix, error.stack ? error.stack : error);
      else console.log(prefix);
    },
  ])
);
