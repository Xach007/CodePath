import type { TFunction } from "i18next";

type CourseLike = {
  title?: string | null;
  description?: string | null;
};

const courseKeyByTitle: Record<string, string> = {
  "python fundamentals": "pythonFundamentals",
  "javascript essentials": "javascriptEssentials",
  "html fundamentals": "htmlFundamentals",
  "css styling mastery": "cssStylingMastery",
  "sql for beginners": "sqlForBeginners",
  "c++ programming": "cppProgramming",
  "java programming": "javaProgramming",
};

const moduleKeyByTitle: Record<string, string> = {
  "getting started with python": "gettingStartedWithPython",
  "variables and data types": "variablesAndDataTypes",
  "control flow": "controlFlow",
  "loops": "loops",
  "functions": "functions",
  "data structures": "dataStructures",
  "javascript basics": "javascriptBasics",
  "functions and arrays": "functionsAndArrays",
  "objects and control flow": "objectsAndControlFlow",
  "loops and iteration": "loopsAndIteration",
  "string methods": "stringMethods",
  "error handling & modern js": "errorHandlingModernJs",
  "html basics": "htmlBasics",
  "links, images & lists": "linksImagesLists",
  "html forms": "htmlForms",
  "semantic html": "semanticHtml",
  "tables and media": "tablesAndMedia",
  "css basics": "cssBasics",
  "the box model": "boxModel",
  "flexbox layout": "flexboxLayout",
  "css grid": "cssGrid",
  "responsive design": "responsiveDesign",
  "sql basics": "sqlBasics",
  "sorting and aggregation": "sortingAndAggregation",
  "join operations": "joinOperations",
  "data manipulation": "dataManipulation",
  "advanced queries": "advancedQueries",
  "getting started with c++": "gettingStartedWithCpp",
  "arrays & strings": "arraysAndStrings",
  "oop in c++": "oopInCpp",
  "java basics": "javaBasics",
  "methods & functions": "methodsAndFunctions",
  "oop in java": "oopInJava",
  "collections & generics": "collectionsAndGenerics",
};

function normalizeTitle(title: string | null | undefined) {
  return (title ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

function getCourseKey(title: string | null | undefined) {
  return courseKeyByTitle[normalizeTitle(title)];
}

function getModuleKey(title: string | null | undefined) {
  return moduleKeyByTitle[normalizeTitle(title)];
}

export function translateCourseTitle(t: TFunction, courseOrTitle: CourseLike | string | null | undefined) {
  const title = typeof courseOrTitle === "string" ? courseOrTitle : courseOrTitle?.title;
  const courseKey = getCourseKey(title);
  if (!courseKey) return title ?? "";
  return t(`courseContent.courses.${courseKey}.title`, { defaultValue: title ?? "" });
}

export function translateCourseDescription(t: TFunction, course: CourseLike | null | undefined) {
  const courseKey = getCourseKey(course?.title);
  if (!courseKey) return course?.description ?? "";
  return t(`courseContent.courses.${courseKey}.description`, { defaultValue: course?.description ?? "" });
}

export function translateModuleTitle(t: TFunction, moduleOrTitle: CourseLike | string | null | undefined) {
  const title = typeof moduleOrTitle === "string" ? moduleOrTitle : moduleOrTitle?.title;
  const moduleKey = getModuleKey(title);
  if (!moduleKey) return title ?? "";
  return t(`courseContent.modules.${moduleKey}.title`, { defaultValue: title ?? "" });
}

export function translateModuleDescription(t: TFunction, courseModule: CourseLike | null | undefined) {
  const moduleKey = getModuleKey(courseModule?.title);
  if (!moduleKey) return courseModule?.description ?? "";
  return t(`courseContent.modules.${moduleKey}.description`, { defaultValue: courseModule?.description ?? "" });
}
