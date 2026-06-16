const problemDatabase = {
    "Two Sum": {
        difficulty: "Easy",
        timeLimit: 15 * 60,
        targetTime: "O(N)",
        targetSpace: "O(N)",
        companies: ["Amazon", "Google", "Apple", "Microsoft", "Adobe", "Bloomberg", "Uber"],
        hints: [
            "A brute force solution using nested loops is O(N²). How can we avoid checking every pair?",
            "What if we keep a record of the numbers we've seen so far as we iterate through the array?",
            "Try using a Hash Map (Dictionary). Think about what the 'key' should be to find your answer quickly.",
            "If you are at current_number, you need to find (target - current_number). Check if that difference is already in your Hash Map!"
        ],
        edgeCases: [
            "Negative numbers: [-1, -2, -3, -4], target = -8",
            "Duplicate values: [3, 3], target = 6",
            "Zeroes: [0, 4, 3, 0], target = 0"
        ]
    },
    "Add Two Numbers": {
        difficulty: "Medium",
        timeLimit: 35 * 60, // 35 minutes
        targetTime: "O(max(M, N))",
        targetSpace: "O(max(M, N))",
        companies: ["Microsoft", "Amazon", "Bloomberg", "Meta", "TCS", "Infosys"],
        hints: [
            "You are adding numbers just like you do on paper, digit by digit, from right to left.",
            "Since the linked lists are already in reverse order, the heads represent the least significant digits. This makes it easier!",
            "Don't forget to keep track of the 'carry' when the sum of two digits exceeds 9.",
            "What happens if one linked list is longer than the other? Make sure your loop handles null nodes gracefully."
        ],
        edgeCases: [
            "Lists of different lengths: l1 = [9,9,9,9], l2 = [9,9]",
            "A sum that creates an extra final carry: l1 = [5], l2 = [5] (Output: [0, 1])",
            "Zeroes: l1 = [0], l2 = [0]"
        ]
    }
};