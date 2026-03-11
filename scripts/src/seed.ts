import { db } from "@workspace/db";
import {
  achievementsTable,
  coursesTable,
  modulesTable,
  lessonsTable,
  quizQuestionsTable,
  quizOptionsTable,
  codingChallengesTable,
  testCasesTable,
} from "@workspace/db";

async function createQuiz(lessonId: number, questions: { question: string; explanation: string; options: { text: string; isCorrect: boolean }[] }[]) {
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const [row] = await db.insert(quizQuestionsTable).values({
      lessonId, question: q.question, explanation: q.explanation, orderIndex: i,
    }).returning();
    await db.insert(quizOptionsTable).values(
      q.options.map((o, j) => ({ questionId: row.id, text: o.text, isCorrect: o.isCorrect, orderIndex: j }))
    );
  }
}

async function createChallenge(lessonId: number, data: { instructions: string; starterCode: string; language: string; hints: string[]; tests: { name: string; input: string; expectedOutput: string }[] }) {
  const [ch] = await db.insert(codingChallengesTable).values({
    lessonId, instructions: data.instructions, starterCode: data.starterCode, language: data.language, hints: data.hints,
  }).returning();
  await db.insert(testCasesTable).values(
    data.tests.map((t, i) => ({ challengeId: ch.id, name: t.name, input: t.input, expectedOutput: t.expectedOutput, isHidden: 0, orderIndex: i }))
  );
}

