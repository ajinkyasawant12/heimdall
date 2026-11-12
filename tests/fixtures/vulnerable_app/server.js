const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

function handleUserDiagnostic(userInput) {
  // Vulnerability 1: Command Injection
  console.log("Executing diagnostic: " + userInput);
  const result = execSync(`echo ${userInput}`);
  return result.toString();
}

function serveStaticAsset(userFilePath) {
  // Vulnerability 2: Path Traversal
  const fullPath = path.join("/app/public", userFilePath);
  return fs.readFileSync(fullPath, "utf-8");
}

module.exports = { handleUserDiagnostic, serveStaticAsset };
