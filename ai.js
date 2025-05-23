//the goal here is to make a class that interacts with differnt AI APIs through a common interface
//
//
//
class AIService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.apiUrl = null;
    this.model = null;
    this.temperature = null;
    this.maxTokens = null;
    this.topP = null;
    this.frequencyPenalty = null;
    this.presencePenalty = null;
    this.stop = null;
    this.instructions = null;
    this.history = [];
  }

  instruction(instruction) {
    this.instructions = instruction;
  }


  async chat(prompt) {

    throw new Error("chat method not implemented");
  }

  async image(prompt) {
    throw new Error("image method not implemented");
  }
}

class OpenAIService extends AIService {
  constructor(apiKey) {
    super(apiKey);
    this.apiUrl = "https://api.openai.com/v1";
  }

  async chat(prompt) {
    const response = await fetch(`${this.apiUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: this.instructions },
          ...this.history,
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error("Error fetching chat response");
    }
    
    const data = await response.json();
    const mcontent = data.choices[0].message.content;
    this.history.push({ role: "user", content: prompt });
    this.history.push({ role: "assistant", content: mcontent });
    return mcontent;
  }
}

class AI {
  constructor(type, apiKey) {
    if (type === "openai") {
      this.service = new OpenAIService(apiKey);
    } else {
      throw new Error("Unsupported AI service type");
    }
  }
  instruction(instruction) {
    this.service.instruction(instruction);
  }
  


  async chat(prompt, article="") {
    if (article) {
      //this will insert the article into the prompt whereever in the prompt {article} is found.
      prompt = prompt.replace("{article}", article);
    }
    return this.service.chat(prompt);
  }
  async image(prompt) {
    return this.service.image(prompt);
  }
}

export function setUpAI(type, apiKey) {
  const ai = new AI("openai", apiKey);
  return ai;
}
