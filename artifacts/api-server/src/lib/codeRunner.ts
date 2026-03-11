import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import os from "os";

const execAsync = promisify(exec);

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

export async function runPythonCode(code: string, testCases: TestCase[]): Promise<RunResult> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "codepath-"));
  const codePath = path.join(tmpDir, "solution.py");

  try {
    await fs.writeFile(codePath, code, "utf-8");

    const testResults: TestResult[] = [];
    let allOutput = "";
    let allPassed = true;

    for (const tc of testCases) {
      const testScript = `
import sys
import io

# User's solution
${code}

# Test execution
try:
    input_data = """${tc.input.replace(/"/g, '\\"')}""".strip()
    sys.stdin = io.StringIO(input_data)
    output = io.StringIO()
    sys.stdout = output
    
    # If there's input, try calling main or running as script
    exec(compile(open('${codePath}').read(), '${codePath}', 'exec'), {'__name__': '__main__'})
    
    result = output.getvalue().strip()
    sys.stdout = sys.__stdout__
    print(result)
except Exception as e:
    sys.stdout = sys.__stdout__
    print(f"ERROR: {e}", file=sys.stderr)
    sys.exit(1)
`;
      const runScriptPath = path.join(tmpDir, `test_${tc.name.replace(/\s/g, "_")}.py`);

      let actual = "";
      let error: string | null = null;
      let passed = false;

      try {
        const wrappedCode = buildTestWrapper(code, tc.input);
        await fs.writeFile(runScriptPath, wrappedCode, "utf-8");

        const { stdout, stderr } = await execAsync(
          `timeout 5 python3 "${runScriptPath}"`,
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

      testResults.push({
        name: tc.name,
        passed,
        expected: tc.expectedOutput.trim(),
        actual,
        error,
      });
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

function buildTestWrapper(userCode: string, input: string): string {
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
