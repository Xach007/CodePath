import type { TFunction } from "i18next";
import i18n from "@/lib/i18n";

type LessonLike = {
  title?: string | null;
  content?: string | null;
};

const lessonTitleRuByTitle: Record<string, string> = {
  "what is python?": "Что такое Python?",
  "python basics quiz": "Квиз по основам Python",
  "your first program": "Первая программа",
  "variables in python": "Переменные в Python",
  "variables quiz": "Квиз по переменным",
  "variable calculator": "Калькулятор переменных",
  "if statements": "Условия if",
  "control flow quiz": "Квиз по управлению потоком",
  "grade calculator": "Калькулятор оценки",
  "for and while loops": "Циклы for и while",
  "loops quiz": "Квиз по циклам",
  "sum of numbers": "Сумма чисел",
  "defining functions": "Определение функций",
  "functions quiz": "Квиз по функциям",
  "factorial function": "Функция факториала",
  "lists and dictionaries": "Списки и словари",
  "data structures quiz": "Квиз по структурам данных",
  "word counter": "Счетчик слов",
  "introduction to javascript": "Введение в JavaScript",
  "js basics quiz": "Квиз по основам JS",
  "hello javascript": "Привет, JavaScript",
  "functions in javascript": "Функции в JavaScript",
  "functions & arrays quiz": "Квиз по функциям и массивам",
  "array sum": "Сумма массива",
  "objects and conditionals": "Объекты и условия",
  "objects quiz": "Квиз по объектам",
  "fizzbuzz": "FizzBuzz",
  "loops in javascript": "Циклы в JavaScript",
  "reverse string": "Разворот строки",
  "working with strings": "Работа со строками",
  "strings quiz": "Квиз по строкам",
  "capitalize words": "Слова с заглавной буквы",
  "try-catch and modern js": "Try-catch и современный JS",
  "modern js quiz": "Квиз по современному JS",
  "palindrome checker": "Проверка палиндрома",
  "introduction to html": "Введение в HTML",
  "html basics quiz": "Квиз по основам HTML",
  "build a basic page": "Создание простой страницы",
  "links and images": "Ссылки и изображения",
  "links & images quiz": "Квиз по ссылкам и изображениям",
  "navigation menu": "Навигационное меню",
  "building forms": "Создание форм",
  "forms quiz": "Квиз по формам",
  "contact form": "Контактная форма",
  "semantic elements": "Семантические элементы",
  "semantic html quiz": "Квиз по семантическому HTML",
  "semantic page layout": "Семантическая структура страницы",
  "html tables": "HTML-таблицы",
  "tables quiz": "Квиз по таблицам",
  "student table": "Таблица студентов",
  "introduction to css": "Введение в CSS",
  "css basics quiz": "Квиз по основам CSS",
  "style a card": "Стилизация карточки",
  "box model explained": "Блочная модель",
  "box model quiz": "Квиз по блочной модели",
  "box model layout": "Макет с блочной моделью",
  "flexbox essentials": "Основы Flexbox",
  "flexbox quiz": "Квиз по Flexbox",
  "flexbox navbar": "Навигация на Flexbox",
  "css grid layout": "Макет CSS Grid",
  "css grid quiz": "Квиз по CSS Grid",
  "grid gallery": "Галерея на Grid",
  "media queries": "Медиазапросы",
  "responsive quiz": "Квиз по адаптивности",
  "responsive layout": "Адаптивный макет",
  "introduction to sql": "Введение в SQL",
  "sql basics quiz": "Квиз по основам SQL",
  "basic select": "Базовый SELECT",
  "order by and aggregates": "ORDER BY и агрегация",
  "aggregation quiz": "Квиз по агрегации",
  "aggregate query": "Запрос с агрегацией",
  "sql joins": "SQL JOIN",
  "joins quiz": "Квиз по JOIN",
  "join query": "Запрос JOIN",
  "insert, update, delete": "INSERT, UPDATE, DELETE",
  "dml quiz": "Квиз по DML",
  "data changes": "Изменение данных",
  "subqueries and functions": "Подзапросы и функции",
  "advanced sql quiz": "Квиз по продвинутому SQL",
  "advanced query": "Продвинутый запрос",
  "introduction to c++": "Введение в C++",
  "c++ basics quiz": "Квиз по основам C++",
  "variables & data types": "Переменные и типы данных",
  "if/else statements": "Условия if/else",
  "loops in c++": "Циклы в C++",
  "switch statement": "Оператор switch",
  "function overloading": "Перегрузка функций",
  "references & pointers intro": "Введение в ссылки и указатели",
  "arrays": "Массивы",
  "strings in c++": "Строки в C++",
  "arrays & strings quiz": "Квиз по массивам и строкам",
  "classes & objects": "Классы и объекты",
  "constructors & destructors": "Конструкторы и деструкторы",
  "inheritance": "Наследование",
  "oop quiz": "Квиз по ООП",
  "stl containers overview": "Обзор контейнеров STL",
  "introduction to java": "Введение в Java",
  "java basics quiz": "Квиз по основам Java",
  "variables & types": "Переменные и типы",
  "if/else & switch": "If/else и switch",
  "loops": "Циклы",
  "exception handling": "Обработка исключений",
  "defining methods": "Определение методов",
  "scope & static": "Область видимости и static",
  "methods quiz": "Квиз по методам",
  "inheritance & interfaces": "Наследование и интерфейсы",
  "abstract classes": "Абстрактные классы",
  "arraylist": "ArrayList",
  "hashmap": "HashMap",
  "collections quiz": "Квиз по коллекциям",
  "generics basics": "Основы generics",
  "iterators & streams": "Итераторы и streams",
};

