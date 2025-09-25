import { User } from '@/types'
import { PersonaDetector } from './PersonaDetector'
import { IntentClassifier } from './IntentClassifier'
import { SemanticSearch } from './SemanticSearch'
import { DidYouKnowService } from './DidYouKnowService'
import { ResponseGenerator } from './ResponseGenerator'
export interface ChatResponse {
  message: string
  persona: string
  intent: string
  confidence: number
  didYouKnow?: string
  suggestedActions?: string[]
}
export class ChatService {
  private personaDetector: PersonaDetector
  private intentClassifier: IntentClassifier
  private semanticSearch: SemanticSearch
  private didYouKnowService: DidYouKnowService
  private responseGenerator: ResponseGenerator
  private conversationHistory: Array<{ user: string; bot: string; timestamp: Date }> = []
  constructor() {
    this.personaDetector = new PersonaDetector()
    this.intentClassifier = new IntentClassifier()
    this.semanticSearch = new SemanticSearch()
    this.didYouKnowService = new DidYouKnowService()
    this.responseGenerator = new ResponseGenerator()
  }
  async processMessage(message: string, user: User | null): Promise<ChatResponse> {
    try {
      // Step 1: Detect user persona
      const persona = this.personaDetector.detectPersona(message, user)
      // Step 2: Classify intent
      const intentResult = this.intentClassifier.classifyIntent(message, persona)
      // Step 3: Perform semantic search for relevant information
      const searchResults = await this.semanticSearch.search(message, intentResult.intent)
      // Step 4: Generate response
      const response = this.responseGenerator.generateResponse({
        message,
        persona,
        intent: intentResult.intent,
        confidence: intentResult.confidence,
        searchResults,
        user,
        conversationHistory: this.conversationHistory,
      })
      // Step 5: Get "Did You Know" fact (30% chance)
      const didYouKnow =
        Math.random() < 0.3
          ? this.didYouKnowService.getRandomFact(intentResult.intent, persona)
          : undefined
      // Store conversation history
      this.conversationHistory.push({
        user: message,
        bot: response,
        timestamp: new Date(),
      })
      // Keep only last 10 exchanges
      if (this.conversationHistory.length > 10) {
        this.conversationHistory = this.conversationHistory.slice(-10)
      }
      return {
        message: response,
        persona,
        intent: intentResult.intent,
        confidence: intentResult.confidence,
        didYouKnow,
      }
    } catch (error) {
      throw error
    }
  }
  getConversationHistory() {
    return this.conversationHistory
  }
  clearHistory() {
    this.conversationHistory = []
  }
}
