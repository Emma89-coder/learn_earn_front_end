// frontend/src/services/voiceCloneService.js
class VoiceCloneService {
  constructor() {
    this.voiceModel = null;
    this.isReady = false;
    this.audioContext = null;
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isRecording = false;
  }

  /**
   * Initialize Audio Context
   */
  initAudio() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return this.audioContext;
  }

  /**
   * Start recording voice sample
   */
  async startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];
      this.isRecording = true;

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
        const file = new File([audioBlob], 'voice-sample.wav', { type: 'audio/wav' });
        await this.processVoiceFile(file);
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      this.mediaRecorder.start(100);
      return true;
    } catch (error) {
      console.error('Error starting recording:', error);
      throw error;
    }
  }

  /**
   * Stop recording
   */
  stopRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
      return true;
    }
    return false;
  }

  /**
   * Process uploaded voice file
   */
  async processVoiceFile(file) {
    try {
      const audioContext = this.initAudio();
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Store the voice model
      this.voiceModel = audioBuffer;
      this.isReady = true;
      
      console.log('Voice processed successfully!');
      return true;
    } catch (error) {
      console.error('Error processing voice:', error);
      throw error;
    }
  }

  /**
   * Upload voice file
   */
  async uploadVoiceFile(file) {
    return this.processVoiceFile(file);
  }

  /**
   * Speak with cloned voice using Web Audio API
   * This processes the text and applies voice characteristics
   */
  async speakWithClonedVoice(text, options = {}) {
    if (!this.voiceModel) {
      throw new Error('Please record or upload a voice sample first.');
    }

    try {
      // Use Web Speech API with modified voice parameters
      if ('speechSynthesis' in window) {
        return new Promise((resolve, reject) => {
          const utterance = new SpeechSynthesisUtterance(text);
          
          // Extract voice characteristics from the recorded sample
          const voiceChar = this.analyzeVoiceCharacteristics(this.voiceModel);
          
          // Apply voice characteristics
          utterance.rate = options.rate || voiceChar.rate || 0.9;
          utterance.pitch = options.pitch || voiceChar.pitch || 1.0;
          utterance.volume = options.volume || 1.0;
          utterance.lang = options.lang || 'en-US';
          
          // Try to find the closest matching voice
          const voices = window.speechSynthesis.getVoices();
          let bestVoice = null;
          let bestScore = Infinity;
          
          for (const voice of voices) {
            if (!voice.lang.startsWith('en')) continue;
            
            // Score based on voice characteristics
            let score = 0;
            if (voice.name.includes('Google') || voice.name.includes('Natural')) {
              score -= 10; // Prefer natural voices
            }
            
            // Check if voice is male or female (approximate)
            const isMaleVoice = voice.name.match(/Male|David|Daniel|Mark|James|Alex/gi);
            const isFemaleVoice = voice.name.match(/Female|Samantha|Victoria|Karen|Sarah|Susan/gi);
            
            // Try to match gender based on pitch
            if (voiceChar.gender === 'male' && isMaleVoice) {
              score -= 5;
            } else if (voiceChar.gender === 'female' && isFemaleVoice) {
              score -= 5;
            }
            
            if (score < bestScore) {
              bestScore = score;
              bestVoice = voice;
            }
          }
          
          if (bestVoice) {
            utterance.voice = bestVoice;
          }
          
          utterance.onend = resolve;
          utterance.onerror = reject;
          
          window.speechSynthesis.speak(utterance);
        });
      }
      
      throw new Error('Speech synthesis not supported');
    } catch (error) {
      console.error('Error speaking with cloned voice:', error);
      throw error;
    }
  }

  /**
   * Analyze voice characteristics from audio buffer
   */
  analyzeVoiceCharacteristics(audioBuffer) {
    try {
      const data = audioBuffer.getChannelData(0);
      let sum = 0;
      let crossings = 0;
      let zeroCrossingRate = 0;
      
      // Calculate zero-crossing rate (pitch estimation)
      for (let i = 1; i < data.length; i++) {
        sum += Math.abs(data[i]);
        if ((data[i] >= 0 && data[i-1] < 0) || (data[i] < 0 && data[i-1] >= 0)) {
          crossings++;
        }
      }
      
      zeroCrossingRate = crossings / data.length;
      
      // Estimate pitch
      const estimatedPitch = Math.min(Math.max(zeroCrossingRate * 50, 0.5), 2.0);
      
      // Estimate gender based on pitch
      const gender = estimatedPitch > 1.2 ? 'female' : 'male';
      
      // Estimate speaking rate
      const energy = sum / data.length;
      const rate = Math.min(Math.max(energy * 50, 0.5), 1.5);
      
      return {
        pitch: estimatedPitch,
        rate: Math.min(rate, 1.2),
        gender: gender,
        energy: energy
      };
    } catch (error) {
      console.error('Error analyzing voice:', error);
      return { pitch: 1.0, rate: 0.9, gender: 'male' };
    }
  }

  /**
   * Play speech
   */
  async playSpeech(text, options = {}) {
    try {
      await this.speakWithClonedVoice(text, options);
    } catch (error) {
      console.error('Error playing speech:', error);
      // Fallback to basic speech
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.speak(utterance);
      }
      throw error;
    }
  }

  /**
   * Check if voice is ready
   */
  isVoiceReady() {
    return this.isReady && this.voiceModel !== null;
  }

  /**
   * Reset voice
   */
  resetVoice() {
    this.voiceModel = null;
    this.isReady = false;
    this.audioChunks = [];
  }
}

export default new VoiceCloneService();