// frontend/src/services/dictionaryService.js
import axios from 'axios';

class DictionaryService {
  constructor() {
    // Free Dictionary API
    this.apiUrl = 'https://api.dictionaryapi.dev/api/v2/entries/en';
    // Fallback to WordsAPI if needed (limited free tier)
    this.wordsApiUrl = 'https://wordsapiv1.p.rapidapi.com/words';
  }

  // Get word definition from Free Dictionary API
  async getWordDefinition(word) {
    try {
      const response = await axios.get(`${this.apiUrl}/${word}`);
      if (response.data && response.data.length > 0) {
        const entry = response.data[0];
        const meanings = entry.meanings || [];
        
        let definitions = [];
        let examples = [];
        let synonyms = [];
        let partOfSpeech = '';
        
        meanings.forEach(meaning => {
          const pos = meaning.partOfSpeech;
          const definitionsList = meaning.definitions || [];
          
          definitionsList.forEach(def => {
            if (def.definition) {
              definitions.push({
                definition: def.definition,
                partOfSpeech: pos || '',
                example: def.example || null
              });
            }
            if (def.example) {
              examples.push(def.example);
            }
            if (def.synonyms) {
              synonyms = [...synonyms, ...def.synonyms];
            }
          });
          
          // Get first part of speech
          if (!partOfSpeech && pos) {
            partOfSpeech = pos;
          }
        });
        
        // Get pronunciation
        const phonetics = entry.phonetics || [];
        const audio = phonetics.find(p => p.audio)?.audio || null;
        const text = phonetics.find(p => p.text)?.text || null;
        
        // Get the best definition
        let bestDefinition = null;
        let bestExample = null;
        
        if (definitions.length > 0) {
          bestDefinition = definitions[0].definition;
          if (definitions[0].example) {
            bestExample = definitions[0].example;
          }
        }
        
        // If no example from definitions, try from examples array
        if (!bestExample && examples.length > 0) {
          bestExample = examples[0];
        }
        
        return {
          word: entry.word,
          phonetic: text,
          audio: audio,
          definitions: definitions,
          examples: examples,
          synonyms: [...new Set(synonyms)],
          definition: bestDefinition,
          example: bestExample,
          partOfSpeech: partOfSpeech
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching definition:', error);
      return null;
    }
  }

  // Generate a hint from definition
  generateHintFromDefinition(definitions) {
    if (!definitions || definitions.length === 0) return null;
    
    // Use the first definition
    const firstDef = definitions[0];
    let hint = firstDef.definition;
    
    // Truncate if too long
    if (hint.length > 100) {
      hint = hint.substring(0, 97) + '...';
    }
    
    return hint;
  }

  // Generate example sentence from data
  generateExampleFromData(examples, word, definition) {
    if (examples && examples.length > 0) {
      // Use existing example from API
      let example = examples[0];
      // Replace the word with ___ if it exists in the example
      const wordRegex = new RegExp(word, 'gi');
      if (example.match(wordRegex)) {
        example = example.replace(wordRegex, '___');
      }
      return example;
    }
    
    // Generate a generic example from definition
    if (definition) {
      const shortDef = definition.length > 50 ? definition.substring(0, 50) + '...' : definition;
      return `The word ___ means "${shortDef}".`;
    }
    
    return `The word ___ is used in this context.`;
  }

  // Get all word data
  async getWordData(word) {
    try {
      const data = await this.getWordDefinition(word);
      if (data) {
        const definitions = data.definitions || [];
        const examples = data.examples || [];
        
        // Get the first definition
        const firstDef = definitions.length > 0 ? definitions[0] : null;
        
        // Generate hint
        let hint = null;
        if (firstDef) {
          hint = firstDef.definition;
          if (hint.length > 100) {
            hint = hint.substring(0, 97) + '...';
          }
        } else if (data.definition) {
          hint = data.definition;
          if (hint.length > 100) {
            hint = hint.substring(0, 97) + '...';
          }
        }
        
        // Generate example
        let example = null;
        if (firstDef && firstDef.example) {
          example = firstDef.example;
        } else if (examples.length > 0) {
          example = examples[0];
        } else if (data.example) {
          example = data.example;
        }
        
        // Clean up example - replace word with ___
        if (example) {
          const wordRegex = new RegExp(word, 'gi');
          if (example.match(wordRegex)) {
            example = example.replace(wordRegex, '___');
          }
        }
        
        return {
          word: data.word,
          hint: hint || this.generateHintFromDefinition(definitions),
          example: example || this.generateExampleFromData([], word, hint),
          definition: data.definition || (firstDef ? firstDef.definition : null),
          partOfSpeech: data.partOfSpeech || (firstDef ? firstDef.partOfSpeech : null),
          phonetic: data.phonetic || null,
          audio: data.audio || null,
          definitions: data.definitions || [],
          examples: data.examples || [],
          synonyms: data.synonyms || []
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting word data:', error);
      return null;
    }
  }

  // Get multiple words at once
  async getMultipleWords(words) {
    const results = {};
    for (const word of words) {
      try {
        const data = await this.getWordData(word);
        if (data) {
          results[word] = data;
        }
      } catch (error) {
        console.error(`Error fetching data for "${word}":`, error);
      }
    }
    return results;
  }

  // Check if word exists in dictionary
  async wordExists(word) {
    try {
      const data = await this.getWordDefinition(word);
      return data !== null;
    } catch (error) {
      return false;
    }
  }

  // Get random word
  async getRandomWord() {
    try {
      // This is a simple implementation - you might want to use a specific API for random words
      const response = await axios.get('https://random-word-api.herokuapp.com/word?number=1');
      if (response.data && response.data.length > 0) {
        const word = response.data[0];
        const data = await this.getWordData(word);
        return data;
      }
      return null;
    } catch (error) {
      console.error('Error getting random word:', error);
      return null;
    }
  }

  // Get words by category/topic
  async getWordsByTopic(topic) {
    // This is a simple implementation - you might want to use a specific API
    const topicWords = {
      animals: ['dog', 'cat', 'elephant', 'lion', 'tiger', 'bear', 'monkey', 'zebra'],
      food: ['apple', 'pizza', 'pasta', 'sushi', 'burger', 'chocolate', 'sandwich'],
      school: ['teacher', 'student', 'book', 'desk', 'chair', 'board', 'pen', 'pencil'],
      sports: ['football', 'basketball', 'tennis', 'swimming', 'running', 'golf'],
      music: ['guitar', 'piano', 'drums', 'violin', 'flute', 'trumpet']
    };
    
    const words = topicWords[topic.toLowerCase()] || [];
    const results = [];
    
    for (const word of words) {
      try {
        const data = await this.getWordData(word);
        if (data) {
          results.push(data);
        }
      } catch (error) {
        console.error(`Error fetching data for "${word}":`, error);
      }
    }
    
    return results;
  }
}

// Create and export a singleton instance
const dictionaryService = new DictionaryService();
export default dictionaryService;