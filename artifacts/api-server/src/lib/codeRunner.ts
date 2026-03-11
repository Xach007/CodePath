import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import os from "os";

const execFileAsync = promisify(execFile);

interface TestCase {
  name: string;
  input: string;
  expectedOutput: string;
}

interface TestResult {
  name: string;
  passed: boolean;
  expected: string;
  actual: string;
  error: string | null;
}

interface RunResult {
  passed: boolean;
  testResults: TestResult[];
  output: string;
  errorMessage: string | null;
}

export async function runCode(code: string, language: string, testCases: TestCase[]): Promise<RunResult> {
  switch (language.toLowerCase()) {
    case "python":
      return runPythonCode(code, testCases);
    case "javascript":
      return runJavaScriptCode(code, testCases);
    case "html":
    case "css":
      return runHtmlCssCode(code, testCases);
    case "sql":
      return runSqlCode(code, testCases);
    default:
      return runPythonCode(code, testCases);
  }
}

async function runPythonCode(code: string, testCases: TestCase[]): Promise<RunResult> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "codepath-"));
  const codePath = path.join(tmpDir, "solution.py");

  try {
    await fs.writeFile(codePath, code, "utf-8");
    const testResults: TestResult[] = [];
    let allOutput = "";
    let allPassed = true;

    for (const tc of testCases) {
      const runScriptPath = path.join(tmpDir, `test_${tc.name.replace(/\s/g, "_")}.py`);
      let actual = "";
      let error: string | null = null;
      let passed = false;

      try {
        const wrappedCode = buildPythonWrapper(code, tc.input);
        await fs.writeFile(runScriptPath, wrappedCode, "utf-8");
        const { stdout, stderr } = await execFileAsync(
          "timeout", ["5", "python3", runScriptPath],
          { timeout: 6000 }
        );
        actual = stdout.trim();
        allOutput += stdout;
        if (stderr) allOutput += stderr;
        passed = actual === tc.expectedOutput.trim();
      } catch (err: any) {
        const errMsg = err.stderr || err.message || "Execution error";
        error = errMsg.replace(/File ".*?", /g, "").substring(0, 300);
        actual = "";
        passed = false;
        allOutput += error;
      }

      if (!passed) allPassed = false;
      testResults.push({ name: tc.name, passed, expected: tc.expectedOutput.trim(), actual, error });
    }

    return {
      passed: allPassed,
      testResults,
      output: allOutput.substring(0, 2000),
      errorMessage: allPassed ? null : "Some tests failed. Check the results above.",
    };
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
}

async function runJavaScriptCode(code: string, testCases: TestCase[]): Promise<RunResult> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "codepath-js-"));

  try {
    const testResults: TestResult[] = [];
    let allOutput = "";
    let allPassed = true;

    for (const tc of testCases) {
      const scriptPath = path.join(tmpDir, `test_${tc.name.replace(/\s/g, "_")}.js`);
      let actual = "";
      let error: string | null = null;
      let passed = false;

      try {
        const wrappedCode = buildJavaScriptWrapper(code, tc.input);
        await fs.writeFile(scriptPath, wrappedCode, "utf-8");
        const { stdout, stderr } = await execFileAsync(
          "timeout", ["5", "node", scriptPath],
          { timeout: 6000 }
        );
        actual = stdout.trim();
        allOutput += stdout;
        if (stderr) allOutput += stderr;
        passed = actual === tc.expectedOutput.trim();
      } catch (err: any) {
        const errMsg = err.stderr || err.message || "Execution error";
        error = errMsg.replace(/\(.*?:\d+:\d+\)/g, "").substring(0, 300);
        actual = "";
        passed = false;
        allOutput += error;
      }

      if (!passed) allPassed = false;
      testResults.push({ name: tc.name, passed, expected: tc.expectedOutput.trim(), actual, error });
    }

    return {
      passed: allPassed,
      testResults,
      output: allOutput.substring(0, 2000),
      errorMessage: allPassed ? null : "Some tests failed. Check the results above.",
    };
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
}

async function runHtmlCssCode(code: string, testCases: TestCase[]): Promise<RunResult> {
  const testResults: TestResult[] = [];
  let allPassed = true;

  for (const tc of testCases) {
    const expected = tc.expectedOutput.trim().toLowerCase();
    const codeLower = code.toLowerCase();
    const passed = codeLower.includes(expected) || checkHtmlPattern(code, expected);
    if (!passed) allPassed = false;
    testResults.push({
      name: tc.name,
      passed,
      expected: tc.expectedOutput.trim(),
      actual: passed ? tc.expectedOutput.trim() : "Pattern not found in code",
      error: null,
    });
  }

  return {
    passed: allPassed,
    testResults,
    output: code.substring(0, 500),
    errorMessage: allPassed ? null : "Some checks failed. Review your HTML/CSS code.",
  };
}

function checkHtmlPattern(code: string, pattern: string): boolean {
  const normalized = code.replace(/\s+/g, " ").toLowerCase();
  const patternNorm = pattern.replace(/\s+/g, " ").toLowerCase();
  return normalized.includes(patternNorm);
}

async function runSqlCode(code: string, testCases: TestCase[]): Promise<RunResult> {
  const testResults: TestResult[] = [];
  let allPassed = true;

  for (const tc of testCases) {
    const expected = tc.expectedOutput.trim().toLowerCase();
    const codeNorm = code.replace(/\s+/g, " ").trim().toLowerCase();
    const passed = codeNorm.includes(expected) || checkSqlKeywords(code, expected);
    if (!passed) allPassed = false;
    testResults.push({
      name: tc.name,
      passed,
      expected: tc.expectedOutput.trim(),
      actual: passed ? tc.expectedOutput.trim() : "Expected SQL pattern not found",
      error: null,
    });
  }

  return {
    passed: allPassed,
    testResults,
    output: "SQL validated against expected patterns.",
    errorMessage: allPassed ? null : "Some SQL checks failed.",
  };
}

function checkSqlKeywords(code: string, expected: string): boolean {
  const keywords = expected.split(/\s+/);
  const codeUpper = code.toUpperCase();
  return keywords.every(k => codeUpper.includes(k.toUpperCase()));
}

function buildPythonWrapper(userCode: string, input: string): string {
  const escapedInput = input.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
  return `
import sys
import io

sys.stdin = io.StringIO("${escapedInput}")
output_capture = io.StringIO()
sys.stdout = output_capture

try:
${userCode.split("\n").map(l => "    " + l).join("\n")}
except SystemExit:
    pass
except Exception as e:
    sys.stdout = sys.__stdout__
    print(str(e), file=sys.stderr)
    sys.exit(1)

sys.stdout = sys.__stdout__
print(output_capture.getvalue(), end="")
`;
}

function buildJavaScriptWrapper(userCode: string, input: string): string {
  const escapedInput = input.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
  return `
const __inputLines = "${escapedInput}".split("\\n");
let __inputIdx = 0;
const readline = () => __inputLines[__inputIdx++] || "";
const prompt = readline;

try {
${userCode}
} catch(e) {
  console.error(e.message);
  process.exit(1);
}
`;
}
