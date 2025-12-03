export function initLogUtils() {
  function now() {
    return new Date().toISOString();
  }

  const { logInfo, logSuccess, logError } = Object.fromEntries(
    [
      ["logInfo", "ℹ️ Info"],
      ["logSuccess", "✅ Sucesso"],
      ["logError", "❌ Erro"],
    ].map(([name, label]) => [
      name,
      (message, error) => {
        const prefix = `${now()} ${label}: ${message}`;

        // TODO : Tiago => create property variable to control log level
        if (name === "logError")
          console.error(prefix, error && (error.stack ? error.stack : error));
        else console.log(prefix);
      },
    ])
  );
  return { logInfo, logSuccess, logError };
}
