import { ProgrammingLanguage } from "../db/models/interview-room";

export const STARTER_CODE_TEMPLATES: Record<ProgrammingLanguage, string> = {
  typescript: `/**
 * Pairzen Collaborative Coding Workspace
 * Language: TypeScript
 *
 * Problem: Two Sum
 * Given an array of integers nums and an integer target, return indices
 * of the two numbers such that they add up to target.
 */

function twoSum(nums: number[], target: number): number[] {
  const map = new Map<number, number>();
  
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement)!, i];
    }
    map.set(nums[i], i);
  }
  
  return [];
}

// Example test case:
const nums = [2, 7, 11, 15];
const target = 9;
console.log("Result:", twoSum(nums, target));
`,

  javascript: `/**
 * Pairzen Collaborative Coding Workspace
 * Language: JavaScript (Node.js)
 *
 * Problem: Two Sum
 */

function twoSum(nums, target) {
  const map = new Map();
  
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  
  return [];
}

const nums = [2, 7, 11, 15];
const target = 9;
console.log("Result:", twoSum(nums, target));
`,

  python: `"""
Pairzen Collaborative Coding Workspace
Language: Python 3

Problem: Two Sum
Given an array of integers nums and an integer target, return indices
of the two numbers such that they add up to target.
"""

from typing import List

def two_sum(nums: List[int], target: int) -> List[int]:
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []

if __name__ == "__main__":
    nums = [2, 7, 11, 15]
    target = 9
    print("Result:", two_sum(nums, target))
`,

  java: `/**
 * Pairzen Collaborative Coding Workspace
 * Language: Java
 */

import java.util.HashMap;
import java.util.Map;
import java.util.Arrays;

public class Solution {
    public static int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (map.containsKey(complement)) {
                return new int[] { map.get(complement), i };
            }
            map.put(nums[i], i);
        }
        return new int[0];
    }

    public static void main(String[] args) {
        int[] nums = { 2, 7, 11, 15 };
        int target = 9;
        System.out.println("Result: " + Arrays.toString(twoSum(nums, target)));
    }
}
`,

  cpp: `/**
 * Pairzen Collaborative Coding Workspace
 * Language: C++
 */

#include <iostream>
#include <vector>
#include <unordered_map>

std::vector<int> twoSum(const std::vector<int>& nums, int target) {
    std::unordered_map<int, int> map;
    for (int i = 0; i < nums.size(); ++i) {
        int complement = target - nums[i];
        if (map.count(complement)) {
            return { map[complement], i };
        }
        map[nums[i]] = i;
    }
    return {};
}

int main() {
    std::vector<int> nums = {2, 7, 11, 15};
    int target = 9;
    auto result = twoSum(nums, target);
    std::cout << "Result: [" << result[0] << ", " << result[1] << "]" << std::endl;
    return 0;
}
`,

  go: `// Pairzen Collaborative Coding Workspace
// Language: Go

package main

import "fmt"

func twoSum(nums []int, target int) []int {
	seen := make(map[int]int)
	for i, num := range nums {
		complement := target - num
		if idx, ok := seen[complement]; ok {
			return []int{idx, i}
		}
		seen[num] = i
	}
	return nil
}

func main() {
	nums := []int{2, 7, 11, 15}
	target := 9
	result := twoSum(nums, target)
	fmt.Printf("Result: %v\\n", result)
}
`,

  rust: `// Pairzen Collaborative Coding Workspace
// Language: Rust

use std::collections::HashMap;

fn two_sum(nums: &[i32], target: i32) -> Option<(usize, usize)> {
    let mut seen = HashMap::new();
    for (i, &num) in nums.iter().enumerate() {
        let complement = target - num;
        if let Some(&prev_idx) = seen.get(&complement) {
            return Some((prev_idx, i));
        }
        seen.insert(num, i);
    }
    None
}

fn main() {
    let nums = vec![2, 7, 11, 15];
    let target = 9;
    match two_sum(&nums, target) {
        Some((i, j)) => println!("Result: indices [{}, {}]", i, j),
        None => println!("No solution found"),
    }
}
`,
};

export function getStarterCode(language: ProgrammingLanguage): string {
  return STARTER_CODE_TEMPLATES[language] || STARTER_CODE_TEMPLATES.typescript;
}
