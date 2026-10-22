import { Problem, ITestCase } from "../db/models/problem";
import { connectToDatabase } from "../db/connect";
import { STARTER_CODE_TEMPLATES } from "../collab/starter-templates";

export interface SeedProblemDefinition {
  title: string;
  slug: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  supportedLanguages: string[];
  starterCode: Record<string, string>;
  constraints: string[];
  testCases: ITestCase[];
}

export const SEED_PROBLEMS: SeedProblemDefinition[] = [
  {
    title: "Two Sum",
    slug: "two-sum",
    description: `Given an array of integers \`nums\` and an integer \`target\`, return *indices of the two numbers such that they add up to \`target\`*.

You may assume that each input would have ***exactly one solution***, and you may not use the *same* element twice.

You can return the answer in any order.`,
    difficulty: "easy",
    supportedLanguages: ["typescript", "javascript", "python", "java", "cpp", "go", "rust"],
    starterCode: STARTER_CODE_TEMPLATES,
    constraints: [
      "2 <= nums.length <= 10^4",
      "-10^9 <= nums[i] <= 10^9",
      "-10^9 <= target <= 10^9",
      "Only one valid answer exists.",
    ],
    testCases: [
      {
        id: "tc_ts_1",
        input: "nums = [2,7,11,15], target = 9",
        expectedOutput: "[0, 1]",
        isHidden: false,
        explanation: "Because nums[0] + nums[1] == 9, we return [0, 1].",
        order: 1,
      },
      {
        id: "tc_ts_2",
        input: "nums = [3,2,4], target = 6",
        expectedOutput: "[1, 2]",
        isHidden: false,
        explanation: "Because nums[1] + nums[2] == 6, we return [1, 2].",
        order: 2,
      },
      {
        id: "tc_ts_3",
        input: "nums = [3,3], target = 6",
        expectedOutput: "[0, 1]",
        isHidden: false,
        order: 3,
      },
      // Hidden test cases
      {
        id: "tc_ts_4_hidden",
        input: "nums = [1,5,8,12,19], target = 20",
        expectedOutput: "[0, 4]",
        isHidden: true,
        order: 4,
      },
      {
        id: "tc_ts_5_hidden",
        input: "nums = [-3,4,3,90], target = 0",
        expectedOutput: "[0, 2]",
        isHidden: true,
        order: 5,
      },
    ],
  },
  {
    title: "Valid Palindrome",
    slug: "valid-palindrome",
    description: `A phrase is a **palindrome** if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward. Alphanumeric characters include letters and numbers.

Given a string \`s\`, return \`true\` *if it is a palindrome, or* \`false\` *otherwise*.`,
    difficulty: "easy",
    supportedLanguages: ["typescript", "javascript", "python", "java", "cpp", "go", "rust"],
    starterCode: {
      typescript: `function isPalindrome(s: string): boolean {\n  const clean = s.toLowerCase().replace(/[^a-z0-9]/g, "");\n  return clean === clean.split("").reverse().join("");\n}\n\nconsole.log(isPalindrome("A man, a plan, a canal: Panama"));\n`,
      javascript: `function isPalindrome(s) {\n  const clean = s.toLowerCase().replace(/[^a-z0-9]/g, "");\n  return clean === clean.split("").reverse().join("");\n}\n\nconsole.log(isPalindrome("A man, a plan, a canal: Panama"));\n`,
      python: `def is_palindrome(s: str) -> bool:\n    clean = [c.lower() for c in s if c.isalnum()]\n    return clean == clean[::-1]\n\nprint(is_palindrome("A man, a plan, a canal: Panama"))\n`,
      java: `public class Solution {\n    public static boolean isPalindrome(String s) {\n        String clean = s.toLowerCase().replaceAll("[^a-z0-9]", "");\n        return clean.equals(new StringBuilder(clean).reverse().toString());\n    }\n    public static void main(String[] args) {\n        System.out.println(isPalindrome("A man, a plan, a canal: Panama"));\n    }\n}\n`,
      cpp: `#include <iostream>\n#include <string>\n#include <cctype>\n\nbool isPalindrome(std::string s) {\n    std::string clean = "";\n    for (char c : s) if (isalnum(c)) clean += tolower(c);\n    int l = 0, r = clean.size() - 1;\n    while (l < r) if (clean[l++] != clean[r--]) return false;\n    return true;\n}\n\nint main() {\n    std::cout << (isPalindrome("A man, a plan, a canal: Panama") ? "true" : "false") << std::endl;\n    return 0;\n}\n`,
      go: `package main\n\nimport (\n\t"fmt"\n\t"strings"\n\t"unicode"\n)\n\nfunc isPalindrome(s string) bool {\n\tvar b strings.Builder\n\tfor _, r := range strings.ToLower(s) {\n\t\tif unicode.IsLetter(r) || unicode.IsDigit(r) {\n\t\t\tb.WriteRune(r)\n\t\t}\n\t}\n\tclean := b.String()\n\tfor i := 0; i < len(clean)/2; i++ {\n\t\tif clean[i] != clean[len(clean)-1-i] {\n\t\t\treturn false\n\t\t}\n\t}\n\treturn true\n}\n\nfunc main() {\n\tfmt.Println(isPalindrome("A man, a plan, a canal: Panama"))\n}\n`,
      rust: `fn is_palindrome(s: &str) -> bool {\n    let clean: Vec<char> = s.chars().filter(|c| c.is_alphanumeric()).map(|c| c.to_ascii_lowercase()).collect();\n    clean.iter().eq(clean.iter().rev())\n}\n\nfn main() {\n    println!("{}", is_palindrome("A man, a plan, a canal: Panama"));\n}\n`,
    },
    constraints: [
      "1 <= s.length <= 2 * 10^5",
      "s consists only of printable ASCII characters.",
    ],
    testCases: [
      {
        id: "tc_vp_1",
        input: 's = "A man, a plan, a canal: Panama"',
        expectedOutput: "true",
        isHidden: false,
        explanation: '"amanaplanacanalpanama" is a palindrome.',
        order: 1,
      },
      {
        id: "tc_vp_2",
        input: 's = "race a car"',
        expectedOutput: "false",
        isHidden: false,
        explanation: '"raceacar" is not a palindrome.',
        order: 2,
      },
      {
        id: "tc_vp_3",
        input: 's = " "',
        expectedOutput: "true",
        isHidden: false,
        explanation: 's is an empty string "" after removing non-alphanumeric characters, which is an empty palindrome.',
        order: 3,
      },
      // Hidden test cases
      {
        id: "tc_vp_4_hidden",
        input: 's = "0P"',
        expectedOutput: "false",
        isHidden: true,
        order: 4,
      },
      {
        id: "tc_vp_5_hidden",
        input: 's = "ab_a"',
        expectedOutput: "true",
        isHidden: true,
        order: 5,
      },
    ],
  },
  {
    title: "Reverse String",
    slug: "reverse-string",
    description: `Write a function that reverses a string. The input string is given as an array of characters \`s\`.

You must do this by modifying the input array in-place with \`O(1)\` extra memory.`,
    difficulty: "easy",
    supportedLanguages: ["typescript", "javascript", "python", "java", "cpp", "go", "rust"],
    starterCode: {
      typescript: `function reverseString(s: string): string {\n  return s.split("").reverse().join("");\n}\n\nconsole.log(reverseString("hello"));\n`,
      javascript: `function reverseString(s) {\n  return s.split("").reverse().join("");\n}\n\nconsole.log(reverseString("hello"));\n`,
      python: `def reverse_string(s: str) -> str:\n    return s[::-1]\n\nprint(reverse_string("hello"))\n`,
      java: `public class Solution {\n    public static String reverseString(String s) {\n        return new StringBuilder(s).reverse().toString();\n    }\n    public static void main(String[] args) {\n        System.out.println(reverseString("hello"));\n    }\n}\n`,
      cpp: `#include <iostream>\n#include <string>\n#include <algorithm>\n\nstd::string reverseString(std::string s) {\n    std::reverse(s.begin(), s.end());\n    return s;\n}\n\nint main() {\n    std::cout << reverseString("hello") << std::endl;\n    return 0;\n}\n`,
      go: `package main\n\nimport "fmt"\n\nfunc reverseString(s string) string {\n\trunes := []rune(s)\n\tfor i, j := 0, len(runes)-1; i < j; i, j = i+1, j-1 {\n\t\trunes[i], runes[j] = runes[j], runes[i]\n\t}\n\treturn string(runes)\n}\n\nfunc main() {\n\tfmt.Println(reverseString("hello"))\n}\n`,
      rust: `fn reverse_string(s: &str) -> String {\n    s.chars().rev().collect()\n}\n\nfn main() {\n    println!("{}", reverse_string("hello"));\n}\n`,
    },
    constraints: [
      "1 <= s.length <= 10^5",
      "s consists of printable ASCII characters.",
    ],
    testCases: [
      {
        id: "tc_rs_1",
        input: 's = "hello"',
        expectedOutput: "olleh",
        isHidden: false,
        order: 1,
      },
      {
        id: "tc_rs_2",
        input: 's = "Hannah"',
        expectedOutput: "hannaH",
        isHidden: false,
        order: 2,
      },
      // Hidden test cases
      {
        id: "tc_rs_3_hidden",
        input: 's = "Pairzen"',
        expectedOutput: "nezriaP",
        isHidden: true,
        order: 3,
      },
      {
        id: "tc_rs_4_hidden",
        input: 's = "12345"',
        expectedOutput: "54321",
        isHidden: true,
        order: 4,
      },
    ],
  },
];

/**
 * Ensures seed problems are populated in MongoDB.
 * Returns the default problem (Two Sum) for interview rooms.
 */
export async function ensureSeedProblems() {
  await connectToDatabase();

  for (const seed of SEED_PROBLEMS) {
    const existing = await Problem.findOne({ slug: seed.slug });
    if (!existing) {
      await Problem.create({
        ...seed,
        starterCode: seed.starterCode,
      });
    }
  }

  return await Problem.findOne({ slug: "two-sum" });
}
