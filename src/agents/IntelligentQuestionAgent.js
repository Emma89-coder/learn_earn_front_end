// src/agents/IntelligentQuestionAgent.js

const IntelligentQuestionAgent = {
  // Main analysis function
  analyzeAndFix: (question) => {
    const issues = [];
    let modifiedQuestion = { ...question };
    
    // Run all analysis modules
    issues.push(...IntelligentQuestionAgent.analyzeQuestionText(modifiedQuestion));
    issues.push(...IntelligentQuestionAgent.analyzeOptionsQuality(modifiedQuestion));
    issues.push(...IntelligentQuestionAgent.analyzeGrammarSpelling(modifiedQuestion));
    issues.push(...IntelligentQuestionAgent.analyzeClarity(modifiedQuestion));
    
    // Apply fixes based on severity
    modifiedQuestion = IntelligentQuestionAgent.applyAutoFixes(modifiedQuestion, issues);
    
    // Calculate quality score
    const qualityScore = IntelligentQuestionAgent.calculateQualityScore(modifiedQuestion, issues);
    
    return {
      original: question,
      modified: modifiedQuestion,
      issues: issues,
      qualityScore: qualityScore,
      needsReview: qualityScore < 70,
      autoFixApplied: JSON.stringify(question) !== JSON.stringify(modifiedQuestion)
    };
  },
  
  // Analyze question text quality
  analyzeQuestionText: (question) => {
    const issues = [];
    const text = question.question;
    
    if (!text || text.trim() === '') {
      issues.push({
        type: 'empty_question',
        severity: 'high',
        description: 'Question text is empty',
        suggestion: 'Please enter a question',
        location: 'question_text'
      });
      return issues;
    }
    
    // Check for vague wording
    const vagueWords = ['maybe', 'perhaps', 'could be', 'might', 'possibly'];
    vagueWords.forEach(word => {
      if (text.toLowerCase().includes(word)) {
        issues.push({
          type: 'vague_wording',
          severity: 'medium',
          description: `Contains vague word: "${word}"`,
          suggestion: `Remove "${word}" to make the question more definitive`,
          location: 'question_text'
        });
      }
    });
    
    // Check for missing question mark
    if (!text.endsWith('?') && !text.endsWith('? ')) {
      issues.push({
        type: 'missing_punctuation',
        severity: 'low',
        description: 'Question does not end with a question mark',
        suggestion: 'Add a question mark at the end',
        location: 'question_text',
        autoFix: () => question.question + '?'
      });
    }
    
    // Check for leading/trailing spaces
    if (text !== text.trim()) {
      issues.push({
        type: 'whitespace',
        severity: 'low',
        description: 'Question has extra spaces',
        suggestion: 'Trim leading/trailing spaces',
        location: 'question_text',
        autoFix: () => text.trim()
      });
    }
    
    // Check capitalization
    if (text.length > 0 && text[0] !== text[0].toUpperCase()) {
      issues.push({
        type: 'capitalization',
        severity: 'low',
        description: 'Question should start with a capital letter',
        suggestion: 'Capitalize the first letter',
        location: 'question_text',
        autoFix: () => text.charAt(0).toUpperCase() + text.slice(1)
      });
    }
    
    return issues;
  },
  
  // Analyze options quality
  analyzeOptionsQuality: (question) => {
    const issues = [];
    const options = question.options;
    const correctAnswer = question.correctAnswer;
    
    if (!options || options.length === 0) {
      issues.push({
        type: 'no_options',
        severity: 'high',
        description: 'No options provided',
        suggestion: 'Add answer options',
        location: 'options'
      });
      return issues;
    }
    
    // Check for empty options
    options.forEach((opt, idx) => {
      if (!opt || opt.trim() === '') {
        issues.push({
          type: 'empty_option',
          severity: 'high',
          description: `Option ${String.fromCharCode(65 + idx)} is empty`,
          suggestion: `Add content to option ${String.fromCharCode(65 + idx)}`,
          location: `option_${idx}`,
          optionIndex: idx,
          autoFix: () => {
            const newOptions = [...options];
            newOptions[idx] = `Option ${String.fromCharCode(65 + idx)}`;
            return newOptions;
          }
        });
      }
    });
    
    // Check for duplicate options
    const seen = new Set();
    options.forEach((opt, idx) => {
      if (!opt || opt.trim() === '') return;
      const normalized = opt.toLowerCase().trim();
      if (seen.has(normalized)) {
        issues.push({
          type: 'duplicate_option',
          severity: 'high',
          description: `Option ${String.fromCharCode(65 + idx)} duplicates another option`,
          suggestion: 'Make all options unique',
          location: `option_${idx}`
        });
      }
      seen.add(normalized);
    });
    
    // Check for correct answer validity
    if (!correctAnswer || correctAnswer.trim() === '') {
      issues.push({
        type: 'missing_correct_answer',
        severity: 'high',
        description: 'No correct answer selected',
        suggestion: 'Select the correct answer',
        location: 'correct_answer'
      });
    } else if (!options.includes(correctAnswer)) {
      issues.push({
        type: 'correct_answer_not_in_options',
        severity: 'high',
        description: 'Correct answer does not match any option',
        suggestion: 'Ensure correct answer matches one of the options',
        location: 'correct_answer'
      });
    }
    
    return issues;
  },
  
  // Analyze grammar and spelling
  analyzeGrammarSpelling: (question) => {
    const issues = [];
    const text = question.question;
    
    // Common grammar issues
    if (text.match(/\b(its|it's)\b/i) && text.match(/\b(its|it's)\b/i).length > 0) {
      issues.push({
        type: 'grammar',
        severity: 'low',
        description: 'Possible its/it\'s confusion',
        suggestion: 'Check if you meant "its" (possessive) or "it\'s" (it is)',
        location: 'question_text'
      });
    }
    
    if (text.match(/\b(there|their|they're)\b/i)) {
      issues.push({
        type: 'grammar',
        severity: 'low',
        description: 'Possible there/their/they\'re confusion',
        suggestion: 'Verify correct usage of there/their/they\'re',
        location: 'question_text'
      });
    }
    
    // Check for multiple spaces
    if (text.includes('  ')) {
      issues.push({
        type: 'multiple_spaces',
        severity: 'low',
        description: 'Multiple spaces detected',
        suggestion: 'Replace multiple spaces with single space',
        location: 'question_text',
        autoFix: () => text.replace(/\s+/g, ' ')
      });
    }
    
    return issues;
  },
  
  // Analyze question clarity
  analyzeClarity: (question) => {
    const issues = [];
    const text = question.question;
    
    // Check if question is too short
    if (text.length < 20 && !text.toLowerCase().includes('which')) {
      issues.push({
        type: 'too_vague',
        severity: 'medium',
        description: 'Question is very short and may be too vague',
        suggestion: 'Add more detail or context to the question',
        location: 'question_text'
      });
    }
    
    // Check for negative phrasing
    if (text.toLowerCase().includes('not') || text.toLowerCase().includes('except')) {
      issues.push({
        type: 'negative_phrasing',
        severity: 'low',
        description: 'Question uses negative phrasing which may confuse some learners',
        suggestion: 'Consider rephrasing in positive form if possible',
        location: 'question_text'
      });
    }
    
    return issues;
  },
  
  // Apply automatic fixes
  applyAutoFixes: (question, issues) => {
    let modified = { ...question };
    
    // Apply auto-fixes for low severity issues
    issues.forEach(issue => {
      if (issue.autoFix && issue.severity === 'low') {
        switch (issue.location) {
          case 'question_text':
            if (issue.type === 'missing_punctuation') {
              modified.question = issue.autoFix();
            } else if (issue.type === 'whitespace') {
              modified.question = issue.autoFix();
            } else if (issue.type === 'capitalization') {
              modified.question = issue.autoFix();
            } else if (issue.type === 'multiple_spaces') {
              modified.question = issue.autoFix();
            }
            break;
          case `option_${issue.optionIndex}`:
            if (issue.type === 'empty_option') {
              modified.options = issue.autoFix();
            }
            break;
        }
      }
    });
    
    return modified;
  },
  
  // Calculate quality score (0-100)
  calculateQualityScore: (question, issues) => {
    let score = 100;
    
    // Deduct points based on severity
    issues.forEach(issue => {
      if (issue.severity === 'high') score -= 20;
      else if (issue.severity === 'medium') score -= 10;
      else if (issue.severity === 'low') score -= 5;
    });
    
    // Bonus for good practices
    if (question.question && question.question.length > 30 && question.question.length < 150) score += 5;
    if (question.options && question.options.every(opt => opt && opt.length > 10)) score += 5;
    if (question.correctAnswer && question.options && question.options.includes(question.correctAnswer)) score += 5;
    
    return Math.max(0, Math.min(100, score));
  },
  
  // Batch analyze multiple questions
  analyzeBatch: (questions) => {
    const results = [];
    let totalScore = 0;
    let needsReviewCount = 0;
    let autoFixCount = 0;
    
    questions.forEach((q, idx) => {
      const result = IntelligentQuestionAgent.analyzeAndFix(q);
      results.push(result);
      totalScore += result.qualityScore;
      if (result.needsReview) needsReviewCount++;
      if (result.autoFixApplied) autoFixCount++;
    });
    
    return {
      questions: results,
      summary: {
        averageScore: Math.round(totalScore / questions.length),
        needsReviewCount,
        autoFixCount,
        totalIssues: results.reduce((sum, r) => sum + r.issues.length, 0)
      }
    };
  }
};

export default IntelligentQuestionAgent;