async function seed() {
  console.log("Seeding database...");

  const existingAchievements = await db.select().from(achievementsTable);
  if (existingAchievements.length === 0) {
    await db.insert(achievementsTable).values([
      { key: "first_lesson", title: "First Step", description: "Complete your first lesson", icon: "🎯", xpReward: 10 },
      { key: "lesson_5", title: "Quick Learner", description: "Complete 5 lessons", icon: "⚡", xpReward: 25 },
      { key: "lesson_25", title: "Knowledge Seeker", description: "Complete 25 lessons", icon: "📚", xpReward: 50 },
      { key: "lesson_100", title: "Century Club", description: "Complete 100 lessons", icon: "💯", xpReward: 200 },
      { key: "streak_3", title: "On a Roll", description: "Maintain a 3-day streak", icon: "🔥", xpReward: 15 },
      { key: "streak_7", title: "Week Warrior", description: "Maintain a 7-day streak", icon: "🌟", xpReward: 50 },
      { key: "streak_30", title: "Unstoppable", description: "Maintain a 30-day streak", icon: "🏆", xpReward: 200 },
      { key: "xp_100", title: "XP Collector", description: "Earn 100 XP", icon: "💎", xpReward: 0 },
      { key: "xp_500", title: "XP Hoarder", description: "Earn 500 XP", icon: "👑", xpReward: 0 },
      { key: "xp_1000", title: "XP Master", description: "Earn 1000 XP", icon: "🚀", xpReward: 0 },
      { key: "first_course", title: "Course Complete", description: "Finish your first course", icon: "🎓", xpReward: 100 },
    ]);
    console.log("Achievements seeded");
  }

  const existingCourses = await db.select().from(coursesTable);
  if (existingCourses.length > 0) {
    console.log("Courses already exist, skipping course seed.");
    return;
  }

  // =============== PYTHON COURSE ===============
  const [pythonCourse] = await db.insert(coursesTable).values({
    title: "Python Fundamentals",
    description: "Master the basics of Python programming from scratch. Learn variables, control flow, functions, and data structures through hands-on exercises.",
    language: "python", difficulty: "beginner", totalLessons: 18, estimatedHours: 6, xpReward: 500, isPublished: true,
  }).returning();

  // Python Module 1: Getting Started
  const [pyMod1] = await db.insert(modulesTable).values({ courseId: pythonCourse.id, title: "Getting Started with Python", description: "Write your first Python programs", orderIndex: 0 }).returning();

  await db.insert(lessonsTable).values({ moduleId: pyMod1.id, title: "What is Python?", type: "theory", orderIndex: 0, xpReward: 10, estimatedMinutes: 5,
    content: `# What is Python?\n\nPython is a **high-level, interpreted programming language** created by Guido van Rossum in 1991.\n\n## Why Python?\n\n- **Beginner-friendly**: Python's syntax is close to plain English\n- **Versatile**: Used in web development, data science, AI, automation\n- **Huge ecosystem**: Thousands of libraries available\n\n## Basic Output\n\n\`\`\`python\nprint("Hello, World!")\nprint("Python is awesome!")\nprint(42)\n\`\`\`\n\nEach \`print()\` call outputs to a new line.\n\n## Comments\n\n\`\`\`python\n# This is a single-line comment\nprint("This runs")  # Inline comment\n\`\`\``,
  });

  const [pyQuiz1] = await db.insert(lessonsTable).values({ moduleId: pyMod1.id, title: "Python Basics Quiz", type: "quiz", orderIndex: 1, xpReward: 15, estimatedMinutes: 5 }).returning();
  await createQuiz(pyQuiz1.id, [
    { question: "Who created Python?", explanation: "Python was created by Guido van Rossum in 1991.", options: [{ text: "Guido van Rossum", isCorrect: true }, { text: "Linus Torvalds", isCorrect: false }, { text: "James Gosling", isCorrect: false }, { text: "Brendan Eich", isCorrect: false }] },
    { question: "Which function displays output in Python?", explanation: "print() is the primary output function.", options: [{ text: "print()", isCorrect: true }, { text: "echo()", isCorrect: false }, { text: "console.log()", isCorrect: false }, { text: "display()", isCorrect: false }] },
    { question: "What symbol starts a comment in Python?", explanation: "# is used for single-line comments.", options: [{ text: "#", isCorrect: true }, { text: "//", isCorrect: false }, { text: "/*", isCorrect: false }, { text: "--", isCorrect: false }] },
  ]);

  const [pyCh1] = await db.insert(lessonsTable).values({ moduleId: pyMod1.id, title: "Your First Program", type: "challenge", orderIndex: 2, xpReward: 25, estimatedMinutes: 10 }).returning();
  await createChallenge(pyCh1.id, {
    instructions: "## Your First Python Program\n\nPrint exactly:\n```\nHello, World!\nI love Python!\n```", starterCode: '# Write your solution below\n', language: "python",
    hints: ["Use print() for each line", 'print("Hello, World!")'], tests: [{ name: "Correct output", input: "", expectedOutput: "Hello, World!\nI love Python!" }],
  });

  // Python Module 2: Variables
  const [pyMod2] = await db.insert(modulesTable).values({ courseId: pythonCourse.id, title: "Variables and Data Types", description: "Learn how to store and work with data", orderIndex: 1 }).returning();

  await db.insert(lessonsTable).values({ moduleId: pyMod2.id, title: "Variables in Python", type: "theory", orderIndex: 0, xpReward: 10, estimatedMinutes: 8,
    content: `# Variables in Python\n\nA **variable** stores a value. Create one with \`=\`:\n\n\`\`\`python\nname = "Alice"\nage = 25\nheight = 5.7\nis_student = True\n\`\`\`\n\n## Data Types\n\n| Type | Example |\n|------|--------|\n| \`str\` | \`"Hello"\` |\n| \`int\` | \`42\` |\n| \`float\` | \`3.14\` |\n| \`bool\` | \`True/False\` |\n\n## String Operations\n\n\`\`\`python\nfirst = "John"\nlast = "Doe"\nfull = first + " " + last\nprint(f"Hello, {first}!")\n\`\`\``,
  });

  const [pyQuiz2] = await db.insert(lessonsTable).values({ moduleId: pyMod2.id, title: "Variables Quiz", type: "quiz", orderIndex: 1, xpReward: 15, estimatedMinutes: 5 }).returning();
  await createQuiz(pyQuiz2.id, [
    { question: 'What is the type of "Hello"?', explanation: "Text in quotes is a string (str).", options: [{ text: "str", isCorrect: true }, { text: "int", isCorrect: false }, { text: "float", isCorrect: false }, { text: "bool", isCorrect: false }] },
    { question: "Which is a valid variable name?", explanation: "Variable names use letters, numbers, underscores; must start with letter/underscore.", options: [{ text: "my_variable", isCorrect: true }, { text: "2variable", isCorrect: false }, { text: "my-variable", isCorrect: false }, { text: "my variable", isCorrect: false }] },
    { question: "What does type(42) return?", explanation: "42 is a whole number, so its type is int.", options: [{ text: "<class 'int'>", isCorrect: true }, { text: "<class 'str'>", isCorrect: false }, { text: "<class 'float'>", isCorrect: false }, { text: "<class 'num'>", isCorrect: false }] },
  ]);

  const [pyCh2] = await db.insert(lessonsTable).values({ moduleId: pyMod2.id, title: "Variable Calculator", type: "challenge", orderIndex: 2, xpReward: 30, estimatedMinutes: 10 }).returning();
  await createChallenge(pyCh2.id, {
    instructions: "## Variable Calculator\n\nGiven `a = 10` and `b = 3`, print:\n```\nSum: 13\nDifference: 7\nProduct: 30\n```",
    starterCode: 'a = 10\nb = 3\n\n# Calculate and print\n', language: "python",
    hints: ["Use + - * operators", 'f"Sum: {a + b}"'], tests: [{ name: "Correct calculations", input: "", expectedOutput: "Sum: 13\nDifference: 7\nProduct: 30" }],
  });

  // Python Module 3: Control Flow
  const [pyMod3] = await db.insert(modulesTable).values({ courseId: pythonCourse.id, title: "Control Flow", description: "Make decisions and repeat actions", orderIndex: 2 }).returning();

  await db.insert(lessonsTable).values({ moduleId: pyMod3.id, title: "If Statements", type: "theory", orderIndex: 0, xpReward: 10, estimatedMinutes: 8,
    content: `# If Statements\n\n\`\`\`python\nage = 18\nif age >= 18:\n    print("You can vote!")\n\`\`\`\n\n## If-Elif-Else\n\n\`\`\`python\nscore = 85\nif score >= 90:\n    print("Grade: A")\nelif score >= 80:\n    print("Grade: B")\nelif score >= 70:\n    print("Grade: C")\nelse:\n    print("Grade: F")\n\`\`\`\n\n## Comparison Operators\n\n\`==\`, \`!=\`, \`>\`, \`<\`, \`>=\`, \`<=\`\n\n## Logical Operators\n\n\`and\`, \`or\`, \`not\``,
  });

  const [pyQuiz3] = await db.insert(lessonsTable).values({ moduleId: pyMod3.id, title: "Control Flow Quiz", type: "quiz", orderIndex: 1, xpReward: 15, estimatedMinutes: 5 }).returning();
  await createQuiz(pyQuiz3.id, [
    { question: "What keyword is used for 'else if' in Python?", explanation: "Python uses 'elif' for additional conditions.", options: [{ text: "elif", isCorrect: true }, { text: "elseif", isCorrect: false }, { text: "else if", isCorrect: false }, { text: "elsif", isCorrect: false }] },
    { question: "What does 'and' do in Python?", explanation: "'and' returns True only if both conditions are True.", options: [{ text: "Both conditions must be True", isCorrect: true }, { text: "Either condition can be True", isCorrect: false }, { text: "Negates a condition", isCorrect: false }, { text: "Combines strings", isCorrect: false }] },
    { question: "What operator checks equality?", explanation: "== checks if two values are equal. = is assignment.", options: [{ text: "==", isCorrect: true }, { text: "=", isCorrect: false }, { text: "===", isCorrect: false }, { text: "!=", isCorrect: false }] },
  ]);

  const [pyCh3] = await db.insert(lessonsTable).values({ moduleId: pyMod3.id, title: "Grade Calculator", type: "challenge", orderIndex: 2, xpReward: 30, estimatedMinutes: 10 }).returning();
  await createChallenge(pyCh3.id, {
    instructions: "## Grade Calculator\n\nGiven `score = 75`, print the letter grade:\n- 90+: `Grade: A`\n- 80-89: `Grade: B`\n- 70-79: `Grade: C`\n- 60-69: `Grade: D`\n- Below 60: `Grade: F`",
    starterCode: 'score = 75\n\n# Write your if-elif-else chain\n', language: "python",
    hints: ["Use elif for multiple conditions", "Check from highest to lowest"], tests: [{ name: "Score 75 = Grade C", input: "", expectedOutput: "Grade: C" }],
  });

  // Python Module 4: Loops
  const [pyMod4] = await db.insert(modulesTable).values({ courseId: pythonCourse.id, title: "Loops", description: "Repeat actions with for and while loops", orderIndex: 3 }).returning();

  await db.insert(lessonsTable).values({ moduleId: pyMod4.id, title: "For and While Loops", type: "theory", orderIndex: 0, xpReward: 10, estimatedMinutes: 8,
    content: `# Loops in Python\n\n## For Loop\n\n\`\`\`python\nfor i in range(5):\n    print(i)  # 0, 1, 2, 3, 4\n\nfruits = ["apple", "banana", "cherry"]\nfor fruit in fruits:\n    print(fruit)\n\`\`\`\n\n## While Loop\n\n\`\`\`python\ncount = 0\nwhile count < 5:\n    print(count)\n    count += 1\n\`\`\`\n\n## range() Function\n\n\`\`\`python\nrange(5)        # 0,1,2,3,4\nrange(2, 8)     # 2,3,4,5,6,7\nrange(0, 10, 2) # 0,2,4,6,8\n\`\`\`\n\n## Break and Continue\n\n\`\`\`python\nfor i in range(10):\n    if i == 5:\n        break    # Exit loop\n    if i % 2 == 0:\n        continue # Skip even\n    print(i)\n\`\`\``,
  });

  const [pyQuiz4] = await db.insert(lessonsTable).values({ moduleId: pyMod4.id, title: "Loops Quiz", type: "quiz", orderIndex: 1, xpReward: 15, estimatedMinutes: 5 }).returning();
  await createQuiz(pyQuiz4.id, [
    { question: "What does range(3) produce?", explanation: "range(3) generates 0, 1, 2.", options: [{ text: "0, 1, 2", isCorrect: true }, { text: "1, 2, 3", isCorrect: false }, { text: "0, 1, 2, 3", isCorrect: false }, { text: "3", isCorrect: false }] },
    { question: "What does 'break' do in a loop?", explanation: "break immediately exits the loop.", options: [{ text: "Exits the loop", isCorrect: true }, { text: "Skips current iteration", isCorrect: false }, { text: "Restarts the loop", isCorrect: false }, { text: "Pauses the loop", isCorrect: false }] },
    { question: "Which loop runs while a condition is True?", explanation: "while loops continue as long as their condition is True.", options: [{ text: "while", isCorrect: true }, { text: "for", isCorrect: false }, { text: "do", isCorrect: false }, { text: "repeat", isCorrect: false }] },
  ]);

  const [pyCh4] = await db.insert(lessonsTable).values({ moduleId: pyMod4.id, title: "Sum of Numbers", type: "challenge", orderIndex: 2, xpReward: 30, estimatedMinutes: 10 }).returning();
  await createChallenge(pyCh4.id, {
    instructions: "## Sum of Numbers\n\nUse a loop to calculate the sum of numbers from 1 to 10 and print the result.\n\nExpected output: `55`",
    starterCode: '# Calculate sum of 1 to 10 using a loop\n', language: "python",
    hints: ["Use range(1, 11)", "Initialize total = 0, then add each number"], tests: [{ name: "Sum equals 55", input: "", expectedOutput: "55" }],
  });

  // Python Module 5: Functions
  const [pyMod5] = await db.insert(modulesTable).values({ courseId: pythonCourse.id, title: "Functions", description: "Write reusable code with functions", orderIndex: 4 }).returning();

  await db.insert(lessonsTable).values({ moduleId: pyMod5.id, title: "Defining Functions", type: "theory", orderIndex: 0, xpReward: 10, estimatedMinutes: 8,
    content: `# Functions\n\nFunctions are reusable blocks of code.\n\n## Defining a Function\n\n\`\`\`python\ndef greet(name):\n    return f"Hello, {name}!"\n\nresult = greet("Alice")\nprint(result)  # Hello, Alice!\n\`\`\`\n\n## Parameters and Return\n\n\`\`\`python\ndef add(a, b):\n    return a + b\n\ndef is_even(n):\n    return n % 2 == 0\n\`\`\`\n\n## Default Parameters\n\n\`\`\`python\ndef greet(name, greeting="Hello"):\n    return f"{greeting}, {name}!"\n\nprint(greet("Bob"))           # Hello, Bob!\nprint(greet("Bob", "Hi"))     # Hi, Bob!\n\`\`\``,
  });

  const [pyQuiz5] = await db.insert(lessonsTable).values({ moduleId: pyMod5.id, title: "Functions Quiz", type: "quiz", orderIndex: 1, xpReward: 15, estimatedMinutes: 5 }).returning();
  await createQuiz(pyQuiz5.id, [
    { question: "What keyword defines a function?", explanation: "'def' is used to define functions in Python.", options: [{ text: "def", isCorrect: true }, { text: "function", isCorrect: false }, { text: "func", isCorrect: false }, { text: "define", isCorrect: false }] },
    { question: "What does 'return' do?", explanation: "'return' sends a value back from a function.", options: [{ text: "Sends a value back to the caller", isCorrect: true }, { text: "Prints a value", isCorrect: false }, { text: "Ends the program", isCorrect: false }, { text: "Creates a variable", isCorrect: false }] },
    { question: "What happens if a function has no return statement?", explanation: "Functions without return implicitly return None.", options: [{ text: "Returns None", isCorrect: true }, { text: "Causes an error", isCorrect: false }, { text: "Returns 0", isCorrect: false }, { text: "Returns empty string", isCorrect: false }] },
  ]);

  const [pyCh5] = await db.insert(lessonsTable).values({ moduleId: pyMod5.id, title: "Factorial Function", type: "challenge", orderIndex: 2, xpReward: 35, estimatedMinutes: 10 }).returning();
  await createChallenge(pyCh5.id, {
    instructions: "## Factorial Function\n\nWrite a function `factorial(n)` that returns the factorial of n.\n\nThen print `factorial(5)` which should output `120`.\n\nFactorial: 5! = 5 x 4 x 3 x 2 x 1 = 120",
    starterCode: 'def factorial(n):\n    # Your code here\n    pass\n\nprint(factorial(5))\n', language: "python",
    hints: ["Use a loop from 1 to n", "Multiply result by each number"], tests: [{ name: "factorial(5) = 120", input: "", expectedOutput: "120" }],
  });

  // Python Module 6: Lists and Dicts
  const [pyMod6] = await db.insert(modulesTable).values({ courseId: pythonCourse.id, title: "Data Structures", description: "Work with lists and dictionaries", orderIndex: 5 }).returning();

  await db.insert(lessonsTable).values({ moduleId: pyMod6.id, title: "Lists and Dictionaries", type: "theory", orderIndex: 0, xpReward: 10, estimatedMinutes: 8,
    content: `# Lists and Dictionaries\n\n## Lists\n\n\`\`\`python\nfruits = ["apple", "banana", "cherry"]\nprint(fruits[0])    # apple\nfruits.append("date")\nprint(len(fruits))  # 4\n\`\`\`\n\n## List Operations\n\n\`\`\`python\nnums = [3, 1, 4, 1, 5]\nnums.sort()          # [1, 1, 3, 4, 5]\nnums.reverse()       # [5, 4, 3, 1, 1]\nprint(sum(nums))     # 14\n\`\`\`\n\n## Dictionaries\n\n\`\`\`python\nperson = {"name": "Alice", "age": 25}\nprint(person["name"])  # Alice\nperson["city"] = "NYC"\n\`\`\`\n\n## Looping Through Dicts\n\n\`\`\`python\nfor key, value in person.items():\n    print(f"{key}: {value}")\n\`\`\``,
  });

  const [pyQuiz6] = await db.insert(lessonsTable).values({ moduleId: pyMod6.id, title: "Data Structures Quiz", type: "quiz", orderIndex: 1, xpReward: 15, estimatedMinutes: 5 }).returning();
  await createQuiz(pyQuiz6.id, [
    { question: "How do you access the first item in a list?", explanation: "Python lists use 0-based indexing.", options: [{ text: "list[0]", isCorrect: true }, { text: "list[1]", isCorrect: false }, { text: "list.first()", isCorrect: false }, { text: "list.get(0)", isCorrect: false }] },
    { question: "How do you add an item to a list?", explanation: "append() adds an item to the end of a list.", options: [{ text: "list.append(item)", isCorrect: true }, { text: "list.add(item)", isCorrect: false }, { text: "list.push(item)", isCorrect: false }, { text: "list + item", isCorrect: false }] },
    { question: "What type of brackets do dictionaries use?", explanation: "Dictionaries use curly braces {}.", options: [{ text: "{}", isCorrect: true }, { text: "[]", isCorrect: false }, { text: "()", isCorrect: false }, { text: "<>", isCorrect: false }] },
  ]);

  const [pyCh6] = await db.insert(lessonsTable).values({ moduleId: pyMod6.id, title: "Word Counter", type: "challenge", orderIndex: 2, xpReward: 35, estimatedMinutes: 12 }).returning();
  await createChallenge(pyCh6.id, {
    instructions: "## Word Counter\n\nGiven `words = [\"hello\", \"world\", \"hello\", \"python\", \"world\", \"hello\"]`, count how many times each word appears and print in this format:\n```\nhello: 3\nworld: 2\npython: 1\n```",
    starterCode: 'words = ["hello", "world", "hello", "python", "world", "hello"]\n\n# Count and print word frequencies\n', language: "python",
    hints: ["Use a dictionary to count", "Loop through words and increment counts"],
    tests: [{ name: "Correct word counts", input: "", expectedOutput: "hello: 3\nworld: 2\npython: 1" }],
  });

  console.log("Python course seeded (18 lessons)");

  // =============== JAVASCRIPT COURSE ===============
  const [jsCourse] = await db.insert(coursesTable).values({
    title: "JavaScript Essentials",
    description: "Learn JavaScript from zero to building interactive web applications. Master variables, functions, DOM manipulation, and modern ES6+ features.",
    language: "javascript", difficulty: "beginner", totalLessons: 18, estimatedHours: 6, xpReward: 500, isPublished: true,
  }).returning();

  // JS Module 1: Basics
  const [jsMod1] = await db.insert(modulesTable).values({ courseId: jsCourse.id, title: "JavaScript Basics", description: "Your first JavaScript programs", orderIndex: 0 }).returning();

  await db.insert(lessonsTable).values({ moduleId: jsMod1.id, title: "Introduction to JavaScript", type: "theory", orderIndex: 0, xpReward: 10, estimatedMinutes: 6,
    content: `# Introduction to JavaScript\n\nJavaScript is the **programming language of the web**. It runs in every browser and on servers with Node.js.\n\n## Output\n\n\`\`\`javascript\nconsole.log("Hello, World!");\nconsole.log(42);\nconsole.log(true);\n\`\`\`\n\n## Variables\n\n\`\`\`javascript\nlet name = "Alice";     // Can be reassigned\nconst age = 25;         // Cannot be reassigned\nvar old = "avoid this"; // Old way, avoid\n\`\`\`\n\n## Data Types\n\n- **String**: \`"Hello"\` or \`'Hello'\`\n- **Number**: \`42\`, \`3.14\`\n- **Boolean**: \`true\`, \`false\`\n- **undefined**: no value assigned\n- **null**: intentionally empty\n\n## Template Literals\n\n\`\`\`javascript\nconst name = "World";\nconsole.log(\`Hello, \${name}!\`);\n\`\`\``,
  });

  const [jsQuiz1] = await db.insert(lessonsTable).values({ moduleId: jsMod1.id, title: "JS Basics Quiz", type: "quiz", orderIndex: 1, xpReward: 15, estimatedMinutes: 5 }).returning();
  await createQuiz(jsQuiz1.id, [
    { question: "Which keyword declares a constant variable?", explanation: "const declares a variable that cannot be reassigned.", options: [{ text: "const", isCorrect: true }, { text: "let", isCorrect: false }, { text: "var", isCorrect: false }, { text: "constant", isCorrect: false }] },
    { question: "How do you output text in JavaScript?", explanation: "console.log() is the standard output function.", options: [{ text: "console.log()", isCorrect: true }, { text: "print()", isCorrect: false }, { text: "echo()", isCorrect: false }, { text: "write()", isCorrect: false }] },
    { question: "What are template literals wrapped in?", explanation: "Template literals use backticks (`) for string interpolation.", options: [{ text: "Backticks (`)", isCorrect: true }, { text: 'Double quotes (")', isCorrect: false }, { text: "Single quotes (')", isCorrect: false }, { text: "Parentheses ()", isCorrect: false }] },
  ]);

  const [jsCh1] = await db.insert(lessonsTable).values({ moduleId: jsMod1.id, title: "Hello JavaScript", type: "challenge", orderIndex: 2, xpReward: 25, estimatedMinutes: 10 }).returning();
  await createChallenge(jsCh1.id, {
    instructions: "## Hello JavaScript\n\nPrint exactly:\n```\nHello, JavaScript!\nI am learning to code!\n```",
    starterCode: '// Write your solution below\n', language: "javascript",
    hints: ["Use console.log() for each line"], tests: [{ name: "Correct output", input: "", expectedOutput: "Hello, JavaScript!\nI am learning to code!" }],
  });

  // JS Module 2: Functions & Arrays
  const [jsMod2] = await db.insert(modulesTable).values({ courseId: jsCourse.id, title: "Functions and Arrays", description: "Write reusable code and work with collections", orderIndex: 1 }).returning();

  await db.insert(lessonsTable).values({ moduleId: jsMod2.id, title: "Functions in JavaScript", type: "theory", orderIndex: 0, xpReward: 10, estimatedMinutes: 8,
    content: `# Functions\n\n## Function Declaration\n\n\`\`\`javascript\nfunction greet(name) {\n  return \`Hello, \${name}!\`;\n}\nconsole.log(greet("Alice"));\n\`\`\`\n\n## Arrow Functions\n\n\`\`\`javascript\nconst add = (a, b) => a + b;\nconst square = x => x * x;\n\`\`\`\n\n## Arrays\n\n\`\`\`javascript\nconst fruits = ["apple", "banana", "cherry"];\nconsole.log(fruits[0]);    // apple\nconsole.log(fruits.length); // 3\nfruits.push("date");\n\`\`\`\n\n## Array Methods\n\n\`\`\`javascript\nconst nums = [1, 2, 3, 4, 5];\nconst doubled = nums.map(n => n * 2);\nconst evens = nums.filter(n => n % 2 === 0);\nconst sum = nums.reduce((acc, n) => acc + n, 0);\n\`\`\``,
  });

  const [jsQuiz2] = await db.insert(lessonsTable).values({ moduleId: jsMod2.id, title: "Functions & Arrays Quiz", type: "quiz", orderIndex: 1, xpReward: 15, estimatedMinutes: 5 }).returning();
  await createQuiz(jsQuiz2.id, [
    { question: "What is the correct arrow function syntax?", explanation: "Arrow functions use => after parameters.", options: [{ text: "const f = (x) => x * 2", isCorrect: true }, { text: "const f = (x) -> x * 2", isCorrect: false }, { text: "const f = (x) :: x * 2", isCorrect: false }, { text: "const f = function(x) x * 2", isCorrect: false }] },
    { question: "Which method adds an item to the end of an array?", explanation: "push() adds items to the end of an array.", options: [{ text: "push()", isCorrect: true }, { text: "append()", isCorrect: false }, { text: "add()", isCorrect: false }, { text: "insert()", isCorrect: false }] },
    { question: "What does .map() do?", explanation: "map() creates a new array by transforming each element.", options: [{ text: "Creates a new array with transformed elements", isCorrect: true }, { text: "Filters elements", isCorrect: false }, { text: "Sorts the array", isCorrect: false }, { text: "Removes elements", isCorrect: false }] },
  ]);

  const [jsCh2] = await db.insert(lessonsTable).values({ moduleId: jsMod2.id, title: "Array Sum", type: "challenge", orderIndex: 2, xpReward: 30, estimatedMinutes: 10 }).returning();
  await createChallenge(jsCh2.id, {
    instructions: "## Array Sum\n\nWrite a function `sumArray(arr)` that returns the sum of all numbers in an array.\n\nThen print `sumArray([1, 2, 3, 4, 5])` which should output `15`.",
    starterCode: 'function sumArray(arr) {\n  // Your code here\n}\n\nconsole.log(sumArray([1, 2, 3, 4, 5]));\n', language: "javascript",
    hints: ["Use reduce() or a for loop", "reduce((acc, n) => acc + n, 0)"], tests: [{ name: "Sum of [1,2,3,4,5] = 15", input: "", expectedOutput: "15" }],
  });

  // JS Module 3: Objects & Control Flow
  const [jsMod3] = await db.insert(modulesTable).values({ courseId: jsCourse.id, title: "Objects and Control Flow", description: "Work with objects and conditional logic", orderIndex: 2 }).returning();

  await db.insert(lessonsTable).values({ moduleId: jsMod3.id, title: "Objects and Conditionals", type: "theory", orderIndex: 0, xpReward: 10, estimatedMinutes: 8,
    content: `# Objects\n\n\`\`\`javascript\nconst person = {\n  name: "Alice",\n  age: 25,\n  greet() {\n    return \`Hi, I'm \${this.name}\`;\n  }\n};\nconsole.log(person.name);\nconsole.log(person.greet());\n\`\`\`\n\n## Destructuring\n\n\`\`\`javascript\nconst { name, age } = person;\nconst [first, ...rest] = [1, 2, 3, 4];\n\`\`\`\n\n## Conditionals\n\n\`\`\`javascript\nif (age >= 18) {\n  console.log("Adult");\n} else if (age >= 13) {\n  console.log("Teen");\n} else {\n  console.log("Child");\n}\n\`\`\`\n\n## Ternary Operator\n\n\`\`\`javascript\nconst status = age >= 18 ? "adult" : "minor";\n\`\`\``,
  });

  const [jsQuiz3] = await db.insert(lessonsTable).values({ moduleId: jsMod3.id, title: "Objects Quiz", type: "quiz", orderIndex: 1, xpReward: 15, estimatedMinutes: 5 }).returning();
  await createQuiz(jsQuiz3.id, [
    { question: "How do you access an object property?", explanation: "Dot notation (obj.prop) or bracket notation (obj['prop']).", options: [{ text: "obj.property", isCorrect: true }, { text: "obj->property", isCorrect: false }, { text: "obj::property", isCorrect: false }, { text: "obj@property", isCorrect: false }] },
    { question: "What does the ternary operator do?", explanation: "condition ? valueIfTrue : valueIfFalse is a shorthand for if-else.", options: [{ text: "Short if-else expression", isCorrect: true }, { text: "Loops three times", isCorrect: false }, { text: "Creates three variables", isCorrect: false }, { text: "Checks three conditions", isCorrect: false }] },
    { question: "What does destructuring do?", explanation: "Destructuring extracts values from objects/arrays into variables.", options: [{ text: "Extracts values into variables", isCorrect: true }, { text: "Deletes object properties", isCorrect: false }, { text: "Merges objects", isCorrect: false }, { text: "Copies objects", isCorrect: false }] },
  ]);

  const [jsCh3] = await db.insert(lessonsTable).values({ moduleId: jsMod3.id, title: "FizzBuzz", type: "challenge", orderIndex: 2, xpReward: 35, estimatedMinutes: 12 }).returning();
  await createChallenge(jsCh3.id, {
    instructions: "## FizzBuzz\n\nPrint numbers 1 to 15. But:\n- For multiples of 3, print `Fizz`\n- For multiples of 5, print `Buzz`\n- For multiples of both 3 and 5, print `FizzBuzz`\n\nExpected output:\n```\n1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz\n```",
    starterCode: '// Print FizzBuzz for numbers 1-15\n', language: "javascript",
    hints: ["Use % (modulo) to check divisibility", "Check divisible by both 3 AND 5 first"],
    tests: [{ name: "FizzBuzz output", input: "", expectedOutput: "1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz" }],
  });

  // JS Module 4: Loops & Iteration
  const [jsMod4] = await db.insert(modulesTable).values({ courseId: jsCourse.id, title: "Loops and Iteration", description: "Master different loop types", orderIndex: 3 }).returning();

  await db.insert(lessonsTable).values({ moduleId: jsMod4.id, title: "Loops in JavaScript", type: "theory", orderIndex: 0, xpReward: 10, estimatedMinutes: 7,
    content: `# Loops\n\n## For Loop\n\n\`\`\`javascript\nfor (let i = 0; i < 5; i++) {\n  console.log(i);\n}\n\`\`\`\n\n## For...of Loop\n\n\`\`\`javascript\nconst colors = ["red", "green", "blue"];\nfor (const color of colors) {\n  console.log(color);\n}\n\`\`\`\n\n## While Loop\n\n\`\`\`javascript\nlet count = 0;\nwhile (count < 3) {\n  console.log(count);\n  count++;\n}\n\`\`\`\n\n## forEach\n\n\`\`\`javascript\nconst nums = [1, 2, 3];\nnums.forEach(n => console.log(n * 2));\n\`\`\``,
  });

  const [jsQuiz4] = await db.insert(lessonsTable).values({ moduleId: jsMod4.id, title: "Loops Quiz", type: "quiz", orderIndex: 1, xpReward: 15, estimatedMinutes: 5 }).returning();
  await createQuiz(jsQuiz4.id, [
    { question: "Which loop iterates over array values directly?", explanation: "for...of iterates over iterable values.", options: [{ text: "for...of", isCorrect: true }, { text: "for...in", isCorrect: false }, { text: "forEach", isCorrect: false }, { text: "while", isCorrect: false }] },
    { question: "What is i++ equivalent to?", explanation: "i++ is shorthand for i = i + 1.", options: [{ text: "i = i + 1", isCorrect: true }, { text: "i = i - 1", isCorrect: false }, { text: "i = i * 2", isCorrect: false }, { text: "i + 1", isCorrect: false }] },
    { question: "How many times does for(let i=0; i<3; i++) run?", explanation: "It runs for i=0, i=1, i=2, so 3 times.", options: [{ text: "3 times", isCorrect: true }, { text: "4 times", isCorrect: false }, { text: "2 times", isCorrect: false }, { text: "Infinite", isCorrect: false }] },
  ]);

  const [jsCh4] = await db.insert(lessonsTable).values({ moduleId: jsMod4.id, title: "Reverse String", type: "challenge", orderIndex: 2, xpReward: 30, estimatedMinutes: 10 }).returning();
  await createChallenge(jsCh4.id, {
    instructions: "## Reverse String\n\nWrite a function `reverseString(str)` that reverses a string.\n\nPrint `reverseString(\"hello\")` which should output `olleh`.",
    starterCode: 'function reverseString(str) {\n  // Your code here\n}\n\nconsole.log(reverseString("hello"));\n', language: "javascript",
    hints: ["Split into array, reverse, join back", 'str.split("").reverse().join("")'],
    tests: [{ name: "Reverse 'hello'", input: "", expectedOutput: "olleh" }],
  });

  // JS Module 5: String Methods
  const [jsMod5] = await db.insert(modulesTable).values({ courseId: jsCourse.id, title: "String Methods", description: "Manipulate text with string methods", orderIndex: 4 }).returning();

  await db.insert(lessonsTable).values({ moduleId: jsMod5.id, title: "Working with Strings", type: "theory", orderIndex: 0, xpReward: 10, estimatedMinutes: 7,
    content: `# String Methods\n\n\`\`\`javascript\nconst str = "Hello, World!";\n\nstr.length          // 13\nstr.toUpperCase()   // "HELLO, WORLD!"\nstr.toLowerCase()   // "hello, world!"\nstr.includes("World") // true\nstr.indexOf("World")  // 7\nstr.slice(0, 5)     // "Hello"\nstr.replace("World", "JS") // "Hello, JS!"\nstr.split(", ")     // ["Hello", "World!"]\nstr.trim()          // Removes whitespace\n\`\`\`\n\n## Template Literals\n\n\`\`\`javascript\nconst name = "Alice";\nconst age = 25;\nconsole.log(\`\${name} is \${age} years old\`);\n\`\`\``,
  });

  const [jsQuiz5] = await db.insert(lessonsTable).values({ moduleId: jsMod5.id, title: "Strings Quiz", type: "quiz", orderIndex: 1, xpReward: 15, estimatedMinutes: 5 }).returning();
  await createQuiz(jsQuiz5.id, [
    { question: 'What does "hello".toUpperCase() return?', explanation: "toUpperCase() converts all characters to uppercase.", options: [{ text: '"HELLO"', isCorrect: true }, { text: '"Hello"', isCorrect: false }, { text: '"hello"', isCorrect: false }, { text: "Error", isCorrect: false }] },
    { question: "Which method checks if a string contains a substring?", explanation: "includes() returns true/false.", options: [{ text: "includes()", isCorrect: true }, { text: "contains()", isCorrect: false }, { text: "has()", isCorrect: false }, { text: "find()", isCorrect: false }] },
    { question: 'What does "a,b,c".split(",") return?', explanation: 'split() divides a string into an array.', options: [{ text: '["a","b","c"]', isCorrect: true }, { text: '"abc"', isCorrect: false }, { text: "3", isCorrect: false }, { text: '"a b c"', isCorrect: false }] },
  ]);

  const [jsCh5] = await db.insert(lessonsTable).values({ moduleId: jsMod5.id, title: "Capitalize Words", type: "challenge", orderIndex: 2, xpReward: 30, estimatedMinutes: 10 }).returning();
  await createChallenge(jsCh5.id, {
    instructions: "## Capitalize Words\n\nWrite a function `capitalizeWords(str)` that capitalizes the first letter of each word.\n\nPrint `capitalizeWords(\"hello world\")` which should output `Hello World`.",
    starterCode: 'function capitalizeWords(str) {\n  // Your code here\n}\n\nconsole.log(capitalizeWords("hello world"));\n', language: "javascript",
    hints: ["Split by spaces, capitalize each word, join back"],
    tests: [{ name: "Capitalize 'hello world'", input: "", expectedOutput: "Hello World" }],
  });

  // JS Module 6: Error Handling
  const [jsMod6] = await db.insert(modulesTable).values({ courseId: jsCourse.id, title: "Error Handling & Modern JS", description: "Handle errors and use modern JavaScript features", orderIndex: 5 }).returning();

  await db.insert(lessonsTable).values({ moduleId: jsMod6.id, title: "Try-Catch and Modern JS", type: "theory", orderIndex: 0, xpReward: 10, estimatedMinutes: 7,
    content: `# Error Handling\n\n\`\`\`javascript\ntry {\n  JSON.parse("invalid");\n} catch (error) {\n  console.log("Error:", error.message);\n} finally {\n  console.log("Always runs");\n}\n\`\`\`\n\n## Spread Operator\n\n\`\`\`javascript\nconst arr1 = [1, 2, 3];\nconst arr2 = [...arr1, 4, 5];\nconst obj1 = { a: 1, b: 2 };\nconst obj2 = { ...obj1, c: 3 };\n\`\`\`\n\n## Optional Chaining\n\n\`\`\`javascript\nconst user = { address: { city: "NYC" } };\nconsole.log(user?.address?.city); // "NYC"\nconsole.log(user?.phone?.number); // undefined\n\`\`\``,
  });

  const [jsQuiz6] = await db.insert(lessonsTable).values({ moduleId: jsMod6.id, title: "Modern JS Quiz", type: "quiz", orderIndex: 1, xpReward: 15, estimatedMinutes: 5 }).returning();
  await createQuiz(jsQuiz6.id, [
    { question: "What block catches errors?", explanation: "catch block handles errors thrown in the try block.", options: [{ text: "catch", isCorrect: true }, { text: "error", isCorrect: false }, { text: "except", isCorrect: false }, { text: "handle", isCorrect: false }] },
    { question: "What does the spread operator (...) do with arrays?", explanation: "Spread expands array elements.", options: [{ text: "Expands array elements", isCorrect: true }, { text: "Removes elements", isCorrect: false }, { text: "Sorts elements", isCorrect: false }, { text: "Counts elements", isCorrect: false }] },
    { question: "What does ?. (optional chaining) return for missing properties?", explanation: "Optional chaining returns undefined instead of throwing an error.", options: [{ text: "undefined", isCorrect: true }, { text: "null", isCorrect: false }, { text: "Error", isCorrect: false }, { text: "0", isCorrect: false }] },
  ]);

  const [jsCh6] = await db.insert(lessonsTable).values({ moduleId: jsMod6.id, title: "Palindrome Checker", type: "challenge", orderIndex: 2, xpReward: 35, estimatedMinutes: 12 }).returning();
  await createChallenge(jsCh6.id, {
    instructions: "## Palindrome Checker\n\nWrite a function `isPalindrome(str)` that checks if a string reads the same forwards and backwards (case-insensitive).\n\nPrint:\n```\ntrue\nfalse\ntrue\n```\nFor \"racecar\", \"hello\", \"Madam\".",
    starterCode: 'function isPalindrome(str) {\n  // Your code here\n}\n\nconsole.log(isPalindrome("racecar"));\nconsole.log(isPalindrome("hello"));\nconsole.log(isPalindrome("Madam"));\n', language: "javascript",
    hints: ["Convert to lowercase first", "Compare with reversed version"],
    tests: [{ name: "Palindrome checks", input: "", expectedOutput: "true\nfalse\ntrue" }],
  });

  console.log("JavaScript course seeded (18 lessons)");

  // =============== HTML COURSE ===============
  const [htmlCourse] = await db.insert(coursesTable).values({
    title: "HTML Fundamentals",
    description: "Learn to structure web pages with HTML. Master semantic elements, forms, tables, and accessibility best practices.",
    language: "html", difficulty: "beginner", totalLessons: 15, estimatedHours: 4, xpReward: 400, isPublished: true,
  }).returning();

  // HTML Module 1
  const [htmlMod1] = await db.insert(modulesTable).values({ courseId: htmlCourse.id, title: "HTML Basics", description: "Structure and basic tags", orderIndex: 0 }).returning();

  await db.insert(lessonsTable).values({ moduleId: htmlMod1.id, title: "Introduction to HTML", type: "theory", orderIndex: 0, xpReward: 10, estimatedMinutes: 6,
    content: `# Introduction to HTML\n\nHTML (HyperText Markup Language) structures web content.\n\n## Basic Structure\n\n\`\`\`html\n<!DOCTYPE html>\n<html>\n<head>\n  <title>My Page</title>\n</head>\n<body>\n  <h1>Hello!</h1>\n  <p>Welcome to my page.</p>\n</body>\n</html>\n\`\`\`\n\n## Common Tags\n\n| Tag | Purpose |\n|-----|--------|\n| \`<h1>-<h6>\` | Headings |\n| \`<p>\` | Paragraph |\n| \`<a>\` | Link |\n| \`<img>\` | Image |\n| \`<div>\` | Container |\n| \`<span>\` | Inline container |\n| \`<ul>/<li>\` | Unordered list |\n| \`<ol>/<li>\` | Ordered list |`,
  });

  const [htmlQuiz1] = await db.insert(lessonsTable).values({ moduleId: htmlMod1.id, title: "HTML Basics Quiz", type: "quiz", orderIndex: 1, xpReward: 15, estimatedMinutes: 5 }).returning();
  await createQuiz(htmlQuiz1.id, [
    { question: "What does HTML stand for?", explanation: "HTML = HyperText Markup Language.", options: [{ text: "HyperText Markup Language", isCorrect: true }, { text: "High Text Machine Language", isCorrect: false }, { text: "HyperText Making Language", isCorrect: false }, { text: "Home Tool Markup Language", isCorrect: false }] },
    { question: "Which tag creates the largest heading?", explanation: "h1 is the largest, h6 is the smallest.", options: [{ text: "<h1>", isCorrect: true }, { text: "<h6>", isCorrect: false }, { text: "<heading>", isCorrect: false }, { text: "<big>", isCorrect: false }] },
    { question: "Which tag creates a paragraph?", explanation: "<p> is the paragraph tag.", options: [{ text: "<p>", isCorrect: true }, { text: "<para>", isCorrect: false }, { text: "<text>", isCorrect: false }, { text: "<paragraph>", isCorrect: false }] },
  ]);

  const [htmlCh1] = await db.insert(lessonsTable).values({ moduleId: htmlMod1.id, title: "Build a Basic Page", type: "challenge", orderIndex: 2, xpReward: 25, estimatedMinutes: 10 }).returning();
  await createChallenge(htmlCh1.id, {
    instructions: "## Build a Basic Page\n\nWrite HTML that includes:\n- An `<h1>` heading\n- A `<p>` paragraph\n\nYour code must contain both `<h1>` and `<p>` tags.",
    starterCode: '<!-- Create your HTML page -->\n', language: "html",
    hints: ["Use <h1>Title</h1> for the heading", "Use <p>Text</p> for the paragraph"],
    tests: [{ name: "Contains h1 tag", input: "", expectedOutput: "<h1>" }, { name: "Contains p tag", input: "", expectedOutput: "<p>" }],
  });

  // HTML Module 2: Links & Images
  const [htmlMod2] = await db.insert(modulesTable).values({ courseId: htmlCourse.id, title: "Links, Images & Lists", description: "Add links, images, and lists", orderIndex: 1 }).returning();

  await db.insert(lessonsTable).values({ moduleId: htmlMod2.id, title: "Links and Images", type: "theory", orderIndex: 0, xpReward: 10, estimatedMinutes: 6,
    content: `# Links and Images\n\n## Links\n\n\`\`\`html\n<a href="https://example.com">Visit Example</a>\n<a href="/about">About Us</a>\n<a href="#section">Jump to section</a>\n\`\`\`\n\n## Images\n\n\`\`\`html\n<img src="photo.jpg" alt="A beautiful sunset">\n\`\`\`\n\n## Lists\n\n### Unordered List\n\`\`\`html\n<ul>\n  <li>Apple</li>\n  <li>Banana</li>\n  <li>Cherry</li>\n</ul>\n\`\`\`\n\n### Ordered List\n\`\`\`html\n<ol>\n  <li>First step</li>\n  <li>Second step</li>\n</ol>\n\`\`\``,
  });

  const [htmlQuiz2] = await db.insert(lessonsTable).values({ moduleId: htmlMod2.id, title: "Links & Images Quiz", type: "quiz", orderIndex: 1, xpReward: 15, estimatedMinutes: 5 }).returning();
  await createQuiz(htmlQuiz2.id, [
    { question: "Which attribute specifies a link's URL?", explanation: "href (hypertext reference) specifies the URL.", options: [{ text: "href", isCorrect: true }, { text: "src", isCorrect: false }, { text: "link", isCorrect: false }, { text: "url", isCorrect: false }] },
    { question: "What is the alt attribute for?", explanation: "alt provides alternative text for accessibility.", options: [{ text: "Alternative text for images", isCorrect: true }, { text: "Image alignment", isCorrect: false }, { text: "Image size", isCorrect: false }, { text: "Image border", isCorrect: false }] },
    { question: "Which creates a bullet-point list?", explanation: "<ul> creates an unordered (bullet-point) list.", options: [{ text: "<ul>", isCorrect: true }, { text: "<ol>", isCorrect: false }, { text: "<list>", isCorrect: false }, { text: "<bl>", isCorrect: false }] },
  ]);

  const [htmlCh2] = await db.insert(lessonsTable).values({ moduleId: htmlMod2.id, title: "Navigation Menu", type: "challenge", orderIndex: 2, xpReward: 25, estimatedMinutes: 10 }).returning();
  await createChallenge(htmlCh2.id, {
    instructions: "## Navigation Menu\n\nCreate an unordered list with 3 links inside list items:\n- Home (href=\"/\")\n- About (href=\"/about\")\n- Contact (href=\"/contact\")\n\nYour code must use `<ul>`, `<li>`, and `<a>` tags.",
    starterCode: '<!-- Create a navigation menu -->\n', language: "html",
    hints: ["Wrap each <a> inside a <li>", "Use <ul> for unordered list"],
    tests: [{ name: "Contains ul tag", input: "", expectedOutput: "<ul>" }, { name: "Contains link tags", input: "", expectedOutput: "<a" }, { name: "Contains list items", input: "", expectedOutput: "<li>" }],
  });

  // HTML Module 3: Forms
  const [htmlMod3] = await db.insert(modulesTable).values({ courseId: htmlCourse.id, title: "HTML Forms", description: "Create interactive forms", orderIndex: 2 }).returning();

  await db.insert(lessonsTable).values({ moduleId: htmlMod3.id, title: "Building Forms", type: "theory", orderIndex: 0, xpReward: 10, estimatedMinutes: 8,
    content: `# HTML Forms\n\n\`\`\`html\n<form action="/submit" method="post">\n  <label for="name">Name:</label>\n  <input type="text" id="name" name="name" required>\n\n  <label for="email">Email:</label>\n  <input type="email" id="email" name="email">\n\n  <label for="msg">Message:</label>\n  <textarea id="msg" name="message"></textarea>\n\n  <button type="submit">Send</button>\n</form>\n\`\`\`\n\n## Input Types\n\n| Type | Description |\n|------|----------|\n| text | Single-line text |\n| email | Email address |\n| password | Hidden text |\n| number | Numeric input |\n| checkbox | Toggle |\n| radio | Select one |\n| submit | Submit button |`,
  });

  const [htmlQuiz3] = await db.insert(lessonsTable).values({ moduleId: htmlMod3.id, title: "Forms Quiz", type: "quiz", orderIndex: 1, xpReward: 15, estimatedMinutes: 5 }).returning();
  await createQuiz(htmlQuiz3.id, [
    { question: "Which tag creates a form?", explanation: "<form> wraps all form elements.", options: [{ text: "<form>", isCorrect: true }, { text: "<input>", isCorrect: false }, { text: "<fieldset>", isCorrect: false }, { text: "<formgroup>", isCorrect: false }] },
    { question: "Which input type hides typed text?", explanation: 'type="password" masks input characters.', options: [{ text: "password", isCorrect: true }, { text: "hidden", isCorrect: false }, { text: "secret", isCorrect: false }, { text: "masked", isCorrect: false }] },
    { question: "What does the 'required' attribute do?", explanation: "required prevents form submission without filling the field.", options: [{ text: "Makes field mandatory", isCorrect: true }, { text: "Adds a red border", isCorrect: false }, { text: "Sets a default value", isCorrect: false }, { text: "Enables autocomplete", isCorrect: false }] },
  ]);

  const [htmlCh3] = await db.insert(lessonsTable).values({ moduleId: htmlMod3.id, title: "Contact Form", type: "challenge", orderIndex: 2, xpReward: 30, estimatedMinutes: 12 }).returning();
  await createChallenge(htmlCh3.id, {
    instructions: "## Contact Form\n\nCreate a form with:\n- A text input for name\n- An email input for email\n- A textarea for message\n- A submit button\n\nYour code must contain `<form>`, `<input>`, `<textarea>`, and `<button>` tags.",
    starterCode: '<!-- Create a contact form -->\n', language: "html",
    hints: ["Use type=\"text\" for name, type=\"email\" for email"],
    tests: [{ name: "Contains form", input: "", expectedOutput: "<form" }, { name: "Contains input", input: "", expectedOutput: "<input" }, { name: "Contains textarea", input: "", expectedOutput: "<textarea" }, { name: "Contains button", input: "", expectedOutput: "<button" }],
  });

  // HTML Module 4: Semantic HTML
  const [htmlMod4] = await db.insert(modulesTable).values({ courseId: htmlCourse.id, title: "Semantic HTML", description: "Write meaningful, accessible HTML", orderIndex: 3 }).returning();

  await db.insert(lessonsTable).values({ moduleId: htmlMod4.id, title: "Semantic Elements", type: "theory", orderIndex: 0, xpReward: 10, estimatedMinutes: 7,
    content: `# Semantic HTML\n\nSemantic elements describe their meaning:\n\n\`\`\`html\n<header>Site header</header>\n<nav>Navigation</nav>\n<main>\n  <article>\n    <h2>Article Title</h2>\n    <p>Content...</p>\n  </article>\n  <aside>Sidebar</aside>\n</main>\n<footer>Site footer</footer>\n\`\`\`\n\n## Why Semantic?\n\n- Better accessibility\n- Better SEO\n- Clearer code\n- Screen readers understand structure`,
  });

  const [htmlQuiz4] = await db.insert(lessonsTable).values({ moduleId: htmlMod4.id, title: "Semantic HTML Quiz", type: "quiz", orderIndex: 1, xpReward: 15, estimatedMinutes: 5 }).returning();
  await createQuiz(htmlQuiz4.id, [
    { question: "Which element represents the main content?", explanation: "<main> holds the primary content of the page.", options: [{ text: "<main>", isCorrect: true }, { text: "<body>", isCorrect: false }, { text: "<content>", isCorrect: false }, { text: "<section>", isCorrect: false }] },
    { question: "What is <nav> used for?", explanation: "<nav> contains navigation links.", options: [{ text: "Navigation links", isCorrect: true }, { text: "Navbar styling", isCorrect: false }, { text: "New paragraph", isCorrect: false }, { text: "Named anchor", isCorrect: false }] },
    { question: "Why use semantic HTML?", explanation: "Semantic HTML improves accessibility, SEO, and code readability.", options: [{ text: "Accessibility and SEO", isCorrect: true }, { text: "Faster loading", isCorrect: false }, { text: "Better styling", isCorrect: false }, { text: "Smaller file size", isCorrect: false }] },
  ]);

  const [htmlCh4] = await db.insert(lessonsTable).values({ moduleId: htmlMod4.id, title: "Semantic Page Layout", type: "challenge", orderIndex: 2, xpReward: 30, estimatedMinutes: 12 }).returning();
  await createChallenge(htmlCh4.id, {
    instructions: "## Semantic Page Layout\n\nCreate a page with semantic elements:\n- `<header>` with a heading\n- `<nav>` with links\n- `<main>` with an `<article>`\n- `<footer>` with copyright text",
    starterCode: '<!-- Create a semantic page layout -->\n', language: "html",
    hints: ["Use header, nav, main, article, footer"],
    tests: [{ name: "Has header", input: "", expectedOutput: "<header>" }, { name: "Has nav", input: "", expectedOutput: "<nav>" }, { name: "Has main", input: "", expectedOutput: "<main>" }, { name: "Has footer", input: "", expectedOutput: "<footer>" }],
  });

  // HTML Module 5: Tables
  const [htmlMod5] = await db.insert(modulesTable).values({ courseId: htmlCourse.id, title: "Tables and Media", description: "Display tabular data and embed media", orderIndex: 4 }).returning();

  await db.insert(lessonsTable).values({ moduleId: htmlMod5.id, title: "HTML Tables", type: "theory", orderIndex: 0, xpReward: 10, estimatedMinutes: 6,
    content: `# HTML Tables\n\n\`\`\`html\n<table>\n  <thead>\n    <tr>\n      <th>Name</th>\n      <th>Age</th>\n    </tr>\n  </thead>\n  <tbody>\n    <tr>\n      <td>Alice</td>\n      <td>25</td>\n    </tr>\n    <tr>\n      <td>Bob</td>\n      <td>30</td>\n    </tr>\n  </tbody>\n</table>\n\`\`\`\n\n## Key Elements\n\n- \`<table>\` - Table container\n- \`<thead>\` - Header section\n- \`<tbody>\` - Body section\n- \`<tr>\` - Table row\n- \`<th>\` - Header cell\n- \`<td>\` - Data cell`,
  });

  const [htmlQuiz5] = await db.insert(lessonsTable).values({ moduleId: htmlMod5.id, title: "Tables Quiz", type: "quiz", orderIndex: 1, xpReward: 15, estimatedMinutes: 5 }).returning();
  await createQuiz(htmlQuiz5.id, [
    { question: "Which tag defines a table row?", explanation: "<tr> defines a row in a table.", options: [{ text: "<tr>", isCorrect: true }, { text: "<td>", isCorrect: false }, { text: "<row>", isCorrect: false }, { text: "<table-row>", isCorrect: false }] },
    { question: "What's the difference between <th> and <td>?", explanation: "<th> is a header cell (bold), <td> is a data cell.", options: [{ text: "th is header, td is data", isCorrect: true }, { text: "th is tall, td is default", isCorrect: false }, { text: "No difference", isCorrect: false }, { text: "th is text, td is data", isCorrect: false }] },
    { question: "Which wraps the table body?", explanation: "<tbody> wraps the body rows of a table.", options: [{ text: "<tbody>", isCorrect: true }, { text: "<body>", isCorrect: false }, { text: "<table-body>", isCorrect: false }, { text: "<tdata>", isCorrect: false }] },
  ]);

  const [htmlCh5] = await db.insert(lessonsTable).values({ moduleId: htmlMod5.id, title: "Student Table", type: "challenge", orderIndex: 2, xpReward: 25, estimatedMinutes: 10 }).returning();
  await createChallenge(htmlCh5.id, {
    instructions: "## Student Table\n\nCreate a table with columns Name, Grade, Score and at least 2 rows of data.\n\nUse `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, and `<td>` tags.",
    starterCode: '<!-- Create a student grades table -->\n', language: "html",
    hints: ["Use <thead> for headers, <tbody> for data"],
    tests: [{ name: "Has table", input: "", expectedOutput: "<table>" }, { name: "Has thead", input: "", expectedOutput: "<thead>" }, { name: "Has tbody", input: "", expectedOutput: "<tbody>" }],
  });

  console.log("HTML course seeded (15 lessons)");

  // =============== CSS COURSE ===============
  const [cssCourse] = await db.insert(coursesTable).values({
    title: "CSS Styling Mastery",
    description: "Style beautiful web pages with CSS. Learn selectors, the box model, flexbox, grid, animations, and responsive design.",
    language: "css", difficulty: "beginner", totalLessons: 15, estimatedHours: 5, xpReward: 450, isPublished: true,
  }).returning();

  // CSS Module 1: Basics
  const [cssMod1] = await db.insert(modulesTable).values({ courseId: cssCourse.id, title: "CSS Basics", description: "Selectors, colors, and text styling", orderIndex: 0 }).returning();

  await db.insert(lessonsTable).values({ moduleId: cssMod1.id, title: "Introduction to CSS", type: "theory", orderIndex: 0, xpReward: 10, estimatedMinutes: 7,
    content: `# Introduction to CSS\n\nCSS (Cascading Style Sheets) styles web pages.\n\n## Syntax\n\n\`\`\`css\nselector {\n  property: value;\n}\n\`\`\`\n\n## Selectors\n\n\`\`\`css\nh1 { color: blue; }           /* Element */\n.card { background: white; }  /* Class */\n#header { height: 60px; }     /* ID */\np a { color: red; }           /* Descendant */\n\`\`\`\n\n## Colors\n\n\`\`\`css\ncolor: red;\ncolor: #ff0000;\ncolor: rgb(255, 0, 0);\ncolor: hsl(0, 100%, 50%);\n\`\`\`\n\n## Text Styling\n\n\`\`\`css\nfont-size: 16px;\nfont-weight: bold;\ntext-align: center;\nline-height: 1.5;\ntext-decoration: underline;\n\`\`\``,
  });

  const [cssQuiz1] = await db.insert(lessonsTable).values({ moduleId: cssMod1.id, title: "CSS Basics Quiz", type: "quiz", orderIndex: 1, xpReward: 15, estimatedMinutes: 5 }).returning();
  await createQuiz(cssQuiz1.id, [
    { question: "What does CSS stand for?", explanation: "CSS = Cascading Style Sheets.", options: [{ text: "Cascading Style Sheets", isCorrect: true }, { text: "Computer Style Sheets", isCorrect: false }, { text: "Creative Style System", isCorrect: false }, { text: "Coded Style Sheets", isCorrect: false }] },
    { question: "How do you select elements by class?", explanation: "A period (.) prefix selects by class name.", options: [{ text: ".classname", isCorrect: true }, { text: "#classname", isCorrect: false }, { text: "classname", isCorrect: false }, { text: "@classname", isCorrect: false }] },
    { question: "Which property changes text color?", explanation: "The color property sets text color.", options: [{ text: "color", isCorrect: true }, { text: "text-color", isCorrect: false }, { text: "font-color", isCorrect: false }, { text: "foreground", isCorrect: false }] },
  ]);

  const [cssCh1] = await db.insert(lessonsTable).values({ moduleId: cssMod1.id, title: "Style a Card", type: "challenge", orderIndex: 2, xpReward: 25, estimatedMinutes: 10 }).returning();
  await createChallenge(cssCh1.id, {
    instructions: "## Style a Card\n\nWrite CSS that includes:\n- `background-color` property\n- `border-radius` property\n- `padding` property\n\nStyle a `.card` class with these properties.",
    starterCode: '.card {\n  /* Add your styles */\n}\n', language: "css",
    hints: ["Use background-color for the background", "border-radius creates rounded corners"],
    tests: [{ name: "Has background-color", input: "", expectedOutput: "background-color" }, { name: "Has border-radius", input: "", expectedOutput: "border-radius" }, { name: "Has padding", input: "", expectedOutput: "padding" }],
  });

  // CSS Module 2: Box Model
  const [cssMod2] = await db.insert(modulesTable).values({ courseId: cssCourse.id, title: "The Box Model", description: "Understand margins, padding, and borders", orderIndex: 1 }).returning();

  await db.insert(lessonsTable).values({ moduleId: cssMod2.id, title: "Box Model Explained", type: "theory", orderIndex: 0, xpReward: 10, estimatedMinutes: 8,
    content: `# The Box Model\n\nEvery HTML element is a box:\n\n\`\`\`\n+------------------+\n|     Margin       |\n|  +------------+  |\n|  |   Border   |  |\n|  | +--------+ |  |\n|  | | Padding| |  |\n|  | | Content| |  |\n|  | +--------+ |  |\n|  +------------+  |\n+------------------+\n\`\`\`\n\n## Properties\n\n\`\`\`css\n.box {\n  width: 200px;\n  height: 100px;\n  padding: 20px;\n  border: 2px solid black;\n  margin: 10px;\n  box-sizing: border-box;\n}\n\`\`\`\n\n## Box Sizing\n\n- \`content-box\`: width = content only (default)\n- \`border-box\`: width = content + padding + border`,
  });

  const [cssQuiz2] = await db.insert(lessonsTable).values({ moduleId: cssMod2.id, title: "Box Model Quiz", type: "quiz", orderIndex: 1, xpReward: 15, estimatedMinutes: 5 }).returning();
  await createQuiz(cssQuiz2.id, [
    { question: "What is between content and border?", explanation: "Padding is the space between content and border.", options: [{ text: "Padding", isCorrect: true }, { text: "Margin", isCorrect: false }, { text: "Gap", isCorrect: false }, { text: "Spacing", isCorrect: false }] },
    { question: "What does box-sizing: border-box do?", explanation: "border-box includes padding and border in the element's width.", options: [{ text: "Includes padding/border in width", isCorrect: true }, { text: "Adds a box border", isCorrect: false }, { text: "Centers the box", isCorrect: false }, { text: "Removes margins", isCorrect: false }] },
    { question: "Which property adds space outside an element?", explanation: "Margin is the space outside the border.", options: [{ text: "margin", isCorrect: true }, { text: "padding", isCorrect: false }, { text: "spacing", isCorrect: false }, { text: "gap", isCorrect: false }] },
  ]);

  const [cssCh2] = await db.insert(lessonsTable).values({ moduleId: cssMod2.id, title: "Box Model Layout", type: "challenge", orderIndex: 2, xpReward: 25, estimatedMinutes: 10 }).returning();
  await createChallenge(cssCh2.id, {
    instructions: "## Box Model Layout\n\nStyle a `.container` with:\n- `width` of 300px\n- `padding` of 20px\n- `margin` of 0 auto (centering)\n- `border` of 1px solid\n- `box-sizing` of border-box",
    starterCode: '.container {\n  /* Your styles here */\n}\n', language: "css",
    hints: ["margin: 0 auto centers horizontally"],
    tests: [{ name: "Has width", input: "", expectedOutput: "width" }, { name: "Has padding", input: "", expectedOutput: "padding" }, { name: "Has box-sizing", input: "", expectedOutput: "box-sizing" }],
  });

  // CSS Module 3: Flexbox
  const [cssMod3] = await db.insert(modulesTable).values({ courseId: cssCourse.id, title: "Flexbox Layout", description: "Create flexible layouts with flexbox", orderIndex: 2 }).returning();

  await db.insert(lessonsTable).values({ moduleId: cssMod3.id, title: "Flexbox Essentials", type: "theory", orderIndex: 0, xpReward: 10, estimatedMinutes: 10,
    content: `# Flexbox\n\n## Container Properties\n\n\`\`\`css\n.container {\n  display: flex;\n  flex-direction: row;        /* row | column */\n  justify-content: center;    /* Main axis */\n  align-items: center;        /* Cross axis */\n  gap: 16px;\n  flex-wrap: wrap;\n}\n\`\`\`\n\n## Item Properties\n\n\`\`\`css\n.item {\n  flex: 1;           /* Grow to fill */\n  flex-shrink: 0;    /* Don't shrink */\n  align-self: start; /* Override alignment */\n}\n\`\`\`\n\n## Common Patterns\n\n\`\`\`css\n/* Center everything */\n.center {\n  display: flex;\n  justify-content: center;\n  align-items: center;\n}\n\n/* Space between */\n.navbar {\n  display: flex;\n  justify-content: space-between;\n}\n\`\`\``,
  });

  const [cssQuiz3] = await db.insert(lessonsTable).values({ moduleId: cssMod3.id, title: "Flexbox Quiz", type: "quiz", orderIndex: 1, xpReward: 15, estimatedMinutes: 5 }).returning();
  await createQuiz(cssQuiz3.id, [
    { question: "Which property enables flexbox?", explanation: "display: flex enables flexbox on a container.", options: [{ text: "display: flex", isCorrect: true }, { text: "flex: true", isCorrect: false }, { text: "flexbox: on", isCorrect: false }, { text: "layout: flex", isCorrect: false }] },
    { question: "What does justify-content control?", explanation: "justify-content aligns items along the main axis.", options: [{ text: "Main axis alignment", isCorrect: true }, { text: "Cross axis alignment", isCorrect: false }, { text: "Item sizing", isCorrect: false }, { text: "Item order", isCorrect: false }] },
    { question: "How do you center items both horizontally and vertically?", explanation: "Use justify-content and align-items both set to center.", options: [{ text: "justify-content: center; align-items: center", isCorrect: true }, { text: "text-align: center; vertical-align: middle", isCorrect: false }, { text: "center: both", isCorrect: false }, { text: "align: center center", isCorrect: false }] },
  ]);

  const [cssCh3] = await db.insert(lessonsTable).values({ moduleId: cssMod3.id, title: "Flexbox Navbar", type: "challenge", orderIndex: 2, xpReward: 30, estimatedMinutes: 12 }).returning();
  await createChallenge(cssCh3.id, {
    instructions: "## Flexbox Navbar\n\nStyle a `.navbar` using flexbox:\n- `display: flex`\n- `justify-content: space-between`\n- `align-items: center`\n- `padding` for spacing",
    starterCode: '.navbar {\n  /* Create a flexbox navbar */\n}\n', language: "css",
    hints: ["Start with display: flex", "space-between pushes items to edges"],
    tests: [{ name: "Has display flex", input: "", expectedOutput: "display: flex" }, { name: "Has justify-content", input: "", expectedOutput: "justify-content" }, { name: "Has align-items", input: "", expectedOutput: "align-items" }],
  });

  // CSS Module 4: Grid
  const [cssMod4] = await db.insert(modulesTable).values({ courseId: cssCourse.id, title: "CSS Grid", description: "Create two-dimensional layouts", orderIndex: 3 }).returning();

  await db.insert(lessonsTable).values({ moduleId: cssMod4.id, title: "CSS Grid Layout", type: "theory", orderIndex: 0, xpReward: 10, estimatedMinutes: 8,
    content: `# CSS Grid\n\nGrid creates two-dimensional layouts.\n\n\`\`\`css\n.grid {\n  display: grid;\n  grid-template-columns: 1fr 1fr 1fr;\n  grid-template-rows: auto;\n  gap: 16px;\n}\n\`\`\`\n\n## Responsive Grid\n\n\`\`\`css\n.grid {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));\n  gap: 20px;\n}\n\`\`\`\n\n## Grid Areas\n\n\`\`\`css\n.layout {\n  display: grid;\n  grid-template-areas:\n    "header header"\n    "sidebar main"\n    "footer footer";\n}\n\`\`\``,
  });

  const [cssQuiz4] = await db.insert(lessonsTable).values({ moduleId: cssMod4.id, title: "CSS Grid Quiz", type: "quiz", orderIndex: 1, xpReward: 15, estimatedMinutes: 5 }).returning();
  await createQuiz(cssQuiz4.id, [
    { question: "Which property enables CSS Grid?", explanation: "display: grid enables grid layout.", options: [{ text: "display: grid", isCorrect: true }, { text: "grid: true", isCorrect: false }, { text: "layout: grid", isCorrect: false }, { text: "display: table", isCorrect: false }] },
    { question: "What does 1fr mean?", explanation: "1fr = 1 fraction of available space.", options: [{ text: "1 fraction of available space", isCorrect: true }, { text: "1 frame per second", isCorrect: false }, { text: "1 full row", isCorrect: false }, { text: "1 fixed ratio", isCorrect: false }] },
    { question: "What property adds space between grid items?", explanation: "gap adds space between grid items.", options: [{ text: "gap", isCorrect: true }, { text: "spacing", isCorrect: false }, { text: "gutter", isCorrect: false }, { text: "margin", isCorrect: false }] },
  ]);

  const [cssCh4] = await db.insert(lessonsTable).values({ moduleId: cssMod4.id, title: "Grid Gallery", type: "challenge", orderIndex: 2, xpReward: 30, estimatedMinutes: 12 }).returning();
  await createChallenge(cssCh4.id, {
    instructions: "## Grid Gallery\n\nCreate a `.gallery` grid layout:\n- `display: grid`\n- 3 equal columns using `grid-template-columns`\n- `gap` of 16px",
    starterCode: '.gallery {\n  /* Create a grid gallery */\n}\n', language: "css",
    hints: ["Use grid-template-columns: 1fr 1fr 1fr"],
    tests: [{ name: "Has display grid", input: "", expectedOutput: "display: grid" }, { name: "Has grid-template-columns", input: "", expectedOutput: "grid-template-columns" }, { name: "Has gap", input: "", expectedOutput: "gap" }],
  });

  // CSS Module 5: Responsive Design
  const [cssMod5] = await db.insert(modulesTable).values({ courseId: cssCourse.id, title: "Responsive Design", description: "Make websites work on all devices", orderIndex: 4 }).returning();

  await db.insert(lessonsTable).values({ moduleId: cssMod5.id, title: "Media Queries", type: "theory", orderIndex: 0, xpReward: 10, estimatedMinutes: 8,
    content: `# Responsive Design\n\n## Media Queries\n\n\`\`\`css\n/* Mobile-first approach */\n.container {\n  width: 100%;\n  padding: 16px;\n}\n\n@media (min-width: 768px) {\n  .container {\n    max-width: 720px;\n    margin: 0 auto;\n  }\n}\n\n@media (min-width: 1024px) {\n  .container {\n    max-width: 960px;\n  }\n}\n\`\`\`\n\n## Responsive Units\n\n- \`%\` - relative to parent\n- \`vw/vh\` - viewport width/height\n- \`rem\` - relative to root font size\n- \`em\` - relative to parent font size\n\n## Viewport Meta Tag\n\n\`\`\`html\n<meta name="viewport" content="width=device-width, initial-scale=1">\n\`\`\``,
  });

  const [cssQuiz5] = await db.insert(lessonsTable).values({ moduleId: cssMod5.id, title: "Responsive Quiz", type: "quiz", orderIndex: 1, xpReward: 15, estimatedMinutes: 5 }).returning();
  await createQuiz(cssQuiz5.id, [
    { question: "Which CSS feature enables responsive design?", explanation: "Media queries apply styles based on screen size.", options: [{ text: "@media queries", isCorrect: true }, { text: "@responsive", isCorrect: false }, { text: "@screen", isCorrect: false }, { text: "@device", isCorrect: false }] },
    { question: "What does 'vw' stand for?", explanation: "vw = viewport width, 1vw = 1% of viewport width.", options: [{ text: "Viewport width", isCorrect: true }, { text: "Variable width", isCorrect: false }, { text: "Virtual width", isCorrect: false }, { text: "View width", isCorrect: false }] },
    { question: "What approach designs for mobile first?", explanation: "Mobile-first uses min-width media queries to add styles for larger screens.", options: [{ text: "min-width media queries", isCorrect: true }, { text: "max-width media queries", isCorrect: false }, { text: "desktop-first", isCorrect: false }, { text: "responsive-first", isCorrect: false }] },
  ]);

  const [cssCh5] = await db.insert(lessonsTable).values({ moduleId: cssMod5.id, title: "Responsive Layout", type: "challenge", orderIndex: 2, xpReward: 30, estimatedMinutes: 12 }).returning();
  await createChallenge(cssCh5.id, {
    instructions: "## Responsive Layout\n\nWrite CSS that:\n- Sets `.container` to `width: 100%` by default\n- Uses a `@media` query at `min-width: 768px` to set `max-width: 720px`",
    starterCode: '.container {\n  /* Mobile styles */\n}\n\n/* Add media query for tablet+ */\n', language: "css",
    hints: ["Use @media (min-width: 768px) { }"],
    tests: [{ name: "Has width", input: "", expectedOutput: "width" }, { name: "Has media query", input: "", expectedOutput: "@media" }, { name: "Has max-width", input: "", expectedOutput: "max-width" }],
  });

  console.log("CSS course seeded (15 lessons)");

  // =============== SQL COURSE ===============
  const [sqlCourse] = await db.insert(coursesTable).values({
    title: "SQL for Beginners",
    description: "Learn to query and manage databases with SQL. Master SELECT, JOIN, aggregation, and data manipulation for real-world applications.",
    language: "sql", difficulty: "beginner", totalLessons: 15, estimatedHours: 5, xpReward: 450, isPublished: true,
  }).returning();

  // SQL Module 1: Basics
  const [sqlMod1] = await db.insert(modulesTable).values({ courseId: sqlCourse.id, title: "SQL Basics", description: "Your first SQL queries", orderIndex: 0 }).returning();

  await db.insert(lessonsTable).values({ moduleId: sqlMod1.id, title: "Introduction to SQL", type: "theory", orderIndex: 0, xpReward: 10, estimatedMinutes: 7,
    content: `# Introduction to SQL\n\nSQL (Structured Query Language) manages relational databases.\n\n## SELECT Statement\n\n\`\`\`sql\nSELECT * FROM users;\nSELECT name, email FROM users;\nSELECT DISTINCT city FROM users;\n\`\`\`\n\n## WHERE Clause\n\n\`\`\`sql\nSELECT * FROM users WHERE age > 18;\nSELECT * FROM users WHERE city = 'NYC';\nSELECT * FROM users WHERE age BETWEEN 20 AND 30;\n\`\`\`\n\n## Operators\n\n| Operator | Description |\n|----------|----------|\n| = | Equal |\n| <> or != | Not equal |\n| > < >= <= | Comparisons |\n| BETWEEN | Range |\n| LIKE | Pattern match |\n| IN | List of values |\n| AND, OR | Logical |`,
  });

  const [sqlQuiz1] = await db.insert(lessonsTable).values({ moduleId: sqlMod1.id, title: "SQL Basics Quiz", type: "quiz", orderIndex: 1, xpReward: 15, estimatedMinutes: 5 }).returning();
  await createQuiz(sqlQuiz1.id, [
    { question: "What does SQL stand for?", explanation: "SQL = Structured Query Language.", options: [{ text: "Structured Query Language", isCorrect: true }, { text: "Simple Query Language", isCorrect: false }, { text: "Standard Query Logic", isCorrect: false }, { text: "Server Query Language", isCorrect: false }] },
    { question: "Which statement retrieves data?", explanation: "SELECT retrieves data from a database.", options: [{ text: "SELECT", isCorrect: true }, { text: "GET", isCorrect: false }, { text: "FETCH", isCorrect: false }, { text: "RETRIEVE", isCorrect: false }] },
    { question: "What does WHERE do?", explanation: "WHERE filters rows based on conditions.", options: [{ text: "Filters rows by condition", isCorrect: true }, { text: "Sorts results", isCorrect: false }, { text: "Groups results", isCorrect: false }, { text: "Limits rows", isCorrect: false }] },
  ]);

  const [sqlCh1] = await db.insert(lessonsTable).values({ moduleId: sqlMod1.id, title: "Basic SELECT", type: "challenge", orderIndex: 2, xpReward: 25, estimatedMinutes: 8 }).returning();
  await createChallenge(sqlCh1.id, {
    instructions: "## Basic SELECT\n\nWrite a SQL query to select the `name` and `email` columns from a `users` table where `age` is greater than 18.\n\nYour query should use SELECT, FROM, and WHERE.",
    starterCode: '-- Write your SQL query\n', language: "sql",
    hints: ["SELECT column1, column2 FROM table WHERE condition"],
    tests: [{ name: "Has SELECT", input: "", expectedOutput: "select" }, { name: "Has WHERE", input: "", expectedOutput: "where" }, { name: "Has age > 18", input: "", expectedOutput: "18" }],
  });

  // SQL Module 2: Sorting & Aggregation
  const [sqlMod2] = await db.insert(modulesTable).values({ courseId: sqlCourse.id, title: "Sorting and Aggregation", description: "Order results and calculate totals", orderIndex: 1 }).returning();

  await db.insert(lessonsTable).values({ moduleId: sqlMod2.id, title: "ORDER BY and Aggregates", type: "theory", orderIndex: 0, xpReward: 10, estimatedMinutes: 8,
    content: `# Sorting and Aggregation\n\n## ORDER BY\n\n\`\`\`sql\nSELECT * FROM users ORDER BY name ASC;\nSELECT * FROM users ORDER BY age DESC;\nSELECT * FROM users ORDER BY city, name;\n\`\`\`\n\n## Aggregate Functions\n\n\`\`\`sql\nSELECT COUNT(*) FROM users;\nSELECT AVG(age) FROM users;\nSELECT SUM(salary) FROM employees;\nSELECT MAX(score), MIN(score) FROM results;\n\`\`\`\n\n## GROUP BY\n\n\`\`\`sql\nSELECT city, COUNT(*) as total\nFROM users\nGROUP BY city;\n\`\`\`\n\n## HAVING\n\n\`\`\`sql\nSELECT city, COUNT(*) as total\nFROM users\nGROUP BY city\nHAVING COUNT(*) > 5;\n\`\`\`\n\n## LIMIT\n\n\`\`\`sql\nSELECT * FROM users LIMIT 10;\nSELECT * FROM users LIMIT 10 OFFSET 20;\n\`\`\``,
  });

  const [sqlQuiz2] = await db.insert(lessonsTable).values({ moduleId: sqlMod2.id, title: "Aggregation Quiz", type: "quiz", orderIndex: 1, xpReward: 15, estimatedMinutes: 5 }).returning();
  await createQuiz(sqlQuiz2.id, [
    { question: "Which function counts rows?", explanation: "COUNT(*) counts all rows, COUNT(column) counts non-null values.", options: [{ text: "COUNT()", isCorrect: true }, { text: "SUM()", isCorrect: false }, { text: "TOTAL()", isCorrect: false }, { text: "NUM()", isCorrect: false }] },
    { question: "What sorts results in descending order?", explanation: "ORDER BY column DESC sorts from high to low.", options: [{ text: "ORDER BY column DESC", isCorrect: true }, { text: "SORT BY column DOWN", isCorrect: false }, { text: "ORDER BY column REVERSE", isCorrect: false }, { text: "SORT DESC column", isCorrect: false }] },
    { question: "What's the difference between WHERE and HAVING?", explanation: "WHERE filters rows before grouping, HAVING filters after.", options: [{ text: "WHERE is before GROUP BY, HAVING is after", isCorrect: true }, { text: "They are the same", isCorrect: false }, { text: "HAVING is for numbers only", isCorrect: false }, { text: "WHERE works only with text", isCorrect: false }] },
  ]);

  const [sqlCh2] = await db.insert(lessonsTable).values({ moduleId: sqlMod2.id, title: "Aggregate Query", type: "challenge", orderIndex: 2, xpReward: 30, estimatedMinutes: 10 }).returning();
  await createChallenge(sqlCh2.id, {
    instructions: "## Aggregate Query\n\nWrite a SQL query that selects `department` and the count of employees in each department from an `employees` table.\n\nUse GROUP BY and ORDER BY count descending.",
    starterCode: '-- Write your aggregate query\n', language: "sql",
    hints: ["SELECT department, COUNT(*) FROM employees GROUP BY department"],
    tests: [{ name: "Has GROUP BY", input: "", expectedOutput: "group by" }, { name: "Has COUNT", input: "", expectedOutput: "count" }, { name: "Has ORDER BY", input: "", expectedOutput: "order by" }],
  });

  // SQL Module 3: JOINs
  const [sqlMod3] = await db.insert(modulesTable).values({ courseId: sqlCourse.id, title: "JOIN Operations", description: "Combine data from multiple tables", orderIndex: 2 }).returning();

  await db.insert(lessonsTable).values({ moduleId: sqlMod3.id, title: "SQL JOINs", type: "theory", orderIndex: 0, xpReward: 10, estimatedMinutes: 10,
    content: `# SQL JOINs\n\nJOINs combine rows from multiple tables.\n\n## INNER JOIN\n\n\`\`\`sql\nSELECT users.name, orders.total\nFROM users\nINNER JOIN orders ON users.id = orders.user_id;\n\`\`\`\n\n## LEFT JOIN\n\n\`\`\`sql\nSELECT users.name, orders.total\nFROM users\nLEFT JOIN orders ON users.id = orders.user_id;\n\`\`\`\nIncludes all users, even without orders.\n\n## RIGHT JOIN\n\nIncludes all from the right table.\n\n## Join Types\n\n| Type | Description |\n|------|----------|\n| INNER | Only matching rows |\n| LEFT | All left + matching right |\n| RIGHT | All right + matching left |\n| FULL | All rows from both |`,
  });

  const [sqlQuiz3] = await db.insert(lessonsTable).values({ moduleId: sqlMod3.id, title: "JOINs Quiz", type: "quiz", orderIndex: 1, xpReward: 15, estimatedMinutes: 5 }).returning();
  await createQuiz(sqlQuiz3.id, [
    { question: "Which JOIN returns only matching rows from both tables?", explanation: "INNER JOIN returns only rows with matches in both tables.", options: [{ text: "INNER JOIN", isCorrect: true }, { text: "LEFT JOIN", isCorrect: false }, { text: "FULL JOIN", isCorrect: false }, { text: "CROSS JOIN", isCorrect: false }] },
    { question: "What keyword connects two tables in a JOIN?", explanation: "ON specifies the join condition.", options: [{ text: "ON", isCorrect: true }, { text: "WHERE", isCorrect: false }, { text: "WITH", isCorrect: false }, { text: "USING", isCorrect: false }] },
    { question: "LEFT JOIN includes all rows from which table?", explanation: "LEFT JOIN includes all rows from the left (first) table.", options: [{ text: "The left (first) table", isCorrect: true }, { text: "The right (second) table", isCorrect: false }, { text: "Both tables", isCorrect: false }, { text: "Neither table", isCorrect: false }] },
  ]);

  const [sqlCh3] = await db.insert(lessonsTable).values({ moduleId: sqlMod3.id, title: "JOIN Query", type: "challenge", orderIndex: 2, xpReward: 30, estimatedMinutes: 10 }).returning();
  await createChallenge(sqlCh3.id, {
    instructions: "## JOIN Query\n\nWrite a query that joins `students` and `grades` tables.\n\nSelect `students.name` and `grades.score` using an INNER JOIN where `students.id = grades.student_id`.",
    starterCode: '-- Write your JOIN query\n', language: "sql",
    hints: ["Use INNER JOIN ... ON to connect tables"],
    tests: [{ name: "Has JOIN", input: "", expectedOutput: "join" }, { name: "Has ON clause", input: "", expectedOutput: "on" }, { name: "References student_id", input: "", expectedOutput: "student_id" }],
  });

  // SQL Module 4: Data Manipulation
  const [sqlMod4] = await db.insert(modulesTable).values({ courseId: sqlCourse.id, title: "Data Manipulation", description: "Insert, update, and delete data", orderIndex: 3 }).returning();

  await db.insert(lessonsTable).values({ moduleId: sqlMod4.id, title: "INSERT, UPDATE, DELETE", type: "theory", orderIndex: 0, xpReward: 10, estimatedMinutes: 8,
    content: `# Data Manipulation\n\n## INSERT\n\n\`\`\`sql\nINSERT INTO users (name, email, age)\nVALUES ('Alice', 'alice@example.com', 25);\n\nINSERT INTO users (name, email, age)\nVALUES\n  ('Bob', 'bob@example.com', 30),\n  ('Carol', 'carol@example.com', 28);\n\`\`\`\n\n## UPDATE\n\n\`\`\`sql\nUPDATE users SET age = 26 WHERE name = 'Alice';\nUPDATE users SET city = 'NYC' WHERE id = 1;\n\`\`\`\n\n## DELETE\n\n\`\`\`sql\nDELETE FROM users WHERE age < 18;\nDELETE FROM users WHERE id = 5;\n\`\`\`\n\n**WARNING**: Always use WHERE with UPDATE and DELETE!`,
  });

  const [sqlQuiz4] = await db.insert(lessonsTable).values({ moduleId: sqlMod4.id, title: "DML Quiz", type: "quiz", orderIndex: 1, xpReward: 15, estimatedMinutes: 5 }).returning();
  await createQuiz(sqlQuiz4.id, [
    { question: "Which statement adds new rows?", explanation: "INSERT INTO adds new rows to a table.", options: [{ text: "INSERT INTO", isCorrect: true }, { text: "ADD TO", isCorrect: false }, { text: "CREATE ROW", isCorrect: false }, { text: "APPEND", isCorrect: false }] },
    { question: "What happens if you UPDATE without WHERE?", explanation: "Without WHERE, UPDATE changes ALL rows in the table.", options: [{ text: "All rows are updated", isCorrect: true }, { text: "Only the first row", isCorrect: false }, { text: "An error occurs", isCorrect: false }, { text: "Nothing happens", isCorrect: false }] },
    { question: "How do you remove rows from a table?", explanation: "DELETE FROM table WHERE condition removes matching rows.", options: [{ text: "DELETE FROM", isCorrect: true }, { text: "REMOVE FROM", isCorrect: false }, { text: "DROP ROWS", isCorrect: false }, { text: "CLEAR", isCorrect: false }] },
  ]);

  const [sqlCh4] = await db.insert(lessonsTable).values({ moduleId: sqlMod4.id, title: "Data Changes", type: "challenge", orderIndex: 2, xpReward: 30, estimatedMinutes: 10 }).returning();
  await createChallenge(sqlCh4.id, {
    instructions: "## Data Changes\n\nWrite an INSERT statement to add a new user with:\n- name: 'Alice'\n- email: 'alice@example.com'\n- age: 25\n\nInsert into the `users` table.",
    starterCode: '-- Insert a new user\n', language: "sql",
    hints: ["INSERT INTO table (col1, col2) VALUES (val1, val2)"],
    tests: [{ name: "Has INSERT INTO", input: "", expectedOutput: "insert into" }, { name: "Has VALUES", input: "", expectedOutput: "values" }, { name: "Has user data", input: "", expectedOutput: "alice" }],
  });

  // SQL Module 5: Advanced Queries
  const [sqlMod5] = await db.insert(modulesTable).values({ courseId: sqlCourse.id, title: "Advanced Queries", description: "Subqueries, aliases, and string functions", orderIndex: 4 }).returning();

  await db.insert(lessonsTable).values({ moduleId: sqlMod5.id, title: "Subqueries and Functions", type: "theory", orderIndex: 0, xpReward: 10, estimatedMinutes: 8,
    content: `# Advanced Queries\n\n## Subqueries\n\n\`\`\`sql\nSELECT name FROM users\nWHERE age > (SELECT AVG(age) FROM users);\n\`\`\`\n\n## Aliases\n\n\`\`\`sql\nSELECT u.name, o.total\nFROM users AS u\nJOIN orders AS o ON u.id = o.user_id;\n\`\`\`\n\n## String Functions\n\n\`\`\`sql\nSELECT UPPER(name) FROM users;\nSELECT LOWER(email) FROM users;\nSELECT CONCAT(first_name, ' ', last_name) AS full_name FROM users;\nSELECT LENGTH(name) FROM users;\n\`\`\`\n\n## CASE Expression\n\n\`\`\`sql\nSELECT name,\n  CASE\n    WHEN age >= 18 THEN 'Adult'\n    ELSE 'Minor'\n  END AS category\nFROM users;\n\`\`\``,
  });

  const [sqlQuiz5] = await db.insert(lessonsTable).values({ moduleId: sqlMod5.id, title: "Advanced SQL Quiz", type: "quiz", orderIndex: 1, xpReward: 15, estimatedMinutes: 5 }).returning();
  await createQuiz(sqlQuiz5.id, [
    { question: "What is a subquery?", explanation: "A subquery is a query inside another query.", options: [{ text: "A query inside another query", isCorrect: true }, { text: "A backup query", isCorrect: false }, { text: "A deleted query", isCorrect: false }, { text: "A cached query", isCorrect: false }] },
    { question: "What does AS do in SQL?", explanation: "AS creates an alias (temporary name) for a column or table.", options: [{ text: "Creates an alias", isCorrect: true }, { text: "Adds a column", isCorrect: false }, { text: "Sorts results", isCorrect: false }, { text: "Filters rows", isCorrect: false }] },
    { question: "What does CASE...WHEN do?", explanation: "CASE adds conditional logic like if-else in SQL.", options: [{ text: "Conditional logic in queries", isCorrect: true }, { text: "Catches errors", isCorrect: false }, { text: "Creates tables", isCorrect: false }, { text: "Deletes duplicates", isCorrect: false }] },
  ]);

  const [sqlCh5] = await db.insert(lessonsTable).values({ moduleId: sqlMod5.id, title: "Advanced Query", type: "challenge", orderIndex: 2, xpReward: 35, estimatedMinutes: 12 }).returning();
  await createChallenge(sqlCh5.id, {
    instructions: "## Advanced Query\n\nWrite a query that selects users whose age is above the average age.\n\nUse a subquery to calculate AVG(age) and compare with WHERE.",
    starterCode: '-- Find users above average age\n', language: "sql",
    hints: ["Use WHERE age > (SELECT AVG(age) FROM users)"],
    tests: [{ name: "Has subquery", input: "", expectedOutput: "select avg" }, { name: "Has WHERE", input: "", expectedOutput: "where" }],
  });

  console.log("SQL course seeded (15 lessons)");

  console.log("Seeding complete!");
}

seed().then(() => process.exit(0)).catch(console.error);
