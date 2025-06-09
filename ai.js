//the goal here is to make a class that interacts with differnt AI APIs through a common interface
//
//
//
/**
 * @class AIService
 * @description Base class for AI services. It provides a common interface for interacting with different AI APIs.
 * This class is not meant to be instantiated directly, but rather to be extended by specific AI service implementations.
 *
 * @property {string} apiKey - The API key for the AI service.
 * @property {string} apiUrl - The base URL for the AI service API.
 * @property {string} model - The specific AI model to be used (e.g., "gpt-3.5-turbo").
 * @property {number} temperature - Controls randomness in the AI's output. Higher values (e.g., 0.8) make the output more random, while lower values (e.g., 0.2) make it more deterministic.
 * @property {number} maxTokens - The maximum number of tokens (words or pieces of words) that the AI can generate in a single response.
 * @property {number} topP - Controls nucleus sampling. The AI considers only the tokens with the highest probability mass (topP * 100%). For example, 0.1 means only tokens comprising the top 10% probability mass are considered.
 * @property {number} frequencyPenalty - Penalizes new tokens based on their existing frequency in the text so far, decreasing the model's likelihood to repeat the same line verbatim.
 * @property {number} presencePenalty - Penalizes new tokens based on whether they appear in the text so far, increasing the model's likelihood to talk about new topics.
 * @property {string|array} stop - Sequences where the AI will stop generating further tokens.
 * @property {string} instructions - System-level instructions to guide the AI's behavior for the conversation.
 * @property {Array<Object>} history - An array to store the conversation history, with each object having a "role" (e.g., "user", "assistant") and "content".
 */
class AIService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.apiUrl = null; // To be set by subclasses
    this.model = null; // To be set by subclasses or through methods
    this.temperature = null; // Default to null, can be configured
    this.maxTokens = null; // Default to null, can be configured
    this.topP = null; // Default to null, can be configured
    this.frequencyPenalty = null; // Default to null, can be configured
    this.presencePenalty = null; // Default to null, can be configured
    this.stop = null; // Default to null, can be configured
    this.instructions = null; // Default to null, can be set via instruction()
    this.history = []; // Stores the conversation history
  }

  /**
   * @method instruction
   * @description Sets the system-level instructions for the AI.
   * @param {string} instruction - The instruction string.
   */
  instruction(instruction) {
    this.instructions = instruction;
  }

  /**
   * @method chat
   * @description Sends a prompt to the AI and returns the response. This method must be implemented by subclasses.
   * @param {string} prompt - The user's prompt.
   * @throws {Error} If the method is not implemented by a subclass.
   */
  async chat(prompt) {

    throw new Error("chat method not implemented");
  }

  /**
   * @method image
   * @description Sends a prompt to the AI to generate an image and returns the image data or URL. This method must be implemented by subclasses.
   * @param {string} prompt - The prompt to generate the image.
   * @throws {Error} If the method is not implemented by a subclass.
   */
  async image(prompt) {
    throw new Error("image method not implemented");
  }
}

/**
 * @class OpenAIService
 * @extends AIService
 * @description Implements the AIService interface for the OpenAI API.
 *
 * @property {string} apiUrl - Overrides the base class `apiUrl` to point to the OpenAI API endpoint.
 */
class OpenAIService extends AIService {
  constructor(apiKey) {
    super(apiKey);
    this.apiUrl = "https://api.openai.com/v1"; // Specific API URL for OpenAI
  }

  /**
   * @method chat
   * @description Sends a chat prompt to the OpenAI API (specifically the gpt-3.5-turbo model).
   * It constructs the request payload including system instructions, conversation history, and the new user prompt.
   * After receiving a response, it updates the conversation history with both the user's prompt and the assistant's reply.
   * @param {string} prompt - The user's input/question.
   * @returns {Promise<string>} A promise that resolves to the AI's response content.
   * @throws {Error} If the API request fails.
   */
  async chat(prompt) {
    const response = await fetch(`${this.apiUrl}/chat/completions`, { // API endpoint for chat
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`, // API key for authentication
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo", // Specifies the OpenAI model
        messages: [
          { role: "system", content: this.instructions }, // System instructions
          ...this.history, // Previous conversation history
          { role: "user", content: prompt }, // Current user prompt
        ],
      }),
    });

    if (!response.ok) {
      throw new Error("Error fetching chat response"); // Handles API errors
    }
    
    const data = await response.json();
    const mcontent = data.choices[0].message.content; // Extracts the response message
    // Updates history with the current interaction
    this.history.push({ role: "user", content: prompt });
    this.history.push({ role: "assistant", content: mcontent });
    return mcontent;
  }
}

/**
 * @class AI
 * @description A wrapper class that selects and uses an AI service (currently only OpenAI).
 * It acts as a single point of interaction for AI functionalities like chat and image generation.
 *
 * @property {AIService} service - An instance of an AIService subclass (e.g., OpenAIService).
 */
class AI {
  constructor(type, apiKey) {
    if (type === "openai") {
      this.service = new OpenAIService(apiKey); // Instantiates OpenAIService if type is 'openai'
    } else {
      throw new Error("Unsupported AI service type"); // Throws error for unsupported types
    }
  }
  /**
   * @method instruction
   * @description Delegates setting instructions to the underlying AI service.
   * @param {string} instruction - The instruction string.
   */
  instruction(instruction) {
    this.service.instruction(instruction);
  }
  

  /**
   * @method chat
   * @description Delegates the chat functionality to the selected AI service.
   * It can optionally insert an 'article' string into the prompt if a placeholder '{article}' is present.
   * @param {string} prompt - The user's prompt.
   * @param {string} [article=""] - Optional article text to be inserted into the prompt.
   * @returns {Promise<string>} A promise that resolves to the AI's response.
   */
  async chat(prompt, article="") {
    if (article) {
      //this will insert the article into the prompt whereever in the prompt {article} is found.
      // For example, if prompt is "Summarize this: {article}" and article is "Some text...",
      // the final prompt becomes "Summarize this: Some text..."
      prompt = prompt.replace("{article}", article);
    }
    return this.service.chat(prompt); // Delegates to the service's chat method
  }

  /**
   * @method image
   * @description Delegates the image generation functionality to the selected AI service.
   * @param {string} prompt - The prompt to generate the image.
   * @returns {Promise<any>} A promise that resolves to the image data or URL (depending on service implementation).
   */
  async image(prompt) {
    return this.service.image(prompt); // Delegates to the service's image method
  }
}

/**
 * @function setUpAI
 * @description A factory function to create and configure an instance of the AI wrapper class.
 * Currently, it defaults to creating an AI instance with the OpenAI service.
 * @param {string} type - The type of AI service to use (e.g., "openai").
 * @param {string} apiKey - The API key for the selected AI service.
 * @returns {AI} An instance of the AI class, configured with the specified service.
 */
export function setUpAI(type, apiKey) {
  const ai = new AI("openai", apiKey); // Creates a new AI instance (currently hardcoded to 'openai')
  return ai;
}