const markdownRuByFingerprint: Record<string, string> = {
  b8206f: String.raw`# Что такое Python?

Python - высокоуровневый интерпретируемый язык программирования, созданный Гвидо ван Россумом в 1991 году.

## Почему Python?

- Простой синтаксис, похожий на обычный английский
- Подходит для веб-разработки, анализа данных, ИИ и автоматизации
- Имеет огромную экосистему библиотек

## Вывод на экран

~~~python
print("Hello, World!")
print("Python is awesome!")
print(42)
~~~

Каждый вызов print() выводит текст с новой строки.

## Комментарии

~~~python
# Это однострочный комментарий
print("This runs")  # Комментарий в строке
~~~`,
  "1ekjb6v": String.raw`# Переменные в Python

Переменная хранит значение. Создаётся она через знак =.

~~~python
name = "Alice"
age = 25
height = 5.7
is_student = True
~~~

## Типы данных

| Тип | Пример |
|---|---|
| str | "Hello" |
| int | 42 |
| float | 3.14 |
| bool | True/False |

## Операции со строками

~~~python
first = "John"
last = "Doe"
full = first + " " + last
print(f"Hello, {first}!")
~~~`,
  "1nrohx3": String.raw`# Условия if

Условия позволяют выполнять код только тогда, когда выражение истинно.

~~~python
age = 18
if age >= 18:
    print("You can vote!")
~~~

## If-elif-else

~~~python
score = 85
if score >= 90:
    print("Grade: A")
elif score >= 80:
    print("Grade: B")
elif score >= 70:
    print("Grade: C")
else:
    print("Grade: F")
~~~

Операторы сравнения: ==, !=, >, <, >=, <=.

Логические операторы: and, or, not.`,
  vt0rmh: String.raw`# Циклы в Python

Циклы повторяют действия несколько раз.

## for

~~~python
for i in range(5):
    print(i)  # 0, 1, 2, 3, 4

fruits = ["apple", "banana", "cherry"]
for fruit in fruits:
    print(fruit)
~~~

## while

~~~python
count = 0
while count < 5:
    print(count)
    count += 1
~~~

range(5) даёт числа 0-4, а break выходит из цикла. continue пропускает текущий шаг.`,
  "69u3da": String.raw`# Функции

Функции - это переиспользуемые блоки кода.

~~~python
def greet(name):
    return f"Hello, {name}!"

result = greet("Alice")
print(result)
~~~

Параметры передают данные в функцию, а return возвращает результат.

~~~python
def add(a, b):
    return a + b

def is_even(n):
    return n % 2 == 0
~~~`,
  "14iijp3": String.raw`# Списки и словари

## Списки

~~~python
fruits = ["apple", "banana", "cherry"]
print(fruits[0])
fruits.append("date")
print(len(fruits))
~~~

Список хранит значения по порядку. Индексация начинается с 0.

## Словари

~~~python
person = {"name": "Alice", "age": 25}
print(person["name"])
person["city"] = "NYC"
~~~

Словарь хранит пары ключ-значение. По нему можно проходить циклом через items().`,
  "1yg3wt4": String.raw`# Введение в JavaScript

JavaScript - язык программирования веба. Он работает в браузерах и на сервере через Node.js.

## Вывод

~~~javascript
console.log("Hello, World!");
console.log(42);
console.log(true);
~~~

## Переменные

~~~javascript
let name = "Alice";     // можно изменить
const age = 25;         // нельзя присвоить заново
var old = "avoid this"; // старый способ
~~~

Основные типы: string, number, boolean, undefined и null.`,
  "1l0ebbd": String.raw`# Функции и массивы

~~~javascript
function greet(name) {
  return "Hello, " + name + "!";
}
console.log(greet("Alice"));
~~~

Стрелочные функции короче:

~~~javascript
const add = (a, b) => a + b;
const square = x => x * x;
~~~

Массив хранит набор значений:

~~~javascript
const fruits = ["apple", "banana", "cherry"];
console.log(fruits[0]);
fruits.push("date");
~~~`,
  vyde9e: String.raw`# Объекты и условия

Объект хранит свойства и методы.

~~~javascript
const person = {
  name: "Alice",
  age: 25,
  greet() {
    return "Hi, I'm " + this.name;
  }
};
~~~

Условия работают через if, else if и else. Тернарный оператор condition ? a : b удобен для коротких решений.`,
  fsr3wi: String.raw`# Циклы в JavaScript

~~~javascript
for (let i = 0; i < 5; i++) {
  console.log(i);
}

const colors = ["red", "green", "blue"];
for (const color of colors) {
  console.log(color);
}
~~~

while выполняется, пока условие истинно. forEach вызывает функцию для каждого элемента массива.`,
  ztq3dr: String.raw`# Методы строк

Строки в JavaScript имеют готовые методы:

~~~javascript
const str = "Hello, World!";

str.length
str.toUpperCase()
str.toLowerCase()
str.includes("World")
str.indexOf("World")
str.slice(0, 5)
str.replace("World", "JS")
str.split(", ")
str.trim()
~~~

Эти методы помогают искать, изменять и разделять текст.`,
  jck4mv: String.raw`# Ошибки и современный JavaScript

try-catch позволяет обработать ошибку и не уронить программу.

~~~javascript
try {
  JSON.parse("invalid");
} catch (error) {
  console.log("Error:", error.message);
} finally {
  console.log("Always runs");
}
~~~

Оператор spread (...) копирует элементы массивов и объектов. Optional chaining (?.) безопасно читает вложенные свойства.`,
  "3lbnrh": String.raw`# Введение в HTML

HTML описывает структуру веб-страницы.

~~~html
<!DOCTYPE html>
<html>
<head>
  <title>My Page</title>
</head>
<body>
  <h1>Hello!</h1>
  <p>Welcome to my page.</p>
</body>
</html>
~~~

Частые теги: h1-h6 для заголовков, p для абзаца, a для ссылки, img для изображения, div и span для контейнеров, ul/ol/li для списков.`,
  "18lm3ld": String.raw`# Ссылки и изображения

~~~html
<a href="https://example.com">Visit Example</a>
<a href="/about">About Us</a>
~~~

Изображение добавляется тегом img. Атрибут alt нужен для доступности.

~~~html
<img src="photo.jpg" alt="A beautiful sunset">
~~~

Списки бывают маркированные ul и нумерованные ol.`,
  jxszkk: String.raw`# HTML-формы

Формы собирают данные пользователя.

~~~html
<form action="/submit" method="post">
  <label for="name">Name:</label>
  <input type="text" id="name" name="name" required>

  <label for="email">Email:</label>
  <input type="email" id="email" name="email">

  <button type="submit">Send</button>
</form>
~~~

input может быть text, email, password, number, checkbox, radio или submit.`,
  "1gaid7g": String.raw`# Семантический HTML

Семантические теги описывают смысл блока:

~~~html
<header>Site header</header>
<nav>Navigation</nav>
<main>
  <article>
    <h2>Article Title</h2>
    <p>Content...</p>
  </article>
</main>
<footer>Site footer</footer>
~~~

Такая разметка улучшает доступность, SEO и читаемость кода.`,
  "1djokys": String.raw`# HTML-таблицы

~~~html
<table>
  <thead>
    <tr>
      <th>Name</th>
      <th>Age</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Alice</td>
      <td>25</td>
    </tr>
  </tbody>
</table>
~~~

table - контейнер таблицы, tr - строка, th - заголовочная ячейка, td - обычная ячейка.`,
  "104v9pf": String.raw`# Введение в CSS

CSS отвечает за внешний вид страницы.

~~~css
selector {
  property: value;
}
~~~

Селекторы выбирают элементы:

~~~css
h1 { color: blue; }
.card { background: white; }
#header { height: 60px; }
~~~

Цвета можно задавать словами, hex, rgb() или hsl().`,
  qrpdxb: String.raw`# Блочная модель

Каждый HTML-элемент можно представить как коробку: content, padding, border и margin.

~~~css
.box {
  width: 200px;
  height: 100px;
  padding: 20px;
  border: 2px solid black;
  margin: 10px;
  box-sizing: border-box;
}
~~~

border-box включает padding и border в итоговую ширину элемента.`,
  "9215lo": String.raw`# Flexbox

Flexbox помогает выстраивать элементы в одну строку или колонку.

~~~css
.container {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}
~~~

justify-content управляет главной осью, align-items - поперечной.`,
  "1yoe67x": String.raw`# CSS Grid

Grid создаёт двумерные макеты: строки и колонки.

~~~css
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
~~~

1fr означает одну долю свободного пространства. Grid удобен для галерей, карточек и сеток.`,
  "19ek3ns": String.raw`# Медиазапросы

Медиазапросы включают стили для разных размеров экрана.

~~~css
.container {
  width: 100%;
}

@media (min-width: 768px) {
  .container {
    max-width: 720px;
  }
}
~~~

Подход mobile-first сначала пишет стили для телефона, а затем добавляет правила для больших экранов.`,
  s68ndp: String.raw`# Введение в SQL

SQL используется для запросов к базам данных.

~~~sql
SELECT name, email
FROM users
WHERE age > 18;
~~~

SELECT выбирает столбцы, FROM указывает таблицу, WHERE фильтрует строки.`,
  yumkn0: String.raw`# ORDER BY и агрегация

ORDER BY сортирует результат.

~~~sql
SELECT name, age
FROM users
ORDER BY age DESC;
~~~

Агрегатные функции считают итоги:

~~~sql
SELECT department, COUNT(*)
FROM employees
GROUP BY department;
~~~`,
  osrqc1: String.raw`# SQL JOIN

JOIN объединяет данные из нескольких таблиц.

~~~sql
SELECT students.name, grades.score
FROM students
INNER JOIN grades ON students.id = grades.student_id;
~~~

INNER JOIN возвращает только совпадающие строки. LEFT JOIN сохраняет все строки из левой таблицы.`,
  "1451cce": String.raw`# INSERT, UPDATE, DELETE

INSERT добавляет строки:

~~~sql
INSERT INTO users (name, email, age)
VALUES ('Alice', 'alice@example.com', 25);
~~~

UPDATE изменяет строки, DELETE удаляет. Почти всегда используй WHERE, чтобы не изменить всю таблицу.`,
  "1olmkwg": String.raw`# Подзапросы и функции

Подзапрос - это запрос внутри другого запроса.

~~~sql
SELECT name
FROM users
WHERE age > (SELECT AVG(age) FROM users);
~~~

AS задаёт временное имя столбцу или таблице. CASE WHEN добавляет условную логику в SQL.`,
  emgsu8: String.raw`# Введение в C++

C++ - быстрый язык общего назначения для системного программирования, игр и высоконагруженных приложений.

~~~cpp
#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    return 0;
}
~~~

Программа начинается с main(). cout выводит данные, endl добавляет перенос строки.`,
  "1qybnqc": String.raw`# Переменные и типы в C++

C++ строго типизирован: тип переменной указывается явно.

~~~cpp
int age = 25;
double price = 19.99;
char grade = 'A';
bool active = true;
const int maxUsers = 100;
~~~

const делает значение неизменяемым после создания.`,
  "1xw9tuy": String.raw`# If/else в C++

~~~cpp
int score = 75;

if (score >= 90) {
    cout << "A";
} else if (score >= 70) {
    cout << "C";
} else {
    cout << "F";
}
~~~

Логические операторы: && для AND, || для OR, ! для NOT.`,
  tradt0: String.raw`# Циклы в C++

~~~cpp
for (int i = 0; i < 5; i++) {
    cout << i << endl;
}

int count = 0;
while (count < 5) {
    cout << count << endl;
    count++;
}
~~~

do-while сначала выполняет тело цикла, а потом проверяет условие.`,
  "1fcu0ll": String.raw`# Оператор switch

switch удобен, когда нужно выбрать действие по одному значению.

~~~cpp
int day = 2;
switch (day) {
  case 1:
    cout << "Monday";
    break;
  case 2:
    cout << "Tuesday";
    break;
  default:
    cout << "Other";
}
~~~

break останавливает выполнение текущей ветки.`,
  lw3p4s: String.raw`# Функции в C++

Функция имеет тип возвращаемого значения, имя и параметры.

~~~cpp
int add(int a, int b) {
    return a + b;
}

void greet() {
    cout << "Hello";
}
~~~

void означает, что функция ничего не возвращает.`,
  "30uvgc": String.raw`# Перегрузка функций

В C++ можно создать несколько функций с одним именем, если параметры отличаются.

~~~cpp
int add(int a, int b) {
    return a + b;
}

double add(double a, double b) {
    return a + b;
}
~~~

Компилятор выбирает нужную версию по аргументам.`,
  "1y55i74": String.raw`# Ссылки и указатели

Ссылка даёт другое имя существующей переменной. Указатель хранит адрес.

~~~cpp
int x = 10;
int& ref = x;
int* ptr = &x;

cout << ref;
cout << *ptr;
~~~

Оператор & берёт адрес, а * разыменовывает указатель.`,
  "12i10zi": String.raw`# Массивы

Массив хранит несколько значений одного типа.

~~~cpp
int nums[3] = {1, 2, 3};
cout << nums[0];
~~~

Индексация начинается с 0. Для динамических коллекций чаще используют vector.`,
  "7mpnfm": String.raw`# Строки в C++

std::string хранит текст.

~~~cpp
#include <string>

string name = "Alice";
cout << name.length();
cout << name.substr(0, 3);
~~~

length() и size() возвращают длину строки.`,
  "1cz90d7": String.raw`# Классы и объекты

Класс описывает данные и поведение объекта.

~~~cpp
class User {
private:
    string name;
public:
    User(string n) : name(n) {}
    void greet() {
        cout << "Hello";
    }
};
~~~

private скрывает детали внутри класса, public открывает доступ снаружи.`,
  "1pesauy": String.raw`# Конструкторы и деструкторы

Конструктор запускается при создании объекта, деструктор - при уничтожении.

~~~cpp
class File {
public:
    File() {
        cout << "open";
    }
    ~File() {
        cout << "close";
    }
};
~~~

Это помогает управлять ресурсами.`,
  p84qor: String.raw`# Наследование

Наследование позволяет классу получить свойства и методы другого класса.

~~~cpp
class Animal {
public:
    void eat() {}
};

class Dog : public Animal {
public:
    void bark() {}
};
~~~

Виртуальные функции помогают переопределять поведение в дочерних классах.`,
  "1h5q1yo": String.raw`# Контейнеры STL

STL даёт готовые структуры данных.

~~~cpp
vector<int> nums = {1, 2, 3};
map<string, int> scores;
set<int> uniqueNumbers;
~~~

vector похож на динамический массив, map хранит ключ-значение, set хранит уникальные значения.`,
  "171k5wg": String.raw`# Введение в Java

Java - объектно-ориентированный язык, который запускается на JVM.

~~~java
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}
~~~

main - точка входа программы. System.out.println() выводит текст.`,
  "1qzlans": String.raw`# Переменные и типы в Java

Java строго типизирована.

~~~java
int age = 25;
double price = 19.99;
boolean active = true;
String name = "Alice";
~~~

String - класс, а не примитивный тип. Приведение типов может обрезать дробную часть.`,
  ozyq8k: String.raw`# If/else и switch в Java

~~~java
if (score >= 90) {
    System.out.println("A");
} else if (score >= 70) {
    System.out.println("C");
} else {
    System.out.println("F");
}
~~~

switch выбирает ветку по значению. В современных версиях Java можно использовать стрелочный синтаксис.`,
  kek0yb: String.raw`# Циклы в Java

~~~java
for (int i = 0; i < 5; i++) {
    System.out.println(i);
}

for (String name : names) {
    System.out.println(name);
}
~~~

for-each удобен для перебора массивов и коллекций.`,
  gj57cu: String.raw`# Обработка исключений

try-catch позволяет обработать ошибку.

~~~java
try {
    int x = 10 / 0;
} catch (ArithmeticException e) {
    System.out.println(e.getMessage());
} finally {
    System.out.println("Done");
}
~~~

finally выполняется независимо от результата.`,
  "1uc0vtf": String.raw`# Методы в Java

Метод - функция внутри класса.

~~~java
public static int add(int a, int b) {
    return a + b;
}
~~~

static означает, что метод принадлежит классу, а не конкретному объекту.`,
  "1np81mj": String.raw`# Область видимости и static

Область видимости определяет, где переменная доступна.

~~~java
class Counter {
    static int total = 0;
    int value = 0;
}
~~~

static-поле общее для всего класса, обычное поле принадлежит объекту.`,
  "1h9kty": String.raw`# Наследование и интерфейсы

extends используется для наследования класса, implements - для интерфейсов.

~~~java
class Dog extends Animal implements Runnable {
    public void run() {}
}
~~~

Класс может реализовать несколько интерфейсов.`,
  qhty8r: String.raw`# Абстрактные классы

Абстрактный класс может содержать методы без реализации.

~~~java
abstract class Shape {
    abstract double area();
}
~~~

Наследники обязаны реализовать абстрактные методы.`,
  "4p7tgl": String.raw`# ArrayList

ArrayList - динамический список.

~~~java
ArrayList<String> names = new ArrayList<>();
names.add("Alice");
names.add("Bob");
System.out.println(names.get(0));
~~~

Он удобен, когда размер коллекции заранее неизвестен.`,
  "1oi0l68": String.raw`# HashMap

HashMap хранит пары ключ-значение.

~~~java
HashMap<String, Integer> scores = new HashMap<>();
scores.put("Alice", 95);
System.out.println(scores.get("Alice"));
~~~

Ключи должны быть уникальными.`,
  jkod98: String.raw`# Основы generics

Generics задают тип элементов коллекции или класса.

~~~java
ArrayList<String> names = new ArrayList<>();
~~~

Так компилятор заранее проверяет типы и помогает избежать ошибок.`,
  "1s4y4tr": String.raw`# Итераторы и streams

Iterator вручную проходит по коллекции, а Stream позволяет обрабатывать данные цепочкой операций.

~~~java
names.stream()
    .filter(name -> name.length() > 3)
    .forEach(System.out::println);
~~~

Streams удобны для фильтрации, преобразования и агрегации данных.`,
  "1de0ttu": String.raw`## Первая программа на Python

Выведи ровно:
~~~
Hello, World!
I love Python!
~~~`,
  "7ik732": String.raw`## Калькулятор переменных

Даны a = 10 и b = 3. Выведи:
~~~
Sum: 13
Difference: 7
Product: 30
~~~`,
  "10q8owk": String.raw`## Калькулятор оценки

Дан score = 75. Выведи буквенную оценку:
- 90+: Grade: A
- 80-89: Grade: B
- 70-79: Grade: C
- 60-69: Grade: D
- Ниже 60: Grade: F`,
  "12a58zz": String.raw`## Сумма чисел

Используй цикл, чтобы посчитать сумму чисел от 1 до 10 и вывести результат.

Ожидаемый вывод: 55`,
  "1or650f": String.raw`## Функция факториала

Напиши функцию factorial(n), которая возвращает факториал n.

Затем выведи factorial(5). Результат должен быть 120.

Факториал: 5! = 5 x 4 x 3 x 2 x 1 = 120`,
  "1m5eyjv": String.raw`## Счетчик слов

Дан список words = ["hello", "world", "hello", "python", "world", "hello"]. Посчитай, сколько раз встречается каждое слово, и выведи в формате:
~~~
hello: 3
world: 2
python: 1
~~~`,
  u41jp7: String.raw`## Привет, JavaScript

Выведи ровно:
~~~
Hello, JavaScript!
I am learning to code!
~~~`,
  "1okf68r": String.raw`## Сумма массива

Напиши функцию sumArray(arr), которая возвращает сумму всех чисел в массиве.

Затем выведи sumArray([1, 2, 3, 4, 5]). Результат должен быть 15.`,
  "19ontak": String.raw`## FizzBuzz

Выведи числа от 1 до 15. Но:
- Для кратных 3 выведи Fizz
- Для кратных 5 выведи Buzz
- Для кратных и 3, и 5 выведи FizzBuzz`,
  "10om1vj": String.raw`## Разворот строки

Напиши функцию reverseString(str), которая разворачивает строку.

Выведи reverseString("hello"). Результат должен быть olleh.`,
  "119g6s2": String.raw`## Слова с заглавной буквы

Напиши функцию capitalizeWords(str), которая делает первую букву каждого слова заглавной.

Выведи capitalizeWords("hello world"). Результат должен быть Hello World.`,
  "13tddjn": String.raw`## Проверка палиндрома

Напиши функцию isPalindrome(str), которая проверяет, читается ли строка одинаково слева направо и справа налево без учета регистра.

Выведи:
~~~
true
false
true
~~~
Для "racecar", "hello", "Madam".`,
  qrlo7d: String.raw`## Создание простой страницы

Напиши HTML, который содержит:
- Заголовок h1
- Абзац p

В коде должны быть теги h1 и p.`,
  jd1ije: String.raw`## Навигационное меню

Создай маркированный список с 3 ссылками внутри элементов списка:
- Home (href="/")
- About (href="/about")
- Contact (href="/contact")

Используй теги ul, li и a.`,
  x1hdht: String.raw`## Контактная форма

Создай форму с:
- Текстовым полем для имени
- Email-полем
- textarea для сообщения
- Кнопкой отправки

В коде должны быть form, input, textarea и button.`,
  luuq94: String.raw`## Семантическая структура страницы

Создай страницу с семантическими элементами:
- header с заголовком
- nav со ссылками
- main с article
- footer с текстом copyright`,
  "6ktrag": String.raw`## Таблица студентов

Создай таблицу с колонками Name, Grade, Score и минимум 2 строками данных.

Используй table, thead, tbody, tr, th и td.`,
  e986cv: String.raw`## Стилизация карточки

Напиши CSS, который содержит:
- background-color
- border-radius
- padding

Оформи класс .card этими свойствами.`,
  "1kday1r": String.raw`## Макет с блочной моделью

Оформи .container:
- width: 300px
- padding: 20px
- margin: 0 auto
- border: 1px solid
- box-sizing: border-box`,
  bpqm81: String.raw`## Навигация на Flexbox

Создай .navbar с display: flex, justify-content: space-between и align-items: center.

Добавь gap между элементами.`,
  "1rt5qaq": String.raw`## Галерея на Grid

Создай .gallery с display: grid, 3 колонками одинаковой ширины и gap: 16px.`,
  "1ouc8f8": String.raw`## Адаптивный макет

Напиши mobile-first CSS: для .container сначала мобильные стили, затем медиазапрос от 768px.

На больших экранах установи max-width: 720px.`,
  "1p9ta52": String.raw`## Базовый SELECT

Напиши SQL-запрос, который выбирает столбцы name и email из таблицы users, где age больше 18.

Используй SELECT, FROM и WHERE.`,
  "1gope2d": String.raw`## Запрос с агрегацией

Напиши SQL-запрос, который выбирает department и количество сотрудников в каждом отделе из таблицы employees.

Используй GROUP BY и ORDER BY по количеству по убыванию.`,
  qg3rm6: String.raw`## Запрос JOIN

Напиши запрос, который объединяет таблицы students и grades.

Выбери students.name и grades.score через INNER JOIN, где students.id = grades.student_id.`,
  "15bkmbf": String.raw`## Изменение данных

Напиши INSERT-запрос, чтобы добавить нового пользователя:
- name: 'Alice'
- email: 'alice@example.com'
- age: 25

Вставь запись в таблицу users.`,
  "5akdjy": String.raw`## Продвинутый запрос

Напиши запрос, который выбирает пользователей с возрастом выше среднего.

Используй подзапрос для AVG(age) и сравнение в WHERE.`,
};

