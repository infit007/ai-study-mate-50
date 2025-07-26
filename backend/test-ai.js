const { getAIResponse } = require('./services/aiService');
const { detectSubject, enhancePrompt, getCustomizedSystemMessage } = require('./services/stemEnhancer');
require('dotenv').config();

// Test cases for different STEM subjects
const testCases = [
  {
    name: 'Math Question',
    prompt: 'Solve the quadratic equation: 2x² + 5x - 3 = 0'
  },
  {
    name: 'Science Question',
    prompt: 'Explain Newton\'s laws of motion'
  },
  {
    name: 'Programming Question',
    prompt: 'Write a function to find the Fibonacci sequence in JavaScript'
  }
];

// Function to test the AI response
async function testAIResponse(prompt) {
  console.log(`\n----- Testing: "${prompt}" -----`);
  
  // Detect subject and enhance prompt
  const subject = detectSubject(prompt);
  console.log(`Detected subject: ${subject}`);
  
  const enhancedPrompt = enhancePrompt(prompt, subject);
  console.log(`Enhanced prompt: "${enhancedPrompt}"`);
  
  // Get customized system message
  const baseSystemMessage = `You are an AI study assistant specializing in STEM subjects.`;
  const customizedSystemMessage = getCustomizedSystemMessage(baseSystemMessage, subject);
  console.log(`Using customized system message for ${subject}`);
  
  // Get AI response
  console.log('Calling OpenAI API...');
  try {
    const response = await getAIResponse(enhancedPrompt, [], customizedSystemMessage);
    console.log('\nAI Response:');
    console.log('------------------------');
    console.log(response);
    console.log('------------------------');
    return true;
  } catch (error) {
    console.error('Error:', error.message);
    return false;
  }
}

// Run all test cases
async function runTests() {
  console.log('Starting AI response tests...');
  console.log('Make sure you have set your OPENAI_API_KEY in the .env file');
  
  let successCount = 0;
  
  for (const testCase of testCases) {
    console.log(`\n========== Testing ${testCase.name} ==========`);
    const success = await testAIResponse(testCase.prompt);
    if (success) successCount++;
  }
  
  console.log(`\n========== Test Results ==========`);
  console.log(`${successCount}/${testCases.length} tests completed successfully`);
  
  if (successCount < testCases.length) {
    console.log('\nSome tests failed. Please check your OpenAI API key and try again.');
  } else {
    console.log('\nAll tests passed! Your AI integration is working correctly.');
  }
}

// Run the tests
runTests().catch(console.error);