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

async function seed() {
  console.log("Seeding database...");

  // Achievements
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
    console.log("✓ Achievements seeded");
  }

  // Check if courses exist
  const existingCourses = await db.select().from(coursesTable);
  if (existingCourses.length > 0) {
    console.log("Courses already exist, skipping course seed.");
    return;
  }

  // Course 1: Python Basics
  const [pythonCourse] = await db.insert(coursesTable).values({
    title: "Python Fundamentals",
    description: "Master the basics of Python programming from scratch. Learn variables, control flow, functions, and data structures through hands-on exercises.",
    language: "python",
    difficulty: "beginner",
    imageUrl: "/images/course-python.png",
    totalLessons: 12,
    estimatedHours: 4,
    xpReward: 500,
    isPublished: true,
  }).returning();

  // Module 1: Getting Started
  const [mod1] = await db.insert(modulesTable).values({
    courseId: pythonCourse.id,
    title: "Getting Started with Python",
    description: "Set up your environment and write your first Python programs",
    orderIndex: 0,
  }).returning();

  // Theory Lesson 1
  const [theory1] = await db.insert(lessonsTable).values({
    moduleId: mod1.id,
    title: "What is Python?",
    type: "theory",
    orderIndex: 0,
    xpReward: 10,
    estimatedMinutes: 5,
    content: `# What is Python?

Python is a **high-level, interpreted programming language** created by Guido van Rossum in 1991. It's known for its clean, readable syntax and versatility.

## Why Python?

- **Beginner-friendly**: Python's syntax is close to plain English
- **Versatile**: Used in web development, data science, AI, automation, and more
- **Huge ecosystem**: Thousands of libraries available
- **In-demand**: One of the most popular languages in the industry

## Python in the Real World

\`\`\`python
# Instagram, YouTube, and Spotify are all built with Python
print("Hello, World!")  # Your first Python program!
\`\`\`

## Basic Output

In Python, we use the \`print()\` function to display output:

\`\`\`python
print("Hello, World!")
print("Python is awesome!")
print(42)
print(3.14)
\`\`\`

Each \`print()\` call outputs to a new line. You can print strings, numbers, and more.

## Comments

Comments help explain your code and are ignored by Python:

\`\`\`python
# This is a single-line comment
print("This runs")  # This is an inline comment

"""
This is a
multi-line comment
"""
\`\`\`

Ready to write your first Python code? Move on to the next lesson!`,
  }).returning();

  // Quiz Lesson 1
  const [quiz1] = await db.insert(lessonsTable).values({
    moduleId: mod1.id,
    title: "Python Basics Quiz",
    type: "quiz",
    orderIndex: 1,
    xpReward: 15,
    estimatedMinutes: 5,
  }).returning();

  const [q1] = await db.insert(quizQuestionsTable).values({
    lessonId: quiz1.id,
    question: "Who created Python?",
    explanation: "Python was created by Guido van Rossum and first released in 1991.",
    orderIndex: 0,
  }).returning();

  await db.insert(quizOptionsTable).values([
    { questionId: q1.id, text: "Guido van Rossum", isCorrect: true, orderIndex: 0 },
    { questionId: q1.id, text: "Linus Torvalds", isCorrect: false, orderIndex: 1 },
    { questionId: q1.id, text: "James Gosling", isCorrect: false, orderIndex: 2 },
    { questionId: q1.id, text: "Brendan Eich", isCorrect: false, orderIndex: 3 },
  ]);

  const [q2] = await db.insert(quizQuestionsTable).values({
    lessonId: quiz1.id,
    question: "Which function is used to display output in Python?",
    explanation: "The print() function is the primary way to output text in Python.",
    orderIndex: 1,
  }).returning();

  await db.insert(quizOptionsTable).values([
    { questionId: q2.id, text: "print()", isCorrect: true, orderIndex: 0 },
    { questionId: q2.id, text: "echo()", isCorrect: false, orderIndex: 1 },
    { questionId: q2.id, text: "console.log()", isCorrect: false, orderIndex: 2 },
    { questionId: q2.id, text: "display()", isCorrect: false, orderIndex: 3 },
  ]);

  const [q3] = await db.insert(quizQuestionsTable).values({
    lessonId: quiz1.id,
    question: "What symbol starts a single-line comment in Python?",
    explanation: "The # symbol is used for single-line comments in Python.",
    orderIndex: 2,
  }).returning();

  await db.insert(quizOptionsTable).values([
    { questionId: q3.id, text: "#", isCorrect: true, orderIndex: 0 },
    { questionId: q3.id, text: "//", isCorrect: false, orderIndex: 1 },
    { questionId: q3.id, text: "/*", isCorrect: false, orderIndex: 2 },
    { questionId: q3.id, text: "--", isCorrect: false, orderIndex: 3 },
  ]);

  // Coding Challenge 1
  const [challenge1] = await db.insert(lessonsTable).values({
    moduleId: mod1.id,
    title: "Your First Program",
    type: "challenge",
    orderIndex: 2,
    xpReward: 25,
    estimatedMinutes: 10,
  }).returning();

  const [cc1] = await db.insert(codingChallengesTable).values({
    lessonId: challenge1.id,
    instructions: `## Your First Python Program

Write a Python program that prints the following two lines exactly:

\`\`\`
Hello, World!
I love Python!
\`\`\`

Use the \`print()\` function for each line.

**Remember:** Each \`print()\` call outputs on a new line.`,
    starterCode: `# Write your solution below
# Use print() to output each line

`,
    language: "python",
    hints: [
      "Use print() for each line separately",
      'print("Hello, World!") outputs Hello, World!',
    ],
  }).returning();

  await db.insert(testCasesTable).values([
    {
      challengeId: cc1.id,
      name: "Output line 1",
      input: "",
      expectedOutput: "Hello, World!\nI love Python!",
      isHidden: 0,
      orderIndex: 0,
    },
  ]);

  // Module 2: Variables and Data Types
  const [mod2] = await db.insert(modulesTable).values({
    courseId: pythonCourse.id,
    title: "Variables and Data Types",
    description: "Learn how to store and work with different types of data",
    orderIndex: 1,
  }).returning();

  // Theory: Variables
  const [theory2] = await db.insert(lessonsTable).values({
    moduleId: mod2.id,
    title: "Variables in Python",
    type: "theory",
    orderIndex: 0,
    xpReward: 10,
    estimatedMinutes: 8,
    content: `# Variables in Python

A **variable** is a named container that stores a value. Think of it like a labeled box.

## Creating Variables

In Python, you create a variable by assigning a value with \`=\`:

\`\`\`python
name = "Alice"
age = 25
height = 5.7
is_student = True
\`\`\`

## Data Types

Python has several built-in data types:

| Type | Example | Description |
|------|---------|-------------|
| \`str\` | \`"Hello"\` | Text strings |
| \`int\` | \`42\` | Whole numbers |
| \`float\` | \`3.14\` | Decimal numbers |
| \`bool\` | \`True/False\` | Boolean values |

## Checking Types

Use \`type()\` to check a variable's type:

\`\`\`python
name = "Alice"
print(type(name))   # <class 'str'>
print(type(42))     # <class 'int'>
print(type(3.14))   # <class 'float'>
print(type(True))   # <class 'bool'>
\`\`\`

## String Operations

\`\`\`python
first = "John"
last = "Doe"
full = first + " " + last  # Concatenation
print(full)  # John Doe

greeting = f"Hello, {first}!"  # f-string
print(greeting)  # Hello, John!
\`\`\`

## Naming Rules

- Use lowercase letters and underscores: \`my_variable\`
- Start with a letter or underscore
- No spaces or special characters
- Case-sensitive: \`name\` ≠ \`Name\``,
  }).returning();

  // Quiz: Variables
  const [quiz2] = await db.insert(lessonsTable).values({
    moduleId: mod2.id,
    title: "Variables Quiz",
    type: "quiz",
    orderIndex: 1,
    xpReward: 15,
    estimatedMinutes: 5,
  }).returning();

  const [q4] = await db.insert(quizQuestionsTable).values({
    lessonId: quiz2.id,
    question: 'What is the data type of the value "Hello"?',
    explanation: 'Text enclosed in quotes is a string (str) in Python.',
    orderIndex: 0,
  }).returning();

  await db.insert(quizOptionsTable).values([
    { questionId: q4.id, text: "str", isCorrect: true, orderIndex: 0 },
    { questionId: q4.id, text: "int", isCorrect: false, orderIndex: 1 },
    { questionId: q4.id, text: "float", isCorrect: false, orderIndex: 2 },
    { questionId: q4.id, text: "bool", isCorrect: false, orderIndex: 3 },
  ]);

  const [q5] = await db.insert(quizQuestionsTable).values({
    lessonId: quiz2.id,
    question: "Which is a valid Python variable name?",
    explanation: "Python variable names must start with a letter or underscore, and can only contain letters, numbers, and underscores.",
    orderIndex: 1,
  }).returning();

  await db.insert(quizOptionsTable).values([
    { questionId: q5.id, text: "my_variable", isCorrect: true, orderIndex: 0 },
    { questionId: q5.id, text: "2variable", isCorrect: false, orderIndex: 1 },
    { questionId: q5.id, text: "my-variable", isCorrect: false, orderIndex: 2 },
    { questionId: q5.id, text: "my variable", isCorrect: false, orderIndex: 3 },
  ]);

  // Challenge: Variables
  const [challenge2] = await db.insert(lessonsTable).values({
    moduleId: mod2.id,
    title: "Variable Calculator",
    type: "challenge",
    orderIndex: 2,
    xpReward: 30,
    estimatedMinutes: 10,
  }).returning();

  const [cc2] = await db.insert(codingChallengesTable).values({
    lessonId: challenge2.id,
    instructions: `## Variable Calculator

Create variables for two numbers and print their sum, difference, and product.

Given:
- \`a = 10\`
- \`b = 3\`

Print the results in this exact format:
\`\`\`
Sum: 13
Difference: 7
Product: 30
\`\`\``,
    starterCode: `a = 10
b = 3

# Calculate and print the sum
# Calculate and print the difference
# Calculate and print the product
`,
    language: "python",
    hints: [
      "Use + for addition, - for subtraction, * for multiplication",
      'Use f-strings: f"Sum: {a + b}"',
    ],
  }).returning();

  await db.insert(testCasesTable).values([
    {
      challengeId: cc2.id,
      name: "Correct calculations",
      input: "",
      expectedOutput: "Sum: 13\nDifference: 7\nProduct: 30",
      isHidden: 0,
      orderIndex: 0,
    },
  ]);

  // Module 3: Control Flow
  const [mod3] = await db.insert(modulesTable).values({
    courseId: pythonCourse.id,
    title: "Control Flow",
    description: "Make decisions and repeat actions with if statements and loops",
    orderIndex: 2,
  }).returning();

  // Theory: If statements
  const [theory3] = await db.insert(lessonsTable).values({
    moduleId: mod3.id,
    title: "If Statements",
    type: "theory",
    orderIndex: 0,
    xpReward: 10,
    estimatedMinutes: 8,
    content: `# If Statements

**Conditional statements** let your program make decisions based on conditions.

## Basic If Statement

\`\`\`python
age = 18

if age >= 18:
    print("You can vote!")
\`\`\`

**Note:** Python uses indentation (4 spaces) to define code blocks!

## If-Else

\`\`\`python
temperature = 25

if temperature > 30:
    print("It's hot outside!")
else:
    print("The weather is nice.")
\`\`\`

## If-Elif-Else

\`\`\`python
score = 85

if score >= 90:
    print("Grade: A")
elif score >= 80:
    print("Grade: B")
elif score >= 70:
    print("Grade: C")
else:
    print("Grade: F")
\`\`\`

## Comparison Operators

| Operator | Meaning |
|----------|---------|
| \`==\` | Equal to |
| \`!=\` | Not equal to |
| \`>\` | Greater than |
| \`<\` | Less than |
| \`>=\` | Greater or equal |
| \`<=\` | Less or equal |

## Logical Operators

\`\`\`python
x = 15

if x > 10 and x < 20:
    print("x is between 10 and 20")

if x < 5 or x > 10:
    print("x is outside 5-10 range")

if not (x == 15):
    print("x is not 15")
\`\`\``,
  }).returning();

  // Quiz: Control Flow
  const [quiz3] = await db.insert(lessonsTable).values({
    moduleId: mod3.id,
    title: "Control Flow Quiz",
    type: "quiz",
    orderIndex: 1,
    xpReward: 15,
    estimatedMinutes: 5,
  }).returning();

  const [q6] = await db.insert(quizQuestionsTable).values({
    lessonId: quiz3.id,
    question: "What keyword is used for 'else if' in Python?",
    explanation: "Python uses 'elif' (short for 'else if') for additional conditions.",
    orderIndex: 0,
  }).returning();

  await db.insert(quizOptionsTable).values([
    { questionId: q6.id, text: "elif", isCorrect: true, orderIndex: 0 },
    { questionId: q6.id, text: "elseif", isCorrect: false, orderIndex: 1 },
    { questionId: q6.id, text: "else if", isCorrect: false, orderIndex: 2 },
    { questionId: q6.id, text: "elsif", isCorrect: false, orderIndex: 3 },
  ]);

  // Challenge: If statements
  const [challenge3] = await db.insert(lessonsTable).values({
    moduleId: mod3.id,
    title: "Grade Calculator",
    type: "challenge",
    orderIndex: 2,
    xpReward: 30,
    estimatedMinutes: 10,
  }).returning();

  const [cc3] = await db.insert(codingChallengesTable).values({
    lessonId: challenge3.id,
    instructions: `## Grade Calculator

Write a program that determines a letter grade based on a score.

Given \`score = 75\`, print the letter grade:
- 90 and above: \`Grade: A\`
- 80-89: \`Grade: B\`
- 70-79: \`Grade: C\`
- 60-69: \`Grade: D\`
- Below 60: \`Grade: F\`

Expected output for score 75: \`Grade: C\``,
    starterCode: `score = 75

# Write your if-elif-else chain here
`,
    language: "python",
    hints: [
      "Use elif for multiple conditions",
      "Check from highest to lowest grade",
    ],
  }).returning();

  await db.insert(testCasesTable).values([
    {
      challengeId: cc3.id,
      name: "Score 75 = Grade C",
      input: "",
      expectedOutput: "Grade: C",
      isHidden: 0,
      orderIndex: 0,
    },
  ]);

  // Course 2: Web Development Basics
  const [webCourse] = await db.insert(coursesTable).values({
    title: "Web Development Basics",
    description: "Learn the fundamentals of web development with HTML, CSS, and JavaScript. Build real websites from scratch.",
    language: "javascript",
    difficulty: "beginner",
    imageUrl: "/images/course-js.png",
    totalLessons: 9,
    estimatedHours: 3,
    xpReward: 400,
    isPublished: true,
  }).returning();

  // Module: HTML Basics
  const [webMod1] = await db.insert(modulesTable).values({
    courseId: webCourse.id,
    title: "HTML Fundamentals",
    description: "Structure web content with HTML",
    orderIndex: 0,
  }).returning();

  const [webTheory1] = await db.insert(lessonsTable).values({
    moduleId: webMod1.id,
    title: "Introduction to HTML",
    type: "theory",
    orderIndex: 0,
    xpReward: 10,
    estimatedMinutes: 6,
    content: `# Introduction to HTML

**HTML** (HyperText Markup Language) is the standard language for creating web pages. It describes the structure of a web page using **tags**.

## Basic HTML Structure

\`\`\`html
<!DOCTYPE html>
<html>
  <head>
    <title>My First Page</title>
  </head>
  <body>
    <h1>Hello, World!</h1>
    <p>This is my first web page.</p>
  </body>
</html>
\`\`\`

## Common HTML Tags

| Tag | Purpose |
|-----|---------|
| \`<h1>\` to \`<h6>\` | Headings |
| \`<p>\` | Paragraph |
| \`<a>\` | Link |
| \`<img>\` | Image |
| \`<div>\` | Division/container |
| \`<span>\` | Inline container |
| \`<ul>\`, \`<li>\` | Unordered list |
| \`<ol>\`, \`<li>\` | Ordered list |

## Links

\`\`\`html
<a href="https://example.com">Click here!</a>
<a href="/about">About us</a>
\`\`\`

## Images

\`\`\`html
<img src="photo.jpg" alt="Description of image">
\`\`\`

The \`alt\` attribute provides alternative text for screen readers and when images fail to load.`,
  }).returning();

  const [webQuiz1] = await db.insert(lessonsTable).values({
    moduleId: webMod1.id,
    title: "HTML Basics Quiz",
    type: "quiz",
    orderIndex: 1,
    xpReward: 15,
    estimatedMinutes: 5,
  }).returning();

  const [wq1] = await db.insert(quizQuestionsTable).values({
    lessonId: webQuiz1.id,
    question: "What does HTML stand for?",
    explanation: "HTML stands for HyperText Markup Language.",
    orderIndex: 0,
  }).returning();

  await db.insert(quizOptionsTable).values([
    { questionId: wq1.id, text: "HyperText Markup Language", isCorrect: true, orderIndex: 0 },
    { questionId: wq1.id, text: "High Text Machine Language", isCorrect: false, orderIndex: 1 },
    { questionId: wq1.id, text: "Home Tool Markup Language", isCorrect: false, orderIndex: 2 },
    { questionId: wq1.id, text: "HyperText Making Language", isCorrect: false, orderIndex: 3 },
  ]);

  const [wq2] = await db.insert(quizQuestionsTable).values({
    lessonId: webQuiz1.id,
    question: "Which tag creates the largest heading?",
    explanation: "h1 creates the largest heading. h6 creates the smallest.",
    orderIndex: 1,
  }).returning();

  await db.insert(quizOptionsTable).values([
    { questionId: wq2.id, text: "<h1>", isCorrect: true, orderIndex: 0 },
    { questionId: wq2.id, text: "<h6>", isCorrect: false, orderIndex: 1 },
    { questionId: wq2.id, text: "<head>", isCorrect: false, orderIndex: 2 },
    { questionId: wq2.id, text: "<big>", isCorrect: false, orderIndex: 3 },
  ]);

  const [webChallenge1] = await db.insert(lessonsTable).values({
    moduleId: webMod1.id,
    title: "Build a Simple Page",
    type: "challenge",
    orderIndex: 2,
    xpReward: 25,
    estimatedMinutes: 15,
  }).returning();

  console.log("✓ Courses, modules, and lessons seeded");
  console.log("Seeding complete! 🎉");
}

seed().then(() => process.exit(0)).catch(console.error);
