const { OpenAI } = require('openai');
require('dotenv').config();

// Try Groq first (free and fast), fallback to OpenAI if available
const groqApiKey = process.env.GROQ_API_KEY;
const openaiApiKey = process.env.OPENAI_API_KEY;

let aiClient = null;
let usingGroq = false;

if (groqApiKey) {
  console.log('✅ Using Groq API (free and fast)');
  aiClient = new OpenAI({
    apiKey: groqApiKey,
    baseURL: 'https://api.groq.com/openai/v1'
  });
  usingGroq = true;
} else if (openaiApiKey && openaiApiKey !== 'your_openai_api_key_here') {
  console.log('✅ Using OpenAI API');
  aiClient = new OpenAI({
    apiKey: openaiApiKey
  });
  usingGroq = false;
} else {
  console.warn('⚠️  No valid API key found (GROQ_API_KEY or OPENAI_API_KEY)');
  console.warn('Using intelligent fallback responses.');
}

// Base system message optimized for conversational tone
const FRIENDLY_SYSTEM_MESSAGE = `You are a chill, friendly AI who loves casual conversation. When someone says "hello" or "hey", just respond naturally like a friend would - no need to immediately offer academic help or list STEM topics. You can chat about anything: movies, music, life, random thoughts, or yes, studies too if they want. Be conversational and relaxed. Don't be overly helpful or formal - just be a cool chat companion who happens to be smart.`;

/**
 * Get AI response for a given prompt
 * @param {string} prompt - The user's question or prompt
 * @param {Array} messageHistory - Previous messages for context
 * @param {string} systemMessage - Custom system message (optional)
 * @returns {Promise<string>} - The AI's response
 */
async function getAIResponse(prompt, messageHistory = [], systemMessage = FRIENDLY_SYSTEM_MESSAGE) {
  try {
    // If no valid API client is available, use fallback responses immediately
    if (!aiClient) {
      console.log('No valid API client found, using fallback response');
      return generateFallbackResponse(prompt);
    }

    const messages = [
      { role: 'system', content: systemMessage },
      ...messageHistory,
      { role: 'user', content: prompt }
    ];

    console.log('System message being sent:', systemMessage.substring(0, 100) + '...');
    console.log('User prompt:', prompt);

    try {
      const model = usingGroq ? 'llama3-70b-8192' : 'gpt-3.5-turbo';
      const response = await aiClient.chat.completions.create({
        model: model,
        messages: messages,
        temperature: 0.7,
        max_tokens: 500
      });

      return response.choices[0].message.content;
    } catch (apiError) {
      console.error('Error calling OpenAI API:', apiError);
      
      // Use fallback response for any API error
      console.log('Using fallback response due to API error');
      return generateFallbackResponse(prompt);
    }
  } catch (error) {
    console.error('Unexpected error in getAIResponse:', error);
    return generateFallbackResponse(prompt);
  }
}

/**
 * Generate a fallback response based on the prompt content
 * @param {string} prompt - The user's question
 * @returns {string} - A helpful fallback response
 */