Object.assign(markdownRuByFingerprint, {
  drdark: markdownRuByFingerprint.b8206f,
  "1t1cafk": markdownRuByFingerprint["1ekjb6v"],
  tlxksq: markdownRuByFingerprint["1nrohx3"],
  "1izrju0": markdownRuByFingerprint.vt0rmh,
  "1xdaojo": markdownRuByFingerprint["69u3da"],
  "8h4mt5": markdownRuByFingerprint["14iijp3"],
  "1fj3gyb": markdownRuByFingerprint["1yg3wt4"],
  "12zpv6b": markdownRuByFingerprint["1l0ebbd"],
  l30xwi: markdownRuByFingerprint.vyde9e,
  "1vip5zb": markdownRuByFingerprint.fsr3wi,
  f517mz: markdownRuByFingerprint.ztq3dr,
  nl9sqw: markdownRuByFingerprint.jck4mv,
  "11cyxyy": markdownRuByFingerprint["3lbnrh"],
  "7yeaa6": markdownRuByFingerprint["18lm3ld"],
  adhruk: markdownRuByFingerprint.jxszkk,
  xnci3m: markdownRuByFingerprint["1gaid7g"],
  hbdtvp: markdownRuByFingerprint["1djokys"],
  zd9dy3: markdownRuByFingerprint["104v9pf"],
  "15rfu09": markdownRuByFingerprint.qrpdxb,
  "1gqi9hn": markdownRuByFingerprint["9215lo"],
  "1llky6w": markdownRuByFingerprint["1yoe67x"],
  "12nfw5u": markdownRuByFingerprint["19ek3ns"],
  "1im5mb3": markdownRuByFingerprint.s68ndp,
  "15gbxng": markdownRuByFingerprint.yumkn0,
  "1a19tvn": markdownRuByFingerprint.osrqc1,
  "3gbyvp": markdownRuByFingerprint["1451cce"],
  "1ig4uft": markdownRuByFingerprint["1olmkwg"],
  "8rkxuy": markdownRuByFingerprint.emgsu8,
  "1o40wet": markdownRuByFingerprint["1qybnqc"],
  "1s5dy5f": markdownRuByFingerprint["1xw9tuy"],
  "1ytfjo8": markdownRuByFingerprint.tradt0,
  "6j2v9y": markdownRuByFingerprint["1fcu0ll"],
  zrgekh: markdownRuByFingerprint.lw3p4s,
  hpb0a7: markdownRuByFingerprint["30uvgc"],
  "1yy51ch": markdownRuByFingerprint["1y55i74"],
  "1woru3t": markdownRuByFingerprint["12i10zi"],
  "1k9csnt": markdownRuByFingerprint["7mpnfm"],
  h2s7dj: markdownRuByFingerprint["1cz90d7"],
  "1e5l6zz": markdownRuByFingerprint["1pesauy"],
  kkd7ac: markdownRuByFingerprint.p84qor,
  xmu01c: markdownRuByFingerprint["1h5q1yo"],
  eef6hm: markdownRuByFingerprint["171k5wg"],
  "147njws": markdownRuByFingerprint["1qzlans"],
  "190ujvw": markdownRuByFingerprint.ozyq8k,
  "17fxeeq": markdownRuByFingerprint.kek0yb,
  "1rxw93v": markdownRuByFingerprint.gj57cu,
  jmw7y6: markdownRuByFingerprint["1uc0vtf"],
  hbg045: markdownRuByFingerprint["1np81mj"],
  u5ah2e: String.raw`# Классы и объекты

Класс описывает объект: его поля и методы.

~~~java
class User {
    private String name;

    User(String name) {
        this.name = name;
    }

    void greet() {
        System.out.println("Hello");
    }
}
~~~

private закрывает поле внутри класса, а методы управляют доступом к данным.`,
  "37584j": markdownRuByFingerprint["1h9kty"],
  s96czr: markdownRuByFingerprint.qhty8r,
  evn7i2: markdownRuByFingerprint["4p7tgl"],
  c3mp2: markdownRuByFingerprint["1oi0l68"],
  c2i0n: markdownRuByFingerprint.jkod98,
  "14yflxv": markdownRuByFingerprint["1s4y4tr"],
});

