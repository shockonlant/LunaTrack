/**
 * Chrome Prompt API Wrapper
 * Provides menstrual flow estimation from sanitary pad images
 */

const PromptAPIWrapper = {
  /**
   * Check if Prompt API is available
   * @returns {Promise<boolean>} true if available
   */
  async checkAvailability() {
    // Check if LanguageModel is available globally
    if (typeof LanguageModel === 'undefined') {
      console.warn('LanguageModel is not available (Prompt API not supported)');
      return false;
    }

    try {
      const availability = await LanguageModel.availability();
      console.log('LanguageModel availability:', availability);

      // Returns: "unavailable", "downloadable", "downloading", or "available"
      // We can use the API if it's not "unavailable"
      return availability !== 'unavailable';
    } catch (error) {
      console.error('LanguageModel availability check failed:', error);
      return false;
    }
  },

  /**
   * Estimate menstrual flow volume from image
   * @param {File} imageFile - Image file of used sanitary pad
   * @returns {Promise<Object>} { estimatedVolume: number, confidence: string, error: string|null }
   */
  async estimateFlowFromImage(imageFile) {
    try {
      // Debug logging
      console.log('Prompt API Debug:');
      console.log('- LanguageModel available:', typeof LanguageModel !== 'undefined');
      console.log('- Image file:', imageFile.name, imageFile.type, imageFile.size);

      // Check API availability
      const isAvailable = await this.checkAvailability();
      if (!isAvailable) {
        console.error('LanguageModel not available');
        throw new Error('LanguageModel not available');
      }

      console.log('- LanguageModel is available');
      // Prepare prompt (from prompt.md)
      const promptText = `Analyze this image of a used sanitary pad and estimate the menstrual flow volume.

IMPORTANT ASSUMPTIONS:
- This image is of a 22.5cm regular sanitary pad (FIXED SIZE)
- Maximum physical capacity is 50ml
- Base your estimate ONLY on coverage area percentage

Instructions:
1. Examine the absorption pattern and stain coverage area
2. Calculate the percentage of the 22.5cm pad surface covered by absorption
3. Estimate the blood volume in milliliters (ml) based on coverage area ONLY
4. DO NOT use color intensity for estimation - focus on coverage percentage
5. Provide ONLY an integer value between 0 and 50

Reference Guidelines (22.5cm Regular Pad - FIXED SIZE):
- Very light flow: 5-10 ml (~30-40% coverage)
- Light flow: 10-15 ml (~40-50% coverage)
- Moderate flow: 15-25 ml (~50-60% coverage)
- Heavy flow: 25-35 ml (~60-80% coverage)
- Very heavy flow: 35-50 ml (~80-100% coverage, near-complete saturation)

Visual Calibration (Actual 22.5cm Pad Data):
- 10ml = ~30-40% coverage
- 15ml = ~40-50% coverage
- 30ml = ~70-80% coverage

Output Format:
Provide ONLY an integer between 0 and 50 (e.g., "25"). No decimals, units, or explanations.`;

      // Create session
      const session = await LanguageModel.create({
        temperature: 0.3, // Lower temperature for consistency
        topK: 40,
        expectedInputs: [
            { type: "image" }
          ],
        expectedOutputs: [
            { type: "text", languages: ["en"] }
          ]
      });

      console.log('- Session created successfully');


      // Send multimodal prompt (correct method)
      await session.append([{
        role: 'user',
        content: [
//          { type: 'text', value: promptText },
//          { type: 'text', value: 'just answer yes' },
          { type: 'image', value: imageFile }
        ]
      }]);
      
      

      console.log('- Prompt appended, sending request...');

      const result = await session.prompt(promptText);
      console.log('- AI raw response:', result);
 
      console.log('- AI response to string:', result);

      // Parse result as INTEGER
      const estimatedVolume = parseInt(result.trim(), 10);

      console.log('- Parsed volume (integer):', estimatedVolume);

      // Validate result (0-50 integer range)
      if (isNaN(estimatedVolume) || estimatedVolume < 0 || estimatedVolume > 50) {
        console.error('Invalid AI response:', {
          raw: result,
          parsed: estimatedVolume,
          isNaN: isNaN(estimatedVolume),
          outOfRange: estimatedVolume < 0 || estimatedVolume > 50
        });
        throw new Error(`Invalid estimation result: "${result}" (must be integer 0-50, got: ${estimatedVolume})`);
      }

      // Confidence assessment based on 0-50ml range
      let confidence = 'medium';
      if (estimatedVolume >= 10 && estimatedVolume <= 40) {
        confidence = 'high';  // Normal range for 22.5cm pad
      } else if (estimatedVolume < 5 || estimatedVolume > 45) {
        confidence = 'low';   // Edge cases (very light or near maximum)
      }

      return {
        estimatedVolume: estimatedVolume, // Already integer, no rounding needed
        confidence: confidence,
        error: null
      };

    } catch (error) {
      console.error('Flow estimation error:', error);
      return {
        estimatedVolume: null,
        confidence: null,
        error: error.message
      };
    }
  }
};

// Export for use in other scripts
if (typeof window !== 'undefined') {
  window.PromptAPIWrapper = PromptAPIWrapper;
}
