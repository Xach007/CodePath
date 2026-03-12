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
  const existingLanguages = new Set(existingCourses.map(c => c.language));

  if (existingLanguages.has("python")) {
    console.log("Original courses already exist, skipping Python/JS/HTML/CSS/SQL seed.");
  } else {

  // =============== PYTHON COURSE ===============
  const [pythonCourse] = await db.insert(coursesTable).values({
    title: "Python Fundamentals",
    description: "Master the basics of Python programming from scratch. Learn variables, control flow, functions, and data structures through hands-on exercises.",
    language: "python", difficulty: "beginner", totalLessons: 18, estimatedHours: 6, xpReward: 500, isPublished: true,
    imageUrl: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg",
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
    imageUrl: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg",
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
    imageUrl: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg",
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
    imageUrl: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg",
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
    imageUrl: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg",
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

  } // end of original courses block

  // =============== C++ COURSE ===============
  if (!existingLanguages.has("cpp")) {
  const [cppCourse] = await db.insert(coursesTable).values({
    title: "C++ Programming",
    description: "Learn C++ from the ground up — variables, control flow, functions, pointers, OOP, and the STL. Build fast, efficient programs.",
    language: "cpp", difficulty: "intermediate", totalLessons: 20, estimatedHours: 10, xpReward: 700, isPublished: true,
    imageUrl: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cplusplus/cplusplus-original.svg",
  }).returning();

  const [cppMod1] = await db.insert(modulesTable).values({ courseId: cppCourse.id, title: "Getting Started with C++", description: "Your first C++ programs", orderIndex: 0 }).returning();
  await db.insert(lessonsTable).values({ moduleId: cppMod1.id, title: "Introduction to C++", type: "theory", orderIndex: 0, xpReward: 10, estimatedMinutes: 5,
    content: `# Introduction to C++\n\nC++ is a **powerful, general-purpose programming language** created by Bjarne Stroustrup in 1979.\n\n## Why C++?\n\n- **Performance**: One of the fastest languages\n- **System-level**: Used in OS, game engines, embedded systems\n- **OOP support**: Classes, inheritance, polymorphism\n\n## Hello World\n\n\`\`\`cpp\n#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}\n\`\`\`\n\n## Key Points\n\n- \`#include <iostream>\` imports the I/O library\n- \`cout\` prints output to the console\n- \`endl\` adds a newline\n- Every program starts from \`main()\``,
  });
  const [cppQ1] = await db.insert(lessonsTable).values({ moduleId: cppMod1.id, title: "C++ Basics Quiz", type: "quiz", orderIndex: 1, xpReward: 15, estimatedMinutes: 5 }).returning();
  await createQuiz(cppQ1.id, [
    { question: "Who created C++?", explanation: "C++ was created by Bjarne Stroustrup.", options: [{ text: "Bjarne Stroustrup", isCorrect: true }, { text: "Dennis Ritchie", isCorrect: false }, { text: "James Gosling", isCorrect: false }, { text: "Guido van Rossum", isCorrect: false }] },
    { question: "Which header is used for input/output in C++?", explanation: "<iostream> provides cin and cout.", options: [{ text: "<iostream>", isCorrect: true }, { text: "<stdio.h>", isCorrect: false }, { text: "<conio.h>", isCorrect: false }, { text: "<string>", isCorrect: false }] },
    { question: "What does 'endl' do?", explanation: "endl inserts a newline and flushes the stream.", options: [{ text: "Inserts a newline", isCorrect: true }, { text: "Ends the program", isCorrect: false }, { text: "Clears the screen", isCorrect: false }, { text: "Pauses output", isCorrect: false }] },
  ]);
  await db.insert(lessonsTable).values({ moduleId: cppMod1.id, title: "Variables & Data Types", type: "theory", orderIndex: 2, xpReward: 10, estimatedMinutes: 6,
    content: `# Variables & Data Types\n\nC++ is a **statically typed** language — every variable must have a declared type.\n\n## Common Types\n\n| Type | Description | Example |\n|------|------------|--------|\n| int | Integer | \`int x = 42;\` |\n| double | Decimal | \`double pi = 3.14;\` |\n| char | Character | \`char c = 'A';\` |\n| string | Text | \`string name = "C++";\` |\n| bool | Boolean | \`bool ok = true;\` |\n\n## Declaration & Initialization\n\n\`\`\`cpp\nint age = 25;\ndouble salary = 50000.50;\nstring city = "Moscow";\nbool isStudent = true;\n\`\`\`\n\n## Constants\n\n\`\`\`cpp\nconst double PI = 3.14159;\n\`\`\``,
  });
  const [cppQ2] = await db.insert(lessonsTable).values({ moduleId: cppMod1.id, title: "Variables Quiz", type: "quiz", orderIndex: 3, xpReward: 15, estimatedMinutes: 5 }).returning();
  await createQuiz(cppQ2.id, [
    { question: "Which type stores decimal numbers in C++?", explanation: "double (or float) stores decimal values.", options: [{ text: "double", isCorrect: true }, { text: "int", isCorrect: false }, { text: "char", isCorrect: false }, { text: "bool", isCorrect: false }] },
    { question: "How do you declare a constant in C++?", explanation: "The const keyword makes a variable unchangeable.", options: [{ text: "const int x = 5;", isCorrect: true }, { text: "final int x = 5;", isCorrect: false }, { text: "let x = 5;", isCorrect: false }, { text: "static int x = 5;", isCorrect: false }] },
  ]);

  const [cppMod2] = await db.insert(modulesTable).values({ courseId: cppCourse.id, title: "Control Flow", description: "Conditionals and loops", orderIndex: 1 }).returning();
  await db.insert(lessonsTable).values({ moduleId: cppMod2.id, title: "If/Else Statements", type: "theory", orderIndex: 0, xpReward: 10, estimatedMinutes: 5,
    content: `# If/Else Statements\n\n## Basic Syntax\n\n\`\`\`cpp\nif (condition) {\n    // code\n} else if (another) {\n    // code\n} else {\n    // code\n}\n\`\`\`\n\n## Comparison Operators\n\n- \`==\` equal, \`!=\` not equal\n- \`<\`, \`>\`, \`<=\`, \`>=\`\n- \`&&\` AND, \`||\` OR, \`!\` NOT\n\n## Example\n\n\`\`\`cpp\nint score = 85;\nif (score >= 90) {\n    cout << "A" << endl;\n} else if (score >= 80) {\n    cout << "B" << endl;\n} else {\n    cout << "C" << endl;\n}\n\`\`\``,
  });
  await db.insert(lessonsTable).values({ moduleId: cppMod2.id, title: "Loops in C++", type: "theory", orderIndex: 1, xpReward: 10, estimatedMinutes: 6,
    content: `# Loops in C++\n\n## For Loop\n\n\`\`\`cpp\nfor (int i = 0; i < 5; i++) {\n    cout << i << " ";\n}\n// Output: 0 1 2 3 4\n\`\`\`\n\n## While Loop\n\n\`\`\`cpp\nint n = 5;\nwhile (n > 0) {\n    cout << n << " ";\n    n--;\n}\n// Output: 5 4 3 2 1\n\`\`\`\n\n## Do-While Loop\n\n\`\`\`cpp\nint x = 1;\ndo {\n    cout << x << endl;\n    x++;\n} while (x <= 3);\n\`\`\`\n\n## Range-Based For (C++11)\n\n\`\`\`cpp\nint arr[] = {10, 20, 30};\nfor (int val : arr) {\n    cout << val << endl;\n}\n\`\`\``,
  });
  const [cppQ3] = await db.insert(lessonsTable).values({ moduleId: cppMod2.id, title: "Control Flow Quiz", type: "quiz", orderIndex: 2, xpReward: 15, estimatedMinutes: 5 }).returning();
  await createQuiz(cppQ3.id, [
    { question: "Which loop guarantees at least one execution?", explanation: "do-while always executes the body once before checking.", options: [{ text: "do-while", isCorrect: true }, { text: "for", isCorrect: false }, { text: "while", isCorrect: false }, { text: "foreach", isCorrect: false }] },
    { question: "What is the logical AND operator in C++?", explanation: "&& is the logical AND operator.", options: [{ text: "&&", isCorrect: true }, { text: "and", isCorrect: false }, { text: "&", isCorrect: false }, { text: "||", isCorrect: false }] },
  ]);
  await db.insert(lessonsTable).values({ moduleId: cppMod2.id, title: "Switch Statement", type: "theory", orderIndex: 3, xpReward: 10, estimatedMinutes: 5,
    content: `# Switch Statement\n\nThe switch statement selects one of many code blocks.\n\n\`\`\`cpp\nint day = 3;\nswitch (day) {\n    case 1: cout << "Monday"; break;\n    case 2: cout << "Tuesday"; break;\n    case 3: cout << "Wednesday"; break;\n    default: cout << "Other";\n}\n\`\`\`\n\n## Rules\n\n- Each \`case\` must end with \`break\`\n- \`default\` handles unmatched values\n- Only works with integers, chars, enums`,
  });

  const [cppMod3] = await db.insert(modulesTable).values({ courseId: cppCourse.id, title: "Functions", description: "Reusable code blocks", orderIndex: 2 }).returning();
  await db.insert(lessonsTable).values({ moduleId: cppMod3.id, title: "Defining Functions", type: "theory", orderIndex: 0, xpReward: 10, estimatedMinutes: 6,
    content: `# Defining Functions\n\n## Syntax\n\n\`\`\`cpp\nreturnType functionName(parameters) {\n    // body\n    return value;\n}\n\`\`\`\n\n## Examples\n\n\`\`\`cpp\nint add(int a, int b) {\n    return a + b;\n}\n\nvoid greet(string name) {\n    cout << "Hello, " << name << "!" << endl;\n}\n\`\`\`\n\n## Default Parameters\n\n\`\`\`cpp\nint power(int base, int exp = 2) {\n    int result = 1;\n    for (int i = 0; i < exp; i++) result *= base;\n    return result;\n}\n// power(3) returns 9\n// power(3, 3) returns 27\n\`\`\``,
  });
  await db.insert(lessonsTable).values({ moduleId: cppMod3.id, title: "Function Overloading", type: "theory", orderIndex: 1, xpReward: 10, estimatedMinutes: 5,
    content: `# Function Overloading\n\nC++ allows multiple functions with the same name but different parameter lists.\n\n\`\`\`cpp\nint area(int side) {\n    return side * side;\n}\n\ndouble area(double length, double width) {\n    return length * width;\n}\n\ndouble area(double radius) {\n    return 3.14159 * radius * radius;\n}\n\`\`\`\n\n## Rules\n\n- Functions must differ by parameter count or types\n- Return type alone is not enough to distinguish\n- The compiler picks the best match at compile time`,
  });
  const [cppQ4] = await db.insert(lessonsTable).values({ moduleId: cppMod3.id, title: "Functions Quiz", type: "quiz", orderIndex: 2, xpReward: 15, estimatedMinutes: 5 }).returning();
  await createQuiz(cppQ4.id, [
    { question: "What does 'void' mean as a return type?", explanation: "void means the function doesn't return a value.", options: [{ text: "No return value", isCorrect: true }, { text: "Returns null", isCorrect: false }, { text: "Returns 0", isCorrect: false }, { text: "Returns empty string", isCorrect: false }] },
    { question: "What is function overloading?", explanation: "Overloading means multiple functions with the same name but different parameters.", options: [{ text: "Same name, different parameters", isCorrect: true }, { text: "Same name, same parameters", isCorrect: false }, { text: "Different name, same parameters", isCorrect: false }, { text: "Calling a function multiple times", isCorrect: false }] },
  ]);
  await db.insert(lessonsTable).values({ moduleId: cppMod3.id, title: "References & Pointers Intro", type: "theory", orderIndex: 3, xpReward: 12, estimatedMinutes: 7,
    content: `# References & Pointers\n\n## References\n\nA reference is an alias for an existing variable.\n\n\`\`\`cpp\nint x = 10;\nint& ref = x;  // ref is an alias for x\nref = 20;      // x is now 20\n\`\`\`\n\n## Pass by Reference\n\n\`\`\`cpp\nvoid doubleIt(int& n) {\n    n *= 2;\n}\nint val = 5;\ndoubleIt(val);  // val is now 10\n\`\`\`\n\n## Pointers\n\nA pointer stores a memory address.\n\n\`\`\`cpp\nint x = 42;\nint* ptr = &x;  // ptr holds address of x\ncout << *ptr;   // dereference: prints 42\n*ptr = 100;     // x is now 100\n\`\`\``,
  });

  const [cppMod4] = await db.insert(modulesTable).values({ courseId: cppCourse.id, title: "Arrays & Strings", description: "Working with collections of data", orderIndex: 3 }).returning();
  await db.insert(lessonsTable).values({ moduleId: cppMod4.id, title: "Arrays", type: "theory", orderIndex: 0, xpReward: 10, estimatedMinutes: 6,
    content: `# Arrays in C++\n\n## Declaration\n\n\`\`\`cpp\nint numbers[5] = {1, 2, 3, 4, 5};\nstring names[] = {"Alice", "Bob", "Charlie"};\n\`\`\`\n\n## Accessing Elements\n\n\`\`\`cpp\ncout << numbers[0];  // 1 (zero-indexed)\nnumbers[2] = 99;     // modify element\n\`\`\`\n\n## Iterating\n\n\`\`\`cpp\nfor (int i = 0; i < 5; i++) {\n    cout << numbers[i] << " ";\n}\n// or range-based:\nfor (int n : numbers) {\n    cout << n << " ";\n}\n\`\`\`\n\n## Multidimensional Arrays\n\n\`\`\`cpp\nint matrix[2][3] = {{1,2,3}, {4,5,6}};\ncout << matrix[1][2]; // 6\n\`\`\``,
  });
  await db.insert(lessonsTable).values({ moduleId: cppMod4.id, title: "Strings in C++", type: "theory", orderIndex: 1, xpReward: 10, estimatedMinutes: 6,
    content: `# Strings in C++\n\n## std::string\n\n\`\`\`cpp\n#include <string>\nstring greeting = "Hello";\nstring name = "World";\nstring message = greeting + ", " + name + "!";\ncout << message; // Hello, World!\n\`\`\`\n\n## Useful Methods\n\n| Method | Description |\n|--------|------------|\n| .length() | String length |\n| .substr(pos, len) | Substring |\n| .find("text") | Find position |\n| .replace(pos, len, "new") | Replace |\n| .at(i) | Character at index |\n| .empty() | Is empty? |\n\n## String Input\n\n\`\`\`cpp\nstring line;\ngetline(cin, line); // read entire line\n\`\`\``,
  });
  const [cppQ5] = await db.insert(lessonsTable).values({ moduleId: cppMod4.id, title: "Arrays & Strings Quiz", type: "quiz", orderIndex: 2, xpReward: 15, estimatedMinutes: 5 }).returning();
  await createQuiz(cppQ5.id, [
    { question: "What is the index of the first element in a C++ array?", explanation: "C++ arrays are zero-indexed.", options: [{ text: "0", isCorrect: true }, { text: "1", isCorrect: false }, { text: "-1", isCorrect: false }, { text: "Depends on the array", isCorrect: false }] },
    { question: "How do you get the length of a std::string?", explanation: ".length() or .size() returns string length.", options: [{ text: ".length()", isCorrect: true }, { text: ".len()", isCorrect: false }, { text: "strlen()", isCorrect: false }, { text: ".count()", isCorrect: false }] },
  ]);

  const [cppMod5] = await db.insert(modulesTable).values({ courseId: cppCourse.id, title: "OOP in C++", description: "Classes and object-oriented programming", orderIndex: 4 }).returning();
  await db.insert(lessonsTable).values({ moduleId: cppMod5.id, title: "Classes & Objects", type: "theory", orderIndex: 0, xpReward: 12, estimatedMinutes: 7,
    content: `# Classes & Objects\n\n## Defining a Class\n\n\`\`\`cpp\nclass Dog {\npublic:\n    string name;\n    int age;\n\n    void bark() {\n        cout << name << " says Woof!" << endl;\n    }\n};\n\`\`\`\n\n## Creating Objects\n\n\`\`\`cpp\nDog myDog;\nmyDog.name = "Rex";\nmyDog.age = 3;\nmyDog.bark(); // Rex says Woof!\n\`\`\`\n\n## Access Modifiers\n\n- \`public\` — accessible from anywhere\n- \`private\` — only accessible within the class\n- \`protected\` — accessible in class and subclasses`,
  });
  await db.insert(lessonsTable).values({ moduleId: cppMod5.id, title: "Constructors & Destructors", type: "theory", orderIndex: 1, xpReward: 12, estimatedMinutes: 7,
    content: `# Constructors & Destructors\n\n## Constructor\n\nA constructor initializes an object when it's created.\n\n\`\`\`cpp\nclass Car {\npublic:\n    string brand;\n    int year;\n\n    Car(string b, int y) : brand(b), year(y) {}\n\n    void info() {\n        cout << year << " " << brand << endl;\n    }\n};\n\nCar myCar("Toyota", 2023);\nmyCar.info(); // 2023 Toyota\n\`\`\`\n\n## Destructor\n\n\`\`\`cpp\nclass File {\npublic:\n    File() { cout << "File opened" << endl; }\n    ~File() { cout << "File closed" << endl; }\n};\n\`\`\`\n\nThe destructor (\`~ClassName\`) is called when the object goes out of scope.`,
  });
  await db.insert(lessonsTable).values({ moduleId: cppMod5.id, title: "Inheritance", type: "theory", orderIndex: 2, xpReward: 12, estimatedMinutes: 7,
    content: `# Inheritance\n\nInheritance lets a class derive from another.\n\n\`\`\`cpp\nclass Animal {\npublic:\n    string name;\n    void eat() { cout << name << " eats" << endl; }\n};\n\nclass Cat : public Animal {\npublic:\n    void meow() { cout << name << " says Meow!" << endl; }\n};\n\nCat c;\nc.name = "Whiskers";\nc.eat();   // Whiskers eats\nc.meow();  // Whiskers says Meow!\n\`\`\`\n\n## Virtual Functions & Polymorphism\n\n\`\`\`cpp\nclass Shape {\npublic:\n    virtual double area() = 0; // pure virtual\n};\n\nclass Circle : public Shape {\n    double radius;\npublic:\n    Circle(double r) : radius(r) {}\n    double area() override { return 3.14159 * radius * radius; }\n};\n\`\`\``,
  });
  const [cppQ6] = await db.insert(lessonsTable).values({ moduleId: cppMod5.id, title: "OOP Quiz", type: "quiz", orderIndex: 3, xpReward: 15, estimatedMinutes: 5 }).returning();
  await createQuiz(cppQ6.id, [
    { question: "What keyword makes a class member accessible only within the class?", explanation: "private restricts access to the class itself.", options: [{ text: "private", isCorrect: true }, { text: "public", isCorrect: false }, { text: "protected", isCorrect: false }, { text: "static", isCorrect: false }] },
    { question: "What is a pure virtual function?", explanation: "A pure virtual function (= 0) has no implementation and must be overridden.", options: [{ text: "A function with = 0 that must be overridden", isCorrect: true }, { text: "A function that returns void", isCorrect: false }, { text: "A static function", isCorrect: false }, { text: "A private function", isCorrect: false }] },
  ]);

  await db.insert(lessonsTable).values({ moduleId: cppMod5.id, title: "STL Containers Overview", type: "theory", orderIndex: 4, xpReward: 12, estimatedMinutes: 7,
    content: `# STL Containers\n\nThe Standard Template Library provides powerful container classes.\n\n## vector\n\n\`\`\`cpp\n#include <vector>\nvector<int> nums = {1, 2, 3};\nnums.push_back(4);\ncout << nums.size(); // 4\n\`\`\`\n\n## map\n\n\`\`\`cpp\n#include <map>\nmap<string, int> ages;\nages["Alice"] = 25;\nages["Bob"] = 30;\ncout << ages["Alice"]; // 25\n\`\`\`\n\n## set\n\n\`\`\`cpp\n#include <set>\nset<int> unique = {3, 1, 4, 1, 5};\n// contains: 1, 3, 4, 5 (sorted, no duplicates)\n\`\`\`\n\n## Common Operations\n\n| Container | Insert | Access | Search |\n|-----------|--------|--------|--------|\n| vector | O(1) amortized | O(1) | O(n) |\n| map | O(log n) | O(log n) | O(log n) |\n| set | O(log n) | — | O(log n) |`,
  });

  console.log("C++ course seeded (20 lessons)");
  } // end of C++ block

  // =============== JAVA COURSE ===============
  if (!existingLanguages.has("java")) {
  const [javaCourse] = await db.insert(coursesTable).values({
    title: "Java Programming",
    description: "Learn Java fundamentals — syntax, OOP, collections, exception handling, and more. Build robust, portable applications.",
    language: "java", difficulty: "intermediate", totalLessons: 20, estimatedHours: 10, xpReward: 700, isPublished: true,
    imageUrl: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg",
  }).returning();

  const [javaMod1] = await db.insert(modulesTable).values({ courseId: javaCourse.id, title: "Java Basics", description: "Getting started with Java", orderIndex: 0 }).returning();
  await db.insert(lessonsTable).values({ moduleId: javaMod1.id, title: "Introduction to Java", type: "theory", orderIndex: 0, xpReward: 10, estimatedMinutes: 5,
    content: `# Introduction to Java\n\nJava is a **class-based, object-oriented language** created by James Gosling at Sun Microsystems in 1995.\n\n## Why Java?\n\n- **Write Once, Run Anywhere**: Compiled to bytecode for the JVM\n- **Enterprise standard**: Powers banking, Android, big data\n- **Strong typing**: Catches errors at compile time\n\n## Hello World\n\n\`\`\`java\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}\n\`\`\`\n\n## Key Points\n\n- Every Java program needs a \`main\` method\n- \`System.out.println()\` prints output\n- File name must match the public class name\n- Statements end with semicolons`,
  });
  const [javaQ1] = await db.insert(lessonsTable).values({ moduleId: javaMod1.id, title: "Java Basics Quiz", type: "quiz", orderIndex: 1, xpReward: 15, estimatedMinutes: 5 }).returning();
  await createQuiz(javaQ1.id, [
    { question: "Who created Java?", explanation: "Java was created by James Gosling at Sun Microsystems.", options: [{ text: "James Gosling", isCorrect: true }, { text: "Bjarne Stroustrup", isCorrect: false }, { text: "Guido van Rossum", isCorrect: false }, { text: "Brendan Eich", isCorrect: false }] },
    { question: "What is the entry point of a Java program?", explanation: "The main method is the entry point.", options: [{ text: "public static void main(String[] args)", isCorrect: true }, { text: "void start()", isCorrect: false }, { text: "function main()", isCorrect: false }, { text: "def main():", isCorrect: false }] },
    { question: "What does JVM stand for?", explanation: "JVM = Java Virtual Machine.", options: [{ text: "Java Virtual Machine", isCorrect: true }, { text: "Java Version Manager", isCorrect: false }, { text: "Java Visual Monitor", isCorrect: false }, { text: "Java Variable Method", isCorrect: false }] },
  ]);
  await db.insert(lessonsTable).values({ moduleId: javaMod1.id, title: "Variables & Types", type: "theory", orderIndex: 2, xpReward: 10, estimatedMinutes: 6,
    content: `# Variables & Types in Java\n\nJava is **statically typed** — each variable must have a declared type.\n\n## Primitive Types\n\n| Type | Size | Example |\n|------|------|---------|\n| int | 4 bytes | \`int x = 42;\` |\n| double | 8 bytes | \`double pi = 3.14;\` |\n| boolean | 1 bit | \`boolean ok = true;\` |\n| char | 2 bytes | \`char c = 'A';\` |\n| long | 8 bytes | \`long big = 999999999L;\` |\n\n## Reference Types\n\n\`\`\`java\nString name = "Java";\nint[] numbers = {1, 2, 3};\n\`\`\`\n\n## Type Casting\n\n\`\`\`java\nint x = (int) 3.7;  // explicit: x = 3\ndouble y = 5;       // implicit: y = 5.0\n\`\`\``,
  });
  const [javaQ2] = await db.insert(lessonsTable).values({ moduleId: javaMod1.id, title: "Variables Quiz", type: "quiz", orderIndex: 3, xpReward: 15, estimatedMinutes: 5 }).returning();
  await createQuiz(javaQ2.id, [
    { question: "Is String a primitive type in Java?", explanation: "String is a reference type (class), not a primitive.", options: [{ text: "No, it's a reference type", isCorrect: true }, { text: "Yes, it's a primitive", isCorrect: false }, { text: "It depends on the JVM", isCorrect: false }, { text: "Only in Java 8+", isCorrect: false }] },
    { question: "What happens with: int x = (int) 3.9;", explanation: "Casting truncates (does not round).", options: [{ text: "x = 3", isCorrect: true }, { text: "x = 4", isCorrect: false }, { text: "Compile error", isCorrect: false }, { text: "x = 3.9", isCorrect: false }] },
  ]);

  const [javaMod2] = await db.insert(modulesTable).values({ courseId: javaCourse.id, title: "Control Flow", description: "Conditionals and loops in Java", orderIndex: 1 }).returning();
  await db.insert(lessonsTable).values({ moduleId: javaMod2.id, title: "If/Else & Switch", type: "theory", orderIndex: 0, xpReward: 10, estimatedMinutes: 5,
    content: `# If/Else & Switch\n\n## If/Else\n\n\`\`\`java\nint score = 85;\nif (score >= 90) {\n    System.out.println("A");\n} else if (score >= 80) {\n    System.out.println("B");\n} else {\n    System.out.println("C");\n}\n\`\`\`\n\n## Ternary Operator\n\n\`\`\`java\nString result = (score >= 60) ? "Pass" : "Fail";\n\`\`\`\n\n## Switch\n\n\`\`\`java\nint day = 3;\nswitch (day) {\n    case 1: System.out.println("Mon"); break;\n    case 2: System.out.println("Tue"); break;\n    case 3: System.out.println("Wed"); break;\n    default: System.out.println("Other");\n}\n\`\`\``,
  });
  await db.insert(lessonsTable).values({ moduleId: javaMod2.id, title: "Loops", type: "theory", orderIndex: 1, xpReward: 10, estimatedMinutes: 6,
    content: `# Loops in Java\n\n## For Loop\n\n\`\`\`java\nfor (int i = 0; i < 5; i++) {\n    System.out.print(i + " ");\n}\n// Output: 0 1 2 3 4\n\`\`\`\n\n## While Loop\n\n\`\`\`java\nint n = 5;\nwhile (n > 0) {\n    System.out.print(n + " ");\n    n--;\n}\n\`\`\`\n\n## For-Each Loop\n\n\`\`\`java\nString[] fruits = {"apple", "banana", "cherry"};\nfor (String fruit : fruits) {\n    System.out.println(fruit);\n}\n\`\`\`\n\n## Break & Continue\n\n- \`break\` exits the loop entirely\n- \`continue\` skips to the next iteration`,
  });
  const [javaQ3] = await db.insert(lessonsTable).values({ moduleId: javaMod2.id, title: "Control Flow Quiz", type: "quiz", orderIndex: 2, xpReward: 15, estimatedMinutes: 5 }).returning();
  await createQuiz(javaQ3.id, [
    { question: "Which Java loop is best for iterating over an array?", explanation: "The for-each loop is designed for iterating collections and arrays.", options: [{ text: "for-each (enhanced for)", isCorrect: true }, { text: "do-while", isCorrect: false }, { text: "goto", isCorrect: false }, { text: "repeat", isCorrect: false }] },
    { question: "What does 'break' do in a loop?", explanation: "break immediately exits the loop.", options: [{ text: "Exits the loop", isCorrect: true }, { text: "Skips to next iteration", isCorrect: false }, { text: "Restarts the loop", isCorrect: false }, { text: "Pauses the loop", isCorrect: false }] },
  ]);
  await db.insert(lessonsTable).values({ moduleId: javaMod2.id, title: "Exception Handling", type: "theory", orderIndex: 3, xpReward: 12, estimatedMinutes: 6,
    content: `# Exception Handling\n\nJava uses try-catch blocks to handle runtime errors.\n\n## Syntax\n\n\`\`\`java\ntry {\n    int result = 10 / 0;\n} catch (ArithmeticException e) {\n    System.out.println("Cannot divide by zero!");\n} finally {\n    System.out.println("This always runs");\n}\n\`\`\`\n\n## Common Exceptions\n\n| Exception | Cause |\n|-----------|-------|\n| NullPointerException | Using null reference |\n| ArrayIndexOutOfBoundsException | Invalid array index |\n| ArithmeticException | Math error (div by 0) |\n| NumberFormatException | Invalid number parsing |\n\n## Throwing Exceptions\n\n\`\`\`java\nif (age < 0) {\n    throw new IllegalArgumentException("Age cannot be negative");\n}\n\`\`\``,
  });

  const [javaMod3] = await db.insert(modulesTable).values({ courseId: javaCourse.id, title: "Methods & Functions", description: "Defining and using methods", orderIndex: 2 }).returning();
  await db.insert(lessonsTable).values({ moduleId: javaMod3.id, title: "Defining Methods", type: "theory", orderIndex: 0, xpReward: 10, estimatedMinutes: 6,
    content: `# Defining Methods\n\n## Syntax\n\n\`\`\`java\naccessModifier returnType methodName(parameters) {\n    // body\n    return value;\n}\n\`\`\`\n\n## Examples\n\n\`\`\`java\npublic static int add(int a, int b) {\n    return a + b;\n}\n\npublic static void greet(String name) {\n    System.out.println("Hello, " + name);\n}\n\`\`\`\n\n## Method Overloading\n\n\`\`\`java\npublic static int multiply(int a, int b) {\n    return a * b;\n}\n\npublic static double multiply(double a, double b) {\n    return a * b;\n}\n\`\`\`\n\nJava picks the correct method based on argument types.`,
  });
  await db.insert(lessonsTable).values({ moduleId: javaMod3.id, title: "Scope & Static", type: "theory", orderIndex: 1, xpReward: 10, estimatedMinutes: 5,
    content: `# Scope & Static\n\n## Variable Scope\n\nVariables are only accessible within their declared block.\n\n\`\`\`java\npublic void example() {\n    int x = 10; // local to this method\n    if (true) {\n        int y = 20; // local to this if-block\n    }\n    // y is NOT accessible here\n}\n\`\`\`\n\n## Static Members\n\nStatic members belong to the class, not instances.\n\n\`\`\`java\nclass Counter {\n    static int count = 0;\n\n    Counter() {\n        count++;\n    }\n\n    static int getCount() {\n        return count;\n    }\n}\n\`\`\``,
  });
  const [javaQ4] = await db.insert(lessonsTable).values({ moduleId: javaMod3.id, title: "Methods Quiz", type: "quiz", orderIndex: 2, xpReward: 15, estimatedMinutes: 5 }).returning();
  await createQuiz(javaQ4.id, [
    { question: "What keyword means a method belongs to the class rather than an instance?", explanation: "static methods belong to the class itself.", options: [{ text: "static", isCorrect: true }, { text: "final", isCorrect: false }, { text: "abstract", isCorrect: false }, { text: "public", isCorrect: false }] },
    { question: "Can two methods have the same name in Java?", explanation: "Yes, through method overloading (different parameters).", options: [{ text: "Yes, with different parameters", isCorrect: true }, { text: "No, never", isCorrect: false }, { text: "Only in different classes", isCorrect: false }, { text: "Only if one is static", isCorrect: false }] },
  ]);

  const [javaMod4] = await db.insert(modulesTable).values({ courseId: javaCourse.id, title: "OOP in Java", description: "Classes, inheritance, interfaces", orderIndex: 3 }).returning();
  await db.insert(lessonsTable).values({ moduleId: javaMod4.id, title: "Classes & Objects", type: "theory", orderIndex: 0, xpReward: 12, estimatedMinutes: 7,
    content: `# Classes & Objects\n\n## Defining a Class\n\n\`\`\`java\npublic class Dog {\n    String name;\n    int age;\n\n    public Dog(String name, int age) {\n        this.name = name;\n        this.age = age;\n    }\n\n    public void bark() {\n        System.out.println(name + " says Woof!");\n    }\n}\n\`\`\`\n\n## Creating Objects\n\n\`\`\`java\nDog rex = new Dog("Rex", 3);\nrex.bark(); // Rex says Woof!\n\`\`\`\n\n## Encapsulation\n\n\`\`\`java\nprivate String name;\n\npublic String getName() { return name; }\npublic void setName(String name) { this.name = name; }\n\`\`\``,
  });
  await db.insert(lessonsTable).values({ moduleId: javaMod4.id, title: "Inheritance & Interfaces", type: "theory", orderIndex: 1, xpReward: 12, estimatedMinutes: 7,
    content: `# Inheritance & Interfaces\n\n## Inheritance\n\n\`\`\`java\nclass Animal {\n    String name;\n    void eat() { System.out.println(name + " eats"); }\n}\n\nclass Cat extends Animal {\n    void meow() { System.out.println(name + " says Meow!"); }\n}\n\`\`\`\n\n## Interfaces\n\nAn interface defines a contract that classes must implement.\n\n\`\`\`java\ninterface Drawable {\n    void draw();\n}\n\nclass Circle implements Drawable {\n    public void draw() {\n        System.out.println("Drawing circle");\n    }\n}\n\`\`\`\n\n## Key Differences\n\n- \`extends\` for class inheritance (single)\n- \`implements\` for interfaces (multiple)\n- Interfaces can have default methods (Java 8+)`,
  });
  const [javaQ5] = await db.insert(lessonsTable).values({ moduleId: javaMod4.id, title: "OOP Quiz", type: "quiz", orderIndex: 2, xpReward: 15, estimatedMinutes: 5 }).returning();
  await createQuiz(javaQ5.id, [
    { question: "What keyword is used for inheritance in Java?", explanation: "extends is used for class inheritance.", options: [{ text: "extends", isCorrect: true }, { text: "inherits", isCorrect: false }, { text: "implements", isCorrect: false }, { text: "derives", isCorrect: false }] },
    { question: "Can a Java class implement multiple interfaces?", explanation: "Yes, a class can implement multiple interfaces.", options: [{ text: "Yes", isCorrect: true }, { text: "No", isCorrect: false }, { text: "Only in Java 8+", isCorrect: false }, { text: "Only if they have no methods", isCorrect: false }] },
  ]);
  await db.insert(lessonsTable).values({ moduleId: javaMod4.id, title: "Abstract Classes", type: "theory", orderIndex: 3, xpReward: 12, estimatedMinutes: 6,
    content: `# Abstract Classes\n\nAn abstract class cannot be instantiated directly. It can have both abstract and concrete methods.\n\n\`\`\`java\nabstract class Shape {\n    String color;\n\n    Shape(String color) {\n        this.color = color;\n    }\n\n    abstract double area(); // must be implemented\n\n    void describe() { // concrete method\n        System.out.println("A " + color + " shape");\n    }\n}\n\nclass Circle extends Shape {\n    double radius;\n\n    Circle(String color, double radius) {\n        super(color);\n        this.radius = radius;\n    }\n\n    double area() {\n        return Math.PI * radius * radius;\n    }\n}\n\`\`\`\n\n## Abstract vs Interface\n\n- Abstract classes can have constructors and fields\n- Interfaces define only contracts (pre-Java 8)\n- Use abstract when classes share state; interfaces for capabilities`,
  });

  const [javaMod5] = await db.insert(modulesTable).values({ courseId: javaCourse.id, title: "Collections & Generics", description: "ArrayList, HashMap, and generics", orderIndex: 4 }).returning();
  await db.insert(lessonsTable).values({ moduleId: javaMod5.id, title: "ArrayList", type: "theory", orderIndex: 0, xpReward: 10, estimatedMinutes: 6,
    content: `# ArrayList\n\nArrayList is a resizable array from java.util.\n\n\`\`\`java\nimport java.util.ArrayList;\n\nArrayList<String> names = new ArrayList<>();\nnames.add("Alice");\nnames.add("Bob");\nnames.add("Charlie");\n\nSystem.out.println(names.get(0)); // Alice\nnames.remove(1); // remove Bob\nSystem.out.println(names.size()); // 2\n\`\`\`\n\n## Useful Methods\n\n| Method | Description |\n|--------|------------|\n| .add(item) | Add element |\n| .get(index) | Get element |\n| .set(index, item) | Replace element |\n| .remove(index) | Remove element |\n| .size() | Number of elements |\n| .contains(item) | Check if exists |\n| .clear() | Remove all |`,
  });
  await db.insert(lessonsTable).values({ moduleId: javaMod5.id, title: "HashMap", type: "theory", orderIndex: 1, xpReward: 10, estimatedMinutes: 6,
    content: `# HashMap\n\nHashMap stores key-value pairs.\n\n\`\`\`java\nimport java.util.HashMap;\n\nHashMap<String, Integer> ages = new HashMap<>();\nages.put("Alice", 25);\nages.put("Bob", 30);\n\nSystem.out.println(ages.get("Alice")); // 25\nSystem.out.println(ages.containsKey("Bob")); // true\n\n// Iterate\nfor (String key : ages.keySet()) {\n    System.out.println(key + ": " + ages.get(key));\n}\n\`\`\`\n\n## Common Methods\n\n| Method | Description |\n|--------|------------|\n| .put(key, value) | Add/update entry |\n| .get(key) | Get value |\n| .remove(key) | Remove entry |\n| .containsKey(key) | Check key |\n| .keySet() | All keys |\n| .values() | All values |`,
  });
  const [javaQ6] = await db.insert(lessonsTable).values({ moduleId: javaMod5.id, title: "Collections Quiz", type: "quiz", orderIndex: 2, xpReward: 15, estimatedMinutes: 5 }).returning();
  await createQuiz(javaQ6.id, [
    { question: "What is ArrayList<String> an example of?", explanation: "It uses generics to specify the element type.", options: [{ text: "Generics", isCorrect: true }, { text: "Inheritance", isCorrect: false }, { text: "Polymorphism", isCorrect: false }, { text: "Encapsulation", isCorrect: false }] },
    { question: "Which collection stores key-value pairs?", explanation: "HashMap stores key-value pairs.", options: [{ text: "HashMap", isCorrect: true }, { text: "ArrayList", isCorrect: false }, { text: "HashSet", isCorrect: false }, { text: "LinkedList", isCorrect: false }] },
  ]);
  await db.insert(lessonsTable).values({ moduleId: javaMod5.id, title: "Generics Basics", type: "theory", orderIndex: 3, xpReward: 12, estimatedMinutes: 6,
    content: `# Generics\n\nGenerics allow you to write type-safe, reusable code.\n\n\`\`\`java\npublic class Box<T> {\n    private T content;\n\n    public void set(T item) { this.content = item; }\n    public T get() { return content; }\n}\n\nBox<String> strBox = new Box<>();\nstrBox.set("Hello");\nString val = strBox.get(); // no cast needed\n\nBox<Integer> intBox = new Box<>();\nintBox.set(42);\nint num = intBox.get();\n\`\`\`\n\n## Generic Methods\n\n\`\`\`java\npublic static <T> void printArray(T[] arr) {\n    for (T item : arr) {\n        System.out.print(item + " ");\n    }\n}\n\`\`\`\n\n## Bounded Types\n\n\`\`\`java\npublic static <T extends Comparable<T>> T max(T a, T b) {\n    return (a.compareTo(b) > 0) ? a : b;\n}\n\`\`\``,
  });

  await db.insert(lessonsTable).values({ moduleId: javaMod5.id, title: "Iterators & Streams", type: "theory", orderIndex: 4, xpReward: 12, estimatedMinutes: 7,
    content: `# Iterators & Streams\n\n## Iterator\n\nIterators traverse collections element by element.\n\n\`\`\`java\nimport java.util.*;\n\nArrayList<String> names = new ArrayList<>(Arrays.asList("Alice", "Bob", "Charlie"));\nIterator<String> it = names.iterator();\nwhile (it.hasNext()) {\n    System.out.println(it.next());\n}\n\`\`\`\n\n## Streams (Java 8+)\n\nStreams provide functional-style operations on collections.\n\n\`\`\`java\nList<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5, 6);\n\n// Filter even numbers and double them\nnumbers.stream()\n    .filter(n -> n % 2 == 0)\n    .map(n -> n * 2)\n    .forEach(System.out::println);\n// Output: 4 8 12\n\`\`\`\n\n## Common Stream Operations\n\n| Method | Description |\n|--------|------------|\n| .filter() | Keep matching elements |\n| .map() | Transform elements |\n| .reduce() | Combine into single result |\n| .collect() | Gather into a collection |\n| .sorted() | Sort elements |\n| .count() | Count elements |`,
  });

  console.log("Java course seeded (20 lessons)");
  } // end of Java block

  console.log("Seeding complete!");
}

seed().then(() => process.exit(0)).catch(console.error);
