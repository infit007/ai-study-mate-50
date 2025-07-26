/**
 * Keywords for detecting different STEM subjects
 */
const mathKeywords = ['equation', 'solve', 'calculate', 'derivative', 'integral', 'formula', 'math', 'algebra', 'calculus', 'geometry', 'theorem'];
const scienceKeywords = ['physics', 'chemistry', 'biology', 'experiment', 'theory', 'hypothesis', 'science', 'molecule', 'atom', 'cell', 'force'];
const programmingKeywords = ['code', 'function', 'algorithm', 'program', 'debug', 'compile', 'programming', 'javascript', 'python', 'java', 'class'];

/**
 * Detect the subject based on keywords in the prompt
 * @param {string} prompt - The user's question
 * @returns {string} - The detected subject ('math', 'science', 'programming', or 'general')
 */
function detectSubject(prompt) {
  const lowerPrompt = prompt.toLowerCase();
  
  if (mathKeywords.some(keyword => lowerPrompt.includes(keyword))) {
    return 'math';
  } else if (scienceKeywords.some(keyword => lowerPrompt.includes(keyword))) {
    return 'science';
  } else if (programmingKeywords.some(keyword => lowerPrompt.includes(keyword))) {
    return 'programming';
  }
  
  return 'general';
}

/**
 * Enhance the prompt based on the detected subject
 * @param {string} prompt - The user's question
 * @param {string} subject - The detected subject
 * @returns {string} - The enhanced prompt
 */
function enhancePrompt(prompt, subject) {
  switch (subject) {
    case 'math':
      return `Math Problem: ${prompt}\nPlease provide a step-by-step solution with clear explanations.`;
    case 'science':
      return `Science Question: ${prompt}\nPlease explain the relevant scientific principles and include any applicable formulas.`;
    case 'programming':
      return `Programming Question: ${prompt}\nPlease provide explanations and code examples where appropriate.`;
    default:
      return prompt;
  }
}

/**
 * Get a customized system message based on the subject
 * @param {string} baseMessage - The base system message
 * @param {string} subject - The detected subject
 * @returns {string} - The customized system message
 */
function getCustomizedSystemMessage(baseMessage, subject) {
  let customMessage = baseMessage;
  
  switch (subject) {
    case 'math':
      customMessage += '\n- For math problems, always show your work step-by-step';
      customMessage += '\n- Use LaTeX notation for mathematical expressions when appropriate';
      customMessage += '\n- Explain each step clearly for educational purposes';
      break;
    case 'science':
      customMessage += '\n- Include relevant scientific principles and theories';
      customMessage += '\n- Explain concepts using analogies when helpful';
      customMessage += '\n- Include formulas and equations when relevant';
      break;
    case 'programming':
      customMessage += '\n- For code examples, include comments explaining key parts';
      customMessage += '\n- Provide explanations of algorithms and data structures';
      customMessage += '\n- Consider efficiency and best practices in your solutions';
      break;
  }
  
  return customMessage;
}

module.exports = { 
  detectSubject, 
  enhancePrompt,
  getCustomizedSystemMessage
};