const shortTextRuBySource: Record<string, string> = {
  "Use print() for each line": "Используй print() для каждой строки",
  "Use + - * operators": "Используй операторы +, - и *",
  "Use elif for multiple conditions": "Используй elif для нескольких условий",
  "Check from highest to lowest": "Проверяй от большего порога к меньшему",
  "Use range(1, 11)": "Используй range(1, 11)",
  "Initialize total = 0, then add each number": "Создай total = 0, затем прибавляй каждое число",
  "Use a loop from 1 to n": "Используй цикл от 1 до n",
  "Multiply result by each number": "Умножай результат на каждое число",
  "Use a dictionary to count": "Используй словарь для подсчета",
  "Loop through words and increment counts": "Пройди циклом по словам и увеличивай счетчики",
  "Use console.log() for each line": "Используй console.log() для каждой строки",
  "Use reduce() or a for loop": "Используй reduce() или цикл for",
  "Use % (modulo) to check divisibility": "Используй % для проверки делимости",
  "Check divisible by both 3 AND 5 first": "Сначала проверяй делимость и на 3, и на 5",
  "Split into array, reverse, join back": "Разбей строку на массив, разверни и собери обратно",
  "Split by spaces, capitalize each word, join back": "Разбей по пробелам, измени каждое слово и собери обратно",
  "Convert to lowercase first": "Сначала приведи строку к нижнему регистру",
  "Compare with reversed version": "Сравни с развернутой версией",
  "Use <h1>Title</h1> for the heading": "Для заголовка используй <h1>Title</h1>",
  "Use <p>Text</p> for the paragraph": "Для абзаца используй <p>Text</p>",
  "Wrap each <a> inside a <li>": "Оберни каждую ссылку <a> в <li>",
  "Use <ul> for unordered list": "Используй <ul> для маркированного списка",
  "Use type=\"text\" for name, type=\"email\" for email": "Для имени используй type=\"text\", для email - type=\"email\"",
  "Use header, nav, main, article, footer": "Используй header, nav, main, article и footer",
  "Use <thead> for headers, <tbody> for data": "Для заголовков используй <thead>, для данных - <tbody>",
  "Use background-color for the background": "Для фона используй background-color",
  "border-radius creates rounded corners": "border-radius скругляет углы",
  "margin: 0 auto centers horizontally": "margin: 0 auto центрирует по горизонтали",
  "Start with display: flex": "Начни с display: flex",
  "space-between pushes items to edges": "space-between разводит элементы к краям",
  "Use grid-template-columns: 1fr 1fr 1fr": "Используй grid-template-columns: 1fr 1fr 1fr",
  "Use @media (min-width: 768px) { }": "Используй @media (min-width: 768px) { }",
  "SELECT column1, column2 FROM table WHERE condition": "Шаблон: SELECT column1, column2 FROM table WHERE condition",
  "SELECT department, COUNT(*) FROM employees GROUP BY department": "Шаблон: SELECT department, COUNT(*) FROM employees GROUP BY department",
  "Use INNER JOIN ... ON to connect tables": "Используй INNER JOIN ... ON, чтобы связать таблицы",
  "INSERT INTO table (col1, col2) VALUES (val1, val2)": "Шаблон: INSERT INTO table (col1, col2) VALUES (val1, val2)",
  "Use WHERE age > (SELECT AVG(age) FROM users)": "Используй WHERE age > (SELECT AVG(age) FROM users)",
  "Who created Python?": "Кто создал Python?",
  "Which function displays output in Python?": "Какая функция выводит данные в Python?",
  "What symbol starts a comment in Python?": "Какой символ начинает комментарий в Python?",
  "What is the type of \"Hello\"?": "Какой тип у \"Hello\"?",
  "Which is a valid variable name?": "Какое имя переменной правильное?",
  "What does type(42) return?": "Что вернёт type(42)?",
  "What keyword is used for 'else if' in Python?": "Какое ключевое слово используется для 'else if' в Python?",
  "What does 'and' do in Python?": "Что делает 'and' в Python?",
  "What operator checks equality?": "Какой оператор проверяет равенство?",
  "What does range(3) produce?": "Что создаёт range(3)?",
  "What does 'break' do in a loop?": "Что делает 'break' в цикле?",
  "Which loop runs while a condition is True?": "Какой цикл выполняется, пока условие истинно?",
  "What keyword defines a function?": "Какое ключевое слово объявляет функцию?",
  "What does 'return' do?": "Что делает 'return'?",
  "What happens if a function has no return statement?": "Что произойдёт, если у функции нет return?",
  "How do you access the first item in a list?": "Как получить первый элемент списка?",
  "How do you add an item to a list?": "Как добавить элемент в список?",
  "What type of brackets do dictionaries use?": "Какие скобки используют словари?",
  "Which keyword declares a constant variable?": "Какое ключевое слово объявляет константу?",
  "How do you output text in JavaScript?": "Как вывести текст в JavaScript?",
  "What are template literals wrapped in?": "В какие символы заключают template literals?",
  "What is the correct arrow function syntax?": "Какой синтаксис стрелочной функции правильный?",
  "Which method adds an item to the end of an array?": "Какой метод добавляет элемент в конец массива?",
  "What does .map() do?": "Что делает .map()?",
  "Creates a new array with transformed elements": "Создаёт новый массив с преобразованными элементами",
  "Filters elements": "Фильтрует элементы",
  "Sorts the array": "Сортирует массив",
  "Removes elements": "Удаляет элементы",
  "How do you access an object property?": "Как получить свойство объекта?",
  "What does the ternary operator do?": "Что делает тернарный оператор?",
  "What does destructuring do?": "Что делает деструктуризация?",
  "Which loop iterates over array values directly?": "Какой цикл проходит прямо по значениям массива?",
  "What is i++ equivalent to?": "Чему эквивалентно i++?",
  "How many times does for(let i=0; i<3; i++) run?": "Сколько раз выполнится for(let i=0; i<3; i++)?",
  "What does \"hello\".toUpperCase() return?": "Что вернёт \"hello\".toUpperCase()?",
  "Which method checks if a string contains a substring?": "Какой метод проверяет, содержит ли строка подстроку?",
  "What does \"a,b,c\".split(\",\") return?": "Что вернёт \"a,b,c\".split(\",\")?",
  "What block catches errors?": "Какой блок перехватывает ошибки?",
  "What does the spread operator (...) do with arrays?": "Что делает spread-оператор (...) с массивами?",
  "What does ?. (optional chaining) return for missing properties?": "Что возвращает ?. при отсутствующем свойстве?",
  "What does HTML stand for?": "Как расшифровывается HTML?",
  "Which tag creates the largest heading?": "Какой тег создаёт самый крупный заголовок?",
  "Which tag creates a paragraph?": "Какой тег создаёт абзац?",
  "Which attribute specifies a link's URL?": "Какой атрибут задаёт URL ссылки?",
  "What is the alt attribute for?": "Для чего нужен атрибут alt?",
  "Which creates a bullet-point list?": "Что создаёт маркированный список?",
  "Which tag creates a form?": "Какой тег создаёт форму?",
  "Which input type hides typed text?": "Какой тип input скрывает вводимый текст?",
  "What does the 'required' attribute do?": "Что делает атрибут required?",
  "Which element represents the main content?": "Какой элемент обозначает основной контент?",
  "What is <nav> used for?": "Для чего используется <nav>?",
  "Why use semantic HTML?": "Зачем использовать семантический HTML?",
  "Which tag defines a table row?": "Какой тег задаёт строку таблицы?",
  "What's the difference between <th> and <td>?": "В чём разница между <th> и <td>?",
  "Which wraps the table body?": "Какой тег оборачивает тело таблицы?",
  "What does CSS stand for?": "Как расшифровывается CSS?",
  "How do you select elements by class?": "Как выбрать элементы по классу?",
  "Which property changes text color?": "Какое свойство меняет цвет текста?",
  "What is between content and border?": "Что находится между контентом и рамкой?",
  "What does box-sizing: border-box do?": "Что делает box-sizing: border-box?",
  "Which property adds space outside an element?": "Какое свойство добавляет пространство снаружи элемента?",
  "Which property enables flexbox?": "Какое свойство включает flexbox?",
  "What does justify-content control?": "Чем управляет justify-content?",
  "How do you center items both horizontally and vertically?": "Как центрировать элементы по горизонтали и вертикали?",
  "Which property enables CSS Grid?": "Какое свойство включает CSS Grid?",
  "What does 1fr mean?": "Что означает 1fr?",
  "What property adds space between grid items?": "Какое свойство добавляет расстояние между элементами grid?",
  "Which CSS feature enables responsive design?": "Какая возможность CSS делает дизайн адаптивным?",
  "What does 'vw' stand for?": "Что означает 'vw'?",
  "What approach designs for mobile first?": "Какой подход сначала проектирует под мобильные экраны?",
  "What does SQL stand for?": "Как расшифровывается SQL?",
  "Which statement retrieves data?": "Какая команда получает данные?",
  "What does WHERE do?": "Что делает WHERE?",
  "Which function counts rows?": "Какая функция считает строки?",
  "What sorts results in descending order?": "Что сортирует результаты по убыванию?",
  "What's the difference between WHERE and HAVING?": "В чём разница между WHERE и HAVING?",
  "Which JOIN returns only matching rows from both tables?": "Какой JOIN возвращает только совпадающие строки из обеих таблиц?",
  "What keyword connects two tables in a JOIN?": "Какое ключевое слово связывает таблицы в JOIN?",
  "LEFT JOIN includes all rows from which table?": "Из какой таблицы LEFT JOIN включает все строки?",
  "Which statement adds new rows?": "Какая команда добавляет новые строки?",
  "What happens if you UPDATE without WHERE?": "Что будет, если выполнить UPDATE без WHERE?",
  "How do you remove rows from a table?": "Как удалить строки из таблицы?",
  "What is a subquery?": "Что такое подзапрос?",
  "What does AS do in SQL?": "Что делает AS в SQL?",
  "What does CASE...WHEN do?": "Что делает CASE...WHEN?",
  "Who created C++?": "Кто создал C++?",
  "Which header is used for input/output in C++?": "Какой заголовок используется для ввода/вывода в C++?",
  "What does 'endl' do?": "Что делает 'endl'?",
  "Which type stores decimal numbers in C++?": "Какой тип хранит дробные числа в C++?",
  "How do you declare a constant in C++?": "Как объявить константу в C++?",
  "Which loop guarantees at least one execution?": "Какой цикл гарантирует хотя бы одно выполнение?",
  "What is the logical AND operator in C++?": "Какой оператор означает логическое AND в C++?",
  "What does 'void' mean as a return type?": "Что означает 'void' как тип возврата?",
  "What is function overloading?": "Что такое перегрузка функций?",
  "What is the index of the first element in a C++ array?": "Какой индекс у первого элемента массива в C++?",
  "How do you get the length of a std::string?": "Как получить длину std::string?",
  "What keyword makes a class member accessible only within the class?": "Какое ключевое слово делает член класса доступным только внутри класса?",
  "What is a pure virtual function?": "Что такое чисто виртуальная функция?",
  "Who created Java?": "Кто создал Java?",
  "What is the entry point of a Java program?": "Какая точка входа у Java-программы?",
  "What does JVM stand for?": "Как расшифровывается JVM?",
  "Is String a primitive type in Java?": "String в Java является примитивным типом?",
  "What happens with: int x = (int) 3.9;": "Что произойдёт с: int x = (int) 3.9;",
  "Which Java loop is best for iterating over an array?": "Какой цикл Java лучше подходит для перебора массива?",
  "What keyword means a method belongs to the class rather than an instance?": "Какое ключевое слово означает, что метод принадлежит классу, а не объекту?",
  "Can two methods have the same name in Java?": "Могут ли два метода иметь одно имя в Java?",
  "What keyword is used for inheritance in Java?": "Какое ключевое слово используется для наследования в Java?",
  "Can a Java class implement multiple interfaces?": "Может ли Java-класс реализовать несколько интерфейсов?",
  "What is ArrayList<String> an example of?": "Примером чего является ArrayList<String>?",
  "Which collection stores key-value pairs?": "Какая коллекция хранит пары ключ-значение?",
  "Python was created by Guido van Rossum in 1991.": "Python создал Гвидо ван Россум в 1991 году.",
  "print() is the primary output function.": "print() - основная функция вывода.",
  "# is used for single-line comments.": "# используется для однострочных комментариев.",
  "Text in quotes is a string (str).": "Текст в кавычках - это строка (str).",
  "Variable names use letters, numbers, underscores; must start with letter/underscore.": "Имена переменных могут содержать буквы, цифры и подчёркивания, но должны начинаться с буквы или подчёркивания.",
  "42 is a whole number, so its type is int.": "42 - целое число, поэтому его тип int.",
  "Python uses 'elif' for additional conditions.": "Python использует 'elif' для дополнительных условий.",
  "'and' returns True only if both conditions are True.": "'and' возвращает True только если оба условия истинны.",
  "== checks if two values are equal. = is assignment.": "== проверяет равенство двух значений, а = выполняет присваивание.",
  "range(3) generates 0, 1, 2.": "range(3) создаёт 0, 1, 2.",
  "break immediately exits the loop.": "break сразу выходит из цикла.",
  "while loops continue as long as their condition is True.": "while выполняется, пока условие истинно.",
  "'def' is used to define functions in Python.": "'def' используется для объявления функций в Python.",
  "'return' sends a value back from a function.": "'return' возвращает значение из функции.",
  "Functions without return implicitly return None.": "Функции без return неявно возвращают None.",
  "Python lists use 0-based indexing.": "В списках Python индексация начинается с 0.",
  "append() adds an item to the end of a list.": "append() добавляет элемент в конец списка.",
  "Dictionaries use curly braces {}.": "Словари используют фигурные скобки {}.",
  "const declares a variable that cannot be reassigned.": "const объявляет переменную, которой нельзя присвоить новое значение.",
  "console.log() is the standard output function.": "console.log() - стандартная функция вывода.",
  "Template literals use backticks (`) for string interpolation.": "Template literals используют обратные кавычки (`) для подстановки значений в строку.",
  "Arrow functions use => after parameters.": "Стрелочные функции используют => после параметров.",
  "push() adds items to the end of an array.": "push() добавляет элементы в конец массива.",
  "map() creates a new array by transforming each element.": "map() создаёт новый массив, преобразуя каждый элемент.",
  "Dot notation (obj.prop) or bracket notation (obj['prop']).": "Можно использовать точку (obj.prop) или квадратные скобки (obj['prop']).",
  "condition ? valueIfTrue : valueIfFalse is a shorthand for if-else.": "condition ? valueIfTrue : valueIfFalse - короткая форма if-else.",
  "Destructuring extracts values from objects/arrays into variables.": "Деструктуризация извлекает значения из объектов или массивов в переменные.",
  "for...of iterates over iterable values.": "for...of проходит по значениям итерируемого объекта.",
  "i++ is shorthand for i = i + 1.": "i++ - короткая запись i = i + 1.",
  "It runs for i=0, i=1, i=2, so 3 times.": "Цикл выполнится для i=0, i=1 и i=2, то есть 3 раза.",
  "toUpperCase() converts all characters to uppercase.": "toUpperCase() переводит все символы в верхний регистр.",
  "includes() returns true/false.": "includes() возвращает true или false.",
  "split() divides a string into an array.": "split() разбивает строку на массив.",
  "catch block handles errors thrown in the try block.": "Блок catch обрабатывает ошибки из блока try.",
  "Spread expands array elements.": "Spread раскрывает элементы массива.",
  "Optional chaining returns undefined instead of throwing an error.": "Optional chaining возвращает undefined вместо ошибки.",
  "HTML = HyperText Markup Language.": "HTML = HyperText Markup Language.",
  "h1 is the largest, h6 is the smallest.": "h1 - самый крупный заголовок, h6 - самый маленький.",
  "<p> is the paragraph tag.": "<p> - тег абзаца.",
  "href (hypertext reference) specifies the URL.": "href задаёт URL ссылки.",
  "alt provides alternative text for accessibility.": "alt задаёт альтернативный текст для доступности.",
  "<ul> creates an unordered (bullet-point) list.": "<ul> создаёт маркированный список.",
  "<form> wraps all form elements.": "<form> оборачивает элементы формы.",
  "type=\"password\" masks input characters.": "type=\"password\" скрывает вводимые символы.",
  "required prevents form submission without filling the field.": "required не даёт отправить форму без заполнения поля.",
  "<main> holds the primary content of the page.": "<main> содержит основной контент страницы.",
  "<nav> contains navigation links.": "<nav> содержит навигационные ссылки.",
  "Semantic HTML improves accessibility, SEO, and code readability.": "Семантический HTML улучшает доступность, SEO и читаемость кода.",
  "<tr> defines a row in a table.": "<tr> задаёт строку таблицы.",
  "<th> is a header cell (bold), <td> is a data cell.": "<th> - заголовочная ячейка, <td> - ячейка данных.",
  "<tbody> wraps the body rows of a table.": "<tbody> оборачивает строки тела таблицы.",
  "CSS = Cascading Style Sheets.": "CSS = Cascading Style Sheets.",
  "A period (.) prefix selects by class name.": "Точка (.) перед именем выбирает элементы по классу.",
  "The color property sets text color.": "Свойство color задаёт цвет текста.",
  "Padding is the space between content and border.": "Padding - пространство между контентом и рамкой.",
  "border-box includes padding and border in the element's width.": "border-box включает padding и border в ширину элемента.",
  "Margin is the space outside the border.": "Margin - пространство снаружи рамки.",
  "display: flex enables flexbox on a container.": "display: flex включает flexbox у контейнера.",
  "justify-content aligns items along the main axis.": "justify-content выравнивает элементы по главной оси.",
  "Use justify-content and align-items both set to center.": "Используй justify-content: center и align-items: center.",
  "display: grid enables grid layout.": "display: grid включает grid-макет.",
  "1fr = 1 fraction of available space.": "1fr - одна доля доступного пространства.",
  "gap adds space between grid items.": "gap добавляет расстояние между элементами grid.",
  "Media queries apply styles based on screen size.": "Медиазапросы применяют стили в зависимости от размера экрана.",
  "vw = viewport width, 1vw = 1% of viewport width.": "vw означает ширину viewport, 1vw = 1% ширины viewport.",
  "Mobile-first uses min-width media queries to add styles for larger screens.": "Mobile-first использует min-width медиазапросы для больших экранов.",
  "SQL = Structured Query Language.": "SQL = Structured Query Language.",
  "SELECT retrieves data from a database.": "SELECT получает данные из базы.",
  "WHERE filters rows based on conditions.": "WHERE фильтрует строки по условиям.",
  "COUNT(*) counts all rows, COUNT(column) counts non-null values.": "COUNT(*) считает все строки, COUNT(column) считает непустые значения.",
  "ORDER BY column DESC sorts from high to low.": "ORDER BY column DESC сортирует от большего к меньшему.",
  "WHERE filters rows before grouping, HAVING filters after.": "WHERE фильтрует строки до группировки, HAVING - после.",
  "INNER JOIN returns only rows with matches in both tables.": "INNER JOIN возвращает только строки с совпадениями в обеих таблицах.",
  "ON specifies the join condition.": "ON задаёт условие соединения.",
  "LEFT JOIN includes all rows from the left (first) table.": "LEFT JOIN включает все строки из левой, первой таблицы.",
  "INSERT INTO adds new rows to a table.": "INSERT INTO добавляет новые строки в таблицу.",
  "Without WHERE, UPDATE changes ALL rows in the table.": "Без WHERE UPDATE изменит все строки таблицы.",
  "DELETE FROM table WHERE condition removes matching rows.": "DELETE FROM table WHERE condition удаляет подходящие строки.",
  "A subquery is a query inside another query.": "Подзапрос - это запрос внутри другого запроса.",
  "AS creates an alias (temporary name) for a column or table.": "AS создаёт алиас, временное имя столбца или таблицы.",
  "CASE adds conditional logic like if-else in SQL.": "CASE добавляет условную логику, похожую на if-else.",
  "C++ was created by Bjarne Stroustrup.": "C++ создал Бьёрн Страуструп.",
  "<iostream> provides cin and cout.": "<iostream> предоставляет cin и cout.",
  "endl inserts a newline and flushes the stream.": "endl добавляет новую строку и очищает поток.",
  "double (or float) stores decimal values.": "double или float хранит дробные значения.",
  "The const keyword makes a variable unchangeable.": "Ключевое слово const делает переменную неизменяемой.",
  "do-while always executes the body once before checking.": "do-while всегда выполняет тело один раз перед проверкой.",
  "&& is the logical AND operator.": "&& - оператор логического AND.",
  "void means the function doesn't return a value.": "void означает, что функция не возвращает значение.",
  "Overloading means multiple functions with the same name but different parameters.": "Перегрузка - это несколько функций с одним именем, но разными параметрами.",
  "C++ arrays are zero-indexed.": "В массивах C++ индексация начинается с 0.",
  ".length() or .size() returns string length.": ".length() или .size() возвращает длину строки.",
  "private restricts access to the class itself.": "private ограничивает доступ самим классом.",
  "A pure virtual function (= 0) has no implementation and must be overridden.": "Чисто виртуальная функция (= 0) не имеет реализации и должна быть переопределена.",
  "Java was created by James Gosling at Sun Microsystems.": "Java создал Джеймс Гослинг в Sun Microsystems.",
  "The main method is the entry point.": "Метод main - точка входа.",
  "JVM = Java Virtual Machine.": "JVM = Java Virtual Machine.",
  "String is a reference type (class), not a primitive.": "String - ссылочный тип, класс, а не примитив.",
  "Casting truncates (does not round).": "Приведение типа отбрасывает дробную часть, а не округляет.",
  "The for-each loop is designed for iterating collections and arrays.": "Цикл for-each создан для перебора коллекций и массивов.",
  "static methods belong to the class itself.": "static-методы принадлежат самому классу.",
  "Yes, through method overloading (different parameters).": "Да, через перегрузку методов с разными параметрами.",
  "extends is used for class inheritance.": "extends используется для наследования класса.",
  "Yes, a class can implement multiple interfaces.": "Да, класс может реализовать несколько интерфейсов.",
  "It uses generics to specify the element type.": "Это generics: они задают тип элементов.",
  "HashMap stores key-value pairs.": "HashMap хранит пары ключ-значение.",
};

function shouldUseRussian() {
  const language = i18n.resolvedLanguage || i18n.language || "ru";
  return language.toLowerCase().startsWith("ru");
}

function normalizeTitle(title: string | null | undefined) {
  return (title ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

function fingerprint(value: string) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

export function translateLessonTitle(_t: TFunction, lessonOrTitle: LessonLike | string | null | undefined) {
  const title = typeof lessonOrTitle === "string" ? lessonOrTitle : lessonOrTitle?.title;
  if (!title || !shouldUseRussian()) return title ?? "";
  return lessonTitleRuByTitle[normalizeTitle(title)] ?? title;
}

export function translateLessonMarkdown(value: string | null | undefined) {
  if (!value || !shouldUseRussian()) return value ?? "";
  return markdownRuByFingerprint[fingerprint(value)] ?? value;
}

export function translateLessonText(value: string | null | undefined) {
  if (!value || !shouldUseRussian()) return value ?? "";
  return shortTextRuBySource[value] ?? value;
}