function generateFallbackResponse(prompt) {
  const subject = prompt.toLowerCase();
  
  if (subject.includes('math') || subject.includes('equation') || subject.includes('solve') || subject.includes('calculate')) {
    return `I'd be happy to help with your math problem! For equations like this, I would:
1. Identify the type of equation
2. Apply the appropriate formula or method
3. Solve step-by-step
4. Verify the solution

For example, with a quadratic equation like ax² + bx + c = 0, I would use the quadratic formula: x = (-b ± √(b² - 4ac)) / 2a`;
  } 
  else if (subject.includes('physics') || subject.includes('newton') || subject.includes('motion') || subject.includes('force')) {
    return `Newton's laws of motion are fundamental principles in classical mechanics:

1. **First Law (Law of Inertia)**: An object at rest stays at rest, and an object in motion stays in motion with the same speed and direction, unless acted upon by an external force.

2. **Second Law**: The acceleration of an object is directly proportional to the net force acting on it and inversely proportional to its mass. **F = ma**.

3. **Third Law**: For every action, there is an equal and opposite reaction.`;
  }
  else if (subject.includes('2sum') || subject.includes('two sum')) {
    if (subject.includes('python')) {
      return `Here's the Two Sum algorithm in Python:

\`\`\`python
def two_sum(nums, target):
    """
    Find two numbers in array that add up to target
    Returns indices of the two numbers
    """
    # Hash map to store value -> index mapping
    num_map = {}
    
    for i, num in enumerate(nums):
        complement = target - num
        
        # Check if complement exists in hash map
        if complement in num_map:
            return [num_map[complement], i]
        
        # Store current number and its index
        num_map[num] = i
    
    return []  # No solution found

# Example usage
nums = [2, 7, 11, 15]
target = 9
result = two_sum(nums, target)
print(result)  # Output: [0, 1] (indices of 2 and 7)
\`\`\`

**Algorithm Explanation:**
1. **Hash Map Approach**: Use a dictionary to store numbers we've seen
2. **For each number**: Calculate what number we need (complement = target - current)
3. **Check if complement exists**: If yes, we found our pair!
4. **Store current number**: Add to hash map for future lookups

**Time Complexity**: O(n) - single pass through array
**Space Complexity**: O(n) - hash map storage`;
    } else {
      return `Here's the Two Sum algorithm in JavaScript:

\`\`\`javascript
function twoSum(nums, target) {
    const numMap = new Map();
    
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        
        if (numMap.has(complement)) {
            return [numMap.get(complement), i];
        }
        
        numMap.set(nums[i], i);
    }
    
    return [];
}

// Example
console.log(twoSum([2, 7, 11, 15], 9)); // [0, 1]
\`\`\`

**Logic**: Use hash map for O(n) time complexity.`;
    }
  }
  else if (subject.includes('reverse') && subject.includes('linked list')) {
    if (subject.includes('python')) {
      return `Here's how to reverse a linked list in Python:

\`\`\`python
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def reverse_linked_list(head):
    prev = None
    current = head
    
    while current:
        next_temp = current.next  # Store next node
        current.next = prev       # Reverse the link
        prev = current           # Move prev forward
        current = next_temp      # Move current forward
    
    return prev  # prev is now the new head
\`\`\`

**Logic Explanation:**
1. **Initialize pointers**: \`prev = None\`, \`current = head\`
2. **For each node**: Store the next node, reverse the current node's pointer to point to prev
3. **Move pointers**: Move prev and current one step forward
4. **Return**: When current becomes None, prev points to the new head

**Time Complexity**: O(n) - visit each node once
**Space Complexity**: O(1) - only use constant extra space`;
    } else {
      return `Here's how to reverse a linked list in JavaScript:

\`\`\`javascript
class ListNode {
    constructor(val = 0, next = null) {
        this.val = val;
        this.next = next;
    }
}

function reverseLinkedList(head) {
    let prev = null;
    let current = head;
    
    while (current) {
        const nextTemp = current.next;
        current.next = prev;
        prev = current;
        current = nextTemp;
    }
    
    return prev;
}
\`\`\`

**Logic**: Use three pointers to iteratively reverse the direction of each link.`;
    }
  }
  else if (subject.includes('fibonacci')) {
    return `Here's a JavaScript function to generate the Fibonacci sequence:

\`\`\`javascript
function fibonacci(n) {
  const sequence = [0, 1];
  
  for (let i = 2; i < n; i++) {
    sequence[i] = sequence[i-1] + sequence[i-2];
  }
  
  return sequence;
}

// Example usage
console.log(fibonacci(10)); // [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]
\`\`\`

This function creates an array starting with 0 and 1, then builds the sequence by adding the two previous numbers.`;
  }
  else if (subject.includes('code') || subject.includes('function') || subject.includes('javascript') || subject.includes('programming')) {
    return `I can help with programming! Here are some common topics I can assist with:

**Data Structures:**
- Arrays, Linked Lists, Stacks, Queues
- Trees, Graphs, Hash Tables

**Algorithms:**
- Sorting (bubble, merge, quick sort)
- Searching (binary search, DFS, BFS)
- Dynamic programming

**Languages:**
- JavaScript, Python, Java, C++

Please ask a specific programming question, like:
- \"How to reverse a linked list in Python?\"
- \"Explain binary search algorithm\"
- \"Show me quicksort implementation\"`;
  }
  else if (subject.includes('chemistry') || subject.includes('molecule') || subject.includes('atom')) {
    return `**Basic Chemistry Concepts:**

- **Atoms** are the basic building blocks of matter
- **Molecules** are formed when atoms bond together
- **Chemical reactions** involve breaking and forming bonds
- **The periodic table** organizes elements by atomic number

For specific chemistry problems, I can help explain concepts like balancing equations, molecular structures, and reaction mechanisms.`;
  }
  else if (subject.includes('biology') || subject.includes('cell') || subject.includes('dna')) {
    return `**Biology Fundamentals:**

- **Cells** are the basic units of life
- **DNA** contains genetic information
- **Proteins** carry out most cellular functions
- **Evolution** explains the diversity of life

I can help explain biological processes, genetics, ecology, and more!`;
  }
  else if (subject.includes('hello') || subject.includes('hi') || subject.includes('hey')) {
    return `Hello! I'm your AI study assistant, specializing in STEM subjects. I can help you with:

📚 **Mathematics** - Equations, calculus, statistics
🔬 **Science** - Physics, chemistry, biology
💻 **Programming** - Code examples and explanations
🧮 **Problem Solving** - Step-by-step solutions

What would you like to learn about today?`;
  }
  else {
    return `I'd be happy to help with your question about "${prompt}"! 

As a STEM-focused AI assistant, I can provide explanations, solve problems, and offer guidance on:
- **Mathematics** (algebra, calculus, statistics)
- **Science** (physics, chemistry, biology)
- **Programming** (JavaScript, Python, algorithms)
- **Engineering** concepts and problem-solving

Please feel free to ask more specific questions, and I'll do my best to help!`;
  }
}

module.exports = { getAIResponse };